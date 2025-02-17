import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Building, Wallet, ChevronUp, ChevronDown } from 'lucide-react';
import { DashboardData, getFinancialSummary } from '../services/dashboard';

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

function Dashboard() {
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [summary, setSummary] = useState<DashboardData>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    suppliersCost: 0,
    dismissalsCost: 0,
    vacationsCost: 0,
    internalCosts: {
      aluguel: 0,
      energia: 0,
      internet: 0,
      manutencao: 0
    },
    monthlyData: [],
    contractsRevenue: {
      total: 0,
      byContract: []
    },
    monthlyDetails: [],
    summary: {
      revenueByContracts: 0,
      expensesByContracts: 0,
      expensesBySuppliers: 0,
      expensesByInternal: 0,
      expensesByDismissals: 0,
      expensesByVacations: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filterMonth]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getFinancialSummary(filterMonth);
      console.log('Dashboard Data:', data); // Debug
      setSummary(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  // Preparar dados para o gráfico de custos
  const costData = [
    { name: 'Aluguel', value: summary.internalCosts.aluguel },
    { name: 'Energia', value: summary.internalCosts.energia },
    { name: 'Internet', value: summary.internalCosts.internet },
    { name: 'Manutenção', value: summary.internalCosts.manutencao },
    { name: 'Fornecedores', value: summary.suppliersCost },
    { name: 'Baixas', value: summary.dismissalsCost },
    { name: 'Férias', value: summary.vacationsCost }
  ];

  if (loading) return <div className="flex items-center justify-center h-screen">
    <div className="text-lg text-text-secondary">Carregando dados...</div>
  </div>;

  if (error) return <div className="flex items-center justify-center h-screen">
    <div className="text-lg text-red-500">Erro: {error}</div>
  </div>;

  // Calcular totais dos contratos
  const totalContractsRevenue = summary.contractsRevenue.byContract
    .reduce((sum, contract) => sum + contract.revenue, 0);
  const totalContractsExpenses = summary.contractsRevenue.byContract
    .reduce((sum, contract) => sum + contract.expenses, 0);
  const totalContractsBalance = summary.contractsRevenue.byContract
    .reduce((sum, contract) => sum + contract.balance, 0);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <input
            type="month"
            className="input w-40"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
          <div className="text-text-secondary bg-surface px-4 py-2 rounded-lg border border-border/10">
            Última atualização: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-2">Receita Total</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-400 dark:from-green-400 dark:to-emerald-300 bg-clip-text text-transparent">
                R$ {summary.totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-400/10 dark:bg-green-400/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="text-green-400 dark:text-green-300" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-2">Custos Totais</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-rose-400 dark:from-red-400 dark:to-rose-300 bg-clip-text text-transparent">
                R$ {summary.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-rose-400/10 dark:bg-rose-400/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingDown className="text-rose-400 dark:text-rose-300" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-2">Receita Contratos</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-pink-500 dark:from-fuchsia-300 dark:to-pink-400 bg-clip-text text-transparent">
                R$ {summary.contractsRevenue.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-fuchsia-400/10 dark:bg-fuchsia-400/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <Building className="text-fuchsia-400 dark:text-fuchsia-300" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6 group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-2">Balanço</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 dark:from-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
                R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-indigo-400/10 dark:bg-indigo-400/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <Wallet className="text-indigo-400 dark:text-indigo-300" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Costs Distribution */}
        <div className="card p-6 backdrop-blur-lg">
          <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-red-500 to-rose-400 dark:from-red-400 dark:to-rose-300 bg-clip-text text-transparent">
            Distribuição de Custos
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  contentStyle={{ 
                    backgroundColor: 'rgb(var(--color-surface))',
                    border: '1px solid rgb(var(--color-border))',
                    borderRadius: '0.5rem',
                    color: 'rgb(var(--color-text))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Evolution */}
        <div className="card p-6 backdrop-blur-lg">
          <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
            Evolução Mensal
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(56, 189, 248)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="rgb(56, 189, 248)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.5)" />
                <XAxis 
                  dataKey="month" 
                  stroke="rgb(var(--color-text-secondary))"
                  tick={{ fill: 'rgb(var(--color-text-secondary))' }}
                />
                <YAxis 
                  stroke="rgb(var(--color-text-secondary))"
                  tick={{ fill: 'rgb(var(--color-text-secondary))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgb(var(--color-surface))',
                    border: '1px solid rgb(var(--color-border))',
                    borderRadius: '0.5rem',
                    color: 'rgb(var(--color-text))'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Balanço"
                  stroke="rgb(56, 189, 248)"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Contracts Summary */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-fuchsia-400 to-pink-500 dark:from-fuchsia-300 dark:to-pink-400 bg-clip-text text-transparent">
          Resumo dos Contratos
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-surface/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Município
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Receita
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Despesas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Balanço
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {summary.contractsRevenue.byContract.map(contract => (
                <tr key={contract.contractId} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 text-text">{contract.municipalityName}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-green-500 dark:text-green-400">
                      R$ {contract.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-red-500 dark:text-red-400">
                      R$ {contract.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${
                      contract.balance >= 0
                        ? 'text-green-500 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400'
                    }`}>
                      R$ {contract.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="bg-gradient-to-r from-surface to-surface/70 font-semibold border-t-2 border-border/20">
                <td className="px-4 py-4 text-lg bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
                  Total Geral
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-text-secondary mb-1">Receita Total</span>
                    <span className="text-lg text-green-500 dark:text-green-400">
                      R$ {totalContractsRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-text-secondary mb-1">Despesa Total</span>
                    <span className="text-lg text-red-500 dark:text-red-400">
                      R$ {totalContractsExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-text-secondary mb-1">Balanço Final</span>
                    <span className={`text-lg ${
                      totalContractsBalance >= 0
                        ? 'text-green-500 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400'
                    }`}>
                      R$ {totalContractsBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Details */}
      <div className="card overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
            Detalhamento Mensal
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-surface/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {summary.monthlyDetails.map((detail, index) => (
                <tr key={index} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-text">
                    {new Date(detail.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-text">{detail.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      detail.category === 'Contrato'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : detail.category === 'Fornecedor'
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                        : detail.category === 'aluguel'
                        ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                        : detail.category === 'energia'
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                        : detail.category === 'internet'
                        ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300'
                        : detail.category === 'manutencao'
                        ? 'bg-lime-100 dark:bg-lime-900 text-lime-700 dark:text-lime-300'
                        : detail.category === 'Baixa de Funcionário'
                        ? 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
                        : detail.category === 'Férias de Funcionário'
                        ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}>
                      {detail.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      detail.type === 'income' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    }`}>
                      {detail.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${
                      detail.type === 'income'
                        ? 'text-green-500 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400'
                    }`}>
                      R$ {detail.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
          Resumo Financeiro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Receitas */}
          <div className="card bg-surface/50 p-6 backdrop-blur-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Receitas</h3>
              <ChevronUp className="text-green-500 dark:text-green-400" size={20} />
            </div>
            <div className="space-y-4">
              <div className="relative pt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-text">Contratos</span>
                  <span className="font-semibold text-green-500 dark:text-green-400">
                    {summary.summary.revenueByContracts.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-surface/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
                    style={{ width: `${summary.summary.revenueByContracts}%` }}
                  />
                </div>
              </div>

              <div className="relative pt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-text">Férias de Funcionários</span>
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    {summary.summary.expensesByVacations.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-surface/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-rose-400 h-2 rounded-full"
                    style={{ width: `${summary.summary.expensesByVacations}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Despesas */}
          <div className="card bg-surface/50 p-6 backdrop-blur-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Despesas</h3>
              <ChevronDown className="text-red-500 dark:text-red-400" size={20} />
            </div>
            <div className="space-y-4">
              <div className="relative pt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-text">Contratos</span>
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    {summary.summary.expensesByContracts.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-surface/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-rose-400 h-2 rounded-full"
                    style={{ width: `${summary.summary.expensesByContracts}%` }}
                  />
                </div>
              </div>

              <div className="relative pt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-text">Custos Internos</span>
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    {summary.summary.expensesByInternal.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-surface/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-rose-400 h-2 rounded-full"
                    style={{ width: `${summary.summary.expensesByInternal}%` }}
                  />
                </div>
              </div>

              <div className="relative pt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-text">Fornecedores</span>
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    {summary.summary.expensesBySuppliers.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-surface/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-rose-400 h-2 rounded-full"
                    style={{ width: `${summary.summary.expensesBySuppliers}%` }}
                  />
                </div>
              </div>

              <div className="relative pt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-text">Baixas de Funcionários</span>
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    {summary.summary.expensesByDismissals.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-surface/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-rose-400 h-2 rounded-full"
                    style={{ width: `${summary.summary.expensesByDismissals}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
