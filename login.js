'use strict';

/*
  =========================================================
  مرکز تخصصی سلامت طیور آدینه
  LOGIN.JS
  Authentication / Login / Magic Link / Recovery
  =========================================================

  هماهنگ با:
    login.html
    supabase.js
    auth.js
    index.html
    auth-guard.jS

  امکانات:
    - ورود Email + Password
    - ورود با Magic Link
    - ثبت نام
    - ارسال لینک بازیابی رمز
    - تعیین رمز جدید داخل همان صفحه
    - تشخیص Recovery Callback
    - تشخیص Magic Link Callback
    - Session موجود
    - جلوگیری از Redirect Loop
    - جلوگیری از چند بار ارسال درخواست
    - نمایش خطای واقعی Supabase
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

  let recoveryMode = false;

  let recoveryForm = null;

  let recoveryPassword = null;

  let recoveryPasswordConfirm = null;

  let recoverySubmit = null;


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
     URL HELPERS
  ======================================================= */

  function getSearchParams() {

    return new URLSearchParams(
      window.location.search
    );

  }


  function getHashParams() {

    return new URLSearchParams(
      window.location.hash
        .replace(
          /^#/,
          ''
        )
    );

  }


  function getAuthType() {

    const search =
      getSearchParams();

    const hash =
      getHashParams();


    return (
      search.get('type') ||
      hash.get('type') ||
      ''
    ).toLowerCase();

  }


  function getAuthError() {

    const search =
      getSearchParams();

    const hash =
      getHashParams();


    return {

      error:
        search.get('error') ||
        hash.get('error') ||
        '',

      description:
        search.get(
          'error_description'
        ) ||
        hash.get(
          'error_description'
        ) ||
        '',

      code:
        search.get(
          'error_code'
        ) ||
        hash.get(
          'error_code'
        ) ||
        ''

    };

  }


  function hasAccessToken() {

    const hash =
      getHashParams();


    return (
      hash.has('access_token') &&
      hash.has('refresh_token')
    );

  }


  function hasCode() {

    const search =
      getSearchParams();


    return search.has(
      'code'
    );

  }


  function isRecoveryCallback() {

    const type =
      getAuthType();


    return (
      type === 'recovery' ||
      type === 'password_recovery'
    );

  }


  function hasAuthCallback() {

    return (

      hasCode() ||

      hasAccessToken() ||

      isRecoveryCallback()

    );

  }


  /* =======================================================
     LOGIN REDIRECT URL
  ======================================================= */

  function getLoginRedirectUrl() {

    /*
      لینک‌های ایمیل همیشه به همان login.html
      فعلی برمی‌گردند.

      بنابراین کاربر در صفحه جداگانه‌ای
      از نرم‌افزار قرار نمی‌گیرد.
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


    /*
      در حالت بازیابی رمز نباید
      مستقیماً وارد برنامه شویم.
    */

    if (recoveryMode) {
      return;
    }


    redirecting = true;


    setBusy(true);


    /*
      مقدار کوتاه تأخیر برای اطمینان
      از ذخیره Session توسط Supabase.
    */

    window.setTimeout(
      function () {

        window.location.replace(
          'index.html'
        );

      },
      250
    );

  }


  /* =======================================================
     SWITCH LOGIN / REGISTER
  ======================================================= */

  function switchMode(
    mode
  ) {

    if (recoveryMode) {
      return;
    }


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
        !data?.user ||
        !data?.session
      ) {

        setBusy(false);


        showMessage(
          'نشست کاربری ایجاد نشد. دوباره تلاش کنید.'
        );


        return;

      }


      console.log(
        'Password login successful:',
        data.user.id
      );


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
        اگر Session خودکار ساخته شود،
        چون حساب باید توسط مالک تأیید شود،
        فعلاً از آن خارج می‌شویم.
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
     PASSWORD RESET REQUEST
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


      console.log(
        'Password recovery redirect URL:',
        redirectTo
      );


      const response =
        await supabase.auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo
            }
          );


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


      showMessage(
        'لینک بازیابی رمز عبور ارسال شد. ایمیل خود را بررسی کنید.',
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
     CREATE RECOVERY FORM
  ======================================================= */

  function createRecoveryForm() {

    if (recoveryForm) {
      return;
    }


    recoveryForm =
      document.createElement(
        'form'
      );


    recoveryForm.id =
      'recoveryForm';

    recoveryForm.className =
      'recovery-form';


    recoveryForm.noValidate =
      true;


    recoveryForm.innerHTML = `

      <label
        for="recoveryPassword"
      >
        رمز عبور جدید
      </label>

      <input
        id="recoveryPassword"
        type="password"
        autocomplete="new-password"
        minlength="8"
        placeholder="حداقل ۸ کاراکتر"
        required
      >


      <label
        for="recoveryPasswordConfirm"
      >
        تکرار رمز عبور جدید
      </label>

      <input
        id="recoveryPasswordConfirm"
        type="password"
        autocomplete="new-password"
        minlength="8"
        placeholder="تکرار رمز عبور"
        required
      >


      <button
        id="recoverySubmitBtn"
        class="primary-btn"
        type="submit"
      >
        ذخیره رمز عبور جدید
      </button>

    `;


    recoveryPassword =
      recoveryForm.querySelector(
        '#recoveryPassword'
      );


    recoveryPasswordConfirm =
      recoveryForm.querySelector(
        '#recoveryPasswordConfirm'
      );


    recoverySubmit =
      recoveryForm.querySelector(
        '#recoverySubmitBtn'
      );


    recoveryForm.addEventListener(
      'submit',
      updatePassword
    );


    /*
      فرم بازیابی قبل از Security Note
      قرار می‌گیرد.
    */

    const securityNote =
      document.querySelector(
        '.security-note'
      );


    if (
      securityNote &&
      securityNote.parentNode
    ) {

      securityNote.parentNode.insertBefore(
        recoveryForm,
        securityNote
      );

    }

    else if (
      loginForm &&
      loginForm.parentNode
    ) {

      loginForm.parentNode.insertBefore(
        recoveryForm,
        loginForm
      );

    }


    recoveryForm.hidden =
      true;

  }


  /* =======================================================
     SHOW RECOVERY MODE
  ======================================================= */

  function showRecoveryMode() {

    recoveryMode =
      true;


    createRecoveryForm();


    if (loginForm) {

      loginForm.hidden =
        true;

    }


    if (registerForm) {

      registerForm.hidden =
        true;

    }


    if (loginModeBtn) {

      loginModeBtn.disabled =
        true;

      loginModeBtn.classList.remove(
        'active'
      );

    }


    if (registerModeBtn) {

      registerModeBtn.disabled =
        true;

      registerModeBtn.classList.remove(
        'active'
      );

    }


    if (recoveryForm) {

      recoveryForm.hidden =
        false;

    }


    if (modeTitle) {

      modeTitle.textContent =
        'تغییر رمز عبور';

    }


    if (modeText) {

      modeText.textContent =
        'رمز عبور جدید خود را وارد کنید.';

    }


    showMessage(
      'لینک بازیابی معتبر است. رمز عبور جدید خود را تعیین کنید.',
      'success'
    );


    setBusy(false);


    window.setTimeout(
      function () {

        recoveryPassword?.focus();

      },
      100
    );

  }


  /* =======================================================
     UPDATE PASSWORD
  ======================================================= */

  async function updatePassword(
    event
  ) {

    if (event) {

      event.preventDefault();

    }


    if (
      !supabase ||
      !recoveryForm
    ) {

      showMessage(
        'فرم تغییر رمز آماده نیست.'
      );

      return;

    }


    const password =
      recoveryPassword
        ?.value ||
      '';


    const confirm =
      recoveryPasswordConfirm
        ?.value ||
      '';


    if (!password) {

      showMessage(
        'رمز عبور جدید را وارد کنید.'
      );

      return;

    }


    if (
      password.length < 8
    ) {

      showMessage(
        'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.'
      );

      return;

    }


    if (
      password !== confirm
    ) {

      showMessage(
        'تکرار رمز عبور با رمز جدید یکسان نیست.'
      );

      return;

    }


    setBusy(true);


    try {

      const response =
        await supabase.auth
          .updateUser({

            password

          });


      const error =
        response?.error;


      if (error) {

        console.error(
          'Update password error:',
          error
        );


        setBusy(false);


        showMessage(
          `تغییر رمز عبور انجام نشد: ${
            error.message ||
            'خطای نامشخص'
          }`
        );


        return;

      }


      showMessage(
        'رمز عبور با موفقیت تغییر کرد. اکنون می‌توانید وارد سامانه شوید.',
        'success'
      );


      recoveryPassword.value =
        '';

      recoveryPasswordConfirm.value =
        '';


      /*
        بعد از تغییر رمز،
        Session معتبر است اما برای اینکه
        مسیر ورود کاملاً مشخص باشد،
        فرم ورود را دوباره نمایش می‌دهیم.
      */

      recoveryMode =
        false;


      if (recoveryForm) {

        recoveryForm.hidden =
          true;

      }


      if (loginModeBtn) {

        loginModeBtn.disabled =
          false;

      }


      if (registerModeBtn) {

        registerModeBtn.disabled =
          false;

      }


      if (loginForm) {

        loginForm.hidden =
          false;

      }


      if (registerForm) {

        registerForm.hidden =
          true;

      }


      if (modeTitle) {

        modeTitle.textContent =
          'ورود امن به سامانه';

      }


      if (modeText) {

        modeText.textContent =
          'رمز عبور جدید شما ثبت شد.';

      }


      setBusy(false);


      /*
        چون تغییر رمز با Session معتبر
        انجام شده، کاربر می‌تواند مستقیماً
        وارد برنامه شود.
      */

      const session =
        await getSession();


      if (
        session?.user
      ) {

        openApp();

      }

    }

    catch (error) {

      console.error(
        'Update password exception:',
        error
      );


      setBusy(false);


      showMessage(
        `خطا هنگام تغییر رمز عبور: ${
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

    const authError =
      getAuthError();


    if (
      authError.error ||
      authError.description
    ) {

      console.error(
        'Supabase URL authentication error:',
        authError
      );


      let message =
        authError.description ||
        authError.error ||
        'احراز هویت ناموفق بود.';


      try {

        message =
          decodeURIComponent(
            message.replace(
              /\+/g,
              ' '
            )
          );

      }

      catch (_) {

        /*
          اگر decode ناموفق بود،
          متن اصلی حفظ می‌شود.
        */

      }


      showMessage(
        message
      );


      return true;

    }


    return false;

  }


  /* =======================================================
     SESSION
  ======================================================= */

  async function getSession() {

    if (!supabase) {

      return null;

    }


    try {

      const response =
        await supabase.auth
          .getSession();


      if (
        response?.error
      ) {

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


    authListenerReady =
      true;


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
              Recovery باید در صفحه Login
              باقی بماند.
            */

            if (
              event === 'PASSWORD_RECOVERY'
            ) {

              showRecoveryMode();

              return;

            }


            /*
              اگر Session در callback
              ایجاد شد ولی Recovery نیست،
              وارد برنامه شو.
            */

            if (
              event === 'SIGNED_IN' &&
              session?.user &&
              !recoveryMode
            ) {

              openApp();

              return;

            }


            /*
              Session اولیه اگر کاربر قبلاً
              وارد شده باشد.
            */

            if (
              event === 'INITIAL_SESSION' &&
              session?.user &&
              !hasAuthCallback() &&
              !recoveryMode
            ) {

              openApp();

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


  /* =======================================================
     CLEAN AUTH URL
  ======================================================= */

  function cleanAuthUrl() {

    try {

      const cleanUrl =
        new URL(
          window.location.href
        );


      cleanUrl.searchParams.delete(
        'code'
      );

      cleanUrl.searchParams.delete(
        'type'
      );

      cleanUrl.searchParams.delete(
        'error'
      );

      cleanUrl.searchParams.delete(
        'error_code'
      );

      cleanUrl.searchParams.delete(
        'error_description'
      );


      /*
        Hash حاوی access_token است.
        قبل از پاک کردن باید Session توسط
        Supabase ساخته شده باشد.
      */

      cleanUrl.hash =
        '';


      window.history.replaceState(
        {},
        document.title,
        cleanUrl.pathname +
        cleanUrl.search
      );

    }

    catch (error) {

      console.warn(
        'Could not clean authentication URL:',
        error
      );

    }

  }


  /* =======================================================
     HANDLE RECOVERY CALLBACK
  ======================================================= */

  async function handleRecoveryCallback() {

    if (
      !isRecoveryCallback()
    ) {

      return false;

    }


    console.log(
      'Password recovery callback detected.'
    );


    setBusy(true);


    /*
      ابتدا صبر می‌کنیم تا Supabase
      Session بازیابی را ثبت کند.
    */

    const session =
      await waitForSession(
        8000
      );


    if (
      !session?.user
    ) {

      setBusy(false);


      showMessage(
        'لینک بازیابی دریافت شد، اما نشست امن ایجاد نشد. لطفاً یک لینک بازیابی جدید درخواست کنید.'
      );


      return true;

    }


    /*
      از اینجا به بعد در حالت Recovery هستیم.
    */

    showRecoveryMode();


    /*
      بعد از ایجاد Session، پارامترهای
      اضافی URL پاک می‌شوند ولی صفحه
      همان login.html باقی می‌ماند.
    */

    cleanAuthUrl();


    return true;

  }


  /* =======================================================
     BOOT
  ======================================================= */

  async function boot() {

    if (bootFinished) {

      return;

    }


    bootFinished =
      true;


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
        فعال شود.
      */

      listenForAuthChanges();


      /*
        ---------------------------------------------------
        1. URL ERROR
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
        2. RECOVERY CALLBACK
        ---------------------------------------------------
      */

      if (
        isRecoveryCallback()
      ) {

        await handleRecoveryCallback();

        return;

      }


      /*
        ---------------------------------------------------
        3. AUTH CALLBACK
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


          /*
            اگر callback از Recovery نبود،
            ورود عادی است.
          */

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
        4. EXISTING SESSION
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
        5. GUARD MESSAGE
        ---------------------------------------------------
      */

      const message =
        getSearchParams()
          .get(
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
