use proc_macro::TokenStream;

/// #[bundle]
///
/// Combines one `#[component]` and one `#[system]` into a single Anchor `#[program]` module.
/// Reuses the existing macros to generate code, strips their internal `#[program]` wrappers,
/// and exposes wrapper instruction functions under a unified program.
#[proc_macro_attribute]
pub fn bundle(attr: TokenStream, item: TokenStream) -> TokenStream {
    bolt_attribute::bundle::process(attr, item)
}
