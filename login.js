'use strict';

(() => {

  const supabase =
    window.adinehSupabase;


  if (!supabase) {

    console.error(
      'ADINEH AUTH: Supabase client not found.'
    );

    return;

  }


  const $ =
    id => document.getElementById(id);


  const loginForm =
    $('loginForm');

  const registerForm =
    $('registerForm');

  const loginModeBtn =
    $('loginModeBtn');

  const registerModeBtn =
    $('registerModeBtn');

  const forgotBtn =
    $('forgotBtn');

  const magicLinkBtn =
    $('magicLinkBtn');

  const messageEl =
    $('message');

  const loadingEl =
    $('loading');

  const modeTitle =
    $('modeTitle');

  const modeText =
    $('modeText');


  let busy = false;

  let redirecting = false;


  /* =====================================================
     MESSAGE
  ===================================================== */

  function message(
    text = '',
    type = 'error'
  ) {

    if (!messageEl)
      return;


    messageEl.textContent =
      text;


    messageEl.className =
      'message';


    if (text) {

      messageEl.classList.add(
        'show',
        type
      );

    }

  }


  /* =====================================================
     BUSY
  ===================================================== */

  function setBusy(
    state
  ) {

    busy =
      Boolean(state);


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

      loadingEl.classList.toggle(
        'show',
        busy
      );

    }

  }


  /* =====================================================
     EMAIL
  ===================================================== */

  function emailFrom(
    id
  ) {

    return String(
      $(id)?.value || ''
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


  /* =====================================================
     URLS
  ===================================================== */

  function loginUrl() {

    return new URL(
      'login.html',
      window.location.href
    ).href;

  }


  function resetPasswordUrl() {

    return new URL(
      'reset-password.html',
      window.location.href
    ).href;

  }


  /* =====================================================
     SWITCH MODE
  ===================================================== */

  function showLogin() {

    loginForm.hidden =
      false;

    registerForm.hidden =
      true;


    loginModeBtn.classList.add(
      'active'
    );

    registerModeBtn.classList.remove(
      'active'
    );


    modeTitle.textContent =
      'ورود به سامانه';


    modeText.textContent =
      'برای ورود، ایمیل و رمز عبور خود را وارد کنید.';


    message('');

  }


  function showRegister() {

    loginForm.hidden =
      true;

    registerForm.hidden =
      false;


    loginModeBtn.classList.remove(
      'active'
    );

    registerModeBtn.classList.add(
      'active'
    );


    modeTitle.textContent =
      'ایجاد حساب کاربری';


    modeText.textContent =
      'پس از ثبت‌نام، حساب شما توسط مالک سامانه بررسی و فعال می‌شود.';


    message('');

  }


  /* =====================================================
     OPEN APPLICATION
  ===================================================== */

  function openApplication() {

    if (redirecting)
      return;


    redirecting =
      true;


    setBusy(true);


    window.location.replace(
      'index.html'
    );

  }


  /* =====================================================
     LOGIN
  ===================================================== */

  async function handleLogin(
    event
  ) {

    event.preventDefault();


    if (busy)
      return;


    message('');


    const email =
      emailFrom(
        'loginEmail'
      );


    const password =
      String(
        $('loginPassword')?.value || ''
      );


    if (!email) {

      message(
        'ایمیل را وارد کنید.'
      );

      return;

    }


    if (!validEmail(email)) {

      message(
        'فرمت ایمیل صحیح نیست.'
      );

      return;

    }


    if (!password) {

      message(
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
          'LOGIN ERROR:',
          error
        );


        setBusy(false);


        message(
          'ایمیل یا رمز عبور اشتباه است.'
        );


        return;

      }


      if (!data?.session) {

        setBusy(false);


        message(
          'ورود انجام نشد؛ نشست کاربر ایجاد نشد.'
        );


        return;

      }


      openApplication();


    }

    catch (error) {

      console.error(
        'LOGIN EXCEPTION:',
        error
      );


      setBusy(false);


      message(
        'خطایی هنگام ورود رخ داد. دوباره تلاش کنید.'
      );

    }

  }


  /* =====================================================
     MAGIC LINK
  ===================================================== */

  async function handleMagicLink() {

    if (busy)
      return;


    const email =
      emailFrom(
        'loginEmail'
      );


    if (!email) {

      message(
        'ابتدا ایمیل خود را وارد کنید.'
      );

      return;

    }


    if (!validEmail(email)) {

      message(
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
          'MAGIC LINK ERROR:',
          error
        );


        setBusy(false);


        message(
          error.message ||
          'ارسال لینک ورود انجام نشد.'
        );


        return;

      }


      setBusy(false);


      message(
        'لینک ورود به ایمیل شما ارسال شد.',
        'success'
      );

    }

    catch (error) {

      console.error(
        error
      );


      setBusy(false);


      message(
        'خطایی هنگام ارسال لینک ورود رخ داد.'
      );

    }

  }


  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */

  async function handleForgotPassword() {

    if (busy)
      return;


    const email =
      emailFrom(
        'loginEmail'
      );


    if (!email) {

      message(
        'ابتدا ایمیل خود را وارد کنید.'
      );

      $('loginEmail')?.focus();

      return;

    }


    if (!validEmail(email)) {

      message(
        'فرمت ایمیل صحیح نیست.'
      );

      return;

    }


    setBusy(true);


    try {

      const redirectTo =
        resetPasswordUrl();


      console.log(
        'RESET REDIRECT:',
        redirectTo
      );


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
          'RESET PASSWORD ERROR:',
          error
        );


        setBusy(false);


        message(
          error.message ||
          'ارسال لینک بازیابی انجام نشد.'
        );


        return;

      }


      setBusy(false);


      message(
        'لینک بازیابی رمز عبور ارسال شد. ایمیل خود را بررسی کنید.',
        'success'
      );

    }

    catch (error) {

      console.error(
        error
      );


      setBusy(false);


      message(
        'خطایی هنگام ارسال لینک بازیابی رخ داد.'
      );

    }

  }


  /* =====================================================
     REGISTER
  ===================================================== */

  async function handleRegister(
    event
  ) {

    event.preventDefault();


    if (busy)
      return;


    const firstName =
      String(
        $('firstName')?.value || ''
      ).trim();


    const lastName =
      String(
        $('lastName')?.value || ''
      ).trim();


    const phone =
      String(
        $('registerPhone')?.value || ''
      ).trim();


    const email =
      emailFrom(
        'registerEmail'
      );


    const password =
      String(
        $('registerPassword')?.value || ''
      );


    const confirmation =
      String(
        $('registerPasswordConfirm')?.value || ''
      );


    if (
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {

      message(
        'لطفاً اطلاعات الزامی را کامل کنید.'
      );

      return;

    }


    if (!validEmail(email)) {

      message(
        'فرمت ایمیل صحیح نیست.'
      );

      return;

    }


    if (
      password.length < 8
    ) {

      message(
        'رمز عبور باید حداقل ۸ کاراکتر باشد.'
      );

      return;

    }


    if (
      password !==
      confirmation
    ) {

      message(
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
          'SIGNUP ERROR:',
          error
        );


        setBusy(false);


        message(
          error.message ||
          'ثبت‌نام انجام نشد.'
        );


        return;

      }


      /*
       * اگر Supabase به دلیل تنظیمات پروژه
       * Session ایجاد کرد، برای حساب تازه
       * به صورت خودکار وارد برنامه نمی‌شویم.
       */

      if (data?.session) {

        await supabase.auth
          .signOut();

      }


      setBusy(false);


      showLogin();


      message(
        'ثبت‌نام با موفقیت انجام شد. حساب شما برای تأیید به مالک سامانه ارسال شد.',
        'success'
      );

    }

    catch (error) {

      console.error(
        'SIGNUP EXCEPTION:',
        error
      );


      setBusy(false);


      message(
        'خطایی هنگام ثبت‌نام رخ داد.'
      );

    }

  }


  /* =====================================================
     AUTH CALLBACK
  ===================================================== */

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
         * Magic Link / Email confirmation
         */

        if (
          event ===
          'SIGNED_IN' &&
          session?.user
        ) {

          openApplication();

        }

      }
    );


  /* =====================================================
     INITIAL SESSION
  ===================================================== */

  async function initialize() {

    try {

      const {
        data,
        error
      } =
        await supabase.auth
          .getSession();


      if (error) {

        console.error(
          'SESSION ERROR:',
          error
        );

        return;

      }


      /*
       * اگر کاربر قبلاً وارد شده باشد،
       * login page دوباره نمایش داده نمی‌شود.
       */

      if (
        data?.session?.user
      ) {

        openApplication();

      }

    }

    catch (error) {

      console.error(
        'INITIAL AUTH ERROR:',
        error
      );

    }

  }


  /* =====================================================
     EVENTS
  ===================================================== */

  loginForm?.addEventListener(
    'submit',
    handleLogin
  );


  registerForm?.addEventListener(
    'submit',
    handleRegister
  );


  loginModeBtn?.addEventListener(
    'click',
    showLogin
  );


  registerModeBtn?.addEventListener(
    'click',
    showRegister
  );


  forgotBtn?.addEventListener(
    'click',
    handleForgotPassword
  );


  magicLinkBtn?.addEventListener(
    'click',
    handleMagicLink
  );


  /* =====================================================
     START
  ===================================================== */

  showLogin();

  initialize();

})();
