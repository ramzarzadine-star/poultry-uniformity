'use strict';

/*
  =========================================================
  ADINEH POULTRY
  Supabase Authentication
  =========================================================
*/

(function () {

  const supabase =
    window.adinehSupabase;


  const $ =
    id =>
      document.getElementById(id);


  const loginForm =
    $('loginForm');

  const registerForm =
    $('registerForm');

  const messageEl =
    $('message');

  const modeTitle =
    $('modeTitle');

  const modeText =
    $('modeText');

  const loginModeBtn =
    $('loginModeBtn');

  const registerModeBtn =
    $('registerModeBtn');

  const loading =
    $('loading');


  function showMessage(
    text,
    type = 'error'
  ) {

    messageEl.textContent =
      text || '';

    messageEl.className =
      text
        ? `login-message ${type}`
        : 'login-message';

  }


  function setBusy(value) {

    document
      .querySelectorAll(
        'button'
      )
      .forEach(
        button => {

          button.disabled =
            value;

        }
      );


    loading.hidden =
      !value;

  }


  function switchMode(
    mode
  ) {

    const register =
      mode === 'register';


    loginForm.hidden =
      register;

    registerForm.hidden =
      !register;


    loginModeBtn
      .classList
      .toggle(
        'active',
        !register
      );


    registerModeBtn
      .classList
      .toggle(
        'active',
        register
      );


    modeTitle.textContent =
      register
        ? 'ایجاد حساب کاربری'
        : 'ورود امن به سامانه';


    modeText.textContent =
      register

        ? 'پس از ثبت‌نام، فعال‌سازی حساب توسط مالک سامانه انجام می‌شود.'

        : 'برای ورود از ایمیل و رمز عبور حساب خود استفاده کنید.';


    showMessage('');

  }


  async function login(
    event
  ) {

    event?.preventDefault();


    showMessage('');


    const email =
      $('loginEmail')
        .value
        .trim()
        .toLowerCase();


    const password =
      $('loginPassword')
        .value;


    if (
      !email ||
      !password
    ) {

      showMessage(
        'ایمیل و رمز عبور را کامل وارد کنید.'
      );

      return;
    }


    setBusy(true);


    const {
      data,
      error
    } =
      await supabase.auth
        .signInWithPassword({
          email,
          password
        });


    if (error) {

      setBusy(false);

      showMessage(
        'ورود انجام نشد. ایمیل یا رمز عبور را بررسی کنید.'
      );

      console.error(error);

      return;
    }


    if (!data?.user) {

      setBusy(false);

      showMessage(
        'کاربر معتبر دریافت نشد.'
      );

      return;
    }


    window.location.replace(
      'index.html'
    );

  }


  async function register(
    event
  ) {

    event?.preventDefault();


    showMessage('');


    const firstName =
      $('firstName')
        .value
        .trim();


    const lastName =
      $('lastName')
        .value
        .trim();


    const phone =
      $('registerPhone')
        .value
        .trim();


    const email =
      $('registerEmail')
        .value
        .trim()
        .toLowerCase();


    const password =
      $('registerPassword')
        .value;


    const confirm =
      $('registerPasswordConfirm')
        .value;


    if (
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {

      showMessage(
        'نام، نام خانوادگی، ایمیل و رمز عبور الزامی است.'
      );

      return;
    }


    if (
      password.length < 8
    ) {

      showMessage(
        'رمز عبور باید حداقل ۸ کاراکتر باشد.'
      );

      return;
    }


    if (
      password !== confirm
    ) {

      showMessage(
        'تکرار رمز عبور با رمز اصلی یکسان نیست.'
      );

      return;
    }


    setBusy(true);


    const redirectTo =
      new URL(
        'login.html',
        window.location.href
      ).href;


    const {
      data,
      error
    } =
      await supabase.auth
        .signUp({

          email,

          password,

          options: {

            emailRedirectTo:
              redirectTo,

            data: {

              first_name:
                firstName,

              last_name:
                lastName,

              phone

            }

          }

        });


    if (error) {

      setBusy(false);

      showMessage(
        'ثبت‌نام انجام نشد. اطلاعات را بررسی کنید.'
      );

      console.error(error);

      return;
    }


    /*
      اگر Supabase بدون
      تأیید ایمیل Session ساخته باشد
    */

    if (data?.session) {

      await supabase.auth
        .signOut();


      setBusy(false);


      showMessage(
        'ثبت‌نام انجام شد. حساب شما در انتظار تأیید مالک سامانه است.',
        'success'
      );


      switchMode(
        'login'
      );


      return;
    }


    setBusy(false);


    showMessage(
      'ثبت‌نام انجام شد. ایمیل تأیید را بررسی کنید؛ پس از تأیید، حساب برای فعال‌سازی به مالک سامانه ارسال می‌شود.',
      'success'
    );


    switchMode(
      'login'
    );

  }


  async function magicLink() {

    const email =
      $('loginEmail')
        .value
        .trim()
        .toLowerCase();


    if (!email) {

      showMessage(
        'ابتدا ایمیل خود را وارد کنید.'
      );

      return;
    }


    setBusy(true);


    const redirectTo =
      new URL(
        'login.html',
        window.location.href
      ).href;


    const {
      error
    } =
      await supabase.auth
        .signInWithOtp({

          email,

          options: {
            emailRedirectTo:
              redirectTo
          }

        });


    setBusy(false);


    if (error) {

      showMessage(
        'ارسال لینک ورود انجام نشد.'
      );

      console.error(error);

      return;
    }


    showMessage(
      'لینک ورود به ایمیل شما ارسال شد.',
      'success'
    );

  }


  async function resetPassword() {

    const email =
      $('loginEmail')
        .value
        .trim()
        .toLowerCase();


    if (!email) {

      showMessage(
        'ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود.'
      );

      return;
    }


    setBusy(true);


    const redirectTo =
      new URL(
        'login.html',
        window.location.href
      ).href;


    const {
      error
    } =
      await supabase.auth
        .resetPasswordForEmail(
          email,
          {
            redirectTo
          }
        );


    setBusy(false);


    if (error) {

      showMessage(
        'ارسال لینک بازیابی انجام نشد.'
      );

      console.error(error);

      return;
    }


    showMessage(
      'لینک بازیابی رمز عبور ارسال شد.',
      'success'
    );

  }


  async function boot() {

    if (!supabase) {

      showMessage(
        'سامانه احراز هویت بارگذاری نشده است.'
      );

      return;
    }


    const {
      data: {
        user
      }
    } =
      await supabase.auth
        .getUser();


    /*
      اگر قبلاً وارد شده،
      صفحه ورود را دوباره نشان نده.
    */

    if (user) {

      window.location.replace(
        'index.html'
      );

      return;
    }


    const message =
      new URLSearchParams(
        window.location.search
      ).get(
        'message'
      );


    if (message) {

      showMessage(
        message
      );

    }

  }


  loginModeBtn
    .addEventListener(
      'click',
      () =>
        switchMode('login')
    );


  registerModeBtn
    .addEventListener(
      'click',
      () =>
        switchMode('register')
    );


  loginForm
    .addEventListener(
      'submit',
      login
    );


  registerForm
    .addEventListener(
      'submit',
      register
    );


  $('magicLinkBtn')
    .addEventListener(
      'click',
      magicLink
    );


  $('forgotBtn')
    .addEventListener(
      'click',
      resetPassword
    );


  switchMode(
    'login'
  );


  boot();

})();
