const { send, ensureJSON, checkAuth } = require('../../_utils');
const works = require('../../data/works.json');
module.exports = ensureJSON((req, res) => {
  if (!checkAuth(req, res)) return;
  if (req.method === 'GET') return send(res, 200, works);
  send(res, 200, { success: true, note: 'Read-only. Use local server for edits.' });
});
