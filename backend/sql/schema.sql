CREATE DATABASE IF NOT EXISTS gestion_bancaire CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_bancaire;

-- ===== Rôles & permissions (BM28) =====
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) NULL
);

CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- ===== Utilisateurs (BM01) =====
CREATE TABLE utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(80) NOT NULL,
  prenom VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  telephone VARCHAR(20) NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  actif TINYINT(1) NOT NULL DEFAULT 1,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Sessions : un refresh token par connexion. Déconnexion = revoque = 1
CREATE TABLE refresh_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expire_le DATETIME NOT NULL,
  revoque TINYINT(1) NOT NULL DEFAULT 0,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ===== Profil financier & objectifs (BM01, BM02) =====
CREATE TABLE profils_financiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL UNIQUE,
  revenu_mensuel DECIMAL(15,2) NULL,
  situation_professionnelle VARCHAR(100) NULL,
  date_maj DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE TABLE objectifs_financiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  libelle VARCHAR(100) NOT NULL
);

CREATE TABLE profil_objectifs (
  profil_id INT NOT NULL,
  objectif_id INT NOT NULL,
  PRIMARY KEY (profil_id, objectif_id),
  FOREIGN KEY (profil_id) REFERENCES profils_financiers(id) ON DELETE CASCADE,
  FOREIGN KEY (objectif_id) REFERENCES objectifs_financiers(id) ON DELETE CASCADE
);

-- ===== Comptes financiers (BM03) =====
CREATE TABLE comptes_financiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  nom VARCHAR(100) NOT NULL,
  type ENUM('COURANT','EPARGNE','CARTE') NOT NULL,
  solde_initial DECIMAL(15,2) NOT NULL DEFAULT 0,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ===== Journal d'audit (BM26) : insertion uniquement, jamais modifié =====
CREATE TABLE journal_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  acteur_id INT NULL,
  action VARCHAR(100) NOT NULL,
  cible_type VARCHAR(50) NULL,
  cible_id INT NULL,
  details JSON NULL,
  date_action DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (acteur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ===== Données initiales =====
INSERT INTO roles (nom) VALUES ('CLIENT'), ('CONSEILLER'), ('ADMIN');

INSERT INTO permissions (code, description) VALUES
 ('COMPTE_GERER',        'Gérer ses comptes financiers'),
 ('OBJECTIF_GERER',      'Gérer ses objectifs financiers'),
 ('PROFIL_GERER',        'Modifier son profil'),
 ('UTILISATEUR_GERER',   'Consulter, activer, désactiver, supprimer des comptes utilisateurs'),
 ('ROLE_GERER',          'Administrer les rôles et permissions'),
 ('AUDIT_CONSULTER',     'Consulter le journal d''audit');

-- CLIENT
INSERT INTO role_permissions (role_id, permission_id)
 SELECT r.id, p.id FROM roles r JOIN permissions p
 WHERE r.nom = 'CLIENT' AND p.code IN ('COMPTE_GERER','OBJECTIF_GERER','PROFIL_GERER');
-- CONSEILLER
INSERT INTO role_permissions (role_id, permission_id)
 SELECT r.id, p.id FROM roles r JOIN permissions p
 WHERE r.nom = 'CONSEILLER' AND p.code IN ('PROFIL_GERER');
-- ADMIN
INSERT INTO role_permissions (role_id, permission_id)
 SELECT r.id, p.id FROM roles r JOIN permissions p
 WHERE r.nom = 'ADMIN' AND p.code IN ('PROFIL_GERER','UTILISATEUR_GERER','ROLE_GERER','AUDIT_CONSULTER');

INSERT INTO objectifs_financiers (code, libelle) VALUES
 ('EPARGNER_DAVANTAGE', 'Épargner davantage'),
 ('REDUIRE_DEPENSES',   'Réduire les dépenses'),
 ('REMBOURSER_DETTE',   'Rembourser une dette'),
 ('FONDS_URGENCE',      'Constituer un fonds d''urgence'),
 ('EQUILIBRER_BUDGET',  'Équilibrer le budget');
