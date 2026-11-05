require('dotenv').config();
// Crée l'administrateur initial : npm run seed:admin
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

(async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@gbp.tn').toLowerCase();
  const pwd = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const [exist] = await pool.query('SELECT id FROM utilisateurs WHERE email = ?', [email]);
  if (exist.length) { console.log('Admin déjà existant :', email); return pool.end(); }

  const [[role]] = await pool.query("SELECT id FROM roles WHERE nom = 'ADMIN'");
  const hash = await bcrypt.hash(pwd, 12);
  const [r] = await pool.query(
    'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id) VALUES (?, ?, ?, ?, ?)',
    ['Admin', 'Plateforme', email, hash, role.id]
  );
  await pool.query('INSERT INTO profils_financiers (utilisateur_id) VALUES (?)', [r.insertId]);
  console.log('Admin créé :', email);
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
