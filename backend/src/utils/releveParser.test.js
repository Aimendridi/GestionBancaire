const {parseAmount,parseDate,parseReleve}=require('./releveParser');
test.each([['45,300',45.3],['1 800,000',1800],['1.800,000',1800],['12,5',12.5]])('parse amount %s', (s,n)=>expect(parseAmount(s)).toBe(n));
test('dates are validated',()=>{expect(parseDate('31/02/2026')).toBeNull();expect(parseDate('02/11/2026')).toBe('2026-11-02');});
test('headers assign debit and credit columns',()=>{const out=parseReleve([['Date','Libellé','Débit','Crédit'],['01/02/2026','Salaire','','2 000,000'],['02/02/2026','Courses','50,000','']]);expect(out.map(x=>[x.type,x.montant,x.valide])).toEqual([['REVENU',2000,true],['DEPENSE',50,true]]);});
test('invalid candidate rows are flagged',()=>{expect(parseReleve([['31/02/2026','Achat','2,000']])[0].messageErreur).toBe('Date invalide');});
test('malformed date tokens and missing amounts are flagged',()=>{const lines=parseReleve([['XX/10/2026','Achat','20,000'],['12/10/2026','Achat','']]);expect(lines).toHaveLength(2);expect(lines[0].messageErreur).toBe('Date invalide');expect(lines[1].messageErreur).toBe('Montant manquant');});
