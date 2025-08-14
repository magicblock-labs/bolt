use proc_macro2::Ident;
use syn::{DeriveInput, Field, Type, Visibility};

pub fn add_bolt_metadata(input: &mut DeriveInput) {
    let authority_field: Field = Field {
        attrs: vec![],
        vis: Visibility::Public(syn::VisPublic {
            pub_token: Default::default(),
        }),
        ident: Some(Ident::new("bolt_metadata", proc_macro2::Span::call_site())),
        colon_token: Some(Default::default()),
        ty: Type::Path(syn::TypePath {
            qself: None,
            path: syn::Path::from(Ident::new("BoltMetadata", proc_macro2::Span::call_site())),
        }),
    };
    if let syn::Data::Struct(ref mut data) = input.data {
        if let syn::Fields::Named(ref mut fields) = data.fields {
            fields.named.insert(0, authority_field);
        }
    }
}
