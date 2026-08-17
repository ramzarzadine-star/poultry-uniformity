// auth.js
import { supabase } from './supabase.js';

// ثبت نام کاربر جدید
export async function signUp(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطا در ثبت نام:', error);
        return { success: false, error: error.message };
    }
}

// ورود کاربر
export async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطا در ورود:', error);
        return { success: false, error: error.message };
    }
}

// خروج کاربر
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('خطا در خروج:', error);
        return { success: false, error: error.message };
    }
}

// ارسال لینک بازیابی رمز عبور
export async function resetPassword(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('خطا در ارسال لینک بازیابی:', error);
        return { success: false, error: error.message };
    }
}

// دریافت جلسه فعلی
export async function getSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return { success: true, session };
    } catch (error) {
        console.error('خطا در دریافت جلسه:', error);
        return { success: false, error: error.message };
    }
}

// دریافت کاربر فعلی
export async function getUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return { success: true, user };
    } catch (error) {
        console.error('خطا در دریافت کاربر:', error);
        return { success: false, error: error.message };
    }
}
