export interface User { id: number; nom: string; prenom: string; email: string; role: string; telephone?: string | null; actif?: boolean; dateCreation?: string; }
export interface Session { accessToken: string; refreshToken: string; user?: User; }
export interface FinancialProfile { revenuMensuel: number | null; situationProfessionnelle: string | null; dateMaj?: string; objectifs: Objective[]; }
export interface Profile extends User { profilFinancier?: FinancialProfile; }
export interface Objective { id: number; code: string; libelle: string; }
export interface Account { id: number; nom: string; type: 'COURANT' | 'EPARGNE' | 'CARTE'; soldeInitial: number; dateCreation: string; }
export interface PageResult<T> { total: number; page: number; limit: number; data: T[]; }
export interface AdminUser extends User { actif: boolean; }
export interface Permission { id: number; code: string; description: string | null; }
export interface Role { id: number; nom: string; permissions: Permission[]; }
export interface AuditEntry { id: number; acteurId: number | null; acteur: string | null; action: string; cibleType: string | null; cibleId: number | null; details: unknown; dateAction: string; }
export interface ApiError { message: string; details?: { champ: string; message: string }[]; }
