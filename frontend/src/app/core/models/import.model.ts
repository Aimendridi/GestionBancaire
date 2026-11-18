import { TransactionType } from './category.model';

export interface ImportLine {
  numeroLigne: number;
  date: string | null;
  libelle: string | null;
  montant: number | null;
  type: TransactionType;
  valide: boolean;
  messageErreur: string | null;
  categorieId?: number | null;
  incluse?: boolean;
}

export interface ImportPreview {
  nomFichier: string;
  compteId: number;
  lignes: ImportLine[];
  nbLignes: number;
  nbValides: number;
  nbInvalides: number;
}

export interface ImportHistory {
  id: number;
  compteId: number;
  nomFichier: string;
  dateImport: string;
  nbLignesImportees: number;
  nbLignesInvalides: number;
}

export interface ImportResult {
  importId: number;
  nbImportees: number;
  nbInvalides: number;
  lignesInvalides: { numeroLigne: number; messageErreur: string }[];
}
