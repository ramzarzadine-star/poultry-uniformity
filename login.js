'use strict';

/* =========================================================
   ADINEH POULTRY
   LOGIN / SIGN UP / MAGIC LINK / PASSWORD RECOVERY
   ========================================================= */

(() => {

  const supabase = window.adinehSupabase;

  if (!supabase) {
    console.error('Supabase client not found.');
    return;
  }

  /* =====================================================
     DOM
  ===================================================== */

  const loginForm =
    document.getElementById('loginForm');

  const registerForm =
    document.getElementById('registerForm');

  const resetForm =
    document.getElementById('resetForm');

  const loginModeBtn =
    document.getElementById('loginModeBtn');

  const registerModeBtn =
    document.getElementById('registerModeBtn');

  const magicLinkBtn =
    document.getElementById('magicLinkBtn');

  const forgotBtn =
    document.getElementById('forgotBtn');

  const backToLoginBtn =
    document.getElementById('backToLoginBtn');

  const messageEl =
    document.getElementById('message');

  const loadingEl =
    document.getElementById('loading');

  const modeTitle =
    document.getElementById('modeTitle');

  const modeText =
    document.getElementById('modeText');

  const modeSwitch =
    document.getElementById('modeSwitch');


  /* =====================================================
     STATE
  ===================================================== */

  let busy = false;
  let redirecting = false;


  /* =====================================================
     HELPERS
  ===================================================== */

  function showMessage(
    text = '',
    type = 'error'
  ) {

    if (!messageEl) return;

    messageEl.textContent = text;

    messageEl.className =
      'login-message';

    if (text) {
      messageEl.classList.add(type);
    }
  }


  function setBusy(state) {

    busy = Boolean(state);

    document
      .querySelectorAll('button')
      .forEach(button => {
        button.disabled = busy;
      });

    if (loadingEl) {
      loadingEl.hidden = !busy;
      loadingEl.style.display =
        busy ? '' : 'none';
    }
  }


  function getValue(id) {

    return String(
      document.getElementById(id)?.value || ''
    ).trim();

  }


  function getEmail(id) {

    return getValue(id).toLowerCase();

  }


  function validEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  }


  function validPassword(password) {

    if (!password) {
      return 'رمز عبور را وارد کنید.';
    }

    if (password.length < 8) {
      return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
    }

    return '';

  }


  /*
   * صفحه اصلی بازیابی رمز عبور
   *
   * IMPORTANT:
   * لینک Reset دیگر به login.html نمی‌آید.
   */

  function getResetPasswordUrl() {

    return new URL(
      'reset-password.html',
      window.location.href
    ).href;

  }


  /*
   * لینک Callback ورود معمولی / Magic Link / ثبت‌نام
   */

  function getLoginUrl() {

    return new URL(
      'login.html',
      window.location.href
    ).href;

  }


  /* =====================================================
     FORM MODES
  ===================================================== */

  function showLogin() {

    if (loginForm) {
      loginForm.hidden = false;
      loginForm.style.display = '';
    }

    if (registerForm) {
      registerForm.hidden = true;
      registerForm.style.display = 'none';
    }

    if (resetForm) {
      resetForm.hidden = true;
      resetForm.style.display = 'none';
    }

    if (modeSwitch) {
      modeSwitch.hidden = false;
      modeSwitch.style.display = '';
    }

    if (modeTitle) {
      modeTitle.textContent =
        'ورود امن به سامانه';
    }

    if (modeText) {
      modeText.textContent =
        'برای ورود از ایمیل و رمز عبور حساب خود استفاده کنید.';
    }

    if (loginModeBtn) {
      loginModeBtn.classList.add('active');
    }

    if (registerModeBtn) {
      registerModeBtn.classList.remove('active');
    }

  }


  function showRegister() {

    if (loginForm) {
      loginForm.hidden = true;
      loginForm.style.display = 'none';
    }

    if (registerForm) {
      registerForm.hidden = false;
      registerForm.style.display = '';
    }

    if (resetForm) {
      resetForm.hidden = true;
      resetForm.style.display = 'none';
    }

    if (modeSwitch) {
      modeSwitch.hidden = false;
      modeSwitch.style.display = '';
    }

    if (modeTitle) {
      modeTitle.textContent =
        'ایجاد حساب کاربری';
    }

    if (modeText) {
      modeText.textContent =
        'اطلاعات خود را برای ایجاد حساب وارد کنید.';
    }

    if (loginModeBtn) {
      loginModeBtn.classList.remove('active');
    }

    if (registerModeBtn) {
      registerModeBtn.classList.add('active');
    }

    showMessage('');

  }


  /* =====================================================
     PROFILE
  ===================================================== */

  async function getProfile(userId) {

    const {
      data,
      error
    } = await supabase
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
      .eq('id', userId)
      .maybeSingle();

    if (error) {

      console.error(
        'PROFILE ERROR:',
        error
      );

      return null;
    }

    return data;

  }


  /* =====================================================
     REDIRECT TO APPLICATION
  ===================================================== */

  async function goToApplication(user) {

    if (!user) {
      setBusy(false);
      return;
    }

    if (redirecting) {
      return;
    }

    const profile =
      await getProfile(user.id);

    if (!profile) {

      await supabase.auth.signOut();

      setBusy(false);

      showMessage(
        'حساب وارد شد اما پروفایل کاربری شما در سامانه پیدا نشد.'
      );

      return;
    }


    /*
     * وضعیت حساب
     */

    if (
      profile.status &&
      profile.status !== 'active'
    ) {

      await supabase.auth.signOut();

      setBusy(false);

      const statusMessages = {

        pending:
          'حساب شما هنوز توسط مالک سامانه تأیید نشده است.',

        suspended:
          'دسترسی حساب شما متوقف شده است.',

        disabled:
          'حساب شما غیرفعال شده است.'

      };

      showMessage(
        statusMessages[profile.status] ||
        'دسترسی این حساب فعال نیست.'
      );

      return;
    }


    redirecting = true;

    window.location.replace(
      'index.html'
    );

  }


  /* =====================================================
     LOGIN
  ===================================================== */

  async function login(event) {

    event.preventDefault();

    if (busy) {
      return;
    }

    showMessage('');

    const email =
      getEmail('loginEmail');

    const password =
      getValue('loginPassword');


    if (!email) {

      showMessage(
        'ایمیل را وارد کنید.'
      );

      return;
    }


    if (!validEmail(email)) {

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


    setBusy(true);


    try {

      const {
        data,
        error
      } = await supabase.auth
        .signInWithPassword({
          email,
          password
        });


      if (error) {

        console.error(
          'SUPABASE LOGIN ERROR:',
          error
        );

        setBusy(false);

        /*
         * پیام کاربرپسند
         */

        if (
          error.code ===
          'invalid_credentials'
        ) {

          showMessage(
            'ایمیل یا رمز عبور اشتباه است.'
          );

        } else {

          showMessage(
            error.message ||
            'ورود انجام نشد.'
          );

        }

        return;
      }


      if (!data?.user) {

        setBusy(false);

        showMessage(
          'ورود انجام نشد.'
        );

        return;
      }


      await goToApplication(
        data.user
      );


    } catch (error) {

      console.error(
        'LOGIN EXCEPTION:',
        error
      );

      setBusy(false);

      showMessage(
        'خطایی هنگام ورود رخ داد. دوباره تلاش کنید.'
      );

    }

  }


  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */

  async function forgotPassword() {

    if (busy) {
      return;
    }

    showMessage('');


    const email =
      getEmail('loginEmail');


    if (!email) {

      showMessage(
        'ابتدا ایمیل خود را وارد کنید.'
      );

      document
        .getElementById('loginEmail')
        ?.focus();

      return;
    }


    if (!validEmail(email)) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );

      return;
    }


    setBusy(true);


    try {

      /*
       * =================================================
       * IMPORTANT
       *
       * Reset Password اکنون مستقیماً به
       * reset-password.html می‌رود.
       * =================================================
       */

      const redirectTo =
        getResetPasswordUrl();


      console.log(
        'PASSWORD RESET REDIRECT:',
        redirectTo
      );


      const {
        error
      } = await supabase.auth
        .resetPasswordForEmail(
          email,
          {
            redirectTo
          }
        );


      if (error) {

        console.error(
          'PASSWORD RESET ERROR:',
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
        'لینک بازیابی رمز عبور ارسال شد. ایمیل خود را بررسی کنید.',
        'success'
      );


    } catch (error) {

      console.error(
        'PASSWORD RESET EXCEPTION:',
        error
      );

      setBusy(false);

      showMessage(
        'خطایی هنگام ارسال لینک بازیابی رخ داد.'
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


    showMessage('');


    const email =
      getEmail('loginEmail');


    if (!email) {

      showMessage(
        'ابتدا ایمیل خود را وارد کنید.'
      );

      return;
    }


    if (!validEmail(email)) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );

      return;
    }


    setBusy(true);


    try {

      const {
        error
      } = await supabase.auth
        .signInWithOtp({
          email,
          options: {
            emailRedirectTo:
              getLoginUrl(),

            shouldCreateUser:
              false
          }
        });


      if (error) {

        console.error(
          'MAGIC LINK ERROR:',
          error
        );

        setBusy(false);

        showMessage(
          error.message ||
          'ارسال لینک ورود انجام نشد.'
        );

        return;
      }


      setBusy(false);

      showMessage(
        'لینک ورود به ایمیل شما ارسال شد.',
        'success'
      );


    } catch (error) {

      console.error(
        'MAGIC LINK EXCEPTION:',
        error
      );

      setBusy(false);

      showMessage(
        'خطایی هنگام ارسال لینک ورود رخ داد.'
      );

    }

  }


  /* =====================================================
     REGISTER
  ===================================================== */

  async function register(event) {

    event.preventDefault();

    if (busy) {
      return;
    }


    showMessage('');


    const firstName =
      getValue('firstName');

    const lastName =
      getValue('lastName');

    const phone =
      getValue('registerPhone');

    const email =
      getEmail('registerEmail');

    const password =
      getValue('registerPassword');

    const confirmPassword =
      getValue('registerPasswordConfirm');


    if (
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {

      showMessage(
        'لطفاً اطلاعات الزامی را کامل کنید.'
      );

      return;
    }


    if (!validEmail(email)) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );

      return;
    }


    const passwordError =
      validPassword(password);


    if (passwordError) {

      showMessage(
        passwordError
      );

      return;
    }


    if (
      password !==
      confirmPassword
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
      } = await supabase.auth
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
       * اگر Supabase فوراً Session ساخت
       */

      if (
        data?.session &&
        data?.user
      ) {

        await goToApplication(
          data.user
        );

        return;
      }


      /*
       * در حالت تأیید ایمیل
       */

      setBusy(false);

      showLogin();

      showMessage(
        'حساب شما ایجاد شد. ایمیل خود را برای تأیید حساب بررسی کنید.',
        'success'
      );


    } catch (error) {

      console.error(
        'REGISTER EXCEPTION:',
        error
      );

      setBusy(false);

      showMessage(
        'خطایی هنگام ثبت‌نام رخ داد.'
      );

    }

  }


  /* =====================================================
     AUTH STATE
  ===================================================== */

  function setupAuthListener() {

    supabase.auth
      .onAuthStateChange(
        async (
          event,
          session
        ) => {

          console.log(
            'ADINEH AUTH EVENT:',
            event
          );


          /*
           * اگر Magic Link یا Email Verification
           * به login.html برگشته باشد.
           */

          if (
            event ===
            'SIGNED_IN' &&
            session?.user
          ) {

            await goToApplication(
              session.user
            );

          }


          /*
           * خروج
           */

          if (
            event ===
            'SIGNED_OUT'
          ) {

            redirecting = false;

            setBusy(false);

            showLogin();

          }

        }
      );

  }


  /* =====================================================
     INITIAL SESSION
  ===================================================== */

  async function initialize() {

    /*
     * Listener ابتدا فعال می‌شود.
     */

    setupAuthListener();


    /*
     * صفحه Login
     */

    showLogin();

    setBusy(false);


    /*
     * Session موجود را بررسی می‌کنیم.
     *
     * اگر کاربر قبلاً وارد شده باشد،
     * برنامه مستقیماً باز می‌شود.
     */

    try {

      const {
        data,
        error
      } = await supabase.auth
        .getSession();


      if (error) {

        console.error(
          'GET SESSION ERROR:',
          error
        );

        return;
      }


      if (
        data?.session?.user
      ) {

        await goToApplication(
          data.session.user
        );

      }

    } catch (error) {

      console.error(
        'INITIAL AUTH ERROR:',
        error
      );

    }

  }


  /* =====================================================
     EVENTS
  ===================================================== */

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


  if (loginModeBtn) {

    loginModeBtn.addEventListener(
      'click',
      () => {

        showLogin();

      }
    );

  }


  if (registerModeBtn) {

    registerModeBtn.addEventListener(
      'click',
      () => {

        showRegister();

      }
    );

  }


  if (forgotBtn) {

    forgotBtn.addEventListener(
      'click',
      forgotPassword
    );

  }


  if (magicLinkBtn) {

    magicLinkBtn.addEventListener(
      'click',
      sendMagicLink
    );

  }


  if (backToLoginBtn) {

    backToLoginBtn.addEventListener(
      'click',
      async () => {

        try {

          await supabase.auth
            .signOut();

        } catch (error) {

          console.warn(
            error
          );

        }

        showLogin();

        showMessage('');

      }
    );

  }


  /* =====================================================
     START
  ===================================================== */

  initialize();

})();
