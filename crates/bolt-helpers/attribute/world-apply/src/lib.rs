extern crate proc_macro;

use proc_macro::TokenStream;
use quote::quote;
use syn::parse::{Parse, ParseStream, Result};
use syn::{parse_macro_input, Ident, LitInt, Token};

/// This macro attribute is a helper used for defining BOLT apply proxy instructions.
#[proc_macro_attribute]
pub fn apply_system(attr: TokenStream, item: TokenStream) -> TokenStream {
    let attr_p = parse_macro_input!(attr as SystemTemplateInput);

    let max_components = attr_p.max_components;

    // Parse the original module content
    let mut input: syn::ItemMod = syn::parse(item).expect("Failed to parse input module");

    // Generate a function for execute instruction
    let funcs = (2..=max_components).map(|i| {
        let apply_func_name = syn::Ident::new(&format!("apply{}", i), proc_macro2::Span::call_site());
        let execute_func_name = syn::Ident::new(&format!("execute_{}", i), proc_macro2::Span::call_site());
        let data_struct = syn::Ident::new(&format!("ApplySystem{}", i), proc_macro2::Span::call_site());

        let updates = (1..=i).enumerate().map(|(index, n)| {
            let component_program_name = syn::Ident::new(&format!("component_program_{}", n), proc_macro2::Span::call_site());
            let bolt_component_name = syn::Ident::new(&format!("bolt_component_{}", n), proc_macro2::Span::call_site());

            quote! {
            let update_result = bolt_component::cpi::update(
                build_update_context(
                    ctx.accounts.#component_program_name.clone(),
                    ctx.accounts.#bolt_component_name.clone(),
                    ctx.accounts.authority.clone(),
                    ctx.accounts.instruction_sysvar_account.clone(),
                ),
                res[#index].to_owned()
            )?;
        }
        });

        quote! {
        pub fn #apply_func_name<'info>(ctx: Context<'_, '_, '_, 'info, #data_struct<'info>>, args: Vec<u8>) -> Result<()> {
            if !ctx.accounts.authority.is_signer && ctx.accounts.authority.key != &ID {
                return Err(WorldError::InvalidAuthority.into());
            }
            if !ctx.accounts.world.permissionless
                && !ctx
                    .accounts
                    .world
                    .systems()
                    .approved_systems
                    .contains(&ctx.accounts.bolt_system.key())
            {
                return Err(WorldError::SystemNotApproved.into());
            }
            let remaining_accounts: Vec<AccountInfo<'info>> = ctx.remaining_accounts.to_vec();
            let res = bolt_system::cpi::#execute_func_name(
                    ctx.accounts
                    .build()
                    .with_remaining_accounts(remaining_accounts),args)?.get().to_vec();
            #(#updates)*
            Ok(())
        }
    }
    });

    // Append each generated function to the module's items
    if let Some((brace, mut content)) = input.content.take() {
        for func in funcs {
            let parsed_func: syn::Item =
                syn::parse2(func).expect("Failed to parse generated function");
            content.push(parsed_func);
        }

        input.content = Some((brace, content));
    }

    let data_def = (2..=max_components).map(|i| {
        let data_struct =
            syn::Ident::new(&format!("ApplySystem{}", i), proc_macro2::Span::call_site());
        let fields = (1..=i).map(|n| {
            let component_program_name = syn::Ident::new(
                &format!("component_program_{}", n),
                proc_macro2::Span::call_site(),
            );
            let component_name = syn::Ident::new(
                &format!("bolt_component_{}", n),
                proc_macro2::Span::call_site(),
            );
            quote! {
                /// CHECK: bolt component program check
                pub #component_program_name: UncheckedAccount<'info>,
                #[account(mut)]
                /// CHECK: component account
                pub #component_name: UncheckedAccount<'info>,
            }
        });
        let struct_def = quote! {
            #[derive(Accounts)]
            pub struct #data_struct<'info> {
                /// CHECK: bolt system program check
                pub bolt_system: UncheckedAccount<'info>,
                #(#fields)*
                 /// CHECK: authority check
                pub authority: Signer<'info>,
                #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
                /// CHECK: instruction sysvar check
                pub instruction_sysvar_account: UncheckedAccount<'info>,
                #[account()]
                pub world: Account<'info, World>,
            }
        };
        quote! {
            #struct_def
        }
    });

    let impl_build_def = (2..=max_components).map(|i| {
        let data_struct = syn::Ident::new(&format!("ApplySystem{}", i), proc_macro2::Span::call_site());
        let set_data_struct = syn::Ident::new(&format!("SetData{}", i), proc_macro2::Span::call_site());
        let fields: Vec<_> = (1..=i).map(|n| {
            let component_key = syn::Ident::new(&format!("component{}", n), proc_macro2::Span::call_site());
            let component_name = syn::Ident::new(&format!("bolt_component_{}", n), proc_macro2::Span::call_site());
            quote! {
                #component_key: self.#component_name.to_account_info(),
            }
        }).collect();
        quote! {
            impl<'info> #data_struct<'info> {
                pub fn build(&self) -> CpiContext<'_, '_, '_, 'info, bolt_system::cpi::accounts::#set_data_struct<'info>> {
                    let cpi_program = self.bolt_system.to_account_info();
                    let cpi_accounts = bolt_system::cpi::accounts::#set_data_struct {
                        #(#fields)*
                        authority: self.authority.to_account_info(),
                    };
                    CpiContext::new(cpi_program, cpi_accounts)
                }
            }
        }
    });

    // Return the modified module
    let output = quote! {
        #input
        #(#data_def)*
        #(#impl_build_def)*
    };
    output.into()
}

// Define a struct to parse macro input
struct SystemTemplateInput {
    max_components: usize,
}

impl Parse for SystemTemplateInput {
    fn parse(input: ParseStream) -> Result<Self> {
        let _ = input.parse::<Ident>()?;
        let _ = input.parse::<Token![=]>()?;
        let max_components: LitInt = input.parse()?;
        let max_value = max_components.base10_parse()?;
        Ok(SystemTemplateInput {
            max_components: max_value,
        })
    }
}
