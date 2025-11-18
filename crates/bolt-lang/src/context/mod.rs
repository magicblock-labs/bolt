use anchor_lang::{Bumps, prelude::*};
use std::{cell::RefCell, rc::Rc};

pub struct ContextData<'info, T: Bumps> {
    pub program_id: Pubkey,
    pub accounts: T,
    pub bumps: T::Bumps,
    pub remaining_accounts: &'info [AccountInfo<'info>],
    // Own storage for rebuilt remaining accounts when we need to override the first one
    pub rebuilt_remaining_storage: Option<Box<[AccountInfo<'info>]>>,
    // Own storage for the first component's data and lamports to back AccountInfo::new
    pub first_component_data: Option<Vec<u8>>,
    pub first_component_lamports: u64,
}

impl<'info, T: Bumps> ContextData<'info, T> {
    pub fn rebuild_from<'a, 'b, 'c>(ctx: &Context<'a, 'b, 'c, 'info, T>, input: BoltExecuteInput) -> (Self, Vec<u8>, AccountInfo<'info>)
    where
        T: Clone,
        'c: 'info,
    {
        let BoltExecuteInput { pda_data, args } = input;
        // Use the first remaining account as buffer (removed from remaining_accounts).
        let buffer = ctx
            .remaining_accounts
            .get(0)
            .expect("expected at least one remaining account")
            .clone();
        // Rebuild first component account info using same key/owner/rent_epoch, writable and with data from input.
        let key = buffer.key;
        let owner = buffer.owner;
        let rent_epoch = buffer.rent_epoch;

        // Build the context data and stash owned storage so the references live long enough
        let bumps: T::Bumps = unsafe { std::mem::transmute_copy(&ctx.bumps) };
        let mut rebuilt = Self::new(*ctx.program_id, ctx.accounts.clone(), bumps, &[]);
        // initialize owned storages
        rebuilt.first_component_lamports = buffer.lamports();
        rebuilt.first_component_data = Some(pda_data);
        // Create AccountInfo that borrows from rebuilt's owned fields
        {
            let is_signer = false;
            let is_writable = true;
            let executable = false;
            // SAFETY: casting references to 'info is safe because `rebuilt` (returned Self)
            // owns the backing storage for these references for at least 'info.
            let lamports_ref: &'info mut u64 =
                unsafe { &mut *(&mut rebuilt.first_component_lamports as *mut u64) };
            let data_slice_ref: &'info mut [u8] = unsafe {
                let slice_ptr = rebuilt.first_component_data.as_mut().unwrap().as_mut_slice() as *mut [u8];
                &mut *slice_ptr
            };
            let first_component =
                AccountInfo::new(key, is_signer, is_writable, lamports_ref, data_slice_ref, owner, executable, rent_epoch);
            // Build new remaining accounts storage: first is rebuilt component, rest are original (skipping buffer)
            let mut storage_vec: Vec<AccountInfo<'info>> = Vec::with_capacity(ctx.remaining_accounts.len());
            storage_vec.push(first_component);
            storage_vec.extend_from_slice(&ctx.remaining_accounts[1..]);
            rebuilt.rebuilt_remaining_storage = Some(storage_vec.into_boxed_slice());
        }
        // Now point remaining_accounts to our owned storage
        let ra_ref: &[AccountInfo<'info>] = rebuilt.rebuilt_remaining_storage.as_ref().unwrap().as_ref();
        // Extend lifetime to 'info; safe here because rebuilt owns the storage
        rebuilt.remaining_accounts = unsafe { std::mem::transmute::<&[AccountInfo<'info>], &'info [AccountInfo<'info>]>(ra_ref) };
        (rebuilt, args, buffer)
    }

    pub fn new(program_id: Pubkey, accounts: T, bumps: T::Bumps, remaining_accounts: &'info [AccountInfo<'info>]) -> Self {
        Self {
            program_id,
            accounts,
            bumps,
            remaining_accounts,
            rebuilt_remaining_storage: None,
            first_component_data: None,
            first_component_lamports: 0,
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

#[derive(AnchorSerialize, AnchorDeserialize)]
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

    #[derive(Accounts, Clone)]
    pub struct VariadicBoltComponents<'info> {
        pub authority: Signer<'info>,
    }

    impl<'info> VariadicBoltComponents<'info> {
        pub fn test_data(authority: &'info AccountInfo<'info>) -> (Self, VariadicBoltComponentsBumps) {
            (
                Self {
                    authority: Signer::try_from(authority).unwrap(),
                },
                VariadicBoltComponentsBumps {}
            )
        }
    }

    fn bolt_execute<'a, 'b, 'info>(ctx: Context<'a, 'b, 'info, 'info, VariadicBoltComponents<'info>>, input: BoltExecuteInput) -> Result<()> {
        let (rebuilt_context_data, args, buffer) = ContextData::rebuild_from(&ctx, input);
        let mut variadic = VariadicBoltComponents {
            authority: ctx.accounts.authority.clone(),
        };
        let variadic_bumps = VariadicBoltComponentsBumps {};
        let var_ctx = Context::new(ctx.program_id, &mut variadic, rebuilt_context_data.remaining_accounts, variadic_bumps);
        let mut components = Components::try_from(&var_ctx).expect("Failed to convert context to components");
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

    impl<'a, 'b, 'c, 'info> TryFrom<&Context<'a, 'b, 'c, 'info, VariadicBoltComponents<'info>>> for Components<'info>
    where
        'c: 'info,
    {
        type Error = ErrorCode;

        fn try_from(context: &Context<'a, 'b, 'c, 'info, VariadicBoltComponents<'info>>) -> std::result::Result<Self, ErrorCode> {
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
        let (components, bumps) = VariadicBoltComponents::test_data(&signer_account_info);
        let remaining_accounts = &[component_a_info.clone()];
        let mut context = ContextData::test_data(components, bumps, remaining_accounts);
        let context = context.to_context();

        assert!(context.accounts.authority.data_is_empty());
        assert!(context.remaining_accounts[0].data_is_empty());

        bolt_execute(context, input)
    }
}