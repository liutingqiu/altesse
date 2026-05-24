const { readData, send } = require('./_utils');

// Vercel 无持久写入 → admin CRUD 只读
module.exports = (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname.replace(/^\/api\/admin/, '');

  // Token check
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return send(res, 401, { error: 'Unauthorized' });

  if (pathname === '/check') return send(res, 200, { authenticated: true, role: 'admin' });
  if (pathname === '/works') return send(res, 200, readData('works'));
  if (pathname === '/collections') return send(res, 200, readData('collections'));
  if (pathname === '/messages') return send(res, 200, readData('messages'));
  if (pathname === '/settings') {
    if (req.method === 'GET') return send(res, 200, readData('settings'));
    if (req.method === 'PUT') return send(res, 200, { success: true, note: 'Read-only on Vercel. Use local server for edits.' });
  }

  send(res, 200, []);
};
