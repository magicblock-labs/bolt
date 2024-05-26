use proc_macro::TokenStream;

use proc_macro2::TokenStream as TokenStream2;
use quote::{quote};
use syn::{
    AttributeArgs, ItemMod, NestedMeta,
    parse_macro_input, Type,
};

/// This macro attribute is used to inject instructions and struct needed to delegate BOLT component.
///
/// Components can be delegate in order to be updated in an Ephemeral Rollup
///
/// # Example
/// ```ignore
///
/// #[component(delegate)]
/// pub struct Position {
///     pub x: i64,
///     pub y: i64,
///     pub z: i64,
/// }
/// ```
#[proc_macro_attribute]
pub fn delegate(args: TokenStream, input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as syn::ItemMod);
    let args = parse_macro_input!(args as syn::AttributeArgs);
    let component_type = extract_type_name(&args).expect("Expected a component type in macro arguments");
    let modified = modify_component_module(ast, &component_type);
    TokenStream::from(quote! {
        #modified
    })
}

/// Modifies the component module and adds the necessary functions and structs.
fn modify_component_module(mut module: ItemMod, component_type: &Type) -> ItemMod {
    let (delegate_fn, delegate_struct) = generate_delegate(component_type);
    let (undelegate_fn, undelegate_struct) = generate_undelegate();
    module.content = module.content.map(|(brace, mut items)| {
        items.extend(
            vec![delegate_fn, delegate_struct, undelegate_fn, undelegate_struct]
                .into_iter()
                .map(|item| syn::parse2(item).unwrap())
                .collect::<Vec<_>>(),
        );
        (brace, items)
    });
    module
}

/// Generates the undelegate function and struct.
fn generate_undelegate() -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn process_undelegation(ctx: Context<InitializeAfterUndelegation>, account_seeds: Vec<Vec<u8>>) -> Result<()> {
                let [delegated_account, buffer, payer, system_program] = [
                    &ctx.accounts.base_account,
                    &ctx.accounts.buffer,
                    &ctx.accounts.payer,
                    &ctx.accounts.system_program,
                ];
                undelegate_account(
                    delegated_account,
                    &id(),
                    buffer,
                    payer,
                    system_program,
                    account_seeds,
                )?;
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
                pub struct InitializeAfterUndelegation<'info> {
                /// CHECK:`
                #[account(mut)]
                pub base_account: AccountInfo<'info>,
                /// CHECK:`
                #[account()]
                pub buffer: AccountInfo<'info>,
                /// CHECK:
                #[account(mut)]
                pub payer: AccountInfo<'info>,
                /// CHECK:
                pub system_program: AccountInfo<'info>,
            }
        },
    )
}

/// Generates the delegate instruction and related structs to inject in the component.
fn generate_delegate(component_type: &Type) -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {

                let [payer, entity, account, owner_program, buffer, delegation_record, delegate_account_seeds, delegation_program, system_program] = [
                    &ctx.accounts.payer,
                    &ctx.accounts.entity.to_account_info(),
                    &ctx.accounts.account,
                    &ctx.accounts.owner_program,
                    &ctx.accounts.buffer,
                    &ctx.accounts.delegation_record,
                    &ctx.accounts.delegate_account_seeds,
                    &ctx.accounts.delegation_program,
                    &ctx.accounts.system_program,
                ];

                let pda_seeds: &[&[u8]] = &[<#component_type>::seed(), &entity.key.to_bytes()];

                delegate_account(
                    payer,
                    account,
                    owner_program,
                    buffer,
                    delegation_record,
                    delegate_account_seeds,
                    delegation_program,
                    system_program,
                    pda_seeds,
                )?;
                Ok(())
            }
        },
        quote! {
            #[automatically_derived]
            #[derive(Accounts)]
            pub struct DelegateInput<'info> {
                pub payer: Signer<'info>,
                #[account()]
                pub entity: Account<'info, Entity>,
                /// CHECK:
                #[account(mut)]
                pub account: AccountInfo<'info>,
                /// CHECK:`
                pub owner_program: AccountInfo<'info>,
                /// CHECK:
                #[account(mut)]
                pub buffer: AccountInfo<'info>,
                /// CHECK:`
                #[account(mut)]
                pub delegation_record: AccountInfo<'info>,
                /// CHECK:`
                #[account(mut)]
                pub delegate_account_seeds: AccountInfo<'info>,
                /// CHECK:`
                pub delegation_program: AccountInfo<'info>,
                /// CHECK:`
                pub system_program: AccountInfo<'info>,
            }
        },
    )
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