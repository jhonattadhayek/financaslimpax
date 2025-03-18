import React, { useState, useEffect } from 'react';
import { Plus, Loader2, FileText } from 'lucide-react';
import { Contract } from '../types/contract';
import { getContracts } from '../services/contracts';
import { uploadFile } from '../services/storage';

interface HRAttachment {
  id: string;
  name: string;
  date: string;
  description: string;
  contractId: string;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
}

function HRAttachments() {
  const [attachments, setAttachments] = useState<HRAttachment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    contractId: ''
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const contractsList = await getContracts();
      setContracts(contractsList);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      setError('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Arquivo muito grande. Tamanho máximo: 10MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      let fileUrl = '';
      let fileName = '';

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        fileName = selectedFile.name;
      }

      const newAttachment: HRAttachment = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
        fileUrl,
        fileName
      };

      setAttachments(prev => [newAttachment, ...prev]);
      setIsModalOpen(false);
      setFormData({
        name: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        contractId: ''
      });
      setSelectedFile(null);
      setError(null);
    } catch (error) {
      console.error('Erro ao salvar anexo:', error);
      setError('Erro ao salvar anexo. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-lg text-text-secondary">Carregando...</div>
    </div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-300 dark:to-blue-400 bg-clip-text text-transparent">
          RH - Anexos
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          <span>Novo Anexo</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Novo Anexo</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Data
                </label>
                <input
                  type="date"
                  className="input w-full"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descrição
                </label>
                <textarea
                  className="input w-full min-h-[100px]"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Contrato
                </label>
                <select
                  className="input w-full"
                  value={formData.contractId}
                  onChange={e => setFormData(prev => ({ ...prev, contractId: e.target.value }))}
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

              <div>
                <label className="block text-sm font-medium mb-1">
                  Arquivo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="flex-1 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center justify-center">
                      {selectedFile ? (
                        <span className="text-text-secondary">{selectedFile.name}</span>
                      ) : (
                        <span className="text-text-secondary">Selecionar arquivo</span>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedFile(null);
                    setError(null);
                  }}
                  className="px-4 py-2 text-text-secondary hover:bg-surface rounded-lg transition-colors"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </div>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachments List */}
      <div className="grid gap-4">
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            Nenhum anexo cadastrado
          </div>
        ) : (
          attachments.map(attachment => (
            <div
              key={attachment.id}
              className="p-4 bg-surface rounded-lg border border-border/10"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{attachment.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {new Date(attachment.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {attachment.fileUrl && (
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <FileText size={16} />
                      Ver arquivo
                    </a>
                  )}
                  <span className="text-sm bg-surface-hover px-2 py-1 rounded">
                    {contracts.find(c => c.id === attachment.contractId)?.municipality_name}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-text-secondary">
                {attachment.description}
              </p>
              {attachment.fileName && (
                <p className="mt-2 text-sm text-text-secondary">
                  Arquivo: {attachment.fileName}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HRAttachments; 