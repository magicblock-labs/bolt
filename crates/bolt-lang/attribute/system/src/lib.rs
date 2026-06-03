use proc_macro::TokenStream;

#[proc_macro_attribute]
pub fn system(attr: TokenStream, item: TokenStream) -> TokenStream {
    bolt_attribute::system::process(attr, item)
}
