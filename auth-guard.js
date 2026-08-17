// auth-guard.js
import { supabase } from './supabase.js';

export async function requireAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        window.location.href = 'login.html';
        return null;
    }
    
    return session;
}

export async function requireNoAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!error && session) {
        window.location.href = 'panel.html';
        return null;
    }
    
    return true;
}
