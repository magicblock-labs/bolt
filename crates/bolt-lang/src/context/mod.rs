use anchor_lang::{Bumps, prelude::{borsh::{BorshDeserialize, BorshSerialize}, *}};
use std::{cell::RefCell, rc::Rc};

pub struct ContextData<'info, T: Bumps> {
    program_id: Pubkey,
    accounts: T,
    bumps: T::Bumps,
    remaining_accounts: &'info [AccountInfo<'info>],
}

impl<'info, T: Bumps> ContextData<'info, T> {
    pub fn rebuild_from<'a, 'b, 'c>(_ctx: Context<'a, 'b, 'c, 'info, T>, _input: BoltExecuteInput) -> (Self, Vec<u8>, AccountInfo<'info>) {
        // Self::new(*ctx.program_id, ctx.accounts, ctx.bumps, ctx.remaining_accounts)
        todo!("Not implemented")
    }

    pub fn new(program_id: Pubkey, accounts: T, bumps: T::Bumps, remaining_accounts: &'info [AccountInfo<'info>]) -> Self {
        Self {
            program_id,
            accounts,
            bumps,
            remaining_accounts,
        }
    }

    pub fn to_context(&'info mut self) -> Context<'info, 'info, 'info, 'info, T>
    {
        let bumps: T::Bumps = unsafe { std::mem::transmute_copy(&self.bumps) };
        Context {
            program_id: &self.program_id,
            accounts: &mut self.accounts,
            remaining_accounts: self.remaining_accounts,
            bumps
        }
    }

    #[cfg(test)]
    pub fn test_data(components: T, bumps: T::Bumps, remaining_accounts: &'info [AccountInfo<'info>]) -> Self {
        Self::new(crate::ID, components, bumps, remaining_accounts)
    }
}
pub struct AccountData {
    key: Pubkey,
    owner: Pubkey,
    data: Vec<u8>,
    lamports: u64,
    rent_epoch: u64,
    is_signer: bool,
    is_writable: bool,
    executable: bool,
}

impl AccountData {
    pub fn new(key: Pubkey, owner: Pubkey, data: Vec<u8>, lamports: u64, rent_epoch: u64, is_signer: bool, is_writable: bool) -> Self {
        let executable = false;
        Self {
            key,
            owner,
            data,
            lamports,
            rent_epoch,
            is_signer,
            is_writable,
            executable,
        }
    }

    pub fn to_account_info<'info>(&'info mut self) -> AccountInfo<'info> {
        AccountInfo {
            key: &self.key,
            lamports: Rc::new(RefCell::new(&mut self.lamports)),
            data: Rc::new(RefCell::new(&mut self.data)),
            owner: &self.owner,
            rent_epoch: self.rent_epoch,
            is_signer: self.is_signer,
            is_writable: self.is_writable,
            executable: self.executable,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize)]
pub struct BoltExecuteInput {
    pub pda_data: Vec<u8>,
    pub args: Vec<u8>,
}

#[cfg(test)]
mod tests {
    use anchor_lang::prelude::*;

    use super::*;

    impl AccountData {
        pub fn test_data() -> [AccountData; 2] {
            let one = Pubkey::from_str_const("11111111111111111111111111111111111111111111");
    
            let two = Pubkey::from_str_const("22222222222222222222222222222222222222222222");
            let some_account = SomeAccount { data: 12u64 };
            let mut data = Vec::new();
            some_account.try_serialize(&mut data).expect("Failed to serialize account data");
    
            [
                AccountData::new(one, crate::ID, vec![], 111, 1, true, false),
                AccountData::new(two, crate::ID, data, 222, 1, false, true)
            ]
        }
    }

    #[account]
    pub struct SomeAccount {
        pub data: u64,
    }

    #[derive(Accounts)]
    pub struct VariadicComponents<'info> {
        pub authority: Signer<'info>,
    }

    impl<'info> VariadicComponents<'info> {
        pub fn test_data(authority: &'info AccountInfo<'info>) -> (Self, VariadicComponentsBumps) {
            (
                Self {
                    authority: Signer::try_from(authority).unwrap(),
                },
                VariadicComponentsBumps {}
            )
        }
    }

    fn bolt_execute<'a, 'b, 'info>(ctx: Context<'a, 'b, 'info, 'info, VariadicComponents<'info>>, input: BoltExecuteInput) -> Result<()> {
        let (mut rebuilt_context_data, args, buffer) = ContextData::rebuild_from(ctx, input);
        let rebuilt_context = rebuilt_context_data.to_context();
        let mut components = Components::try_from(&rebuilt_context).expect("Failed to convert context to components");
        let bumps = ComponentsBumps {};
        let context = Context::new(ctx.program_id, &mut components, ctx.remaining_accounts, bumps);
        let result = execute(context, args)?;
        let result = result.try_to_vec()?;
        buffer.realloc(result.len(), false)?;
        buffer.data.borrow_mut().copy_from_slice(&result);
        Ok(())
    }

    fn execute<'a, 'b, 'info>(ctx: Context<'a, 'b, 'info, 'info, Components<'info>>, args: Vec<u8>) -> Result<Vec<Vec<u8>>> {
        assert_eq!(args, vec![1, 2, 3]);
        assert_eq!(ctx.accounts.account.data, 12);
        Ok(vec![vec![], vec![]])
    }

    #[derive(Accounts)]
    pub struct Components<'info> {
        pub authority: Signer<'info>,
        pub account: Account<'info, SomeAccount>,
    }

    impl<'info> TryFrom<&Context<'_, '_, 'info, 'info, VariadicComponents<'info>>> for Components<'info> {
        type Error = ErrorCode;

        fn try_from(context: &Context<'_, '_, 'info, 'info, VariadicComponents<'info>>) -> std::result::Result<Self, ErrorCode> {
            Ok(Self {
                authority: context.accounts.authority.clone(),
                account: Account::try_from(context.remaining_accounts.as_ref().get(0).ok_or_else(|| ErrorCode::ConstraintAccountIsNone)?).expect("Failed to convert context to components"),
            })
        }
    }

    fn prepare_execution_input(first_component: &mut AccountData) -> Result<BoltExecuteInput> {
        let pda_data = std::mem::take(&mut first_component.data);
        let args = vec![1, 2, 3];
        Ok(BoltExecuteInput { pda_data, args })
    }

    #[test]
    fn context_creation() -> Result<()> {
        let [mut signer, mut component_a] = AccountData::test_data();
        let input= prepare_execution_input(&mut component_a)?;
        let (signer_account_info, component_a_info) = (signer.to_account_info(), component_a.to_account_info());
        let (components, bumps) = VariadicComponents::test_data(&signer_account_info);
        let remaining_accounts = &[component_a_info.clone()];
        let mut context = ContextData::test_data(components, bumps, remaining_accounts);
        let context = context.to_context();

        assert!(context.accounts.authority.data_is_empty());
        assert!(context.remaining_accounts[0].data_is_empty());

        bolt_execute(context, input)
    }
}