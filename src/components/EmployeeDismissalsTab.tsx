import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EmployeeDismissal } from '../types/employee-dismissal';
import { Employee } from '../types/employee';
import { getActiveEmployees } from '../services/employees';

export function EmployeeDismissalsTab({ onCostUpdate }: { onCostUpdate: (cost: number) => void }) {
  const [dismissals, setDismissals] = useState<EmployeeDismissal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDismissal, setEditingDismissal] = useState<EmployeeDismissal | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [dismissalDate, setDismissalDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      const employeesData = await getActiveEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  }

  useEffect(() => {
    // Atualizar custo total quando as baixas mudarem
    const totalCost = dismissals.reduce((sum, dismissal) => {
      return sum + dismissal.amount;
    }, 0);
    
    console.log('Total de custos:', totalCost);
    onCostUpdate(totalCost);
  }, [dismissals, onCostUpdate]);

  async function loadData() {
    try {
      setLoading(true);
      const dismissalsData = await loadDismissals();
      setDismissals(dismissalsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDismissals() {
    const dismissalsRef = collection(db, 'employee_dismissals');
    const q = query(dismissalsRef, orderBy('dismissal_date', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        amount: Number(data.amount) || 0,
        created_at: data.created_at.toDate().toISOString()
      };
    }) as EmployeeDismissal[];
  }

  function resetForm() {
    setSelectedEmployeeId('');
    setDismissalDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setReason('');
    setEditingDismissal(null);
  }

  function openEditModal(dismissal: EmployeeDismissal) {
    setEditingDismissal(dismissal);
    const employee = employees.find(emp => emp.name === dismissal.employee_name);
    if (employee) {
      setSelectedEmployeeId(employee.id);
    }
    setDismissalDate(dismissal.dismissal_date);
    setAmount(dismissal.amount.toString());
    setReason(dismissal.reason);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Validar valores
      const amountValue = Number(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        alert('Valor inválido');
        return;
      }

      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
      if (!selectedEmployee) {
        alert('Selecione um funcionário');
        return;
      }

      const dismissalData = {
        employee_name: selectedEmployee.name,
        dismissal_date: dismissalDate,
        amount: amountValue,
        reason,
        created_at: Timestamp.now()
      };

      if (editingDismissal) {
        const dismissalRef = doc(db, 'employee_dismissals', editingDismissal.id);
        await updateDoc(dismissalRef, {
          ...dismissalData,
          updated_at: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'employee_dismissals'), dismissalData);
      }

      await loadData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar baixa:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Tem certeza que deseja excluir este registro de baixa?')) return;
    
    try {
      await deleteDoc(doc(db, 'employee_dismissals', id));
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar baixa:', error);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold dark:text-white">Baixas de Funcionários</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Nova Baixa
        </button>
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
                    onClick={() => handleDelete(dismissal.id)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg w-full max-w-md dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-4 dark:text-white">
              {editingDismissal ? 'Editar Baixa' : 'Nova Baixa'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                  Nome do Funcionário
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                >
                  <option value="">Selecione um funcionário</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.is_headquarter ? 'SEDE' : employee.contract_municipality}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                  Data da Baixa
                </label>
                <input
                  type="date"
                  value={dismissalDate}
                  onChange={(e) => setDismissalDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                  Motivo
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-text-secondary hover:text-text dark:text-gray-400 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  {editingDismissal ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
