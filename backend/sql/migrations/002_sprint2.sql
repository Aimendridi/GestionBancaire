CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(100) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS categories (
 id INT AUTO_INCREMENT PRIMARY KEY, nom VARCHAR(100) NOT NULL,
 type ENUM('REVENU','DEPENSE') NOT NULL, UNIQUE KEY uq_categories_nom_type(nom,type)
);
INSERT IGNORE INTO categories(nom,type) VALUES
 ('Salaire','REVENU'),('Virement reçu','REVENU'),('Autres revenus','REVENU'),
 ('Logement','DEPENSE'),('Alimentation','DEPENSE'),('Transport','DEPENSE'),('Santé','DEPENSE'),
 ('Éducation','DEPENSE'),('Loisirs','DEPENSE'),('Factures','DEPENSE'),('Shopping','DEPENSE'),
 ('Frais bancaires','DEPENSE'),('Autres dépenses','DEPENSE');
CREATE TABLE IF NOT EXISTS imports_releves (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, compte_id INT NOT NULL, nom_fichier VARCHAR(255) NOT NULL,
 date_import DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, nb_lignes_importees INT NOT NULL DEFAULT 0,
 nb_lignes_invalides INT NOT NULL DEFAULT 0,
 FOREIGN KEY(compte_id) REFERENCES comptes_financiers(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS transactions (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, compte_id INT NOT NULL, categorie_id INT NULL, import_id BIGINT NULL,
 type ENUM('REVENU','DEPENSE') NOT NULL, montant DECIMAL(15,2) NOT NULL CHECK(montant > 0),
 date_operation DATE NOT NULL, libelle VARCHAR(255) NULL, date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(compte_id) REFERENCES comptes_financiers(id) ON DELETE CASCADE,
 FOREIGN KEY(categorie_id) REFERENCES categories(id) ON DELETE SET NULL,
 FOREIGN KEY(import_id) REFERENCES imports_releves(id) ON DELETE SET NULL,
 INDEX idx_transactions_compte_date_id(compte_id,date_operation,id), INDEX idx_transactions_date(date_operation), INDEX idx_transactions_categorie(categorie_id)
);
INSERT IGNORE INTO permissions(code,description) VALUES
 ('TRANSACTION_GERER','Gérer ses transactions'),('IMPORT_RELEVE_GERER','Importer ses relevés'),('SOLDE_CONSULTER','Consulter ses soldes');
INSERT IGNORE INTO role_permissions(role_id,permission_id)
 SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code IN ('TRANSACTION_GERER','IMPORT_RELEVE_GERER','SOLDE_CONSULTER') WHERE r.nom='CLIENT';
INSERT IGNORE INTO schema_migrations(version) VALUES('002_sprint2');
