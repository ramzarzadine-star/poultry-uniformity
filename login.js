'use strict';

/*
  =========================================================
  ADINEH POULTRY
  Authentication / Login
  Stable Version
  =========================================================

  امکانات:
  - ورود با Email + Password
  - ورود با Magic Link
  - ثبت نام
  - بازیابی رمز عبور
  - پردازش صحیح callback لینک ایمیل
  - جلوگیری از redirect زودهنگام
  - نمایش خطای واقعی Supabase
  - هماهنگ با auth.js
  - هماهنگ با supabase.js
  =========================================================
*/

(function () {

  /*
    =======================================================
    SUPABASE
    =======================================================
  */

  const supabase =
    window.adinehSupabase ||
    window.supabaseClient ||
    null;


  /*
    =======================================================
    DOM HELPER
    =======================================================
  */

  const $ =
    id =>
      document.getElementById(id);


  /*
    =======================================================
    DOM ELEMENTS
    =======================================================
  */

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


  /*
    =======================================================
    STATE
    =======================================================
  */

  let redirecting =
    false;

  let bootFinished =
    false;


  /*
    =======================================================
    MESSAGE
    =======================================================
  */

  function showMessage(
    text,
    type = 'error'
  ) {

    if (!messageEl) {
      console.warn(
        'Login message element not found.'
      );

      return;
    }


    messageEl.textContent =
      text || '';


    messageEl.className =
      text
        ? `login-message ${type}`
        : 'login-message';

  }


  /*
    =======================================================
    BUSY
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
            Boolean(value);

        }
      );


    if (loading) {

      loading.hidden =
        !value;

    }

  }


  /*
    =======================================================
    GET LOGIN REDIRECT URL
    =======================================================
  */

  function getLoginRedirectUrl() {

    /*
      login.html در همان پوشه‌ای است که
      این فایل قرار دارد.

      URL مطلق ساخته می‌شود تا Supabase
      دقیقاً همان آدرس را دریافت کند.
    */

    return new URL(
      'login.html',
      window.location.href
    ).href;

  }


  /*
    =======================================================
    OPEN APP
    =======================================================
  */

  function openApp() {

    if (redirecting) {
      return;
    }


    redirecting =
      true;


    setBusy(true);


    /*
      کمی فرصت می‌دهیم Session در
      localStorage ثبت شود.
    */

    setTimeout(
      () => {

        window.location.replace(
          'index.html'
        );

      },
      200
    );

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


    if (loginForm) {

      loginForm.hidden =
        register;

    }


    if (registerForm) {

      registerForm.hidden =
        !register;

    }


    if (loginModeBtn) {

      loginModeBtn
        .classList
        .toggle(
          'active',
          !register
        );

    }


    if (registerModeBtn) {

      registerModeBtn
        .classList
        .toggle(
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
    =======================================================
    PASSWORD LOGIN
    =======================================================
  */

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
        .trim()
        .toLowerCase() ||
      '';


    const password =
      $('loginPassword')
        ?.value ||
      '';


    if (
      !email ||
      !password
    ) {

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
        Session توسط Supabase ذخیره شده است.
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


  /*
    =======================================================
    REGISTER
    =======================================================
  */

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


      console.log(
        'Registration redirect:',
        redirectTo
      );


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


      /*
        اگر Supabase Session ساخته باشد،
        چون حساب هنوز ممکن است نیاز به
        تأیید مالک داشته باشد، Logout می‌کنیم.
      */

      if (data?.session) {

        try {

          await supabase.auth
            .signOut();

        }

        catch (signOutError) {

          console.error(
            'Registration signOut error:',
            signOutError
          );

        }


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
        'ثبت‌نام انجام شد. ایمیل تأیید را بررسی کنید؛ سپس حساب برای فعال‌سازی به مالک سامانه ارسال می‌شود.',
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


  /*
    =======================================================
    MAGIC LINK
    =======================================================
  */

  async function magicLink() {

    if (redirecting) {
      return;
    }


    showMessage('');


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
        'Magic Link redirect URL:',
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

              /*
                برای ورود با لینک ایمیل
                حساب جدید ایجاد نمی‌کنیم.
              */

              shouldCreateUser:
                false,

              emailRedirectTo:
                redirectTo

            }

          });


      setBusy(false);


      if (error) {

        console.error(
          'Magic link error:',
          error
        );


        /*
          این بار پیام واقعی Supabase
          نمایش داده می‌شود.
        */

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
        'Magic link exception:',
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


  /*
    =======================================================
    PASSWORD RESET
    =======================================================
  */

  async function resetPassword() {

    if (redirecting) {
      return;
    }


    showMessage('');


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


      console.log(
        'Password reset redirect:',
        redirectTo
      );


      const {
        data,
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
        'Password reset request successful:',
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


  /*
    =======================================================
    CHECK URL AUTH ERROR
    =======================================================
  */

  function checkUrlError() {

    const search =
      new URLSearchParams(
        window.location.search
      );


    const hash =
      new URLSearchParams(
        window.location.hash.replace(
          /^#/,
          ''
        )
      );


    const error =
      search.get(
        'error'
      ) ||
      hash.get(
        'error'
      );


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


  /*
    =======================================================
    CHECK CALLBACK
    =======================================================
  */

  function hasAuthCallback() {

    const search =
      new URLSearchParams(
        window.location.search
      );


    const hash =
      new URLSearchParams(
        window.location.hash.replace(
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


  /*
    =======================================================
    GET SESSION
    =======================================================
  */

  async function getSession() {

    try {

      const {
        data,
        error
      } =
        await supabase.auth
          .getSession();


      if (error) {

        console.error(
          'getSession error:',
          error
        );


        return null;

      }


      return (
        data?.session ||
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


  /*
    =======================================================
    WAIT FOR MAGIC LINK SESSION
    =======================================================
  */

  async function waitForCallbackSession() {

    /*
      حداکثر حدود ۶ ثانیه صبر می‌کنیم.
    */

    for (
      let attempt = 0;
      attempt < 20;
      attempt++
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
            300
          )
      );

    }


    return null;

  }


  /*
    =======================================================
    AUTH STATE LISTENER
    =======================================================
  */

  function listenForAuthChanges() {

    if (!supabase) {
      return;
    }


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
              فقط وقتی Session واقعی ایجاد شد
              وارد برنامه شو.

              SIGNED_IN ممکن است هنگام callback
              رخ دهد.
            */

            if (
              event === 'SIGNED_IN' &&
              session?.user
            ) {

              openApp();

              return;

            }


            /*
              TOKEN_REFRESHED:
              Session معتبر است؛
              هیچ redirect لازم نیست.
            */

            if (
              event === 'TOKEN_REFRESHED' &&
              session?.user
            ) {

              return;

            }

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


  /*
    =======================================================
    BOOT
    =======================================================
  */

  async function boot() {

    if (bootFinished) {
      return;
    }


    bootFinished =
      true;


    if (!supabase) {

      showMessage(
        'سامانه احراز هویت بارگذاری نشده است.'
      );


      return;

    }


    try {

      /*
        ---------------------------------------------------
        1. خطای callback
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
        2. Session موجود
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
        3. Magic Link callback
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
          await waitForCallbackSession();


        if (
          callbackSession?.user
        ) {

          console.log(
            'Magic Link session established:',
            callbackSession.user.id
          );


          openApp();

          return;

        }


        setBusy(false);


        showMessage(
          'لینک ورود دریافت شد، اما نشست کاربری ایجاد نشد. لطفاً لینک را دوباره باز کنید یا یک لینک جدید درخواست کنید.'
        );


        return;

      }


      /*
        ---------------------------------------------------
        4. پیام auth.js
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


  /*
    =======================================================
    INITIALIZATION
    =======================================================
  */

  if (loginModeBtn) {

    loginModeBtn
      .addEventListener(
        'click',
        () => {

          switchMode(
            'login'
          );

        }
      );

  }


  if (registerModeBtn) {

    registerModeBtn
      .addEventListener(
        'click',
        () => {

          switchMode(
            'register'
          );

        }
      );

  }


  if (loginForm) {

    loginForm
      .addEventListener(
        'submit',
        login
      );

  }


  if (registerForm) {

    registerForm
      .addEventListener(
        'submit',
        register
      );

  }


  const magicButton =
    $('magicLinkBtn');


  if (magicButton) {

    magicButton
      .addEventListener(
        'click',
        magicLink
      );

  }


  const forgotButton =
    $('forgotBtn');


  if (forgotButton) {

    forgotButton
      .addEventListener(
        'click',
        resetPassword
      );

  }


  /*
    حالت اولیه صفحه
  */

  switchMode(
    'login'
  );


  /*
    بسیار مهم:
    Listener قبل از boot فعال شود.
  */

  listenForAuthChanges();


  /*
    شروع Auth
  */

  boot();


})();
