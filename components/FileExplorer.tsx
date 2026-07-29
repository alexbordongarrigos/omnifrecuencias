
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileSystemNode, PresetContent } from '../types';
import { useFileSystem } from '../hooks/useFileSystem';
import Icon from './Icon';
import { publishPresetToCloud, getCurrentStarseedUser, exportPresetToOSLibrary, importPresetsFromOSLibrary } from '../services/starseedAuth';

interface Props {
  mode: 'save' | 'load';
  onFileSelect: (content: PresetContent, mix?: boolean) => void;
  onClose: () => void;
  fs: ReturnType<typeof useFileSystem>;
  currentConfig?: PresetContent; // For saving
}

const FileExplorer: React.FC<Props> = ({ mode, onFileSelect, onClose, fs, currentConfig }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [saveFileName, setSaveFileName] = useState('');
  const [saveFileCategory, setSaveFileCategory] = useState('synergy');
  const [saveFileDescription, setSaveFileDescription] = useState('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // Navigation Helper
  const currentFolder = fs.findNode(currentFolderId, fs.root);
  
  // Breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs = [];
    let curr = currentFolder;
    while (curr && curr.id !== 'root') {
      crumbs.unshift(curr);
      curr = fs.findNode(curr.parentId!, fs.root);
    }
    return [{ id: 'root', name: 'Raíz' }, ...crumbs];
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      fs.createFolder(currentFolderId, newFolderName);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleSave = () => {
    if (saveFileName.trim() && currentConfig) {
      const newConfig = {
        ...currentConfig,
        category: saveFileCategory,
        description: saveFileDescription,
      };
      fs.saveFile(currentFolderId, saveFileName, newConfig);
      onClose();
    }
  };

  // Sorting: Folders first, then Files
  const sortedChildren = [...(currentFolder?.children || [])].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-5xl bg-black/60 border border-cyan-500/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(34,211,238,0.05)] flex flex-col h-[90vh] sm:h-[85vh] overflow-hidden relative backdrop-blur-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-pink-500/10 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border ${mode === 'save' ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400 shadow-[inset_0_0_15px_rgba(34,211,238,0.2)]' : 'bg-purple-950/40 border-purple-500/30 text-purple-400 shadow-[inset_0_0_15px_rgba(168,85,247,0.2)]'}`}>
               <Icon name={mode === 'save' ? 'Save' : 'Folder'} size={28} className="drop-shadow-[0_0_8px_currentColor]" />
            </div>
            <div>
                <h2 className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {mode === 'save' ? 'Guardar Partícula' : 'Cargar Partícula'}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-200/60 mt-1">Sistema Cuántico de Partículas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <Icon name="X" size={24} />
          </button>
        </div>

        {/* Toolbar & Breadcrumbs */}
        <div className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/5 relative z-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
           {/* Breadcrumbs */}
           <div className="flex items-center gap-2 text-sm overflow-x-auto no-scrollbar">
              {getBreadcrumbs().map((crumb, idx, arr) => (
                <div key={crumb.id} className="flex items-center gap-2 shrink-0">
                   <button 
                     onClick={() => setCurrentFolderId(crumb.id)}
                     className={`hover:text-cyan-300 transition-colors font-medium tracking-wide ${idx === arr.length - 1 ? 'text-cyan-100 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-slate-500'}`}
                   >
                     {crumb.name}
                   </button>
                   {idx < arr.length - 1 && <Icon name="ChevronRight" size={14} className="text-slate-700" />}
                </div>
              ))}
           </div>

            {/* Actions */}
           <div className="flex gap-3">
             <button 
               onClick={async () => {
                 const user = await getCurrentStarseedUser();
                 if (!user) {
                   alert('Inicia sesión en Starseed OS (Pestaña Comunidad) para importar presets.');
                   return;
                 }
                 try {
                   const osPresets = await importPresetsFromOSLibrary(user.id);
                   osPresets.forEach(preset => {
                     fs.saveFileWithPath(preset.pathSegments, preset.name, preset.content);
                   });
                   alert(`Se importaron y sincronizaron inteligentemente ${osPresets.length} presets desde los folders de tu biblioteca de Starseed OS.`);
                 } catch (err) {
                   console.error(err);
                   alert('Error al sincronizar presets desde OS.');
                 }
               }}
               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/30 hover:bg-amber-900/50 text-xs font-bold uppercase tracking-wider text-amber-300 border border-amber-500/20 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)] transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
               title="Sincronizar carpetas y presets desde Starseed OS"
             >
               <Icon name="DownloadCloud" size={14} />
               Importar OS
             </button>
             {!isCreatingFolder && (
               <button 
                 onClick={() => setIsCreatingFolder(true)}
                 className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/50 text-xs font-bold uppercase tracking-wider text-cyan-300 border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)] transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
               >
                 <Icon name="Plus" size={14} />
                 Nueva Carpeta
               </button>
             )}
           </div>
        </div>

        {/* Create Folder Input */}
        {isCreatingFolder && (
          <div className="px-6 py-4 bg-cyan-950/20 border-b border-cyan-500/20 flex items-center gap-4 animate-fade-in shadow-[inset_0_0_20px_rgba(34,211,238,0.05)] relative z-10">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
               <Icon name="Folder" size={18} className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
            </div>
            <input 
              autoFocus
              type="text" 
              placeholder="Nombre de la carpeta..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              className="bg-black/40 border border-cyan-500/30 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] flex-1 py-2 px-4 transition-all placeholder:text-slate-600"
            />
            <button onClick={handleCreateFolder} className="text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-5 py-2.5 rounded-xl hover:bg-cyan-500/40 border border-cyan-500/30 transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]">Crear</button>
            <button onClick={() => setIsCreatingFolder(false)} className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors">Cancelar</button>
          </div>
        )}

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-transparent relative z-0 custom-scrollbar">
           {sortedChildren.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-600">
               <div className="p-6 rounded-full bg-white/5 border border-white/10 mb-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                  <Icon name="Folder" size={48} className="opacity-20" />
               </div>
               <p className="text-sm font-medium tracking-widest uppercase opacity-50">Carpeta vacía</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sortedChildren.map(node => (
                  <div 
                    key={node.id}
                    onClick={() => {
                        if (node.type === 'folder') setCurrentFolderId(node.id);
                        else setSelectedId(node.id);
                    }}
                    onDoubleClick={() => {
                        if (node.type === 'file' && node.content) {
                            onFileSelect(node.content, false);
                            onClose();
                        }
                    }}
                    className={`
                      relative group cursor-pointer rounded-2xl flex flex-col transition-all duration-300 border overflow-hidden
                      ${selectedId === node.id 
                          ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2),inset_0_0_15px_rgba(34,211,238,0.1)] -translate-y-1' 
                          : 'bg-black/40 border-white/5 hover:bg-black/60 hover:border-white/20 hover:-translate-y-0.5'}
                      ${node.type === 'file' ? 'p-4 col-span-1 sm:col-span-1 aspect-[4/3]' : 'items-center justify-center gap-3 p-4 aspect-square'}
                    `}
                  >
                     {node.type === 'folder' ? (
                       <>
                         <div className={`
                           w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 border
                           bg-amber-950/30 text-amber-400 border-amber-500/20 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]
                         `}>
                            <Icon name="Folder" size={28} className="drop-shadow-[0_0_5px_currentColor]" />
                         </div>
                         
                         {editingNodeId === node.id ? (
                            <input 
                              autoFocus
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                      if (editingName.trim()) fs.renameNode(node.id, editingName.trim());
                                      setEditingNodeId(null);
                                  } else if (e.key === 'Escape') {
                                      setEditingNodeId(null);
                                  }
                              }}
                              onBlur={() => {
                                  if (editingName.trim()) fs.renameNode(node.id, editingName.trim());
                                  setEditingNodeId(null);
                              }}
                              className="w-full bg-black/80 border border-cyan-500/50 text-white text-xs font-medium text-center rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                              onClick={(e) => e.stopPropagation()}
                            />
                         ) : (
                            <span className={`text-xs font-medium break-words w-full line-clamp-2 text-center leading-relaxed transition-colors ${selectedId === node.id ? 'text-cyan-100' : 'text-slate-300 group-hover:text-white'}`}>
                                {node.name}
                            </span>
                         )}
                       </>
                     ) : (
                       // Rich File Card
                       <div className="flex flex-col h-full w-full text-left relative z-10">
                         <div className="flex justify-between items-start mb-2">
                           <div className={`p-2 rounded-xl bg-purple-950/30 text-purple-400 border border-purple-500/20 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]`}>
                             <Icon name="FileAudio" size={16} />
                           </div>
                           <span className="text-[9px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full text-slate-300 font-mono">
                             {node.content?.oscillators?.length || 0} Osc
                           </span>
                         </div>
                         
                         {editingNodeId === node.id ? (
                            <input 
                              autoFocus
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                      if (editingName.trim()) fs.renameNode(node.id, editingName.trim());
                                      setEditingNodeId(null);
                                  } else if (e.key === 'Escape') {
                                      setEditingNodeId(null);
                                  }
                              }}
                              onBlur={() => {
                                  if (editingName.trim()) fs.renameNode(node.id, editingName.trim());
                                  setEditingNodeId(null);
                              }}
                              className="w-full bg-black/80 border border-cyan-500/50 text-white text-sm font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] mb-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                         ) : (
                           <h4 className="font-bold text-white text-sm mb-1 truncate">{node.name}</h4>
                         )}

                         <p className="text-[10px] text-slate-400 line-clamp-2 flex-grow">
                           {node.content?.description || 'Sin descripción'}
                         </p>

                         {node.content?.category && (
                           <div className="mt-2 text-[9px] uppercase font-bold tracking-widest text-cyan-500/80">
                             {node.content.category}
                           </div>
                         )}
                       </div>
                     )}
                     
                     {/* Hover Actions */}
                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10 shadow-lg z-20">
                         <button 
                           onClick={async (e) => {
                             e.stopPropagation();
                             if (node.type === 'file' && node.content) {
                               const user = await getCurrentStarseedUser();
                               if (!user) {
                                 alert('Debes iniciar sesión con Starseed OS (Pestaña Comunidad) para usar la nube.');
                                 return;
                               }
                               try {
                                 await exportPresetToOSLibrary(node, user.id);
                                 alert('¡Preset guardado en tu Biblioteca de Starseed OS!');
                               } catch (err) {
                                 console.error(err);
                                 alert('Error al exportar a Starseed OS.');
                               }
                             }
                           }}
                           className={`p-1.5 bg-black/50 hover:bg-amber-500/50 rounded-md text-white backdrop-blur-sm transition-colors ${node.type === 'folder' ? 'hidden' : ''}`}
                           title="Exportar a la Biblioteca de Starseed OS"
                        >
                            <Icon name="Cloud" size={12} />
                        </button>
                         <button 
                           onClick={async (e) => {
                             e.stopPropagation();
                             if (node.type === 'file' && node.content) {
                               const user = await getCurrentStarseedUser();
                               if (!user) {
                                 alert('Debes iniciar sesión con Starseed OS (Pestaña Comunidad) para publicar presets.');
                                 return;
                               }
                               const customCategory = window.prompt('Ingresa la categoría o carpeta pública para este preset (ej. Meditación, Solfeggio, Viaje Astral):', node.content.category || 'Varios');
                               if (customCategory === null) return; // User cancelled
                               
                               try {
                                 // Add custom category to the preset content before saving
                                 node.content.category = customCategory.trim() || 'Varios';
                                 
                                 await publishPresetToCloud(node, user.id, true);
                                 alert(`¡Preset publicado en Vibras bajo la categoría "${node.content.category}" con éxito!`);
                               } catch (err) {
                                 console.error(err);
                                 alert('Error al publicar el preset.');
                               }
                             }
                           }}
                           className={`p-1.5 bg-black/50 hover:bg-cyan-500/50 rounded-md text-white backdrop-blur-sm transition-colors ${node.type === 'folder' ? 'hidden' : ''}`}
                           title="Publicar en Comunidad (Vibras)"
                        >
                            <Icon name="Globe" size={12} />
                        </button>
                        <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setEditingNodeId(node.id);
                             setEditingName(node.name);
                           }}
                           className="p-1.5 bg-black/50 hover:bg-cyan-500/50 rounded-md text-white backdrop-blur-sm transition-colors"
                           title="Renombrar"
                        >
                            <Icon name="Edit2" size={12} />
                        </button>
                        <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             if(confirm('¿Borrar este elemento?')) fs.deleteNode(node.id);
                           }}
                           className="p-1.5 bg-black/50 hover:bg-red-500/50 rounded-md text-white backdrop-blur-sm transition-colors"
                           title="Eliminar"
                        >
                            <Icon name="Trash2" size={12} />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-black/60 backdrop-blur-xl flex flex-col md:flex-row gap-6 items-center justify-between relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
           <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hidden sm:block">
             {selectedId ? 'Elemento seleccionado' : 'Selecciona un archivo o carpeta'}
           </div>

           <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             {mode === 'save' && (
               <div className="flex-1 sm:w-80 relative flex flex-col gap-2">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Nombre del archivo..."
                      value={saveFileName}
                      onChange={(e) => setSaveFileName(e.target.value)}
                      className="w-full bg-black/60 border border-cyan-500/50 rounded-xl pl-4 pr-16 py-3 text-sm text-white focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.4)] focus:outline-none transition-all placeholder:text-slate-500"
                    />
                    <div className="absolute right-4 top-3.5 text-cyan-500/50 pointer-events-none text-xs font-bold font-mono">.omni</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={saveFileCategory}
                      onChange={(e) => setSaveFileCategory(e.target.value)}
                      className="w-1/3 bg-black/60 border border-cyan-500/30 rounded-xl px-2 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none transition-all"
                    >
                      <option value="brain">Neuroacústica</option>
                      <option value="pyramid">Megalitos</option>
                      <option value="music">Música Sagrada</option>
                      <option value="chakras">Chakras & Vórtex</option>
                      <option value="rhythms">Ritmos e Isocrónicos</option>
                      <option value="microtonal">Pitagóricas & Microtonales</option>
                      <option value="synergy">Sinergias Maestras</option>
                    </select>
                    
                    <input 
                      type="text" 
                      placeholder="Breve descripción..."
                      value={saveFileDescription}
                      onChange={(e) => setSaveFileDescription(e.target.value)}
                      className="w-2/3 bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none transition-all placeholder:text-slate-500"
                    />
                  </div>
               </div>
             )}

             {mode === 'load' && (
                <button 
                    onClick={() => {
                        if (selectedId) {
                            const node = sortedChildren.find(n => n.id === selectedId);
                            if (node && node.content) {
                                onFileSelect(node.content, true);
                                onClose();
                            }
                        }
                    }}
                    disabled={!selectedId}
                    className={`
                      w-full sm:w-auto px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 border
                      ${selectedId 
                        ? 'bg-purple-950/40 text-purple-200 border-purple-500/50 hover:bg-purple-900/60 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.4),inset_0_0_10px_rgba(168,85,247,0.2)] hover:-translate-y-0.5' 
                        : 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'}
                    `}
                >
                    Mezclar
                </button>
             )}

             <button 
                onClick={() => {
                    if (mode === 'save') handleSave();
                    else if (selectedId) {
                        const node = sortedChildren.find(n => n.id === selectedId);
                        if (node && node.content) {
                            onFileSelect(node.content, false);
                            onClose();
                        }
                    }
                }}
                disabled={mode === 'save' ? !saveFileName : !selectedId}
                className={`
                  w-full sm:w-auto px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all duration-300 border
                  ${(mode === 'save' ? saveFileName : selectedId) 
                    ? 'bg-cyan-950/40 text-cyan-200 border-cyan-500/50 hover:bg-cyan-900/60 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4),inset_0_0_10px_rgba(34,211,238,0.2)] hover:-translate-y-0.5' 
                    : 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'}
                `}
             >
               {mode === 'save' ? 'Guardar' : 'Cargar'}
             </button>
           </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default FileExplorer;
