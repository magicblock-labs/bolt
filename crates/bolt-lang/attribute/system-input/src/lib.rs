use proc_macro::TokenStream;
use quote::{quote};
use syn::{parse_macro_input, ItemStruct, Fields};

/// This macro attribute is used to define a BOLT system input.
///
/// The input can be defined as a struct and will be transformed into an Anchor context.
///
///
/// # Example
/// ```ignore
/// pub struct Component {
///     pub position: Position,
/// }
///
/// Will be transfomed into:
///#[derive(Accounts)]
///pub struct Component<'info> {
///    #[account()]
///    pub position: Account<'info, Position>,
///}
/// ```
#[proc_macro_attribute]
pub fn system_input(_attr: TokenStream, item: TokenStream) -> TokenStream {
    // Parse the input TokenStream (the struct) into a Rust data structure
    let input = parse_macro_input!(item as ItemStruct);

    // Ensure the struct has named fields
    let fields = if let Fields::Named(fields) = &input.fields {
        &fields.named
    } else {
        panic!("system_input macro only supports structs with named fields");
    };
    let name = &input.ident;

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
        }
    };

    // Generate the try_to_vec method
    let try_to_vec_fields = fields.iter().map(|f| {
        let field_name = &f.ident;
        quote! {
            self.#field_name.try_to_vec()?
        }
    });

    let tuple_elements = (0..try_to_vec_fields.len()).map(|_| quote! {Vec<u8>}).collect::<Vec<_>>();
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
    };

    TokenStream::from(output)
}