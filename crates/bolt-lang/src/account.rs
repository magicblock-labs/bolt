// TODO: Not used. Can be removed.

use anchor_lang::prelude::*;

/// BoltAccount used as a workaround for altering the account ownership check during deserialization.
/// P0 and P1 are the two parts of the pubkey and it's used on the Owner trait implementation.
#[derive(Clone)]
pub struct BoltAccount<T, const P0: u128, const P1: u128>(T);

impl<T: Discriminator, const P0: u128, const P1: u128> Discriminator for BoltAccount<T, P0, P1> {
    const DISCRIMINATOR: &'static [u8] = T::DISCRIMINATOR;
}

impl<T: anchor_lang::AccountDeserialize, const P0: u128, const P1: u128>
    anchor_lang::AccountDeserialize for BoltAccount<T, P0, P1>
{
    fn try_deserialize(data: &mut &[u8]) -> Result<Self> {
        Ok(BoltAccount(T::try_deserialize(data)?))
    }

    fn try_deserialize_unchecked(data: &mut &[u8]) -> Result<Self> {
        Ok(BoltAccount(T::try_deserialize_unchecked(data)?))
    }
}

impl<T: anchor_lang::AccountSerialize, const P0: u128, const P1: u128> anchor_lang::AccountSerialize
    for BoltAccount<T, P0, P1>
{
    fn try_serialize<W: std::io::Write>(&self, writer: &mut W) -> Result<()> {
        self.0.try_serialize(writer)
    }
}

impl<T: anchor_lang::Owner, const P0: u128, const P1: u128> anchor_lang::Owner
    for BoltAccount<T, P0, P1>
{
    fn owner() -> Pubkey {
        pubkey_from_array([P0, P1])
    }
}

impl<'info, T: anchor_lang::ToAccountInfos<'info>, const P0: u128, const P1: u128>
    anchor_lang::ToAccountInfos<'info> for BoltAccount<T, P0, P1>
{
    fn to_account_infos(&self) -> Vec<AccountInfo<'info>> {
        self.0.to_account_infos()
    }
}

impl<T: anchor_lang::ToAccountMetas, const P0: u128, const P1: u128> anchor_lang::ToAccountMetas
    for BoltAccount<T, P0, P1>
{
    fn to_account_metas(&self, is_signer: Option<bool>) -> Vec<AccountMeta> {
        self.0.to_account_metas(is_signer)
    }
}

impl<
        'info,
        T: anchor_lang::ToAccountInfos<'info>
            + anchor_lang::ToAccountInfo<'info>
            + anchor_lang::AccountSerialize
            + anchor_lang::AccountsExit<'info>,
        const P0: u128,
        const P1: u128,
    > anchor_lang::AccountsExit<'info> for BoltAccount<T, P0, P1>
{
    fn exit(&self, _program_id: &Pubkey) -> Result<()> {
        let info = self.0.to_account_info();
        let mut data = info.try_borrow_mut_data()?;
        let dst: &mut [u8] = &mut data;
        let mut writer = crate::bpf_writer::BpfWriter::new(dst);
        self.0.try_serialize(&mut writer)?;
        Ok(())
    }
}

impl<T, const P0: u128, const P1: u128> std::ops::Deref for BoltAccount<T, P0, P1> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T, const P0: u128, const P1: u128> std::ops::DerefMut for BoltAccount<T, P0, P1> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

#[cfg(feature = "idl-build")]
impl<T: anchor_lang::IdlBuild, const P0: u128, const P1: u128> anchor_lang::IdlBuild
    for BoltAccount<T, P0, P1>
{
    fn create_type() -> Option<anchor_lang::idl::types::IdlTypeDef> {
        T::create_type()
    }
    fn insert_types(
        types: &mut std::collections::BTreeMap<String, anchor_lang::idl::types::IdlTypeDef>,
    ) {
        T::insert_types(types);
    }
    fn get_full_path() -> String {
        T::get_full_path()
    }
}

pub const fn pubkey_p0(key: Pubkey) -> u128 {
    let bytes = key.to_bytes();
    u128::from_le_bytes([
        bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7], bytes[8],
        bytes[9], bytes[10], bytes[11], bytes[12], bytes[13], bytes[14], bytes[15],
    ])
}

pub const fn pubkey_p1(key: Pubkey) -> u128 {
    let bytes = key.to_bytes();
    u128::from_le_bytes([
        bytes[16], bytes[17], bytes[18], bytes[19], bytes[20], bytes[21], bytes[22], bytes[23],
        bytes[24], bytes[25], bytes[26], bytes[27], bytes[28], bytes[29], bytes[30], bytes[31],
    ])
}

pub const fn pubkey_from_u128s(p0: u128, p1: u128) -> Pubkey {
    pubkey_from_array([p0, p1])
}

pub const fn pubkey_from_array(array: [u128; 2]) -> Pubkey {
    let p0 = array[0].to_le_bytes();
    let p1 = array[1].to_le_bytes();
    Pubkey::new_from_array([
        p0[0], p0[1], p0[2], p0[3], p0[4], p0[5], p0[6], p0[7], p0[8], p0[9], p0[10], p0[11],
        p0[12], p0[13], p0[14], p0[15], p1[0], p1[1], p1[2], p1[3], p1[4], p1[5], p1[6], p1[7],
        p1[8], p1[9], p1[10], p1[11], p1[12], p1[13], p1[14], p1[15],
    ])
}