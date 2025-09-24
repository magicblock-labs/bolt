use proc_macro::TokenStream;
use syn::{Lit, Meta, MetaList, MetaNameValue, NestedMeta};

pub fn get_attributes(attr: TokenStream) -> super::Attributes {
    let mut component_id_value = None;
    let mut delegate = false;

    if !attr.is_empty() {
        let attr_meta: Meta = syn::parse(attr.into()).expect("Invalid component attribute");
        delegate = is_delegate_set(&attr_meta);
        component_id_value = match attr_meta {
            Meta::Path(_) => None,
            Meta::NameValue(meta_name_value) => extract_component_id(&meta_name_value),
            Meta::List(meta_list) => {
                if !delegate {
                    delegate = is_delegate_set(&Meta::List(meta_list.clone()));
                }
                find_component_id_in_list(meta_list)
            }
        };
    }

    let component_id = component_id_value.unwrap_or_else(|| "".to_string());
    super::Attributes {
        component_id,
        delegate,
    }
}

pub fn is_delegate_set(meta: &Meta) -> bool {
    match meta {
        Meta::Path(path) => path.is_ident("delegate"),
        Meta::List(meta_list) => meta_list.nested.iter().any(|nested_meta| {
            if let NestedMeta::Meta(Meta::Path(path)) = nested_meta {
                path.is_ident("delegate")
            } else {
                false
            }
        }),
        _ => false,
    }
}

pub fn extract_component_id(meta_name_value: &MetaNameValue) -> Option<String> {
    if meta_name_value.path.is_ident("component_id") {
        if let Lit::Str(lit) = &meta_name_value.lit {
            return Some(lit.value());
        }
    }
    None
}

pub fn find_component_id_in_list(meta_list: MetaList) -> Option<String> {
    meta_list.nested.into_iter().find_map(|nested_meta| {
        if let NestedMeta::Meta(Meta::NameValue(meta_name_value)) = nested_meta {
            extract_component_id(&meta_name_value)
        } else {
            None
        }
    })
}
