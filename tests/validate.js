const { validateOpenAPI } = require('..');
const assert              = require('assert');

describe('validateOpenAPI', function() {
  it('should load ok with valid file', function() {
    let specObj = validateOpenAPI('tests/swagger.yaml');
    assert.equal(specObj.openapi, '3.0.0');
  });
});

