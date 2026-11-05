const router = require('express').Router();
const { z } = require('zod');
const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');
const { revokeAllForUser } = require('../utils/tokens');

router.use(authenticate, requireRole('ADMIN'));

const paging = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ================= BM26 : gestion des comptes et profils =================

const listUsersQuery = paging.extend({
  role: z.enum(['CLIENT', 'CONSEILLER', 'ADMIN']).optional(),
  actif: z.enum(['true', 'false']).optional(),
  q: z.string().trim().max(100).optional(),
});

// GET /api/admin/users
router.get('/users', validate(listUsersQuery, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, role, actif, q } = req.query;
  const where = [];
  const vals = [];
  if (role) { where.push('r.nom = ?'); vals.push(role); }
  if (actif) { where.push('u.actif = ?'); vals.push(actif === 'true' ? 1 : 0); }
  if (q) { where.push('(u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)'); vals.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM utilisateurs u JOIN roles r ON r.id = u.role_id ${w}`, vals);
  const [rows] = await pool.query(
    `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.actif, u.date_creation AS dateCreation, r.nom AS role
       FROM utilisateurs u JOIN roles r ON r.id = u.role_id ${w}
      ORDER BY u.id DESC LIMIT ? OFFSET ?`,
    [...vals, limit, (page - 1) * limit]
  );
  res.json({ total, page, limit, data: rows.map((u) => ({ ...u, actif: !!u.actif })) });
}));

// GET /api/admin/users/:id
router.get('/users/:id(\\d+)', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.actif, u.date_creation AS dateCreation, r.nom AS role
       FROM utilisateurs u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`, [req.params.id]);
  if (!rows.length) throw new HttpError(404, 'Utilisateur introuvable');
  res.json({ ...rows[0], actif: !!rows[0].actif });
}));

// PATCH /api/admin/users/:id/status : activer / désactiver
router.patch('/users/:id(\\d+)/status', validate(z.object({ actif: z.boolean() })), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) throw new HttpError(400, 'Vous ne pouvez pas modifier votre propre statut');
  const [r] = await pool.query('UPDATE utilisateurs SET actif = ? WHERE id = ?', [req.body.actif ? 1 : 0, id]);
  if (!r.affectedRows) throw new HttpError(404, 'Utilisateur introuvable');
  if (!req.body.actif) await revokeAllForUser(id); // ferme ses sessions
  await logAudit(pool, {
    acteurId: req.user.id,
    action: req.body.actif ? 'ACTIVATION_COMPTE' : 'DESACTIVATION_COMPTE',
    cibleType: 'UTILISATEUR', cibleId: id,
  });
  res.json({ id, actif: req.body.actif });
}));

// DELETE /api/admin/users/:id?confirm=true : action sensible => confirmation
router.delete('/users/:id(\\d+)', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (req.query.confirm !== 'true') throw new HttpError(400, 'Action sensible : confirmation requise (confirm=true)');
  if (id === req.user.id) throw new HttpError(400, 'Vous ne pouvez pas supprimer votre propre compte');
  const [rows] = await pool.query('SELECT email FROM utilisateurs WHERE id = ?', [id]);
  if (!rows.length) throw new HttpError(404, 'Utilisateur introuvable');

  await logAudit(pool, {
    acteurId: req.user.id, action: 'SUPPRESSION_COMPTE', cibleType: 'UTILISATEUR', cibleId: id,
    details: { email: rows[0].email },
  });
  await pool.query('DELETE FROM utilisateurs WHERE id = ?', [id]);
  res.status(204).end();
}));

// ================= BM28 : rôles et permissions =================

// GET /api/admin/roles
router.get('/roles', asyncHandler(async (req, res) => {
  const [roles] = await pool.query('SELECT id, nom FROM roles ORDER BY id');
  const [perms] = await pool.query(
    `SELECT rp.role_id, p.id, p.code, p.description
       FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id`);
  res.json(roles.map((r) => ({
    ...r,
    permissions: perms.filter((p) => p.role_id === r.id).map(({ id, code, description }) => ({ id, code, description })),
  })));
}));

// GET /api/admin/permissions
router.get('/permissions', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, code, description FROM permissions ORDER BY id');
  res.json(rows);
}));

// PATCH /api/admin/users/:id/role : un seul rôle par utilisateur, effectif à la connexion suivante
router.patch('/users/:id(\\d+)/role', validate(z.object({ roleId: z.number().int().positive() })), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) throw new HttpError(400, 'Vous ne pouvez pas modifier votre propre rôle');
  const [roleRows] = await pool.query('SELECT id, nom FROM roles WHERE id = ?', [req.body.roleId]);
  if (!roleRows.length) throw new HttpError(400, 'Rôle inconnu');
  const [users] = await pool.query(
    'SELECT u.id, r.nom AS role FROM utilisateurs u JOIN roles r ON r.id = u.role_id WHERE u.id = ?', [id]);
  if (!users.length) throw new HttpError(404, 'Utilisateur introuvable');

  await pool.query('UPDATE utilisateurs SET role_id = ? WHERE id = ?', [req.body.roleId, id]);
  await revokeAllForUser(id); // il devra se reconnecter pour obtenir son nouveau rôle
  await logAudit(pool, {
    acteurId: req.user.id, action: 'CHANGEMENT_ROLE', cibleType: 'UTILISATEUR', cibleId: id,
    details: { ancienRole: users[0].role, nouveauRole: roleRows[0].nom },
  });
  res.json({ id, role: roleRows[0].nom, message: 'Effectif à la prochaine connexion' });
}));

// PUT /api/admin/roles/:id/permissions : remplace les permissions d'un rôle
router.put('/roles/:id(\\d+)/permissions', validate(z.object({ permissionIds: z.array(z.number().int().positive()) })), asyncHandler(async (req, res) => {
  const roleId = Number(req.params.id);
  const ids = [...new Set(req.body.permissionIds)];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[role]] = await conn.query('SELECT id, nom FROM roles WHERE id = ?', [roleId]);
    if (!role) throw new HttpError(404, 'Rôle introuvable');
    if (ids.length) {
      const [found] = await conn.query('SELECT id FROM permissions WHERE id IN (?)', [ids]);
      if (found.length !== ids.length) throw new HttpError(400, 'Permission inconnue');
    }
    await conn.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    if (ids.length) {
      await conn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [ids.map((p) => [roleId, p])]);
    }
    await logAudit(conn, {
      acteurId: req.user.id, action: 'MODIFICATION_PERMISSIONS_ROLE', cibleType: 'ROLE', cibleId: roleId,
      details: { role: role.nom, permissionIds: ids },
    });
    await conn.commit();
    res.json({ roleId, permissionIds: ids });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// ================= Journal d'audit (lecture simple, BM29 viendra l'enrichir) =================

const auditQuery = paging.extend({ action: z.string().trim().max(100).optional() });

// GET /api/admin/audit
router.get('/audit', validate(auditQuery, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, action } = req.query;
  const w = action ? 'WHERE j.action = ?' : '';
  const vals = action ? [action] : [];
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM journal_audit j ${w}`, vals);
  const [rows] = await pool.query(
    `SELECT j.id, j.acteur_id AS acteurId, CONCAT(u.prenom, ' ', u.nom) AS acteur,
            j.action, j.cible_type AS cibleType, j.cible_id AS cibleId, j.details, j.date_action AS dateAction
       FROM journal_audit j LEFT JOIN utilisateurs u ON u.id = j.acteur_id ${w}
      ORDER BY j.id DESC LIMIT ? OFFSET ?`,
    [...vals, limit, (page - 1) * limit]
  );
  res.json({ total, page, limit, data: rows });
}));

module.exports = router;
