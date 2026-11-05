const router = require('express').Router();
const { z } = require('zod');
const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/objectives : liste prédéfinie (5 objectifs)
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, code, libelle FROM objectifs_financiers ORDER BY id');
  res.json(rows);
}));

// GET /api/objectives/me : mes objectifs choisis
router.get('/me', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.id, o.code, o.libelle
       FROM profils_financiers p
       JOIN profil_objectifs po ON po.profil_id = p.id
       JOIN objectifs_financiers o ON o.id = po.objectif_id
      WHERE p.utilisateur_id = ? ORDER BY o.id`,
    [req.user.id]
  );
  res.json(rows);
}));

const chooseSchema = z.object({
  objectifIds: z.array(z.number().int().positive()).min(1, 'Choisissez au moins un objectif'),
});

// PUT /api/objectives/me : remplace mes objectifs (un ou plusieurs), modifiable à tout moment
router.put('/me', validate(chooseSchema), asyncHandler(async (req, res) => {
  const ids = [...new Set(req.body.objectifIds)];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [found] = await conn.query('SELECT id FROM objectifs_financiers WHERE id IN (?)', [ids]);
    if (found.length !== ids.length) throw new HttpError(400, 'Objectif inconnu dans la liste');

    await conn.query('INSERT IGNORE INTO profils_financiers (utilisateur_id) VALUES (?)', [req.user.id]);
    const [[profil]] = await conn.query('SELECT id FROM profils_financiers WHERE utilisateur_id = ?', [req.user.id]);

    await conn.query('DELETE FROM profil_objectifs WHERE profil_id = ?', [profil.id]);
    await conn.query('INSERT INTO profil_objectifs (profil_id, objectif_id) VALUES ?', [ids.map((id) => [profil.id, id])]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  const [rows] = await pool.query('SELECT id, code, libelle FROM objectifs_financiers WHERE id IN (?) ORDER BY id', [ids]);
  res.json(rows);
}));

module.exports = router;
