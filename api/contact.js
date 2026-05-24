const { send, ensureJSON, getBody } = require('../_utils');

module.exports = ensureJSON(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const data = await getBody(req);
  if (!data.name || !data.email || !data.message) return send(res, 400, { error: 'Missing required fields' });
  send(res, 200, { success: true, message: 'Merci! We will be in touch within 48 hours.' });
});
