-- WARNING: destructive: this removes all Sprint 2 transaction and import data.
DELETE rp FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id WHERE p.code IN ('TRANSACTION_GERER','IMPORT_RELEVE_GERER','SOLDE_CONSULTER');
DELETE FROM permissions WHERE code IN ('TRANSACTION_GERER','IMPORT_RELEVE_GERER','SOLDE_CONSULTER');
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS imports_releves;
DROP TABLE IF EXISTS categories;
DELETE FROM schema_migrations WHERE version='002_sprint2';
