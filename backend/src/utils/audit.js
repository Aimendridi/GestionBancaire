// Journalisation des actions sensibles (BM26). `db` = pool ou connexion de transaction.
async function logAudit(db, { acteurId, action, cibleType = null, cibleId = null, details = null }) {
  await db.query(
    'INSERT INTO journal_audit (acteur_id, action, cible_type, cible_id, details) VALUES (?, ?, ?, ?, ?)',
    [acteurId, action, cibleType, cibleId, details ? JSON.stringify(details) : null]
  );
}
module.exports = { logAudit };
