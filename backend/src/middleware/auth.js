const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const env = require('../config/env');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

// Vérifie le Bearer token + que le compte existe toujours et est actif
const authenticate = asyncHandler(async (req, res, next) => {
  const [type, token] = (req.headers.authorization || '').split(' ');
  if (type !== 'Bearer' || !token) throw new HttpError(401, 'Authentification requise');

  let payload;
  try {
    payload = jwt.verify(token, env.accessSecret);
  } catch {
    throw new HttpError(401, 'Token invalide ou expiré');
  }

  const [rows] = await pool.query('SELECT actif FROM utilisateurs WHERE id = ?', [payload.sub]);
  if (!rows.length) throw new HttpError(401, 'Utilisateur introuvable');
  if (!rows[0].actif) throw new HttpError(403, 'Compte désactivé');

  req.user = { id: payload.sub, role: payload.role };
  next();
});

// Les droits d'accès sont appliqués selon le rôle (BM28)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, 'Accès refusé pour ce rôle'));
  }
  next();
};

module.exports = { authenticate, requireRole };
