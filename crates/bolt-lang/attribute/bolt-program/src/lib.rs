use proc_macro::TokenStream;
use proc_macro2::TokenStream as TokenStream2;
use quote::{quote, ToTokens};
use syn::{
    parse_macro_input, parse_quote, Attribute, AttributeArgs, Field, Fields, ItemMod, ItemStruct,
    NestedMeta, Type,
};

/// This macro attribute is used to define a BOLT component.
///
/// Bolt components are themselves programs that can be called by other programs.
///
/// # Example
/// ```ignore
/// #[bolt_program(Position)]
/// #[program]
/// pub mod component_position {
///     use super::*;
/// }
///
///
/// #[component]
/// pub struct Position {
///     pub x: i64,
///     pub y: i64,
///     pub z: i64,
/// }
/// ```
#[proc_macro_attribute]
pub fn bolt_program(args: TokenStream, input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as syn::ItemMod);
    let args = parse_macro_input!(args as syn::AttributeArgs);
    let component_type =
        extract_type_name(&args).expect("Expected a component type in macro arguments");
    let modified = modify_component_module(ast, &component_type);
    let additional_macro: Attribute = parse_quote! { #[program] };
    let cpi_checker = generate_cpi_checker();
    TokenStream::from(quote! {
        #cpi_checker
        #additional_macro
        #modified
    })
}

/// Modifies the component module and adds the necessary functions and structs.
fn modify_component_module(mut module: ItemMod, component_type: &Type) -> ItemMod {
    let (initialize_fn, initialize_struct) = generate_initialize(component_type);
    let (destroy_fn, destroy_struct) = generate_destroy(component_type);
    let (update_fn, update_with_session_fn, update_struct, update_with_session_struct) =
        generate_update(component_type);

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

/// Extracts the type name from attribute arguments.
fn extract_type_name(args: &AttributeArgs) -> Option<Type> {
    args.iter().find_map(|arg| {
        if let NestedMeta::Meta(syn::Meta::Path(path)) = arg {
            Some(Type::Path(syn::TypePath {
                qself: None,
                path: path.clone(),
            }))
        } else {
            None
        }
    })
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

/// Generates the CPI checker function.
fn generate_cpi_checker() -> TokenStream2 {
    quote! {
        fn cpi_checker<'info>(cpi_auth: &AccountInfo<'info>) -> Result<()> {
            if !cpi_auth.is_signer || cpi_auth.key != &bolt_lang::world::World::cpi_auth_address() {
                return Err(BoltError::InvalidCaller.into());
            }
            Ok(())
        }
    }
}

/// Generates the destroy function and struct.
fn generate_destroy(component_type: &Type) -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn destroy(ctx: Context<Destroy>) -> Result<()> {
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

                cpi_checker(&ctx.accounts.cpi_auth.to_account_info())?;

                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct Destroy<'info> {
                #[account()]
                pub cpi_auth: Signer<'info>,
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
                pub system_program: Program<'info, System>,
            }
        },
    )
}

/// Generates the initialize function and struct.
fn generate_initialize(component_type: &Type) -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
                cpi_checker(&ctx.accounts.cpi_auth.to_account_info())?;
                ctx.accounts.data.set_inner(<#component_type>::default());
                ctx.accounts.data.bolt_metadata.authority = *ctx.accounts.authority.key;
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct Initialize<'info>  {
                #[account()]
                pub cpi_auth: Signer<'info>,
                #[account(mut)]
                pub payer: Signer<'info>,
                #[account(init_if_needed, payer = payer, space = <#component_type>::size(), seeds = [<#component_type>::seed(), entity.key().as_ref()], bump)]
                pub data: Account<'info, #component_type>,
                #[account()]
                pub entity: Account<'info, Entity>,
                #[account()]
                pub authority: AccountInfo<'info>,
                pub system_program: Program<'info, System>,
            }
        },
    )
}

/// Generates the instructions and related structs to inject in the component.
fn generate_update(
    component_type: &Type,
) -> (TokenStream2, TokenStream2, TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn update(ctx: Context<Update>, data: Vec<u8>) -> Result<()> {
                require!(ctx.accounts.bolt_component.bolt_metadata.authority == World::id() || (ctx.accounts.bolt_component.bolt_metadata.authority == *ctx.accounts.authority.key && ctx.accounts.authority.is_signer), BoltError::InvalidAuthority);

                cpi_checker(&ctx.accounts.cpi_auth.to_account_info())?;

                ctx.accounts.bolt_component.set_inner(<#component_type>::try_from_slice(&data)?);
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            pub fn update_with_session(ctx: Context<UpdateWithSession>, data: Vec<u8>) -> Result<()> {
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

                cpi_checker(&ctx.accounts.cpi_auth.to_account_info())?;

                ctx.accounts.bolt_component.set_inner(<#component_type>::try_from_slice(&data)?);
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct Update<'info> {
                #[account()]
                pub cpi_auth: Signer<'info>,
                #[account(mut)]
                pub bolt_component: Account<'info, #component_type>,
                #[account()]
                pub authority: Signer<'info>,
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct UpdateWithSession<'info> {
                #[account()]
                pub cpi_auth: Signer<'info>,
                #[account(mut)]
                pub bolt_component: Account<'info, #component_type>,
                #[account()]
                pub authority: Signer<'info>,
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
