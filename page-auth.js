'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
PAGE AUTH GUARD

این فایل برای صفحات داخلی برنامه است.
وظیفه:
1. بررسی Session
2. بررسی Profile
3. بررسی active بودن حساب
4. جلوگیری از نمایش صفحه قبل از احراز هویت
5. جلوگیری از اجرای برنامه بدون User ID
=========================================================
*/

(function () {

  let started = false;

  function goLogin(message) {

    const url = new URL(
      'login.html',
      window.location.href
    );

    if (message) {
      url.searchParams.set(
        'message',
        message
      );
    }

    window.location.replace(
      url.href
    );
  }


  async function start() {

    if (started) return;

    started = true;

    /*
    -----------------------------------------------
    auth.js باید قبل از این فایل اجرا شده باشد.
    -----------------------------------------------
    */

    if (
      !window.AdinehAuth
    ) {

      console.error(
        '[PageAuth] AdinehAuth is not available.'
      );

      goLogin(
        'سیستم احراز هویت بارگذاری نشد.'
      );

      return;

    }


    try {

      /*
      -----------------------------------------------
      بررسی کاربر فعال
      -----------------------------------------------
      */

      const result =
        await window.AdinehAuth
          .requireActiveUser({
            redirect: false
          });


      if (
        !result ||
        !result.user ||
        !result.profile
      ) {

        goLogin(
          'ابتدا وارد سامانه شوید.'
        );

        return;

      }


      /*
      -----------------------------------------------
      اطمینان از active بودن حساب
      -----------------------------------------------
      */

      if (
        result.profile.status !==
        'active'
      ) {

        goLogin(
          'حساب شما فعال نیست.'
        );

        return;

      }


      /*
      -----------------------------------------------
      اطمینان از User ID
      -----------------------------------------------
      */

      window.ADINEH_USER_ID =
        result.user.id;


      /*
      -----------------------------------------------
      اگر Auth اصلی قبلاً DB_KEY را
      ساخته باشد، همان را حفظ می‌کنیم.
      -----------------------------------------------
      */

      if (
        !window.ADINEH_DB_KEY
      ) {

        window.ADINEH_DB_KEY =
          `adineh_poultry_db_v7_${result.user.id}`;

      }


      /*
      -----------------------------------------------
      اطلاعات کاربر در دسترس صفحات
      -----------------------------------------------
      */

      window.ADINEH_CURRENT_USER =
        result.user;

      window.ADINEH_CURRENT_PROFILE =
        result.profile;


      /*
      -----------------------------------------------
      Event برای اسکریپت‌های صفحه
      -----------------------------------------------
      */

      document.dispatchEvent(
        new CustomEvent(
          'adineh-page-auth-ready',
          {
            detail: {
              user: result.user,
              profile: result.profile
            }
          }
        )
      );


      /*
      -----------------------------------------------
      فعال کردن body
      -----------------------------------------------
      */

      document.documentElement
        .classList
        .add(
          'adineh-authenticated'
        );


      console.info(
        '[PageAuth] Authenticated:',
        result.user.id
      );


    } catch (error) {

      console.error(
        '[PageAuth] Authentication error:',
        error
      );

      goLogin(
        'خطا در بررسی دسترسی.'
      );

    }

  }


  /*
  =====================================================
  اجرای اولیه
  =====================================================
  */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      start,
      {
        once: true
      }
    );

  } else {

    start();

  }


  /*
  =====================================================
  API
  =====================================================
  */

  window.AdinehPageAuth = {

    start

  };

})();
