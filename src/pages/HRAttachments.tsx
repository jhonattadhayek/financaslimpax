import React, { useState, useEffect } from 'react';
import { Plus, Loader2, FileText, X } from 'lucide-react';
import { Contract, getContracts } from '../services/contracts';
import { uploadFile } from '../services/storage';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    contractId: ''
  });

  useEffect(() => {
    loadContracts();
    loadAttachments();
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

  const loadAttachments = async () => {
    try {
      const attachmentsRef = collection(db, 'hr_attachments');
      const q = query(attachmentsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const attachmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HRAttachment[];

      setAttachments(attachmentsData);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
      setError('Erro ao carregar anexos');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Arquivo muito grande. Tamanho máximo: 10MB');
        event.target.value = '';
        return;
      }

      // Validar tipo do arquivo
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG, PNG ou TXT');
        event.target.value = '';
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Selecione um arquivo para upload');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Upload do arquivo
      const fileUrl = await uploadFile(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      // Salvar no Firestore
      const newAttachment = {
        ...formData,
        fileUrl,
        fileName: selectedFile.name,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'hr_attachments'), newAttachment);
      
      // Atualizar lista de anexos
      setAttachments(prev => [{
        id: docRef.id,
        ...newAttachment,
        createdAt: newAttachment.createdAt.toDate().toISOString()
      }, ...prev]);

      // Resetar form
      setIsModalOpen(false);
      setFormData({
        name: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        contractId: ''
      });
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Erro ao salvar anexo:', error);
      setError('Erro ao salvar anexo. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachment: HRAttachment) => {
    if (!confirm('Tem certeza que deseja excluir este anexo?')) return;

    try {
      await deleteDoc(doc(db, 'hr_attachments', attachment.id));
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    } catch (error) {
      console.error('Erro ao excluir anexo:', error);
      alert('Erro ao excluir anexo. Tente novamente.');
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
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-600">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Novo Anexo</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedFile(null);
                  setError(null);
                  setUploadProgress(0);
                }}
                className="text-text-secondary hover:text-text"
              >
                <X size={20} />
              </button>
            </div>
            
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
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
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

              {uploading && (
                <div className="space-y-2">
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-sm text-text-secondary text-center">
                    {uploadProgress.toFixed(0)}% concluído
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedFile(null);
                    setError(null);
                    setUploadProgress(0);
                  }}
                  className="px-4 py-2 text-text-secondary hover:bg-surface rounded-lg transition-colors"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando...</span>
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
                  <button
                    onClick={() => handleDelete(attachment)}
                    className="p-1.5 rounded-md text-red-400 hover:text-red-500 hover:bg-red-400/10 transition-colors"
                    title="Excluir"
                  >
                    <X size={16} />
                  </button>
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