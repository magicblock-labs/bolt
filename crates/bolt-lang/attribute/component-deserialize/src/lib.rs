use bolt_utils::add_bolt_metadata;
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Attribute, DeriveInput};

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
pub fn component_deserialize(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut input = parse_macro_input!(item as DeriveInput);

    // Add the AnchorDeserialize and AnchorSerialize derives to the struct
    let additional_derives: Attribute = syn::parse_quote! { #[derive(anchor_lang::AnchorDeserialize, anchor_lang::AnchorSerialize)] };
    input.attrs.push(additional_derives);

    add_bolt_metadata(&mut input);

    let name = &input.ident;
    let expanded = quote! {
        #input

        #[automatically_derived]
        impl bolt_lang::ComponentDeserialize for #name{
            fn from_account_info(account: &anchor_lang::prelude::AccountInfo) -> anchor_lang::Result<#name> {
                #name::try_deserialize_unchecked(&mut &*(*account.data.borrow()).as_ref()).map_err(Into::into)
            }
        }

        #[automatically_derived]
        impl anchor_lang::AccountDeserialize for #name {
            fn try_deserialize(buf: &mut &[u8]) -> anchor_lang::Result<Self> {
                Self::try_deserialize_unchecked(buf)
            }

            fn try_deserialize_unchecked(buf: &mut &[u8]) -> anchor_lang::Result<Self> {
                let mut data: &[u8] = &buf[8..];
                anchor_lang::AnchorDeserialize::deserialize(&mut data)
                    .map_err(|_| anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into())
            }
        }
    };

    expanded.into()
}
