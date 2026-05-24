const { send, ensureJSON } = require('../_utils');
const cols = require('../../data/collections.json');
module.exports = ensureJSON((req, res) => send(res, 200, cols));
