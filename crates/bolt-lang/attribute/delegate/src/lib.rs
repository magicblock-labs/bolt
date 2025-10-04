use proc_macro::TokenStream;

/// This macro attribute is used to inject instructions and struct needed to delegate bolt components.
///
/// Components can be delegated in order to be updated in an Ephemeral Rollup validator.
///
/// # Example
/// ```ignore
///
/// #[delegate]
/// #[anchor_lang::program]
/// mod program {
/// }
/// ```
#[proc_macro_attribute]
pub fn delegate(args: TokenStream, input: TokenStream) -> TokenStream {
    bolt_attribute::delegate::process(args, input)
}
