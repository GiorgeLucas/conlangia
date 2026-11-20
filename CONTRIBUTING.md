# Contributing

Thanks for helping improve Conlangia! Contributions are welcome through GitHub issues and pull requests.

## Set up the project

Install the prerequisites listed in the [README](./README.md#prerequisites), then run:

```bash
pnpm install
pnpm tauri dev
```

## Validate your changes

Run the frontend production build and Rust checks before opening a pull request:

```bash
pnpm build
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

There is currently no separate frontend lint or test script.

## Branches and pull requests

1. Fork the repository and branch from `main`.
2. Use a short branch name such as `feature/word-generator` or `fix/project-loading`.
3. Keep changes focused and include tests when practical.
4. Open a pull request against `main`, describe the change, and include the validation you ran.

Version releases use tags in the `vX.Y.Z` format. Before tagging a release, make sure the versions in `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` match the tag.
