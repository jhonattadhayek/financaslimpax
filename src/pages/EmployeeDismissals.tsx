import React, { useState, useEffect } from 'react';
import { getDismissals, deleteDismissal } from '../services/employee-dismissal';
import { EmployeeDismissal } from '../types/employee-dismissal';
import { EmployeeDismissalModal } from '../components/EmployeeDismissalModal';

export default function EmployeeDismissals() {
  const [dismissals, setDismissals] = useState<EmployeeDismissal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDismissal, setEditingDismissal] = useState<EmployeeDismissal | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Atualizar custo total quando as baixas mudarem
    const total = dismissals.reduce((sum, dismissal) => sum + dismissal.amount, 0);
    setTotalCost(total);
  }, [dismissals]);

  async function loadData() {
    try {
      setLoading(true);
      const dismissalsData = await getDismissals();
      setDismissals(dismissalsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(dismissal: EmployeeDismissal) {
    setEditingDismissal(dismissal);
    setIsModalOpen(true);
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
              Baixas de Funcionários
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-1">
              Total: R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingDismissal(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Nova Baixa
          </button>
        </div>
      </div>

      {/* Lista de Baixas */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Funcionário
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Data
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Valor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Motivo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border dark:divide-gray-700">
            {dismissals.map((dismissal) => (
              <tr key={dismissal.id} className="hover:bg-surface/50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text dark:text-white">{dismissal.employee_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text dark:text-gray-300">
                    {new Date(dismissal.dismissal_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text dark:text-gray-300">
                    R$ {dismissal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text dark:text-gray-300">{dismissal.reason}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary space-x-2">
                  <button
                    onClick={() => openEditModal(dismissal)}
                    className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Tem certeza que deseja excluir esta baixa?')) {
                        try {
                          await deleteDismissal(dismissal.id);
                          await loadData();
                        } catch (error) {
                          alert('Erro ao excluir baixa: ' + (error as Error).message);
                        }
                      }
                    }}
                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EmployeeDismissalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDismissal(null);
        }}
        onSave={loadData}
        editingDismissal={editingDismissal || undefined}
      />
    </div>
  );
}
