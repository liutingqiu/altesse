const { readData, send, getBody } = require('./_utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const { username, password } = await getBody(req);
  const users = readData('users');
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return send(res, 401, { error: 'Invalid credentials' });
  send(res, 200, { token: 'altesse_vercel_token', role: user.role });
};
