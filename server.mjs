import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const UPSTREAM_TIMEOUT_MS = 9000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml'
};

const timedFetch = (url, opts = {}) =>
  fetch(url, { ...opts, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });

async function proxyCbr(url, res) {
  const endpoint = url.searchParams.get('endpoint') || 'daily';
  const today = new Date();
  const fmt = (d) =>
    `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

  let cbrUrl = '';
  switch (endpoint) {
    case 'daily': {
      const custom = url.searchParams.get('date');
      cbrUrl = custom
        ? `https://www.cbr.ru/scripts/XML_daily.asp?date_req=${custom.split('-').reverse().join('/')}`
        : `https://www.cbr.ru/scripts/XML_daily.asp?date_req=${fmt(today)}`;
      break;
    }
    case 'dynamic': {
      const days = parseInt(url.searchParams.get('days') || '30', 10);
      const from = new Date(today.getTime() - days * 86400000);
      cbrUrl = `https://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=${fmt(from)}&date_req2=${fmt(today)}&VAL_NM_RQ=${url.searchParams.get('code') || 'R01235'}`;
      break;
    }
    case 'metals': {
      const from = new Date(today.getTime() - 86400000);
      cbrUrl = `https://www.cbr.ru/scripts/XML_metall.asp?date_req1=${fmt(from)}&date_req2=${fmt(today)}`;
      break;
    }
    case 'keyrate':
      cbrUrl = 'https://www.cbr.ru/hd_base/KeyRate/';
      break;
    default:
      return res.writeHead(400).end('Unknown CBR endpoint');
  }

  const r = await timedFetch(cbrUrl, {
    headers: { 'User-Agent': 'StudentDashboard/1.0 (student@example.com)' }
  });
  const buf = await r.arrayBuffer();
  let body = new TextDecoder('windows-1251').decode(buf);
  if (endpoint !== 'keyrate') {
    body = '<?xml version="1.0" encoding="UTF-8"?>\n' + body.replace(/<\?xml[^>]*\?>/i, '');
  }
  res.writeHead(r.status, {
    'Content-Type': endpoint === 'keyrate'
      ? 'text/html; charset=utf-8'
      : 'application/xml; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

async function proxyMoex(url, res) {
  const type = url.searchParams.get('type') || 'shares';

  let issUrl;
  if (type === 'shares') {
    // Топ-10 ликвидных бумаг TQBR
    const ids = 'SBER,GAZP,LKOH,GMKN,ROSN,NVTK,SNGSP,VTBR,MTSS,MGNT';
    issUrl = `https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=marketdata,securities&securities=${ids}&marketdata.columns=SECID,LAST,LASTCHANGEPRCNT&securities.columns=SECID,SHORTNAME`;
  } else if (type === 'index') {
    // Индексы МосБиржи и РТС — берём с board SNDX
    issUrl = `https://iss.moex.com/iss/engines/stock/markets/index/boards/SNDX/securities.json?iss.meta=off&iss.only=marketdata,securities&securities=IMOEX,RTSI&marketdata.columns=SECID,CURRENTVALUE,LASTCHANGEPRCNT&securities.columns=SECID,SHORTNAME`;
  } else {
    return res.writeHead(400).end('Unknown MOEX type');
  }

  const r = await timedFetch(issUrl, {
    headers: { 'User-Agent': 'StudentDashboard/1.0 (student@example.com)' }
  });
  const text = await r.text();

  res.writeHead(r.status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(text);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === '/api/cbr')  return await proxyCbr(url, res);
    if (url.pathname === '/api/moex') return await proxyMoex(url, res);

    const filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
    const data = await fs.promises.readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  } catch (err) {
    console.error('❌', req.url, '→', err.name || err.message);
    const status = err.code === 'ENOENT' ? 404
                 : err.name === 'TimeoutError' ? 504 : 500;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on port ${PORT}`));