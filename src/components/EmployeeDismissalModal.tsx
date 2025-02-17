import React, { useState, useEffect } from 'react';
import { Employee } from '../types/employee';
import { EmployeeDismissal } from '../types/employee-dismissal';
import { getActiveEmployees } from '../services/employees';
import { createDismissal, updateDismissal } from '../services/employee-dismissal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingDismissal?: EmployeeDismissal;
}

export function EmployeeDismissalModal({ isOpen, onClose, onSave, editingDismissal }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [dismissalDate, setDismissalDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (editingDismissal) {
      const employee = employees.find(emp => emp.name === editingDismissal.employee_name);
      if (employee) {
        setSelectedEmployeeId(employee.id);
      }
      setDismissalDate(editingDismissal.dismissal_date);
      setAmount(editingDismissal.amount.toString());
      setReason(editingDismissal.reason);
    }
  }, [editingDismissal, employees]);

  async function loadEmployees() {
    try {
      const employeesData = await getActiveEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  }

  function resetForm() {
    setSelectedEmployeeId('');
    setDismissalDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setReason('');
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
        reason
      };

      if (editingDismissal) {
        await updateDismissal(editingDismissal.id, dismissalData);
      } else {
        await createDismissal(dismissalData);
      }

      onSave();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar baixa:', error);
    }
  }

  if (!isOpen) return null;

  return (
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
                onClose();
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
  );
}
