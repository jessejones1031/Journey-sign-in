const assert = require('assert');
const calculateTeenData = require('../calculateTeenData');

// Helper to mock the current date during the test
function withMockedDate(isoDate, fn) {
  const RealDate = Date;
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        return new RealDate(isoDate);
      }
      return new RealDate(...args);
    }
    static now() {
      return new RealDate(isoDate).getTime();
    }
    static parse(str) {
      return RealDate.parse(str);
    }
    static UTC(...args) {
      return RealDate.UTC(...args);
    }
  };
  try {
    fn();
  } finally {
    global.Date = RealDate;
  }
}

withMockedDate('2024-07-15T00:00:00Z', () => {
  const sample = { gradYear: 2027, confirmationLevel: '3' };
  const result = calculateTeenData(sample);

  assert.strictEqual(result.currentGrade, 9);
  assert.strictEqual(result.confirmationYear, 2033);
});

console.log('calculateTeenData test passed');
