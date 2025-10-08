use heck::ToSnakeCase;
use proc_macro::TokenStream;
use quote::ToTokens;
use syn::{parse_macro_input, parse_quote, ItemMod};

use crate::common::generate_program;
use crate::component;
use crate::system;

pub fn process(attr: TokenStream, item: TokenStream) -> TokenStream {
    let bundle_mod = parse_macro_input!(item as ItemMod);
    let mut program = generate_program(&bundle_mod.ident.to_string());
    if attr.to_string().contains("delegate") {
        program
            .attrs
            .insert(0, syn::parse_quote! { #[bolt_lang::delegate] });
    }
    component::generate_update(&mut program);
    if let Some((_, items)) = bundle_mod.content {
        for item in items {
            match item {
                syn::Item::Struct(item) => {
                    let attributes = component::Attributes::from(item.attrs.clone());
                    if attributes.is_component {
                        let data = syn::Data::Struct(syn::DataStruct {
                            struct_token: Default::default(),
                            fields: item.fields,
                            semi_token: Default::default(),
                        });
                        let mut type_ = syn::DeriveInput {
                            attrs: item.attrs,
                            vis: item.vis,
                            ident: item.ident,
                            generics: item.generics,
                            data,
                        };
                        component::generate_implementation(&mut program, &attributes, &type_);
                        component::generate_instructions(
                            &mut program,
                            &attributes,
                            &type_.ident,
                            Some(&type_.ident.to_string().to_snake_case()),
                        );
                        component::remove_component_attributes(&mut type_.attrs);
                        component::enrich_type(&mut type_);
                        let (_, items) = program.content.as_mut().unwrap();
                        items.push(parse_quote!(#type_));
                    } else {
                        // Not a bolt component; include as-is
                        let (_, program_items) = program.content.as_mut().unwrap();
                        let original: syn::Item = syn::Item::Struct(item);
                        program_items.push(parse_quote!(#original));
                    }
                }
                syn::Item::Mod(mut mod_item) => {
                    if mod_item.attrs.iter().any(|a| a.path.is_ident("system")) {
                        let suffix = mod_item.ident.to_string().to_snake_case();
                        let inlined_items =
                            system::transform_module_for_bundle(&mut mod_item, Some(&suffix));
                        let (_, program_items) = program.content.as_mut().unwrap();
                        program_items.extend(inlined_items.into_iter());
                    } else {
                        // Regular module; include as-is
                        let (_, program_items) = program.content.as_mut().unwrap();
                        let original: syn::Item = syn::Item::Mod(mod_item);
                        program_items.push(parse_quote!(#original));
                    }
                }
                other => {
                    // Any other non-bolt item; include as-is
                    let (_, program_items) = program.content.as_mut().unwrap();
                    program_items.push(parse_quote!(#other));
                }
            }
        }
    }

    program.to_token_stream().into()
}
