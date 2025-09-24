mod utils;
mod generate;

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

use utils::*;
use generate::*;

struct Attributes {
    component_id: String,
    delegate: bool,
}

pub fn process(attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut type_ = parse_macro_input!(item as DeriveInput);
    let attributes = get_attributes(attr);
    let implementation = generate_implementation(&type_, &attributes);
    let program = generate_program(&type_, &attributes);

    enrich_type(&mut type_);

    let expanded = quote! {
        #program
        #type_
        #implementation
    };
    expanded.into()
}
