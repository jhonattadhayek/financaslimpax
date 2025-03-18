export interface Contract {
  contractId: string;
  municipalityName: string;
  revenue: number;
  expenses: number;
  balance: number;
}

export interface InternalCosts {
  aluguel: number;
  energia: number;
  internet: number;
  manutencao: number;
}

export interface MonthlyDetail {
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
}

export interface DashboardSummary {
  revenueByContracts: number;
  expensesByContracts: number;
  expensesBySuppliers: number;
  expensesByInternal: number;
  expensesByDismissals: number;
  expensesByVacations: number;
}

export interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  suppliersCost: number;
  dismissalsCost: number;
  vacationsCost: number;
  internalCosts: InternalCosts;
  monthlyData: Array<{
    month: string;
    value: number;
  }>;
  contractsRevenue: {
    total: number;
    byContract: Contract[];
  };
  monthlyDetails: MonthlyDetail[];
  summary: DashboardSummary;
} 