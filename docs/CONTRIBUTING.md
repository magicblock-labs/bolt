# Contributing

Thank you for considering contributing to [Bolt](https://github.com/magicblock-labs/bolt)!

When contributing, please first discuss the change you wish to make via [issue](https://github.com/magicblock-labs/bolt/issues), or any other method with the owners of this repository before making a change.

Note that we have a [Code of Conduct](./CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

## Setup

1. Fork this repository and create your branch from `main`.

2. Clone your forked repository.

```sh
git clone https://github.com/{username}/bolt && cd bolt
```

3. Make sure that you have [Rust](https://www.rust-lang.org/) `1.64.0` or later installed and build the project.

```sh
cargo build
```

4. Start committing your changes. Follow the [conventional commit specification](https://www.conventionalcommits.org/) and [gitmoji specification](https://gitmoji.dev/specification) while doing so.

5. Add your tests (if you haven't already) or update the existing tests according to the changes. And check if the tests are passed.

```sh
cargo test
```

6. Make sure [rustfmt](https://github.com/rust-lang/rustfmt) and [clippy](https://github.com/rust-lang/rust-clippy) don't complain about your changes.


## Create a Pull Request

1. Ensure that you updated the documentation and filled the [Pull Request template](/.github/pull_request_template.md) according to the changes you made.

2. Wait for approval from the project owner/maintainer. Discuss the possible changes and update your Pull Request if necessary.

3. You may merge the Pull Request once you have the sign-off of the project owner/maintainer, or if you do not have permission to do that, you may request the project owner/maintainer to merge it in case they haven't done it after a while.

## Release Process

1. Create a branch from `main` with the name `release/vX.Y.Z` where `X.Y.Z` is the new version number.
2. Create a Pull Request from the `release/vX.Y.Z` branch to `main`. The PR will trigger CI/CD pipeline to check if the release is ready.
3. Once the PR is approved and the CI/CD pipeline is successful, merge the PR to `main`.
4. Create a new release on GitHub with the new version number and the release notes. CI/CD pipeline will automatically publish the new release to [crates.io](https://crates.io/), publish the binaries and the packages to npmjs.

# License

By contributing, you agree that your contributions will be licensed under [The MIT License](/LICENSE) or [Apache License 2.0](/LICENSE-APACHE).