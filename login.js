'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
LOGIN / REGISTER / PASSWORD RECOVERY REQUEST
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


  const magicLinkBtn =
    $('magicLinkBtn');


  const forgotBtn =
    $('forgotBtn');


  /*
  =======================================================
  بررسی Client
  =======================================================
  */

  if (!supabase) {

    console.error(
      'Supabase client not found.'
    );

    if (messageEl) {

      messageEl.textContent =
        'اتصال به سامانه احراز هویت برقرار نشد.';

      messageEl.className =
        'login-message error';

    }

    return;

  }


  /*
  =======================================================
  MESSAGE
  =======================================================
  */

  function showMessage(
    text = '',
    type = 'error'
  ) {

    if (!messageEl) {
      return;
    }


    messageEl.textContent =
      text;


    messageEl.className =
      text
        ? `login-message ${type}`
        : 'login-message';

  }


  /*
  =======================================================
  LOADING
  =======================================================
  */

  function setBusy(
    value
  ) {

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


    if (loading) {

      loading.hidden =
        !value;

    }

  }


  /*
  =======================================================
  SWITCH LOGIN / REGISTER
  =======================================================
  */

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


  /*
  =======================================================
  LOGIN
  =======================================================
  */

  async function login(
    event
  ) {

    event.preventDefault();


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


    try {

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

        console.error(
          'LOGIN ERROR:',
          error
        );


        setBusy(false);


        if (
          error.code ===
          'email_not_confirmed'
        ) {

          showMessage(
            'ایمیل حساب شما هنوز تأیید نشده است.'
          );

          return;

        }


        if (
          error.code ===
          'invalid_credentials'
        ) {

          showMessage(
            'ایمیل یا رمز عبور اشتباه است.'
          );

          return;

        }


        showMessage(
          error.message ||
          'ورود انجام نشد.'
        );


        return;

      }


      if (!data?.user) {

        setBusy(false);


        showMessage(
          'کاربر معتبر دریافت نشد.'
        );


        return;

      }


      /*
      ورود موفق
      */

      window.location.replace(
        'index.html'
      );

    }

    catch (error) {

      console.error(
        'LOGIN EXCEPTION:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'خطایی هنگام ورود رخ داد.'
      );

    }

  }


  /*
  =======================================================
  REGISTER
  =======================================================
  */

  async function register(
    event
  ) {

    event.preventDefault();


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
      password !==
      confirm
    ) {

      showMessage(
        'تکرار رمز عبور با رمز اصلی یکسان نیست.'
      );

      return;

    }


    setBusy(true);


    try {

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

        console.error(
          'REGISTER ERROR:',
          error
        );


        setBusy(false);


        showMessage(
          error.message ||
          'ثبت‌نام انجام نشد.'
        );


        return;

      }


      /*
      اگر Session ساخته شد
      */

      if (data?.session) {

        await supabase.auth
          .signOut();

      }


      setBusy(false);


      showMessage(
        'ثبت‌نام انجام شد. ایمیل تأیید را بررسی کنید.',
        'success'
      );


      switchMode(
        'login'
      );

    }

    catch (error) {

      console.error(
        'REGISTER EXCEPTION:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'خطایی هنگام ثبت‌نام رخ داد.'
      );

    }

  }


  /*
  =======================================================
  MAGIC LINK
  =======================================================
  */

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


    try {

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

        console.error(
          'MAGIC LINK ERROR:',
          error
        );


        showMessage(
          error.message ||
          'ارسال لینک ورود انجام نشد.'
        );


        return;

      }


      showMessage(
        'لینک ورود به ایمیل شما ارسال شد.',
        'success'
      );

    }

    catch (error) {

      console.error(
        error
      );


      setBusy(false);


      showMessage(
        'خطایی هنگام ارسال لینک ورود رخ داد.'
      );

    }

  }


  /*
  =======================================================
  FORGOT PASSWORD
  =======================================================
  */

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


    try {

      /*
      =====================================================
      خیلی مهم:

      قبلاً اینجا login.html بود.
      باید reset-password.html باشد.
      =====================================================
      */

      const redirectTo =
        new URL(
          'reset-password.html',
          window.location.href
        ).href;


      console.log(
        'PASSWORD RESET REDIRECT:',
        redirectTo
      );


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

        console.error(
          'PASSWORD RESET ERROR:',
          error
        );


        showMessage(
          error.message ||
          'ارسال لینک بازیابی انجام نشد.'
        );


        return;

      }


      showMessage(
        'لینک بازیابی رمز عبور ارسال شد. ایمیل خود را بررسی کنید.',
        'success'
      );

    }

    catch (error) {

      console.error(
        'PASSWORD RESET EXCEPTION:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'خطایی هنگام ارسال لینک بازیابی رخ داد.'
      );

    }

  }


  /*
  =======================================================
  BOOT
  =======================================================
  */

  async function boot() {

    /*
    =====================================================
    مهم:

    اگر صفحه login.html بدون Recovery Token باز شده،
    همیشه Login را نشان بده.
    =====================================================
    */

    switchMode(
      'login'
    );


    /*
    اگر URL مربوط به Recovery است،
    این صفحه نباید صفحه ورود را به Reset تبدیل کند.
    */

    const hash =
      window.location.hash || '';


    const search =
      window.location.search || '';


    const isRecoveryUrl =
      hash.includes(
        'access_token='
      ) ||
      hash.includes(
        'type=recovery'
      ) ||
      search.includes(
        'code='
      );


    if (isRecoveryUrl) {

      /*
      اگر کسی با لینک Recovery قدیمی
      وارد login.html شده، او را به صفحه
      reset-password.html بفرست.
      */

      window.location.replace(
        'reset-password.html' +
        search +
        hash
      );


      return;

    }


    /*
    =====================================================
    Session عادی
    =====================================================
    */

    try {

      const {
        data,
        error
      } =
        await supabase.auth
          .getSession();


      if (error) {

        console.error(
          'GET SESSION ERROR:',
          error
        );


        return;

      }


      /*
      اگر کاربر قبلاً Login کرده
      */

      if (
        data?.session?.user
      ) {

        window.location.replace(
          'index.html'
        );


        return;

      }


      /*
      پیام بعد از تغییر رمز
      */

      const message =
        new URLSearchParams(
          window.location.search
        ).get(
          'message'
        );


      if (message) {

        showMessage(
          message,
          'success'
        );

      }

    }

    catch (error) {

      console.error(
        'BOOT ERROR:',
        error
      );

    }

  }


  /*
  =======================================================
  EVENTS
  =======================================================
  */

  loginModeBtn
    .addEventListener(
      'click',
      () =>
        switchMode(
          'login'
        )
    );


  registerModeBtn
    .addEventListener(
      'click',
      () =>
        switchMode(
          'register'
        )
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


  magicLinkBtn
    .addEventListener(
      'click',
      magicLink
    );


  forgotBtn
    .addEventListener(
      'click',
      resetPassword
    );


  /*
  =======================================================
  شروع
  =======================================================
  */

  boot();

})();
