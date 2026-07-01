const React = require('react');

const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  setParams: jest.fn(),
};

let mockSearchParams = {};
let mockPathname = '/';

function __setMockSearchParams(params) {
  mockSearchParams = params;
}

function __setMockPathname(pathname) {
  mockPathname = pathname;
}

function useLocalSearchParams() {
  return mockSearchParams;
}

function usePathname() {
  return mockPathname;
}

function Redirect({ href }) {
  return React.createElement('Redirect', { href });
}

function Link({ href, children }) {
  return React.createElement('Link', { href }, children);
}

function Stack() {
  return null;
}
Stack.Screen = function StackScreen() {
  return null;
};

module.exports = {
  router,
  useLocalSearchParams,
  usePathname,
  useRouter: () => router,
  Redirect,
  Link,
  Stack,
  __setMockSearchParams,
  __setMockPathname,
};
