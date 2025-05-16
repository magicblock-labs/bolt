use pinocchio::{
    account_info::AccountInfo,
    instruction::{AccountMeta, Instruction, Signer},
    program::invoke_signed,
    pubkey::Pubkey,
    ProgramResult,
};

pub struct Destroy<'a> {
    /// Authority
    pub authority: &'a AccountInfo,
    /// Data account
    pub receiver: &'a AccountInfo,
    /// Entity
    pub entity: &'a AccountInfo,
    /// Authority
    pub component: &'a AccountInfo,
    /// Authority
    pub component_program_data: &'a AccountInfo,
    /// Instruction sysvar account
    pub instruction_sysvar_account: &'a AccountInfo,
    /// System program
    pub system_program: &'a AccountInfo,
    /// Component program
    pub component_program: &'a Pubkey,
}

impl Destroy<'_> {
    pub const DISCRIMINATOR: [u8; 8] = [157, 40, 96, 3, 135, 203, 143, 74];

    #[inline(always)]
    pub fn invoke(&self) -> ProgramResult {
        self.invoke_signed(&[])
    }

    pub fn invoke_signed(&self, signers: &[Signer]) -> ProgramResult {
        // account metadata
        let account_metas: [AccountMeta; 7] = [
            AccountMeta::readonly_signer(self.authority.key()),
            AccountMeta::writable(self.receiver.key()),
            AccountMeta::readonly(self.entity.key()),
            AccountMeta::writable(self.component.key()),
            AccountMeta::readonly(self.component_program_data.key()),
            AccountMeta::readonly(self.instruction_sysvar_account.key()),
            AccountMeta::readonly(self.system_program.key()),
        ];

        let instruction = Instruction {
            program_id: self.component_program,
            accounts: &account_metas,
            data: Self::DISCRIMINATOR.as_slice(),
        };

        invoke_signed(
            &instruction,
            &[
                self.authority,
                self.receiver,
                self.entity,
                self.component,
                self.component_program_data,
                self.instruction_sysvar_account,
                self.system_program,
            ],
            signers,
        )
    }
}
