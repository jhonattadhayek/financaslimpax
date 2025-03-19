import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export type UploadProgressCallback = (progress: number) => void;

export const uploadFile = async (
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  try {
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `hr-attachments/${fileName}`);
    
    // Criar uma Promise que será resolvida quando o upload terminar
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Erro durante o upload:', error);
          reject(new Error('Erro ao fazer upload do arquivo'));
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (error) {
            console.error('Erro ao obter URL do arquivo:', error);
            reject(new Error('Erro ao obter URL do arquivo'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Erro ao iniciar upload:', error);
    throw new Error('Erro ao fazer upload do arquivo');
  }
}; 