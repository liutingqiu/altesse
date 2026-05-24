const { send, ensureJSON } = require('./_utils');
const works = require('../data/works.json');

module.exports = ensureJSON((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const featured = url.searchParams.get('featured');
  let result = works;
  if (featured === 'true') result = works.filter(w => w.featured);
  send(res, 200, result);
});
