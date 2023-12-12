use proc_macro::TokenStream;
use quote::quote;
use syn::spanned::Spanned;
use syn::{parse_macro_input, parse_quote, Attribute, DeriveInput, Lit, Meta, NestedMeta};

/// This BoltAccount attribute is used to automatically generate the seed and size functions
///
/// The component_id define the seed used to generate the PDA which stores the component data.
/// The macro also adds the InitSpace and Default derives to the struct.
///
/// #[account]
/// #[bolt_account(component_id = "bolt-position")]
/// pub struct Position {
///     pub x: i64,
///     pub y: i64,
///     pub z: i64,
/// }
/// ```
#[proc_macro_attribute]
pub fn bolt_account(attr: TokenStream, item: TokenStream) -> TokenStream {
    let attr = parse_macro_input!(attr as Meta);
    let mut input = parse_macro_input!(item as DeriveInput);

    let component_id_value = match attr {
        Meta::NameValue(meta_name_value) if meta_name_value.path.is_ident("component_id") => {
            if let Lit::Str(lit) = meta_name_value.lit {
                Some(lit.value())
            } else {
                None
            }
        }
        Meta::List(meta) => meta.nested.into_iter().find_map(|nested_meta| {
            if let NestedMeta::Meta(Meta::NameValue(meta_name_value)) = nested_meta {
                if meta_name_value.path.is_ident("component_id") {
                    if let Lit::Str(lit) = meta_name_value.lit {
                        Some(lit.value())
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else {
                None
            }
        }),
        _ => {
            let error = syn::Error::new(attr.span(), "Missing required attribute `component_id`");
            return error.to_compile_error().into();
        }
    };

    let component_id_value = match component_id_value {
        Some(value) => value,
        None => {
            let error = syn::Error::new(input.span(), "The `component_id` attribute is required");
            return error.to_compile_error().into();
        }
    };

    let additional_derives: Attribute = parse_quote! { #[derive(InitSpace, Default)] };
    input.attrs.push(additional_derives);

    let name = &input.ident;
    let expanded = quote! {
        #input

        #[automatically_derived]
        impl ComponentTraits for #name {
            fn seed() -> &'static [u8] {
                #component_id_value.as_bytes()
            }

            fn size() -> usize {
                8 + <#name>::INIT_SPACE
            }
        }
    };
    expanded.into()
}
