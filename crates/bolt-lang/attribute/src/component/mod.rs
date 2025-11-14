mod attributes;
mod generate;

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

pub use attributes::*;
pub use generate::*;

use crate::{common::generate_program, delegate::inject_delegate_items};

pub fn process(attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut type_ = parse_macro_input!(item as DeriveInput);
    let mut program = generate_program(&type_.ident.to_string());

    let attributes = Attributes::from(attr);
    generate_implementation(&mut program, &attributes, &type_);
    generate_instructions(&mut program, &type_.ident, None);
    if attributes.delegate {
        inject_delegate_items(&mut program, vec![(type_.ident.clone(), "".to_string())]);
    }
    generate_update(&mut program);
    generate_set_owner(&mut program);
    enrich_type(&mut type_);

    let expanded = quote! {
        #program
        #type_
    };
    expanded.into()
}
