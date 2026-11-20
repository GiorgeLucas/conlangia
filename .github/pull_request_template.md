## Summary

<!-- Describe the change and its motivation. -->

## Validation

- [ ] `pnpm build`
- [ ] `cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check`
- [ ] `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`
- [ ] `cargo test --manifest-path src-tauri/Cargo.toml`

## Checklist

- [ ] The change is focused and documented where appropriate.
- [ ] Tests were added or updated when practical.
