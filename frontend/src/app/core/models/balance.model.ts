export interface AccountBalance {
  id: number;
  nom: string;
  type: 'COURANT' | 'EPARGNE' | 'CARTE';
  soldeInitial: number;
  solde: number;
  totalRevenus: number;
  totalDepenses: number;
  nbTransactions: number;
}

export interface BalanceSummary {
  soldeGlobal: number;
  comptes: AccountBalance[];
}
