use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, parse_quote, Attribute, DeriveInput};

#[proc_macro_attribute]
pub fn arguments(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut input = parse_macro_input!(item as DeriveInput);
    let new_attr: Attribute = parse_quote! { #[derive(bolt_lang::serde::Deserialize)] };
    input.attrs.push(new_attr);
    let expanded = quote! {
        #input
    };
    TokenStream::from(expanded)
}
