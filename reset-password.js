// reset-password.js - مطابق با ساختار شما
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reset-password-form');
    const messageDiv = document.getElementById('message');
    
    // بررسی وجود توکن در URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    // اگر توکن در hash نبود، در query string جستجو کن
    let finalAccessToken = accessToken;
    let finalRefreshToken = refreshToken;
    
    if (!accessToken) {
        const urlParams = new URLSearchParams(window.location.search);
        finalAccessToken = urlParams.get('access_token');
        finalRefreshToken = urlParams.get('refresh_token');
    }
    
    // تنظیم جلسه با توکن دریافتی
    if (finalAccessToken) {
        supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken
        }).then(({ data, error }) => {
            if (error) {
                showMessage('لینک بازیابی معتبر نیست یا منقضی شده است.', 'error');
                console.error('خطای تنظیم جلسه:', error);
            } else {
                showMessage('لینک تأیید شد. رمز جدید را وارد کنید.', 'success');
                document.getElementById('new-password').disabled = false;
                document.getElementById('confirm-password').disabled = false;
                document.querySelector('button[type="submit"]').disabled = false;
            }
        });
    } else {
        showMessage('لینک بازیابی نامعتبر است. دوباره درخواست دهید.', 'error');
    }
    
    // ثبت رمز جدید
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (newPassword.length < 6) {
            showMessage('رمز عبور باید حداقل ۶ کاراکتر باشد.', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage('رمز عبور با تکرار آن مطابقت ندارد.', 'error');
            return;
        }
        
        try {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });
            
            if (error) {
                showMessage('خطا در تغییر رمز: ' + error.message, 'error');
            } else {
                showMessage('رمز عبور با موفقیت تغییر کرد! به صفحه ورود بروید.', 'success');
                form.reset();
                document.querySelector('button[type="submit"]').disabled = true;
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            }
        } catch (error) {
            showMessage('خطای غیرمنتظره: ' + error.message, 'error');
        }
    });
});

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';
}
