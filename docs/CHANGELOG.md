
## [0.2.1] - 2025-02-12

### ✨️ Features
 - Session keys (#126)
 - `bolt world` now prints world id (#127)
 - Variable components number (#124)
 - Adding low and intermediate api-levels (#120)

## [0.2.0] - 2025-01-05


### 🐛 Bug Fixes
 - Fix(system): fix system return statement in inner blocks (#117)

### ♻️ Refactor
 - Refactor: re-exporting anchor-lang (#114)
 - Refactor: files structure (#113)

## [0.1.11] - 2024-12-04


### 🐛 Bug Fixes
 - Fix: removing test caches (#100)

### 📚 Documentation

### 👷 CI/CD
 - Reorganizing templates, using bolt.workspace an… (#95)

### ♻️ Refactor
 - Refactor: Adding .template extension to template files (#107)
 - Fixing test template, broken after code refactor (#93)

### 🧪 Testing
 - Test: test and lint scripts (#99)
 - Test: running lint on pull request (#101)
 - Test: adding test script (#97)

### 🔧 Maintenance

## [0.1.10] - 2024-10-05

### 👷 CI/CD

### ♻️ Refactor

## [0.1.9] - 2024-10-02


### 🐛 Bug Fixes
 - Fix: secret ENV variables should be read by forked PR's also (#76)

### 📚 Documentation
 - Docs: Fix typo in README (#77)

### ♻️ Refactor
 - Refactor: break down the cli application function to specific file (#74)

## [0.1.8] - 2024-06-27

### ✨️ Features
 - Add allow undelegation ix (#68)

## [0.1.7] - 2024-06-21

### ✨️ Features
 - Add manual commit to the typescript sdk (#59)
# :sparkles: Add manual commit to the typescript sdk
| Status  | Type  | ⚠️ Core Change | Issue |
| :---: | :---: | :---: | :--: |
| Ready | Feature | No | - |

## Description
Add Ephemeral Rollups manual commit instruction to the typescript sdk
 - Upgrade to Anchor 0.30.1 (#62)
# Upgrade to Anchor 0.30.1
| Status  | Type  | ⚠️ Core Change | Issue |
| :---: | :---: | :---: | :--: |
| Ready | Feature | No | - |

## Description
Upgrade Anchor dependency to 0.30.1


### 🐛 Bug Fixes
 - Fix: removing generated files from lib and .crates files off of git (#54)

## Problem
The `lib` and `.crates` folder files in the `bolt-sdk` were not supposed
to be git tracked

## Solution
`git rm -r lib` and add those to `.gitignore`
 - Fix: make sure CI is recompiling the /lib folder when we make changes (#53)

## Problem
When changing the Typescript files, yarn build was not running in the
CI, leading to the CI's test succeeding even if we just introduced a
bug.

## Solution
Make the CI run `yarn build` before testing

### 👷 CI/CD

## [0.1.5] - 2024-04-23

### 📚 Documentation

## [0.1.4] - 2024-04-06

### ✨️ Features
 - Improve Bolt typescript SDK (#41)

## [0.1.3] - 2024-04-02


### 🐛 Bug Fixes
## [0.1.2] - 2024-04-02

### ✨️ Features
 - Simplify the Bolt typescript Sdk (#36)
 - Simplify system arguments (#35)
 - Simplify component_deserialize macro (#34)
 - Upgrade to latest anchor version, supporting the new IDL s… (#33)
 - Propagate signing authority to the systems (#31)
 - Macro to define and access extra accounts  (#26)
Inject extra account init fn with th system macro, to generate a correct idl wich contains also the extra accounts

## [0.1.1] - 2024-03-09

### ✨️ Features
 - Dynamic types resolver (#24)

## [0.1.0] - 2024-02-28

### 📚 Documentation
 - Improve repository structure (#21)

## [0.0.2] - 2024-02-24

### ✨️ Features
 - Feat/consistent versioning (#18)
 - Draft workflow for building & publishing packages (#16)

## [0.0.1] - 2024-02-21

### ✨️ Features
 - Feature: Add configurable component authority & Simplify the Components/System API (#14)
 - Feat/default component (#13)
 - Add a working ecs example on project init (#12)
 - Add strings to the template (#2)
 - Bolt Typescript SDK (#1)


### 🐛 Bug Fixes
 - Fix world Pda derivation (#10)

### 📚 Documentation

### ♻️ Refactor
 - Refactor workspace and project dependencies (#15)
