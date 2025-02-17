import { 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getSuppliersTotalCost } from './suppliers';
import { getMonthlyRecords, MonthlyRecord } from './monthly-records';
import { getContracts, Contract } from './contracts';

export type MonthlyDetail = {
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
};

export type FinancialSummary = {
  revenueByContracts: number;
  expensesByContracts: number;
  expensesBySuppliers: number;
  expensesByInternal: number;
  expensesByDismissals: number;
  expensesByVacations: number;
};

export type DashboardData = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  suppliersCost: number;
  dismissalsCost: number;
  vacationsCost: number;
  internalCosts: {
    aluguel: number;
    energia: number;
    internet: number;
    manutencao: number;
  };
  monthlyData: {
    month: string;
    value: number;
  }[];
  contractsRevenue: {
    total: number;
    byContract: {
      contractId: string;
      municipalityName: string;
      revenue: number;
      expenses: number;
      balance: number;
    }[];
  };
  monthlyDetails: MonthlyDetail[];
  summary: FinancialSummary;
};

type FirestoreTransaction = {
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  due_date: Timestamp;
};

type FirestoreSupplier = {
  name: string;
  service: string;
  paid_value: number;
  payment_date: Timestamp;
};

export async function getFinancialSummary(month?: string): Promise<DashboardData> {
  try {
    let startOfMonth: Date;
    let endOfMonth: Date;

    if (month) {
      const [year, monthNum] = month.split('-');
      startOfMonth = new Date(Number(year), Number(monthNum) - 1, 1);
      endOfMonth = new Date(Number(year), Number(monthNum), 0);
    } else {
      const currentDate = new Date();
      startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }

    // Inicializar variáveis
    let totalIncome = 0;
    let totalExpenses = 0;
    let contractsExpenses = 0;
    let totalContractExpenses = 0;
    let dismissalsCost = 0;
    const monthlyDataMap = new Map<string, number>();
    const internalCosts = {
      aluguel: 0,
      energia: 0,
      internet: 0,
      manutencao: 0
    };
    const monthlyDetails: MonthlyDetail[] = [];

    // Buscar todas as transações do período
    const transactionsRef = collection(db, 'financial_transactions');
    const transactionsQuery = query(
      transactionsRef,
      where('due_date', '>=', Timestamp.fromDate(startOfMonth)),
      where('due_date', '<=', Timestamp.fromDate(endOfMonth))
    );

    console.log('Buscando transações...', { startOfMonth, endOfMonth });
    const transactionsSnapshot = await getDocs(transactionsQuery);
    console.log('Transações encontradas:', transactionsSnapshot.size);

    // Filtrar e processar custos internos
    const transactions = transactionsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as FirestoreTransaction }))
      .sort((a, b) => b.due_date.toMillis() - a.due_date.toMillis());

    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && 
          ['aluguel', 'energia', 'internet', 'manutencao'].includes(transaction.category)) {
        const amount = transaction.amount || 0;
        const category = transaction.category as keyof typeof internalCosts;
        
        internalCosts[category] += amount;
        totalExpenses += amount;

        monthlyDetails.push({
          date: transaction.due_date.toDate().toISOString().split('T')[0],
          description: transaction.description || `Custo ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          category,
          type: 'expense',
          amount
        });

        const monthKey = transaction.due_date.toDate().toLocaleString('pt-BR', { month: 'short' });
        const currentValue = monthlyDataMap.get(monthKey) || 0;
        monthlyDataMap.set(monthKey, currentValue - amount);
      }
    });

    // Buscar fornecedores e baixas
    const [suppliersSnapshot, dismissalsSnapshot, vacationsSnapshot] = await Promise.all([
      getDocs(query(
        collection(db, 'suppliers'),
        where('payment_date', '>=', Timestamp.fromDate(startOfMonth)),
        where('payment_date', '<=', Timestamp.fromDate(endOfMonth))
      )),
      getDocs(query(
        collection(db, 'employee_dismissals'),
        where('dismissal_date', '>=', startOfMonth.toISOString().split('T')[0]),
        where('dismissal_date', '<=', endOfMonth.toISOString().split('T')[0])
      )),
      getDocs(query(
        collection(db, 'employee_vacations'),
        where('start_date', '>=', startOfMonth.toISOString().split('T')[0]),
        where('start_date', '<=', endOfMonth.toISOString().split('T')[0])
      ))
    ]);
    
    console.log('Fornecedores encontrados:', suppliersSnapshot.size);
    console.log('Baixas encontradas:', dismissalsSnapshot.size);
    console.log('Férias encontradas:', vacationsSnapshot.size);

    let suppliersCost = 0;
    let vacationsCost = 0;

    // Ordenar fornecedores por data de pagamento
    const suppliers = suppliersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as FirestoreSupplier }))
      .sort((a, b) => b.payment_date.toMillis() - a.payment_date.toMillis());

    suppliers.forEach(supplier => {
      console.log('Fornecedor:', supplier);
      const amount = supplier.paid_value || 0;
      suppliersCost += amount;
      totalExpenses += amount;

      monthlyDetails.push({
        date: supplier.payment_date.toDate().toISOString().split('T')[0],
        description: `${supplier.service || 'Serviço'} - ${supplier.name || 'Fornecedor'}`,
        category: 'Fornecedor',
        type: 'expense',
        amount
      });

      const monthKey = supplier.payment_date.toDate().toLocaleString('pt-BR', { month: 'short' });
      const currentValue = monthlyDataMap.get(monthKey) || 0;
      monthlyDataMap.set(monthKey, currentValue - amount);
    });

    // Processar baixas de funcionários
    dismissalsSnapshot.docs.forEach(doc => {
      const dismissal = doc.data();
      console.log('Processando baixa:', dismissal); // Debug

      // Garantir que os valores são números
      const amount = Number(dismissal.amount) || 0;
      const penaltyAmount = Number(dismissal.penalty_amount) || 0;
      const totalDismissalCost = amount + penaltyAmount;

      console.log('Valores da baixa:', { amount, penaltyAmount, totalDismissalCost }); // Debug

      dismissalsCost += totalDismissalCost;
      totalExpenses += totalDismissalCost; // Adicionar ao total de despesas

      monthlyDetails.push({
        date: dismissal.dismissal_date,
        description: `Baixa - ${dismissal.employee_name} (${dismissal.contract_municipality})`,
        category: 'Baixa de Funcionário',
        type: 'expense',
        amount: totalDismissalCost
      });

      const monthKey = new Date(dismissal.dismissal_date).toLocaleString('pt-BR', { month: 'short' });
      const currentValue = monthlyDataMap.get(monthKey) || 0;
      monthlyDataMap.set(monthKey, currentValue - totalDismissalCost);
    });

    // Processar férias
    vacationsSnapshot.docs.forEach(doc => {
      const vacation = doc.data();
      const amount = Number(vacation.amount) || 0;
      
      vacationsCost += amount;
      totalExpenses += amount;

      monthlyDetails.push({
        date: vacation.start_date,
        description: `Férias - ${vacation.employee_name}`,
        category: 'Férias de Funcionário',
        type: 'expense',
        amount
      });

      const monthKey = new Date(vacation.start_date).toLocaleString('pt-BR', { month: 'short' });
      const currentValue = monthlyDataMap.get(monthKey) || 0;
      monthlyDataMap.set(monthKey, currentValue - amount);
    });

    console.log('Total de custos com baixas:', dismissalsCost);
    console.log('Total de custos com férias:', vacationsCost);
    console.log('Total de despesas após baixas e férias:', totalExpenses);

    // Buscar dados dos contratos
    console.log('Buscando contratos...');
    const contracts = await getContracts();
    console.log('Contratos encontrados:', contracts.length);

    const monthlyRecordsPromises = contracts.map(contract => getMonthlyRecords(contract.id));
    const monthlyRecordsResults = await Promise.all(monthlyRecordsPromises);

    const contractsRevenue = {
      total: 0,
      byContract: [] as {
        contractId: string;
        municipalityName: string;
        revenue: number;
        expenses: number;
        balance: number;
      }[]
    };

    contracts.forEach((contract, index) => {
      const records = monthlyRecordsResults[index].filter(record => {
        const recordDate = new Date(record.created_at);
        return recordDate >= startOfMonth && recordDate <= endOfMonth;
      });

      const totalRevenue = records.reduce((sum, record) => sum + (record.revenue || 0), 0);
      const contractExpenses = records.reduce((sum, record) => sum + (record.expenses || 0), 0);
      
      contractsRevenue.total += totalRevenue;
      totalIncome += totalRevenue;
      totalContractExpenses += contractExpenses;
      totalExpenses += contractExpenses; // Adicionar despesas do contrato ao total

      contractsRevenue.byContract.push({
        contractId: contract.id,
        municipalityName: contract.municipality_name,
        revenue: totalRevenue,
        expenses: contractExpenses,
        balance: totalRevenue - contractExpenses
      });

      // Adicionar detalhes mensais
      records.forEach(record => {
        const monthKey = new Date(record.created_at).toLocaleString('pt-BR', { month: 'short' });
        const recordRevenue = record.revenue || 0;
        const recordExpenses = record.expenses || 0;
        
        if (recordRevenue > 0) {
          monthlyDetails.push({
            date: record.created_at,
            description: `Receita - ${contract.municipality_name}`,
            category: 'Contrato',
            type: 'income',
            amount: recordRevenue
          });
        }

        if (recordExpenses > 0) {
          monthlyDetails.push({
            date: record.created_at,
            description: `Despesas - ${contract.municipality_name}`,
            category: 'Contrato',
            type: 'expense',
            amount: recordExpenses
          });
        }

        const currentValue = monthlyDataMap.get(monthKey) || 0;
        monthlyDataMap.set(monthKey, currentValue + (recordRevenue - recordExpenses));
      });
    });

    // Calcular totais e percentuais
    const totalInternalCosts = Object.values(internalCosts).reduce((a, b) => a + b, 0);

    // Não precisamos recalcular o total de despesas aqui, pois já estamos somando incrementalmente

    const summary: FinancialSummary = {
      revenueByContracts: totalIncome > 0 ? (contractsRevenue.total / totalIncome) * 100 : 0,
      expensesByContracts: totalExpenses > 0 ? (totalContractExpenses / totalExpenses) * 100 : 0,
      expensesBySuppliers: totalExpenses > 0 ? (suppliersCost / totalExpenses) * 100 : 0,
      expensesByInternal: totalExpenses > 0 ? (totalInternalCosts / totalExpenses) * 100 : 0,
      expensesByDismissals: totalExpenses > 0 ? (dismissalsCost / totalExpenses) * 100 : 0,
      expensesByVacations: totalExpenses > 0 ? (vacationsCost / totalExpenses) * 100 : 0
    };

    // Garantir que os percentuais somem 100%
    const totalPercentage = Object.values(summary).reduce((a, b) => a + b, 0);
    if (totalPercentage > 0) {
      Object.keys(summary).forEach(key => {
        summary[key as keyof FinancialSummary] = (summary[key as keyof FinancialSummary] / totalPercentage) * 100;
      });
    }

    // Preparar dados do gráfico
    const monthlyData = Array.from(monthlyDataMap.entries())
      .map(([month, value]) => ({
        month,
        value
      }))
      .sort((a, b) => {
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        return months.indexOf(a.month.toLowerCase()) - months.indexOf(b.month.toLowerCase());
      });

    // Ordenar detalhes por data
    monthlyDetails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const result = {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      suppliersCost,
      dismissalsCost,
      vacationsCost,
      internalCosts,
      monthlyData,
      contractsRevenue,
      monthlyDetails,
      summary
    };

    console.log('Dashboard Data:', {
      internalCosts,
      suppliersCost,
      dismissalsCost,
      monthlyDetails: monthlyDetails.length,
      summary
    });

    return result;
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    throw error;
  }
}
