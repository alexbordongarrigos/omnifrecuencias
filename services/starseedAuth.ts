import { createClient } from '@supabase/supabase-js';
import { PresetContent, FileSystemNode } from '../types';

// These should ideally be environment variables, but for the integration with Starseed OS
// we will assume a global config or provide mock URLs if missing.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nxstilnyidvkqeosofuh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54c3RpbG55aWR2a3Flb3NvZnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzUyMjEsImV4cCI6MjA5NzgxMTIyMX0.noFtrsYFbECzbKyJQH-X9oXPEjL6s-0xL4H-rygIWWI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StarseedUser {
  id: string;
  email: string;
  displayName: string;
  avatar_url?: string;
  cover_url?: string;
}

export const loginWithStarseed = async (email: string, password: string): Promise<StarseedUser | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    console.error("Starseed OS Login Error:", error?.message);
    throw new Error(error?.message || "Login failed");
  }

  const { data: profile } = await supabase
    .from('os_profiles')
    .select('avatar_url, cover_url, display_name')
    .eq('user_id', data.user.id)
    .single();

  return {
    id: data.user.id,
    email: data.user.email || '',
    displayName: profile?.display_name || data.user.user_metadata?.full_name || 'Starseed Explorer',
    avatar_url: profile?.avatar_url,
    cover_url: profile?.cover_url,
  };
};

export const logoutStarseed = async () => {
  await supabase.auth.signOut();
};

export const getCurrentStarseedUser = async (): Promise<StarseedUser | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { data: profile } = await supabase
      .from('os_profiles')
      .select('avatar_url, cover_url, display_name')
      .eq('user_id', session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email || '',
      displayName: profile?.display_name || session.user.user_metadata?.full_name || 'Starseed Explorer',
      avatar_url: profile?.avatar_url,
      cover_url: profile?.cover_url,
    };
  }
  return null;
};

// --- Cloud Presets ---

export const publishPresetToCloud = async (node: FileSystemNode, userId: string, isPublic: boolean = false) => {
  if (!node.content) throw new Error("Solo se pueden subir presets (no carpetas puras)");
  
  const presetContent = {
    ...node.content,
    authorId: userId,
    isPublic: isPublic,
  };

  const { data, error } = await supabase
    .from('omni_presets')
    .upsert({ 
      id: node.id, 
      name: node.name,
      content: presetContent,
      author_id: userId,
      is_public: isPublic,
      category: (node.content as any).category || node.content.oscillators[0]?.type || 'synergy'
    })
    .select();

  if (error) {
    console.error("Error publishing preset:", error);
    throw error;
  }
  return data;
};

export const fetchCommunityPresets = async (): Promise<FileSystemNode[]> => {
  const { data, error } = await supabase
    .from('omni_presets')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching community presets:", error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    parentId: 'cloud_community',
    name: item.name,
    type: 'file',
    content: item.content as PresetContent,
    createdAt: new Date(item.created_at).getTime()
  }));
};

// --- Live Sessions (Entonación) ---

export const createLiveSession = async (presetContent: PresetContent, hostId: string, hostName: string, presetName: string, isPublic: boolean, allowOpenModifications: boolean) => {
  const { data, error } = await supabase
    .from('omni_sessions')
    .insert({
      host_id: hostId,
      host_name: hostName,
      preset_name: presetName,
      preset_content: presetContent,
      is_public: isPublic,
      allow_open_modifications: allowOpenModifications
    })
    .select();
  
  if (error) throw error;
  
  const row = data[0];
  return {
    id: row.id,
    hostId: row.host_id,
    hostName: row.host_name,
    presetName: row.preset_name,
    presetContent: row.preset_content as PresetContent,
    isPublic: row.is_public,
    allowOpenModifications: row.allow_open_modifications,
    createdAt: new Date(row.created_at).getTime()
  };
};

export const fetchLiveSessions = async () => {
  const { data, error } = await supabase
    .from('omni_sessions')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching live sessions:", error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    hostId: row.host_id,
    hostName: row.host_name,
    presetName: row.preset_name,
    presetContent: row.preset_content as PresetContent,
    isPublic: row.is_public,
    allowOpenModifications: row.allow_open_modifications,
    createdAt: new Date(row.created_at).getTime()
  }));
};

// --- OS Files Library Sync ---

export const exportPresetToOSLibrary = async (node: FileSystemNode, userId: string) => {
  if (!node.content) throw new Error("Solo se pueden subir presets (no carpetas puras)");
  
  const presetContent = {
    ...node.content,
    authorId: userId,
  };

  const jsonBlob = new Blob([JSON.stringify(presetContent, null, 2)], { type: 'application/json' });
  const filename = `${node.name}.json`;
  const storagePath = `${userId}/omnifrecuencias_presets/${filename}`;

  // 1. Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('os-files')
    .upload(storagePath, jsonBlob, {
      contentType: 'application/json',
      upsert: true
    });

  if (uploadError) {
    console.error("Error uploading to os-files storage:", uploadError);
    throw uploadError;
  }

  // 2. Insert/Update os_files table
  const { data: dbData, error: dbError } = await supabase
    .from('os_files')
    .upsert({
      owner: userId,
      name: filename,
      mime: 'application/json',
      size: jsonBlob.size,
      path: storagePath,
      is_public: false,
      meta: { type: 'omnifrecuencias_preset', category: (node.content as any).category || 'synergy' }
    }, { onConflict: 'path' })
    .select();

  if (dbError) {
    console.error("Error saving to os_files table:", dbError);
    throw dbError;
  }
  
  return dbData;
};

export interface OSImportedPreset {
  pathSegments: string[];
  name: string;
  content: PresetContent;
}

export const importPresetsFromOSLibrary = async (userId: string): Promise<OSImportedPreset[]> => {
  const { data, error } = await supabase
    .from('os_files')
    .select('*')
    .eq('owner', userId)
    .eq('mime', 'application/json');

  if (error) {
    console.error("Error fetching presets from OS Library:", error);
    return [];
  }

  const importedPresets: OSImportedPreset[] = [];
  
  for (const item of data) {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('os-files')
      .download(item.path);

    if (downloadError || !fileData) {
      console.error("Failed to download preset:", item.name);
      continue;
    }

    try {
      const text = await fileData.text();
      const content = JSON.parse(text) as Partial<PresetContent>;
      
      // Validar inteligentemente si el JSON es un preset compatible de Omni-Frecuencias
      if (content && Array.isArray(content.frequencies)) {
        
        // Extraer estructura de carpetas de la ruta original del OS
        // Rutas comunes: {userId}/carpeta1/carpeta2/archivo.json
        const pathParts = item.path.split('/');
        // Remover userId (inicio) y nombre de archivo (fin)
        let folders = pathParts.slice(1, -1);
        
        // Si no está en ninguna carpeta, asignarlo a "Biblioteca OS"
        if (folders.length === 0) folders = ['Biblioteca OS'];
        
        importedPresets.push({
          pathSegments: folders,
          name: item.name.replace('.json', ''),
          content: content as PresetContent
        });
      }
    } catch (e) {
      // Silenciosamente ignorar archivos JSON que no sean presets válidos
    }
  }

  return importedPresets;
};

export const deleteLiveSession = async (sessionId: string) => {
  await supabase.from('omni_sessions').delete().eq('id', sessionId);
};
