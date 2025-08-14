use crate::prelude::*;

#[inline(always)]
pub fn set_data<'info>(cpi_auth: AccountInfo<'info>, buffer: AccountInfo<'info>, component: AccountInfo<'info>) -> Result<()> {
    crate::cpi::checker(&cpi_auth)?;
    let buffer_data = buffer.try_borrow_data()?;
    component.realloc(buffer_data.len(), false)?;
    let mut component_data = component.try_borrow_mut_data()?;
    component_data.copy_from_slice(&buffer_data);
    Ok(())
}
