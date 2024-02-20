use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

/// Macro to specify the on-chain ID of a component.
///
/// ```
#[proc_macro_attribute]
pub fn component_id(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as DeriveInput);
    let expanded = quote! {
        #input
    };
    TokenStream::from(expanded)
}
