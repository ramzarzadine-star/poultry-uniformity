'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
LOGIN AUTHENTICATION
=========================================================

امکانات:

1. ورود با ایمیل و رمز
2. ثبت نام
3. ورود با لینک ایمیل
4. فراموشی رمز عبور
5. دریافت Recovery
6. تعیین رمز جدید
7. کنترل حساب فعال
8. جلوگیری از ورود خودکار اشتباه
9. جلوگیری از Redirect هنگام Recovery

=========================================================
*/

(function () {


  /* =====================================================
     SUPABASE
  ===================================================== */

  const supabase =
    window.adinehSupabase;


  /* =====================================================
     DOM HELPER
  ===================================================== */

  const $ = function (id) {

    return document.getElementById(id);

  };


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

  const modeSwitch =
    $('modeSwitch');

  const loading =
    $('loading');


  /* =====================================================
     STATE
  ===================================================== */

  let busy =
    false;

  let redirecting =
    false;

  let recoveryMode =
    false;

  let callbackMode =
    false;


  /* =====================================================
     MESSAGE
  ===================================================== */

  function showMessage(
    text,
    type
  ) {

    if (!messageEl) {

      return;

    }


    messageEl.textContent =
      text || '';


    messageEl.className =
      'login-message';


    if (text) {

      messageEl.classList.add(
        type || 'error'
      );

    }

  }


  /* =====================================================
     LOADING
  ===================================================== */

  function setBusy(
    value
  ) {

    busy =
      Boolean(value);


    document
      .querySelectorAll(
        'button'
      )
      .forEach(
        function (button) {

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

  function validatePassword(
    password
  ) {

    if (!password) {

      return 'رمز عبور را وارد کنید.';

    }


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


    /*
      فقط مسیر login.html
      بدون query و hash
    */

    url.search = '';

    url.hash = '';


    return url.href;

  }


  /* =====================================================
     CALLBACK DETECTION
  ===================================================== */

  function hasCallback() {

    const url =
      new URL(
        window.location.href
      );


    const params =
      url.searchParams;


    /*
      PKCE
    */

    if (
      params.has(
        'code'
      )
    ) {

      return true;

    }


    /*
      Recovery / implicit fallback
    */

    if (
      params.has(
        'type'
      )
    ) {

      return true;

    }


    if (
      url.hash.includes(
        'access_token='
      )
    ) {

      return true;

    }


    if (
      url.hash.includes(
        'refresh_token='
      )
    ) {

      return true;

    }


    if (
      url.hash.includes(
        'type=recovery'
      )
    ) {

      return true;

    }


    return false;

  }


  /* =====================================================
     EXPLICIT RECOVERY
  ===================================================== */

  function hasRecoveryMarker() {

    const url =
      new URL(
        window.location.href
      );


    if (
      url.searchParams.get(
        'type'
      ) ===
      'recovery'
    ) {

      return true;

    }


    if (
      url.hash.includes(
        'type=recovery'
      )
    ) {

      return true;

    }


    return false;

  }


  /* =====================================================
     CLEAN AUTH URL
  ===================================================== */

  function cleanAuthUrl() {

    try {

      const url =
        new URL(
          window.location.href
        );


      url.searchParams.delete(
        'code'
      );

      url.searchParams.delete(
        'type'
      );

      url.searchParams.delete(
        'error'
      );

      url.searchParams.delete(
        'error_code'
      );

      url.searchParams.delete(
        'error_description'
      );


      url.hash =
        '';


      window.history.replaceState(
        {},
        document.title,
        url.href
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
     SWITCH TO LOGIN
  ===================================================== */

  function showLoginMode() {

    if (recoveryMode) {

      return;

    }


    if (loginForm) {

      loginForm.hidden =
        false;

    }


    if (registerForm) {

      registerForm.hidden =
        true;

    }


    if (resetForm) {

      resetForm.hidden =
        true;

    }


    if (modeSwitch) {

      modeSwitch.hidden =
        false;

    }


    if (loginModeBtn) {

      loginModeBtn.classList.add(
        'active'
      );

    }


    if (registerModeBtn) {

      registerModeBtn.classList.remove(
        'active'
      );

    }


    if (modeTitle) {

      modeTitle.textContent =
        'ورود امن به سامانه';

    }


    if (modeText) {

      modeText.textContent =
        'برای ورود از ایمیل و رمز عبور حساب خود استفاده کنید.';

    }


    showMessage(
      ''
    );

  }


  /* =====================================================
     SHOW REGISTER
  ===================================================== */

  function showRegisterMode() {

    if (recoveryMode) {

      return;

    }


    if (loginForm) {

      loginForm.hidden =
        true;

    }


    if (registerForm) {

      registerForm.hidden =
        false;

    }


    if (resetForm) {

      resetForm.hidden =
        true;

    }


    if (modeSwitch) {

      modeSwitch.hidden =
        false;

    }


    if (loginModeBtn) {

      loginModeBtn.classList.remove(
        'active'
      );

    }


    if (registerModeBtn) {

      registerModeBtn.classList.add(
        'active'
      );

    }


    if (modeTitle) {

      modeTitle.textContent =
        'ایجاد حساب کاربری';

    }


    if (modeText) {

      modeText.textContent =
        'اطلاعات خود را وارد کنید تا حساب کاربری ایجاد شود.';

    }


    showMessage(
      ''
    );

  }


  /* =====================================================
     SHOW RECOVERY
  ===================================================== */

  function showRecoveryMode() {

    recoveryMode =
      true;


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


    if (modeSwitch) {

      modeSwitch.hidden =
        true;

    }


    if (modeTitle) {

      modeTitle.textContent =
        'تعیین رمز عبور جدید';

    }


    if (modeText) {

      modeText.textContent =
        'رمز عبور جدید خود را وارد کنید.';

    }


    showMessage(
      'لینک بازیابی معتبر است. رمز عبور جدید خود را تعیین کنید.',
      'success'
    );


    setBusy(
      false
    );


    window.setTimeout(
      function () {

        const input =
          $('resetPassword');

        if (input) {

          input.focus();

        }

      },
      100
    );

  }


  /* =====================================================
     PROFILE
  ===================================================== */

  async function getProfile(
    userId
  ) {

    if (
      !userId
    ) {

      return null;

    }


    try {

      const result =
        await supabase
          .from(
            'profiles'
          )
          .select(
            `
              id,
              username,
              first_name,
              last_name,
              phone,
              company_name,
              role,
              status
            `
          )
          .eq(
            'id',
            userId
          )
          .maybeSingle();


      if (
        result.error
      ) {

        console.error(
          'Profile error:',
          result.error
        );


        return null;

      }


      return (
        result.data ||
        null
      );

    }

    catch (error) {

      console.error(
        'Profile exception:',
        error
      );


      return null;

    }

  }


  /* =====================================================
     CHECK ACTIVE USER
  ===================================================== */

  async function continueWithUser(
    user
  ) {

    /*
      Recovery نباید Redirect شود.
    */

    if (
      recoveryMode
    ) {

      console.log(
        'Recovery mode: redirect blocked.'
      );


      return;

    }


    if (
      !user
    ) {

      setBusy(
        false
      );


      return;

    }


    if (
      redirecting
    ) {

      return;

    }


    const profile =
      await getProfile(
        user.id
      );


    if (!profile) {

      await supabase.auth.signOut();


      setBusy(
        false
      );


      showMessage(
        'حساب شما پیدا شد اما پروفایل کاربری وجود ندارد. با مالک سامانه تماس بگیرید.'
      );


      return;

    }


    const status =
      profile.status;


    if (
      status !==
      'active'
    ) {

      await supabase.auth.signOut();


      setBusy(
        false
      );


      const messages = {

        pending:
          'حساب شما در انتظار تأیید مالک سامانه است.',

        suspended:
          'دسترسی حساب شما موقتاً متوقف شده است.',

        disabled:
          'دسترسی حساب شما غیرفعال شده است.'

      };


      showMessage(
        messages[status] ||
        'دسترسی این حساب فعال نیست.'
      );


      return;

    }


    redirecting =
      true;


    cleanAuthUrl();


    window.location.replace(
      'index.html'
    );

  }


  /* =====================================================
     LOGIN WITH PASSWORD
  ===================================================== */

  async function login(
    event
  ) {

    event.preventDefault();


    if (busy) {

      return;

    }


    if (recoveryMode) {

      return;

    }


    showMessage(
      ''
    );


    const email =
      normalizeEmail(
        $('loginEmail')?.value
      );


    const password =
      $('loginPassword')?.value ||
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
      !isValidEmail(
        email
      )
    ) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );


      return;

    }


    setBusy(
      true
    );


    try {

      const result =
        await supabase.auth.signInWithPassword({

          email:
            email,

          password:
            password

        });


      if (
        result.error
      ) {

        console.error(
          'Sign in error:',
          result.error
        );


        setBusy(
          false
        );


        showMessage(
          result.error.message ||
          'ورود انجام نشد.'
        );


        return;

      }


      if (
        !result.data ||
        !result.data.user
      ) {

        setBusy(
          false
        );


        showMessage(
          'ورود انجام نشد.'
        );


        return;

      }


      await continueWithUser(
        result.data.user
      );

    }

    catch (error) {

      console.error(
        'Sign in exception:',
        error
      );


      setBusy(
        false
      );


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

    event.preventDefault();


    if (busy) {

      return;

    }


    if (recoveryMode) {

      return;

    }


    showMessage(
      ''
    );


    const firstName =
      (
        $('firstName')?.value ||
        ''
      ).trim();


    const lastName =
      (
        $('lastName')?.value ||
        ''
      ).trim();


    const phone =
      (
        $('registerPhone')?.value ||
        ''
      ).trim();


    const email =
      normalizeEmail(
        $('registerEmail')?.value
      );


    const password =
      $('registerPassword')?.value ||
      '';


    const confirm =
      $('registerPasswordConfirm')?.value ||
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
      !isValidEmail(
        email
      )
    ) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );


      return;

    }


    const passwordMessage =
      validatePassword(
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


    setBusy(
      true
    );


    try {

      const result =
        await supabase.auth.signUp({

          email:
            email,

          password:
            password,

          options: {

            emailRedirectTo:
              getLoginUrl(),

            data: {

              first_name:
                firstName,

              last_name:
                lastName,

              phone:
                phone

            }

          }

        });


      if (
        result.error
      ) {

        console.error(
          'Sign up error:',
          result.error
        );


        setBusy(
          false
        );


        showMessage(
          result.error.message ||
          'ثبت‌نام انجام نشد.'
        );


        return;

      }


      /*
        اگر Supabase بلافاصله Session داده باشد
        حساب تأیید شده است.
      */

      if (
        result.data &&
        result.data.session &&
        result.data.user
      ) {

        await continueWithUser(
          result.data.user
        );


        return;

      }


      /*
        در حالت Email Confirmation
      */

      setBusy(
        false
      );


      showLoginMode();


      showMessage(
        'ثبت‌نام انجام شد. ایمیل خود را برای تأیید حساب بررسی کنید.',
        'success'
      );

    }

    catch (error) {

      console.error(
        'Sign up exception:',
        error
      );


      setBusy(
        false
      );


      showMessage(
        error?.message ||
        'خطا هنگام ثبت‌نام.'
      );

    }

  }


  /* =====================================================
     MAGIC LINK
  ===================================================== */

  async function sendMagicLink() {

    if (busy) {

      return;

    }


    if (recoveryMode) {

      return;

    }


    showMessage(
      ''
    );


    const email =
      normalizeEmail(
        $('loginEmail')?.value
      );


    if (!email) {

      showMessage(
        'ابتدا ایمیل خود را وارد کنید.'
      );


      $('loginEmail')?.focus();


      return;

    }


    if (
      !isValidEmail(
        email
      )
    ) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );


      return;

    }


    setBusy(
      true
    );


    try {

      const result =
        await supabase.auth.signInWithOtp({

          email:
            email,

          options: {

            emailRedirectTo:
              getLoginUrl(),

            shouldCreateUser:
              false

          }

        });


      if (
        result.error
      ) {

        console.error(
          'Magic link error:',
          result.error
        );


        setBusy(
          false
        );


        showMessage(
          result.error.message ||
          'ارسال لینک ورود انجام نشد.'
        );


        return;

      }


      setBusy(
        false
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


      setBusy(
        false
      );


      showMessage(
        error?.message ||
        'خطا هنگام ارسال لینک ورود.'
      );

    }

  }


  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */

  async function sendResetLink() {

    if (busy) {

      return;

    }


    if (recoveryMode) {

      return;

    }


    showMessage(
      ''
    );


    const email =
      normalizeEmail(
        $('loginEmail')?.value
      );


    if (!email) {

      showMessage(
        'ایمیل خود را وارد کنید.'
      );


      $('loginEmail')?.focus();


      return;

    }


    if (
      !isValidEmail(
        email
      )
    ) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );


      return;

    }


    setBusy(
      true
    );


    try {

      const result =
        await supabase.auth.resetPasswordForEmail(

          email,

          {

            redirectTo:
              getLoginUrl()

          }

        );


      if (
        result.error
      ) {

        console.error(
          'Password reset error:',
          result.error
        );


        setBusy(
          false
        );


        showMessage(
          result.error.message ||
          'ارسال لینک بازیابی انجام نشد.'
        );


        return;

      }


      setBusy(
        false
      );


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


      setBusy(
        false
      );


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

    event.preventDefault();


    if (busy) {

      return;

    }


    if (!recoveryMode) {

      showMessage(
        'جلسه بازیابی رمز معتبر نیست. لطفاً دوباره درخواست بازیابی رمز کنید.'
      );


      return;

    }


    const password =
      $('resetPassword')?.value ||
      '';


    const confirm =
      $('resetPasswordConfirm')?.value ||
      '';


    const passwordMessage =
      validatePassword(
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


    setBusy(
      true
    );


    try {

      const result =
        await supabase.auth.updateUser({

          password:
            password

        });


      if (
        result.error
      ) {

        console.error(
          'Update password error:',
          result.error
        );


        setBusy(
          false
        );


        showMessage(
          result.error.message ||
          'تغییر رمز عبور انجام نشد.'
        );


        return;

      }


      /*
        Recovery تمام شد.
      */

      recoveryMode =
        false;


      cleanAuthUrl();


      showMessage(
        'رمز عبور با موفقیت تغییر کرد. در حال ورود به سامانه…',
        'success'
      );


      /*
        Session فعلی معتبر است.
        بعد از تغییر رمز، حساب را بررسی می‌کنیم.
      */

      const sessionResult =
        await supabase.auth.getSession();


      if (
        sessionResult.data &&
        sessionResult.data.session &&
        sessionResult.data.session.user
      ) {

        await continueWithUser(
          sessionResult.data.session.user
        );


        return;

      }


      /*
        اگر Session در دسترس نبود،
        کاربر را به Login عادی برمی‌گردانیم.
      */

      setBusy(
        false
      );


      showLoginMode();


      showMessage(
        'رمز عبور تغییر کرد. اکنون با رمز جدید وارد شوید.',
        'success'
      );

    }

    catch (error) {

      console.error(
        'Update password exception:',
        error
      );


      setBusy(
        false
      );


      showMessage(
        error?.message ||
        'خطا هنگام تغییر رمز عبور.'
      );

    }

  }


  /* =====================================================
     AUTH STATE LISTENER
  ===================================================== */

  function setupAuthListener() {

    if (!supabase) {

      return;

    }


    supabase.auth.onAuthStateChange(
      function (
        event,
        session
      ) {

        console.log(
          'SUPABASE AUTH EVENT:',
          event
        );


        /*
        ==================================================
        PASSWORD RECOVERY
        ==================================================
        */

        if (
          event ===
          'PASSWORD_RECOVERY'
        ) {

          recoveryMode =
            true;


          window.setTimeout(
            function () {

              showRecoveryMode();

            },
            0
          );


          return;

        }


        /*
        ==================================================
        SIGNED_IN
        ==================================================
        */

        if (
          event ===
          'SIGNED_IN'
        ) {

          /*
            اگر Recovery فعال است،
            SIGNED_IN نباید کاربر را به
            index.html ببرد.
          */

          if (
            recoveryMode
          ) {

            console.log(
              'SIGNED_IN ignored during password recovery.'
            );


            return;

          }


          /*
            Callback مربوط به Magic Link
          */

          if (
            callbackMode
          ) {

            callbackMode =
              false;


            window.setTimeout(
              function () {

                continueWithUser(
                  session?.user
                );

              },
              0
            );


            return;

          }


          /*
            Login معمولی را login()
            خودش مدیریت می‌کند.
          */

          return;

        }


        /*
        ==================================================
        INITIAL SESSION
        ==================================================

        بسیار مهم:

        اگر کاربر قبلاً Session داشته باشد،
        صفحه Login نباید خودکار index.html
        را باز کند.

        این جلوی مشکل قبلی را می‌گیرد.
        */

        if (
          event ===
          'INITIAL_SESSION'
        ) {

          console.log(
            'Initial session detected. Staying on login page.'
          );


          return;

        }


        /*
        ==================================================
        TOKEN REFRESH
        ==================================================
        */

        if (
          event ===
          'TOKEN_REFRESHED'
        ) {

          return;

        }


        /*
        ==================================================
        USER UPDATED
        ==================================================
        */

        if (
          event ===
          'USER_UPDATED'
        ) {

          return;

        }

      }
    );

  }


  /* =====================================================
     HANDLE CALLBACK
  ===================================================== */

  async function handleCallback() {

    if (!hasCallback()) {

      return false;

    }


    callbackMode =
      true;


    setBusy(
      true
    );


    /*
      اگر Recovery را در URL تشخیص دهیم،
      اجازه Redirect نداریم.
    */

    if (
      hasRecoveryMarker()
    ) {

      recoveryMode =
        true;


      /*
        در PKCE ممکن است PASSWORD_RECOVERY
        کمی بعد توسط Supabase ارسال شود.
      */

      showRecoveryMode();


      return true;

    }


    /*
      Magic Link / PKCE

      Supabase با detectSessionInUrl
      Callback را پردازش می‌کند و
      SIGNED_IN را اعلام خواهد کرد.
    */

    showMessage(
      'در حال تکمیل ورود امن…',
      'success'
    );


    return true;

  }


  /* =====================================================
     BUTTON EVENTS
  ===================================================== */

  function bindEvents() {


    /*
      Login / Register
    */

    if (loginModeBtn) {

      loginModeBtn.addEventListener(
        'click',
        function () {

          showLoginMode();

        }
      );

    }


    if (registerModeBtn) {

      registerModeBtn.addEventListener(
        'click',
        function () {

          showRegisterMode();

        }
      );

    }


    /*
      Login
    */

    if (loginForm) {

      loginForm.addEventListener(
        'submit',
        login
      );

    }


    /*
      Register
    */

    if (registerForm) {

      registerForm.addEventListener(
        'submit',
        register
      );

    }


    /*
      Reset Password
    */

    if (resetForm) {

      resetForm.addEventListener(
        'submit',
        updatePassword
      );

    }


    /*
      Magic Link
    */

    const magicLinkBtn =
      $('magicLinkBtn');


    if (magicLinkBtn) {

      magicLinkBtn.addEventListener(
        'click',
        sendMagicLink
      );

    }


    /*
      Forgot Password
    */

    const forgotBtn =
      $('forgotBtn');


    if (forgotBtn) {

      forgotBtn.addEventListener(
        'click',
        sendResetLink
      );

    }


    /*
      Back to Login
    */

    const backToLoginBtn =
      $('backToLoginBtn');


    if (backToLoginBtn) {

      backToLoginBtn.addEventListener(
        'click',
        function () {

          if (recoveryMode) {

            /*
              Session Recovery را خارج نمی‌کنیم
              مگر کاربر دوباره Login کند.
            */

            recoveryMode =
              false;

          }


          showLoginMode();

        }
      );

    }

  }


  /* =====================================================
     BOOT
  ===================================================== */

  async function boot() {


    /*
      Supabase Client موجود نیست.
    */

    if (!supabase) {

      setBusy(
        false
      );


      showMessage(
        'اتصال به سرویس احراز هویت برقرار نشد. صفحه را دوباره باز کنید.'
      );


      return;

    }


    /*
      Listener باید قبل از Callback فعال شود.
    */

    setupAuthListener();


    /*
      ابتدا Callback را بررسی می‌کنیم.
    */

    const callback =
      await handleCallback();


    if (callback) {

      return;

    }


    /*
      صفحه عادی Login
    */

    showLoginMode();


    setBusy(
      false
    );


    /*
      message احتمالی از auth guard
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


  /* =====================================================
     START
  ===================================================== */

  bindEvents();

  boot();


})();
