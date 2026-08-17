'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
LOGIN / REGISTER / MAGIC LINK
نسخه اصلاح‌شده
=========================================================
*/

(function () {

  /*
  ========================================================
  SUPABASE
  ========================================================
  */

  const supabase =
    window.supabaseClient ||
    window.adinehSupabase ||
    null;


  /*
  ========================================================
  DOM
  ========================================================
  */

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


  /*
  ========================================================
  STATE
  ========================================================
  */

  let redirecting =
    false;

  let bootFinished =
    false;


  /*
  ========================================================
  MESSAGE
  ========================================================
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
  ========================================================
  BUSY
  ========================================================
  */

  function setBusy(
    value
  ) {

    document
      .querySelectorAll('button')
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
  ========================================================
  LOGIN URL
  ========================================================
  */

  function getLoginRedirectUrl() {

    return new URL(
      'login.html',
      window.location.href
    ).href;

  }


  /*
  ========================================================
  OPEN APP
  ========================================================
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
  ========================================================
  SWITCH MODE
  ========================================================
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


  /*
  ========================================================
  GET SESSION
  ========================================================
  */

  async function getSession() {

    if (!supabase)
      return null;


    try {

      const {
        data,
        error
      } =
        await supabase.auth.getSession();


      if (error) {

        console.error(
          'getSession error:',
          error
        );

        return null;

      }


      return data?.session || null;

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
  ========================================================
  GET PROFILE
  ========================================================
  */

  async function getProfile(
    user
  ) {

    if (!user || !supabase)
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
            status,
            created_at,
            updated_at,
            last_seen_at
          `)
          .eq(
            'id',
            user.id
          )
          .maybeSingle();


      if (error) {

        console.error(
          'Profile query error:',
          error
        );

        return {
          __error: true,
          error
        };

      }


      return data || null;

    }

    catch (error) {

      console.error(
        'Profile exception:',
        error
      );

      return {
        __error: true,
        error
      };

    }

  }


  /*
  ========================================================
  CHECK EXISTING SESSION
  ========================================================
  */

  async function checkExistingSession() {

    const session =
      await getSession();


    if (!session?.user)
      return false;


    /*
      Session وجود دارد.
      اما قبل از index.html باید وضعیت
      پروفایل بررسی شود.
    */

    const profile =
      await getProfile(
        session.user
      );


    /*
      خطای واقعی دیتابیس را با
      "پروفایل وجود ندارد" اشتباه نگیریم.
    */

    if (
      profile?.__error
    ) {

      console.error(
        'Existing session profile error:',
        profile.error
      );


      setBusy(false);


      showMessage(
        'ورود انجام شده است، اما بررسی پروفایل کاربر با خطا مواجه شد. لطفاً اتصال سامانه را بررسی کنید.'
      );


      return true;

    }


    if (!profile) {

      /*
        Session معتبر است ولی profile وجود ندارد.
        در این حالت نباید loop ایجاد شود.
      */

      setBusy(false);


      showMessage(
        'حساب شما ایجاد شده است، اما پروفایل کاربری برای آن پیدا نشد. لطفاً حساب را در بخش مدیریت فعال کنید.'
      );


      return true;

    }


    if (
      profile.status !== 'active'
    ) {

      setBusy(false);


      showMessage(
        'حساب شما هنوز فعال نشده است.'
      );


      return true;

    }


    openApp();

    return true;

  }


  /*
  ========================================================
  PASSWORD LOGIN
  ========================================================
  */

  async function login(
    event
  ) {

    if (event)
      event.preventDefault();


    if (redirecting)
      return;


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


      if (!data?.user) {

        setBusy(false);


        showMessage(
          'کاربر معتبر دریافت نشد.'
        );


        return;

      }


      /*
        Session ساخته شده است.
        وضعیت profile را قبل از انتقال
        بررسی می‌کنیم.
      */

      const profile =
        await getProfile(
          data.user
        );


      if (
        profile?.__error
      ) {

        setBusy(false);


        showMessage(
          'ورود انجام شد، اما بررسی پروفایل با خطا مواجه شد.'
        );


        return;

      }


      if (!profile) {

        setBusy(false);


        showMessage(
          'ورود انجام شد، اما پروفایل این کاربر در سامانه وجود ندارد.'
        );


        return;

      }


      if (
        profile.status !== 'active'
      ) {

        setBusy(false);


        showMessage(
          'رمز صحیح است، اما حساب شما هنوز فعال نشده است.'
        );


        return;

      }


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
  ========================================================
  REGISTER
  ========================================================
  */

  async function register(
    event
  ) {

    if (event)
      event.preventDefault();


    if (redirecting)
      return;


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
        اگر Session ایجاد شده باشد،
        حساب هنوز باید توسط مالک فعال شود.
      */

      if (data?.session) {

        try {

          await supabase.auth
            .signOut();

        }

        catch (error) {

          console.error(
            'Registration signOut error:',
            error
          );

        }

      }


      setBusy(false);


      switchMode(
        'login'
      );


      showMessage(
        'ثبت‌نام انجام شد. حساب شما در انتظار تأیید و فعال‌سازی مالک سامانه است.',
        'success'
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
  ========================================================
  MAGIC LINK
  ========================================================
  */

  async function magicLink() {

    if (redirecting)
      return;


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


      const {
        data,
        error
      } =
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


      setBusy(false);


      if (error) {

        console.error(
          'Magic link error:',
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


      console.log(
        'Magic link sent:',
        data
      );


      showMessage(
        'لینک ورود به ایمیل شما ارسال شد. پس از باز کردن لینک، منتظر بررسی حساب بمانید.',
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
  ========================================================
  PASSWORD RESET
  ========================================================
  */

  async function resetPassword() {

    if (redirecting)
      return;


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
        'Password reset request:',
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
  ========================================================
  URL ERROR
  ========================================================
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
      search.get('error') ||
      hash.get('error');


    const errorDescription =
      search.get('error_description') ||
      hash.get('error_description');


    const errorCode =
      search.get('error_code') ||
      hash.get('error_code');


    if (
      error ||
      errorDescription
    ) {

      console.error(
        'Supabase authentication error:',
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
  ========================================================
  CALLBACK DETECTION
  ========================================================
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
  ========================================================
  WAIT FOR CALLBACK SESSION
  ========================================================
  */

  async function waitForCallbackSession() {

    for (
      let attempt = 0;
      attempt < 30;
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
  ========================================================
  AUTH STATE LISTENER
  ========================================================
  */

  function listenForAuthChanges() {

    if (!supabase)
      return;


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
              اینجا مستقیماً redirect نمی‌کنیم.
              ابتدا profile باید بررسی شود.
            */

            if (
              event === 'SIGNED_IN' &&
              session?.user
            ) {

              setTimeout(
                async () => {

                  if (redirecting)
                    return;


                  const profile =
                    await getProfile(
                      session.user
                    );


                  if (
                    profile?.__error
                  ) {

                    setBusy(false);


                    showMessage(
                      'ورود انجام شد، اما بررسی پروفایل با خطا مواجه شد.'
                    );


                    return;

                  }


                  if (!profile) {

                    setBusy(false);


                    showMessage(
                      'حساب شما وجود دارد، اما پروفایل کاربری برای آن پیدا نشد.'
                    );


                    return;

                  }


                  if (
                    profile.status !== 'active'
                  ) {

                    setBusy(false);


                    showMessage(
                      'حساب شما هنوز فعال نشده است.'
                    );


                    return;

                  }


                  openApp();

                },
                0
              );

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
  ========================================================
  BOOT
  ========================================================
  */

  async function boot() {

    if (bootFinished)
      return;


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
        خطای callback
      */

      if (
        checkUrlError()
      ) {

        setBusy(false);

        return;

      }


      /*
        اگر callback داریم،
        ابتدا اجازه می‌دهیم Supabase
        Session را پردازش کند.
      */

      if (
        hasAuthCallback()
      ) {

        setBusy(true);


        const callbackSession =
          await waitForCallbackSession();


        if (
          callbackSession?.user
        ) {

          const profile =
            await getProfile(
              callbackSession.user
            );


          if (
            profile?.__error
          ) {

            setBusy(false);


            showMessage(
              'لینک صحیح است، اما بررسی پروفایل کاربر با خطا مواجه شد.'
            );


            return;

          }


          if (!profile) {

            setBusy(false);


            showMessage(
              'ورود با لینک انجام شد، اما پروفایل کاربر پیدا نشد.'
            );


            return;

          }


          if (
            profile.status !== 'active'
          ) {

            setBusy(false);


            showMessage(
              'ورود با لینک انجام شد، اما حساب شما هنوز فعال نشده است.'
            );


            return;

          }


          openApp();

          return;

        }


        setBusy(false);


        showMessage(
          'لینک ورود دریافت شد، اما نشست کاربری ایجاد نشد. لطفاً لینک جدید درخواست کنید.'
        );


        return;

      }


      /*
        Session قبلی
      */

      const handled =
        await checkExistingSession();


      if (handled)
        return;


      /*
        پیام auth
      */

      const message =
        new URLSearchParams(
          window.location.search
        ).get('message');


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
  ========================================================
  EVENT BINDING
  ========================================================
  */

  if (loginModeBtn) {

    loginModeBtn.addEventListener(
      'click',
      () => {

        switchMode(
          'login'
        );

      }
    );

  }


  if (registerModeBtn) {

    registerModeBtn.addEventListener(
      'click',
      () => {

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
  ========================================================
  INITIAL STATE
  ========================================================
  */

  switchMode(
    'login'
  );


  /*
  مهم:
  Listener قبل از boot
  */

  listenForAuthChanges();


  /*
  شروع
  */

  boot();

})();
