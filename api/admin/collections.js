const { readData, send } = require('../_utils');
module.exports = (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return send(res, 401, { error: 'Unauthorized' });
  send(res, 200, readData('collections'));
};
