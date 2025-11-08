# Coveralls Next

[![Build Status][ci-image]][ci-url] [![Coverage Status][coveralls-image]][coveralls-url]

This is just a fork of [coveralls](https://github.com/nickmerwin/node-coveralls) with updated dependencies. It replaces the deprecated [request](https://github.com/request/request) library with native Node.js `fetch()` and `FormData` APIs (available in Node 20+). It also replaces [xo](https://github.com/xojs/xo) with eslint and prettier with google settings as xo used a bunch of deprecated dependencies.

[Coveralls.io](https://coveralls.io/) support for Node.js. Get the great coverage reporting of coveralls.io and add a cool coverage button (like the one above) to your README.

## Supported CI services:

* [GitHub Actions](https://github.com/features/actions)
* [CircleCI](https://circleci.com/)
* [GitLab CI](https://gitlab.com/)
* [Jenkins](https://jenkins.io/)
* [Azure Pipelines](https://azure.microsoft.com/en-us/products/devops/pipelines/)
* [Buildkite](https://buildkite.com/)
* [Travis CI](https://travis-ci.org/)
* [Semaphore](https://semaphoreci.com/)
* [Drone](https://www.drone.io/)
* [AppVeyor](https://www.appveyor.com/)
* [Codefresh](https://codefresh.io/)
* [CodeShip](https://codeship.com/)* - _being sunset by CloudBees_

## Installation:

Add the latest version of `coveralls-next` to your package.json:

```shell
npm install coveralls-next --save-dev
```

If you're using mocha, add `mocha-lcov-reporter` to your package.json:

```shell
npm install mocha-lcov-reporter --save-dev
```

## Usage:

This script `bin/coveralls.js` can take standard input from any tool that emits the lcov data format (including [mocha](https://mochajs.org/)'s [LCOV reporter](https://npmjs.org/package/mocha-lcov-reporter)) and send it to coveralls.io to report your code coverage there.

Once your app is instrumented for coverage, and building, you need to pipe the lcov output to `coveralls` (or `./node_modules/coveralls-next/bin/coveralls.js` if using the direct path).

This library currently supports [Travis CI](https://travis-ci.org/) with no extra effort beyond piping the lcov output to coveralls. However, if you're using a different build system, there are a few **necessary** environment variables:

- `COVERALLS_SERVICE_NAME` (the name of your build system)
- `COVERALLS_REPO_TOKEN` (the secret repo token from coveralls.io)
- `COVERALLS_GIT_BRANCH` (the branch name)

There are optional environment variables for other build systems as well:

- `COVERALLS_FLAG_NAME` (a flag name to differentiate jobs, e.g. Unit, Functional, Integration)
- `COVERALLS_SERVICE_NUMBER` (a number that uniquely identifies the build)
- `COVERALLS_SERVICE_JOB_ID` (an ID that uniquely identifies the build's job)
- `COVERALLS_SERVICE_JOB_NUMBER` (a number that uniquely identifies the build's job)
- `COVERALLS_RUN_AT` (a date string for the time that the job ran. RFC 3339 dates work. This defaults to your build system's date/time if you don't set it)
- `COVERALLS_PARALLEL` (set to `true` when running jobs in parallel, requires a completion webhook. More info here: <https://docs.coveralls.io/parallel-build-webhook>)
- `COVERALLS_ENDPOINT` (overrides the default Coveralls API endpoint. Useful for enterprise or self-hosted instances. Defaults to `https://coveralls.io`)
- `NODE_COVERALLS_DEBUG` (set to `1` to enable debug-level logging. Alternative to using the `-v` or `--verbose` flag)

### GitHub Actions CI

GitHub Actions users have two options:

1. **Use the official GitHub Action** (recommended for simplicity): [coverallsapp/github-action](https://github.com/coverallsapp/github-action) - This is the easiest approach and doesn't require adding this library to your dependencies.

2. **Use this library directly** (more control): Install `coveralls-next` and pipe your coverage data to it in your workflow, just like you would in any other CI environment. This approach gives you more flexibility in how you configure and run coverage reporting.

See this project's own [workflow](.github/workflows/test.yml) for an example of using `coveralls-next` directly in GitHub Actions, or check out the [parallel runs example](https://github.com/coverallsapp/coveralls-node-demo/blob/master/.github/workflows/workflow.yml) using the official action.

### [CircleCI Orb](https://circleci.com/)

If you use this then there is no reason to have coveralls or coveralls-next library in your package as it has it's own npm version in the step. This doesn't use this library but the original coveralls npm package which will work just the same.

Here's our Orb for quick integration: [coveralls/coveralls](https://circleci.com/orbs/registry/orb/coveralls/coveralls)

Workflow example: [config.yml](https://github.com/coverallsapp/coveralls-node-demo/blob/master/.circleci/config.yml)

### [Travis-CI](https://travis-ci.org/)

Parallel jobs example: [.travis.yml](https://github.com/coverallsapp/coveralls-node-demo/blob/master/.travis.yml)

### [Jest](https://jestjs.io/)

- Install [jest](https://jestjs.io/docs/en/getting-started)
- Use the following to run tests and push files to coveralls on success:

  ```sh
  jest --coverage && coveralls < coverage/lcov.info
  ```

Check out an example [here](https://github.com/Ethan-Arrowood/harperdb-connect/blob/master/.travis.yml) which makes use of Travis CI build stages

### [Vitest](https://vitest.dev/)

[Vitest](https://vitest.dev/) is a modern test framework powered by Vite with built-in coverage support:

```sh
vitest run --coverage.enabled --coverage.reporter=lcov && coveralls < coverage/lcov.info
```

Or configure coverage in `vitest.config.ts`:

```ts
export default {
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['lcov', 'text']
    }
  }
}
```

Then run: `vitest run --coverage && coveralls < coverage/lcov.info`

### [Mocha](https://mochajs.org/)

[Mocha](https://mochajs.org/) with [nyc](https://github.com/istanbuljs/nyc) for coverage:

```sh
nyc mocha && nyc report --reporter=text-lcov | coveralls
```

Or with [c8](https://github.com/bcoe/c8) (modern native V8 coverage):

```sh
c8 mocha && c8 report --reporter=lcov && coveralls < coverage/lcov.info
```

### [c8](https://github.com/bcoe/c8)

Modern code coverage using Node's built-in V8 coverage. Works with any test framework:

```sh
c8 npm test && c8 report --reporter=lcov && coveralls < coverage/lcov.info
```

### [Lab](https://github.com/hapijs/lab)

```sh
lab -r lcov | ./node_modules/.bin/coveralls
```

### [nyc](https://github.com/istanbuljs/nyc)

Works with almost any testing framework. Simply execute
`npm test` with the `nyc` bin followed by running its reporter:

```shell
nyc npm test && nyc report --reporter=text-lcov | coveralls
```

### [TAP](https://github.com/tapjs/node-tap)

Simply run your tap tests with the `COVERALLS_REPO_TOKEN` environment
variable set and tap will automatically use `nyc` to report
coverage to coveralls.

### Command Line Parameters

```shell
Usage: coveralls.js [-v] [-s] filepath
```

#### Optional arguments:

- `-v`, `--verbose` - enable verbose/debug logging
- `-s`, `--stdout` - write the coverage JSON payload to stdout instead of sending to Coveralls (useful for debugging)
- `filepath` - optionally defines the base filepath of your source files.

## Running locally

If you're running locally, you must have a `.coveralls.yml` file, as documented in [their documentation](https://docs.coveralls.io/ruby-on-rails#configuration), with your `repo_token` in it; or, you must provide a `COVERALLS_REPO_TOKEN` environment variable on the command-line.

If you want to send commit data to coveralls, you can set the `COVERALLS_GIT_COMMIT` environment-variable to the commit hash you wish to reference. If you don't want to use a hash, you can set it to `HEAD` to supply coveralls with the latest commit data. This requires git to be installed and executable on the current PATH.

## Contributing

I generally don't accept pull requests that are untested or break the build, because I'd like to keep the quality high (this is a coverage tool after all!).

I also don't care for "soft-versioning" or "optimistic versioning" (dependencies that have ^, x, > in them, or anything other than numbers and dots). There have been too many problems with bad semantic versioning in dependencies, and I'd rather have a solid library than a bleeding-edge one.


[ci-image]: https://github.com/jtwebman/coveralls-next/workflows/Tests/badge.svg
[ci-url]: https://github.com/jtwebman/coveralls-next/actions?workflow=Tests

[coveralls-image]: https://coveralls.io/repos/jtwebman/coveralls-next/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/jtwebman/coveralls-next?branch=master
