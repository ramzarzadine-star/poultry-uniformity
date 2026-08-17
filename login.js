// login.js
import { signIn, resetPassword } from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    
    // ورود کاربر
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value;
        const password = passwordInput.value;
        
        // اعتبارسنجی ساده
        if (!email || !password) {
            showMessage('لطفاً ایمیل و رمز عبور را وارد کنید.', 'error');
            return;
        }
        
        try {
            const result = await signIn(email, password);
            
            if (result.success) {
                showMessage('ورود موفق! در حال انتقال به پنل...', 'success');
                setTimeout(() => {
                    window.location.href = 'panel.html';
                }, 1500);
            } else {
                showMessage('خطا در ورود: ' + result.error, 'error');
            }
        } catch (error) {
            showMessage('خطای غیرمنتظره: ' + error.message, 'error');
        }
    });
    
    // فراموشی رمز عبور
    forgotPasswordBtn.addEventListener('click', async function() {
        const email = emailInput.value;
        
        if (!email) {
            showMessage('لطفاً ایمیل خود را برای دریافت لینک بازیابی وارد کنید.', 'error');
            return;
        }
        
        try {
            const result = await resetPassword(email);
            
            if (result.success) {
                showMessage('لینک بازیابی به ایمیل شما ارسال شد. صندوق خود را بررسی کنید.', 'success');
            } else {
                showMessage('خطا در ارسال لینک: ' + result.error, 'error');
            }
        } catch (error) {
            showMessage('خطای غیرمنتظره: ' + error.message, 'error');
        }
    });
    
    // نمایش پیام
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = 'message ' + type;
        messageDiv.style.display = 'block';
        
        // مخفی کردن خودکار پیام بعد از 5 ثانیه
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
});
