const { readData, send, getBody } = require('./_utils');
const crypto = require('crypto');

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  return hash === crypto.scryptSync(password, salt, 64).toString('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const { username, password } = await getBody(req);
  const users = readData('users');
  const user = users.find(u => u.username === username);
  if (!user || !verifyPassword(password, user.password)) return send(res, 401, { error: 'Invalid credentials' });
  send(res, 200, { token: 'altesse_vercel_token', role: user.role });
};
