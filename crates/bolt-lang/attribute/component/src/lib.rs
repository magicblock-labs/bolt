use proc_macro::TokenStream;

/// This Component attribute is used to automatically generate the seed and size functions
///
/// The component_id can be used to define the seed used to generate the PDA which stores the component data.
/// The macro also adds the InitSpace and Default derives to the struct.
///
/// #[component]
/// #[derive(Default, Copy)]
/// pub struct Position {
///     pub x: i64,
///     pub y: i64,
///     pub z: i64,
/// }
/// ```
#[proc_macro_attribute]
pub fn component(attr: TokenStream, item: TokenStream) -> TokenStream {
    bolt_attribute::component::process(attr, item)
}
