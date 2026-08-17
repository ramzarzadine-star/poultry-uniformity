'use strict';

/*
=========================================================
ADINEH POULTRY
PROFESSIONAL SUPABASE AUTH SYSTEM

Features:
- Email / Password Login
- Signup
- Magic Link
- Forgot Password
- Password Recovery
- Session Detection
- Session Persistence
- Safe Redirect
- Profile Validation
=========================================================
*/

(() => {

  const supabase =
    window.adinehSupabase;


  if (!supabase) {

    console.error(
      'ADINEH: Supabase client not available.'
    );

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

  let recoveryMode = false;

  let redirecting = false;


  /* =====================================================
     HELPERS
  ===================================================== */

  function showMessage(
    text = '',
    type = 'error'
  ) {

    if (!messageEl) return;

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


  function getEmail(
    id
  ) {

    return String(
      document
        .getElementById(id)
        ?.value || ''
    )
      .trim()
      .toLowerCase();

  }


  function validEmail(
    email
  ) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);

  }


  function validPassword(
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


  function loginUrl() {

    return new URL(
      'login.html',
      window.location.href
    ).href;

  }


  /* =====================================================
     URL / CALLBACK DETECTION
  ===================================================== */

  function getUrlData() {

    const url =
      new URL(
        window.location.href
      );

    const query =
      Object.fromEntries(
        url.searchParams.entries()
      );

    const hashText =
      url.hash.startsWith('#')
        ? url.hash.substring(1)
        : url.hash;

    const hash =
      new URLSearchParams(
        hashText
      );

    return {

      query,

      hash,

      hasRecovery:
        query.type === 'recovery' ||
        hash.get('type') === 'recovery',

      hasAccessToken:
        Boolean(
          hash.get(
            'access_token'
          )
        ),

      hasError:
        Boolean(
          query.error ||
          hash.get('error')
        )

    };

  }


  function cleanAuthUrl() {

    try {

      const url =
        new URL(
          window.location.href
        );

      url.search = '';

      url.hash = '';

      window.history.replaceState(
        {},
        document.title,
        url.pathname
      );

    } catch (error) {

      console.warn(
        'URL cleanup failed:',
        error
      );

    }

  }


  /* =====================================================
     FORM CONTROL
  ===================================================== */

  function showLogin() {

    recoveryMode =
      false;

    if (loginForm) {

      loginForm.hidden =
        false;

      loginForm.style.display =
        '';

    }

    if (registerForm) {

      registerForm.hidden =
        true;

      registerForm.style.display =
        'none';

    }

    if (resetForm) {

      resetForm.hidden =
        true;

      resetForm.style.display =
        'none';

    }

    if (modeSwitch) {

      modeSwitch.hidden =
        false;

      modeSwitch.style.display =
        '';

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

      loginModeBtn.classList.add(
        'active'
      );

    }

    if (registerModeBtn) {

      registerModeBtn.classList.remove(
        'active'
      );

    }

  }


  function showRegister() {

    if (recoveryMode) {
      return;
    }

    if (loginForm) {

      loginForm.hidden =
        true;

      loginForm.style.display =
        'none';

    }

    if (registerForm) {

      registerForm.hidden =
        false;

      registerForm.style.display =
        '';

    }

    if (resetForm) {

      resetForm.hidden =
        true;

      resetForm.style.display =
        'none';

    }

    if (modeSwitch) {

      modeSwitch.hidden =
        false;

      modeSwitch.style.display =
        '';

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

      loginModeBtn.classList.remove(
        'active'
      );

    }

    if (registerModeBtn) {

      registerModeBtn.classList.add(
        'active'
      );

    }

    showMessage('');

  }


  function showRecovery() {

    recoveryMode =
      true;

    redirecting =
      false;

    if (loginForm) {

      loginForm.hidden =
        true;

      loginForm.style.display =
        'none';

    }

    if (registerForm) {

      registerForm.hidden =
        true;

      registerForm.style.display =
        'none';

    }

    if (resetForm) {

      resetForm.hidden =
        false;

      resetForm.style.display =
        '';

    }

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
        'رمز عبور جدید خود را انتخاب کنید.';

    }

    showMessage(
      'هویت شما تأیید شد. رمز عبور جدید را وارد کنید.',
      'success'
    );

    setBusy(false);

    setTimeout(
      () => {

        document
          .getElementById(
            'resetPassword'
          )
          ?.focus();

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
        'PROFILE ERROR:',
        error
      );

      return null;

    }

    return data;

  }


  /* =====================================================
     GO TO APPLICATION
  ===================================================== */

  async function goToApplication(
    user
  ) {

    if (!user) {

      setBusy(false);

      return;

    }


    if (recoveryMode) {

      return;

    }


    if (redirecting) {

      return;

    }


    const profile =
      await getProfile(
        user.id
      );


    if (!profile) {

      await supabase.auth
        .signOut();

      setBusy(false);

      showMessage(
        'ورود احراز شد اما پروفایل کاربری شما در سامانه پیدا نشد.'
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
          'حساب شما هنوز توسط مالک سامانه تأیید نشده است.',

        suspended:
          'دسترسی حساب شما متوقف شده است.',

        disabled:
          'حساب شما غیرفعال شده است.'

      };

      showMessage(
        messages[
          profile.status
        ] ||
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
     EMAIL / PASSWORD LOGIN
  ===================================================== */

  async function login(
    event
  ) {

    event.preventDefault();

    if (
      busy ||
      recoveryMode
    ) {

      return;

    }

    showMessage('');

    const email =
      getEmail(
        'loginEmail'
      );

    const password =
      document
        .getElementById(
          'loginPassword'
        )
        ?.value || '';


    if (!email) {

      showMessage(
        'ایمیل را وارد کنید.'
      );

      return;

    }


    if (
      !validEmail(email)
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
          'LOGIN:',
          error
        );

        setBusy(false);

        showMessage(
          'ایمیل یا رمز عبور صحیح نیست.'
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

    if (
      busy ||
      recoveryMode
    ) {

      return;

    }


    showMessage('');


    const email =
      getEmail(
        'loginEmail'
      );


    if (!email) {

      showMessage(
        'ابتدا ایمیل خود را وارد کنید.'
      );

      document
        .getElementById(
          'loginEmail'
        )
        ?.focus();

      return;

    }


    if (
      !validEmail(email)
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
                loginUrl()
            }
          );


      if (error) {

        console.error(
          'PASSWORD RESET:',
          error
        );

        setBusy(false);

        showMessage(
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
        error
      );

      setBusy(false);

      showMessage(
        'خطایی هنگام ارسال لینک بازیابی رخ داد.'
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


    if (
      busy ||
      !recoveryMode
    ) {

      return;

    }


    const password =
      document
        .getElementById(
          'resetPassword'
        )
        ?.value || '';


    const confirmation =
      document
        .getElementById(
          'resetPasswordConfirm'
        )
        ?.value || '';


    const passwordError =
      validPassword(
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
      confirmation
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
          'UPDATE PASSWORD:',
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
          'تغییر رمز عبور تأیید نشد.'
        );

        return;

      }


      recoveryMode =
        false;

      cleanAuthUrl();

      showMessage(
        'رمز عبور با موفقیت تغییر کرد.',
        'success'
      );


      setTimeout(
        async () => {

          await goToApplication(
            data.user
          );

        },
        700
      );


    } catch (error) {

      console.error(
        error
      );

      setBusy(false);

      showMessage(
        'خطایی هنگام تغییر رمز عبور رخ داد.'
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


    const email =
      getEmail(
        'loginEmail'
      );


    if (!email) {

      showMessage(
        'ابتدا ایمیل خود را وارد کنید.'
      );

      return;

    }


    if (
      !validEmail(email)
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
                loginUrl(),

              shouldCreateUser:
                false

            }

          });


      if (error) {

        console.error(
          'MAGIC LINK:',
          error
        );

        setBusy(false);

        showMessage(
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

  async function register(
    event
  ) {

    event.preventDefault();


    if (
      busy ||
      recoveryMode
    ) {

      return;

    }


    showMessage('');


    const firstName =
      document
        .getElementById(
          'firstName'
        )
        ?.value
        .trim() || '';


    const lastName =
      document
        .getElementById(
          'lastName'
        )
        ?.value
        .trim() || '';


    const phone =
      document
        .getElementById(
          'registerPhone'
        )
        ?.value
        .trim() || '';


    const email =
      getEmail(
        'registerEmail'
      );


    const password =
      document
        .getElementById(
          'registerPassword'
        )
        ?.value || '';


    const confirmation =
      document
        .getElementById(
          'registerPasswordConfirm'
        )
        ?.value || '';


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


    if (
      !validEmail(email)
    ) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );

      return;

    }


    const passwordError =
      validPassword(
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
      confirmation
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
                loginUrl(),

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
          'REGISTER:',
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
        data?.session &&
        data?.user
      ) {

        await goToApplication(
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

      console.error(
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
          -----------------------------------------------
          Password Recovery
          -----------------------------------------------
          */

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {

            showRecovery();

            return;

          }


          /*
          -----------------------------------------------
          Signed Out
          -----------------------------------------------
          */

          if (
            event ===
            'SIGNED_OUT'
          ) {

            showLogin();

            setBusy(false);

            return;

          }


          /*
          -----------------------------------------------
          Signed In
          -----------------------------------------------
          */

          if (
            event ===
            'SIGNED_IN' &&
            session?.user
          ) {

            /*
              اگر URL فعلی Recovery باشد،
              هرگز به index نرو.
            */

            const url =
              getUrlData();


            if (
              url.hasRecovery
            ) {

              showRecovery();

              return;

            }


            /*
              اگر Recovery قبلاً تشخیص داده شده،
              باز هم Redirect ممنوع.
            */

            if (
              recoveryMode
            ) {

              return;

            }


            /*
              ورود معمولی / Magic Link
            */

            await goToApplication(
              session.user
            );

          }

        }
      );

  }


  /* =====================================================
     INITIAL SESSION CHECK
  ===================================================== */

  async function initializeAuth() {

    const url =
      getUrlData();


    /*
    ------------------------------------------------------
    اگر لینک Recovery است
    ------------------------------------------------------
    */

    if (
      url.hasRecovery
    ) {

      /*
        ابتدا Listener فعال شده است.
        Session باید توسط Supabase ساخته شده باشد.
      */

      const {
        data,
        error
      } =
        await supabase.auth
          .getSession();


      if (error) {

        console.error(
          'RECOVERY SESSION:',
          error
        );

        showMessage(
          'لینک بازیابی معتبر نیست یا منقضی شده است.'
        );

        setBusy(false);

        return;

      }


      if (
        data?.session
      ) {

        showRecovery();

        return;

      }


      showMessage(
        'جلسه بازیابی رمز پیدا نشد. لطفاً دوباره درخواست بازیابی کنید.'
      );

      setBusy(false);

      return;

    }


    /*
    ------------------------------------------------------
    اگر خطای Callback وجود دارد
    ------------------------------------------------------
    */

    if (
      url.hasError
    ) {

      const errorText =
        url.query.error_description ||
        url.hash.get(
          'error_description'
        ) ||
        'احراز هویت انجام نشد.';


      showMessage(
        decodeURIComponent(
          errorText
        )
      );

      cleanAuthUrl();

      setBusy(false);

      return;

    }


    /*
    ------------------------------------------------------
    Session معمولی
    ------------------------------------------------------
    */

    const {
      data,
      error
    } =
      await supabase.auth
        .getSession();


    if (error) {

      console.error(
        'GET SESSION:',
        error
      );

      setBusy(false);

      return;

    }


    if (
      data?.session?.user
    ) {

      await goToApplication(
        data.session.user
      );

      return;

    }


    showLogin();

    setBusy(false);

  }


  /* =====================================================
     EVENTS
  ===================================================== */

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


  loginModeBtn
    ?.addEventListener(
      'click',
      showLogin
    );


  registerModeBtn
    ?.addEventListener(
      'click',
      showRegister
    );


  forgotBtn
    ?.addEventListener(
      'click',
      forgotPassword
    );


  magicLinkBtn
    ?.addEventListener(
      'click',
      sendMagicLink
    );


  backToLoginBtn
    ?.addEventListener(
      'click',
      async () => {

        recoveryMode =
          false;

        await supabase.auth
          .signOut();

        cleanAuthUrl();

        showLogin();

        showMessage('');

      }
    );


  /* =====================================================
     START
  ===================================================== */

  async function start() {

    /*
      اول Listener
      سپس بررسی Session
    */

    setupAuthListener();

    showLogin();

    setBusy(false);

    await initializeAuth();

  }


  start();

})();
