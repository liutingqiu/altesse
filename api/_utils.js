const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');

function readData(name) {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, name + '.json'), 'utf8')); }
  catch { return name === 'messages' ? [] : (name === 'settings' ? {} : []); }
}

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

module.exports = { readData, send, getBody };
