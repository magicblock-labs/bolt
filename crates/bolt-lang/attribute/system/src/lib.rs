use proc_macro::TokenStream;
use proc_macro2::Ident;
use quote::quote;
use syn::{
    parse_macro_input, parse_quote, visit_mut::VisitMut, Expr, GenericArgument, ItemFn, ItemMod,
    PathArguments, ReturnType, Stmt, Type, TypePath,
};

struct SystemTransform;

/// This macro attribute is used to define a BOLT system.
///
/// Bolt components are themselves programs. The macro adds parsing and serialization
///
/// # Example
/// ```ignore
/// #[system]
/// #[program]
/// pub mod system_fly {
///     use super::*;
///
///     pub fn execute(ctx: Context<Component>, _args: Vec<u8>) -> Result<Position> {
///         let pos = Position {
///             x: ctx.accounts.position.x,
///             y: ctx.accounts.position.y,
///             z: ctx.accounts.position.z + 1,
///         };
///         Ok(pos)
///     }
/// }
/// ```
#[proc_macro_attribute]
pub fn system(attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut input = parse_macro_input!(item as ItemMod);
    let _attr = parse_macro_input!(attr as syn::AttributeArgs);
    let mut transform = SystemTransform;
    transform.visit_item_mod_mut(&mut input);
    TokenStream::from(quote! { #input })
}

/// Visits the AST and modifies the system function
impl VisitMut for SystemTransform {
    // Modify the return instruction to return Result<Vec<u8>>
    fn visit_expr_mut(&mut self, expr: &mut Expr) {
        if let Some(inner_variable) = Self::extract_inner_ok_expression(expr) {
            let new_return_expr: Expr = match inner_variable {
                Expr::Tuple(tuple_expr) => {
                    let tuple_elements = tuple_expr.elems.iter().map(|elem| {
                        quote! { (#elem).try_to_vec()? }
                    });
                    parse_quote! { Ok((#(#tuple_elements),*)) }
                }
                _ => {
                    parse_quote! { Ok((#inner_variable).try_to_vec()?) }
                }
            };
            *expr = new_return_expr;
        }
    }

    // Modify the return type of the system function to Result<Vec<u8>>
    fn visit_item_fn_mut(&mut self, item_fn: &mut ItemFn) {
        if item_fn.sig.ident == "execute" {
            // Modify the return type to Result<Vec<u8>> if necessary
            if let ReturnType::Type(_, type_box) = &item_fn.sig.output {
                if let Type::Path(type_path) = &**type_box {
                    let ret_values = Self::extract_return_value(type_path);
                    if ret_values > 1 {
                        item_fn.sig.ident = Ident::new(
                            format!("execute_{}", ret_values).as_str(),
                            item_fn.sig.ident.span(),
                        );
                    }
                    if !Self::check_is_vec_u8(type_path) {
                        Self::modify_fn_return_type(item_fn, ret_values);
                        // Modify the return statement inside the function body
                        let block = &mut item_fn.block;
                        for stmt in &mut block.stmts {
                            if let Stmt::Expr(ref mut expr) | Stmt::Semi(ref mut expr, _) = stmt {
                                self.visit_expr_mut(expr);
                            }
                        }
                    }
                }
            }
        }
    }

    // Visit all the functions inside the system module
    fn visit_item_mod_mut(&mut self, item_mod: &mut ItemMod) {
        for item in &mut item_mod.content.as_mut().unwrap().1 {
            if let syn::Item::Fn(item_fn) = item {
                self.visit_item_fn_mut(item_fn)
            }
        }
    }
}

impl SystemTransform {
    // Helper function to check if a type is `Vec<u8>` or `(Vec<u8>, Vec<u8>, ...)`
    fn check_is_vec_u8(ty: &TypePath) -> bool {
        if let Some(segment) = ty.path.segments.last() {
            if segment.ident == "Result" {
                if let PathArguments::AngleBracketed(args) = &segment.arguments {
                    if let Some(GenericArgument::Type(Type::Tuple(tuple))) = args.args.first() {
                        return tuple.elems.iter().all(|elem| {
                            if let Type::Path(type_path) = elem {
                                if let Some(segment) = type_path.path.segments.first() {
                                    return segment.ident == "Vec" && Self::is_u8_vec(segment);
                                }
                            }
                            false
                        });
                    } else if let Some(GenericArgument::Type(Type::Path(type_path))) =
                        args.args.first()
                    {
                        if let Some(segment) = type_path.path.segments.first() {
                            return segment.ident == "Vec" && Self::is_u8_vec(segment);
                        }
                    }
                }
            }
        }
        false
    }

    // Helper function to check if a type is Vec<u8>
    fn is_u8_vec(segment: &syn::PathSegment) -> bool {
        if let PathArguments::AngleBracketed(args) = &segment.arguments {
            if let Some(GenericArgument::Type(Type::Path(path))) = args.args.first() {
                if let Some(segment) = path.path.segments.first() {
                    return segment.ident == "u8";
                }
            }
        }
        false
    }

    // Helper function to extract the number of return values from a type
    fn extract_return_value(ty: &TypePath) -> usize {
        if let Some(segment) = ty.path.segments.last() {
            if segment.ident == "Result" {
                if let PathArguments::AngleBracketed(args) = &segment.arguments {
                    return if let Some(GenericArgument::Type(Type::Tuple(tuple))) =
                        args.args.first()
                    {
                        tuple.elems.len()
                    } else {
                        1
                    };
                }
            }
        }
        0
    }

    // Helper function to modify the return type of a function to be Result<Vec<u8>> or Result<(Vec<u8>, Vec<u8>, ...)>
    fn modify_fn_return_type(item_fn: &mut syn::ItemFn, ret_values: usize) {
        item_fn.sig.output = if ret_values == 1 {
            parse_quote! { -> Result<Vec<u8>> }
        } else {
            let types = std::iter::repeat(quote! { Vec<u8> })
                .take(ret_values)
                .collect::<Vec<_>>();
            let tuple = quote! { (#(#types),*) };
            syn::parse2(quote! { -> Result<#tuple> }).unwrap()
        };
    }

    // Helper function to check if an expression is an `Ok(...)` or `return Ok(...);` variant
    fn extract_inner_ok_expression(expr: &Expr) -> Option<&Expr> {
        match expr {
            Expr::Call(expr_call) => {
                // Direct `Ok(...)` call
                if let Expr::Path(expr_path) = &*expr_call.func {
                    if let Some(last_segment) = expr_path.path.segments.last() {
                        if last_segment.ident == "Ok" && !expr_call.args.is_empty() {
                            // Return the first argument of the Ok(...) call
                            return expr_call.args.first();
                        }
                    }
                }
            }
            Expr::Return(expr_return) => {
                // `return Ok(...);`
                if let Some(expr_return_inner) = &expr_return.expr {
                    if let Expr::Call(expr_call) = expr_return_inner.as_ref() {
                        if let Expr::Path(expr_path) = &*expr_call.func {
                            if let Some(last_segment) = expr_path.path.segments.last() {
                                if last_segment.ident == "Ok" && !expr_call.args.is_empty() {
                                    // Return the first argument of the return Ok(...) call
                                    return expr_call.args.first();
                                }
                            }
                        }
                    }
                }
            }
            _ => {}
        }
        None
    }
}
