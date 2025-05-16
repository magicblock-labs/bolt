use pinocchio::{
    account_info::AccountInfo,
    instruction::{AccountMeta, Instruction, Signer},
    program::invoke_signed,
    pubkey::Pubkey,
    ProgramResult,
};


pub struct Initialize<'a> {
    /// Payer
    pub payer: &'a AccountInfo,
    /// Data account
    pub data: &'a AccountInfo,
    /// Entity
    pub entity: &'a AccountInfo,
    /// Authority
    pub authority: &'a AccountInfo,
    /// Instruction sysvar account
    pub instruction_sysvar_account: &'a AccountInfo,
    /// System program
    pub system_program: &'a AccountInfo,
    /// Component program
    pub component_program: &'a Pubkey,
}

impl Initialize<'_> {
    pub const DISCRIMINATOR: [u8; 8] = [175, 175, 109, 31, 13, 152, 155, 237];

    #[inline(always)]
    pub fn invoke(&self) -> ProgramResult {
        self.invoke_signed(&[])
    }

    pub fn invoke_signed(&self, signers: &[Signer]) -> ProgramResult {
        // account metadata
        let account_metas: [AccountMeta; 6] = [
            AccountMeta::writable_signer(self.payer.key()),
            AccountMeta::writable(self.data.key()),
            AccountMeta::readonly(self.entity.key()),
            AccountMeta::readonly(self.authority.key()),
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
                self.payer,
                self.data,
                self.entity,
                self.authority,
                self.instruction_sysvar_account,
                self.system_program,
            ],
            signers,
        )
    }
}
