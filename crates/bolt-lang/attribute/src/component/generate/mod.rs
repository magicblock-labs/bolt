mod program;

use quote::quote;
use syn::{parse_quote, Attribute};
use syn::{DeriveInput, ItemMod};

pub use program::*;

pub fn enrich_type(type_: &mut DeriveInput) {
    let account_macro: Attribute = parse_quote! { #[account] };
    let init_space_derive: Attribute = parse_quote! { #[derive(InitSpace)] };
    type_.attrs.push(init_space_derive);
    type_.attrs.push(account_macro);
    bolt_utils::add_bolt_metadata(type_);
}

pub fn generate_implementation(
    program: &mut ItemMod,
    attributes: &super::Attributes,
    input: &DeriveInput,
) {
    generate_new_fn(program, input);
    generate_component_traits(program, attributes, input);
}

fn generate_component_traits(
    program: &mut ItemMod,
    attributes: &super::Attributes,
    input: &DeriveInput,
) {
    let name = &input.ident;
    let component_id_value = &attributes.component_id;
    let implementation = quote! {
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
    let (_, items) = program.content.as_mut().unwrap();
    items.push(parse_quote!(#implementation));
}

/// Create a fn `new` to initialize the struct without bolt_metadata field
fn generate_new_fn(program: &mut ItemMod, input: &DeriveInput) {
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

            let structure = quote! {
                // Define a new struct to hold initialization parameters
                pub struct #init_struct_name {
                    #(#init_struct_fields),*
                }
            };
            let implementation = quote! {
                impl #struct_name {
                    pub fn new(init_struct: #init_struct_name) -> Self {
                        Self {
                            #(#struct_init_fields,)*
                            bolt_metadata: BoltMetadata::default(),
                        }
                    }
                }
            };
            let (_, items) = program.content.as_mut().unwrap();
            items.push(parse_quote!(#structure));
            items.push(parse_quote!(#implementation));
        }
    }
}
