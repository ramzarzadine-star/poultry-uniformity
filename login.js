'use strict';


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  'https://qxiktabmwwjygsocjcyl.supabase.co';


const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_sZvkwvD50rkboFtZzTElAQ_bxGDw-Ye';


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================================================
   HELPERS
========================================================= */

function get(id) {

  return document.getElementById(id);

}


function showMessage(
  text,
  type = 'error'
) {

  const element =
    get('loginMessage');


  if (!element)
    return;


  element.textContent =
    text;


  element.className =
    'login-message ' + type;


  element.style.display =
    'block';

}


function clearMessage() {

  const element =
    get('loginMessage');


  if (!element)
    return;


  element.textContent =
    '';


  element.className =
    'login-message';


  element.style.display =
    'none';

}


function setButtonLoading(
  button,
  loading,
  loadingText
) {

  if (!button)
    return;


  if (loading) {

    button.disabled =
      true;

    button.dataset.originalText =
      button.innerHTML;

    button.innerHTML =
      `
        <span class="button-spinner"></span>
        ${loadingText}
      `;

  } else {

    button.disabled =
      false;

    button.innerHTML =
      button.dataset.originalText ||
      '';

  }

}


/* =========================================================
   TABS
========================================================= */

function hideAllModes() {

  const modes = [
    'loginMode',
    'registerMode',
    'forgotMode'
  ];


  modes.forEach(
    id => {

      const element =
        get(id);


      if (element)
        element.style.display =
          'none';

    }
  );


  document
    .querySelectorAll('.login-tab')
    .forEach(
      tab =>
        tab.classList.remove(
          'active'
        )
    );

}


function showLoginMode() {

  hideAllModes();


  get('loginMode').style.display =
    'block';


  get('loginTab')
    ?.classList
    .add('active');


  clearMessage();

}


function showRegisterMode() {

  hideAllModes();


  get('registerMode').style.display =
    'block';


  get('registerTab')
    ?.classList
    .add('active');


  clearMessage();

}


function showForgotPassword() {

  hideAllModes();


  get('forgotMode').style.display =
    'block';


  clearMessage();


  const email =
    get('loginEmail')?.value?.trim();


  if (email) {

    get('forgotEmail').value =
      email;

  }

}


/* =========================================================
   PASSWORD
========================================================= */

function togglePassword(
  id,
  button
) {

  const input =
    get(id);


  if (!input)
    return;


  if (
    input.type === 'password'
  ) {

    input.type =
      'text';


    if (button)
      button.textContent =
        '◉';

  } else {

    input.type =
      'password';


    if (button)
      button.textContent =
        '◉';

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser() {

  clearMessage();


  const email =
    get('loginEmail')
      ?.value
      .trim()
      .toLowerCase();


  const password =
    get('loginPassword')
      ?.value || '';


  if (!email) {

    showMessage(
      'لطفاً ایمیل را وارد کنید.'
    );

    return;

  }


  if (!password) {

    showMessage(
      'لطفاً رمز عبور را وارد کنید.'
    );

    return;

  }


  const button =
    get('loginButton');


  setButtonLoading(
    button,
    true,
    'در حال ورود...'
  );


  try {

    /*
      ورود از طریق Supabase
    */

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({

        email,

        password

      });


    if (error)
      throw error;


    if (
      !data ||
      !data.user
    ) {

      throw new Error(
        'ورود انجام نشد.'
      );

    }


    /*
      دریافت پروفایل
    */

    const {
      data: profile,
      error: profileError
    } =
      await supabaseClient
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
          data.user.id
        )
        .maybeSingle();


    if (profileError)
      throw profileError;


    if (!profile) {

      await supabaseClient.auth.signOut();


      throw new Error(
        'پروفایل این حساب در سامانه ایجاد نشده است. با مدیریت مرکز تماس بگیرید.'
      );

    }


    /*
      حساب باید فعال باشد.
    */

    if (
      profile.status !== 'active'
    ) {

      await supabaseClient.auth.signOut();


      if (
        profile.status === 'pending'
      ) {

        throw new Error(
          'حساب شما ثبت شده اما هنوز توسط مدیریت مرکز تأیید نشده است.'
        );

      }


      if (
        profile.status === 'suspended'
      ) {

        throw new Error(
          'دسترسی حساب شما موقتاً متوقف شده است.'
        );

      }


      if (
        profile.status === 'disabled'
      ) {

        throw new Error(
          'حساب شما غیرفعال شده است.'
        );

      }


      throw new Error(
        'دسترسی این حساب فعال نیست.'
      );

    }


    /*
      ذخیره اطلاعات پایه برای سازگاری
      با نسخه قبلی برنامه
    */

    localStorage.setItem(
      'activeUser',
      data.user.id
    );


    localStorage.setItem(
      'adineh_user_profile',
      JSON.stringify(profile)
    );


    showMessage(
      'ورود موفق بود. در حال ورود به سامانه...',
      'success'
    );


    setTimeout(
      () => {

        window.location.replace(
          'index.html'
        );

      },
      500
    );


  } catch (error) {

    console.error(
      'Login error:',
      error
    );


    let message =
      'ورود انجام نشد. اطلاعات ورود را بررسی کنید.';


    if (
      error?.message
        ?.toLowerCase()
        .includes('invalid login credentials')
    ) {

      message =
        'ایمیل یا رمز عبور صحیح نیست.';

    }


    if (
      error?.message
        ?.toLowerCase()
        .includes('email not confirmed')
    ) {

      message =
        'ایمیل شما هنوز تأیید نشده است. ابتدا ایمیل تأیید را بررسی کنید.';

    }


    if (
      error?.message
        ?.toLowerCase()
        .includes('failed to fetch')
    ) {

      message =
        'ارتباط با سرور برقرار نشد. اینترنت را بررسی کنید.';

    }


    if (
      error?.message &&
      !error.message
        .toLowerCase()
        .includes('invalid login credentials')
    ) {

      /*
        خطاهای فارسی خودمان را نمایش بده.
      */

      if (
        error.message.length <
        220
      ) {

        message =
          error.message;

      }

    }


    showMessage(
      message
    );


  } finally {

    setButtonLoading(
      button,
      false
    );

  }

}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser() {

  clearMessage();


  const email =
    get('registerEmail')
      ?.value
      .trim()
      .toLowerCase();


  const password =
    get('registerPassword')
      ?.value || '';


  const password2 =
    get('registerPassword2')
      ?.value || '';


  if (!email) {

    showMessage(
      'ایمیل را وارد کنید.'
    );

    return;

  }


  if (!email.includes('@')) {

    showMessage(
      'فرمت ایمیل صحیح نیست.'
    );

    return;

  }


  if (password.length < 6) {

    showMessage(
      'رمز عبور باید حداقل ۶ کاراکتر باشد.'
    );

    return;

  }


  if (password !== password2) {

    showMessage(
      'تکرار رمز عبور با رمز اصلی یکسان نیست.'
    );

    return;

  }


  const button =
    get('registerButton');


  setButtonLoading(
    button,
    true,
    'در حال ثبت‌نام...'
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email,

        password

      });


    if (error)
      throw error;


    /*
      اگر تأیید ایمیل فعال باشد،
      session ممکن است null باشد.
    */

    if (
      data?.session
    ) {

      showMessage(
        'ثبت‌نام انجام شد. حساب شما باید توسط مدیریت مرکز فعال شود.',
        'success'
      );


      /*
        کاربر تازه ثبت‌نام‌شده
        نباید خودکار وارد برنامه شود.
      */

      await supabaseClient.auth.signOut();


    } else {

      showMessage(
        'ثبت‌نام انجام شد. در صورت فعال بودن تأیید ایمیل، ایمیل خود را تأیید کنید. سپس مدیریت مرکز دسترسی شما را فعال می‌کند.',
        'success'
      );

    }


    /*
      بعد از ثبت نام به صفحه ورود برو.
    */

    setTimeout(
      () => {

        showLoginMode();


        if (
          get('loginEmail')
        ) {

          get('loginEmail').value =
            email;

        }

      },
      1800
    );


  } catch (error) {

    console.error(
      'Registration error:',
      error
    );


    let message =
      'ثبت‌نام انجام نشد.';


    if (
      error?.message
        ?.toLowerCase()
        .includes('already registered')
    ) {

      message =
        'این ایمیل قبلاً ثبت شده است.';

    }


    if (
      error?.message &&
      error.message.length <
      220
    ) {

      if (
        !error.message
          .toLowerCase()
          .includes('already registered')
      ) {

        message =
          error.message;

      }

    }


    showMessage(
      message
    );


  } finally {

    setButtonLoading(
      button,
      false
    );

  }

}


/* =========================================================
   MAGIC LINK
========================================================= */

async function sendMagicLink() {

  clearMessage();


  const email =
    get('loginEmail')
      ?.value
      .trim()
      .toLowerCase();


  if (!email) {

    showMessage(
      'ابتدا ایمیل خود را وارد کنید.'
    );

    return;

  }


  try {

    const {
      error
    } =
      await supabaseClient.auth.signInWithOtp({

        email,

        options: {

          emailRedirectTo:
            window.location.origin +
            window.location.pathname
              .replace(
                'login.html',
                'index.html'
              )

        }

      });


    if (error)
      throw error;


    showMessage(
      'لینک ورود به ایمیل شما ارسال شد.',
      'success'
    );


  } catch (error) {

    console.error(
      error
    );


    showMessage(
      error?.message ||
      'ارسال لینک ورود انجام نشد.'
    );

  }

}


/* =========================================================
   PASSWORD RESET
========================================================= */

async function resetPassword() {

  clearMessage();


  const email =
    get('forgotEmail')
      ?.value
      .trim()
      .toLowerCase();


  if (!email) {

    showMessage(
      'ایمیل خود را وارد کنید.'
    );

    return;

  }


  try {

    const {
      error
    } =
      await supabaseClient.auth
        .resetPasswordForEmail(
          email,
          {

            redirectTo:
              window.location.origin +
              window.location.pathname
                .replace(
                  'login.html',
                  'index.html'
                )

          }
        );


    if (error)
      throw error;


    showMessage(
      'لینک بازیابی رمز عبور ارسال شد.',
      'success'
    );


  } catch (error) {

    console.error(
      error
    );


    showMessage(
      error?.message ||
      'ارسال لینک بازیابی انجام نشد.'
    );

  }

}


/* =========================================================
   ENTER KEY
========================================================= */

document.addEventListener(
  'keydown',
  event => {

    if (
      event.key !== 'Enter'
    )
      return;


    const loginVisible =
      get('loginMode')
        ?.style
        .display !== 'none';


    const registerVisible =
      get('registerMode')
        ?.style
        .display !== 'none';


    if (loginVisible) {

      loginUser();

    } else if (
      registerVisible
    ) {

      registerUser();

    }

  }
);


/* =========================================================
   CHECK EXISTING SESSION
========================================================= */

(async function checkExistingSession() {

  try {

    const {
      data
    } =
      await supabaseClient.auth.getSession();


    if (
      data?.session
    ) {

      /*
        اگر قبلاً وارد شده،
        مستقیماً به برنامه برو.
      */

      window.location.replace(
        'index.html'
      );

    }

  } catch (error) {

    console.error(
      error
    );

  }

})();
