export type TransactionType = 'REVENU' | 'DEPENSE';

export interface Category {
  id: number;
  nom: string;
  type: TransactionType;
}
