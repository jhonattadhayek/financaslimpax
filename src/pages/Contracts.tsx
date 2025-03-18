import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Contract, getContracts, createContract, deleteContract } from '../services/contracts';

function Contracts() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const data = await getContracts();
      setContracts(data);
    } catch (err) {
      console.error('Erro ao carregar contratos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const newContract = {
        municipality_name: formData.get('name') as string,
        description: formData.get('description') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        status: 'active'
      };

      const createdContract = await createContract(newContract);
      setContracts(prev => [createdContract, ...prev]);
      setShowModal(false);
      form.reset();
      
      // Navegar para os detalhes do contrato após criar
      navigate(`/contracts/${createdContract.id}`);
    } catch (err) {
      console.error('Erro ao criar contrato:', err);
      alert('Erro ao criar contrato. Tente novamente.');
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este contrato?')) {
      return;
    }

    try {
      await deleteContract(contractId);
      await loadContracts();
    } catch (error) {
      alert('Erro ao excluir contrato: ' + (error as Error).message);
    }
  };

  const filteredContracts = contracts.filter(contract =>
    contract.municipality_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-screen">
    <div className="text-lg text-text-secondary">Carregando contratos...</div>
  </div>;

  if (error) return <div className="flex items-center justify-center h-screen">
    <div className="text-lg text-red-500">Erro: {error}</div>
  </div>;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
          Contratos
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="button-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Novo Contrato</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar contratos..."
          className="input pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 text-text-secondary" size={20} />
      </div>

      {/* Contracts Grid */}
      <div className="grid gap-4">
        {filteredContracts.map(contract => (
          <div 
            key={contract.id}
            className="card p-4 hover:scale-[1.01] transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/contracts/${contract.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-text">{contract.municipality_name}</h3>
                <p className="text-text-secondary">{contract.description}</p>
              </div>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                {contract.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-sm text-text-secondary">Início</p>
                <p className="text-text font-medium">
                  {new Date(contract.start_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Término</p>
                <p className="text-text font-medium">
                  {new Date(contract.end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Status</p>
                <p className="text-text font-medium capitalize">
                  {contract.status}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteContract(contract.id);
                }}
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="card p-6 w-full max-w-xl">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
              Novo Contrato
            </h2>
            <form className="space-y-4" onSubmit={handleCreateContract}>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Nome da Prefeitura</label>
                <input
                  type="text"
                  name="name"
                  className="input"
                  placeholder="Digite o nome da prefeitura"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Descrição do Serviço</label>
                <textarea
                  name="description"
                  className="input"
                  rows={3}
                  placeholder="Descreva o serviço a ser prestado"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Data de Início</label>
                  <input
                    type="date"
                    name="start_date"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Data de Término</label>
                  <input
                    type="date"
                    name="end_date"
                    className="input"
                    required
                  />
                </div>
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
    </div>
  );
}

export default Contracts;
