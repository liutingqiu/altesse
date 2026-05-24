const { send, ensureJSON, checkAuth } = require('../../_utils');
const works = require('../../../data/works.json');
module.exports = ensureJSON((req, res) => {
  if (!checkAuth(req, res)) return;
  send(res, 200, works);
});
