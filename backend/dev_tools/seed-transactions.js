// Données de test pour le Sprint 2 : npm run seed:transactions
// À placer dans backend/scripts/ (après avoir lancé la migration 002_sprint2.sql)
// Idempotent : supprime et recrée UNIQUEMENT les transactions du client de test.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

const EMAIL = 'test.client@gbp.tn';
const PASSWORD = 'Test1234';

// Générateur pseudo-aléatoire à graine fixe => mêmes données à chaque exécution
function rng(seed) {
    return () => {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rand = rng(42);
const between = (a, b) => Math.round((a + rand() * (b - a)) * 100) / 100;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function generate(today = new Date()) {
    const tx = []; // { compte, cat, type, montant, date, libelle }
    const add = (compte, cat, type, montant, date, libelle) => tx.push({ compte, cat, type, montant, date: iso(date), libelle });
    const DAYS = 90;
    for (let i = DAYS; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const day = d.getDate();
        if (day === 1) add('Compte courant', 'Salaire|REVENU', 'REVENU', 1800, d, 'Virement salaire');
        if (day === 5) add('Compte courant', 'Logement|DEPENSE', 'DEPENSE', 450, d, 'Loyer');
        if (day === 10) add('Compte courant', 'Factures et abonnements|DEPENSE', 'DEPENSE', 35, d, 'Facture Ooredoo');
        if (day === 12) add('Compte courant', 'Factures et abonnements|DEPENSE', 'DEPENSE', 12.9, d, 'Abonnement Spotify');
        if (day === 6) add('Compte épargne', 'Autres revenus|REVENU', 'REVENU', 200, d, 'Virement épargne mensuelle');
        if (rand() < 0.55) add('Compte courant', 'Alimentation|DEPENSE', 'DEPENSE', between(5, 45), d, pick(['Carrefour', 'Monoprix', 'Boulangerie', 'Restaurant']));
        if (rand() < 0.25) add('Compte courant', 'Transport|DEPENSE', 'DEPENSE', between(2, 20), d, pick(['Taxi', 'Carburant', 'Métro']));
        if (rand() < 0.08) add('Compte courant', 'Loisirs|DEPENSE', 'DEPENSE', between(15, 80), d, pick(['Cinéma', 'Café', 'Sortie']));
        if (rand() < 0.04) add('Compte courant', 'Santé|DEPENSE', 'DEPENSE', between(10, 90), d, 'Pharmacie');
        if (rand() < 0.06) add('Carte bancaire', 'Shopping|DEPENSE', 'DEPENSE', between(20, 150), d, 'Achat en ligne');
    }
    // Cas limites utiles pour les tests
    add('Compte courant', null, 'DEPENSE', 9.99, today, 'Opération sans catégorie');   // catégorie NULL
    add('Compte courant', 'Autres revenus|REVENU', 'REVENU', 5000, today, 'Gros montant'); // montant élevé
    return tx;
}

(async () => {
    const [cats] = await pool.query('SELECT id, nom, type FROM categories');
    if (!cats.length) throw new Error('Table categories vide : lancez d’abord la migration 002_sprint2.sql');
    const catId = Object.fromEntries(cats.map((c) => [`${c.nom}|${c.type}`, c.id]));

    // Client de test
    let [u] = await pool.query('SELECT id FROM utilisateurs WHERE email = ?', [EMAIL]);
    if (!u.length) {
        const [[role]] = await pool.query("SELECT id FROM roles WHERE nom = 'CLIENT'");
        if (!role) throw new Error("Rôle CLIENT introuvable : la table roles est vide ou différente (voir SELECT * FROM roles)");
        const hash = await bcrypt.hash(PASSWORD, 12);
        const [r] = await pool.query('INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id) VALUES (?,?,?,?,?)', ['Test', 'Client', EMAIL, hash, role.id]);
        await pool.query('INSERT INTO profils_financiers (utilisateur_id) VALUES (?)', [r.insertId]);
        u = [{ id: r.insertId }];
    }
    const userId = u[0].id;

    // Comptes de test
    const defs = [['Compte courant', 'COURANT', 1500], ['Compte épargne', 'EPARGNE', 5000], ['Carte bancaire', 'CARTE', 0]];
    const compteId = {}; const initial = {};
    for (const [nom, type, solde] of defs) {
        let [c] = await pool.query('SELECT id, solde_initial FROM comptes_financiers WHERE utilisateur_id = ? AND nom = ?', [userId, nom]);
        if (!c.length) {
            const [r] = await pool.query('INSERT INTO comptes_financiers (utilisateur_id, nom, type, solde_initial) VALUES (?,?,?,?)', [userId, nom, type, solde]);
            c = [{ id: r.insertId, solde_initial: solde }];
        } else {
            // Reset only the dedicated test client's opening balances as part of the repeatable fixture.
            await pool.query('UPDATE comptes_financiers SET solde_initial = ? WHERE id = ? AND utilisateur_id = ?', [solde, c[0].id, userId]);
            c[0].solde_initial = solde;
        }
        compteId[nom] = c[0].id; initial[nom] = Number(c[0].solde_initial);
    }

    // Réinitialise puis insère les transactions
    const seededAccountIds = Object.values(compteId);
    if (seededAccountIds.length) {
        await pool.query('DELETE FROM transactions WHERE compte_id IN (?)', [seededAccountIds]);
    }
    const tx = generate();
    await pool.query(
        'INSERT INTO transactions (compte_id, categorie_id, type, montant, date_operation, libelle) VALUES ?',
        [tx.map((t) => [compteId[t.compte], t.cat ? catId[t.cat] : null, t.type, t.montant, t.date, t.libelle])]
    );

    // Soldes attendus : à comparer avec ce que renvoie votre API (BM07)
    console.log(`Client de test : ${EMAIL} / ${PASSWORD}`);
    console.log(`${tx.length} transactions insérées.\nSoldes attendus (solde initial + revenus - dépenses) :`);
    let global = 0;
    for (const [nom] of defs) {
        const net = tx.filter((t) => t.compte === nom).reduce((s, t) => s + (t.type === 'REVENU' ? t.montant : -t.montant), 0);
        const solde = Math.round((initial[nom] + net) * 100) / 100; global += solde;
        console.log(`  ${nom.padEnd(16)} ${solde.toFixed(2)}`);
    }
    console.log(`  ${'SOLDE GLOBAL'.padEnd(16)} ${(Math.round(global * 100) / 100).toFixed(2)}`);
    await pool.end();
})().catch((e) => { console.error('Échec du seed :', e.message); process.exit(1); });

module.exports = { generate };
