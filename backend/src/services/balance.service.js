const pool = require('../config/db');

async function getBalances(userId) {
  const [rows] = await pool.query(`SELECT c.id,c.nom,c.type,c.solde_initial,
    COALESCE(SUM(CASE WHEN t.type='REVENU' THEN t.montant ELSE 0 END),0) total_revenus,
    COALESCE(SUM(CASE WHEN t.type='DEPENSE' THEN t.montant ELSE 0 END),0) total_depenses,
    COUNT(t.id) nb_transactions
    FROM comptes_financiers c LEFT JOIN transactions t ON t.compte_id=c.id
    WHERE c.utilisateur_id=?
    GROUP BY c.id,c.nom,c.type,c.solde_initial
    ORDER BY c.id`, [userId]);
  const comptes = rows.map(r => ({ id:r.id, nom:r.nom, type:r.type, soldeInitial:Number(r.solde_initial),
    totalRevenus:Number(r.total_revenus), totalDepenses:Number(r.total_depenses),
    solde:Number((Number(r.solde_initial)+Number(r.total_revenus)-Number(r.total_depenses)).toFixed(2)), nbTransactions:Number(r.nb_transactions) }));
  return { soldeGlobal: Math.round(comptes.reduce((s,c)=>s+c.solde,0)*100)/100, comptes };
}
module.exports = { getBalances };
