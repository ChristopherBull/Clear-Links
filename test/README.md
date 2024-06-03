# Testing Strategy

This repository follows a testing strategy that combines Mocha for unit testing and Playwright for end-to-end (e2e) testing.

## Unit Testing

Unit tests are located under the `./test/spec` folder. We use Mocha, a popular JavaScript testing framework, to write and run these tests. Mocha provides a simple and flexible syntax for writing test cases and assertions.

To run the unit tests, follow these steps:

1. Install the project dependencies by running `npm install`.
2. Execute the unit tests by running `npm test`.

## End-to-End (E2E) Testing

End-to-end tests are located under the `./test/e2e` folder. We use Playwright, a powerful automation library, to write and execute these tests. Playwright allows us to simulate user interactions and test the application's behavior in a real browser environment. Important due to the use of browser APIs.

To run the end-to-end tests, follow these steps:

1. Install the project dependencies by running `npm install`.
2. Execute the e2e tests by running `npm run test:e2e`.
