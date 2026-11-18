const router = require('express').Router();
const { z } = require('zod');
const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('CLIENT'));

const toDto = (r) => ({
  id: r.id,
  nom: r.nom,
  type: r.type,
  soldeInitial: Number(r.solde_initial),
  dateCreation: r.date_creation,
  solde: r.solde === undefined ? Number(r.solde_initial) : Number(r.solde),
  nbTransactions: Number(r.nb_transactions || 0),
});
const accountSelect = `SELECT c.*, c.solde_initial + COALESCE(SUM(CASE WHEN t.type='REVENU' THEN t.montant WHEN t.type='DEPENSE' THEN -t.montant ELSE 0 END),0) solde, COUNT(t.id) nb_transactions FROM comptes_financiers c LEFT JOIN transactions t ON t.compte_id=c.id`;
const accountGroupBy = ' GROUP BY c.id,c.utilisateur_id,c.nom,c.type,c.solde_initial,c.date_creation';

const createSchema = z.object({
  nom: z.string().trim().min(1, 'Le nom est obligatoire').max(100),
  type: z.enum(['COURANT', 'EPARGNE', 'CARTE'], { errorMap: () => ({ message: 'Type invalide (COURANT, EPARGNE, CARTE)' }) }),
  soldeInitial: z.number().min(-1e12).max(1e12).default(0),
});
const updateSchema = createSchema.partial();

// POST /api/accounts
router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const { nom, type, soldeInitial } = req.body;
  const [r] = await pool.query(
    'INSERT INTO comptes_financiers (utilisateur_id, nom, type, solde_initial) VALUES (?, ?, ?, ?)',
    [req.user.id, nom, type, soldeInitial]
  );
  const [[row]] = await pool.query(`${accountSelect} WHERE c.id = ?${accountGroupBy}`, [r.insertId]);
  res.status(201).json(toDto(row));
}));

// GET /api/accounts
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${accountSelect} WHERE c.utilisateur_id = ?${accountGroupBy} ORDER BY c.id`, [req.user.id]);
  res.json(rows.map(toDto));
}));

// GET /api/accounts/:id
router.get('/:id(\\d+)', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${accountSelect} WHERE c.id = ? AND c.utilisateur_id = ?${accountGroupBy}`, [req.params.id, req.user.id]);
  if (!rows.length) throw new HttpError(404, 'Compte introuvable');
  res.json(toDto(rows[0]));
}));

// PUT /api/accounts/:id
router.put('/:id(\\d+)', validate(updateSchema), asyncHandler(async (req, res) => {
  const map = { nom: 'nom', type: 'type', soldeInitial: 'solde_initial' };
  const sets = [];
  const vals = [];
  for (const [k, col] of Object.entries(map)) {
    if (req.body[k] !== undefined) { sets.push(`${col} = ?`); vals.push(req.body[k]); }
  }
  if (!sets.length) throw new HttpError(400, 'Aucune donnée à modifier');

  const [r] = await pool.query(
    `UPDATE comptes_financiers SET ${sets.join(', ')} WHERE id = ? AND utilisateur_id = ?`,
    [...vals, req.params.id, req.user.id]
  );
  if (!r.affectedRows) throw new HttpError(404, 'Compte introuvable');
  const [[row]] = await pool.query(`${accountSelect} WHERE c.id = ?${accountGroupBy}`, [req.params.id]);
  res.json(toDto(row));
}));

// DELETE /api/accounts/:id?confirm=true : la suppression demande une confirmation
router.delete('/:id(\\d+)', asyncHandler(async (req, res) => {
  if (req.query.confirm !== 'true') {
    throw new HttpError(400, 'La suppression nécessite une confirmation (confirm=true)');
  }
  const [r] = await pool.query('DELETE FROM comptes_financiers WHERE id = ? AND utilisateur_id = ?', [req.params.id, req.user.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Compte introuvable');
  res.status(204).end();
}));

module.exports = router;
