use proc_macro::TokenStream;

use quote::quote;
use syn::{parse_macro_input, Fields, ItemStruct, Lit, Meta, NestedMeta};

/// This macro attribute is used to define a BOLT system input.
///
/// The input can be defined as a struct and will be transformed into an Anchor context.
///
///
/// # Example
/// ```ignore
///#[system_input]
///pub struct Components {
///    pub position: Position,
///}
///
/// ```
#[proc_macro_attribute]
pub fn system_input(_attr: TokenStream, item: TokenStream) -> TokenStream {
    // Parse the input TokenStream (the struct) into a Rust data structure
    let input = parse_macro_input!(item as ItemStruct);

    // Ensure the struct has named fields
    let fields = match &input.fields {
        Fields::Named(fields) => &fields.named,
        _ => panic!("system_input macro only supports structs with named fields"),
    };
    let name = &input.ident;

    // Collect imports for components
    let components_imports: Vec<_> = fields
        .iter()
        .filter_map(|field| {
            field.attrs.iter().find_map(|attr| {
                if let Ok(Meta::List(meta_list)) = attr.parse_meta() {
                    if meta_list.path.is_ident("component_id") {
                        meta_list.nested.first().and_then(|nested_meta| {
                            if let NestedMeta::Lit(Lit::Str(lit_str)) = nested_meta {
                                let component_type =
                                    format!("bolt_types::Component{}", lit_str.value());
                                if let Ok(parsed_component_type) =
                                    syn::parse_str::<syn::Type>(&component_type)
                                {
                                    let field_type = &field.ty;
                                    let component_import = quote! {
                                        use #parsed_component_type as #field_type;
                                    };
                                    return Some(component_import);
                                }
                            }
                            None
                        })
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
        })
        .collect();

    let bolt_accounts = fields.iter().map(|f| {
        let field_type = &f.ty;
        quote! {
            pub type #field_type = bolt_lang::account::BoltAccount<super::#field_type, { bolt_lang::account::pubkey_p0(crate::ID) }, { bolt_lang::account::pubkey_p1(crate::ID) }>;
        }
    });

    // Transform fields for the struct definition
    let transformed_fields = fields.iter().map(|f| {
        let field_name = &f.ident;
        let field_type = &f.ty;
        quote! {
            #[account(mut)]
            pub #field_name: Account<'info, bolt_accounts::#field_type>,
        }
    });

    // Generate the new struct with the Accounts derive and transformed fields
    let output_struct = quote! {
        #[derive(Accounts)]
        pub struct #name<'info> {
            #(#transformed_fields)*
            /// CHECK: Authority check
            #[account()]
            pub authority: AccountInfo<'info>,
        }
    };

    let try_from_fields = fields.iter().enumerate().map(|(i, f)| {
        let field_name = &f.ident;
        quote! {
            #field_name: {
                Account::try_from(context.remaining_accounts.as_ref().get(#i).ok_or_else(|| ErrorCode::ConstraintAccountIsNone)?)?
            },
        }
    });

    let number_of_components = fields.len();

    let output_trait = quote! {
        pub trait NumberOfComponents<'a, 'b, 'c, 'info, T> {
            const NUMBER_OF_COMPONENTS: usize;
        }
    };

    let output_trait_implementation = quote! {
        impl<'a, 'b, 'c, 'info, T: bolt_lang::Bumps> NumberOfComponents<'a, 'b, 'c, 'info, T> for Context<'a, 'b, 'c, 'info, T> {
            const NUMBER_OF_COMPONENTS: usize = #number_of_components;
        }
    };

    // Generate the implementation of try_from for the struct
    let output_impl = quote! {
        impl<'info> #name<'info> {
            fn try_from<'a, 'b>(context: &Context<'a, 'b, 'info, 'info, VariadicBoltComponents<'info>>) -> Result<Self> {
                Ok(Self {
                    authority: context.accounts.authority.clone(),
                    #(#try_from_fields)*
                })
            }
        }
    };

    // Combine the struct definition and its implementation into the final TokenStream
    let output = quote! {
        mod bolt_accounts {
            #(#bolt_accounts)*
        }

        #output_struct
        #output_impl
        #output_trait
        #output_trait_implementation
        #(#components_imports)*

        #[derive(Accounts)]
        pub struct VariadicBoltComponents<'info> {
            /// CHECK: Authority check
            #[account()]
            pub authority: AccountInfo<'info>,
        }
    };

    TokenStream::from(output)
}
