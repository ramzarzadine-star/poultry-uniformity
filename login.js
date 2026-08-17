'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
Login / Register / Magic Link
Stable Authentication
=========================================================
*/

(function () {

  const supabase =
    window.supabaseClient ||
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


  let redirecting =
    false;


  /*
  ========================================================
  MESSAGE
  ========================================================
  */

  function showMessage(
    text,
    type = 'error'
  ) {

    if (!messageEl)
      return;


    messageEl.textContent =
      text || '';


    messageEl.className =
      text
        ? `login-message ${type}`
        : 'login-message';

  }


  /*
  ========================================================
  BUSY
  ========================================================
  */

  function setBusy(
    value
  ) {

    document
      .querySelectorAll('button')
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
  ========================================================
  REDIRECT
  ========================================================
  */

  function openApp() {

    if (redirecting)
      return;


    redirecting =
      true;


    setBusy(true);


    window.location.replace(
      'index.html'
    );

  }


  /*
  ========================================================
  REDIRECT URL
  ========================================================
  */

  function getLoginRedirectUrl() {

    const url =
      new URL(
        'login.html',
        window.location.href
      );


    /*
      فقط origin و pathname مهم هستند.
      query و hash قبلی حذف می‌شوند.
    */

    url.search = '';

    url.hash = '';


    return url.href;

  }


  /*
  ========================================================
  SWITCH MODE
  ========================================================
  */

  function switchMode(
    mode
  ) {

    const register =
      mode === 'register';


    if (loginForm) {

      loginForm.hidden =
        register;

    }


    if (registerForm) {

      registerForm.hidden =
        !register;

    }


    if (loginModeBtn) {

      loginModeBtn.classList.toggle(
        'active',
        !register
      );

    }


    if (registerModeBtn) {

      registerModeBtn.classList.toggle(
        'active',
        register
      );

    }


    if (modeTitle) {

      modeTitle.textContent =
        register
          ? 'ایجاد حساب کاربری'
          : 'ورود امن به سامانه';

    }


    if (modeText) {

      modeText.textContent =
        register
          ? 'پس از ثبت‌نام، فعال‌سازی حساب توسط مالک سامانه انجام می‌شود.'
          : 'برای ورود از ایمیل و رمز عبور حساب خود استفاده کنید.';

    }


    showMessage('');

  }


  /*
  ========================================================
  PASSWORD LOGIN
  ========================================================
  */

  async function login(
    event
  ) {

    event?.preventDefault();


    showMessage('');


    const email =
      $('loginEmail')
        ?.value
        .trim()
        .toLowerCase() ||
      '';


    const password =
      $('loginPassword')
        ?.value ||
      '';


    if (!email || !password) {

      showMessage(
        'ایمیل و رمز عبور را کامل وارد کنید.'
      );

      return;

    }


    if (!supabase) {

      showMessage(
        'ارتباط با سامانه احراز هویت برقرار نشده است.'
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
          'Password login error:',
          error
        );


        setBusy(false);


        showMessage(
          'ورود انجام نشد. ایمیل یا رمز عبور را بررسی کنید.'
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


      openApp();

    }

    catch (error) {

      console.error(
        'Password login exception:',
        error
      );


      setBusy(false);


      showMessage(
        'خطایی هنگام ورود رخ داد.'
      );

    }

  }


  /*
  ========================================================
  REGISTER
  ========================================================
  */

  async function register(
    event
  ) {

    event?.preventDefault();


    showMessage('');


    const firstName =
      $('firstName')
        ?.value
        .trim() ||
      '';


    const lastName =
      $('lastName')
        ?.value
        .trim() ||
      '';


    const phone =
      $('registerPhone')
        ?.value
        .trim() ||
      '';


    const email =
      $('registerEmail')
        ?.value
        .trim()
        .toLowerCase() ||
      '';


    const password =
      $('registerPassword')
        ?.value ||
      '';


    const confirm =
      $('registerPasswordConfirm')
        ?.value ||
      '';


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


    if (password.length < 8) {

      showMessage(
        'رمز عبور باید حداقل ۸ کاراکتر باشد.'
      );

      return;

    }


    if (password !== confirm) {

      showMessage(
        'تکرار رمز عبور با رمز اصلی یکسان نیست.'
      );

      return;

    }


    if (!supabase) {

      showMessage(
        'ارتباط با سامانه احراز هویت برقرار نشده است.'
      );

      return;

    }


    setBusy(true);


    try {

      const redirectTo =
        getLoginRedirectUrl();


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
          'Registration error:',
          error
        );


        setBusy(false);


        showMessage(
          error.message ||
          'ثبت‌نام انجام نشد.'
        );


        return;

      }


      if (data?.session) {

        try {

          await supabase.auth
            .signOut();

        }

        catch (signOutError) {

          console.error(
            'Registration signOut:',
            signOutError
          );

        }


        setBusy(false);


        switchMode(
          'login'
        );


        showMessage(
          'ثبت‌نام انجام شد. حساب شما در انتظار تأیید مالک سامانه است.',
          'success'
        );


        return;

      }


      setBusy(false);


      switchMode(
        'login'
      );


      showMessage(
        'ثبت‌نام انجام شد. ایمیل تأیید را بررسی کنید.',
        'success'
      );

    }

    catch (error) {

      console.error(
        'Registration exception:',
        error
      );


      setBusy(false);


      showMessage(
        'خطایی هنگام ثبت‌نام رخ داد.'
      );

    }

  }


  /*
  ========================================================
  MAGIC LINK
  ========================================================
  */

  async function magicLink() {

    const email =
      $('loginEmail')
        ?.value
        .trim()
        .toLowerCase() ||
      '';


    if (!email) {

      showMessage(
        'ابتدا ایمیل خود را وارد کنید.'
      );

      return;

    }


    if (!supabase) {

      showMessage(
        'ارتباط با سامانه احراز هویت برقرار نشده است.'
      );

      return;

    }


    setBusy(true);


    try {

      const redirectTo =
        getLoginRedirectUrl();


      console.log(
        'Magic Link redirect:',
        redirectTo
      );


      const {
        data,
        error
      } =
        await supabase.auth
          .signInWithOtp({

            email,

            options: {

              emailRedirectTo:
                redirectTo,

              shouldCreateUser:
                false

            }

          });


      if (error) {

        console.error(
          'Magic link error:',
          error
        );


        setBusy(false);


        showMessage(
          error.message ||
          'ارسال لینک ورود انجام نشد.'
        );


        return;

      }


      console.log(
        'Magic link response:',
        data
      );


      setBusy(false);


      showMessage(
        'لینک ورود به ایمیل شما ارسال شد. پس از بازکردن لینک، چند لحظه صبر کنید تا سامانه ورود را تکمیل کند.',
        'success'
      );

    }

    catch (error) {

      console.error(
        'Magic link exception:',
        error
      );


      setBusy(false);


      showMessage(
        'خطایی هنگام ارسال لینک ورود رخ داد.'
      );

    }

  }


  /*
  ========================================================
  PASSWORD RESET
  ========================================================
  */

  async function resetPassword() {

    const email =
      $('loginEmail')
        ?.value
        .trim()
        .toLowerCase() ||
      '';


    if (!email) {

      showMessage(
        'ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود.'
      );

      return;

    }


    if (!supabase) {

      showMessage(
        'ارتباط با سامانه احراز هویت برقرار نشده است.'
      );

      return;

    }


    setBusy(true);


    try {

      const redirectTo =
        getLoginRedirectUrl();


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


      if (error) {

        console.error(
          'Password reset error:',
          error
        );


        setBusy(false);


        showMessage(
          error.message ||
          'ارسال لینک بازیابی انجام نشد.'
        );


        return;

      }


      setBusy(false);


      showMessage(
        'لینک بازیابی رمز عبور ارسال شد.',
        'success'
      );

    }

    catch (error) {

      console.error(
        'Password reset exception:',
        error
      );


      setBusy(false);


      showMessage(
        'خطایی هنگام ارسال لینک بازیابی رخ داد.'
      );

    }

  }


  /*
  ========================================================
  AUTH STATE LISTENER
  ========================================================
  */

  function listenForAuthChanges() {

    if (!supabase)
      return;


    supabase.auth
      .onAuthStateChange(
        (
          event,
          session
        ) => {

          console.log(
            'Supabase auth event:',
            event
          );


          if (
            (
              event === 'SIGNED_IN' ||
              event === 'INITIAL_SESSION'
            ) &&
            session?.user
          ) {

            openApp();

          }

        }
      );

  }


  /*
  ========================================================
  CHECK SESSION
  ========================================================
  */

  async function checkExistingSession() {

    if (!supabase)
      return;


    try {

      const {
        data,
        error
      } =
        await supabase.auth
          .getSession();


      if (error) {

        console.error(
          'Initial session error:',
          error
        );

        return;

      }


      if (
        data?.session?.user
      ) {

        openApp();

      }

    }

    catch (error) {

      console.error(
        'Initial session exception:',
        error
      );

    }

  }


  /*
  ========================================================
  READ MESSAGE FROM URL
  ========================================================
  */

  function readUrlMessage() {

    try {

      const params =
        new URLSearchParams(
          window.location.search
        );


      const message =
        params.get(
          'message'
        );


      if (message) {

        showMessage(
          message
        );

      }

    }

    catch (error) {

      console.error(
        'URL message error:',
        error
      );

    }

  }


  /*
  ========================================================
  INITIALIZATION
  ========================================================
  */

  if (loginModeBtn) {

    loginModeBtn.addEventListener(
      'click',
      () =>
        switchMode('login')
    );

  }


  if (registerModeBtn) {

    registerModeBtn.addEventListener(
      'click',
      () =>
        switchMode('register')
    );

  }


  if (loginForm) {

    loginForm.addEventListener(
      'submit',
      login
    );

  }


  if (registerForm) {

    registerForm.addEventListener(
      'submit',
      register
    );

  }


  const magicButton =
    $('magicLinkBtn');


  if (magicButton) {

    magicButton.addEventListener(
      'click',
      magicLink
    );

  }


  const forgotButton =
    $('forgotBtn');


  if (forgotButton) {

    forgotButton.addEventListener(
      'click',
      resetPassword
    );

  }


  switchMode(
    'login'
  );


  /*
    Listener قبل از بررسی Session
  */

  listenForAuthChanges();


  readUrlMessage();


  /*
    بررسی Session موجود
  */

  checkExistingSession();

})();
