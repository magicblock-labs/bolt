use crate::instructions::InstructionGeneration;
use quote::quote;

pub fn generate_set_data() -> InstructionGeneration {
    InstructionGeneration {
        function: quote! {
            #[automatically_derived]
            pub fn set_data(ctx: Context<SetData>) -> Result<()> {
                bolt_lang::instructions::set_data(ctx.accounts.cpi_auth.to_account_info(), ctx.accounts.buffer.to_account_info(), ctx.accounts.component.to_account_info())
            }
        },
        accounts: quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct SetData<'info> {
                #[account()]
                pub cpi_auth: Signer<'info>,
                /// CHECK: buffer data check
                #[account()]
                pub buffer: UncheckedAccount<'info>,
                /// CHECK: component data check
                #[account(mut)]
                pub component: UncheckedAccount<'info>,
            }
        },
    }
}
