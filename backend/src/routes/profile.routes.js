const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { revokeAllForUser } = require('../utils/tokens');

router.use(authenticate);

async function loadFinancialProfile(userId) {
  await pool.query('INSERT IGNORE INTO profils_financiers (utilisateur_id) VALUES (?)', [userId]);
  const [[p]] = await pool.query(
    'SELECT id, revenu_mensuel, situation_professionnelle, date_maj FROM profils_financiers WHERE utilisateur_id = ?',
    [userId]
  );
  const [objs] = await pool.query(
    `SELECT o.id, o.code, o.libelle FROM profil_objectifs po
       JOIN objectifs_financiers o ON o.id = po.objectif_id WHERE po.profil_id = ?`,
    [p.id]
  );
  return {
    revenuMensuel: p.revenu_mensuel === null ? null : Number(p.revenu_mensuel),
    situationProfessionnelle: p.situation_professionnelle,
    dateMaj: p.date_maj,
    objectifs: objs,
  };
}

// GET /api/profile : infos personnelles + profil financier
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.date_creation AS dateCreation, r.nom AS role
       FROM utilisateurs u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    [req.user.id]
  );
  res.json({ ...rows[0], profilFinancier: await loadFinancialProfile(req.user.id) });
}));

const updateSchema = z.object({
  nom: z.string().trim().min(1).max(80).optional(),
  prenom: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().toLowerCase().email().max(190).optional(),
  telephone: z.string().trim().regex(/^[0-9+ ]{8,20}$/, 'Numéro invalide').nullable().optional(),
});

// PUT /api/profile : modifier ses informations personnelles
router.put('/', validate(updateSchema), asyncHandler(async (req, res) => {
  const sets = [];
  const vals = [];
  for (const k of ['nom', 'prenom', 'email', 'telephone']) {
    if (req.body[k] !== undefined) { sets.push(`${k} = ?`); vals.push(req.body[k]); }
  }
  if (!sets.length) throw new HttpError(400, 'Aucune donnée à modifier');

  if (req.body.email) {
    const [dup] = await pool.query('SELECT id FROM utilisateurs WHERE email = ? AND id <> ?', [req.body.email, req.user.id]);
    if (dup.length) throw new HttpError(409, 'Cet e-mail est déjà utilisé');
  }
  await pool.query(`UPDATE utilisateurs SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.user.id]);

  const [rows] = await pool.query('SELECT id, nom, prenom, email, telephone FROM utilisateurs WHERE id = ?', [req.user.id]);
  res.json(rows[0]);
}));

const pwdSchema = z.object({
  ancienMotDePasse: z.string().min(1),
  nouveauMotDePasse: z
    .string().min(8).regex(/[a-z]/, 'Au moins une minuscule').regex(/[A-Z]/, 'Au moins une majuscule').regex(/\d/, 'Au moins un chiffre'),
});

// PUT /api/profile/password : change le mot de passe et ferme toutes les sessions
router.put('/password', validate(pwdSchema), asyncHandler(async (req, res) => {
  const [[u]] = await pool.query('SELECT mot_de_passe FROM utilisateurs WHERE id = ?', [req.user.id]);
  if (!(await bcrypt.compare(req.body.ancienMotDePasse, u.mot_de_passe))) {
    throw new HttpError(400, 'Ancien mot de passe incorrect');
  }
  const hash = await bcrypt.hash(req.body.nouveauMotDePasse, 12);
  await pool.query('UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?', [hash, req.user.id]);
  await revokeAllForUser(req.user.id);
  res.status(204).end();
}));

// GET /api/profile/financial
router.get('/financial', asyncHandler(async (req, res) => {
  res.json(await loadFinancialProfile(req.user.id));
}));

const financialSchema = z.object({
  revenuMensuel: z.number().min(0).max(1e12).nullable().optional(),
  situationProfessionnelle: z.string().trim().max(100).nullable().optional(),
});

// PUT /api/profile/financial : modifier le profil financier
router.put('/financial', validate(financialSchema), asyncHandler(async (req, res) => {
  await pool.query('INSERT IGNORE INTO profils_financiers (utilisateur_id) VALUES (?)', [req.user.id]);
  const sets = [];
  const vals = [];
  if (req.body.revenuMensuel !== undefined) { sets.push('revenu_mensuel = ?'); vals.push(req.body.revenuMensuel); }
  if (req.body.situationProfessionnelle !== undefined) { sets.push('situation_professionnelle = ?'); vals.push(req.body.situationProfessionnelle); }
  if (!sets.length) throw new HttpError(400, 'Aucune donnée à modifier');
  await pool.query(`UPDATE profils_financiers SET ${sets.join(', ')} WHERE utilisateur_id = ?`, [...vals, req.user.id]);
  res.json(await loadFinancialProfile(req.user.id));
}));

module.exports = router;
