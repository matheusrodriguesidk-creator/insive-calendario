const https = require('https');
module.exports = async (req, res) => {
  const GIST_ID = process.env.GIST_ID;
  const TOKEN   = process.env.GIST_TOKEN;
  https.get({
    hostname: 'api.github.com',
    path: `/gists/${GIST_ID}`,
    headers: { 'Authorization': `token ${TOKEN}`, 'User-Agent': 'insive-calendario', 'Accept': 'application/vnd.github.v3+json' }
  }, (r) => {
    let d = ''; r.on('data', c => d += c);
    r.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 's-maxage=60');
      res.status(200).send(d);
    });
  }).on('error', e => res.status(500).send(e.message));
};
