use pinocchio::{
    account_info::AccountInfo,
    instruction::{AccountMeta, Instruction, Signer},
    program::invoke_signed,
    pubkey::Pubkey,
    ProgramResult,
};

pub struct UpdateWithSession<'a> {
    /// Component
    pub component: &'a AccountInfo,
    /// Authority
    pub authority: &'a AccountInfo,
    /// Instruction sysvar account
    pub instruction_sysvar_account: &'a AccountInfo,
    /// Instruction sysvar account
    pub session_token: &'a AccountInfo,
    /// Instruction
    pub component_program: &'a Pubkey,
    /// Component program
    pub instruction_data: &'a [u8],
}

impl UpdateWithSession<'_> {
    pub const DISCRIMINATOR: [u8; 8] = [221, 55, 212, 141, 57, 85, 61, 182];

    #[inline(always)]
    pub fn invoke(&self) -> ProgramResult {
        self.invoke_signed(&[])
    }

    pub fn invoke_signed(&self, signers: &[Signer]) -> ProgramResult {
        // account metadata
        let account_metas: [AccountMeta; 4] = [
            AccountMeta::writable(self.component.key()),
            AccountMeta::readonly_signer(self.authority.key()),
            AccountMeta::readonly(self.instruction_sysvar_account.key()),
            AccountMeta::readonly(self.session_token.key()),
        ];

        const DISCRIMATOR_LENGTH: usize = 8;

        let mut instruction_data = [0u8; 1024];

        instruction_data[0..DISCRIMATOR_LENGTH].copy_from_slice(Self::DISCRIMINATOR.as_slice());
        instruction_data[DISCRIMATOR_LENGTH..DISCRIMATOR_LENGTH + self.instruction_data.len()]
            .copy_from_slice(self.instruction_data);

        let instruction = Instruction {
            program_id: self.component_program,
            accounts: &account_metas,
            data: &instruction_data[..DISCRIMATOR_LENGTH + self.instruction_data.len()],
        };

        invoke_signed(
            &instruction,
            &[
                self.component,
                self.authority,
                self.instruction_sysvar_account,
                self.session_token,
            ],
            signers,
        )
    }
}
