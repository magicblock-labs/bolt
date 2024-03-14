use proc_macro::TokenStream;

use quote::quote;
use syn::{parse_macro_input, Fields, ItemStruct, LitStr};

/// This macro attribute is used to define a BOLT system extra accounts.
///
/// The extra account struct define the accounts (which are not components), that the system expect.
///
///
/// # Example
/// ```ignore
///#[extra_accounts]
///pub struct ExtraAccounts {
/// #[account(address = bolt_lang::solana_program::sysvar::clock::id())]
/// pub clock: AccountInfo<'info>,
/// #[account(address = pubkey!("CbHEFbSQdRN4Wnoby9r16umnJ1zWbULBHg4yqzGQonU1"), signer)]
/// pub my_account: AccountInfo<'info>,
/// #[account(address = Metadata::id())]
/// pub metadata_program: Program<'info, Metadata>,
///}
///
/// ```
#[proc_macro_attribute]
pub fn extra_accounts(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as ItemStruct);
    let extra_accounts_struct_name = &input.ident;

    // Ensure the struct has named fields
    let fields = match &input.fields {
        Fields::Named(fields) => &fields.named,
        _ => panic!("extra_accounts macro only supports structs with named fields"),
    };

    // Transform fields for the struct definition
    let transformed_fields = fields.iter().map(|f| {
        let field_name = &f.ident;
        let attrs = &f.attrs;
        quote! {
            #(#attrs)*
            pub #field_name: AccountInfo<'info>,
        }
    });

    // Generate the new struct with the Accounts derive and transformed fields
    let output_struct = quote! {
        #[derive(Accounts)]
        pub struct #extra_accounts_struct_name<'info> {
            #(#transformed_fields)*
        }
    };

    // Generate the trait for the helper functions
    let helper_functions = fields.iter().map(|f| {
        let field_name = &f.ident;
        quote! {
            fn #field_name(&self) -> Result<&'c AccountInfo<'info>>;
        }
    });

    let output_trait = quote! {
        pub trait ContextExtensions<'a, 'b, 'c, 'info, T>
        {
            #(#helper_functions)*
        }
    };

    // Generate the helper functions for the struct
    let helper_functions_impl = fields.iter().enumerate().map(|(index, f)| {
        let field_name = &f.ident;
        let index = syn::Index::from(index); // Create a compile-time index representation
        quote! {
            fn #field_name(&self) -> Result<&'c AccountInfo<'info>> {
                self.remaining_accounts.get(#index).ok_or_else(|| ErrorCode::ConstraintAccountIsNone.into())
            }
        }
    });

    let output_trait_implementation = quote! {
        impl<'a, 'b, 'c, 'info, T: bolt_lang::Bumps> ContextExtensions<'a, 'b, 'c, 'info, T> for Context<'a, 'b, 'c, 'info, T> {
            #(#helper_functions_impl)*
        }
    };

    // Combine the struct definition and its implementation into the final TokenStream
    let output = quote! {
        #output_struct
        #output_trait
        #output_trait_implementation
    };

    TokenStream::from(output)
}

#[proc_macro]
pub fn pubkey(input: TokenStream) -> TokenStream {
    let input_lit_str = parse_macro_input!(input as LitStr);
    let pubkey_str = input_lit_str.value();

    // Example using solana_program to create a Pubkey from a string
    let expanded = quote! {
        bolt_lang::pubkey_from_str(#pubkey_str)
    };

    TokenStream::from(expanded)
}
