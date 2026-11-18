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

## Migration Sprint 2

Effectuer une sauvegarde avant application : `mysqldump -u root -p gestion_bancaire > sauvegarde.sql`. Depuis `backend/`, appliquer ensuite `mysql -u root -p gestion_bancaire < sql/migrations/002_sprint2.sql`. La migration est additive et ne modifie pas les tables Sprint 1. Le rollback `sql/migrations/002_sprint2_rollback.sql` supprime les tables Sprint 2 et leurs données.

## Endpoints Sprint 2 (CLIENT authentifié)
| Besoin | Méthode & route |
|---|---|
| Catégories | GET `/api/categories?type=REVENU|DEPENSE` |
| Revenus et dépenses | POST, GET `/api/transactions` · GET, PUT, DELETE `/api/transactions/:id` |
| Soldes | GET `/api/balances` |
| Tableau de bord | GET `/api/dashboard` |
| Relevés PDF | POST `/api/imports/preview` · POST `/api/imports/confirm` · GET `/api/imports` · GET `/api/imports/:id` |

Le solde est calculé à la lecture : solde initial + revenus - dépenses. Supprimer un compte supprime aussi ses transactions et imports associés par cascade.

## Seed et tests
`npm run seed:transactions` crée un client de test (`test.client@gbp.tn` / `Test1234`) et 101 transactions si ce client n'a pas déjà de comptes. `npm test` lance les tests Jest.

Tester l'aperçu PDF avec : `curl -X POST http://localhost:3000/api/imports/preview -H "Authorization: Bearer TOKEN" -F "file=@dev_tools/releve_test.pdf" -F "compteId=1"`. Les fichiers d'exemple doivent être fournis dans `dev_tools/`; aucun PDF factice ne doit être créé.

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
