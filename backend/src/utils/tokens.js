const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const env = require('../config/env');

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// Le rôle est figé dans le token : un changement de rôle est effectif à la connexion suivante (BM28)
function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.accessSecret, { expiresIn: env.accessTtl });
}

async function issueTokens(user, db = pool) {
  const accessToken = signAccessToken(user);
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const expireLe = new Date(Date.now() + env.refreshTtlDays * 86400000);
  await db.query(
    'INSERT INTO refresh_tokens (utilisateur_id, token_hash, expire_le) VALUES (?, ?, ?)',
    [user.id, hashToken(refreshToken), expireLe]
  );
  return { accessToken, refreshToken };
}

async function revokeAllForUser(userId, db = pool) {
  await db.query('UPDATE refresh_tokens SET revoque = 1 WHERE utilisateur_id = ?', [userId]);
}

module.exports = { hashToken, signAccessToken, issueTokens, revokeAllForUser };
