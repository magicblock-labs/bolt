use bolt_utils::metadata::add_bolt_metadata;
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Attribute, DeriveInput};

// For computing Anchor discriminator at compile time
use sha2::{Digest, Sha256};

/// This macro is used to defined a struct as a BOLT component and automatically implements the
/// `ComponentDeserialize` and `AccountDeserialize` traits for the struct.
///
/// #[component]
/// pub struct Position {
///     pub x: i64,
///     pub y: i64,
///     pub z: i64,
/// }
/// ```
#[proc_macro_attribute]
pub fn component_deserialize(attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut input = parse_macro_input!(item as DeriveInput);

    // Add the AnchorDeserialize and AnchorSerialize derives to the struct
    let additional_derives: Attribute = syn::parse_quote! { #[derive(bolt_lang::InitSpace, bolt_lang::AnchorDeserialize, bolt_lang::AnchorSerialize, Clone, Copy)] };
    input.attrs.push(additional_derives);

    let name = &input.ident.clone();
    // Assume that the component_id is the same as the struct name, minus the "Component" prefix
    let name_str = name.to_string();
    let component_id = name_str.strip_prefix("Component").unwrap_or("");
    let mut owner_definition = quote! {};
    if !component_id.is_empty() {
        add_bolt_metadata(&mut input);
        owner_definition = quote! {
            use std::str::FromStr;
            #[automatically_derived]
            impl Owner for #name {
                fn owner() -> Pubkey {
                    Pubkey::from_str(#component_id).unwrap()
                }
            }
        };
    }
    // Determine which struct name to use for Anchor discriminator calculation.
    // If the attribute is written as #[component_deserialize(Position)], then use "Position".
    // Otherwise, fall back to the actual type name (which may be Component<Pubkey> style).
    let discriminator_type_name: String = if !attr.is_empty() {
        // Parse the attribute as a path and use its last segment as the name
        if let Ok(path) = syn::parse::<syn::Path>(attr.clone()) {
            path.segments
                .last()
                .map(|seg| seg.ident.to_string())
                .unwrap_or_else(|| name.to_string())
        } else {
            name.to_string()
        }
    } else {
        name.to_string()
    };

    // Compute Anchor discriminator: first 8 bytes of sha256(b"account:" + type_name)
    let mut hasher = Sha256::new();
    hasher.update(b"account:");
    hasher.update(discriminator_type_name.as_bytes());
    let digest = hasher.finalize();
    let discriminator_bytes: [u8; 8] = {
        let mut arr = [0u8; 8];
        arr.copy_from_slice(&digest[..8]);
        arr
    };
    let discriminator_tokens = discriminator_bytes
        .iter()
        .map(|b| quote! { #b })
        .collect::<Vec<_>>();

    let expanded = quote! {
        #input

        #[automatically_derived]
        impl bolt_lang::ComponentDeserialize for #name{
            fn from_account_info(account: &bolt_lang::AccountInfo) -> bolt_lang::Result<#name> {
                #name::try_deserialize_unchecked(&mut &*(*account.data.borrow()).as_ref()).map_err(Into::into)
            }
        }

        #[automatically_derived]
        impl bolt_lang::AccountDeserialize for #name {
            fn try_deserialize(buf: &mut &[u8]) -> bolt_lang::Result<Self> {
                Self::try_deserialize_unchecked(buf)
            }

            fn try_deserialize_unchecked(buf: &mut &[u8]) -> bolt_lang::Result<Self> {
                let mut data: &[u8] = &buf[8..];
                bolt_lang::AnchorDeserialize::deserialize(&mut data)
                    .map_err(|_| bolt_lang::AccountDidNotDeserializeErrorCode.into())
            }
        }

        #[automatically_derived]
        impl bolt_lang::AccountSerialize for #name {
            fn try_serialize<W: std::io::Write>(&self, writer: &mut W) -> Result<()> {
                if writer.write_all(Self::DISCRIMINATOR).is_err() {
                    return Err(bolt_lang::AccountDidNotSerializeErrorCode.into());
                }
                if bolt_lang::AnchorSerialize::serialize(self, writer).is_err() {
                    return Err(bolt_lang::AccountDidNotSerializeErrorCode.into());
                }
                Ok(())
            }
        }

        #[automatically_derived]
        impl anchor_lang::Discriminator for #name {
            const DISCRIMINATOR: &'static [u8] = &[
                #(#discriminator_tokens),*
            ];
        }

        #owner_definition
    };

    expanded.into()
}
