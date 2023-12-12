extern crate proc_macro;

use proc_macro::TokenStream;
use quote::quote;
use syn::parse::{Parse, ParseStream, Result};
use syn::{parse_macro_input, Ident, LitInt, Token};

/// This macro attribute is a helper used for defining BOLT systems execute proxy instructions.
///
/// ```
#[proc_macro_attribute]
pub fn system_template(attr: TokenStream, item: TokenStream) -> TokenStream {
    let attr_p = parse_macro_input!(attr as SystemTemplateInput);

    let max_components = attr_p.max_components;

    // Parse the original module content
    let mut input: syn::ItemMod = syn::parse(item).expect("Failed to parse input module");

    // Generate a function for execute instruction
    let funcs = (2..=max_components).map(|i| {
        let func_name = syn::Ident::new(&format!("execute_{}", i), proc_macro2::Span::call_site());
        let data_struct = syn::Ident::new("SetData", proc_macro2::Span::call_site());
        let return_values = vec![quote!(Vec::<u8>::new()); i];
        let return_types = vec![quote!(Vec<u8>); i];
        quote! {
            pub fn #func_name(_ctx: Context<#data_struct>, _args: Vec<u8>) -> Result<(#(#return_types),*)> {
                Ok((#(#return_values),*))
            }
        }
    });

    // Append each generated function to the module's items
    if let Some((brace, mut content)) = input.content.take() {
        for func in funcs {
            let parsed_func: syn::Item =
                syn::parse2(func).expect("Failed to parse generated function");
            content.push(parsed_func);
        }

        input.content = Some((brace, content));
    }

    let data_def = (2..=max_components).map(|i| {
        let data_struct = syn::Ident::new(&format!("SetData{}", i), proc_macro2::Span::call_site());
        let fields = (1..=i).map(|n| {
            let field_name =
                syn::Ident::new(&format!("component{}", n), proc_macro2::Span::call_site());
            quote! {
                #[account()]
                /// CHECK: unchecked account
                pub #field_name: anchor_lang::prelude::UncheckedAccount<'info>,
            }
        });
        let struct_def = quote! {
        #[derive(Accounts, BorshDeserialize, BorshSerialize, Clone)]
            pub struct #data_struct<'info> {
                #(#fields)*
            }
        };
        quote! {
            #struct_def
        }
    });

    // Return the modified module
    let output = quote! {
        #input
        #(#data_def)*
    };
    output.into()
}

// Define a struct to parse macro input
struct SystemTemplateInput {
    max_components: usize,
}

// Implement parsing for the macro input
impl Parse for SystemTemplateInput {
    fn parse(input: ParseStream) -> Result<Self> {
        let _ = input.parse::<Ident>()?; // Parse the key (e.g., "max_components")
        let _ = input.parse::<Token![=]>()?; // Parse the '='
        let max_components: LitInt = input.parse()?; // Parse the value
        let max_value = max_components.base10_parse()?;
        Ok(SystemTemplateInput {
            max_components: max_value,
        })
    }
}
