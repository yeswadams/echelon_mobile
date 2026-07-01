const { Alert } = require('react-native');

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

afterEach(() => {
  jest.clearAllMocks();
});
