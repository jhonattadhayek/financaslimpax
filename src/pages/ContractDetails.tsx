import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Contract, getContractById, updateContract } from '../services/contracts';
import { MonthlyRecord, getMonthlyRecords, createMonthlyRecord, deleteMonthlyRecord } from '../services/monthly-records';

function ContractDetails() {
  const { id } = useParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [contractData, recordsData] = await Promise.all([
        getContractById(id!),
        getMonthlyRecords(id!)
      ]);

      setContract(contractData);
      setMonthlyRecords(recordsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const [year, month] = (formData.get('month') as string).split('-');
      const newRecord = {
        contract_id: id,
        month: Number(month),
        year: Number(year),
        revenue: Number(formData.get('revenue')),
        expenses: Number(formData.get('expenses')),
        employees_count: Number(formData.get('employees_count')),
        notes: formData.get('notes') as string | null
      };

      const createdRecord = await createMonthlyRecord(newRecord);
      setMonthlyRecords(prev => [...prev, createdRecord]);
      setShowModal(false);
      form.reset();
    } catch (err) {
      console.error('Erro ao criar registro:', err);
      alert('Erro ao criar registro. Tente novamente.');
    }
  };

  const handleUpdateContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !contract) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const updatedContract = {
        municipality_name: formData.get('name') as string,
        description: formData.get('description') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string
      };

      const updated = await updateContract(id, updatedContract);
      setContract(updated);
      setEditMode(false);
    } catch (err) {
      console.error('Erro ao atualizar contrato:', err);
      alert('Erro ao atualizar contrato. Tente novamente.');
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
      await deleteMonthlyRecord(recordId);
      setMonthlyRecords(prev => prev.filter(record => record.id !== recordId));
    } catch (err) {
      console.error('Erro ao deletar registro:', err);
      alert('Erro ao deletar registro. Tente novamente.');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">
    <div className="text-lg text-text-secondary">Carregando dados...</div>
  </div>;

  if (error) return <div className="flex items-center justify-center h-screen">
    <div className="text-lg text-red-500">Erro: {error}</div>
  </div>;

  if (!contract) return <div className="flex items-center justify-center h-screen">
    <div className="text-lg text-text-secondary">Contrato não encontrado</div>
  </div>;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/contracts" className="text-text-secondary hover:text-text transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
              {contract.municipality_name}
            </h1>
            <p className="text-text-secondary">{contract.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setEditMode(true)}
            className="button-secondary flex items-center space-x-2"
          >
            <Edit2 size={20} />
            <span>Editar Contrato</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="button-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Registro Mensal</span>
          </button>
        </div>
      </div>

      {/* Contract Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold text-text">Informações do Contrato</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Data de Início</p>
              <p className="text-text font-medium">{new Date(contract.start_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Data de Término</p>
              <p className="text-text font-medium">{new Date(contract.end_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Status</p>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                {contract.status}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-xl font-semibold text-text">Resumo Financeiro</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Receita Total</p>
              <p className="font-semibold text-lg bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
                R$ {monthlyRecords.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Despesa Total</p>
              <p className="font-semibold text-lg bg-gradient-to-r from-red-500 to-rose-400 dark:from-red-400 dark:to-rose-300 bg-clip-text text-transparent">
                R$ {monthlyRecords.reduce((acc, curr) => acc + curr.expenses, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Records */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text">Registros Mensais</h2>
        <div className="grid gap-4">
          {monthlyRecords.map((record) => (
            <div key={record.id} className="card p-4 hover:scale-[1.01] transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-text">{`${record.month}/${record.year}`}</h3>
                  <p className="text-text-secondary">{record.notes}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    className="p-2 text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-text-secondary">Receita</p>
                  <p className="font-semibold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
                    R$ {record.revenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Despesas</p>
                  <p className="font-semibold bg-gradient-to-r from-red-500 to-rose-400 dark:from-red-400 dark:to-rose-300 bg-clip-text text-transparent">
                    R$ {record.expenses.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Funcionários</p>
                  <p className="text-text font-medium">{record.employees_count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for new monthly record */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="card p-6 w-full max-w-xl">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
              Novo Registro Mensal
            </h2>
            <form className="space-y-4" onSubmit={handleCreateRecord}>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Mês/Ano</label>
                <input 
                  type="month" 
                  name="month"
                  className="input"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Receita</label>
                <input 
                  type="number" 
                  name="revenue"
                  className="input" 
                  placeholder="0,00"
                  step="0.01"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Despesas</label>
                <input 
                  type="number" 
                  name="expenses"
                  className="input" 
                  placeholder="0,00"
                  step="0.01"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Quantidade de Funcionários</label>
                <input 
                  type="number" 
                  name="employees_count"
                  className="input" 
                  placeholder="0"
                  min="0"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Observações</label>
                <textarea 
                  name="notes"
                  className="input" 
                  rows={3} 
                  placeholder="Adicione observações relevantes"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="button-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="button-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for editing contract */}
      {editMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="card p-6 w-full max-w-xl">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
              Editar Contrato
            </h2>
            <form className="space-y-4" onSubmit={handleUpdateContract}>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Nome da Prefeitura</label>
                <input
                  type="text"
                  className="input"
                  name="name"
                  defaultValue={contract.municipality_name}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Descrição do Serviço</label>
                <textarea
                  className="input"
                  rows={3}
                  name="description"
                  defaultValue={contract.description}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Data de Início</label>
                  <input
                    type="date"
                    className="input"
                    name="start_date"
                    defaultValue={contract.start_date}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Data de Término</label>
                  <input
                    type="date"
                    className="input"
                    name="end_date"
                    defaultValue={contract.end_date}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="button-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="button-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractDetails;
