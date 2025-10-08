mod attributes;
mod generate;

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

pub use attributes::*;
pub use generate::*;

use crate::common::generate_program;

pub fn process(attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut type_ = parse_macro_input!(item as DeriveInput);
    let mut program = generate_program(&type_.ident.to_string());

    let attributes = Attributes::from(attr);
    generate_implementation(&mut program, &attributes, &type_);
    generate_instructions(&mut program, &attributes, &type_.ident, None);
    generate_update(&mut program);
    enrich_type(&mut type_);

    let expanded = quote! {
        #program
        #type_
    };
    expanded.into()
}
