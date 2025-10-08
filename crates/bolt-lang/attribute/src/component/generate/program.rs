use heck::ToPascalCase;
use quote::{quote, ToTokens};

use proc_macro2::TokenStream as TokenStream2;
use syn::{
    parse_quote, spanned::Spanned, Attribute, Field, Fields, ItemMod, ItemStruct, LitByteStr, Type
};

pub fn remove_component_attributes(attrs: &mut Vec<syn::Attribute>) {
    attrs.retain(|attr| !attr.path.is_ident("component"));
}

pub fn generate_instructions(
    program_mod: &mut ItemMod,
    attributes: &crate::component::Attributes,
    pascal_case_name: &syn::Ident,
    component_name: Option<&String>,
) {
    let component_type = Type::Path(syn::TypePath {
        qself: None,
        path: pascal_case_name.clone().into(),
    });
    if attributes.delegate {
        program_mod
            .attrs
            .insert(0, syn::parse_quote! { #[bolt_lang::delegate] });
    }
    modify_component_module(program_mod, &component_type, component_name)
}

/// Modifies the component module and adds the necessary functions and structs.
fn modify_component_module(
    module: &mut ItemMod,
    component_type: &Type,
    component_name: Option<&String>,
) {
    let (initialize_fn, initialize_struct) = generate_initialize(component_type, component_name);
    let (destroy_fn, destroy_struct) = generate_destroy(component_type, component_name);

    module.content.as_mut().map(|(brace, items)| {
        items.extend(
            vec![
                initialize_fn,
                initialize_struct,
                destroy_fn,
                destroy_struct,
            ]
            .into_iter()
            .map(|item| syn::parse2(item).unwrap())
            .collect::<Vec<_>>(),
        );

        let modified_items: Vec<syn::Item> = items
            .iter_mut()
            .map(|item| match item.clone() {
                syn::Item::Struct(mut struct_item)
                    if struct_item.ident == "Apply" || struct_item.ident == "ApplyWithSession" =>
                {
                    modify_apply_struct(&mut struct_item);
                    syn::Item::Struct(struct_item)
                }
                _ => item.clone(),
            })
            .collect();
        (brace, modified_items)
    });
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
fn generate_destroy(
    component_type: &Type,
    component_name: Option<&String>,
) -> (TokenStream2, TokenStream2) {
    let structure_name = if let Some(name) = component_name {
        syn::Ident::new(
            &format!("{}Destroy", name.to_pascal_case()),
            component_type.span(),
        )
    } else {
        syn::Ident::new("Destroy", component_type.span())
    };
    let fn_destroy = if let Some(name) = component_name {
        syn::Ident::new(&format!("{}_destroy", name), component_type.span())
    } else {
        syn::Ident::new("destroy", component_type.span())
    };
    // Build PDA seeds, adding component name when bundled
    let seeds_tokens = if let Some(name) = component_name {
        let name_bytes = LitByteStr::new(name.as_bytes(), component_type.span());
        quote! { [#name_bytes, entity.key().as_ref()] }
    } else {
        quote! { [<#component_type>::seed(), entity.key().as_ref()] }
    };

    (
        quote! {
            pub fn #fn_destroy(ctx: Context<#structure_name>) -> Result<()> {
                bolt_lang::instructions::destroy(&crate::id(), &ctx.accounts.cpi_auth.to_account_info(), &ctx.accounts.authority.to_account_info(), &ctx.accounts.component_program_data, ctx.accounts.component.bolt_metadata.authority)
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct #structure_name<'info> {
                #[account()]
                pub authority: Signer<'info>,
                #[account(mut)]
                pub receiver: AccountInfo<'info>,
                #[account()]
                pub entity: Account<'info, Entity>,
                #[account(mut, close = receiver, seeds = #seeds_tokens, bump)]
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
fn generate_initialize(
    component_type: &Type,
    component_name: Option<&String>,
) -> (TokenStream2, TokenStream2) {
    let structure_name = if let Some(name) = component_name {
        syn::Ident::new(
            &format!("{}Initialize", name.to_pascal_case()),
            component_type.span(),
        )
    } else {
        syn::Ident::new("Initialize", component_type.span())
    };
    let fn_initialize = if let Some(name) = component_name {
        syn::Ident::new(&format!("{}_initialize", name), component_type.span())
    } else {
        syn::Ident::new("initialize", component_type.span())
    };
    // Build PDA seeds, adding component name when bundled
    let seeds_tokens = if let Some(name) = component_name {
        let name_bytes = LitByteStr::new(name.as_bytes(), component_type.span());
        quote! { [#name_bytes, entity.key().as_ref()] }
    } else {
        quote! { [<#component_type>::seed(), entity.key().as_ref()] }
    };

    (
        quote! {
            #[automatically_derived]
            pub fn #fn_initialize(ctx: Context<#structure_name>) -> Result<()> {
                bolt_lang::instructions::initialize(&ctx.accounts.cpi_auth.to_account_info(), &mut ctx.accounts.data)?;
                ctx.accounts.data.bolt_metadata.authority = *ctx.accounts.authority.key;
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct #structure_name<'info>  {
                #[account()]
                pub cpi_auth: Signer<'info>,
                #[account(mut)]
                pub payer: Signer<'info>,
                #[account(init_if_needed, payer = payer, space = <#component_type>::size(), seeds = #seeds_tokens, bump)]
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
pub fn generate_update(module: &mut ItemMod) {
    let update_fn = quote! {
        #[automatically_derived]
        pub fn update(ctx: Context<Update>, data: Vec<u8>) -> Result<()> {
            let bolt_metadata = BoltMetadata::try_from_account_info(&ctx.accounts.bolt_component)?;
            bolt_lang::instructions::update(&ctx.accounts.cpi_auth.to_account_info(), &ctx.accounts.authority.to_account_info(), bolt_metadata.authority, &mut ctx.accounts.bolt_component, &data)?;
            Ok(())
        }
    };
    let update_with_session_fn = quote! {
            #[automatically_derived]
            pub fn update_with_session(ctx: Context<UpdateWithSession>, data: Vec<u8>) -> Result<()> {
                let bolt_metadata = BoltMetadata::try_from_account_info(&ctx.accounts.bolt_component)?;
                bolt_lang::instructions::update_with_session(&ctx.accounts.cpi_auth.to_account_info(), &ctx.accounts.authority, bolt_metadata.authority, &mut ctx.accounts.bolt_component, &ctx.accounts.session_token, &data)?;
                Ok(())
            }
        };
    let update_struct = quote! {
        #[automatically_derived]
        #[derive(Accounts)]
        pub struct Update<'info> {
            #[account()]
            pub cpi_auth: Signer<'info>,
            #[account(mut)]
            pub bolt_component: AccountInfo<'info>,
            #[account()]
            pub authority: Signer<'info>,
        }
    };
    let update_with_session_struct = quote! {
        #[automatically_derived]
        #[derive(Accounts)]
        pub struct UpdateWithSession<'info> {
            #[account()]
            pub cpi_auth: Signer<'info>,
            #[account(mut)]
            pub bolt_component: AccountInfo<'info>,
            #[account()]
            pub authority: Signer<'info>,
            #[account(constraint = session_token.to_account_info().owner == &bolt_lang::session_keys::ID)]
            pub session_token: Account<'info, bolt_lang::session_keys::SessionToken>,
        }
    };
    module.content.as_mut().map(|(brace, items)| {
        items.extend(
            vec![update_fn, update_struct, update_with_session_fn, update_with_session_struct]
                .into_iter()
                .map(|item| syn::parse2(item).unwrap())
                .collect::<Vec<_>>(),
        );
        (brace, items.clone())
    });
}

/// Checks if the field is expecting a program.
fn is_expecting_program(field: &Field) -> bool {
    field.ty.to_token_stream().to_string().contains("Program")
}
