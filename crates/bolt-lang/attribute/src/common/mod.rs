use heck::ToSnakeCase;
use proc_macro2::Span;
use syn::parse_quote;

pub fn generate_program(identifier: &str) -> syn::ItemMod {
    let snake_case_name = identifier.to_snake_case();
    let snake_case_name = syn::Ident::new(&snake_case_name, Span::call_site());

    let mut module: syn::ItemMod = parse_quote! {
        pub mod #snake_case_name {}
    };
    inject_program(&mut module);
    module
}

pub fn inject_program(module: &mut syn::ItemMod) {
    module.attrs.push(syn::parse_quote! { #[program] });
    module.content.as_mut().map(|(brace, items)| {
        items.insert(0, syn::Item::Use(syn::parse_quote! { use super::*; }));
        items.insert(
            1,
            syn::Item::Struct(syn::parse_quote! {
                #[derive(Accounts)]
                pub struct VariadicBoltComponents<'info> {
                    #[account()]
                    pub authority: AccountInfo<'info>,
                }
            }),
        );
        (brace, items.clone())
    });
}
