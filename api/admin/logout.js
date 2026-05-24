const { send, ensureJSON } = require('../../_utils');
module.exports = ensureJSON((req, res) => {
  send(res, 200, { success: true });
});
