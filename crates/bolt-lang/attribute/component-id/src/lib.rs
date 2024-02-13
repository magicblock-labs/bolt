use proc_macro::TokenStream;
use quote::quote;
use syn::{DeriveInput, parse_macro_input};

#[proc_macro_attribute]
pub fn component_id(_attr: TokenStream, item: TokenStream) -> TokenStream {
    println!("run test");
    let input = parse_macro_input!(item as DeriveInput);
    let expanded = quote! {
        #input
    };
    TokenStream::from(expanded)
}
