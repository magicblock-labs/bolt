use anchor_lang::prelude::*;
use std::str::FromStr;

declare_id!("CmP2djJgABZ4cRokm4ndxuq6LerqpNHLBsaUv2XKEJua");

#[program]
pub mod bolt_component {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<Vec<u8>> {
        let mut component = Component::default();
        component.bolt_metadata.authority = Pubkey::from_str("WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n").unwrap();
        let mut serialized_data = Vec::new();
        anchor_lang::AccountSerialize::try_serialize(&component, &mut serialized_data).expect("Failed to serialize");
        //component.serialize(&mut serialized_data).expect("Failed to serialize");
        Ok(serialized_data)
    }

    pub fn apply(_ctx: Context<Apply>, _args: Vec<u8>) -> Result<()> {
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Apply<'info> {
        #[account(mut)]
        pub bolt_component: Account<'info, Component>,
        /// CHECK: The system can modify the data of the component
        pub bolt_system: UncheckedAccount<'info>,
    }

    impl<'info> Apply<'info> {
        pub fn set_data_ctx(
            &self,
        ) -> CpiContext<'_, '_, '_, 'info, bolt_system::cpi::accounts::SetData<'info>> {
            let cpi_program = self.bolt_system.to_account_info();
            let cpi_accounts = bolt_system::cpi::accounts::SetData {
                component: self.bolt_component.to_account_info().clone(),
            };
            CpiContext::new(cpi_program, cpi_accounts)
        }
    }

    pub fn update(_ctx: Context<Update>, _data: Vec<u8>) -> Result<()> {
        Ok(())
    }

    #[derive(Accounts)]
    pub struct Update<'info> {
        #[account(mut)]
        pub bolt_component: Account<'info, Component>,
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init_if_needed, owner = Pubkey::from_str("WorLD15A7CrDwLcLy4fRqtaTb9fbd8o8iqiEMUDse2n").unwrap(), payer = payer, space = Component::size(), seeds = [Component::seed(), entity.key().as_ref()], bump)]
    pub data: AccountInfo<'info>,
    #[account()]
    /// CHECK: A generic entity account
    pub entity: AccountInfo<'info>,
    #[account()]
    /// CHECK: The authority of the component
    pub authority: Option<AccountInfo<'info>>,
    pub system_program: Program<'info, System>,
}

// Component data
#[account]
#[derive(InitSpace, Default, Copy)]
pub struct Component {
    pub position: Position,
    pub bolt_metadata: BoltMetadata,
}

impl Component {
    pub fn size() -> usize {
        8 + Component::INIT_SPACE
    }
    pub fn seed() -> &'static [u8] {
        b"origin-component"
    }
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Default, Copy, Clone)]
pub struct Position {
    pub x: i64,
    pub y: i64,
    pub z: i64,
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Default, Copy, Clone)]
pub struct BoltMetadata {
    pub authority: Pubkey
}
