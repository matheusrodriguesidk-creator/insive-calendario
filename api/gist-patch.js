const https = require('https');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const GIST_ID = process.env.GIST_ID;
  const TOKEN   = process.env.GIST_TOKEN;
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const options = {
      hostname: 'api.github.com',
      path: `/gists/${GIST_ID}`,
      method: 'PATCH',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'insive-calendario',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const pr = https.request(options, (r) => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(r.statusCode).send(d);
      });
    });
    pr.on('error', e => res.status(500).send(e.message));
    pr.write(body); pr.end();
  });
};
