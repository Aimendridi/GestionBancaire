const app = require('./app');
const env = require('./config/env');
const pool = require('./config/db');

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[db] Connexion MySQL OK');
  } catch (e) {
    console.error('[db] Connexion MySQL impossible :', e.message);
    process.exit(1);
  }

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`[api] http://0.0.0.0:${env.port}/api`);
  });
})();