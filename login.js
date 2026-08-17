'use strict';

/*
  =========================================================
  مرکز تخصصی سلامت طیور آدینه
  LOGIN.JS — Authentication / Login
  Stable Integrated Version
  =========================================================

  هماهنگ با:
    login.html
    supabase.js
    auth.js
    index.html

  امکانات:
    - ورود با Email + Password
    - ورود با Magic Link
    - ثبت نام
    - بازیابی رمز عبور
    - پردازش Callback لینک ایمیل
    - جلوگیری از Redirect Loop
    - نمایش خطای واقعی Supabase
    - پشتیبانی از Session موجود
    - جلوگیری از چند بار ارسال درخواست
*/


(function () {

  'use strict';


  /* =======================================================
     SUPABASE CLIENT
  ======================================================= */

  const supabase =
    window.adinehSupabase ||
    window.supabaseClient ||
    null;


  /* =======================================================
     DOM HELPER
  ======================================================= */

  const $ = id =>
    document.getElementById(id);


  /* =======================================================
     DOM ELEMENTS
  ======================================================= */

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


  /* =======================================================
     STATE
  ======================================================= */

  let redirecting = false;

  let bootFinished = false;

  let authListenerReady = false;


  /* =======================================================
     MESSAGE
  ======================================================= */

  function showMessage(
    text = '',
    type = 'error'
  ) {

    if (!messageEl) {

      console.warn(
        'Login message element not found.'
      );

      return;

    }


    messageEl.textContent =
      String(text || '');


    messageEl.className =
      text
        ? `login-message ${type}`
        : 'login-message';

  }


  /* =======================================================
     BUSY
  ======================================================= */

  function setBusy(
    busy
  ) {

    document
      .querySelectorAll(
        'button'
      )
      .forEach(
        button => {

          button.disabled =
            Boolean(busy);

        }
      );


    if (loading) {

      loading.hidden =
        !busy;

    }

  }


  /* =======================================================
     REDIRECT URL
  ======================================================= */

  function getLoginRedirectUrl() {

    /*
      همیشه login.html فعلی را به صورت
      absolute URL به Supabase می‌دهیم.
    */

    return new URL(
      'login.html',
      window.location.href
    ).href;

  }


  /* =======================================================
     APP REDIRECT
  ======================================================= */

  function openApp() {

    if (redirecting) {
      return;
    }


    redirecting = true;


    setBusy(true);


    /*
      Session باید توسط Supabase ذخیره شده باشد.
      مقدار خیلی کوتاه تأخیر برای جلوگیری از
      Race Condition بین Auth Event و Navigation.
    */

    window.setTimeout(
      function () {

        window.location.replace(
          'index.html'
        );

      },
      300
    );

  }


  /* =======================================================
     SWITCH LOGIN / REGISTER
  ======================================================= */

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


  /* =======================================================
     PASSWORD LOGIN
  ======================================================= */

  async function login(
    event
  ) {

    if (event) {
      event.preventDefault();
    }


    if (redirecting) {
      return;
    }


    showMessage('');


    const email =
      $('loginEmail')
        ?.value
        ?.trim()
        ?.toLowerCase() ||
      '';


    const password =
      $('loginPassword')
        ?.value ||
      '';


    if (!email) {

      showMessage(
        'ایمیل را وارد کنید.'
      );

      return;

    }


    if (!password) {

      showMessage(
        'رمز عبور را وارد کنید.'
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

      const response =
        await supabase.auth
          .signInWithPassword({

            email,

            password

          });


      const data =
        response?.data;

      const error =
        response?.error;


      if (error) {

        console.error(
          'Password login error:',
          error
        );


        setBusy(false);


        showMessage(
          error.message ||
          'ورود انجام نشد. ایمیل یا رمز عبور را بررسی کنید.'
        );


        return;

      }


      if (
        !data?.user
      ) {

        setBusy(false);


        showMessage(
          'کاربر معتبر دریافت نشد.'
        );


        return;

      }


      console.log(
        'Password login successful:',
        data.user.id
      );


      /*
        Session توسط Supabase ایجاد شده است.
      */

      openApp();

    }

    catch (error) {

      console.error(
        'Password login exception:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'خطایی هنگام ورود رخ داد.'
      );

    }

  }


  /* =======================================================
     REGISTER
  ======================================================= */

  async function register(
    event
  ) {

    if (event) {
      event.preventDefault();
    }


    if (redirecting) {
      return;
    }


    showMessage('');


    const firstName =
      $('firstName')
        ?.value
        ?.trim() ||
      '';


    const lastName =
      $('lastName')
        ?.value
        ?.trim() ||
      '';


    const phone =
      $('registerPhone')
        ?.value
        ?.trim() ||
      '';


    const email =
      $('registerEmail')
        ?.value
        ?.trim()
        ?.toLowerCase() ||
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


      const response =
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


      const data =
        response?.data;

      const error =
        response?.error;


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


      /*
        اگر Supabase Session ایجاد کرده باشد،
        برای جلوگیری از ورود خودکار حساب جدید
        خارج می‌شویم.
      */

      if (data?.session) {

        try {

          await supabase.auth.signOut();

        }

        catch (signOutError) {

          console.error(
            'Registration signOut error:',
            signOutError
          );

        }

      }


      setBusy(false);


      showMessage(
        'ثبت‌نام انجام شد. حساب شما در انتظار تأیید مالک سامانه است.',
        'success'
      );


      switchMode(
        'login'
      );

    }

    catch (error) {

      console.error(
        'Registration exception:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'خطایی هنگام ثبت‌نام رخ داد.'
      );

    }

  }


  /* =======================================================
     MAGIC LINK
  ======================================================= */

  async function magicLink() {

    if (redirecting) {
      return;
    }


    showMessage('');


    const email =
      $('loginEmail')
        ?.value
        ?.trim()
        ?.toLowerCase() ||
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
        'Magic Link redirect URL:',
        redirectTo
      );


      const response =
        await supabase.auth
          .signInWithOtp({

            email,

            options: {

              shouldCreateUser:
                false,

              emailRedirectTo:
                redirectTo

            }

          });


      const data =
        response?.data;

      const error =
        response?.error;


      setBusy(false);


      if (error) {

        console.error(
          'Magic Link error:',
          error
        );


        showMessage(
          `ارسال لینک ورود انجام نشد: ${
            error.message ||
            'خطای نامشخص'
          }`
        );


        return;

      }


      console.log(
        'Magic Link request successful:',
        data
      );


      showMessage(
        'لینک ورود به ایمیل شما ارسال شد. ایمیل را باز کنید و روی لینک ورود بزنید.',
        'success'
      );

    }

    catch (error) {

      console.error(
        'Magic Link exception:',
        error
      );


      setBusy(false);


      showMessage(
        `خطا هنگام ارسال لینک ورود: ${
          error?.message ||
          'خطای نامشخص'
        }`
      );

    }

  }


  /* =======================================================
     PASSWORD RESET
  ======================================================= */

  async function resetPassword() {

    if (redirecting) {
      return;
    }


    showMessage('');


    const email =
      $('loginEmail')
        ?.value
        ?.trim()
        ?.toLowerCase() ||
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


      const response =
        await supabase.auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo
            }
          );


      const data =
        response?.data;

      const error =
        response?.error;


      setBusy(false);


      if (error) {

        console.error(
          'Password reset error:',
          error
        );


        showMessage(
          `ارسال لینک بازیابی انجام نشد: ${
            error.message ||
            'خطای نامشخص'
          }`
        );


        return;

      }


      console.log(
        'Password reset successful:',
        data
      );


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
        `خطا هنگام ارسال لینک بازیابی: ${
          error?.message ||
          'خطای نامشخص'
        }`
      );

    }

  }


  /* =======================================================
     URL ERROR
  ======================================================= */

  function checkUrlError() {

    const search =
      new URLSearchParams(
        window.location.search
      );


    const hash =
      new URLSearchParams(
        window.location.hash
          .replace(
            /^#/,
            ''
          )
      );


    const error =
      search.get('error') ||
      hash.get('error');


    const errorDescription =
      search.get(
        'error_description'
      ) ||
      hash.get(
        'error_description'
      );


    const errorCode =
      search.get(
        'error_code'
      ) ||
      hash.get(
        'error_code'
      );


    if (
      error ||
      errorDescription
    ) {

      console.error(
        'Supabase URL authentication error:',
        {
          error,
          errorCode,
          errorDescription
        }
      );


      showMessage(
        errorDescription ||
        error ||
        'احراز هویت ناموفق بود.'
      );


      return true;

    }


    return false;

  }


  /* =======================================================
     CALLBACK DETECTION
  ======================================================= */

  function hasAuthCallback() {

    const search =
      new URLSearchParams(
        window.location.search
      );


    const hash =
      new URLSearchParams(
        window.location.hash
          .replace(
            /^#/,
            ''
          )
      );


    return (

      search.has('code') ||

      hash.has('access_token') ||

      hash.has('refresh_token') ||

      hash.has('type')

    );

  }


  /* =======================================================
     GET SESSION
  ======================================================= */

  async function getSession() {

    if (!supabase) {
      return null;
    }


    try {

      const response =
        await supabase.auth
          .getSession();


      if (response?.error) {

        console.error(
          'getSession error:',
          response.error
        );


        return null;

      }


      return (
        response?.data?.session ||
        null
      );

    }

    catch (error) {

      console.error(
        'getSession exception:',
        error
      );


      return null;

    }

  }


  /* =======================================================
     WAIT FOR SESSION
  ======================================================= */

  async function waitForSession(
    timeoutMs = 8000
  ) {

    const start =
      Date.now();


    while (
      Date.now() -
      start <
      timeoutMs
    ) {

      const session =
        await getSession();


      if (
        session?.user
      ) {

        return session;

      }


      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            250
          )
      );

    }


    return null;

  }


  /* =======================================================
     AUTH STATE LISTENER
  ======================================================= */

  function listenForAuthChanges() {

    if (
      !supabase ||
      authListenerReady
    ) {

      return;

    }


    authListenerReady = true;


    try {

      supabase.auth
        .onAuthStateChange(
          (
            event,
            session
          ) => {

            console.log(
              'Supabase auth event:',
              event,
              session?.user?.id ||
              null
            );


            /*
              فقط Session واقعی.
            */

            if (
              event === 'SIGNED_IN' &&
              session?.user
            ) {

              openApp();

              return;

            }


            /*
              اگر callback از ایمیل
              با INITIAL_SESSION رسید.
            */

            if (
              event === 'INITIAL_SESSION' &&
              session?.user &&
              hasAuthCallback()
            ) {

              openApp();

              return;

            }


            /*
              TOKEN_REFRESHED نیازی به
              انتقال صفحه ندارد.
            */

          }
        );

    }

    catch (error) {

      console.error(
        'Auth listener error:',
        error
      );

    }

  }


  /* =======================================================
     BOOT
  ======================================================= */

  async function boot() {

    if (bootFinished) {
      return;
    }


    bootFinished = true;


    if (!supabase) {

      setBusy(false);


      showMessage(
        'سامانه احراز هویت بارگذاری نشده است.'
      );


      return;

    }


    try {

      /*
        Listener باید قبل از بررسی Session
        فعال باشد.
      */

      listenForAuthChanges();


      /*
        ---------------------------------------------------
        1. خطای URL
        ---------------------------------------------------
      */

      if (
        checkUrlError()
      ) {

        setBusy(false);

        return;

      }


      /*
        ---------------------------------------------------
        2. بررسی callback
        ---------------------------------------------------
      */

      if (
        hasAuthCallback()
      ) {

        console.log(
          'Authentication callback detected.'
        );


        setBusy(true);


        const callbackSession =
          await waitForSession(
            8000
          );


        if (
          callbackSession?.user
        ) {

          console.log(
            'Authentication callback session established:',
            callbackSession.user.id
          );


          openApp();

          return;

        }


        setBusy(false);


        showMessage(
          'لینک دریافت شد، اما نشست کاربری ایجاد نشد. لطفاً لینک را دوباره باز کنید یا یک لینک جدید درخواست کنید.'
        );


        return;

      }


      /*
        ---------------------------------------------------
        3. Session قبلی
        ---------------------------------------------------
      */

      const existingSession =
        await getSession();


      if (
        existingSession?.user
      ) {

        console.log(
          'Existing session found:',
          existingSession.user.id
        );


        openApp();

        return;

      }


      /*
        ---------------------------------------------------
        4. پیام ارسال‌شده توسط Guard
        ---------------------------------------------------
      */

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


      setBusy(false);

    }

    catch (error) {

      console.error(
        'Authentication boot error:',
        error
      );


      setBusy(false);


      showMessage(
        `بررسی وضعیت ورود با خطا مواجه شد: ${
          error?.message ||
          'خطای نامشخص'
        }`
      );

    }

  }


  /* =======================================================
     INITIALIZATION
  ======================================================= */

  if (loginModeBtn) {

    loginModeBtn.addEventListener(
      'click',
      function () {

        switchMode(
          'login'
        );

      }
    );

  }


  if (registerModeBtn) {

    registerModeBtn.addEventListener(
      'click',
      function () {

        switchMode(
          'register'
        );

      }
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


  /*
    حالت اولیه
  */

  switchMode(
    'login'
  );


  /*
    شروع احراز هویت
  */

  boot();


})();
