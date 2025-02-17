import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Transaction, getTransactions, deleteTransaction } from '../services/finances';
import { NewTransactionModal } from './NewTransactionModal';

type Props = {
  onCostUpdate: (totalCost: number) => void;
};

export function InternalCostsTab({ onCostUpdate }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    loadTransactions();
  }, [filterMonth]);

  const loadTransactions = async () => {
    try {
      const [year, month] = filterMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-${new Date(Number(year), Number(month), 0).getDate()}`;
      
      const data = await getTransactions({ startDate, endDate });
      setTransactions(data);
      
      const totalCost = data.reduce((sum, transaction) => sum + transaction.amount, 0);
      onCostUpdate(totalCost);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      await deleteTransaction(id);
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      
      const totalCost = updatedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      onCostUpdate(totalCost);
    } catch (err) {
      console.error('Erro ao deletar transação:', err);
      alert('Erro ao deletar transação. Tente novamente.');
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64">
    <div className="text-lg text-text-secondary">Carregando transações...</div>
  </div>;

  if (error) return <div className="flex items-center justify-center h-64">
    <div className="text-lg text-red-500">Erro: {error}</div>
  </div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
          Custos Internos
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="button-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nova Transação</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar transações..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-text-secondary" size={20} />
        </div>
        <input
          type="month"
          className="input w-40"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        />
      </div>

      {/* Transactions List */}
      <div className="grid gap-4">
        {filteredTransactions.map(transaction => (
          <div key={transaction.id} className="card p-4 hover:scale-[1.01] transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Descrição</div>
                <div className="font-medium text-sm">{transaction.description}</div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1 mt-3">Categoria</div>
                <div className="font-medium text-sm">{transaction.category}</div>
              </div>
              
              <div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Método de Pagamento</div>
                <div className="font-medium text-sm">{transaction.payment_method}</div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1 mt-3">Data</div>
                <div className="font-medium text-sm">
                  {new Date(transaction.due_date).toLocaleDateString()}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Valor</div>
                <div className="font-medium text-sm">R$ {transaction.amount.toLocaleString()}</div>
              </div>
              
              <div className="flex flex-col justify-between">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingTransaction(transaction)}
                    className="p-1.5 rounded-md text-blue-400 hover:text-blue-500 hover:bg-blue-400/10 transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="p-1.5 rounded-md text-red-400 hover:text-red-500 hover:bg-red-400/10 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <NewTransactionModal
        isOpen={showModal || !!editingTransaction}
        onClose={() => {
          setShowModal(false);
          setEditingTransaction(null);
        }}
        onSuccess={() => {
          loadTransactions();
          setShowModal(false);
          setEditingTransaction(null);
        }}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}
