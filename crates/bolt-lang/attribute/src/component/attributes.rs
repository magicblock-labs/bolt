#[derive(Default)]
pub struct Attributes {
    pub is_component: bool,
    pub component_id: String,
    pub delegate: bool,
}

use std::ops::Not;

use proc_macro::TokenStream;
use syn::{Lit, Meta, MetaList, MetaNameValue, NestedMeta};

impl From<Vec<syn::Attribute>> for Attributes {
    fn from(attrs: Vec<syn::Attribute>) -> Self {
        attrs.iter().find(|attr| attr.path.is_ident("component")).map(|attr| {
            Self::from(attr.parse_meta().unwrap())
        }).unwrap_or_default()
    }
}

impl From<TokenStream> for Attributes {
    fn from(attr: TokenStream) -> Self {
        attr.is_empty().not().then(|| {
            let attr_meta: Meta = syn::parse(attr.into()).expect("Invalid component attribute");
            Self::from(attr_meta)
        }).unwrap_or_default()
    }
}

impl From<syn::Meta> for Attributes {
    fn from(meta: syn::Meta) -> Self {
        let mut delegate = is_delegate_set(&meta);
        let is_component = is_component_set(&meta);
        let component_id_value = match meta {
            Meta::Path(_) => None,
            Meta::NameValue(meta_name_value) => extract_component_id(&meta_name_value),
            Meta::List(meta_list) => {
                if !delegate {
                    delegate = is_delegate_set(&Meta::List(meta_list.clone()));
                }
                find_component_id_in_list(meta_list)
            }
        };
    
        let component_id = component_id_value.unwrap_or_else(|| "".to_string());
        Self { is_component, component_id, delegate }
    }
}

pub fn is_component_set(meta: &Meta) -> bool {
    match meta {
        Meta::Path(path) => path.is_ident("component"),
        Meta::List(meta_list) => meta_list.nested.iter().any(|nested_meta| {
            if let NestedMeta::Meta(Meta::Path(path)) = nested_meta {
                path.is_ident("component")
            } else {
                false
            }
        }),
        _ => false,
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
