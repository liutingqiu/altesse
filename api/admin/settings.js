const { send, ensureJSON, checkAuth } = require('../../_utils');
const settings = require('../../../data/settings.json');
module.exports = ensureJSON((req, res) => {
  if (!checkAuth(req, res)) return;
  send(res, 200, settings);
});
