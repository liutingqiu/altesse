const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

/* ============================================================
   ALTESSE — server.js
   零依赖后端: 静态 + API + 认证 + 安全
   ============================================================ */

const PORT = process.env.PORT || 3009;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');

const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'altesse2026';
const TOKEN_TTL = 24 * 60 * 60 * 1000;

const tokens = new Map();
const rateLimitMap = new Map();
const RATE_LIMIT = 60;

// ── MIME ──
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff'
};

const COMPRESSIBLE_TYPES = ['text/html', 'text/css', 'application/javascript', 'application/json', 'image/svg+xml'];
function isCompressible(ct) { return ct && COMPRESSIBLE_TYPES.some(t => ct.startsWith(t)); }

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block', 'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'unsafe-inline'; connect-src 'self'"
};

// ── 工具 ──
function readJSON(fn) { const p = path.join(DATA_DIR, fn); if (!fs.existsSync(p)) return null; return JSON.parse(fs.readFileSync(p, 'utf-8')); }
function writeJSON(fn, data) { const p = path.join(DATA_DIR, fn); const d = path.dirname(p); if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(p + '.tmp', JSON.stringify(data, null, 2)); fs.renameSync(p + '.tmp', p); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/`/g, '&#96;'); }
function escAttr(s) { return esc(s).replace(/'/g, '&#39;'); }
function hashPassword(pw) { const s = crypto.randomBytes(16).toString('hex'); return s + ':' + crypto.scryptSync(pw, s, 64).toString('hex'); }
function verifyPassword(pw, stored) { const [s, h] = stored.split(':'); if (!s || !h) return false; try { return h === crypto.scryptSync(pw, s, 64).toString('hex'); } catch { return false; } }
function generateToken() { return crypto.randomBytes(24).toString('hex'); }
function getIP(req) { return req.socket.remoteAddress || '127.0.0.1'; }

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let len = 0; const MAX = 1024 * 1024;
    req.on('data', c => { len += c.length; if (len > MAX) { req.destroy(new Error('Body too large')); return; } chunks.push(c); });
    req.on('end', () => { if (!chunks.length) { resolve({}); return; } try { resolve(JSON.parse(Buffer.concat(chunks).toString())); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

function send(req, res, code, data, ct) {
  let body = typeof data === 'string' ? data : JSON.stringify(data);
  if (ct && ct.includes('html') && !body.startsWith('<!DOCTYPE')) body = '<!DOCTYPE html>\n' + body;
  const accept = req.headers['accept-encoding'] || '';
  if (accept.includes('gzip') && isCompressible(ct)) {
    const buf = zlib.gzipSync(Buffer.from(body));
    res.writeHead(code, { 'Content-Type': ct || 'application/json; charset=utf-8', 'Content-Encoding': 'gzip', ...SECURITY_HEADERS, 'Content-Length': buf.length });
    res.end(buf); return;
  }
  res.writeHead(code, { 'Content-Type': ct || 'application/json; charset=utf-8', ...SECURITY_HEADERS, 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function authCheck(req) {
  const auth = req.headers['authorization']; if (!auth || !auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7); const entry = tokens.get(token);
  if (!entry) return false; if (Date.now() > entry.expires) { tokens.delete(token); return false; } return entry;
}

function rateLimitCheck(ip) {
  const now = Date.now(); const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) { rateLimitMap.set(ip, { count: 1, reset: now + 60000 }); return true; }
  if (entry.count >= RATE_LIMIT) return false; entry.count++; return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitMap) { if (now > v.reset) rateLimitMap.delete(k); }
  for (const [k, v] of tokens) { if (now > v.expires) tokens.delete(k); }
}, 120000);

function initAdmin() {
  const users = readJSON('users.json');
  if (!users || !users.length) {
    writeJSON('users.json', [{ id: 'u001', username: 'admin', password: hashPassword(ADMIN_DEFAULT_PASSWORD), role: 'owner', displayName: 'Atelier Director', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
    console.log('[init] Admin user created. Use ADMIN_PASSWORD env or default.');
  }
}
initAdmin();

// ═══════════════════════════════════════════
// HTTP Server
// ═══════════════════════════════════════════

async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname, method = req.method.toUpperCase(), ip = getIP(req);
  if (!rateLimitCheck(ip)) { send(req, res, 429, { error: 'Too many requests.' }); return; }

  try {
    // ── 公共 API ──

    if (pathname === '/api/works' && method === 'GET') {
      let works = readJSON('works.json') || [];
      const col = url.searchParams.get('collection'), feat = url.searchParams.get('featured'), id = url.searchParams.get('id');
      if (col) works = works.filter(w => w.collection === col);
      if (feat === 'true') works = works.filter(w => w.featured);
      if (id) works = works.filter(w => w.id === id);
      works.sort((a, b) => (a.order || 99) - (b.order || 99));
      send(req, res, 200, works); return;
    }

    if (pathname === '/api/collections' && method === 'GET') {
      const cols = readJSON('collections.json') || [];
      send(req, res, 200, cols.filter(c => c.active !== false).sort((a, b) => (a.order || 99) - (b.order || 99)));
      return;
    }

    if (pathname === '/api/settings' && method === 'GET') {
      send(req, res, 200, readJSON('settings.json') || {}); return;
    }

    if (pathname === '/api/contact' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.name || !body.email || !body.message) { send(req, res, 400, { error: 'Name, email, message required.' }); return; }
      const msgs = readJSON('messages.json') || [];
      msgs.push({ id: 'm' + Date.now(), name: esc(body.name), email: esc(body.email), phone: esc(body.phone || ''), subject: esc(body.subject || ''), message: esc(body.message), read: false, createdAt: new Date().toISOString() });
      writeJSON('messages.json', msgs);
      send(req, res, 201, { success: true }); return;
    }

    // ── 管理 API ──

    if (pathname === '/api/admin/login' && method === 'POST') {
      const { username, password } = await parseBody(req);
      const users = readJSON('users.json') || []; const user = users.find(u => u.username === username);
      if (!user || !verifyPassword(password, user.password)) { send(req, res, 401, { error: 'Invalid credentials.' }); return; }
      const token = generateToken(); tokens.set(token, { username: user.username, role: user.role, expires: Date.now() + TOKEN_TTL });
      send(req, res, 200, { token, role: user.role, displayName: user.displayName }); return;
    }

    if (pathname === '/api/admin/check' && method === 'GET') {
      const a = authCheck(req); if (!a) { send(req, res, 401, {}); return; }
      send(req, res, 200, { username: a.username, role: a.role }); return;
    }

    if (pathname === '/api/admin/logout' && method === 'POST') {
      const auth = req.headers['authorization']; if (auth && auth.startsWith('Bearer ')) tokens.delete(auth.slice(7));
      send(req, res, 200, { success: true }); return;
    }

    if (pathname === '/api/admin/change-password' && method === 'POST') {
      const a = authCheck(req); if (!a) { send(req, res, 401, {}); return; }
      const { oldPassword, newPassword } = await parseBody(req);
      const users = readJSON('users.json'); const user = users.find(u => u.username === a.username);
      if (!user || !verifyPassword(oldPassword, user.password)) { send(req, res, 401, { error: 'Incorrect password.' }); return; }
      user.password = hashPassword(newPassword); user.updatedAt = new Date().toISOString();
      writeJSON('users.json', users); send(req, res, 200, { success: true }); return;
    }

    // ── Works CRUD ──
    if (pathname === '/api/admin/works') {
      const a = authCheck(req); if (!a) { send(req, res, 401, {}); return; }
      if (method === 'GET') { const w = readJSON('works.json') || []; w.sort((x, y) => (x.order || 99) - (y.order || 99)); send(req, res, 200, w); return; }
      if (method === 'POST') {
        const b = await parseBody(req); const works = readJSON('works.json') || [];
        const w = { id: 'w' + Date.now(), name: esc(b.name || ''), nameZh: esc(b.nameZh || ''), collection: esc(b.collection || ''), inspiration: esc(b.inspiration || ''), inspirationZh: esc(b.inspirationZh || ''), craft: esc(b.craft || ''), craftZh: esc(b.craftZh || ''), images: (b.images || []).map(img => esc(img)), videoUrl: esc(b.videoUrl || ''), featured: !!b.featured, order: parseInt(b.order) || works.length + 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        works.push(w); writeJSON('works.json', works); send(req, res, 201, w); return;
      }
      if (method === 'PUT') {
        const b = await parseBody(req); const works = readJSON('works.json') || []; const i = works.findIndex(w => w.id === b.id);
        if (i === -1) { send(req, res, 404, { error: 'Not found.' }); return; }
        const e = works[i]; works[i] = { ...e, name: b.name !== undefined ? esc(b.name) : e.name, nameZh: b.nameZh !== undefined ? esc(b.nameZh) : e.nameZh, collection: b.collection !== undefined ? esc(b.collection) : e.collection, inspiration: b.inspiration !== undefined ? esc(b.inspiration) : e.inspiration, inspirationZh: b.inspirationZh !== undefined ? esc(b.inspirationZh) : e.inspirationZh, craft: b.craft !== undefined ? esc(b.craft) : e.craft, craftZh: b.craftZh !== undefined ? esc(b.craftZh) : e.craftZh, images: b.images !== undefined ? b.images.map(img => esc(img)) : e.images, videoUrl: b.videoUrl !== undefined ? esc(b.videoUrl) : e.videoUrl, featured: b.featured !== undefined ? !!b.featured : e.featured, order: b.order !== undefined ? parseInt(b.order) : e.order, updatedAt: new Date().toISOString() };
        writeJSON('works.json', works); send(req, res, 200, works[i]); return;
      }
      if (method === 'DELETE') {
        const id = url.searchParams.get('id'); if (!id) { send(req, res, 400, { error: 'id required' }); return; }
        let works = readJSON('works.json') || []; const i = works.findIndex(w => w.id === id);
        if (i === -1) { send(req, res, 404, { error: 'Not found.' }); return; }
        works.splice(i, 1); writeJSON('works.json', works); send(req, res, 200, { success: true }); return;
      }
    }

    // ── Collections CRUD ──
    if (pathname === '/api/admin/collections') {
      const a = authCheck(req); if (!a) { send(req, res, 401, {}); return; }
      if (method === 'GET') { send(req, res, 200, readJSON('collections.json') || []); return; }
      if (method === 'POST') {
        const b = await parseBody(req); const cols = readJSON('collections.json') || [];
        const c = { id: 'c' + Date.now(), name: esc(b.name || ''), nameZh: esc(b.nameZh || ''), description: esc(b.description || ''), descriptionZh: esc(b.descriptionZh || ''), coverImage: esc(b.coverImage || ''), active: b.active !== false, order: parseInt(b.order) || cols.length + 1, createdAt: new Date().toISOString() };
        cols.push(c); writeJSON('collections.json', cols); send(req, res, 201, c); return;
      }
      if (method === 'PUT') {
        const b = await parseBody(req); const cols = readJSON('collections.json') || []; const i = cols.findIndex(c => c.id === b.id);
        if (i === -1) { send(req, res, 404, {}); return; }
        cols[i] = { id: cols[i].id, name: esc(b.name !== undefined ? b.name : cols[i].name), nameZh: esc(b.nameZh !== undefined ? b.nameZh : cols[i].nameZh), description: esc(b.description !== undefined ? b.description : cols[i].description), descriptionZh: esc(b.descriptionZh !== undefined ? b.descriptionZh : cols[i].descriptionZh), coverImage: esc(b.coverImage !== undefined ? b.coverImage : cols[i].coverImage), active: b.active !== undefined ? b.active : cols[i].active, order: b.order !== undefined ? parseInt(b.order) : cols[i].order, createdAt: cols[i].createdAt, updatedAt: new Date().toISOString() };
        writeJSON('collections.json', cols); send(req, res, 200, cols[i]); return;
      }
      if (method === 'DELETE') {
        const id = url.searchParams.get('id'); if (!id) { send(req, res, 400, {}); return; }
        let cols = readJSON('collections.json') || []; const i = cols.findIndex(c => c.id === id);
        if (i === -1) { send(req, res, 404, {}); return; }
        cols.splice(i, 1); writeJSON('collections.json', cols); send(req, res, 200, { success: true }); return;
      }
    }

    // ── Settings ──
    if (pathname === '/api/admin/settings') {
      const a = authCheck(req); if (!a) { send(req, res, 401, {}); return; }
      if (method === 'GET') { send(req, res, 200, readJSON('settings.json') || {}); return; }
      if (method === 'PUT') {
        const b = await parseBody(req);
        const merged = readJSON('settings.json') || {};
        const s = {
          ...merged,
          siteName: b.siteName !== undefined ? esc(b.siteName) : merged.siteName,
          siteTagline: b.siteTagline !== undefined ? esc(b.siteTagline) : merged.siteTagline,
          siteTaglineZh: b.siteTaglineZh !== undefined ? esc(b.siteTaglineZh) : merged.siteTaglineZh,
          email: b.email !== undefined ? esc(b.email) : merged.email,
          whatsapp: b.whatsapp !== undefined ? esc(b.whatsapp) : merged.whatsapp,
          instagram: b.instagram !== undefined ? esc(b.instagram) : merged.instagram,
          address: b.address !== undefined ? esc(b.address) : merged.address,
          seo: b.seo !== undefined ? b.seo : merged.seo,
          announcement: b.announcement !== undefined ? {
            ...merged.announcement,
            ...b.announcement,
            text: b.announcement.text !== undefined ? esc(b.announcement.text) : merged.announcement?.text,
            textZh: b.announcement.textZh !== undefined ? esc(b.announcement.textZh) : merged.announcement?.textZh,
            textEs: b.announcement.textEs !== undefined ? esc(b.announcement.textEs) : merged.announcement?.textEs,
            textFr: b.announcement.textFr !== undefined ? esc(b.announcement.textFr) : merged.announcement?.textFr,
            textRu: b.announcement.textRu !== undefined ? esc(b.announcement.textRu) : merged.announcement?.textRu,
            textAr: b.announcement.textAr !== undefined ? esc(b.announcement.textAr) : merged.announcement?.textAr,
            textJa: b.announcement.textJa !== undefined ? esc(b.announcement.textJa) : merged.announcement?.textJa,
            textKo: b.announcement.textKo !== undefined ? esc(b.announcement.textKo) : merged.announcement?.textKo,
            textDe: b.announcement.textDe !== undefined ? esc(b.announcement.textDe) : merged.announcement?.textDe,
            textPt: b.announcement.textPt !== undefined ? esc(b.announcement.textPt) : merged.announcement?.textPt,
            textHi: b.announcement.textHi !== undefined ? esc(b.announcement.textHi) : merged.announcement?.textHi,
            textId: b.announcement.textId !== undefined ? esc(b.announcement.textId) : merged.announcement?.textId,
            textTr: b.announcement.textTr !== undefined ? esc(b.announcement.textTr) : merged.announcement?.textTr,
            textIt: b.announcement.textIt !== undefined ? esc(b.announcement.textIt) : merged.announcement?.textIt
          } : merged.announcement
        };
        writeJSON('settings.json', s);
        send(req, res, 200, s); return;
      }
    }

    // ── Messages ──
    if (pathname === '/api/admin/messages') {
      const a = authCheck(req); if (!a) { send(req, res, 401, {}); return; }
      if (method === 'GET') { const msgs = readJSON('messages.json') || []; msgs.sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt)); send(req, res, 200, msgs); return; }
      if (method === 'PUT') { const b = await parseBody(req); const msgs = readJSON('messages.json') || []; const i = msgs.findIndex(m => m.id === b.id); if (i === -1) { send(req, res, 404, {}); return; } if (b.read !== undefined) msgs[i].read = b.read; writeJSON('messages.json', msgs); send(req, res, 200, msgs[i]); return; }
      if (method === 'DELETE') { const id = url.searchParams.get('id'); let msgs = readJSON('messages.json') || []; const i = msgs.findIndex(m => m.id === id); if (i === -1) { send(req, res, 404, {}); return; } msgs.splice(i, 1); writeJSON('messages.json', msgs); send(req, res, 200, { success: true }); return; }
    }

    // ── 静态文件 ──
    if (pathname.startsWith('/data/')) { send(req, res, 403, { error: 'Forbidden.' }); return; }
    let fp = path.join(ROOT, pathname === '/' ? 'index.html' : pathname.slice(1));
    if (!fp.startsWith(ROOT)) { send(req, res, 403, {}); return; }
    const ext = path.extname(fp).toLowerCase();
    if (!fs.existsSync(fp)) {
      const spaPaths = ['/', '/collections', '/atelier', '/about', '/contact'];
      const isSpaPath = spaPaths.includes(pathname) || pathname.startsWith('/collections') || pathname.startsWith('/atelier');
      if (isSpaPath && !pathname.startsWith('/api')) {
        fp = path.join(ROOT, 'index.html');
      } else {
        send(req, res, 404, {}); return;
      }
    }
    if (fs.statSync(fp).isDirectory()) { fp = path.join(fp, 'index.html'); if (!fs.existsSync(fp)) { send(req, res, 404, {}); return; } }
    try {
      const content = fs.readFileSync(fp); const ct = MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream';
      const acceptEncoding = req.headers['accept-encoding'] || '';
      if (isCompressible(ct) && acceptEncoding.includes('gzip')) {
        try {
          const compressed = zlib.gzipSync(content); const cacheMax = fp.endsWith('.html') ? 0 : 86400;
          res.writeHead(200, { 'Content-Type': ct, 'Content-Encoding': 'gzip', 'Cache-Control': 'public, max-age=' + cacheMax, ...SECURITY_HEADERS, 'Content-Length': compressed.length });
          res.end(compressed);
        } catch (gzipErr) {
          const cacheMax = fp.endsWith('.html') ? 0 : 86400;
          res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'public, max-age=' + cacheMax, ...SECURITY_HEADERS, 'Content-Length': content.length });
          res.end(content);
          console.error('Gzip error:', gzipErr.message);
        }
      } else { const cacheMax = fp.endsWith('.html') ? 0 : 86400; res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'public, max-age=' + cacheMax, ...SECURITY_HEADERS, 'Content-Length': content.length }); res.end(content); }
    } catch (err) { send(req, res, 500, { error: 'Internal error.' }); console.error('Static:', err.stack || err.message); }

  } catch (err) {
    console.error('Server:', err.stack || err.message);
    if (!res.headersSent) send(req, res, 500, { error: 'Internal error.' });
  }
}

function startServer(port) {
  const server = http.createServer(handler);
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log('Port ' + port + ' in use, trying ' + (port + 1) + '…');
      startServer(port + 1);
    } else { throw err; }
  });
  server.listen(port, () => {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   ALTESSE Haute Couture                  ║');
    console.log('║   http://localhost:' + String(port).padEnd(25) + '║');
    console.log('╚══════════════════════════════════════════╝');
  });
}
startServer(PORT);
