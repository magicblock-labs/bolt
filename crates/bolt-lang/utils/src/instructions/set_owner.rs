use quote::quote;
use crate::instructions::InstructionGeneration;

/// Generate the set owner function and struct.
pub fn generate_set_owner() -> InstructionGeneration {
    InstructionGeneration {
        function: quote! {
            #[automatically_derived]
            pub fn set_owner(ctx: Context<SetOwner>, owner: Pubkey) -> Result<()> {
                bolt_lang::instructions::set_owner(ctx.accounts.cpi_auth.to_account_info(), ctx.accounts.component.to_account_info(), owner)
            }
        },
        accounts: quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct SetOwner<'info> {
                #[account()]
                pub cpi_auth: Signer<'info>,
                /// CHECK: This is a component account.
                #[account(mut)]
                pub component: UncheckedAccount<'info>,
            }
        },
    }
}
