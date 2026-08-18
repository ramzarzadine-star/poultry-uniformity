'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
APP LOADER

app.js فقط بعد از تکمیل Auth اجرا می‌شود.
=========================================================
*/

(function () {

  let loaded = false;

  function loadApp() {

    if (loaded) return;

    loaded = true;

    const script =
      document.createElement('script');

    script.src =
      'app.js?v=20260817-authfix1';

    script.async = false;

    script.onload = function () {

      console.info(
        '[Adineh] app.js loaded after authentication.'
      );

    };

    script.onerror = function () {

      console.error(
        '[Adineh] app.js failed to load.'
      );

      const app =
        document.getElementById('app');

      if (app) {

        app.innerHTML = `
          <div style="
            padding:30px;
            text-align:center;
            font-family:Tahoma,sans-serif;
            color:#a52525;
            line-height:2;
          ">
            خطا در بارگذاری برنامه.<br>
            لطفاً صفحه را دوباره باز کنید.
          </div>
        `;

      }

    };

    document.body.appendChild(
      script
    );

  }


  /*
  اگر Auth قبل از Loader آماده شده باشد
  */

  if (
    window.ADINEH_AUTH &&
    window.ADINEH_AUTH.ready &&
    window.ADINEH_DB_KEY
  ) {

    loadApp();

    return;

  }


  /*
  حالت معمول:
  منتظر Auth می‌مانیم.
  */

  document.addEventListener(

    'adineh-auth-ready',

    function () {

      if (
        !window.ADINEH_DB_KEY
      ) {

        console.error(
          '[Adineh] Auth ready without DB key.'
        );

        return;

      }

      loadApp();

    },

    {
      once: true
    }

  );

})();
