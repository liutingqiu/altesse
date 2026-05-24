const { send, ensureJSON } = require('../_utils');
const settings = require('../../data/settings.json');
module.exports = ensureJSON((req, res) => send(res, 200, settings));
