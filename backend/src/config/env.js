require('dotenv').config();

const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_ACCESS_SECRET'];
for (const k of required) {
  if (process.env[k] === undefined) {
    console.warn(`[config] Variable manquante: ${k} (voir .env.example)`);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestion_bancaire',
  },
  accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_only_secret',
  accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 30,
  corsOrigins: (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim()),
};
