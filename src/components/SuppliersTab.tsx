import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar } from 'lucide-react';
import { Supplier, getSuppliers, createSupplier, deleteSupplier, updateSupplier } from '../services/suppliers';
import { Contract, getContracts } from '../services/contracts';

type Props = {
  onCostUpdate: (totalCost: number) => void;
};

export function SuppliersTab({ onCostUpdate }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [isHeadquarter, setIsHeadquarter] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>('');

  useEffect(() => {
    loadSuppliers();
    loadContracts();
  }, [filterMonth]);

  const loadContracts = async () => {
    try {
      const data = await getContracts();
      setContracts(data);
    } catch (err) {
      console.error('Erro ao carregar contratos:', err);
    }
  };

  const loadSuppliers = async () => {
    try {
      const [year, month] = filterMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-${new Date(Number(year), Number(month), 0).getDate()}`;
      
      const data = await getSuppliers({ startDate, endDate });
      setSuppliers(data);
      
      const totalCost = data.reduce((sum, supplier) => sum + supplier.paid_value, 0);
      onCostUpdate(totalCost);
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const newSupplier = {
        name: formData.get('name') as string,
        service: formData.get('service') as string,
        document: formData.get('document') as string,
        payment_method: formData.get('payment_method') as string,
        contract_value: Number(formData.get('contract_value')),
        paid_value: Number(formData.get('paid_value')),
        payment_date: formData.get('payment_date') as string,
        is_headquarter: isHeadquarter,
        contract_id: !isHeadquarter ? selectedContractId : undefined
      };

      const createdSupplier = await createSupplier(newSupplier);
      setSuppliers(prev => [createdSupplier, ...prev]);
      setShowModal(false);
      form.reset();
      setIsHeadquarter(false);
      setSelectedContractId('');
      
      const totalCost = suppliers.reduce((sum, supplier) => sum + supplier.paid_value, 0) + newSupplier.paid_value;
      onCostUpdate(totalCost);
    } catch (err) {
      console.error('Erro ao criar fornecedor:', err);
      alert('Erro ao criar fornecedor. Tente novamente.');
    }
  };

  const handleUpdateSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSupplier) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const updatedData = {
        name: formData.get('name') as string,
        service: formData.get('service') as string,
        document: formData.get('document') as string,
        payment_method: formData.get('payment_method') as string,
        contract_value: Number(formData.get('contract_value')),
        paid_value: Number(formData.get('paid_value')),
        payment_date: formData.get('payment_date') as string,
        is_headquarter: isHeadquarter,
        contract_id: !isHeadquarter ? selectedContractId : undefined
      };

      const updatedSupplier = await updateSupplier(editingSupplier.id, updatedData);
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? updatedSupplier : s));
      setEditingSupplier(null);
      setIsHeadquarter(false);
      setSelectedContractId('');
      
      const totalCost = suppliers.reduce((sum, supplier) => 
        supplier.id === editingSupplier.id ? sum + updatedData.paid_value : sum + supplier.paid_value, 0
      );
      onCostUpdate(totalCost);
    } catch (err) {
      console.error('Erro ao atualizar fornecedor:', err);
      alert('Erro ao atualizar fornecedor. Tente novamente.');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

    try {
      await deleteSupplier(id);
      const updatedSuppliers = suppliers.filter(s => s.id !== id);
      setSuppliers(updatedSuppliers);
      
      const totalCost = updatedSuppliers.reduce((sum, supplier) => sum + supplier.paid_value, 0);
      onCostUpdate(totalCost);
    } catch (err) {
      console.error('Erro ao deletar fornecedor:', err);
      alert('Erro ao deletar fornecedor. Tente novamente.');
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.document.includes(searchTerm)
  );

  if (loading) return <div className="flex items-center justify-center h-64">
    <div className="text-lg text-text-secondary">Carregando fornecedores...</div>
  </div>;

  if (error) return <div className="flex items-center justify-center h-64">
    <div className="text-lg text-red-500">Erro: {error}</div>
  </div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
          Fornecedores
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="month"
              className="input pl-9 pr-4 py-2 h-10 text-sm bg-surface/50 border border-border/10 rounded-lg"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
            <Calendar className="absolute left-3 top-2.5 text-text-secondary" size={16} />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="button-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar fornecedores..."
          className="input pl-10 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 text-text-secondary" size={20} />
      </div>

      {/* Suppliers List */}
      <div className="grid gap-4">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="card p-4 hover:scale-[1.01] transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Nome</div>
                <div className="font-medium text-sm">{supplier.name}</div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1 mt-3">Serviço</div>
                <div className="font-medium text-sm">{supplier.service}</div>
              </div>
              
              <div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">CPF/CNPJ</div>
                <div className="font-medium text-sm">{supplier.document}</div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1 mt-3">Forma de Pagamento</div>
                <div className="font-medium text-sm">{supplier.payment_method}</div>
              </div>
              
              <div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Valor do Contrato</div>
                <div className="font-medium text-sm">R$ {supplier.contract_value.toLocaleString()}</div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1 mt-3">Valor Pago</div>
                <div className="font-medium text-sm">R$ {supplier.paid_value.toLocaleString()}</div>
                <div className="text-xs text-text-secondary uppercase tracking-wider mb-1 mt-3">Local</div>
                <div className="font-medium text-sm">
                  {supplier.is_headquarter ? 'SEDE' : contracts.find(c => c.id === supplier.contract_id)?.municipality_name || 'N/A'}
                </div>
              </div>
              
              <div className="flex flex-col justify-between">
                <div>
                  <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Data</div>
                  <div className="font-medium text-sm">
                    {new Date(supplier.payment_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => {
                      setEditingSupplier(supplier);
                      setIsHeadquarter(supplier.is_headquarter);
                      setSelectedContractId(supplier.contract_id || '');
                    }}
                    className="p-1.5 rounded-md text-blue-400 hover:text-blue-500 hover:bg-blue-400/10 transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(supplier.id)}
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

      {/* Modal for new/edit supplier */}
      {(showModal || editingSupplier) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="card p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
              {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </h2>
            <form className="space-y-4" onSubmit={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Nome do Fornecedor</label>
                  <input
                    type="text"
                    name="name"
                    className="input"
                    defaultValue={editingSupplier?.name}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Serviço</label>
                  <input
                    type="text"
                    name="service"
                    className="input"
                    defaultValue={editingSupplier?.service}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">CPF/CNPJ</label>
                  <input
                    type="text"
                    name="document"
                    className="input"
                    defaultValue={editingSupplier?.document}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Forma de Pagamento</label>
                  <input
                    type="text"
                    name="payment_method"
                    className="input"
                    defaultValue={editingSupplier?.payment_method}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Valor do Contrato</label>
                  <input
                    type="number"
                    name="contract_value"
                    className="input"
                    step="0.01"
                    defaultValue={editingSupplier?.contract_value}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Valor Pago</label>
                  <input
                    type="number"
                    name="paid_value"
                    className="input"
                    step="0.01"
                    defaultValue={editingSupplier?.paid_value}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Data</label>
                  <input
                    type="date"
                    name="payment_date"
                    className="input"
                    defaultValue={editingSupplier?.payment_date}
                    required
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHeadquarter}
                      onChange={(e) => {
                        setIsHeadquarter(e.target.checked);
                        if (e.target.checked) {
                          setSelectedContractId('');
                        }
                      }}
                      className="rounded border-border text-primary focus:ring-primary/50"
                    />
                    <span className="text-sm font-medium text-text">Fornecedor da SEDE</span>
                  </label>
                </div>
              </div>

              {!isHeadquarter && (
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Contrato</label>
                  <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className="input"
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

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupplier(null);
                    setIsHeadquarter(false);
                    setSelectedContractId('');
                  }}
                  className="button-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="button-primary">
                  {editingSupplier ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
