'use strict';

/* =========================================================
   ADINEH POULTRY - AUTH SYSTEM
   Supabase Auth / PKCE / Password Recovery
   ========================================================= */

(() => {

  const supabase = window.adinehSupabase;

  if (!supabase) {
    console.error('Supabase client not found.');
    return;
  }

  /* =======================================================
     DOM
     ======================================================= */

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const resetForm = document.getElementById('resetForm');

  const loginModeBtn = document.getElementById('loginModeBtn');
  const registerModeBtn = document.getElementById('registerModeBtn');

  const magicLinkBtn = document.getElementById('magicLinkBtn');
  const forgotBtn = document.getElementById('forgotBtn');
  const backToLoginBtn = document.getElementById('backToLoginBtn');

  const messageEl = document.getElementById('message');
  const loadingEl = document.getElementById('loading');

  const modeTitle = document.getElementById('modeTitle');
  const modeText = document.getElementById('modeText');
  const modeSwitch = document.getElementById('modeSwitch');


  /* =======================================================
     STATE
     ======================================================= */

  let busy = false;
  let recoveryMode = false;
  let redirecting = false;


  /* =======================================================
     STORAGE KEYS
     ======================================================= */

  const AUTH_INTENT = 'adineh_auth_intent';
  const RECOVERY_INTENT = 'recovery';

  const INTENT_TTL = 30 * 60 * 1000;


  /* =======================================================
     HELPERS
     ======================================================= */

  function emailValue(id) {
    return String(
      document.getElementById(id)?.value || ''
    ).trim().toLowerCase();
  }


  function showMessage(text = '', type = 'error') {

    if (!messageEl) return;

    messageEl.textContent = text;

    messageEl.className = 'login-message';

    if (text) {
      messageEl.classList.add(type);
    }
  }


  function setBusy(value) {

    busy = Boolean(value);

    document
      .querySelectorAll('button')
      .forEach(button => {
        button.disabled = busy;
      });

    if (loadingEl) {
      loadingEl.hidden = !busy;
      loadingEl.style.display = busy ? '' : 'none';
    }
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


  /* =======================================================
     AUTH INTENT
     ======================================================= */

  function setIntent(value) {

    try {

      localStorage.setItem(
        AUTH_INTENT,
        JSON.stringify({
          value,
          time: Date.now()
        })
      );

    } catch (e) {
      console.warn('Cannot save auth intent.', e);
    }

  }


  function getIntent() {

    try {

      const raw =
        localStorage.getItem(AUTH_INTENT);

      if (!raw) return null;

      const data = JSON.parse(raw);

      if (!data?.time || !data?.value) {
        return null;
      }

      if (
        Date.now() - data.time >
        INTENT_TTL
      ) {
        clearIntent();
        return null;
      }

      return data.value;

    } catch (e) {

      return null;

    }

  }


  function clearIntent() {

    try {
      localStorage.removeItem(AUTH_INTENT);
    } catch (e) {
      console.warn(e);
    }

  }


  /* =======================================================
     URL
     ======================================================= */

  function currentLoginUrl() {

    return new URL(
      'login.html',
      window.location.href
    ).href;

  }


  function hasCodeInUrl() {

    return new URL(
      window.location.href
    ).searchParams.has('code');

  }


  function cleanCodeFromUrl() {

    try {

      const url =
        new URL(window.location.href);

      url.searchParams.delete('code');

      url.searchParams.delete('type');

      url.searchParams.delete('error');

      url.searchParams.delete('error_code');

      url.searchParams.delete('error_description');

      window.history.replaceState(
        {},
        document.title,
        url.pathname
      );

    } catch (e) {
      console.warn(e);
    }

  }


  /* =======================================================
     FORM MODES
     ======================================================= */

  function showLogin() {

    recoveryMode = false;

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

    if (recoveryMode) return;

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


  function showRecovery() {

    recoveryMode = true;

    /*
      در Recovery هیچ فرم دیگری نباید دیده شود.
    */

    if (loginForm) {
      loginForm.hidden = true;
      loginForm.style.display = 'none';
    }

    if (registerForm) {
      registerForm.hidden = true;
      registerForm.style.display = 'none';
    }

    if (resetForm) {
      resetForm.hidden = false;
      resetForm.style.display = '';
    }

    if (modeSwitch) {
      modeSwitch.hidden = true;
      modeSwitch.style.display = 'none';
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
      'لینک بازیابی معتبر است. رمز جدید خود را تعیین کنید.',
      'success'
    );

    setBusy(false);

    setTimeout(() => {

      document
        .getElementById('resetPassword')
        ?.focus();

    }, 100);

  }


  /* =======================================================
     PROFILE
     ======================================================= */

  async function getProfile(userId) {

    const { data, error } =
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


  /* =======================================================
     REDIRECT AFTER NORMAL LOGIN
     ======================================================= */

  async function continueToApp(user) {

    if (!user) {
      setBusy(false);
      return;
    }

    /*
      Recovery هرگز از این مسیر Redirect نمی‌شود.
    */

    if (recoveryMode) {
      return;
    }

    if (
      getIntent() === RECOVERY_INTENT
    ) {

      showRecovery();
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
        'حساب احراز شد اما پروفایل کاربری شما در سامانه وجود ندارد.'
      );

      return;

    }

    if (
      profile.status !== 'active'
    ) {

      await supabase.auth.signOut();

      setBusy(false);

      const messages = {
        pending:
          'حساب شما هنوز توسط مالک سامانه تأیید نشده است.',
        suspended:
          'دسترسی حساب شما متوقف شده است.',
        disabled:
          'حساب شما غیرفعال شده است.'
      };

      showMessage(
        messages[profile.status] ||
        'دسترسی حساب شما فعال نیست.'
      );

      return;

    }

    redirecting = true;

    clearIntent();

    cleanCodeFromUrl();

    window.location.replace(
      'index.html'
    );

  }


  /* =======================================================
     NORMAL LOGIN
     ======================================================= */

  async function login(event) {

    event.preventDefault();

    if (busy || recoveryMode) {
      return;
    }

    showMessage('');

    const email =
      emailValue('loginEmail');

    const password =
      document.getElementById(
        'loginPassword'
      )?.value || '';

    if (!email) {
      showMessage('ایمیل را وارد کنید.');
      return;
    }

    if (!validEmail(email)) {
      showMessage('فرمت ایمیل صحیح نیست.');
      return;
    }

    if (!password) {
      showMessage('رمز عبور را وارد کنید.');
      return;
    }

    setBusy(true);

    clearIntent();

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
          'SUPABASE LOGIN ERROR:',
          error
        );

        setBusy(false);

        /*
          پیام واقعی‌تر برای کاربر
        */

        if (
          error.code ===
          'invalid_credentials'
        ) {

          showMessage(
            'ایمیل یا رمز عبور صحیح نیست.'
          );

        } else {

          showMessage(
            error.message ||
            'ورود انجام نشد.'
          );

        }

        return;
      }

      await continueToApp(
        data.user
      );

    } catch (error) {

      console.error(
        'LOGIN EXCEPTION:',
        error
      );

      setBusy(false);

      showMessage(
        error.message ||
        'خطا هنگام ورود به سامانه.'
      );

    }

  }


  /* =======================================================
     PASSWORD RECOVERY REQUEST
     ======================================================= */

  async function requestPasswordReset() {

    if (busy || recoveryMode) {
      return;
    }

    showMessage('');

    const email =
      emailValue('loginEmail');

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

    /*
      قبل از ارسال لینک،
      نوع Callback را ذخیره می‌کنیم.
    */

    setIntent(
      RECOVERY_INTENT
    );

    try {

      const {
        error
      } =
        await supabase.auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo:
                currentLoginUrl()
            }
          );

      if (error) {

        clearIntent();

        console.error(
          'RESET REQUEST ERROR:',
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

      clearIntent();

      setBusy(false);

      console.error(error);

      showMessage(
        error.message ||
        'خطا هنگام ارسال لینک بازیابی.'
      );

    }

  }


  /* =======================================================
     PASSWORD UPDATE
     ======================================================= */

  async function updatePassword(event) {

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
      document.getElementById(
        'resetPassword'
      )?.value || '';

    const confirm =
      document.getElementById(
        'resetPasswordConfirm'
      )?.value || '';

    const passwordError =
      validPassword(password);

    if (passwordError) {

      showMessage(
        passwordError
      );

      return;
    }

    if (password !== confirm) {

      showMessage(
        'تکرار رمز عبور یکسان نیست.'
      );

      return;
    }

    setBusy(true);

    try {

      /*
        این دقیقاً API رسمی Supabase
        برای تغییر رمز کاربر احراز‌شده است.
      */

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
          'UPDATE PASSWORD ERROR:',
          error
        );

        setBusy(false);

        showMessage(
          error.message ||
          'تغییر رمز عبور انجام نشد.'
        );

        return;
      }

      if (!data?.user) {

        setBusy(false);

        showMessage(
          'رمز تغییر نکرد. لطفاً دوباره تلاش کنید.'
        );

        return;
      }

      /*
        رمز با موفقیت تغییر کرد.
      */

      recoveryMode = false;

      clearIntent();

      showMessage(
        'رمز عبور با موفقیت تغییر کرد. در حال ورود…',
        'success'
      );

      await continueToApp(
        data.user
      );

    } catch (error) {

      console.error(
        'UPDATE PASSWORD EXCEPTION:',
        error
      );

      setBusy(false);

      showMessage(
        error.message ||
        'خطا هنگام تغییر رمز عبور.'
      );

    }

  }


  /* =======================================================
     AUTH STATE CHANGE
     ======================================================= */

  function setupAuthListener() {

    supabase.auth.onAuthStateChange(
      (event, session) => {

        console.log(
          'ADINEH AUTH EVENT:',
          event
        );

        /*
          طبق مستندات Supabase:
          PASSWORD_RECOVERY رویداد اصلی
          برای نمایش صفحه تعیین رمز است.
        */

        if (
          event ===
          'PASSWORD_RECOVERY'
        ) {

          setIntent(
            RECOVERY_INTENT
          );

          showRecovery();

          return;
        }


        /*
          اگر Session مربوط به Recovery است،
          SIGNED_IN نباید کاربر را به index.html ببرد.
        */

        if (
          event === 'SIGNED_IN' &&
          (
            recoveryMode ||
            getIntent() === RECOVERY_INTENT
          )
        ) {

          showRecovery();

          return;
        }


        /*
          Magic Link یا ورود معمولی.
        */

        if (
          event === 'SIGNED_IN'
        ) {

          if (
            session?.user &&
            !recoveryMode
          ) {

            /*
              اجازه می‌دهیم تابع Login/Magic
              مسیر خودش را مدیریت کند.
            */

            if (
              getIntent() === 'magic'
            ) {

              clearIntent();

              setTimeout(() => {

                continueToApp(
                  session.user
                );

              }, 0);

            }

          }

          return;
        }


        if (
          event === 'SIGNED_OUT'
        ) {

          recoveryMode = false;
          redirecting = false;

          clearIntent();

          setBusy(false);

          showLogin();

        }

      }
    );

  }


  /* =======================================================
     MAGIC LINK
     ======================================================= */

  async function sendMagicLink() {

    if (
      busy ||
      recoveryMode
    ) {
      return;
    }

    const email =
      emailValue('loginEmail');

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

    setIntent('magic');

    try {

      const {
        error
      } =
        await supabase.auth
          .signInWithOtp({
            email,
            options: {
              emailRedirectTo:
                currentLoginUrl(),
              shouldCreateUser:
                false
            }
          });

      if (error) {

        clearIntent();

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

      clearIntent();

      setBusy(false);

      showMessage(
        error.message ||
        'خطا هنگام ارسال لینک ورود.'
      );

    }

  }


  /* =======================================================
     REGISTER
     ======================================================= */

  async function register(event) {

    event.preventDefault();

    if (
      busy ||
      recoveryMode
    ) {
      return;
    }

    showMessage('');

    const firstName =
      String(
        document.getElementById(
          'firstName'
        )?.value || ''
      ).trim();

    const lastName =
      String(
        document.getElementById(
          'lastName'
        )?.value || ''
      ).trim();

    const phone =
      String(
        document.getElementById(
          'registerPhone'
        )?.value || ''
      ).trim();

    const email =
      emailValue(
        'registerEmail'
      );

    const password =
      document.getElementById(
        'registerPassword'
      )?.value || '';

    const confirm =
      document.getElementById(
        'registerPasswordConfirm'
      )?.value || '';

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

    if (password !== confirm) {

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
                currentLoginUrl(),
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
          error.message ||
          'ثبت‌نام انجام نشد.'
        );

        return;
      }

      if (
        data?.session &&
        data?.user
      ) {

        await continueToApp(
          data.user
        );

        return;
      }

      setBusy(false);

      showLogin();

      showMessage(
        'حساب ایجاد شد. ایمیل خود را برای تأیید حساب بررسی کنید.',
        'success'
      );

    } catch (error) {

      setBusy(false);

      showMessage(
        error.message ||
        'خطا هنگام ثبت‌نام.'
      );

    }

  }


  /* =======================================================
     EVENTS
     ======================================================= */

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


  if (resetForm) {
    resetForm.addEventListener(
      'submit',
      updatePassword
    );
  }


  if (loginModeBtn) {

    loginModeBtn.addEventListener(
      'click',
      () => {

        clearIntent();

        showLogin();

      }
    );

  }


  if (registerModeBtn) {

    registerModeBtn.addEventListener(
      'click',
      () => {

        clearIntent();

        showRegister();

      }
    );

  }


  if (magicLinkBtn) {

    magicLinkBtn.addEventListener(
      'click',
      sendMagicLink
    );

  }


  if (forgotBtn) {

    forgotBtn.addEventListener(
      'click',
      requestPasswordReset
    );

  }


  if (backToLoginBtn) {

    backToLoginBtn.addEventListener(
      'click',
      async () => {

        recoveryMode = false;

        clearIntent();

        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn(e);
        }

        cleanCodeFromUrl();

        showLogin();

        setBusy(false);

        showMessage('');

      }
    );

  }


  /* =======================================================
     BOOT
     ======================================================= */

  async function boot() {

    /*
      Listener قبل از بررسی Session نصب می‌شود.
    */

    setupAuthListener();

    showLogin();

    setBusy(false);

    /*
      اگر URL دارای code است،
      Supabase با detectSessionInUrl آن را
      پردازش می‌کند و برای Recovery باید
      PASSWORD_RECOVERY ایجاد شود.
    */

    if (
      hasCodeInUrl()
    ) {

      /*
        اگر کاربر از قبل روی Forgot Password
        کلیک کرده باشد، intent recovery است.
      */

      if (
        getIntent() === RECOVERY_INTENT
      ) {

        recoveryMode = true;

        showRecovery();

      }

      /*
        URL را بلافاصله پاک نمی‌کنیم؛
        چون Supabase باید code را پردازش کند.
      */

      return;
    }

    /*
      اگر هیچ Callback نداریم،
      صفحه عادی Login باقی می‌ماند.
    */

    setBusy(false);

  }


  boot();

})();
