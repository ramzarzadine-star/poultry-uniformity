'use strict';

/*
=========================================================
ADINEH POULTRY
LOGIN.JS
=========================================================

Login
Register
Magic Link
Forgot Password
Password Recovery
Password Reset

IMPORTANT:
Recovery callback must NEVER redirect to index.html
before PASSWORD_RECOVERY has been handled.
=========================================================
*/

(function () {

  const supabase =
    window.adinehSupabase;

  const $ = id =>
    document.getElementById(id);


  /* =====================================================
     DOM
  ===================================================== */

  const loginForm =
    $('loginForm');

  const registerForm =
    $('registerForm');

  const resetForm =
    $('resetForm');

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


  /* =====================================================
     STATE
  ===================================================== */

  let busy =
    false;

  let redirecting =
    false;

  /*
    این متغیر وقتی Recovery شروع شود
    قفل می‌شود و تا پایان Reset نباید
    false شود.
  */
  let recoveryMode =
    false;

  /*
    Callback URL داریم یا نه؟
  */
  let authCallback =
    false;

  /*
    آیا callback هنوز در حال پردازش است؟
  */
  let waitingForAuthCallback =
    false;


  /* =====================================================
     MESSAGE
  ===================================================== */

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


  /* =====================================================
     BUSY
  ===================================================== */

  function setBusy(
    value
  ) {

    busy =
      Boolean(value);

    document
      .querySelectorAll('button')
      .forEach(
        button => {

          button.disabled =
            busy;

        }
      );

    if (loading) {

      loading.hidden =
        !busy;

    }

  }


  /* =====================================================
     EMAIL
  ===================================================== */

  function normalizeEmail(
    value
  ) {

    return String(
      value || ''
    )
      .trim()
      .toLowerCase();

  }


  function isValidEmail(
    email
  ) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);

  }


  /* =====================================================
     PASSWORD
  ===================================================== */

  function passwordError(
    password
  ) {

    if (!password)
      return 'رمز عبور را وارد کنید.';

    if (
      password.length < 8
    ) {

      return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';

    }

    return '';

  }


  /* =====================================================
     LOGIN URL
  ===================================================== */

  function getLoginUrl() {

    const url =
      new URL(
        'login.html',
        window.location.href
      );

    url.search = '';

    url.hash = '';

    return url.href;

  }


  /* =====================================================
     AUTH CALLBACK DETECTION
  ===================================================== */

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


    /*
      PKCE callback
    */

    if (
      search.has('code')
    ) {

      return true;

    }


    /*
      Implicit / Magic Link
    */

    if (
      hash.has('access_token') ||
      hash.has('refresh_token')
    ) {

      return true;

    }


    /*
      Recovery
    */

    if (
      search.get('type') ===
      'recovery'
    ) {

      return true;

    }


    if (
      hash.get('type') ===
      'recovery'
    ) {

      return true;

    }


    return false;

  }


  function hasExplicitRecoveryType() {

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

      search.get('type') ===
      'recovery' ||

      hash.get('type') ===
      'recovery'

    );

  }


  /* =====================================================
     CLEAN URL
  ===================================================== */

  function clearAuthUrl() {

    try {

      const clean =
        new URL(
          window.location.href
        );


      clean.searchParams.delete(
        'code'
      );

      clean.searchParams.delete(
        'type'
      );

      clean.searchParams.delete(
        'error'
      );

      clean.searchParams.delete(
        'error_code'
      );

      clean.searchParams.delete(
        'error_description'
      );


      clean.hash =
        '';


      window.history.replaceState(
        {},
        document.title,
        clean.href
      );

    }

    catch (error) {

      console.warn(
        'Could not clean authentication URL:',
        error
      );

    }

  }


  /* =====================================================
     SWITCH LOGIN / REGISTER
  ===================================================== */

  function switchMode(
    mode
  ) {

    /*
      در Recovery اجازه تغییر Mode نداریم.
    */

    if (
      recoveryMode
    ) {

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


    if (resetForm) {

      resetForm.hidden =
        true;

    }


    loginModeBtn
      ?.classList
      .toggle(
        'active',
        !register
      );


    registerModeBtn
      ?.classList
      .toggle(
        'active',
        register
      );


    if (modeTitle) {

      modeTitle.textContent =
        register
          ? 'ایجاد حساب کاربری'
          : 'ورود امن به سامانه';

    }


    if (modeText) {

      modeText.textContent =
        register
          ? 'اطلاعات خود را وارد کنید تا حساب کاربری ایجاد شود.'
          : 'برای ورود از ایمیل و رمز عبور حساب خود استفاده کنید.';

    }


    showMessage('');

  }


  /* =====================================================
     SHOW RECOVERY
  ===================================================== */

  function showRecoveryForm() {

    /*
      این خط بسیار مهم است.
    */

    recoveryMode =
      true;

    waitingForAuthCallback =
      false;


    if (loginForm) {

      loginForm.hidden =
        true;

    }


    if (registerForm) {

      registerForm.hidden =
        true;

    }


    if (resetForm) {

      resetForm.hidden =
        false;

    }


    loginModeBtn
      ?.classList
      .remove(
        'active'
      );


    registerModeBtn
      ?.classList
      .remove(
        'active'
      );


    if (modeTitle) {

      modeTitle.textContent =
        'تعیین رمز عبور جدید';

    }


    if (modeText) {

      modeText.textContent =
        'رمز عبور جدید خود را وارد کنید.';

    }


    showMessage(
      'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
      'success'
    );


    setBusy(false);


    window.setTimeout(
      () => {

        $('resetPassword')
          ?.focus();

      },
      100
    );

  }


  /* =====================================================
     PROFILE
  ===================================================== */

  async function readProfile(
    userId
  ) {

    if (!userId)
      return null;


    try {

      const {
        data,
        error
      } =
        await supabase
          .from('profiles')
          .select(`
            id,
            username,
            first_name,
            last_name,
            phone,
            company_name,
            role,
            status
          `)
          .eq(
            'id',
            userId
          )
          .maybeSingle();


      if (error) {

        console.error(
          'Profile query error:',
          error
        );

        return null;

      }


      return data || null;

    }

    catch (error) {

      console.error(
        'Profile query exception:',
        error
      );

      return null;

    }

  }


  /* =====================================================
     CONTINUE USER
  ===================================================== */

  async function continueWithUser(
    user
  ) {

    /*
      مهم:
      Recovery هیچ وقت نباید اینجا
      Redirect شود.
    */

    if (
      recoveryMode
    ) {

      console.log(
        'Redirect blocked: recovery mode.'
      );

      return;

    }


    if (
      !user ||
      redirecting
    ) {

      return;

    }


    const profile =
      await readProfile(
        user.id
      );


    if (!profile) {

      await supabase.auth
        .signOut();


      setBusy(false);


      showMessage(
        'حساب شما ایجاد شده، اما پروفایل کاربری پیدا نشد. با مالک سامانه تماس بگیرید.'
      );


      return;

    }


    if (
      profile.status !==
      'active'
    ) {

      await supabase.auth
        .signOut();


      setBusy(false);


      const messages = {

        pending:
          'حساب شما در انتظار تأیید مالک سامانه است.',

        suspended:
          'دسترسی حساب شما موقتاً متوقف شده است.',

        disabled:
          'دسترسی حساب شما غیرفعال شده است.'

      };


      showMessage(
        messages[
          profile.status
        ] ||
        'دسترسی حساب شما مجاز نیست.'
      );


      return;

    }


    redirecting =
      true;


    window.location.replace(
      'index.html'
    );

  }


  /* =====================================================
     NORMAL LOGIN
  ===================================================== */

  async function login(
    event
  ) {

    event?.preventDefault();


    if (busy)
      return;


    showMessage('');


    const email =
      normalizeEmail(
        $('loginEmail')
          ?.value
      );


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


    if (
      !isValidEmail(email)
    ) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
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
          'Login error:',
          error
        );


        setBusy(false);


        showMessage(
          error.message ||
          'ایمیل یا رمز عبور صحیح نیست.'
        );


        return;

      }


      if (
        !data?.user
      ) {

        setBusy(false);


        showMessage(
          'ورود انجام نشد.'
        );


        return;

      }


      await continueWithUser(
        data.user
      );

    }

    catch (error) {

      console.error(
        'Login exception:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'خطا هنگام ورود.'
      );

    }

  }


  /* =====================================================
     REGISTER
  ===================================================== */

  async function register(
    event
  ) {

    event?.preventDefault();


    if (busy)
      return;


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
      normalizeEmail(
        $('registerEmail')
          ?.value
      );


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
      !isValidEmail(email)
    ) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );

      return;

    }


    const passwordMessage =
      passwordError(
        password
      );


    if (passwordMessage) {

      showMessage(
        passwordMessage
      );

      return;

    }


    if (
      password !==
      confirm
    ) {

      showMessage(
        'تکرار رمز عبور یکسان نیست.'
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
          .signUp({

            email,

            password,

            options: {

              emailRedirectTo:
                getLoginUrl(),

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
          'Register error:',
          error
        );


        setBusy(false);


        showMessage(
          error.message ||
          'ثبت‌نام انجام نشد.'
        );


        return;

      }


      if (
        data?.session
      ) {

        await supabase.auth
          .signOut();

      }


      setBusy(false);


      switchMode(
        'login'
      );


      showMessage(
        'ثبت‌نام انجام شد و حساب شما در انتظار تأیید مالک سامانه است.',
        'success'
      );

    }

    catch (error) {

      console.error(
        'Register exception:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'خطا هنگام ثبت‌نام.'
      );

    }

  }


  /* =====================================================
     MAGIC LINK
  ===================================================== */

  async function magicLink() {

    if (busy)
      return;


    showMessage('');


    const email =
      normalizeEmail(
        $('loginEmail')
          ?.value
      );


    if (!email) {

      showMessage(
        'ابتدا ایمیل خود را وارد کنید.'
      );

      $('loginEmail')
        ?.focus();

      return;

    }


    if (
      !isValidEmail(email)
    ) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );

      return;

    }


    setBusy(true);


    try {

      const {
        error
      } =
        await supabase.auth
          .signInWithOtp({

            email,

            options: {

              emailRedirectTo:
                getLoginUrl()

            }

          });


      setBusy(false);


      if (error) {

        console.error(
          'Magic link error:',
          error
        );


        showMessage(
          error.message ||
          'ارسال لینک ورود انجام نشد.'
        );


        return;

      }


      showMessage(
        'لینک ورود ارسال شد. ایمیل خود را باز کنید.',
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
        error?.message ||
        'خطا هنگام ارسال لینک ورود.'
      );

    }

  }


  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */

  async function resetPasswordRequest() {

    if (busy)
      return;


    showMessage('');


    const email =
      normalizeEmail(
        $('loginEmail')
          ?.value
      );


    if (!email) {

      showMessage(
        'ایمیل خود را وارد کنید.'
      );

      $('loginEmail')
        ?.focus();

      return;

    }


    if (
      !isValidEmail(email)
    ) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );

      return;

    }


    setBusy(true);


    try {

      const {
        error
      } =
        await supabase.auth
          .resetPasswordForEmail(

            email,

            {

              redirectTo:
                getLoginUrl()

            }

          );


      setBusy(false);


      if (error) {

        console.error(
          'Reset request error:',
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
        'Reset request exception:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'خطا هنگام ارسال لینک بازیابی.'
      );

    }

  }


  /* =====================================================
     UPDATE PASSWORD
  ===================================================== */

  async function updatePassword(
    event
  ) {

    event?.preventDefault();


    if (busy)
      return;


    if (
      !recoveryMode
    ) {

      showMessage(
        'لینک بازیابی معتبر نیست.'
      );

      return;

    }


    const password =
      $('resetPassword')
        ?.value ||
      '';


    const confirm =
      $('resetPasswordConfirm')
        ?.value ||
      '';


    const errorMessage =
      passwordError(
        password
      );


    if (errorMessage) {

      showMessage(
        errorMessage
      );

      return;

    }


    if (
      password !==
      confirm
    ) {

      showMessage(
        'تکرار رمز عبور یکسان نیست.'
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
          .updateUser({

            password

          });


      if (error) {

        console.error(
          'Update password error:',
          error
        );


        setBusy(false);


        showMessage(
          error.message ||
          'تغییر رمز عبور انجام نشد.'
        );


        return;

      }


      if (
        !data?.user
      ) {

        setBusy(false);


        showMessage(
          'رمز تغییر کرد اما کاربر دریافت نشد.'
        );


        return;

      }


      /*
        Recovery تمام شد.
      */

      recoveryMode =
        false;


      clearAuthUrl();


      showMessage(
        'رمز عبور با موفقیت تغییر کرد. در حال ورود به سامانه…',
        'success'
      );


      await continueWithUser(
        data.user
      );

    }

    catch (error) {

      console.error(
        'Update password exception:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'تغییر رمز عبور انجام نشد.'
      );

    }

  }


  /* =====================================================
     AUTH LISTENER
  ===================================================== */

  function setupAuthListener() {

    if (!supabase)
      return;


    supabase.auth
      .onAuthStateChange(
        (
          event,
          session
        ) => {

          console.log(
            'SUPABASE AUTH EVENT:',
            event
          );


          /*
            PASSWORD_RECOVERY همیشه اولویت دارد.
          */

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {

            recoveryMode =
              true;

            waitingForAuthCallback =
              false;


            /*
              کمی تأخیر برای اطمینان از
              کامل شدن Session.
            */

            setTimeout(
              () => {

                showRecoveryForm();

              },
              0
            );


            return;

          }


          /*
            اگر در Recovery هستیم،
            SIGNED_IN نباید Redirect کند.
          */

          if (
            event ===
            'SIGNED_IN'
          ) {

            if (
              recoveryMode
            ) {

              console.log(
                'SIGNED_IN ignored: recovery mode.'
              );

              return;

            }


            if (
              waitingForAuthCallback
            ) {

              waitingForAuthCallback =
                false;


              setTimeout(
                async () => {

                  await continueWithUser(
                    session?.user
                  );

                },
                0
              );


              return;

            }


            /*
              ورود عادی بعد از کلیک کاربر
              یا Magic Link
            */

            setTimeout(
              async () => {

                await continueWithUser(
                  session?.user
                );

              },
              0
            );

          }

        }
      );

  }


  /* =====================================================
     BOOT
  ===================================================== */

  async function boot() {

    if (!supabase) {

      showMessage(
        'سامانه احراز هویت بارگذاری نشده است.'
      );

      return;

    }


    /*
      -----------------------------------------------
      FIRST:
      Detect callback BEFORE getSession.
      -----------------------------------------------
    */

    authCallback =
      hasAuthCallback();


    if (
      authCallback
    ) {

      waitingForAuthCallback =
        true;


      /*
        اگر نوع Recovery صریحاً در URL وجود دارد،
        از همین ابتدا Recovery را قفل می‌کنیم.
      */

      if (
        hasExplicitRecoveryType()
      ) {

        recoveryMode =
          true;

      }


      setBusy(true);

    }


    /*
      Listener باید قبل از getSession
      فعال شود.
    */

    setupAuthListener();


    /*
      -----------------------------------------------
      CALLBACK MODE
      -----------------------------------------------

      این قسمت بسیار مهم است:

      اگر callback باشد، Session موجود را
      نباید به عنوان ورود عادی تلقی کنیم.

      باید صبر کنیم تا Supabase یکی از اینها
      را اعلام کند:

      PASSWORD_RECOVERY
      یا
      SIGNED_IN
    */

    if (
      authCallback
    ) {

      console.log(
        'Auth callback detected. Waiting for Supabase auth event.'
      );


      /*
        اگر Recovery صریح بود، فرم را فقط
        بعد از PASSWORD_RECOVERY نشان می‌دهیم.
      */

      if (
        recoveryMode
      ) {

        /*
          اگر Session از قبل وجود داشته باشد،
          باز هم Redirect نمی‌کنیم.
        */

        showRecoveryForm();


        /*
          URL را فعلاً پاک نمی‌کنیم.
          Supabase باید Callback را کامل پردازش کند.
        */

        return;

      }


      /*
        برای Magic Link / PKCE
        اینجا عمداً return می‌کنیم.

        SIGNED_IN listener مسئول Redirect است.
      */

      return;

    }


    /*
      -----------------------------------------------
      NORMAL LOGIN PAGE
      -----------------------------------------------

      اگر URL callback نیست و Session موجود است،
      ورود خودکار قبلی را حفظ می‌کنیم.
    */

    try {

      const {
        data: {
          session
        }
      } =
        await supabase.auth
          .getSession();


      if (
        session?.user
      ) {

        await continueWithUser(
          session.user
        );

        return;

      }

    }

    catch (error) {

      console.error(
        'Session check error:',
        error
      );

    }


    /*
      پیام auth guard
    */

    const message =
      new URLSearchParams(
        window.location.search
      )
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


  /* =====================================================
     EVENTS
  ===================================================== */

  loginModeBtn
    ?.addEventListener(
      'click',
      () =>
        switchMode(
          'login'
        )
    );


  registerModeBtn
    ?.addEventListener(
      'click',
      () =>
        switchMode(
          'register'
        )
    );


  loginForm
    ?.addEventListener(
      'submit',
      login
    );


  registerForm
    ?.addEventListener(
      'submit',
      register
    );


  resetForm
    ?.addEventListener(
      'submit',
      updatePassword
    );


  $('magicLinkBtn')
    ?.addEventListener(
      'click',
      magicLink
    );


  $('forgotBtn')
    ?.addEventListener(
      'click',
      resetPasswordRequest
    );


  $('backToLoginBtn')
    ?.addEventListener(
      'click',
      () =>
        switchMode(
          'login'
        )
    );


  /* =====================================================
     INITIAL
  ===================================================== */

  switchMode(
    'login'
  );


  /*
    Boot
  */

  boot();

})();
