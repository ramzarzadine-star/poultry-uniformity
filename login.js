'use strict';

/*
  =========================================================
  ADINEH POULTRY
  Professional Supabase Authentication
  Login / Register / Magic Link / Recovery / Reset
  =========================================================

  تمام مراحل احراز هویت روی همین login.html انجام می‌شود.

  IMPORTANT:
  Recovery callback قبل از هر SIGNED_IN به حالت Recovery قفل می‌شود
  تا کاربر اشتباهاً به index.html هدایت نشود.
*/

(function () {

  const supabase =
    window.adinehSupabase;

  const $ = id =>
    document.getElementById(id);

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

  let busy = false;

  let redirecting = false;

  /*
    بسیار مهم:
    اگر لینک Recovery باشد این مقدار باید
    قبل از هر Redirect فعال شود.
  */
  let recoveryMode = false;


  /* =====================================================
     HELPERS
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


  function setBusy(value) {

    busy =
      Boolean(value);

    document
      .querySelectorAll('button')
      .forEach(button => {

        button.disabled =
          busy;

      });

    if (loading) {

      loading.hidden =
        !busy;

    }

  }


  function getLoginUrl() {

    const url =
      new URL(
        'login.html',
        window.location.href
      );

    /*
      لینک‌های ایمیل همیشه به همین صفحه
      برمی‌گردند.
    */

    url.search = '';

    url.hash = '';

    return url.href;

  }


  function normalizeEmail(value) {

    return String(
      value || ''
    )
      .trim()
      .toLowerCase();

  }


  function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);

  }


  function passwordError(password) {

    if (!password)
      return 'رمز عبور را وارد کنید.';

    if (
      password.length < 8
    )
      return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';

    return '';

  }


  /*
    تشخیص لینک بازیابی
  */

  function hasRecoverySignal() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get('type') ===
      'recovery'
    ) {

      return true;

    }


    const hash =
      window.location.hash
        .replace(
          /^#/,
          ''
        );


    return /(?:^|&)type=recovery(?:&|$)/
      .test(hash);

  }


  /*
    پاک کردن اطلاعات احراز هویت
    از URL بعد از پردازش.
  */

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
        'message'
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
     MODE
  ===================================================== */

  function switchMode(mode) {

    /*
      فقط در حالت عادی می‌توان
      بین Login و Register جابه‌جا شد.
    */

    recoveryMode =
      false;

    const register =
      mode === 'register';


    if (loginForm)
      loginForm.hidden =
        register;


    if (registerForm)
      registerForm.hidden =
        !register;


    if (resetForm)
      resetForm.hidden =
        true;


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
     RECOVERY FORM
  ===================================================== */

  function showRecoveryForm() {

    /*
      مهم‌ترین قسمت:
      حالت Recovery باید از این لحظه فعال بماند.
    */

    recoveryMode =
      true;


    if (loginForm)
      loginForm.hidden =
        true;


    if (registerForm)
      registerForm.hidden =
        true;


    if (resetForm)
      resetForm.hidden =
        false;


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
        'رمز عبور جدید خود را وارد کنید. این مرحله داخل همین صفحه انجام می‌شود.';

    }


    showMessage(
      'لینک بازیابی معتبر است. رمز عبور جدید خود را وارد کنید.',
      'success'
    );


    setBusy(false);


    const newPassword =
      $('resetPassword');


    window.setTimeout(
      () => {

        newPassword?.focus();

      },
      100
    );

  }


  /* =====================================================
     PROFILE
  ===================================================== */

  async function readProfile(userId) {

    if (!userId)
      return null;


    try {

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

  async function continueWithUser(user) {

    /*
      در Recovery هرگز نباید
      این تابع باعث Redirect شود.
    */

    if (
      recoveryMode
    ) {

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
        'حساب شما هنوز مجاز به ورود نیست.'
      );


      return;

    }


    redirecting =
      true;


    /*
      همان تب فعلی.
      هیچ پنجره یا تب جدیدی باز نمی‌شود.
    */

    window.location.replace(
      'index.html'
    );

  }


  /* =====================================================
     LOGIN
  ===================================================== */

  async function login(event) {

    event?.preventDefault();


    if (busy)
      return;


    showMessage('');


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
      } = await supabase.auth
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


        /*
          خطای واقعی Supabase را
          مخفی نمی‌کنیم.
        */

        showMessage(
          error.message ||
          'ورود انجام نشد. ایمیل یا رمز عبور را بررسی کنید.'
        );


        return;

      }


      if (!data?.user) {

        setBusy(false);


        showMessage(
          'ورود انجام نشد؛ کاربر معتبر دریافت نشد.'
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
        'ارتباط با سامانه برقرار نشد.'
      );

    }

  }


  /* =====================================================
     REGISTER
  ===================================================== */

  async function register(event) {

    event?.preventDefault();


    if (busy)
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
      normalizeEmail(
        $('registerEmail')?.value
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
        'تکرار رمز عبور با رمز اصلی یکسان نیست.'
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


      /*
        حساب جدید باید توسط مالک فعال شود.
      */

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
        'ثبت‌نام انجام شد. ایمیل خود را بررسی کنید؛ سپس حساب توسط مالک سامانه فعال می‌شود.',
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
        'ارتباط با سامانه برقرار نشد.'
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
        $('loginEmail')?.value
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
      } = await supabase.auth
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
        'لینک ورود ارسال شد. ایمیل خود را باز کنید؛ پس از کلیک، همین صفحه ادامه ورود را انجام می‌دهد.',
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
        'ارتباط با سامانه برقرار نشد.'
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
        $('loginEmail')?.value
      );


    if (!email) {

      showMessage(
        'ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود.'
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
      } = await supabase.auth
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
          'Password recovery error:',
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
        'Password recovery exception:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'ارتباط با سامانه برقرار نشد.'
      );

    }

  }


  /* =====================================================
     SET NEW PASSWORD
  ===================================================== */

  async function updatePassword(event) {

    event?.preventDefault();


    if (busy)
      return;


    showMessage('');


    /*
      اگر Recovery نیست، اجازه تغییر رمز
      از این فرم داده نمی‌شود.
    */

    if (!recoveryMode) {

      showMessage(
        'لینک بازیابی معتبر نیست یا منقضی شده است.'
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
        'تکرار رمز عبور با رمز جدید یکسان نیست.'
      );

      return;

    }


    setBusy(true);


    try {

      const {
        data,
        error
      } = await supabase.auth
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
          'تغییر رمز عبور انجام نشد. لینک بازیابی ممکن است منقضی شده باشد.'
        );


        return;

      }


      if (!data?.user) {

        setBusy(false);


        showMessage(
          'رمز عبور تغییر کرد، اما نشست کاربر دریافت نشد.'
        );


        return;

      }


      /*
        Recovery تمام شده است.
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
        'تغییر رمز عبور انجام نشد. دوباره درخواست بازیابی بدهید.'
      );

    }

  }


  /* =====================================================
     AUTH LISTENER
  ===================================================== */

  function setupAuthListener() {

    if (!supabase)
      return;


    /*
      =====================================================
      CRITICAL RECOVERY LOCK
      =====================================================

      اگر URL مربوط به Recovery باشد،
      قبل از اینکه Supabase رویداد SIGNED_IN
      را ارسال کند، recoveryMode فعال می‌شود.

      این همان مشکلی بود که باعث می‌شد
      کاربر مستقیماً به index.html برود.
    */

    if (
      hasRecoverySignal()
    ) {

      recoveryMode =
        true;

    }


    supabase.auth
      .onAuthStateChange(
        (
          event,
          session
        ) => {

          console.log(
            'Auth event:',
            event
          );


          /*
            هیچ عملیات async سنگین مستقیماً
            داخل callback انجام نمی‌دهیم.
          */

          setTimeout(
            async () => {


              /* =========================================
                 PASSWORD RECOVERY
              ========================================= */

              if (
                event ===
                'PASSWORD_RECOVERY'
              ) {

                recoveryMode =
                  true;


                setBusy(false);


                showRecoveryForm();


                /*
                  URL را فقط بعد از نمایش فرم
                  پاک می‌کنیم.
                */

                clearAuthUrl();


                return;

              }


              /* =========================================
                 SIGNED IN
              ========================================= */

              if (
                event ===
                  'SIGNED_IN' &&
                session?.user
              ) {

                /*
                  در Recovery هرگز وارد App نشو.
                */

                if (
                  recoveryMode ||
                  hasRecoverySignal()
                ) {

                  console.log(
                    'SIGNED_IN ignored because recovery is active.'
                  );

                  return;

                }


                await continueWithUser(
                  session.user
                );

              }

            },
            0
          );

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
      Listener را قبل از بررسی Session فعال می‌کنیم.
    */

    setupAuthListener();


    /*
      =====================================================
      RECOVERY CALLBACK
      =====================================================

      این متغیر را بلافاصله می‌گیریم.
      مهم است که قبل از getSession مشخص باشد.
    */

    const recoveryCallback =
      hasRecoverySignal();


    if (
      recoveryCallback
    ) {

      /*
        قفل Recovery
      */

      recoveryMode =
        true;


      setBusy(true);


      try {

        let session =
          null;


        /*
          به Supabase فرصت می‌دهیم
          callback URL را مصرف کند.
        */

        for (
          let i = 0;
          i < 20;
          i++
        ) {

          const result =
            await supabase.auth
              .getSession();


          session =
            result
              ?.data
              ?.session ||
            null;


          if (
            session?.user
          ) {

            break;

          }


          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                100
              )
          );

        }


        if (
          session?.user
        ) {

          /*
            فرم تعیین رمز را نشان بده.
          */

          showRecoveryForm();


          /*
            فقط بعد از گرفتن Session
            URL را پاک می‌کنیم.
          */

          clearAuthUrl();


          setBusy(false);


          return;

        }


        /*
          Recovery است ولی Session آماده نشده.
          به هیچ عنوان وارد index.html نمی‌شویم.
        */

        setBusy(false);


        showMessage(
          'لینک بازیابی دریافت شد، اما نشست بازیابی هنوز آماده نشده است. اگر فرم تغییر رمز ظاهر نشد، یک لینک بازیابی جدید درخواست کنید.'
        );


        return;

      }

      catch (error) {

        console.error(
          'Recovery session error:',
          error
        );


        setBusy(false);


        showMessage(
          'پردازش لینک بازیابی با خطا مواجه شد. لطفاً یک لینک جدید درخواست کنید.'
        );


        return;

      }

    }


    /* ===================================================
       NORMAL SESSION
       =================================================== */

    try {

      const {
        data: {
          session
        }
      } = await supabase.auth
        .getSession();


      if (
        session?.user
      ) {

        /*
          اگر به هر دلیل Recovery فعال شده باشد،
          هرگز Redirect نکن.
        */

        if (
          recoveryMode ||
          recoveryCallback ||
          hasRecoverySignal()
        ) {

          showRecoveryForm();


          clearAuthUrl();


          setBusy(false);


          return;

        }


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
      پیام احتمالی از auth-guard
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

  loginModeBtn?.addEventListener(
    'click',
    () =>
      switchMode(
        'login'
      )
  );


  registerModeBtn?.addEventListener(
    'click',
    () =>
      switchMode(
        'register'
      )
  );


  loginForm?.addEventListener(
    'submit',
    login
  );


  registerForm?.addEventListener(
    'submit',
    register
  );


  resetForm?.addEventListener(
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
     START
  ===================================================== */

  switchMode(
    'login'
  );


  boot();

})();
