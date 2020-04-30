# Contributing

Thanks for helping out with the dice roller!

The following is a set of guidelines for contributing to the library. They explain the process to get started, and ensure that the it's as easy as possible for people to work with the project.


## Table of contents

* [Code of Conduct](#code-of-conduct)
* [I have a question](#i-have-a-question)
* [How to contribute](#how-to-contribute)
  * [Reporting bugs](#reporting-bugs)
  * [Suggesting improvements and new features](#suggesting-improvements-and-new-features)
  * [Contributing code](#contributing-code)
  * [Pull requests](#pull-requests)
* [Styles and standards](#styles-and-standards)
  * [Git](#git)
  * [Javascript style guide](#javascript-style-guide)
  * [Testing](#testing)


## Code of Conduct

This is currently in progress, but generally; be nice, be understanding, and don't make anyone feel unwelcome. This library is here to help people across the world play together, so let's keep the development of it that way too.


## I have a question

We don't have a message board or similar, so feel free to use the [Github tickets](https://github.com/GreenImp/rpg-dice-roller/issues/new?labels=question&template=question.md) to raise questions


## How to contribute

### Reporting bugs

> **Note:** before raising a ticket, please check it hasn't already been raised!

If you find a bug, please let us know.


#### Before submitting a bug report

* [Search through existing tickets](https://github.com/GreenImp/rpg-dice-roller/issues?q=is%3Aissue+label%3Abug) to see if the issue has already been reported.
  * If it has, and the issue is still _open_, add a comment to it, rather than creating a new ticket.
  * If it has, and the issue is _closed_, see if any suggested fix resolves the issue for you.


#### How to submit a bug report

Bugs are tracked as Github issues, and you can [report a bug through Github](https://github.com/GreenImp/rpg-dice-roller/issues/new?labels=bug&template=bug_report.md).

Explain the problem in as much detail as possible, including any additional details that could help to reproduce the problem.

* **Use a clear and descriptive title** for the issue, that identifies the problem.
* **Describe the exact steps which reproduce the problem** with as much detail as possible.
* **Provide specific examples to demonstrate the steps.** Include links to source code, or copy/paste code snippets. If providing code snippets, please use [Markdown code blocks](https://help.github.com/en/github/writing-on-github/creating-and-highlighting-code-blocks).
* **Describe the behaviour that you observed after following the steps** and explain why this is a problem.
* **Describe the behaviour that you expected to see and why.**
* **Include any screenshots** if relevant.
* **If you receive any error messages**, `console` output, or similar, please include them.
* **Provide the library version number** that you're using. If it's not the latest version, can you reproduce the problem in the latest release?


### Suggesting improvements and new features

We'd love to hear any ideas you've got for new features or improvements. Following these guidelines helps us to understand your suggestion better.


#### Before submitting a feature suggestion

* **Check you're using the latest version.** The feature may have been added in a newer version.
* [Search through existing tickets](https://github.com/GreenImp/rpg-dice-roller/issues?q=is%3Aissue+label%3Aenhancement+label%3Asuggestion+label%3Aquestion) to see if the feature has already been suggested. If it has, add a comment to the existing one, rather than creating a new one.


#### How to submit a feature suggestion

Feature suggestions are tracked as Github tickets, and you can [suggest a feature through Github](https://github.com/GreenImp/rpg-dice-roller/issues/new?labels=suggestion&template=feature-request.md).

* **Use a clear and descriptive title** for the ticket, that identifies the suggestion.
* **Provide a step-by-step description of the feature** with as much detail as possible.
* **Provide any relevant examples to demonstrate the feature**, such as code snippets.
* **Describe the current behaviour** and **explain the behaviour you'd like to see instead** and why.
* **Include any screenshots** if relevant.
* **Explain why the feature would be useful**


### Contributing code

If you want to help out with the development itself then please dive in.


#### Finding something to work on

If you're unsure where to begin, you can start by having a look at the tickets flagged as [help wanted](https://github.com/GreenImp/rpg-dice-roller/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22), and see if you can help with any of them.

If there aren't any flagged as `help wanted` that doesn't mean we don't want your help! Generally, we're happy for people to dig into any ticket that hasn't been assigned to someone.
A ticket that has been assigned means that someone else is working on it.

So have a look around the open tickets and see if you feel as though you can help with ny of them.

If you've got an idea for a feature, but there isn't a ticket for it, feel free to [create one](#suggesting-improvements-and-new-features) and assign it to yourself.
This way, it's easier to keep track on what is being worked on, and we can try to ensure that multiple people aren't unknowingly working on the same thing.


#### Setting up

The code is stored in a Git repository. To get started either [clone repository or fork the repository](https://github.com/GreenImp/rpg-dice-roller).

Make sure that you're either checkout the `develop` branch, or a `feature` / `hotfix` branch for the task you're working on, and _not_ the `master branch.

> **Note:** You should never work directly on the `master` branch. Any pull requests on to `master` will, unfortunately have to be rejected and moved to `develop`.
> See the [Branching model](#branching-model) section for more information.


#### File structure

The project file structure is split up into logical groups:

```
/
|- demo/
|- lib/
   |- esm/
   |- umd/
|- src/
|- tests/
```

* `root` contains mostly meta files, such as the `.babelrc`, `eslintrc.json`. `rollup.config.js` and other files used for the generation of the library.

* `lib` contains the compiled Javascript files, in both EcmaScript and UMD versions, in the `esm` and `umd` directories. Do **not** manually change the files in this directory as any changes will be overwritten.

* `src` is where the magic happens. This contains all the original Javascript ES modules that get compiled. It is these files that you should modify.
* `tests` contain [Jest tests](#testing-your-code). If you make changes to the source code, you should update / add tests to cover the changes.


#### Compiling and building the code

If you want to see what how your code functions, you'll need to compile the source code to the `lib` directory. There are several ways of doing this, depending on the required outcome.

There are several scripts to help:

```bash
# compile compressed version of the ES and UMD files
npm run build

# compile un-compressed version of the ES and UMD files
npm run build:dev

# watch the `src` directory for changes and compile un-compressed ES files on change
npm run watch
```


#### Testing your code

We utilise both a [JavaScript linter](#javaScript-style-guide) and a [testing framework](#testing) to ensure that all code conforms to certain standards and any new code doesn't break existing code, or otherwise behave unexpectedly.

You do **not** need to build / compile the code before linting or testing. Both the linter and tests run on the original source code.

All code must pass both the linter and the tests. You can read more about them in the [Styles and standards](#styles-and-standards) section.


### Pull requests

When creating a pull request, there are several things that need to be considered, to ensure that the quality of the library is kept, and that the code remains readable and manageable

Please follow these steps so that your pull request can be considered by the maintainers:

* If the pull request relates to a ticket, ensure that the ticket number is referenced in the description of the pull request.
* Provide a description of what the pull request is trying to achieve. If there is a related ticket, then the description can be brief. Otherwise, please provide enough detail for the reviewer to understand what bug it fixes, or feature it implements, and why.
* Follow the [style guides](#styles-and-standards).
* After submitting your pull request, verify that all [status checks](https://help.github.com/articles/about-status-checks/) are passing.

> **What if the status checks are failing?** Check what is failing. If you believe that the failure is unrelated to your change, please leave a comment on the pull request explaining why you believe the failure is unrelated. A maintainer can re-run the status checks and determine if it's a false positive, or otherwise unrelated to your changes.


## Styles and standards

### Git

#### Branching model

We use the [git-flow branching model](https://nvie.com/posts/a-successful-git-branching-model/).
This means that there is always a `master` branch and a `develop` branch, and there may be other branches that follow the git-flow naming conventions.

* The `master` branch is is the current latest release, and should only be modified when making a release.
* The `develop` branch is where all the fun happens, and where we can work and make our changes (Although these should generally be done on a feature branch).


#### Commit messages

* Use the present tense (e.g. "Add feature" not "Added feature").
* Use the imperative mood (e.g. "Enhance fudge die rolls" not "Enhances fudge die rolls").
* Limit the first line to 72 characters or less.
* Reference relevant ticket numbers after the first line.


### JavaScript style guide

All JavaScript must adhere to the [Airbnb standard style](https://airbnb.io/javascript/). This is to make sure that the code is readable and more maintainable for everyone.

We use [ESLint](https://eslint.org/) to ensure that the syntax is correct and meets the standards.

You can check if the code conforms to the standards by running the following in the console:

```bash
npm run lint
```

If there are problems, it will show you the files and line numbers for each issue.


### Testing

We use [Jest](https://jestjs.io/) to test the library. The tests can be found in the `/tests` directory.

When writing tests, ensure that they are thoughtfully-worded, and well structured, so that it is both easy to understand and maintain.

You can check if the code passes all of the tests by running the following in the console:

```bash
npm test
```

This runs the [JavaScript Linter](#javaScript-style-guide) first, and then the tests, so if the linter fails, then the tests will not be run.
