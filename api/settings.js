const { readData, send } = require('./_utils');
module.exports = (req, res) => { send(res, 200, readData('settings')); };
