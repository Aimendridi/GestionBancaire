const router = require('express').Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { hashToken, issueTokens } = require('../utils/tokens');

const motDePasse = z
  .string()
  .min(8, 'Au moins 8 caractères')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/\d/, 'Au moins un chiffre');

const registerSchema = z.object({
  nom: z.string().trim().min(1).max(80),
  prenom: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email('E-mail invalide').max(190),
  motDePasse,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  motDePasse: z.string().min(1),
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives, réessayez dans quelques minutes' },
});

// POST /api/auth/register : création de compte client
router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { nom, prenom, email, motDePasse: mdp } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [exist] = await conn.query('SELECT id FROM utilisateurs WHERE email = ?', [email]);
    if (exist.length) throw new HttpError(409, 'Cet e-mail est déjà utilisé');

    const [[role]] = await conn.query("SELECT id FROM roles WHERE nom = 'CLIENT'");
    const hash = await bcrypt.hash(mdp, 12);
    const [r] = await conn.query(
      'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id) VALUES (?, ?, ?, ?, ?)',
      [nom, prenom, email, hash, role.id]
    );
    await conn.query('INSERT INTO profils_financiers (utilisateur_id) VALUES (?)', [r.insertId]);
    await conn.commit();
    res.status(201).json({ id: r.insertId, nom, prenom, email, role: 'CLIENT' });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, motDePasse: mdp } = req.body;
  const [rows] = await pool.query(
    `SELECT u.id, u.nom, u.prenom, u.email, u.mot_de_passe, u.actif, r.nom AS role
       FROM utilisateurs u JOIN roles r ON r.id = u.role_id WHERE u.email = ?`,
    [email]
  );
  const u = rows[0];
  const ok = u && (await bcrypt.compare(mdp, u.mot_de_passe));
  if (!ok) throw new HttpError(401, 'E-mail ou mot de passe incorrect');
  if (!u.actif) throw new HttpError(403, 'Compte désactivé. Contactez l’administrateur');

  const tokens = await issueTokens({ id: u.id, role: u.role });
  res.json({
    ...tokens,
    user: { id: u.id, nom: u.nom, prenom: u.prenom, email: u.email, role: u.role },
  });
}));

// POST /api/auth/refresh : renouvelle les tokens (rotation du refresh token)
router.post('/refresh', validate(refreshSchema), asyncHandler(async (req, res) => {
  const hash = hashToken(req.body.refreshToken);
  const [rows] = await pool.query(
    `SELECT t.id, t.expire_le, t.revoque, u.id AS uid, u.actif, r.nom AS role
       FROM refresh_tokens t
       JOIN utilisateurs u ON u.id = t.utilisateur_id
       JOIN roles r ON r.id = u.role_id
      WHERE t.token_hash = ?`,
    [hash]
  );
  const t = rows[0];
  if (!t || t.revoque || new Date(t.expire_le) < new Date()) {
    throw new HttpError(401, 'Session expirée, veuillez vous reconnecter');
  }
  if (!t.actif) throw new HttpError(403, 'Compte désactivé');

  await pool.query('UPDATE refresh_tokens SET revoque = 1 WHERE id = ?', [t.id]);
  const tokens = await issueTokens({ id: t.uid, role: t.role });
  res.json(tokens);
}));

// POST /api/auth/logout : termine la session (révoque le refresh token)
router.post('/logout', validate(refreshSchema), asyncHandler(async (req, res) => {
  await pool.query('UPDATE refresh_tokens SET revoque = 1 WHERE token_hash = ?', [hashToken(req.body.refreshToken)]);
  res.status(204).end();
}));

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, r.nom AS role
       FROM utilisateurs u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    [req.user.id]
  );
  res.json(rows[0]);
}));

module.exports = router;
