import React, { useState, useEffect } from 'react';
import { getContracts, Contract } from '../services/contracts';
import { createEmployee, getAllEmployees, deleteEmployee, updateEmployee } from '../services/employees';
import { Employee } from '../types/employee';
import { Edit2, Trash2 } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contractId, setContractId] = useState('');
  const [isHeadquarter, setIsHeadquarter] = useState(false);
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (editingEmployee) {
      setName(editingEmployee.name);
      setContractId(editingEmployee.contract_id || '');
      setIsHeadquarter(editingEmployee.is_headquarter);
      setHireDate(editingEmployee.hire_date);
    }
  }, [editingEmployee]);

  async function loadData() {
    try {
      setLoading(true);
      const [employeesData, contractsData] = await Promise.all([
        getAllEmployees(),
        getContracts()
      ]);
      setEmployees(employeesData);
      setContracts(contractsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName('');
    setContractId('');
    setIsHeadquarter(false);
    setHireDate(new Date().toISOString().split('T')[0]);
    setEditingEmployee(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const selectedContract = contracts.find(c => c.id === contractId);
      const employeeData = {
        name,
        contract_id: isHeadquarter ? undefined : contractId,
        contract_municipality: isHeadquarter ? undefined : selectedContract?.municipality_name,
        is_headquarter: isHeadquarter,
        active: true,
        hire_date: hireDate
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, employeeData);
      } else {
        await createEmployee(employeeData);
      }

      await loadData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Tem certeza que deseja remover este funcionário? Esta ação não pode ser desfeita.')) return;
    
    try {
      await deleteEmployee(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao remover funcionário:', error);
    }
  }

  function handleEdit(employee: Employee) {
    setEditingEmployee(employee);
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
            Funcionários
          </h1>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Novo Funcionário
          </button>
        </div>
      </div>

      {/* Lista de Funcionários */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Nome
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Local
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Data de Contratação
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border dark:divide-gray-700">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-surface/50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text dark:text-white">{employee.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text dark:text-gray-300">
                    {employee.is_headquarter ? 'SEDE' : employee.contract_municipality}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text dark:text-gray-300">
                    {new Date(employee.hire_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    employee.active
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                  }`}>
                    {employee.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="p-1.5 rounded-md text-blue-400 hover:text-blue-500 hover:bg-blue-400/10 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="p-1.5 rounded-md text-red-400 hover:text-red-500 hover:bg-red-400/10 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
              {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                  Nome do Funcionário
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                  Data de Contratação
                </label>
                <input
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isHeadquarter"
                  checked={isHeadquarter}
                  onChange={(e) => setIsHeadquarter(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/50 dark:border-gray-600"
                />
                <label htmlFor="isHeadquarter" className="text-sm font-medium text-text-secondary dark:text-gray-300">
                  Funcionário da SEDE
                </label>
              </div>

              {!isHeadquarter && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                    Contrato
                  </label>
                  <select
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    required
                  >
                    <option value="">Selecione um contrato</option>
                    {contracts.map(contract => (
                      <option key={contract.id} value={contract.id}>
                        {contract.municipality_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  {editingEmployee ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
