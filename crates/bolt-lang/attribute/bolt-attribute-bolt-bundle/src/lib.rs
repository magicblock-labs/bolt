use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemMod};

/// #[bundle]
///
/// Combines one `#[component]` and one `#[system]` into a single Anchor `#[program]` module.
/// Reuses the existing macros to generate code, strips their internal `#[program]` wrappers,
/// and exposes wrapper instruction functions under a unified program.
#[proc_macro_attribute]
pub fn bundle(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let bundle_mod = parse_macro_input!(item as ItemMod);
    let bundle_mod_ident = &bundle_mod.ident;

    quote! {
        #[program]
        pub mod #bundle_mod_ident {
            use super::*;
        }
    }.into()
}