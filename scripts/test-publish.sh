DRY_RUN="true"
DRY_RUN_FLAG=""
if [ "${DRY_RUN}" = "true" ]; then
DRY_RUN_FLAG="--dry-run"
fi

if [ "${DRY_RUN}" = "true" ]; then
NO_VERIFY_FLAG="--no-verify"
fi      

cargo +nightly publish -Zpackage-workspace $DRY_RUN_FLAG $NO_VERIFY_FLAG \
    -p world \
    -p bolt-cli \
    -p bolt-lang \
    -p bolt-utils \
    -p bolt-attribute-bolt-arguments \
    -p bolt-attribute-bolt-bundle \
    -p bolt-attribute-bolt-component \
    -p bolt-attribute-bolt-component-deserialize \
    -p bolt-attribute-bolt-component-id \
    -p bolt-attribute-bolt-extra-accounts \
    -p bolt-attribute-bolt-system \
    -p bolt-attribute-bolt-system-input