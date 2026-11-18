import { TransactionType } from './category.model';

export interface Transaction {
  id: number;
  compteId: number;
  compteNom: string;
  categorieId: number | null;
  categorieNom: string | null;
  importId: number | null;
  type: TransactionType;
  montant: number;
  dateOperation: string;
  libelle: string | null;
}

export interface TransactionInput {
  compteId: number;
  type: TransactionType;
  montant: number;
  dateOperation: string;
  libelle?: string | null;
  categorieId?: number | null;
}

export interface TransactionFilters {
  compteId?: number | null;
  categorieId?: number | null;
  type?: TransactionType | '';
  dateDebut?: string;
  dateFin?: string;
  montantMin?: number | null;
  montantMax?: number | null;
  page?: number;
  limit?: number;
}

export interface TransactionPage {
  total: number;
  page: number;
  limit: number;
  data: Transaction[];
  message?: string;
}
