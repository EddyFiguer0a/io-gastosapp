import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export async function getAuthUser(): Promise<User> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Usuario no autenticado o sesión expirada');
  }
  return user;
}

export { supabase };
