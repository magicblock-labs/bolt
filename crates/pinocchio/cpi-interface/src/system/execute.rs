use core::mem::MaybeUninit;

use pinocchio::{
    account_info::AccountInfo,
    cpi::{slice_invoke_signed, MAX_CPI_ACCOUNTS},
    instruction::{AccountMeta, Instruction, Signer},
    pubkey::Pubkey,
    ProgramResult,
};

pub struct Execute<'a> {
    pub authority: &'a AccountInfo,

    pub components: &'a [&'a AccountInfo],

    pub remaining_accounts: &'a [&'a AccountInfo],

    pub system: &'a Pubkey,

    pub instruction_data: &'a [u8],
}

impl Execute<'_> {
    pub const DISCRIMINATOR: [u8; 8] = [75, 206, 62, 210, 52, 215, 104, 109];

    #[inline(always)]
    pub fn invoke(&self) -> ProgramResult {
        self.invoke_signed(&[])
    }

    pub fn invoke_signed(&self, signers: &[Signer]) -> ProgramResult {
        const UNINIT: MaybeUninit<&AccountInfo> = MaybeUninit::<&AccountInfo>::uninit();
        const UNINIT_METAS: MaybeUninit<AccountMeta> = MaybeUninit::<AccountMeta>::uninit();

        let mut maybe_account_infos = [UNINIT; MAX_CPI_ACCOUNTS];
        let mut maybe_account_metas = [UNINIT_METAS; MAX_CPI_ACCOUNTS];

        let mut len = 0;

        maybe_account_infos[len].write(self.authority);
        maybe_account_metas[len].write(AccountMeta::readonly_signer(self.authority.key()));
        len += 1;

        if !self.components.is_empty() {
            for i in 0..self.components.len() {
                maybe_account_infos[len].write(self.components[i]);
                maybe_account_metas[len].write(AccountMeta::writable(self.components[i].key()));
                len += 1;
            }
        }

        if !self.remaining_accounts.is_empty() {
            for i in 0..self.remaining_accounts.len() {
                maybe_account_infos[len].write(self.remaining_accounts[i]);
                maybe_account_metas[len]
                    .write(AccountMeta::readonly(self.remaining_accounts[i].key()));
                len += 1;
            }
        }

        let account_infos =
            unsafe { core::slice::from_raw_parts(maybe_account_infos.as_ptr() as _, len) };

        let account_metas =
            unsafe { core::slice::from_raw_parts(maybe_account_metas.as_ptr() as _, len) };

        let mut instruction_data = [0u8; 1024];

        const DISCRIMATOR_LENGTH: usize = 8;

        instruction_data[0..DISCRIMATOR_LENGTH].copy_from_slice(Self::DISCRIMINATOR.as_slice());
        instruction_data[DISCRIMATOR_LENGTH..DISCRIMATOR_LENGTH + self.instruction_data.len()]
            .copy_from_slice(self.instruction_data);

        let instruction = Instruction {
            program_id: self.system,
            accounts: account_metas,
            data: &instruction_data[..DISCRIMATOR_LENGTH + self.instruction_data.len()],
        };

        slice_invoke_signed(&instruction, account_infos, signers)
    }
}
