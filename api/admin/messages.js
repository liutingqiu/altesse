const { send, ensureJSON, checkAuth } = require('../../_utils');
const msgs = require('../../../data/messages.json');
module.exports = ensureJSON((req, res) => {
  if (!checkAuth(req, res)) return;
  send(res, 200, msgs);
});
