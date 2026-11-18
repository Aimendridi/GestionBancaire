const parseAmount = (input) => {
  if (typeof input === 'number') return Number.isFinite(input) ? Math.round(input * 100) / 100 : null;
  if (!input) return null;
  let s = String(input).trim().replace(/[\s\u00a0]/g, '').replace(/[€$]/g, '');
  const neg = s.startsWith('-') || (s.startsWith('(') && s.endsWith(')'));
  s = s.replace(/[()+-]/g, '');
  if (!/^\d[\d.,]*$/.test(s)) return null;
  const comma = s.lastIndexOf(','), dot = s.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? ',' : '.';
    s = s.replace(new RegExp(`\\${decimal === ',' ? '.' : ','}`, 'g'), '').replace(decimal, '.');
  } else if (comma >= 0) {
    const tail = s.length - comma - 1;
    s = tail <= 3 ? s.replace(',', '.') : s.replace(/,/g, '');
  } else if (dot >= 0 && s.length - dot - 1 === 3) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round((neg ? -n : n) * 100) / 100 : null;
};
const parseDate = (input) => {
  const s = String(input || '').trim();
  const m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (!m) return null;
  const [, dd, mm, yyyy] = m, d = Number(dd), mo = Number(mm), y = Number(yyyy);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${yyyy}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
};
// Rows can be strings/cell arrays or pdfjs text items {str,x,y}. Coordinates preserve empty debit/credit columns.
const parseReleve = (rows) => {
  const lines = (rows || []).map((r) => Array.isArray(r) ? r.map((v) => typeof v === 'object' ? { text: String(v.str ?? v.text ?? ''), x: Number(v.x) } : { text: String(v), x: null }) : typeof r === 'string' ? r.trim().split(/\s{2,}|\t/).map(text => ({ text, x: null })) : [{ text: String(r.str || ''), x: Number(r.x) }]);
  const headerIndex = lines.findIndex((r) => /date/i.test(r.map(v=>v.text).join(' ')) && /libell/i.test(r.map(v=>v.text).join(' ')) && /(d[ée]bit|cr[ée]dit)/i.test(r.map(v=>v.text).join(' ')));
  const header = headerIndex >= 0 ? lines[headerIndex] : [];
  const debitCol = header.find(v=>/d[ée]bit/i.test(v.text)), creditCol = header.find(v=>/cr[ée]dit/i.test(v.text));
  const debitCredit = !!(debitCol && creditCol);
  const candidates = lines.slice(headerIndex + 1).filter((r) => /^(?:\d{1,2}|[A-Za-z]{1,4})[/-]\d{1,2}[/-]\d{4}/.test(String(r[0]?.text || '').trim()));
  return candidates.map((r, i) => {
    const rawDate = String(r[0]?.text || '').trim();
    const rest = r.slice(1).map(v=>v.text).join(' ').trim();
    let amount, type;
    if (debitCredit) {
      const amounts=r.slice(1).map(v=>({ ...v, amount:parseAmount(v.text) })).filter(v=>v.amount!=null);
      const located=amounts.find(v=>v.x!=null && creditCol.x!=null && Math.abs(v.x-creditCol.x)<Math.abs(v.x-debitCol.x)) || amounts.find(v=>v.x!=null && debitCol.x!=null && Math.abs(v.x-debitCol.x)<=Math.abs(v.x-creditCol.x));
      if(located){amount=located.amount;type=located===amounts.find(v=>v.x!=null && creditCol.x!=null && Math.abs(v.x-creditCol.x)<Math.abs(v.x-debitCol.x))?'REVENU':'DEPENSE';}
      else {const di=header.indexOf(debitCol),ci=header.indexOf(creditCol),d=parseAmount(r[di]?.text),c=parseAmount(r[ci]?.text);if(c!=null){amount=c;type='REVENU';}else if(d!=null){amount=d;type='DEPENSE';}else if(amounts.length){amount=amounts[0].amount;type=amounts[0].text.trim().startsWith('-')?'DEPENSE':'REVENU';}}
    }
    if (amount == null) {
      const matches = rest.match(/\(?-?\d[\d\s.,]*\d(?:[,.]\d{1,3})?\)?/g) || [];
      const candidate = matches.length ? matches[matches.length - 1] : '';
      amount = parseAmount(candidate);
      type = candidate.trim().startsWith('-') || candidate.trim().startsWith('(') ? 'DEPENSE' : 'REVENU';
    }
    const libelle = rest.replace(/\(?-?\d[\d\s.,]*\d(?:[,.]\d{1,3})?\)?\s*$/, '').trim() || null;
    const date = parseDate(rawDate), messageErreur = !date ? 'Date invalide' : amount == null || amount <= 0 ? 'Montant manquant' : null;
    return { numeroLigne: i + 1, date, libelle, montant: amount == null ? null : Math.abs(amount), type: type || 'DEPENSE', valide: !messageErreur, messageErreur };
  });
};
module.exports = { parseAmount, parseDate, parseReleve };
