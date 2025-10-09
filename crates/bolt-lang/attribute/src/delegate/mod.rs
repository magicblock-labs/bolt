use proc_macro2::TokenStream as TokenStream2;
use quote::quote;
use syn::ItemMod;

/// Injects delegate-related functions and structs directly into the program module.
pub fn inject_delegate_items(module: &mut ItemMod, components: Vec<(syn::Ident, String)>) {
    if components.is_empty() {
        return;
    }

    let (
        delegate_fn,
        delegate_struct,
        reinit_undelegate_fn,
        reinit_undelegate_struct,
        undelegate_fn,
        undelegate_struct,
    ) = generate_delegate_set(components);

    module.content.as_mut().map(|(brace, items)| {
        items.extend(
            vec![
                delegate_fn,
                delegate_struct,
                reinit_undelegate_fn,
                reinit_undelegate_struct,
                undelegate_fn,
                undelegate_struct,
            ]
            .into_iter()
            .map(|item| syn::parse2(item).unwrap())
            .collect::<Vec<_>>(),
        );
        (brace, items.clone())
    });
}

/// Generates the delegate/undelegate functions and related structs to inject in the component program.
fn generate_delegate_set(
    components: Vec<(syn::Ident, String)>,
) -> (
    TokenStream2,
    TokenStream2,
    TokenStream2,
    TokenStream2,
    TokenStream2,
    TokenStream2,
) {
    let component_matches = components.iter().map(|(component, name)| quote! {
        #component::DISCRIMINATOR => &[#component::seed(), #name.as_bytes(), &ctx.accounts.entity.key().to_bytes()]
    }).collect::<Vec<_>>();

    let delegate_fn = quote! {
        #[automatically_derived]
        pub fn delegate(ctx: Context<DelegateInput>, commit_frequency_ms: u32, validator: Option<Pubkey>) -> Result<()> {
            let discriminator = ::bolt_lang::BoltMetadata::discriminator_from_account_info(&ctx.accounts.account)?;

            let pda_seeds: &[&[u8]] = match discriminator.as_slice() {
                #(#component_matches),*,
                _ => return Err(error!(::bolt_lang::BoltError::ComponentNotDelegateable)),
            };

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

            let config = ::bolt_lang::DelegateConfig { commit_frequency_ms, validator };

            ::bolt_lang::delegate_account(
                del_accounts,
                pda_seeds,
                config,
            )?;

            Ok(())
        }
    };

    let delegate_struct = quote! {
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
    };

    let reinit_undelegate_fn = quote! {
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
    };

    let reinit_undelegate_struct = quote! {
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
    };

    let undelegate_fn = quote! {
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
    };

    let undelegate_struct = quote! {
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
    };

    (
        delegate_fn,
        delegate_struct,
        reinit_undelegate_fn,
        reinit_undelegate_struct,
        undelegate_fn,
        undelegate_struct,
    )
}
