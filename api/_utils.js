// ALTESSE API Utilities — Vercel Serverless
const fs = require('fs');
const path = require('path');

function send(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(data));
}

function getBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

// HTML files sometimes get served as API errors — catch that
function ensureJSON(fn) {
  return (req, res) => {
    try { fn(req, res); }
    catch (e) { send(res, 500, { error: e.message }); }
  };
}

function checkAuth(req, res) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    send(res, 401, { error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { send, getBody, ensureJSON, checkAuth };
