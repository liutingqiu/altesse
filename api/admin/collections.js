const { send, ensureJSON, checkAuth } = require('../../_utils');
const cols = require('../../../data/collections.json');
module.exports = ensureJSON((req, res) => {
  if (!checkAuth(req, res)) return;
  send(res, 200, cols);
});
