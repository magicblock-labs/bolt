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
/// #[account]
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
    TokenStream::from(quote! {
        #additional_macro
        #modified
    })
}

/// Modifies the component module and adds the necessary functions and structs.
fn modify_component_module(mut module: ItemMod, component_type: &Type) -> ItemMod {
    let (initialize_fn, initialize_struct) = generate_initialize(component_type);
    //let (apply_fn, apply_struct, apply_impl, update_fn, update_struct) = generate_instructions(component_type);
    let (update_fn, update_struct) = generate_update(component_type);

    module.content = module.content.map(|(brace, mut items)| {
        items.extend(
            vec![initialize_fn, initialize_struct, update_fn, update_struct]
                .into_iter()
                .map(|item| syn::parse2(item).unwrap())
                .collect::<Vec<_>>(),
        );

        let modified_items = items
            .into_iter()
            .map(|item| match item {
                syn::Item::Struct(mut struct_item) if struct_item.ident == "Apply" => {
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

/// Generates the initialize function and struct.
fn generate_initialize(component_type: &Type) -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
                let instruction = anchor_lang::solana_program::sysvar::instructions::get_instruction_relative(
                    0, &ctx.accounts.instruction_sysvar_account.to_account_info()
                ).unwrap();
                if instruction.program_id != World::id() {
                    return Err(BoltError::InvalidCaller.into());
                }
                ctx.accounts.data.set_inner(<#component_type>::default());
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
fn generate_update(component_type: &Type) -> (TokenStream2, TokenStream2) {
    (
        quote! {
            #[automatically_derived]
            pub fn update(ctx: Context<Update>, data: Vec<u8>) -> Result<()> {
                // Check if the instruction is called from the world program
                let instruction = anchor_lang::solana_program::sysvar::instructions::get_instruction_relative(
                    0, &ctx.accounts.instruction_sysvar_account.to_account_info()
                ).unwrap();
                if instruction.program_id != World::id() {
                    return Err(BoltError::InvalidCaller.into());
                }
                // Check if the authority is authorized to modify the data
                if ctx.accounts.bolt_component.bolt_metadata.authority != World::id() && (ctx.accounts.bolt_component.bolt_metadata.authority != *ctx.accounts.authority.key || !ctx.accounts.authority.is_signer) {
                    return Err(BoltError::InvalidAuthority.into());
                }

                ctx.accounts.bolt_component.set_inner(<#component_type>::try_from_slice(&data)?);
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
                /// CHECK: The authority of the component
                pub authority: AccountInfo<'info>,
                #[account(address = anchor_lang::solana_program::sysvar::instructions::id())]
                pub instruction_sysvar_account: UncheckedAccount<'info>,
            }
        },
    )
}

/// Checks if the field is expecting a program.
fn is_expecting_program(field: &Field) -> bool {
    field.ty.to_token_stream().to_string().contains("Program")
}
