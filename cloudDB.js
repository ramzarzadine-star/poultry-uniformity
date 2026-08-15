
'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
Cloud Database Layer
Supabase V1
=========================================================

وظیفه:
- اتصال امن برنامه به Supabase
- ذخیره و خواندن اطلاعات
- استفاده از user فعلی
- آماده‌سازی برای انتقال کامل از localStorage
=========================================================
*/

(function () {

  const client =
    window.supabaseClient ||
    window.adinehSupabase;


  if (!client) {

    console.error(
      'Adineh CloudDB: Supabase client not found.'
    );

    return;

  }


  /* =====================================================
     USER
  ===================================================== */

  async function currentUser() {

    const {
      data,
      error
    } =
      await client.auth.getUser();


    if (error)
      throw error;


    return data?.user || null;

  }


  async function requireUser() {

    const user =
      await currentUser();


    if (!user) {

      throw new Error(
        'کاربر وارد نشده است.'
      );

    }


    return user;

  }


  /* =====================================================
     GENERIC INSERT
  ===================================================== */

  async function insert(
    table,
    data
  ) {

    const user =
      await requireUser();


    const payload = {

      ...data,

      owner_user_id:
        user.id

    };


    const {
      data: result,
      error
    } =
      await client
        .from(table)
        .insert(payload)
        .select()
        .single();


    if (error) {

      console.error(
        `CloudDB INSERT ${table}:`,
        error
      );

      throw error;

    }


    return result;

  }


  /* =====================================================
     GENERIC SELECT
  ===================================================== */

  async function select(
    table,
    options = {}
  ) {

    const user =
      await requireUser();


    let query =
      client
        .from(table)
        .select(
          options.columns || '*'
        );


    /*
      به‌صورت پیش‌فرض فقط اطلاعات
      کاربر فعلی دریافت می‌شود.

      برای Owner:
      می‌توانیم بعداً گزینه
      allUsers=true اضافه کنیم.
    */

    if (
      options.allUsers !== true
    ) {

      query =
        query.eq(
          'owner_user_id',
          user.id
        );

    }


    if (options.orderBy) {

      query =
        query.order(
          options.orderBy,
          {
            ascending:
              options.ascending !== false
          }
        );

    }


    if (
      Number.isInteger(
        options.limit
      )
    ) {

      query =
        query.limit(
          options.limit
        );

    }


    const {
      data,
      error
    } =
      await query;


    if (error) {

      console.error(
        `CloudDB SELECT ${table}:`,
        error
      );

      throw error;

    }


    return data || [];

  }


  /* =====================================================
     UPDATE
  ===================================================== */

  async function update(
    table,
    id,
    changes
  ) {

    const user =
      await requireUser();


    const {
      data,
      error
    } =
      await client
        .from(table)
        .update(changes)
        .eq(
          'id',
          id
        )
        .eq(
          'owner_user_id',
          user.id
        )
        .select()
        .single();


    if (error) {

      console.error(
        `CloudDB UPDATE ${table}:`,
        error
      );

      throw error;

    }


    return data;

  }


  /* =====================================================
     DELETE
  ===================================================== */

  async function remove(
    table,
    id
  ) {

    const user =
      await requireUser();


    const {
      error
    } =
      await client
        .from(table)
        .delete()
        .eq(
          'id',
          id
        )
        .eq(
          'owner_user_id',
          user.id
        );


    if (error) {

      console.error(
        `CloudDB DELETE ${table}:`,
        error
      );

      throw error;

    }


    return true;

  }


  /* =====================================================
     SPECIALIZED METHODS
  ===================================================== */

  const farms = {

    list:
      () =>
        select('farms', {
          orderBy:
            'created_at',
          ascending:
            false
        }),


    create:
      data =>
        insert(
          'farms',
          data
        ),


    update:
      (id, changes) =>
        update(
          'farms',
          id,
          changes
        ),


    remove:
      id =>
        remove(
          'farms',
          id
        )

  };


  const houses = {

    list:
      () =>
        select('houses', {
          orderBy:
            'created_at',
          ascending:
            false
        }),


    create:
      data =>
        insert(
          'houses',
          data
        ),


    update:
      (id, changes) =>
        update(
          'houses',
          id,
          changes
        ),


    remove:
      id =>
        remove(
          'houses',
          id
        )

  };


  const flocks = {

    list:
      () =>
        select('flocks', {
          orderBy:
            'created_at',
          ascending:
            false
        }),


    create:
      data =>
        insert(
          'flocks',
          data
        ),


    update:
      (id, changes) =>
        update(
          'flocks',
          id,
          changes
        ),


    remove:
      id =>
        remove(
          'flocks',
          id
        )

  };


  const weights = {

    list:
      () =>
        select('weights', {
          orderBy:
            'evaluation_date',
          ascending:
            false
        }),


    create:
      data =>
        insert(
          'weights',
          data
        )

  };


  const feed = {

    list:
      () =>
        select(
          'feed_records',
          {
            orderBy:
              'record_date',
            ascending:
              false
          }
        ),


    create:
      data =>
        insert(
          'feed_records',
          data
        )

  };


  const water = {

    list:
      () =>
        select(
          'water_records',
          {
            orderBy:
              'record_date',
            ascending:
              false
          }
        ),


    create:
      data =>
        insert(
          'water_records',
          data
        )

  };


  const eggs = {

    list:
      () =>
        select(
          'egg_records',
          {
            orderBy:
              'record_date',
            ascending:
              false
          }
        ),


    create:
      data =>
        insert(
          'egg_records',
          data
        )

  };


  const health = {

    list:
      () =>
        select(
          'health_records',
          {
            orderBy:
              'record_date',
            ascending:
              false
          }
        ),


    create:
      data =>
        insert(
          'health_records',
          data
        )

  };


  const vaccinations = {

    list:
      () =>
        select(
          'vaccinations',
          {
            orderBy:
              'vaccination_date',
            ascending:
              false
          }
        ),


    create:
      data =>
        insert(
          'vaccinations',
          data
        )

  };


  const medications = {

    list:
      () =>
        select(
          'medications',
          {
            orderBy:
              'start_date',
            ascending:
              false
          }
        ),


    create:
      data =>
        insert(
          'medications',
          data
        )

  };


  const labs = {

    list:
      () =>
        select(
          'lab_records',
          {
            orderBy:
              'sample_date',
            ascending:
              false
          }
        ),


    create:
      data =>
        insert(
          'lab_records',
          data
        )

  };


  const environment = {

    list:
      () =>
        select(
          'environment_records',
          {
            orderBy:
              'record_date',
            ascending:
              false
          }
        ),


    create:
      data =>
        insert(
          'environment_records',
          data
        )

  };


  const tasks = {

    list:
      () =>
        select(
          'tasks',
          {
            orderBy:
              'created_at',
            ascending:
              false
          }
        ),


    create:
      data =>
        insert(
          'tasks',
          data
        )

  };


  /* =====================================================
     TEST CONNECTION
  ===================================================== */

  async function test() {

    try {

      const user =
        await currentUser();


      if (!user) {

        return {

          ok: false,

          message:
            'کاربر وارد نشده است.'

        };

      }


      const farmsList =
        await farms.list();


      return {

        ok: true,

        userId:
          user.id,

        farms:
          farmsList.length

      };

    }

    catch (error) {

      console.error(
        'CloudDB test failed:',
        error
      );


      return {

        ok: false,

        error

      };

    }

  }


  /* =====================================================
     PUBLIC API
  ===================================================== */

  window.AdinehCloudDB = {

    client,

    currentUser,

    requireUser,

    insert,

    select,

    update,

    remove,

    farms,

    houses,

    flocks,

    weights,

    feed,

    water,

    eggs,

    health,

    vaccinations,

    medications,

    labs,

    environment,

    tasks,

    test

  };


  console.log(
    'Adineh CloudDB loaded successfully.'
  );

})();
