import { createClient } from '@supabase/supabase-js';
import { PresetContent, FileSystemNode } from '../types';

// These should ideally be environment variables, but for the integration with Starseed OS
// we will assume a global config or provide mock URLs if missing.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StarseedUser {
  id: string;
  email: string;
  displayName: string;
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

  return {
    id: data.user.id,
    email: data.user.email || '',
    displayName: data.user.user_metadata?.full_name || 'Starseed Explorer',
  };
};

export const logoutStarseed = async () => {
  await supabase.auth.signOut();
};

export const getCurrentStarseedUser = async (): Promise<StarseedUser | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email || '',
      displayName: session.user.user_metadata?.full_name || 'Starseed Explorer',
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
      category: node.content.oscillators[0]?.type || 'synergy'
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
  return data[0];
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
  return data;
};

export const deleteLiveSession = async (sessionId: string) => {
  await supabase.from('omni_sessions').delete().eq('id', sessionId);
};
