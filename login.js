'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
PROFESSIONAL AUTHENTICATION SYSTEM
=========================================================

امکانات:
- ورود با ایمیل و رمز عبور
- ثبت نام
- Magic Link
- بازیابی رمز عبور
- تغییر رمز داخل همان صفحه Login
- PKCE
- جلوگیری از ورود خودکار اشتباه
- جلوگیری از Redirect در Recovery
- مدیریت Callback
- مدیریت Session
- مدیریت حساب فعال
=========================================================
*/

(function () {

  /* =====================================================
     SUPABASE
  ===================================================== */

  const supabase = window.adinehSupabase;

  if (!supabase) {

    console.error(
      'Adineh Auth: Supabase client not found.'
    );

    return;
  }


  /* =====================================================
     DOM
  ===================================================== */

  const $ = (id) =>
    document.getElementById(id);


  const loginForm =
    $('loginForm');

  const registerForm =
    $('registerForm');

  const resetForm =
    $('resetForm');

  const loginModeBtn =
    $('loginModeBtn');

  const registerModeBtn =
    $('registerModeBtn');

  const modeSwitch =
    $('modeSwitch');

  const modeTitle =
    $('modeTitle');

  const modeText =
    $('modeText');

  const messageEl =
    $('message');

  const loadingEl =
    $('loading');


  /* =====================================================
     AUTH INTENT
  ===================================================== */

  const AUTH_INTENT_KEY =
    'adineh_auth_intent';

  const AUTH_INTENT_TIME_KEY =
    'adineh_auth_intent_time';


  const INTENT_TTL =
    30 * 60 * 1000;


  let recoveryMode =
    false;

  let redirecting =
    false;

  let busy =
    false;


  /* =====================================================
     VISIBILITY
  ===================================================== */

  function setVisible(
    element,
    visible
  ) {

    if (!element) {
      return;
    }

    element.hidden =
      !visible;

    /*
      بعض CSSها ممکن است hidden را override کنند.
      بنابراین display را نیز کنترل می‌کنیم.
    */

    if (visible) {

      element.style.display =
        '';

    } else {

      element.style.display =
        'none';

    }
  }


  /* =====================================================
     MESSAGE
  ===================================================== */

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
      'login-message';

    if (text) {

      messageEl.classList.add(
        type
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
        button => {

          button.disabled =
            busy;

        }
      );


    if (loadingEl) {

      loadingEl.hidden =
        !busy;

      loadingEl.style.display =
        busy
          ? ''
          : 'none';
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
     PASSWORD VALIDATION
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

    url.search = '';
    url.hash = '';

    return url.href;

  }


  /* =====================================================
     AUTH INTENT
  ===================================================== */

  function setAuthIntent(
    intent
  ) {

    try {

      localStorage.setItem(
        AUTH_INTENT_KEY,
        intent
      );

      localStorage.setItem(
        AUTH_INTENT_TIME_KEY,
        String(
          Date.now()
        )
      );

    }

    catch (error) {

      console.warn(
        'Could not save auth intent:',
        error
      );

    }

  }


  function getAuthIntent() {

    try {

      const intent =
        localStorage.getItem(
          AUTH_INTENT_KEY
        );

      const time =
        Number(
          localStorage.getItem(
            AUTH_INTENT_TIME_KEY
          ) || 0
        );


      if (!intent) {

        return null;

      }


      /*
        Intentهای قدیمی نباید رفتار جدید ایجاد کنند.
      */

      if (
        !time ||
        Date.now() - time >
        INTENT_TTL
      ) {

        clearAuthIntent();

        return null;

      }


      return intent;

    }

    catch (error) {

      return null;

    }

  }


  function clearAuthIntent() {

    try {

      localStorage.removeItem(
        AUTH_INTENT_KEY
      );

      localStorage.removeItem(
        AUTH_INTENT_TIME_KEY
      );

    }

    catch (error) {

      console.warn(
        'Could not clear auth intent:',
        error
      );

    }

  }


  /* =====================================================
     URL CALLBACK
  ===================================================== */

  function hasAuthCallback() {

    const url =
      new URL(
        window.location.href
      );


    if (
      url.searchParams.has(
        'code'
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


    if (
      url.searchParams.get(
        'type'
      ) ===
      'recovery'
    ) {

      return true;

    }


    return false;

  }


  /* =====================================================
     RECOVERY CALLBACK DETECTION
  ===================================================== */

  function isRecoveryCallback() {

    const url =
      new URL(
        window.location.href
      );


    /*
      روش قدیمی / implicit
    */

    if (
      url.hash.includes(
        'type=recovery'
      )
    ) {

      return true;

    }


    if (
      url.searchParams.get(
        'type'
      ) ===
      'recovery'
    ) {

      return true;

    }


    /*
      روش PKCE:

      لینک Recovery با code می‌آید.
      در این حالت intent ذخیره‌شده تعیین‌کننده است.
    */

    if (
      url.searchParams.has(
        'code'
      ) &&
      getAuthIntent() ===
      'recovery'
    ) {

      return true;

    }


    return false;

  }


  /* =====================================================
     CLEAN URL
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
        url.pathname
      );

    }

    catch (error) {

      console.warn(
        'Could not clean auth URL:',
        error
      );

    }

  }


  /* =====================================================
     LOGIN MODE
  ===================================================== */

  function showLoginMode() {

    recoveryMode =
      false;


    setVisible(
      loginForm,
      true
    );

    setVisible(
      registerForm,
      false
    );

    setVisible(
      resetForm,
      false
    );


    if (modeSwitch) {

      modeSwitch.hidden =
        false;

      modeSwitch.style.display =
        '';

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

  }


  /* =====================================================
     REGISTER MODE
  ===================================================== */

  function showRegisterMode() {

    if (recoveryMode) {
      return;
    }


    setVisible(
      loginForm,
      false
    );

    setVisible(
      registerForm,
      true
    );

    setVisible(
      resetForm,
      false
    );


    if (modeSwitch) {

      modeSwitch.hidden =
        false;

      modeSwitch.style.display =
        '';

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
     RECOVERY MODE
  ===================================================== */

  function showRecoveryMode() {

    recoveryMode =
      true;


    /*
      بسیار مهم:
      هیچ فرم دیگری نباید دیده شود.
    */

    setVisible(
      loginForm,
      false
    );

    setVisible(
      registerForm,
      false
    );

    setVisible(
      resetForm,
      true
    );


    if (modeSwitch) {

      modeSwitch.hidden =
        true;

      modeSwitch.style.display =
        'none';

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
      150
    );

  }


  /* =====================================================
     PROFILE
  ===================================================== */

  async function getProfile(
    userId
  ) {

    if (!userId) {
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


      if (result.error) {

        console.error(
          'Profile error:',
          result.error
        );

        return null;

      }


      return result.data || null;

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
     CONTINUE WITH AUTHENTICATED USER
  ===================================================== */

  async function continueWithUser(
    user
  ) {

    /*
      NEVER redirect during Recovery.
    */

    if (recoveryMode) {

      console.log(
        'Recovery active: redirect blocked.'
      );

      return;

    }


    /*
      اگر intent هنوز recovery باشد،
      حتی اگر recoveryMode به هر دلیل false شده باشد،
      Redirect ممنوع است.
    */

    if (
      getAuthIntent() ===
      'recovery'
    ) {

      console.log(
        'Recovery intent detected: redirect blocked.'
      );

      showRecoveryMode();

      return;

    }


    if (!user) {

      setBusy(
        false
      );

      return;

    }


    if (redirecting) {

      return;

    }


    /*
      بررسی پروفایل
    */

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
        'حساب کاربری پیدا شد اما پروفایل سامانه برای آن وجود ندارد.'
      );


      return;

    }


    /*
      بررسی وضعیت حساب
    */

    if (
      profile.status !==
      'active'
    ) {

      await supabase.auth.signOut();


      setBusy(
        false
      );


      const statusMessages = {

        pending:
          'حساب شما در انتظار تأیید مالک سامانه است.',

        suspended:
          'دسترسی حساب شما موقتاً متوقف شده است.',

        disabled:
          'دسترسی حساب شما غیرفعال شده است.'

      };


      showMessage(
        statusMessages[
          profile.status
        ] ||
        'دسترسی این حساب فعال نیست.'
      );


      return;

    }


    redirecting =
      true;


    clearAuthIntent();

    cleanAuthUrl();


    /*
      ورود موفق
    */

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


    if (!email) {

      showMessage(
        'ایمیل را وارد کنید.'
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


    if (!password) {

      showMessage(
        'رمز عبور را وارد کنید.'
      );

      return;

    }


    setBusy(
      true
    );


    try {

      /*
        Login معمولی
      */

      clearAuthIntent();


      const result =
        await supabase.auth
          .signInWithPassword({

            email,
            password

          });


      if (result.error) {

        console.error(
          'Login error:',
          result.error
        );


        setBusy(
          false
        );


        showMessage(
          'ایمیل یا رمز عبور صحیح نیست.'
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
        'Login exception:',
        error
      );


      setBusy(
        false
      );


      showMessage(
        'خطا هنگام ورود به سامانه.'
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


    if (busy || recoveryMode) {
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


    const passwordError =
      validatePassword(
        password
      );


    if (passwordError) {

      showMessage(
        passwordError
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

              phone:
                phone

            }

          }

        });


      if (result.error) {

        setBusy(
          false
        );


        showMessage(
          result.error.message ||
          'ثبت‌نام انجام نشد.'
        );

        return;

      }


      if (
        result.data?.session &&
        result.data?.user
      ) {

        await continueWithUser(
          result.data.user
        );

        return;

      }


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
        'Register exception:',
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

    if (
      busy ||
      recoveryMode
    ) {
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

      /*
        مشخص می‌کنیم این Callback
        مربوط به Magic Link است.
      */

      setAuthIntent(
        'magic'
      );


      const result =
        await supabase.auth
          .signInWithOtp({

            email,

            options: {

              emailRedirectTo:
                getLoginUrl(),

              shouldCreateUser:
                false

            }

          });


      if (result.error) {

        clearAuthIntent();

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
        'لینک ورود به ایمیل شما ارسال شد. ایمیل خود را بررسی کنید.',
        'success'
      );

    }

    catch (error) {

      clearAuthIntent();

      setBusy(
        false
      );


      showMessage(
        'خطا هنگام ارسال لینک ورود.'
      );

    }

  }


  /* =====================================================
     PASSWORD RESET REQUEST
  ===================================================== */

  async function sendResetLink() {

    if (
      busy ||
      recoveryMode
    ) {
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

      /*
        مهم‌ترین بخش:

        قبل از ارسال ایمیل مشخص می‌کنیم
        Callback آینده Recovery است.
      */

      setAuthIntent(
        'recovery'
      );


      const result =
        await supabase.auth
          .resetPasswordForEmail(

            email,

            {

              redirectTo:
                getLoginUrl()

            }

          );


      if (result.error) {

        clearAuthIntent();

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

      clearAuthIntent();

      setBusy(
        false
      );


      showMessage(
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
        'جلسه بازیابی رمز معتبر نیست. دوباره درخواست بازیابی کنید.'
      );

      return;

    }


    const password =
      $('resetPassword')?.value ||
      '';


    const confirm =
      $('resetPasswordConfirm')?.value ||
      '';


    const passwordError =
      validatePassword(
        password
      );


    if (passwordError) {

      showMessage(
        passwordError
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

      /*
        طبق Supabase:
        کاربر Recovery شده و اکنون
        رمز جدید را ثبت می‌کنیم.
      */

      const result =
        await supabase.auth
          .updateUser({

            password

          });


      if (result.error) {

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
        Recovery موفق
      */

      recoveryMode =
        false;


      clearAuthIntent();


      showMessage(
        'رمز عبور با موفقیت تغییر کرد. در حال ورود به سامانه…',
        'success'
      );


      /*
        Session جدید را می‌گیریم.
      */

      const sessionResult =
        await supabase.auth.getSession();


      const user =
        sessionResult.data
          ?.session
          ?.user;


      if (!user) {

        setBusy(
          false
        );


        showLoginMode();


        showMessage(
          'رمز عبور تغییر کرد. اکنون با رمز جدید وارد شوید.',
          'success'
        );


        return;

      }


      /*
        این بار اجازه Redirect داریم.
      */

      await continueWithUser(
        user
      );

    }

    catch (error) {

      console.error(
        'Password update exception:',
        error
      );


      setBusy(
        false
      );


      showMessage(
        'خطا هنگام تغییر رمز عبور.'
      );

    }

  }


  /* =====================================================
     AUTH STATE LISTENER
  ===================================================== */

  function setupAuthListener() {

    supabase.auth.onAuthStateChange(
      function (
        event,
        session
      ) {

        console.log(
          'ADINEH AUTH EVENT:',
          event
        );


        /* ===============================================
           PASSWORD RECOVERY
        =============================================== */

        if (
          event ===
          'PASSWORD_RECOVERY'
        ) {

          /*
            مهم‌ترین رویداد Recovery.
          */

          recoveryMode =
            true;


          clearAuthIntent();


          window.setTimeout(
            function () {

              /*
                Intent را دوباره recovery می‌کنیم
                تا SIGNED_IN احتمالی بعدی
                نتواند Redirect کند.
              */

              setAuthIntent(
                'recovery'
              );


              showRecoveryMode();

            },
            0
          );


          return;

        }


        /* ===============================================
           SIGNED IN
        =============================================== */

        if (
          event ===
          'SIGNED_IN'
        ) {

          const intent =
            getAuthIntent();


          /*
            Recovery:
            ورود خودکار ممنوع.
          */

          if (
            recoveryMode ||
            intent ===
            'recovery'
          ) {

            console.log(
              'Recovery SIGNED_IN: redirect blocked.'
            );


            recoveryMode =
              true;


            setAuthIntent(
              'recovery'
            );


            window.setTimeout(
              function () {

                showRecoveryMode();

              },
              0
            );


            return;

          }


          /*
            Magic Link
          */

          if (
            intent ===
            'magic'
          ) {

            clearAuthIntent();


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
            Login معمولی توسط تابع login
            مدیریت می‌شود.
          */

          return;

        }


        /* ===============================================
           INITIAL SESSION
        =============================================== */

        if (
          event ===
          'INITIAL_SESSION'
        ) {

          /*
            هرگز صرفاً به خاطر وجود Session
            کاربر را از صفحه Login به برنامه
            منتقل نمی‌کنیم.

            این یکی از مشکلات اصلی قبلی بود.
          */

          console.log(
            'Initial session loaded.'
          );


          /*
            اگر Recovery intent داریم،
            فرم Recovery را آماده نگه می‌داریم.
          */

          if (
            getAuthIntent() ===
            'recovery'
          ) {

            /*
              فقط اگر Callback داریم،
              Recovery را فعال می‌کنیم.
            */

            if (
              hasAuthCallback()
            ) {

              window.setTimeout(
                function () {

                  showRecoveryMode();

                },
                0
              );

            }

          }


          return;

        }


        /* ===============================================
           TOKEN REFRESHED
        =============================================== */

        if (
          event ===
          'TOKEN_REFRESHED'
        ) {

          return;

        }


        /* ===============================================
           USER UPDATED
        =============================================== */

        if (
          event ===
          'USER_UPDATED'
        ) {

          return;

        }


        /* ===============================================
           SIGNED OUT
        =============================================== */

        if (
          event ===
          'SIGNED_OUT'
        ) {

          redirecting =
            false;

          recoveryMode =
            false;

          clearAuthIntent();

          showLoginMode();

          setBusy(
            false
          );

        }

      }
    );

  }


  /* =====================================================
     CALLBACK INITIALIZATION
  ===================================================== */

  async function initializeCallback() {

    /*
      آیا URL شامل Callback است؟
    */

    const callback =
      hasAuthCallback();


    if (!callback) {

      return false;

    }


    /*
      Recovery را قبل از هر چیز تشخیص می‌دهیم.
    */

    if (
      isRecoveryCallback()
    ) {

      /*
        PKCE code توسط Supabase client
        با detectSessionInUrl پردازش می‌شود.
      */

      setAuthIntent(
        'recovery'
      );


      recoveryMode =
        true;


      /*
        فرم را فوراً آماده می‌کنیم.
        سپس PASSWORD_RECOVERY آن را تأیید می‌کند.
      */

      showRecoveryMode();


      /*
        URL را هنوز پاک نمی‌کنیم.
        Supabase باید code را پردازش کند.
      */

      return true;

    }


    /*
      Magic Link
    */

    if (
      getAuthIntent() ===
      'magic'
    ) {

      setBusy(
        true
      );


      showMessage(
        'در حال تکمیل ورود امن…',
        'success'
      );


      /*
        Supabase با detectSessionInUrl
        Callback را پردازش می‌کند.
      */

      return true;

    }


    return true;

  }


  /* =====================================================
     EVENT BINDING
  ===================================================== */

  function bindEvents() {


    /* Login mode */

    if (loginModeBtn) {

      loginModeBtn.addEventListener(
        'click',
        function () {

          clearAuthIntent();

          showLoginMode();

          showMessage(
            ''
          );

        }
      );

    }


    /* Register mode */

    if (registerModeBtn) {

      registerModeBtn.addEventListener(
        'click',
        function () {

          clearAuthIntent();

          showRegisterMode();

        }
      );

    }


    /* Login */

    if (loginForm) {

      loginForm.addEventListener(
        'submit',
        login
      );

    }


    /* Register */

    if (registerForm) {

      registerForm.addEventListener(
        'submit',
        register
      );

    }


    /* Reset */

    if (resetForm) {

      resetForm.addEventListener(
        'submit',
        updatePassword
      );

    }


    /* Magic Link */

    const magicLinkBtn =
      $('magicLinkBtn');


    if (magicLinkBtn) {

      magicLinkBtn.addEventListener(
        'click',
        sendMagicLink
      );

    }


    /* Forgot Password */

    const forgotBtn =
      $('forgotBtn');


    if (forgotBtn) {

      forgotBtn.addEventListener(
        'click',
        sendResetLink
      );

    }


    /* Back to Login */

    const backToLoginBtn =
      $('backToLoginBtn');


    if (backToLoginBtn) {

      backToLoginBtn.addEventListener(
        'click',
        async function () {

          recoveryMode =
            false;

          clearAuthIntent();


          /*
            Session Recovery را خارج می‌کنیم
            تا صفحه ورود تمیز باشد.
          */

          try {

            await supabase.auth.signOut();

          }

          catch (error) {

            console.warn(
              'Sign out after recovery cancel:',
              error
            );

          }


          cleanAuthUrl();


          showLoginMode();

          setBusy(
            false
          );


          showMessage(
            ''
          );

        }
      );

    }

  }


  /* =====================================================
     BOOT
  ===================================================== */

  async function boot() {

    /*
      Listener باید قبل از Callback فعال شود.
    */

    setupAuthListener();


    /*
      فرم پایه
    */

    showLoginMode();


    setBusy(
      false
    );


    /*
      Callback را بررسی می‌کنیم.
    */

    await initializeCallback();


    /*
      اگر Recovery است،
      فرم Recovery باید باقی بماند.
    */

    if (
      recoveryMode
    ) {

      showRecoveryMode();

      return;

    }


    /*
      اگر Magic Link است،
      منتظر SIGNED_IN می‌مانیم.
    */

    if (
      getAuthIntent() ===
      'magic' &&
      hasAuthCallback()
    ) {

      setBusy(
        true
      );

      return;

    }


    /*
      پیام URL
    */

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

      console.warn(
        'URL message error:',
        error
      );

    }

  }


  /* =====================================================
     START
  ===================================================== */

  bindEvents();

  boot();

})();
