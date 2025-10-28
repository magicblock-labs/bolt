use heck::{ToPascalCase, ToSnakeCase};
use proc_macro::TokenStream;
use proc_macro2::{Ident, Span};
use quote::{quote, ToTokens, TokenStreamExt};
use syn::{
    parse_macro_input, parse_quote, visit_mut::VisitMut, Expr, FnArg, GenericArgument, Item,
    ItemFn, ItemMod, ItemStruct, PathArguments, ReturnType, Stmt, Type, TypePath,
};

#[derive(Default)]
struct SystemTransform {
    is_bundle: bool,
}

#[derive(Default)]
struct Extractor {
    context_struct_name: Option<String>,
    field_count: Option<usize>,
}

fn generate_bolt_execute_wrapper(
    fn_ident: Ident,
    callee_ident: Ident,
    components_ident: Ident,
    bumps_ident: Ident,
) -> Item {
    parse_quote! {
        pub fn #fn_ident<'a, 'b, 'info>(ctx: Context<'a, 'b, 'info, 'info, VariadicBoltComponents<'info>>, args: Vec<u8>) -> Result<Vec<Vec<u8>>> {
            let mut components = #components_ident::try_from(&ctx)?;
            let bumps = #bumps_ident {};
            let context = Context::new(ctx.program_id, &mut components, ctx.remaining_accounts, bumps);
            #callee_ident(context, args)
        }
    }
}

pub fn process(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut ast = parse_macro_input!(item as ItemMod);

    let mut extractor = Extractor::default();
    extractor.visit_item_mod_mut(&mut ast);

    if extractor.field_count.is_some() {
        let use_super = syn::parse_quote! { use super::*; };
        if let Some((_, ref mut items)) = ast.content {
            items.insert(0, syn::Item::Use(use_super));
            // Ensure a single VariadicBoltComponents per program for standalone #[system]
            let has_variadic = items.iter().any(
                |it| matches!(it, syn::Item::Struct(s) if s.ident == "VariadicBoltComponents"),
            );
            if !has_variadic {
                let variadic_struct: Item = parse_quote! {
                    #[derive(Accounts)]
                    pub struct VariadicBoltComponents<'info> {
                        pub authority: Signer<'info>,
                    }
                };
                items.insert(1, variadic_struct);
            }
            let wrapper = generate_bolt_execute_wrapper(
                Ident::new("bolt_execute", Span::call_site()),
                Ident::new("execute", Span::call_site()),
                Ident::new("Components", Span::call_site()),
                Ident::new("ComponentsBumps", Span::call_site()),
            );
            items.push(wrapper);
        }

        let mut transform = SystemTransform { is_bundle: false };
        transform.visit_item_mod_mut(&mut ast);

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

pub fn transform_module_for_bundle(module: &mut ItemMod, name_suffix: Option<&str>) -> Vec<Item> {
    module.attrs.retain(|a| !a.path.is_ident("system"));

    let mut extractor = Extractor::default();
    extractor.visit_item_mod_mut(module);

    if extractor.field_count.is_none() {
        panic!(
            "Could not find the component bundle: {} in the module",
            extractor.context_struct_name.unwrap_or_default()
        );
    }

    let mut transform = SystemTransform { is_bundle: true };
    transform.visit_item_mod_mut(module);

    let mut items: Vec<Item> = match module.content.take() {
        Some((_, items)) => items,
        None => vec![],
    };

    if let Some(suffix) = name_suffix {
        let pascal = suffix.to_pascal_case();
        let new_components_ident = Ident::new(&format!("{}Components", pascal), Span::call_site());
        let new_bumps_ident = Ident::new(&format!("{}ComponentsBumps", pascal), Span::call_site());

        struct SystemRename {
            new_components: Ident,
            new_bumps: Ident,
        }
        impl VisitMut for SystemRename {
            fn visit_item_struct_mut(&mut self, i: &mut ItemStruct) {
                if i.ident == "Components" {
                    i.ident = self.new_components.clone();
                } else if i.ident == "ComponentsBumps" {
                    i.ident = self.new_bumps.clone();
                }
                syn::visit_mut::visit_item_struct_mut(self, i);
            }
            fn visit_type_path_mut(&mut self, i: &mut TypePath) {
                for seg in i.path.segments.iter_mut() {
                    if seg.ident == "Components" {
                        seg.ident = self.new_components.clone();
                    } else if seg.ident == "ComponentsBumps" {
                        seg.ident = self.new_bumps.clone();
                    }
                }
                syn::visit_mut::visit_type_path_mut(self, i);
            }
            fn visit_expr_path_mut(&mut self, i: &mut syn::ExprPath) {
                if let Some(seg) = i.path.segments.last_mut() {
                    if seg.ident == "Components" {
                        seg.ident = self.new_components.clone();
                    } else if seg.ident == "ComponentsBumps" {
                        seg.ident = self.new_bumps.clone();
                    }
                }
                syn::visit_mut::visit_expr_path_mut(self, i);
            }
        }

        // Rename inner execute to a unique name per system to avoid collisions
        let new_execute_ident = Ident::new(&format!("execute_{}", suffix), Span::call_site());
        struct ExecRename {
            new_ident: Ident,
        }
        impl VisitMut for ExecRename {
            fn visit_item_fn_mut(&mut self, i: &mut ItemFn) {
                if i.sig.ident == "execute" {
                    i.sig.ident = self.new_ident.clone();
                }
                syn::visit_mut::visit_item_fn_mut(self, i);
            }
        }

        let mut renamer = SystemRename {
            new_components: new_components_ident.clone(),
            new_bumps: new_bumps_ident.clone(),
        };
        for item in items.iter_mut() {
            renamer.visit_item_mut(item);
        }

        let mut exec_renamer = ExecRename {
            new_ident: new_execute_ident.clone(),
        };
        for item in items.iter_mut() {
            exec_renamer.visit_item_mut(item);
        }

        let fn_ident = Ident::new(&format!("{}_bolt_execute", suffix), Span::call_site());
        let wrapper_fn = generate_bolt_execute_wrapper(
            fn_ident,
            new_execute_ident,
            new_components_ident,
            new_bumps_ident,
        );
        items.push(wrapper_fn);
    } else {
        let wrapper_fn = generate_bolt_execute_wrapper(
            Ident::new("bolt_execute", Span::call_site()),
            Ident::new("execute", Span::call_site()),
            Ident::new("Components", Span::call_site()),
            Ident::new("ComponentsBumps", Span::call_site()),
        );
        items.push(wrapper_fn);
    }

    items
}

impl SystemTransform {
    fn visit_stmts_mut(&mut self, stmts: &mut Vec<Stmt>) {
        for stmt in stmts {
            if let Stmt::Expr(ref mut expr) | Stmt::Semi(ref mut expr, _) = stmt {
                self.visit_expr_mut(expr);
            }
        }
    }
}

impl VisitMut for SystemTransform {
    fn visit_expr_mut(&mut self, expr: &mut Expr) {
        match expr {
            Expr::ForLoop(for_loop_expr) => {
                self.visit_stmts_mut(&mut for_loop_expr.body.stmts);
            }
            Expr::Loop(loop_expr) => {
                self.visit_stmts_mut(&mut loop_expr.body.stmts);
            }
            Expr::If(if_expr) => {
                self.visit_stmts_mut(&mut if_expr.then_branch.stmts);
                if let Some((_, else_expr)) = &mut if_expr.else_branch {
                    self.visit_expr_mut(else_expr);
                }
            }
            Expr::Block(block_expr) => {
                self.visit_stmts_mut(&mut block_expr.block.stmts);
            }
            _ => (),
        }
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
            if let Expr::Return(return_expr) = expr {
                return_expr.expr = Some(Box::new(new_return_expr));
            } else {
                *expr = new_return_expr;
            }
        }
    }

    fn visit_item_fn_mut(&mut self, item_fn: &mut ItemFn) {
        if item_fn.sig.ident == "execute" {
            Self::inject_lifetimes_and_context(item_fn);
            if let ReturnType::Type(_, type_box) = &item_fn.sig.output {
                if let Type::Path(type_path) = &**type_box {
                    if !Self::check_is_result_vec_u8(type_path) {
                        item_fn.sig.output = parse_quote! { -> Result<Vec<Vec<u8>>> };
                        let block = &mut item_fn.block;
                        self.visit_stmts_mut(&mut block.stmts);
                    }
                }
            }
            Self::modify_args(item_fn);
        }
    }

    fn visit_item_mod_mut(&mut self, item_mod: &mut ItemMod) {
        let content = match item_mod.content.as_mut() {
            Some(content) => &mut content.1,
            None => return,
        };

        let mut extra_accounts_struct_name = None;

        let system_input = content
            .iter()
            .find_map(|item| {
                if let syn::Item::Struct(item_struct) = item {
                    if item_struct
                        .attrs
                        .iter()
                        .any(|attr| attr.path.is_ident("system_input"))
                    {
                        Some(item_struct)
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
            .cloned();

        for item in content.iter_mut() {
            match item {
                syn::Item::Fn(item_fn) => self.visit_item_fn_mut(item_fn),
                syn::Item::Struct(item_struct) => {
                    if let Some(attr) = item_struct
                        .attrs
                        .iter_mut()
                        .find(|attr| attr.path.is_ident("system_input"))
                    {
                        attr.tokens.append_all(quote! { (session_key) });
                    }
                    if let Some(attr) = item_struct
                        .attrs
                        .iter_mut()
                        .find(|attr| attr.path.is_ident("extra_accounts"))
                    {
                        if let Some(system_input) = &system_input {
                            let mod_ident = &item_mod.ident.to_string().to_pascal_case();
                            let ident = if self.is_bundle {
                                syn::Ident::new(
                                    &format!("{}{}", mod_ident, &system_input.ident),
                                    Span::call_site(),
                                )
                            } else {
                                system_input.ident.clone()
                            };
                            let type_path: syn::TypePath = syn::parse_quote! { #ident<'info> };
                            let literal = type_path.to_token_stream().to_string();
                            attr.tokens.append_all(quote! { (input = #literal) });
                        }
                        extra_accounts_struct_name = Some(&item_struct.ident);
                    }
                }
                _ => {}
            }
        }

        if let Some(struct_name) = extra_accounts_struct_name {
            let init_extra_accounts_name = syn::Ident::new(
                &format!(
                    "init_extra_accounts_{}",
                    struct_name.to_string().to_snake_case()
                ),
                Span::call_site(),
            );
            let initialize_extra_accounts = quote! {
            #[automatically_derived]
                pub fn #init_extra_accounts_name(_ctx: Context<#struct_name>) -> Result<()> {
                    Ok(())
                }
            };
            content.push(syn::parse2(initialize_extra_accounts).unwrap());
        }
    }
}

impl SystemTransform {
    fn inject_lifetimes_and_context(item_fn: &mut ItemFn) {
        let lifetime_idents = ["a", "b", "c", "info"];
        for name in lifetime_idents.iter() {
            let exists = item_fn.sig.generics.params.iter().any(|p| match p {
                syn::GenericParam::Lifetime(l) => l.lifetime.ident == *name,
                _ => false,
            });
            if !exists {
                let lifetime: syn::Lifetime =
                    syn::parse_str(&format!("'{}", name)).expect("valid lifetime");
                let gp: syn::GenericParam = syn::parse_quote!(#lifetime);
                item_fn.sig.generics.params.push(gp);
            }
        }

        if let Some(FnArg::Typed(pat_type)) = item_fn.sig.inputs.first_mut() {
            if let Type::Path(type_path) = pat_type.ty.as_mut() {
                if let Some(last_segment) = type_path.path.segments.last_mut() {
                    if last_segment.ident == "Context" {
                        let mut components_ty_opt: Option<Type> = None;
                        if let PathArguments::AngleBracketed(args) = &last_segment.arguments {
                            for ga in args.args.iter() {
                                if let GenericArgument::Type(t) = ga {
                                    components_ty_opt = Some(t.clone());
                                    break;
                                }
                            }
                        }

                        if let Some(components_ty) = components_ty_opt {
                            let components_with_info: Type = match components_ty {
                                Type::Path(mut tp) => {
                                    let seg = tp.path.segments.last_mut().unwrap();
                                    match &mut seg.arguments {
                                        PathArguments::AngleBracketed(ab) => {
                                            if ab.args.is_empty() {
                                                ab.args.push(GenericArgument::Lifetime(
                                                    syn::parse_quote!('info),
                                                ));
                                            }
                                        }
                                        _ => {
                                            seg.arguments = PathArguments::AngleBracketed(
                                                syn::AngleBracketedGenericArguments {
                                                    colon2_token: None,
                                                    lt_token: Default::default(),
                                                    args: std::iter::once(
                                                        GenericArgument::Lifetime(
                                                            syn::parse_quote!('info),
                                                        ),
                                                    )
                                                    .collect(),
                                                    gt_token: Default::default(),
                                                },
                                            );
                                        }
                                    }
                                    Type::Path(tp)
                                }
                                other => other,
                            };

                            let new_ty: Type = syn::parse_quote! {
                                Context<'a, 'b, 'c, 'info, #components_with_info>
                            };
                            pat_type.ty = Box::new(new_ty);
                        }
                    }
                }
            }
        }
    }

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

    fn extract_inner_ok_expression(expr: &Expr) -> Option<&Expr> {
        match expr {
            Expr::Call(expr_call) => {
                if let Expr::Path(expr_path) = &*expr_call.func {
                    if let Some(last_segment) = expr_path.path.segments.last() {
                        if last_segment.ident == "Ok" && !expr_call.args.is_empty() {
                            return expr_call.args.first();
                        }
                    }
                }
            }
            Expr::Return(expr_return) => {
                if let Some(expr_return_inner) = &expr_return.expr {
                    if let Expr::Call(expr_call) = expr_return_inner.as_ref() {
                        if let Expr::Path(expr_path) = &*expr_call.func {
                            if let Some(last_segment) = expr_path.path.segments.last() {
                                if last_segment.ident == "Ok" && !expr_call.args.is_empty() {
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

impl VisitMut for Extractor {
    fn visit_item_fn_mut(&mut self, i: &mut ItemFn) {
        for input in &i.sig.inputs {
            if let FnArg::Typed(pat_type) = input {
                if let Type::Path(type_path) = &*pat_type.ty {
                    let last_segment = type_path
                        .path
                        .segments
                        .last()
                        .expect("Context segment not found");
                    if last_segment.ident == "Context" {
                        if let PathArguments::AngleBracketed(args) = &last_segment.arguments {
                            for ga in args.args.iter() {
                                if let syn::GenericArgument::Type(syn::Type::Path(type_path)) = ga {
                                    if let Some(first_seg) = type_path.path.segments.first() {
                                        self.context_struct_name =
                                            Some(first_seg.ident.to_string());
                                        break;
                                    }
                                }
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
