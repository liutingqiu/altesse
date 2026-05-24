const { readData, send } = require('./_utils');

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const featured = url.searchParams.get('featured');
  let works = readData('works');
  if (featured === 'true') works = works.filter(w => w.featured);
  send(res, 200, works);
};
