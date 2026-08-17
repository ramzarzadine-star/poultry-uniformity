'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه

LOGIN
REGISTER
MAGIC LINK
PASSWORD RECOVERY REQUEST

=========================================================
*/

(() => {

  /*
  =======================================================
  SUPABASE
  =======================================================
  */

  const supabase =
    window.adinehSupabase ||
    window.supabaseClient ||
    null;


  if (!supabase) {

    console.error(
      'Supabase client not found.'
    );

    return;
  }


  /*
  =======================================================
  DOM
  =======================================================
  */

  const loginForm =
    document.getElementById(
      'loginForm'
    );


  const registerForm =
    document.getElementById(
      'registerForm'
    );


  const resetForm =
    document.getElementById(
      'resetForm'
    );


  const loginModeBtn =
    document.getElementById(
      'loginModeBtn'
    );


  const registerModeBtn =
    document.getElementById(
      'registerModeBtn'
    );


  const magicLinkBtn =
    document.getElementById(
      'magicLinkBtn'
    );


  const forgotBtn =
    document.getElementById(
      'forgotBtn'
    );


  const backToLoginBtn =
    document.getElementById(
      'backToLoginBtn'
    );


  const messageEl =
    document.getElementById(
      'message'
    );


  const loadingEl =
    document.getElementById(
      'loading'
    );


  const modeTitle =
    document.getElementById(
      'modeTitle'
    );


  const modeText =
    document.getElementById(
      'modeText'
    );


  const modeSwitch =
    document.getElementById(
      'modeSwitch'
    );


  /*
  =======================================================
  STATE
  =======================================================
  */

  let busy =
    false;

  let redirecting =
    false;


  /*
  =======================================================
  MESSAGE
  =======================================================
  */

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


  /*
  =======================================================
  LOADING
  =======================================================
  */

  function setBusy(
    state
  ) {

    busy =
      Boolean(state);


    document
      .querySelectorAll('button')
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
        busy ? '' : 'none';

    }

  }


  /*
  =======================================================
  VALUE
  =======================================================
  */

  function getValue(
    id
  ) {

    return String(
      document.getElementById(id)?.value ||
      ''
    ).trim();

  }


  /*
  =======================================================
  EMAIL
  =======================================================
  */

  function getEmail(
    id
  ) {

    return getValue(id)
      .toLowerCase();

  }


  function validEmail(
    email
  ) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);

  }


  /*
  =======================================================
  PASSWORD
  =======================================================
  */

  function validPassword(
    password
  ) {

    if (!password) {

      return 'رمز عبور را وارد کنید.';

    }


    if (password.length < 8) {

      return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';

    }


    return '';

  }


  /*
  =======================================================
  LOGIN URL
  =======================================================
  */

  function getLoginUrl() {

    return new URL(
      'login.html',
      window.location.href
    ).href;

  }


  /*
  =======================================================
  RESET PASSWORD URL
  =======================================================
  */

  function getResetPasswordUrl() {

    return new URL(
      'reset-password.html',
      window.location.href
    ).href;

  }


  /*
  =======================================================
  SHOW LOGIN
  =======================================================
  */

  function showLogin() {

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


  /*
  =======================================================
  SHOW REGISTER
  =======================================================
  */

  function showRegister() {

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


  /*
  =======================================================
  PROFILE
  =======================================================
  */

  async function getProfile(
    userId
  ) {

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
          'PROFILE ERROR:',
          error
        );

        return null;

      }


      return data || null;

    }

    catch (error) {

      console.error(
        'PROFILE EXCEPTION:',
        error
      );

      return null;

    }

  }


  /*
  =======================================================
  REDIRECT TO APPLICATION
  =======================================================
  */

  async function goToApplication(
    user
  ) {

    if (!user) {

      setBusy(false);

      return;

    }


    if (redirecting) {

      return;

    }


    const profile =
      await getProfile(
        user.id
      );


    /*
     * پروفایل وجود ندارد
     */

    if (!profile) {

      await supabase.auth
        .signOut();


      setBusy(false);


      showMessage(
        'ورود انجام شد اما پروفایل کاربری شما در سامانه پیدا نشد.'
      );


      return;

    }


    /*
     * بررسی وضعیت حساب
     */

    if (
      profile.status &&
      profile.status !== 'active'
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


    /*
     * ورود موفق
     */

    redirecting =
      true;


    window.location.replace(
      'index.html'
    );

  }


  /*
  =======================================================
  LOGIN
  =======================================================
  */

  async function login(
    event
  ) {

    event.preventDefault();


    if (busy) {

      return;

    }


    showMessage('');


    const email =
      getEmail(
        'loginEmail'
      );


    const password =
      getValue(
        'loginPassword'
      );


    /*
     * Email
     */

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


    /*
     * Password
     */

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
          'SUPABASE LOGIN ERROR:',
          error
        );


        setBusy(false);


        /*
         * ایمیل تأیید نشده
         */

        if (
          error.code ===
          'email_not_confirmed'
        ) {

          showMessage(
            'ایمیل حساب شما هنوز تأیید نشده است. ایمیل تأیید Supabase را بررسی کنید.'
          );


          return;

        }


        /*
         * اطلاعات ورود اشتباه
         */

        if (
          error.code ===
          'invalid_credentials'
        ) {

          showMessage(
            'ایمیل یا رمز عبور اشتباه است.'
          );


          return;

        }


        /*
         * سایر خطاها
         */

        showMessage(
          error.message ||
          'ورود انجام نشد.'
        );


        return;

      }


      if (!data?.user) {

        setBusy(false);


        showMessage(
          'ورود انجام نشد.'
        );


        return;

      }


      /*
       * ورود موفق
       */

      await goToApplication(
        data.user
      );

    }

    catch (error) {

      console.error(
        'LOGIN EXCEPTION:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'خطایی هنگام ورود رخ داد. دوباره تلاش کنید.'
      );

    }

  }


  /*
  =======================================================
  FORGOT PASSWORD
  =======================================================
  */

  async function forgotPassword() {

    if (busy) {

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


    if (!validEmail(email)) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );


      return;

    }


    setBusy(true);


    try {

      const redirectTo =
        getResetPasswordUrl();


      console.log(
        'PASSWORD RESET REDIRECT:',
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
        'لینک بازیابی رمز عبور ارسال شد. ایمیل خود را بررسی کنید و پوشه Spam/Junk را هم ببینید.',
        'success'
      );

    }

    catch (error) {

      console.error(
        'PASSWORD RESET EXCEPTION:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'خطایی هنگام ارسال لینک بازیابی رخ داد.'
      );

    }

  }


  /*
  =======================================================
  MAGIC LINK
  =======================================================
  */

  async function sendMagicLink() {

    if (busy) {

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
      } =
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

    }

    catch (error) {

      console.error(
        'MAGIC LINK EXCEPTION:',
        error
      );


      setBusy(false);


      showMessage(
        error?.message ||
        'خطایی هنگام ارسال لینک ورود رخ داد.'
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

    event.preventDefault();


    if (busy) {

      return;

    }


    showMessage('');


    const firstName =
      getValue(
        'firstName'
      );


    const lastName =
      getValue(
        'lastName'
      );


    const phone =
      getValue(
        'registerPhone'
      );


    const email =
      getEmail(
        'registerEmail'
      );


    const password =
      getValue(
        'registerPassword'
      );


    const confirmPassword =
      getValue(
        'registerPasswordConfirm'
      );


    /*
     * Required
     */

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


    /*
     * Email
     */

    if (!validEmail(email)) {

      showMessage(
        'فرمت ایمیل صحیح نیست.'
      );


      return;

    }


    /*
     * Password
     */

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


    /*
     * Confirm Password
     */

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
       * اگر Session ساخته شد
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
       * نیاز به تأیید Email
       */

      setBusy(false);


      showLogin();


      showMessage(
        'حساب شما ایجاد شد. ایمیل خود را برای تأیید حساب بررسی کنید.',
        'success'
      );

    }

    catch (error) {

      console.error(
        'REGISTER EXCEPTION:',
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
  =======================================================
  AUTH STATE LISTENER
  =======================================================
  */

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
           * =================================================
           * خیلی مهم:
           *
           * PASSWORD_RECOVERY را اینجا Redirect نمی‌کنیم.
           *
           * صفحه Login نباید به reset-password.html
           * منتقل شود.
           *
           * لینک بازیابی مستقیماً به
           * reset-password.html می‌رود.
           * =================================================
           */

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {

            console.log(
              'PASSWORD_RECOVERY EVENT ON LOGIN PAGE - ignored.'
            );


            return;

          }


          /*
           * Login / Magic Link
           */

          if (
            event ===
            'SIGNED_IN' &&
            session?.user
          ) {

            await goToApplication(
              session.user
            );


            return;

          }


          /*
           * Logout
           */

          if (
            event ===
            'SIGNED_OUT'
          ) {

            redirecting =
              false;

            setBusy(false);

            showLogin();

          }

        }
      );

  }


  /*
  =======================================================
  INITIALIZE
  =======================================================
  */

  async function initialize() {

    /*
     * اول صفحه Login را نمایش بده
     */

    showLogin();


    setBusy(false);


    /*
     * Listener
     */

    setupAuthListener();


    /*
     * Session فعلی
     */

    try {

      const {
        data,
        error
      } =
        await supabase.auth
          .getSession();


      if (error) {

        console.error(
          'GET SESSION ERROR:',
          error
        );


        return;

      }


      /*
       * اگر کاربر قبلاً Login کرده
       */

      if (
        data?.session?.user
      ) {

        await goToApplication(
          data.session.user
        );

      }

    }

    catch (error) {

      console.error(
        'INITIAL AUTH ERROR:',
        error
      );

    }

  }


  /*
  =======================================================
  EVENTS
  =======================================================
  */

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
      showLogin
    );

  }


  if (registerModeBtn) {

    registerModeBtn.addEventListener(
      'click',
      showRegister
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

        }

        catch (error) {

          console.warn(
            error
          );

        }


        showLogin();

        showMessage('');

      }
    );

  }


  /*
  =======================================================
  START
  =======================================================
  */

  initialize();

})();
