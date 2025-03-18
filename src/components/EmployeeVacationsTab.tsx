import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EmployeeVacation } from '../types/employee-vacation';
import { Employee } from '../types/employee';
import { getActiveEmployees } from '../services/employees';

export function EmployeeVacationsTab({ onCostUpdate }: { onCostUpdate: (cost: number) => void }) {
  const [vacations, setVacations] = useState<EmployeeVacation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<EmployeeVacation | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState('');
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
    // Atualizar custo total quando as férias mudarem
    const totalCost = vacations.reduce((sum, vacation) => {
      return sum + vacation.amount;
    }, 0);
    
    console.log('Total de custos com férias:', totalCost);
    onCostUpdate(totalCost);
  }, [vacations, onCostUpdate]);

  async function loadData() {
    try {
      setLoading(true);
      const vacationsData = await loadVacations();
      setVacations(vacationsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVacations() {
    const vacationsRef = collection(db, 'employee_vacations');
    const q = query(vacationsRef, orderBy('start_date', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        amount: Number(data.amount) || 0,
        days_count: Number(data.days_count) || 0,
        created_at: data.created_at.toDate().toISOString()
      };
    }) as EmployeeVacation[];
  }

  function resetForm() {
    setSelectedEmployeeId('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setDaysCount('');
    setAmount('');
    setReason('');
    setEditingVacation(null);
  }

  function openEditModal(vacation: EmployeeVacation) {
    setEditingVacation(vacation);
    const employee = employees.find(emp => emp.name === vacation.employee_name);
    if (employee) {
      setSelectedEmployeeId(employee.id);
    }
    setStartDate(vacation.start_date);
    setEndDate(vacation.end_date);
    setDaysCount(vacation.days_count.toString());
    setAmount(vacation.amount.toString());
    setReason(vacation.reason);
    setIsModalOpen(true);
  }

  // Calcular número de dias entre duas datas
  function calculateDays(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o último dia
    return diffDays;
  }

  // Atualizar número de dias quando as datas mudarem
  useEffect(() => {
    if (startDate && endDate) {
      const days = calculateDays(startDate, endDate);
      setDaysCount(days.toString());
    }
  }, [startDate, endDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Validar valores
      const amountValue = Number(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        alert('Valor inválido');
        return;
      }

      const daysValue = Number(daysCount);
      if (isNaN(daysValue) || daysValue <= 0) {
        alert('Número de dias inválido');
        return;
      }

      // Validar datas
      if (new Date(endDate) < new Date(startDate)) {
        alert('Data de término deve ser posterior à data de início');
        return;
      }

      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
      if (!selectedEmployee) {
        alert('Selecione um funcionário');
        return;
      }

      const vacationData = {
        employee_name: selectedEmployee.name,
        start_date: startDate,
        end_date: endDate,
        days_count: daysValue,
        amount: amountValue,
        reason,
        created_at: Timestamp.now()
      };

      if (editingVacation) {
        const vacationRef = doc(db, 'employee_vacations', editingVacation.id);
        await updateDoc(vacationRef, {
          ...vacationData,
          updated_at: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'employee_vacations'), vacationData);
      }

      await loadData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar férias:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Tem certeza que deseja excluir este registro de férias?')) return;
    
    try {
      await deleteDoc(doc(db, 'employee_vacations', id));
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar férias:', error);
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
        <h2 className="text-xl font-semibold dark:text-white">Férias de Funcionários</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Nova Férias
        </button>
      </div>

      {/* Lista de Férias */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Funcionário
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Início
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Fim
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Dias
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Valor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border dark:divide-gray-700">
            {vacations.map((vacation) => (
              <tr key={vacation.id} className="hover:bg-surface/50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text dark:text-white">{vacation.employee_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text dark:text-gray-300">
                    {new Date(vacation.start_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text dark:text-gray-300">
                    {new Date(vacation.end_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text dark:text-gray-300">
                    {vacation.days_count} dias
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text dark:text-gray-300">
                    R$ {vacation.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary space-x-2">
                  <button
                    onClick={() => openEditModal(vacation)}
                    className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(vacation.id)}
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
              {editingVacation ? 'Editar Férias' : 'Nova Férias'}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => {
                      const date = e.target.value;
                      if (date) {
                        setEndDate(date);
                      }
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                    Número de Dias
                  </label>
                  <input
                    type="number"
                    value={daysCount}
                    onChange={(e) => setDaysCount(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    required
                    readOnly
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
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                  Motivação
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
                  {editingVacation ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
