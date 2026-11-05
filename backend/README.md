# Backend – Gestion bancaire personnelle (Sprint 1)

Express.js + MySQL, API REST JSON consommable par le web et le mobile.

## Démarrage
1. `cp .env.example .env` puis remplis `DB_*` et `JWT_ACCESS_SECRET`
2. Importer la base : `mysql -u root -p < sql/schema.sql`
3. `npm install`
4. `npm run seed:admin` (crée l'admin initial)
5. `npm run dev` → http://localhost:3000/api/health

## Authentification (web + mobile)
- `POST /api/auth/login` → `{ accessToken, refreshToken, user }`
- Chaque requête protégée : `Authorization: Bearer <accessToken>` (15 min)
- Quand l'access token expire (401) → `POST /api/auth/refresh` avec `{ refreshToken }` → nouvelle paire (rotation)
- `POST /api/auth/logout` avec `{ refreshToken }` → session terminée
- Mobile : stocker le refreshToken dans un stockage sécurisé (Keychain / Keystore).
- Web : à terme, préférer un cookie httpOnly pour le refreshToken.

## Endpoints
| Besoin | Méthode & route | Rôle |
|---|---|---|
| BM01 | POST `/api/auth/register` | public |
| BM01 | POST `/api/auth/login`, `/refresh`, `/logout` · GET `/api/auth/me` | public / connecté |
| BM01 | GET, PUT `/api/profile` · PUT `/api/profile/password` | connecté |
| BM01 | GET, PUT `/api/profile/financial` | connecté |
| BM02 | GET `/api/objectives` · GET, PUT `/api/objectives/me` | connecté |
| BM03 | GET, POST `/api/accounts` · GET, PUT, DELETE `/api/accounts/:id?confirm=true` | CLIENT |
| BM26 | GET `/api/admin/users` · GET `/api/admin/users/:id` | ADMIN |
| BM26 | PATCH `/api/admin/users/:id/status` · DELETE `/api/admin/users/:id?confirm=true` | ADMIN |
| BM28 | GET `/api/admin/roles`, `/permissions` · PATCH `/api/admin/users/:id/role` · PUT `/api/admin/roles/:id/permissions` | ADMIN |
| BM26 | GET `/api/admin/audit` (journal) | ADMIN |

## Exemples
```bash
curl -X POST localhost:3000/api/auth/register -H "Content-Type: application/json" \
  -d '{"nom":"Ben Ali","prenom":"Sarra","email":"sarra@mail.com","motDePasse":"Test1234"}'

curl -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"sarra@mail.com","motDePasse":"Test1234"}'

curl -X POST localhost:3000/api/accounts -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"nom":"Compte BIAT","type":"COURANT","soldeInitial":1500}'
```

## Format des erreurs
`{ "message": "...", "details": [{ "champ": "...", "message": "..." }] }`
