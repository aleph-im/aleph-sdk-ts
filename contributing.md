# Contributing to this project

We would love to get your input on this project, as an open source codebase your contribution is welcome!

We want to make contributing to this SDK as easy and transparent as possible.

**Before opening an issue or a pull request (PR), please make sure that the feature does not already exist.**

## Opening an issue

Use the issue system to:

- Report a bug
- Ask for a new feature
- Discuss the current state of the code (might be moved to the `discussion` section)

When reporting a bug, make sure to include every detail that could help reproduce the issue. Also mention in which environment (OS, Node version, bundler if applicable) the code was executed.

When asking for a feature, add some context about potential use cases. Our goal is to provide everything a developper could need to interact with Aleph Decentralized Network.


## Opening a Pull Request

Use the PR system to:

- Submit a fix
- Propose a new feature

### How to contribute

Like many project on Github we follow the ["fork-and-pull" Git workflow](https://github.com/susam/gitpr).

1. Fork the repository to your own Github account
2. Clone the project to your machine
3. Create a branch locally with a succinct but descriptive name. If your PR is a bugfix, prefix it with `Fix/`. For example:
    - You want to add the possibility to "create an account on `Chain X`", `Account/ChainX` 
    - You want to fix a bug related to post messages not being publish `Fix/PostMessagePublish`
4. Commit changes to the branch
5. Push changes to your fork
6. Open a PR in our repository. If an issue was opened related to your PR, link it in the description.

### Some points to consider when opening a PR

- One pull request per feature.
- Keep your commit history clean, we do not abide by any specific rule but [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) are appreciated. We may ask you to rebase your branch in order to better track your changes. In the end your commits will be squashed into a single one into the main branch, so naming matters.
- Your PR should be side-effect free (for instance if you are working on features for `Chain X` this should not introduce behavioral change to `Chain Y`)
- Wether you are working on a new feature or a bugfix, please write some tests to validate that your changes are working.
- Make sure that your code contains necessary doc comments (for auto documentation), do not leave debugging statements (such as `console.log` or debugger breakpoints) open, and avoid unnecessary comments.
- Before submitting your PR, make sure your code is properly linted and that the test suite runs for every targetted environment.


## License

By contributing, you agree that your contributions will be licensed under its MIT License.

You also agree to our [Code of Conduct](./code-of-conduct.md).