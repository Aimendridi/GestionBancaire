# Gestion bancaire personnelle — frontend

Frontend Angular 20 standalone, connecté à l’API Express du dossier `../backend`. L’interface utilise les styles et composants du paquet officiel Tabler UI, construit sur Bootstrap 5.

## Lancer l’application

```powershell
cd frontend
npm install
npm start
```

Le serveur Angular est disponible sur `http://localhost:4200`. L’API est configurée sur `http://localhost:3000/api`.

## Session et sécurité

Les jetons d’accès et de renouvellement restent en mémoire JavaScript. Le backend attend le refresh token dans le corps JSON et n’émet pas de cookie httpOnly. Ce choix évite de persister le refresh token dans le stockage navigateur, mais une actualisation de la page ferme la session frontend.

Les protections de route Angular améliorent la navigation ; le backend reste l’autorité pour vérifier les rôles et les accès.
