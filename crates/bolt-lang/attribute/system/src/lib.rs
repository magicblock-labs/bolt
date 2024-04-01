use proc_macro::TokenStream;
use proc_macro2::Ident;
use quote::{quote, ToTokens};
use syn::{
    parse_macro_input, parse_quote, visit_mut::VisitMut, Expr, FnArg, GenericArgument, ItemFn,
    ItemMod, ItemStruct, PathArguments, ReturnType, Stmt, Type, TypePath,
};

#[derive(Default)]
struct SystemTransform {
    return_values: usize,
}

#[derive(Default)]
struct Extractor {
    context_struct_name: Option<String>,
    field_count: Option<usize>,
}

/// This macro attribute is used to define a BOLT system.
///
/// Bolt components are themselves programs. The macro adds parsing and serialization
///
/// # Example
/// ```ignore
/// #[system]
/// pub mod system_fly {
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
    let mut ast = parse_macro_input!(item as ItemMod);
    let _attr = parse_macro_input!(attr as syn::AttributeArgs);

    // Extract the number of components from the module
    let mut extractor = Extractor::default();
    extractor.visit_item_mod_mut(&mut ast);

    if let Some(components_len) = extractor.field_count {
        let use_super = syn::parse_quote! { use super::*; };
        if let Some(ref mut content) = ast.content {
            content.1.insert(0, syn::Item::Use(use_super));
        }

        let mut transform = SystemTransform {
            return_values: components_len,
        };
        transform.visit_item_mod_mut(&mut ast);

        // Add `#[program]` macro and try_to_vec implementation
        let expanded = quote! {
            #[program]
            #ast
        };

        TokenStream::from(expanded)
    } else {
        panic!(
            "Could not find the component bundle: {} in the module",
            extractor.context_struct_name.unwrap()
        );
    }
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
                    parse_quote! {
                        #inner_variable.try_to_vec()
                    }
                }
            };
            *expr = new_return_expr;
        }
    }

    // Modify the return type of the system function to Result<Vec<u8>,*>
    fn visit_item_fn_mut(&mut self, item_fn: &mut ItemFn) {
        if item_fn.sig.ident == "execute" {
            // Modify the return type to Result<Vec<u8>> if necessary
            if let ReturnType::Type(_, type_box) = &item_fn.sig.output {
                if let Type::Path(type_path) = &**type_box {
                    if self.return_values > 1 {
                        item_fn.sig.ident = Ident::new(
                            format!("execute_{}", self.return_values).as_str(),
                            item_fn.sig.ident.span(),
                        );
                    }
                    if !Self::check_is_result_vec_u8(type_path) {
                        Self::modify_fn_return_type(item_fn, self.return_values);
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
            // If second argument is not Vec<u8>, modify it to be so and use parse_args
            Self::modify_args(item_fn);
        }
    }

    // Visit all the functions inside the system module and inject the init_extra_accounts function
    // if the module contains a struct with the `extra_accounts` attribute
    fn visit_item_mod_mut(&mut self, item_mod: &mut ItemMod) {
        let content = match item_mod.content.as_mut() {
            Some(content) => &mut content.1,
            None => return,
        };

        let mut extra_accounts_struct_name = None;

        for item in content.iter_mut() {
            match item {
                syn::Item::Fn(item_fn) => self.visit_item_fn_mut(item_fn),
                syn::Item::Struct(item_struct)
                    if item_struct
                        .attrs
                        .iter()
                        .any(|attr| attr.path.is_ident("extra_accounts")) =>
                {
                    extra_accounts_struct_name = Some(&item_struct.ident);
                    break;
                }
                _ => {}
            }
        }

        if let Some(struct_name) = extra_accounts_struct_name {
            let initialize_extra_accounts = quote! {
            #[automatically_derived]
                pub fn init_extra_accounts(_ctx: Context<#struct_name>) -> Result<()> {
                    Ok(())
                }
            };
            content.push(syn::parse2(initialize_extra_accounts).unwrap());
        }
    }
}

impl SystemTransform {
    // Helper function to check if a type is `Vec<u8>` or `(Vec<u8>, Vec<u8>, ...)`
    fn check_is_result_vec_u8(ty: &TypePath) -> bool {
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

    // Helper function to modify the return type of a function to be Result<Vec<u8>> or Result<(Vec<u8>, Vec<u8>, ...)>
    fn modify_fn_return_type(item_fn: &mut ItemFn, ret_values: usize) {
        item_fn.sig.output = if ret_values == 1 {
            parse_quote! { -> Result<(Vec<u8>,)> }
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

    fn modify_args(item_fn: &mut ItemFn) {
        if item_fn.sig.inputs.len() >= 2 {
            let second_arg = &mut item_fn.sig.inputs[1];
            let is_vec_u8 = if let FnArg::Typed(syn::PatType { ty, .. }) = second_arg {
                match &**ty {
                    Type::Path(type_path) => {
                        if let Some(segment) = type_path.path.segments.first() {
                            segment.ident == "Vec" && Self::is_u8_vec(segment)
                        } else {
                            false
                        }
                    }
                    _ => false,
                }
            } else {
                false
            };
            if !is_vec_u8 {
                if let FnArg::Typed(pat_type) = second_arg {
                    let original_type = pat_type.ty.to_token_stream();
                    let arg_original_name = pat_type.pat.to_token_stream();
                    if let syn::Pat::Ident(ref mut pat_ident) = *pat_type.pat {
                        let new_ident_name = format!("_{}", pat_ident.ident);
                        pat_ident.ident =
                            Ident::new(&new_ident_name, proc_macro2::Span::call_site());
                    }
                    let arg_name = pat_type.pat.to_token_stream();
                    pat_type.ty = Box::new(syn::parse_quote! { Vec<u8> });
                    let parse_stmt: Stmt = parse_quote! {
                        let #arg_original_name = parse_args::<#original_type>(&#arg_name);
                    };
                    item_fn.block.stmts.insert(0, parse_stmt);
                }
            }
        }
    }
}

/// Visits the AST to extract the number of input components
impl VisitMut for Extractor {
    fn visit_item_fn_mut(&mut self, i: &mut ItemFn) {
        for input in &i.sig.inputs {
            if let FnArg::Typed(pat_type) = input {
                if let Type::Path(type_path) = &*pat_type.ty {
                    let last_segment = type_path.path.segments.last().unwrap();
                    if last_segment.ident == "Context" {
                        if let PathArguments::AngleBracketed(args) = &last_segment.arguments {
                            if let Some(syn::GenericArgument::Type(syn::Type::Path(type_path))) =
                                args.args.first()
                            {
                                let ident = &type_path.path.segments.first().unwrap().ident;
                                self.context_struct_name = Some(ident.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    fn visit_item_struct_mut(&mut self, i: &mut ItemStruct) {
        if let Some(name) = &self.context_struct_name {
            if i.ident == name {
                self.field_count = Some(i.fields.len());
            }
        }
    }
}
