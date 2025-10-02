use proc_macro::TokenStream;
use quote::{quote, ToTokens};
use syn::{parse_macro_input, ItemMod};
use proc_macro2::TokenStream as TokenStream2;

pub fn process(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut ast = parse_macro_input!(item as syn::ItemMod);
    generate_delegation_instructions(&mut ast);
    ast.to_token_stream().into()
}

/// Modifies the component module and adds the necessary functions and structs.
fn generate_delegation_instructions(module: &mut ItemMod) {
    let (delegate_fn, delegate_struct) = generate_delegate();
    let (process_undelegation_fn, process_undelegation_struct) = generate_process_undelegation();
    let (undelegate_fn, undelegate_struct) = generate_undelegate();
    if let Some((_, items)) = module.content.as_mut() {
        items.extend(
            vec![
                delegate_fn,
                delegate_struct,
                process_undelegation_fn,
                process_undelegation_struct,
                undelegate_fn,
                undelegate_struct,
            ]
            .into_iter()
            .map(|item| syn::parse2(item).unwrap())
            .collect::<Vec<_>>(),
        );
    }
}

/// Generates the allow_undelegate function and struct.
fn generate_undelegate() -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn undelegate(ctx: Context<Undelegate>) -> Result<()> {
                ::bolt_lang::commit_and_undelegate_accounts(
                    &ctx.accounts.payer,
                    vec![&ctx.accounts.delegated_account.to_account_info()],
                    &ctx.accounts.magic_context,
                    &ctx.accounts.magic_program,
                )?;
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct Undelegate<'info> {
                #[account(mut)]
                pub payer: Signer<'info>,
                #[account(mut)]
                /// CHECK: The delegated component
                pub delegated_account: AccountInfo<'info>,
                #[account(mut, address = ::bolt_lang::MAGIC_CONTEXT_ID)]
                /// CHECK:`
                pub magic_context: AccountInfo<'info>,
                #[account()]
                /// CHECK:`
                pub magic_program: Program<'info, MagicProgram>
            }
        },
    )
}

/// Generates the undelegate function and struct.
fn generate_process_undelegation() -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn process_undelegation(ctx: Context<ProcessUndelegation>, account_seeds: Vec<Vec<u8>>) -> Result<()> {
                let [delegated_account, buffer, payer, system_program] = [
                    &ctx.accounts.delegated_account,
                    &ctx.accounts.buffer,
                    &ctx.accounts.payer,
                    &ctx.accounts.system_program,
                ];
                ::bolt_lang::undelegate_account(
                    delegated_account,
                    &id(),
                    buffer,
                    payer,
                    system_program,
                    account_seeds,
                )?;
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct ProcessUndelegation<'info> {
                /// CHECK:`
                #[account(mut)]
                pub delegated_account: AccountInfo<'info>,
                /// CHECK:`
                #[account()]
                pub buffer: AccountInfo<'info>,
                /// CHECK:
                #[account(mut)]
                pub payer: AccountInfo<'info>,
                /// CHECK:
                pub system_program: AccountInfo<'info>,
            }
        },
    )
}

/// Generates the delegate instruction and related structs to inject in the component.
fn generate_delegate() -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn delegate(ctx: Context<DelegateInput>, commit_frequency_ms: u32, validator: Option<Pubkey>, pda_seeds: Vec<Vec<u8>>) -> Result<()> {
                let del_accounts = ::bolt_lang::DelegateAccounts {
                    payer: &ctx.accounts.payer,
                    pda: &ctx.accounts.account,
                    owner_program: &ctx.accounts.owner_program,
                    buffer: &ctx.accounts.buffer,
                    delegation_record: &ctx.accounts.delegation_record,
                    delegation_metadata: &ctx.accounts.delegation_metadata,
                    delegation_program: &ctx.accounts.delegation_program,
                    system_program: &ctx.accounts.system_program,
                };

                let config = ::bolt_lang::DelegateConfig {
                    commit_frequency_ms,
                    validator,
                };

                ::bolt_lang::delegate_account(
                    del_accounts,
                    pda_seeds,
                    config,
                )?;

                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct DelegateInput<'info> {
                pub payer: Signer<'info>,
                #[account()]
                pub entity: Account<'info, Entity>,
                /// CHECK:
                #[account(mut)]
                pub account: AccountInfo<'info>,
                /// CHECK:`
                pub owner_program: AccountInfo<'info>,
                /// CHECK:
                #[account(mut)]
                pub buffer: AccountInfo<'info>,
                /// CHECK:`
                #[account(mut)]
                pub delegation_record: AccountInfo<'info>,
                /// CHECK:`
                #[account(mut)]
                pub delegation_metadata: AccountInfo<'info>,
                /// CHECK:`
                pub delegation_program: AccountInfo<'info>,
                /// CHECK:`
                pub system_program: AccountInfo<'info>,
            }
        },
    )
}
