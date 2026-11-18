import { BalanceSummary } from './balance.model';
import { Transaction } from './transaction.model';

export interface Dashboard extends BalanceSummary {
  dernieresTransactions: Transaction[];
  budgets: unknown[];
}
