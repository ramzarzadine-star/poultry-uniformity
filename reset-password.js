// reset-password.js
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reset-password-form');
    const messageDiv = document.getElementById('message');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    // بررسی وجود توکن در URL (هم در hash و هم در query string)
    let accessToken = null;
    let refreshToken = null;
    
    // بررسی در hash (#)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    accessToken = hashParams.get('access_token');
    refreshToken = hashParams.get('refresh_token');
    
    // اگر در hash نبود، در query string (?) بررسی کن
    if (!accessToken) {
        const urlParams = new URLSearchParams(window.location.search);
        accessToken = urlParams.get('access_token');
        refreshToken = urlParams.get('refresh_token');
    }
    
    // تنظیم جلسه با توکن دریافتی
    if (accessToken) {
        supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        }).then(({ data, error }) => {
            if (error) {
                showMessage('لینک بازیابی معتبر نیست یا منقضی شده است. لطفاً دوباره درخواست دهید.', 'error');
                console.error('خطای تنظیم جلسه:', error);
                disableForm(true);
            } else {
                showMessage('لینک تأیید شد. لطفاً رمز عبور جدید خود را وارد کنید.', 'success');
                disableForm(false);
            }
        });
    } else {
        showMessage('لینک بازیابی نامعتبر است. دوباره درخواست دهید.', 'error');
        disableForm(true);
    }
    
    // ثبت رمز جدید
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // اعتبارسنجی رمز عبور
        if (newPassword.length < 6) {
            showMessage('رمز عبور باید حداقل ۶ کاراکتر باشد.', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage('رمز عبور با تکرار آن مطابقت ندارد.', 'error');
            return;
        }
        
        try {
            // به‌روزرسانی رمز عبور
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });
            
            if (error) {
                showMessage('خطا در تغییر رمز: ' + error.message, 'error');
                console.error('خطای به‌روزرسانی:', error);
            } else {
                showMessage('✅ رمز عبور با موفقیت تغییر کرد! در حال انتقال به صفحه ورود...', 'success');
                disableForm(true);
                
                // انتقال خودکار به صفحه ورود بعد از ۳ ثانیه
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            }
        } catch (error) {
            showMessage('خطای غیرمنتظره: ' + error.message, 'error');
        }
    });
    
    // توابع کمکی
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = 'message ' + type;
        messageDiv.style.display = 'block';
    }
    
    function disableForm(disabled) {
        newPasswordInput.disabled = disabled;
        confirmPasswordInput.disabled = disabled;
        submitBtn.disabled = disabled;
    }
});
