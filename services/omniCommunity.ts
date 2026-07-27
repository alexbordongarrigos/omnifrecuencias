import { supabase } from './starseedAuth';
import { OmniProfile } from '../types';

export const fetchCommunityProfiles = async (currentUserId?: string): Promise<OmniProfile[]> => {
  // Fetch profiles from os_profiles
  const { data: profiles, error } = await supabase
    .from('os_profiles')
    .select('user_id, display_name, avatar_url, cover_url');

  if (error || !profiles) {
    console.error("Error fetching profiles:", error);
    return [];
  }

  // To get followers and particles count, we ideally would use SQL views or aggregates.
  // For now we'll do it client side or assume mock stats if not fully implemented in DB yet.
  
  const { data: particles } = await supabase
    .from('omni_presets')
    .select('author_id')
    .eq('is_public', true);

  const { data: resonances } = await supabase
    .from('omni_resonances')
    .select('following_id');

  return profiles.map(p => {
    // Calculate counts
    const particlesCount = particles?.filter(pt => pt.author_id === p.user_id).length || 0;
    const resonancesCount = resonances?.filter(r => r.following_id === p.user_id).length || 0;

    return {
      id: p.user_id,
      displayName: p.display_name || 'Explorador Cuántico',
      avatar_url: p.avatar_url,
      cover_url: p.cover_url,
      status: 'offline', // Will be updated via presence
      lastActive: Date.now(),
      particlesCount,
      resonancesCount,
    };
  });
};

export const resonateWithUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from('omni_resonances')
    .insert({ follower_id: followerId, following_id: followingId });
  
  if (error) throw error;
};

export const unresonateWithUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from('omni_resonances')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
    
  if (error) throw error;
};

export const checkResonance = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from('omni_resonances')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) return false;
  return !!data;
};
