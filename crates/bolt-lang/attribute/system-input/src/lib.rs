use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemStruct};

/// This macro attribute is used to define a BOLT system input.
///
/// The input can be defined as a struct, that will be transformed into an Anchor context.
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

    // Extract struct name and fields
    let name = input.ident;
    let fields = input.fields;

    // Transform fields
    let transformed_fields = fields.iter().map(|f| {
        let field_name = &f.ident;
        let field_type = &f.ty;
        quote! {
            #[account()]
            pub #field_name: Account<'info, #field_type>,
        }
    });

    // Generate the new struct with the Accounts derive and transformed fields
    let output = quote! {
        #[derive(Accounts)]
        pub struct #name<'info> {
            #(#transformed_fields)*
        }
    };

    // Return the generated code as a TokenStream
    TokenStream::from(output)
}