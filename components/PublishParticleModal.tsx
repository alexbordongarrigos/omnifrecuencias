import React, { useState } from 'react';
import { supabase } from '../services/starseedAuth';
import Icon from './Icon';
import { OscillatorState, FileSystemNode } from '../types';
import { StarseedUser } from '../services/starseedAuth';

const STORAGE_KEY = 'omni_holographic_fs_v1';

// Recursive helper to find all files in the file system tree
const getAllFiles = (node: FileSystemNode): FileSystemNode[] => {
  let files: FileSystemNode[] = [];
  if (node.type === 'file') {
    files.push(node);
  }
  if (node.children) {
    node.children.forEach(child => {
      files = files.concat(getAllFiles(child));
    });
  }
  return files;
};

interface Props {
  onClose: () => void;
  oscillators: OscillatorState[];
  user: StarseedUser;
}

const PublishParticleModal: React.FC<Props> = ({ onClose, oscillators, user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceMode, setSourceMode] = useState<'current' | 'library'>('current');
  const [libraryFiles, setLibraryFiles] = useState<FileSystemNode[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: FileSystemNode = JSON.parse(saved);
        const files = getAllFiles(parsed);
        setLibraryFiles(files);
        if (files.length > 0) {
          setSelectedFileId(files[0].id);
        }
      } catch (e) {
        console.error("Failed to parse library files", e);
      }
    }
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }
    let dataToPublish = oscillators;

    if (sourceMode === 'library') {
      const selectedFile = libraryFiles.find(f => f.id === selectedFileId);
      if (!selectedFile || !selectedFile.content || !selectedFile.content.oscillators) {
        setError("El archivo seleccionado no es válido o está vacío.");
        return;
      }
      dataToPublish = selectedFile.content.oscillators;
    }

    if (dataToPublish.length === 0) {
      setError("No hay frecuencias para publicar.");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        author_id: user.id,
        // Removed author_name to fix schema cache error
        data: dataToPublish,
        tags: ['omni', 'frecuencias']
      };

      const { error: dbError } = await supabase
        .from('omni_presets')
        .insert([payload]);

      if (dbError) throw dbError;

      onClose();
    } catch (err: any) {
      console.error("Error al publicar:", err);
      setError(err.message || "Error desconocido al publicar la partícula.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
        
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="Upload" size={18} className="text-cyan-400" />
            Publicar Partícula
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handlePublish} className="p-6">
          <p className="text-sm text-slate-400 mb-6">
            Comparte tu configuración frecuencial actual (<strong>{oscillators.length} osciladores</strong>) con la red Starseed.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 p-1 bg-black/50 border border-white/10 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setSourceMode('current')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${sourceMode === 'current' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-white/5'}`}
            >
              Frecuencias Actuales
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('library')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${sourceMode === 'library' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:bg-white/5'}`}
            >
              Desde mi Biblioteca
            </button>
          </div>

          <div className="space-y-4">
            {sourceMode === 'library' && (
              <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seleccionar Archivo</label>
                 {libraryFiles.length > 0 ? (
                    <select
                      value={selectedFileId}
                      onChange={e => setSelectedFileId(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                    >
                      {libraryFiles.map(file => (
                        <option key={file.id} value={file.id}>{file.name}</option>
                      ))}
                    </select>
                 ) : (
                    <div className="text-sm text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      No tienes archivos guardados en tu biblioteca local.
                    </div>
                 )}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Título de la Partícula</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej. Frecuencia Pineal 936Hz"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Propósito, efectos esperados, o notas sobre esta configuración..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors h-24 resize-none"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 transition-colors"
              disabled={isPublishing}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPublishing || !title.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex justify-center items-center gap-2"
            >
              {isPublishing ? (
                <>
                  <Icon name="Loader" size={16} className="animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Icon name="Rocket" size={16} />
                  Publicar al Nexus
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublishParticleModal;
