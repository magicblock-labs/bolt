use proc_macro::TokenStream;

use quote::quote;
use syn::{parse_macro_input, Fields, ItemStruct, Lit, Meta, NestedMeta};

/// This macro attribute is used to define a BOLT system input.
///
/// The input can be defined as a struct and will be transformed into an Anchor context.
///
///
/// # Example
/// ```ignore
///#[system_input]
///pub struct Components {
///    pub position: Position,
///}
///
/// ```
#[proc_macro_attribute]
pub fn system_input(_attr: TokenStream, item: TokenStream) -> TokenStream {
    // Parse the input TokenStream (the struct) into a Rust data structure
    let input = parse_macro_input!(item as ItemStruct);

    // Ensure the struct has named fields
    let fields = match &input.fields {
        Fields::Named(fields) => &fields.named,
        _ => panic!("system_input macro only supports structs with named fields"),
    };
    let name = &input.ident;

    // Collect imports for components
    let components_imports: Vec<_> = fields
        .iter()
        .filter_map(|field| {
            field.attrs.iter().find_map(|attr| {
                if let Ok(Meta::List(meta_list)) = attr.parse_meta() {
                    if meta_list.path.is_ident("component_id") {
                        meta_list.nested.first().and_then(|nested_meta| {
                            if let NestedMeta::Lit(Lit::Str(lit_str)) = nested_meta {
                                let component_type =
                                    format!("bolt_types::Component{}", lit_str.value());
                                if let Ok(parsed_component_type) =
                                    syn::parse_str::<syn::Type>(&component_type)
                                {
                                    let field_type = &field.ty;
                                    let component_import = quote! {
                                        use #parsed_component_type as #field_type;
                                    };
                                    return Some(component_import);
                                }
                            }
                            None
                        })
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
        })
        .collect();

    // Transform fields for the struct definition
    let transformed_fields = fields.iter().map(|f| {
        let field_name = &f.ident;
        let field_type = &f.ty;
        quote! {
            #[account()]
            pub #field_name: Account<'info, #field_type>,
        }
    });

    // Generate the new struct with the Accounts derive and transformed fields
    let output_struct = quote! {
        #[derive(Accounts)]
        pub struct #name<'info> {
            #(#transformed_fields)*
            pub authority: Signer<'info>,
        }
    };

    // Generate the try_to_vec method
    let try_to_vec_fields = fields.iter().map(|f| {
        let field_name = &f.ident;
        quote! {
            self.#field_name.try_to_vec()?
        }
    });

    let tuple_elements = (0..try_to_vec_fields.len())
        .map(|_| quote! {Vec<u8>})
        .collect::<Vec<_>>();
    let generated_tuple_type = match tuple_elements.len() {
        0 => panic!("system_input macro only supports structs with named fields"),
        1 => quote! { (Vec<u8>,) },
        _ => quote! { (#(#tuple_elements),*) },
    };

    // Generate the implementation of try_to_vec for the struct
    let output_impl = quote! {
        impl<'info> #name<'info> {
            pub fn try_to_vec(&self) -> Result<#generated_tuple_type> {
                Ok((#(#try_to_vec_fields,)*))
            }
        }
    };

    // Combine the struct definition and its implementation into the final TokenStream
    let output = quote! {
        #output_struct
        #output_impl
        #(#components_imports)*
    };

    TokenStream::from(output)
}
