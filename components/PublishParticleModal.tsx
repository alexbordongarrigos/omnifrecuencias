import React, { useState } from 'react';
import { supabase } from '../services/starseedAuth';
import Icon from './Icon';
import { OscillatorState, FileSystemNode, PresetContent } from '../types';
import { StarseedUser } from '../services/starseedAuth';
import FileExplorer from './FileExplorer';
import { useFileSystem } from '../hooks/useFileSystem';

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
  const [selectedFileContent, setSelectedFileContent] = useState<PresetContent | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fs = useFileSystem();

  // Remove the old linear library loading useEffect since we use FileExplorer

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }
    let dataToPublish = oscillators;

    if (sourceMode === 'library') {
      if (!selectedFileContent || !selectedFileContent.oscillators) {
        setError("Selecciona un archivo de tu biblioteca para publicar.");
        return;
      }
      dataToPublish = selectedFileContent.oscillators;
    }

    if (dataToPublish.length === 0) {
      setError("No hay frecuencias para publicar.");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const payload = {
        name: title.trim(),
        content: {
          oscillators: dataToPublish,
          description: description.trim(),
          tags: ['omni', 'frecuencias'],
          category: selectedFileContent?.category || 'synergy'
        },
        author_id: user.id,
        is_public: true,
        category: selectedFileContent?.category || 'synergy'
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
                 
                 <div className="flex items-center gap-3 bg-black/50 border border-white/10 rounded-xl px-4 py-3">
                    <Icon name="FileText" size={20} className={selectedFileName ? "text-purple-400" : "text-slate-500"} />
                    <span className="flex-1 text-sm font-medium text-slate-300 truncate">
                      {selectedFileName || 'Ningún archivo seleccionado'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFileExplorer(true)}
                      className="px-3 py-1.5 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30"
                    >
                      Explorar
                    </button>
                 </div>
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
      
      {showFileExplorer && (
        <FileExplorer
          mode="load"
          fs={fs}
          onClose={() => setShowFileExplorer(false)}
          onFileSelect={(content) => {
             setSelectedFileContent(content);
             // We don't have the node name directly here since onFileSelect only passes content, 
             // but we can look it up in fs or let the user type the name.
             // Wait, let's just use a default or find it in fs.
             // A better approach is to change FileExplorer to pass the node name if we can, 
             // but to avoid changing FileExplorer again, let's find the file by content.
             const fileNode = getAllFiles(fs.root).find(f => f.content === content);
             if (fileNode) {
               setSelectedFileName(fileNode.name);
               setTitle(fileNode.name);
             } else {
               setSelectedFileName('Archivo Seleccionado');
             }
             if (content.description) setDescription(content.description);
          }}
        />
      )}
    </div>
  );
};

export default PublishParticleModal;
