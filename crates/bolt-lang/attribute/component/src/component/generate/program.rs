use heck::ToSnakeCase;
use syn::DeriveInput;
use quote::{quote, ToTokens};

pub fn generate_program(type_: &DeriveInput, attributes: &crate::component::Attributes) -> proc_macro2::TokenStream {
    let pascal_case_name = &type_.ident;
    let snake_case_name = pascal_case_name.to_string().to_snake_case();
    let component_name = syn::Ident::new(&snake_case_name, type_.ident.span());

    let program_mod: syn::ItemMod = if attributes.delegate {
        parse_quote! {
            #[delegate(#pascal_case_name)]
            pub mod #component_name {
                use super::*;
            }
        }
    } else {
        parse_quote! {
            pub mod #component_name {
                use super::*;
            }
        }
    };
    generate_instructions(program_mod, pascal_case_name).into()
}

use proc_macro::TokenStream;
use proc_macro2::TokenStream as TokenStream2;
use syn::{
    parse_quote, spanned::Spanned, Attribute, Field, Fields, ItemMod, ItemStruct, Type
};

fn generate_instructions(ast: ItemMod, pascal_case_name: &syn::Ident) -> TokenStream {
    let component_type = Type::Path(syn::TypePath {
        qself: None,
        path: pascal_case_name.clone().into(),
    });
    let modified = modify_component_module(ast, &component_type);
    let additional_macro: Attribute = parse_quote! { #[program] };
    TokenStream::from(quote! {
        #additional_macro
        #modified
    })
}

/// Modifies the component module and adds the necessary functions and structs.
fn modify_component_module(mut module: ItemMod, component_type: &Type) -> ItemMod {
    let (initialize_fn, initialize_struct) = generate_initialize(component_type, None);
    let (destroy_fn, destroy_struct) = generate_destroy(component_type, None);
    let (update_fn, update_with_session_fn, update_struct, update_with_session_struct) =
        generate_update(component_type, None);

    module.content = module.content.map(|(brace, mut items)| {
        items.extend(
            vec![
                initialize_fn,
                initialize_struct,
                update_fn,
                update_struct,
                update_with_session_fn,
                update_with_session_struct,
                destroy_fn,
                destroy_struct,
            ]
            .into_iter()
            .map(|item| syn::parse2(item).unwrap())
            .collect::<Vec<_>>(),
        );

        let modified_items = items
            .into_iter()
            .map(|item| match item {
                syn::Item::Struct(mut struct_item)
                    if struct_item.ident == "Apply" || struct_item.ident == "ApplyWithSession" =>
                {
                    modify_apply_struct(&mut struct_item);
                    syn::Item::Struct(struct_item)
                }
                _ => item,
            })
            .collect();
        (brace, modified_items)
    });

    module
}

/// Modifies the Apply struct, change the bolt system to accept any compatible system.
fn modify_apply_struct(struct_item: &mut ItemStruct) {
    if let Fields::Named(fields_named) = &mut struct_item.fields {
        fields_named
            .named
            .iter_mut()
            .filter(|field| is_expecting_program(field))
            .for_each(|field| {
                field.ty = syn::parse_str("UncheckedAccount<'info>").expect("Failed to parse type");
                field.attrs.push(create_check_attribute());
            });
    }
}

/// Creates the check attribute.
fn create_check_attribute() -> Attribute {
    parse_quote! {
        #[doc = "CHECK: This program can modify the data of the component"]
    }
}

/// Generates the destroy function and struct.
fn generate_destroy(component_type: &Type, component_name: Option<String>) -> (TokenStream2, TokenStream2) {
    let fn_destroy = if let Some(name) = component_name {
        syn::Ident::new(&format!("{}_destroy", name), component_type.span())
    } else {
        syn::Ident::new("destroy", component_type.span())
    };
    (
        quote! {
            #[automatically_derived]
            pub fn #fn_destroy(ctx: Context<Destroy>) -> Result<()> {
<<<<<<< HEAD
                let program_data_address =
                    Pubkey::find_program_address(&[crate::id().as_ref()], &bolt_lang::prelude::solana_program::bpf_loader_upgradeable::id()).0;

                if !program_data_address.eq(ctx.accounts.component_program_data.key) {
                    return Err(BoltError::InvalidAuthority.into());
                }

                let program_account_data = ctx.accounts.component_program_data.try_borrow_data()?;
                let upgrade_authority = if let bolt_lang::prelude::solana_program::bpf_loader_upgradeable::UpgradeableLoaderState::ProgramData {
                    upgrade_authority_address,
                    ..
                } =
                    bolt_lang::prelude::bincode::deserialize(&program_account_data).map_err(|_| BoltError::InvalidAuthority)?
                {
                    Ok(upgrade_authority_address)
                } else {
                    Err(anchor_lang::error::Error::from(BoltError::InvalidAuthority))
                }?.ok_or_else(|| BoltError::InvalidAuthority)?;

                if ctx.accounts.authority.key != &ctx.accounts.component.bolt_metadata.authority && ctx.accounts.authority.key != &upgrade_authority {
                    return Err(BoltError::InvalidAuthority.into());
                }

                let instruction = anchor_lang::solana_program::sysvar::instructions::get_instruction_relative(
                    0, &ctx.accounts.instruction_sysvar_account.to_account_info()
                ).map_err(|_| BoltError::InvalidCaller)?;
                if instruction.program_id != World::id() {
                    return Err(BoltError::InvalidCaller.into());
                }
                Ok(())
=======
                bolt_lang::instructions::destroy(&crate::id(), &ctx.accounts.cpi_auth.to_account_info(), &ctx.accounts.authority.to_account_info(), &ctx.accounts.component_program_data, ctx.accounts.component.bolt_metadata.authority)
>>>>>>> 8caeec5 (:recycle: Moving component instructions implementation to bolt-lang)
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct Destroy<'info> {
                #[account()]
                pub authority: Signer<'info>,
                #[account(mut)]
                pub receiver: AccountInfo<'info>,
                #[account()]
                pub entity: Account<'info, Entity>,
                #[account(mut, close = receiver, seeds = [<#component_type>::seed(), entity.key().as_ref()], bump)]
                pub component: Account<'info, #component_type>,
                #[account()]
                pub component_program_data: AccountInfo<'info>,
                #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
                pub instruction_sysvar_account: AccountInfo<'info>,
                pub system_program: Program<'info, System>,
            }
        },
    )
}

/// Generates the initialize function and struct.
fn generate_initialize(component_type: &Type, component_name: Option<String>) -> (TokenStream2, TokenStream2) {
    let fn_initialize = if let Some(name) = component_name {
        syn::Ident::new(&format!("{}_initialize", name), component_type.span())
    } else {
        syn::Ident::new("initialize", component_type.span())
    };
    (
        quote! {
            #[automatically_derived]
<<<<<<< HEAD
            pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
                let instruction = anchor_lang::solana_program::sysvar::instructions::get_instruction_relative(
                    0, &ctx.accounts.instruction_sysvar_account.to_account_info()
                ).map_err(|_| BoltError::InvalidCaller)?;
                if instruction.program_id != World::id() {
                    return Err(BoltError::InvalidCaller.into());
                }
                ctx.accounts.data.set_inner(<#component_type>::default());
=======
            pub fn #fn_initialize(ctx: Context<Initialize>) -> Result<()> {
                bolt_lang::instructions::initialize(&ctx.accounts.cpi_auth.to_account_info(), &mut ctx.accounts.data)?;
>>>>>>> 8caeec5 (:recycle: Moving component instructions implementation to bolt-lang)
                ctx.accounts.data.bolt_metadata.authority = *ctx.accounts.authority.key;
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct Initialize<'info>  {
                #[account(mut)]
                pub payer: Signer<'info>,
                #[account(init_if_needed, payer = payer, space = <#component_type>::size(), seeds = [<#component_type>::seed(), entity.key().as_ref()], bump)]
                pub data: Account<'info, #component_type>,
                #[account()]
                pub entity: Account<'info, Entity>,
                #[account()]
                pub authority: AccountInfo<'info>,
                #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
                pub instruction_sysvar_account: UncheckedAccount<'info>,
                pub system_program: Program<'info, System>,
            }
        },
    )
}

/// Generates the instructions and related structs to inject in the component.
fn generate_update(
    component_type: &Type,
    component_name: Option<String>,
) -> (TokenStream2, TokenStream2, TokenStream2, TokenStream2) {
    let fn_update = if let Some(name) = &component_name {
        syn::Ident::new(&format!("{}_update", name), component_type.span())
    } else {
        syn::Ident::new("update", component_type.span())
    };
    let fn_update_with_session = if let Some(name) = &component_name {
        syn::Ident::new(&format!("{}_update_with_session", name), component_type.span())
    } else {
        syn::Ident::new("update_with_session", component_type.span())
    };
    (
        quote! {
            #[automatically_derived]
            pub fn #fn_update(ctx: Context<Update>, data: Vec<u8>) -> Result<()> {
<<<<<<< HEAD
                require!(ctx.accounts.bolt_component.bolt_metadata.authority == World::id() || (ctx.accounts.bolt_component.bolt_metadata.authority == *ctx.accounts.authority.key && ctx.accounts.authority.is_signer), BoltError::InvalidAuthority);

                // Check if the instruction is called from the world program
                let instruction = anchor_lang::solana_program::sysvar::instructions::get_instruction_relative(
                    0, &ctx.accounts.instruction_sysvar_account.to_account_info()
                ).map_err(|_| BoltError::InvalidCaller)?;
                require_eq!(instruction.program_id, World::id(), BoltError::InvalidCaller);

                ctx.accounts.bolt_component.set_inner(<#component_type>::try_from_slice(&data)?);
=======
                bolt_lang::instructions::update(&ctx.accounts.cpi_auth.to_account_info(), &ctx.accounts.authority.to_account_info(), ctx.accounts.bolt_component.bolt_metadata.authority, &mut ctx.accounts.bolt_component, &data)?;
>>>>>>> 8caeec5 (:recycle: Moving component instructions implementation to bolt-lang)
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            pub fn #fn_update_with_session(ctx: Context<UpdateWithSession>, data: Vec<u8>) -> Result<()> {
<<<<<<< HEAD
                if ctx.accounts.bolt_component.bolt_metadata.authority == World::id() {
                    require!(Clock::get()?.unix_timestamp < ctx.accounts.session_token.valid_until, bolt_lang::session_keys::SessionError::InvalidToken);
                } else {
                    let validity_ctx = bolt_lang::session_keys::ValidityChecker {
                        session_token: ctx.accounts.session_token.clone(),
                        session_signer: ctx.accounts.authority.clone(),
                        authority: ctx.accounts.bolt_component.bolt_metadata.authority.clone(),
                        target_program: World::id(),
                    };
                    require!(ctx.accounts.session_token.validate(validity_ctx)?, bolt_lang::session_keys::SessionError::InvalidToken);
                    require_eq!(ctx.accounts.bolt_component.bolt_metadata.authority, ctx.accounts.session_token.authority, bolt_lang::session_keys::SessionError::InvalidToken);
                }

                // Check if the instruction is called from the world program
                let instruction = anchor_lang::solana_program::sysvar::instructions::get_instruction_relative(
                    0, &ctx.accounts.instruction_sysvar_account.to_account_info()
                ).map_err(|_| BoltError::InvalidCaller)?;
                require_eq!(instruction.program_id, World::id(), BoltError::InvalidCaller);

                ctx.accounts.bolt_component.set_inner(<#component_type>::try_from_slice(&data)?);
=======
                bolt_lang::instructions::update_with_session(&ctx.accounts.cpi_auth.to_account_info(), &ctx.accounts.authority, ctx.accounts.bolt_component.bolt_metadata.authority, &mut ctx.accounts.bolt_component, &ctx.accounts.session_token, &data)?;
>>>>>>> 8caeec5 (:recycle: Moving component instructions implementation to bolt-lang)
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct Update<'info> {
                #[account(mut)]
                pub bolt_component: Account<'info, #component_type>,
                #[account()]
                pub authority: Signer<'info>,
                #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
                pub instruction_sysvar_account: UncheckedAccount<'info>
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct UpdateWithSession<'info> {
                #[account(mut)]
                pub bolt_component: Account<'info, #component_type>,
                #[account()]
                pub authority: Signer<'info>,
                #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
                pub instruction_sysvar_account: UncheckedAccount<'info>,
                #[account(constraint = session_token.to_account_info().owner == &bolt_lang::session_keys::ID)]
                pub session_token: Account<'info, bolt_lang::session_keys::SessionToken>,
            }
        },
    )
}

/// Checks if the field is expecting a program.
fn is_expecting_program(field: &Field) -> bool {
    field.ty.to_token_stream().to_string().contains("Program")
}
