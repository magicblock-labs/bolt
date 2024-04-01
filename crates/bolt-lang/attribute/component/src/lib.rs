use proc_macro::TokenStream;

use quote::quote;
use syn::{parse_macro_input, parse_quote, Attribute, DeriveInput, Lit, Meta, NestedMeta};

use bolt_utils::add_bolt_metadata;

/// This Component attribute is used to automatically generate the seed and size functions
///
/// The component_id can be used to define the seed used to generate the PDA which stores the component data.
/// The macro also adds the InitSpace and Default derives to the struct.
///
/// #[component_deserialize]
/// #[derive(Clone)]
/// pub struct Position {
///     pub x: i64,
///     pub y: i64,
///     pub z: i64,
/// }
/// ```
#[proc_macro_attribute]
pub fn component(attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut input = parse_macro_input!(item as DeriveInput);
    let mut component_id_value = None;

    if !attr.is_empty() {
        let attr_meta = parse_macro_input!(attr as Meta);

        component_id_value = match attr_meta {
            Meta::Path(_) => None,
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
            _ => None,
        };
    }

    let component_id_value = component_id_value.unwrap_or_else(|| "".to_string());

    let additional_macro: Attribute = parse_quote! { #[account] };
    let additional_derives: Attribute = parse_quote! { #[derive(InitSpace)] };
    input.attrs.push(additional_derives);

    let new_fn = define_new_fn(&input);

    add_bolt_metadata(&mut input);

    let name = &input.ident;
    let component_name = syn::Ident::new(&name.to_string().to_lowercase(), input.ident.span());

    let anchor_program = quote! {
        #[bolt_program(#name)]
        pub mod #component_name {
            use super::*;
        }
    };

    let expanded = quote! {
        #anchor_program

        #additional_macro
        #input

        #new_fn

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

/// Create a fn `new` to initialize the struct without bolt_metadata field
fn define_new_fn(input: &DeriveInput) -> proc_macro2::TokenStream {
    let struct_name = &input.ident;
    let init_struct_name = syn::Ident::new(&format!("{}Init", struct_name), struct_name.span());

    if let syn::Data::Struct(ref data) = input.data {
        if let syn::Fields::Named(ref fields) = data.fields {
            // Generate fields for the init struct
            let init_struct_fields = fields.named.iter().map(|f| {
                let name = &f.ident;
                let ty = &f.ty;
                quote! { pub #name: #ty }
            });

            // Generate struct initialization code using the init struct
            let struct_init_fields = fields.named.iter().map(|f| {
                let name = &f.ident;
                quote! { #name: init_struct.#name }
            });

            // Generate the new function and the init struct
            let gen = quote! {
                // Define a new struct to hold initialization parameters
                pub struct #init_struct_name {
                    #(#init_struct_fields),*
                }

                impl #struct_name {
                    pub fn new(init_struct: #init_struct_name) -> Self {
                        Self {
                            #(#struct_init_fields,)*
                            bolt_metadata: BoltMetadata::default(),
                        }
                    }
                }
            };
            return gen;
        }
    }
    quote! {}
}
