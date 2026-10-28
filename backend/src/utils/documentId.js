const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidDocumentId(id) {
  return typeof id === 'string' && uuidPattern.test(id);
}

module.exports = { isValidDocumentId };