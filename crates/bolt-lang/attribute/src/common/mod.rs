use heck::ToSnakeCase;
use proc_macro2::Span;
use syn::parse_quote;

pub fn generate_program(identifier: &str) -> syn::ItemMod {
    let snake_case_name = identifier.to_snake_case();
    let snake_case_name = syn::Ident::new(&snake_case_name, Span::call_site());

    parse_quote! {
        #[program]
        pub mod #snake_case_name {
            use super::*;

            #[derive(Accounts)]
            pub struct VariadicBoltComponents<'info> {
                #[account()]
                pub authority: AccountInfo<'info>,
            }
        }
    }
}
