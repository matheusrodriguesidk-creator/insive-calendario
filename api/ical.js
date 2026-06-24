const https = require('https');

module.exports = async (req, res) => {
  const GIST_ID = process.env.GIST_ID;
  const TOKEN   = process.env.GIST_TOKEN;

  if (!GIST_ID || !TOKEN) {
    return res.status(500).send('ENV vars not configured');
  }

  const posts = await new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.github.com',
      path: `/gists/${GIST_ID}`,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'insive-calendario',
        'Accept': 'application/vnd.github.v3+json'
      }
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try {
          const gist = JSON.parse(d);
          resolve(JSON.parse(gist.files['insive_posts.json'].content));
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });

  const now = new Date().toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
  const EMOJI = { approved:'aprovado', ready:'pronto', pending:'pendente', planned:'planejado', posted:'postado' };
  const LAYOUTS = { A:'Navy classico', B:'Fundo claro', C:'Fundo gold', D:'Foto full-bleed' };

  let cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Insive//Calendario Editorial//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Insive Posts Instagram',
    'X-WR-CALDESC:Calendario editorial @matheusrodrigues.enf',
    'X-WR-TIMEZONE:America/Sao_Paulo',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ].join('\r\n');

  for (const p of posts) {
    if (!p.data || !p.tecnica) continue;
    const [ano, mes, dia] = p.data.slice(0,10).split('-');
    const [h, m] = (p.horario || '08:00').split(':');
    const dtstart = ano+mes+dia+'T'+h+m+'00';
    const dtend   = ano+mes+dia+'T'+String(parseInt(h)+1).padStart(2,'0')+m+'00';
    const uid     = 'insive-'+(p.id||p.data+p.tecnica)+'@matheusrodrigues.enf';
    const layout  = p.layout || 'A';
    const status  = EMOJI[p.status] || 'planejado';
    const summary = '['+status+'] '+p.tecnica+' Layout '+layout;
    const leg     = p.legenda ? p.legenda.slice(0,300).replace(/\n/g,'\\n') : '';
    const desc    = 'Status: '+p.status+'\\nLayout: '+layout+' '+( LAYOUTS[layout]||'')+( leg ? '\\nLegenda:\\n'+leg : '');
    const vstatus = p.status === 'posted' ? 'CONFIRMED' : 'TENTATIVE';

    cal += '\r\nBEGIN:VEVENT';
    cal += '\r\nUID:'+uid;
    cal += '\r\nDTSTAMP:'+now;
    cal += '\r\nDTSTART;TZID=America/Sao_Paulo:'+dtstart;
    cal += '\r\nDTEND;TZID=America/Sao_Paulo:'+dtend;
    cal += '\r\nSUMMARY:'+summary;
    cal += '\r\nDESCRIPTION:'+desc;
    cal += '\r\nSTATUS:'+vstatus;
    cal += '\r\nCATEGORIES:Instagram,Insive';
    cal += '\r\nEND:VEVENT';
  }

  cal += '\r\nEND:VCALENDAR';

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=insive-calendario.ics');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(cal);
};