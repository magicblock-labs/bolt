### Release Process

1. **Create a Release Branch**  
   Create a new branch named `release/v*.*.*`.

2. **Update Version in `Cargo.toml`**  
   Increment the version number in the `Cargo.toml` file according to the release type (major, minor, or patch).

3. **Align Versions**  
   Run the `./version-align.sh` script. This will:
   - Update the version of all internal crates and npm packages.
   - Generate the updated crates.

4. **Continuous Integration (CI) Testing**  
   - The CI pipeline will test the packages and crate deployment in a dry-run mode.
   - Ensure all tests pass successfully.

5. **Merge and Deploy**  
   - Merge the release branch into `main` after verifying all tests pass.
   - Create a new Release on GitHub. This will trigger the actual deployment process for the crates and packages.

6. **Post-Deployment**  
   Verify that the deployment is complete and the crates and packages are available as expected.
