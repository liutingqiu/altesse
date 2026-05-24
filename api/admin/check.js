const { send, ensureJSON, checkAuth } = require('../../_utils');
module.exports = ensureJSON((req, res) => {
  if (!checkAuth(req, res)) return;
  send(res, 200, { authenticated: true, role: 'admin' });
});
