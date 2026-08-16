'use strict';

/*
  =========================================================
  ADINEH POULTRY
  Supabase Authentication
  Stable Authentication Version
  =========================================================
*/

(function () {

  const supabase =
    window.adinehSupabase;


  const $ =
    id =>
      document.getElementById(id);


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


  let redirecting =
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

    if (!messageEl)
      return;


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
            value;

        }
      );


    if (loading) {

      loading.hidden =
        !value;

    }

  }


  /*
    =======================================================
    REDIRECT TO APP
    =======================================================
  */

  function openApp() {

    if (redirecting)
      return;


    redirecting =
      true;


    setBusy(true);


    window.location.replace(
      'index.html'
    );

  }


  /*
    =======================================================
    SWITCH MODE
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

    event?.preventDefault();


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
          'ورود انجام نشد. ایمیل یا رمز عبور را بررسی کنید.'
        );


        return;

      }


      if (!data?.user) {

        setBusy(false);


        showMessage(
          'کاربر معتبر دریافت نشد.'
        );


        return;

      }


      /*
        Session توسط Supabase ذخیره شده است.
        ورود به برنامه.
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

    event?.preventDefault();


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
        new URL(
          'login.html',
          window.location.href
        ).href;


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
          'ثبت‌نام انجام نشد. اطلاعات را بررسی کنید.'
        );


        return;

      }


      /*
        اگر Session مستقیم ساخته شده باشد،
        حساب هنوز ممکن است نیاز به فعال‌سازی مالک داشته باشد.
      */

      if (data?.session) {

        try {

          await supabase.auth
            .signOut();

        }

        catch (signOutError) {

          console.error(
            'Registration signOut:',
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
        'ثبت‌نام انجام شد. ایمیل تأیید را بررسی کنید؛ پس از تأیید، حساب برای فعال‌سازی به مالک سامانه ارسال می‌شود.',
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
        new URL(
          'login.html',
          window.location.href
        ).href;


      const {
        error
      } =
        await supabase.auth
          .signInWithOtp({

            email,

            options: {

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


        showMessage(
          'ارسال لینک ورود انجام نشد.'
        );


        return;

      }


      showMessage(
        'لینک ورود به ایمیل شما ارسال شد. پس از بازکردن لینک، ورود به سامانه به‌صورت خودکار انجام می‌شود.',
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
        'خطایی هنگام ارسال لینک ورود رخ داد.'
      );

    }

  }


  /*
    =======================================================
    PASSWORD RESET
    =======================================================
  */

  async function resetPassword() {

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
        new URL(
          'login.html',
          window.location.href
        ).href;


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


      setBusy(false);


      if (error) {

        console.error(
          'Password reset error:',
          error
        );


        showMessage(
          'ارسال لینک بازیابی انجام نشد.'
        );


        return;

      }


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
        'خطایی هنگام ارسال لینک بازیابی رخ داد.'
      );

    }

  }


  /*
    =======================================================
    AUTH STATE LISTENER
    =======================================================
  */

  function listenForAuthChanges() {

    if (!supabase)
      return;


    supabase.auth
      .onAuthStateChange(
        (
          event,
          session
        ) => {

          console.log(
            'Supabase auth event:',
            event
          );


          /*
            SIGNED_IN:
            مخصوص ورود با رمز یا Magic Link
          */

          if (
            event === 'SIGNED_IN' &&
            session?.user
          ) {

            openApp();

          }

        }
      );

  }


  /*
    =======================================================
    BOOT
    =======================================================
  */

  async function boot() {

    if (!supabase) {

      showMessage(
        'سامانه احراز هویت بارگذاری نشده است.'
      );


      return;

    }


    try {

      /*
        مهم:
        Supabase ممکن است هنگام بازشدن لینک ایمیل
        هنوز Session موجود در URL را پردازش نکرده باشد.

        بنابراین getSession را بلافاصله با redirect
        انجام نمی‌دهیم و چند بار با فاصله کوتاه
        Session را بررسی می‌کنیم.
      */

      for (
        let attempt = 0;
        attempt < 20;
        attempt++
      ) {

        const {
          data,
          error
        } =
          await supabase.auth
            .getSession();


        if (error) {

          console.error(
            'getSession:',
            error
          );

        }


        if (
          data?.session?.user
        ) {

          openApp();

          return;

        }


        /*
          اگر URL حاوی کد/توکن احراز هویت باشد،
          به Supabase فرصت پردازش بده.
        */

        if (
          window.location.search.includes(
            'code='
          ) ||
          window.location.hash.includes(
            'access_token'
          )
        ) {

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                250
              )
          );


          continue;

        }


        break;

      }


      /*
        پیام redirect از auth.js
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


      showMessage(
        'بررسی وضعیت ورود با خطا مواجه شد.'
      );

    }

  }


  /*
    =======================================================
    INITIALIZATION
    =======================================================
  */

  if (
    loginModeBtn
  ) {

    loginModeBtn
      .addEventListener(
        'click',
        () =>
          switchMode(
            'login'
          )
      );

  }


  if (
    registerModeBtn
  ) {

    registerModeBtn
      .addEventListener(
        'click',
        () =>
          switchMode(
            'register'
          )
      );

  }


  if (
    loginForm
  ) {

    loginForm
      .addEventListener(
        'submit',
        login
      );

  }


  if (
    registerForm
  ) {

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


  switchMode(
    'login'
  );


  /*
    Listener باید قبل از boot
    فعال شود تا SIGNED_IN ناشی از
    لینک ایمیل را از دست ندهیم.
  */

  listenForAuthChanges();


  boot();

})();
