'use strict';

/* =========================================================
   مرکز تخصصی سلامت طیور آدینه
   CLOUD DATABASE — Supabase First
========================================================= */

(function () {

  const TABLE = 'poultry_records';

  const TYPES = [
    'farms',
    'houses',
    'flocks',
    'weights',
    'feed',
    'water',
    'mortality',
    'eggs',
    'health',
    'vaccines',
    'meds',
    'labs',
    'environment',
    'tasks'
  ];

  const client =
    window.adinehSupabase ||
    window.supabaseClient ||
    null;


  if (!client) {
    console.error(
      '[Adineh CloudDB] Supabase client not found.'
    );

    throw new Error(
      'Supabase client not found.'
    );
  }


  /* =====================================================
     USER
  ===================================================== */

  async function requireUser() {

    const {
      data,
      error
    } =
      await client.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data?.user) {
      throw new Error(
        'کاربر وارد نشده است.'
      );
    }

    return data.user;
  }


  /* =====================================================
     CLONE
  ===================================================== */

  function clone(value) {

    return JSON.parse(
      JSON.stringify(value)
    );

  }


  /* =====================================================
     NORMALIZE
  ===================================================== */

  function normalize(row) {

    const payload =
      row?.payload &&
      typeof row.payload === 'object'
        ? row.payload
        : {};


    return {

      ...payload,

      id:
        row.id,

      date:
        row.record_date ||
        payload.date ||
        null,

      flock:
        row.flock_id ||
        payload.flock ||
        null,

      flockId:
        row.flock_id ||
        payload.flockId ||
        null,

      _createdAt:
        row.created_at,

      _updatedAt:
        row.updated_at

    };

  }


  /* =====================================================
     LIST
  ===================================================== */

  async function list(
    type
  ) {

    const user =
      await requireUser();


    const {
      data,
      error
    } =
      await client
        .from(TABLE)
        .select('*')
        .eq(
          'owner_user_id',
          user.id
        )
        .eq(
          'record_type',
          type
        )
        .order(
          'created_at',
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    return (
      data || []
    ).map(
      normalize
    );

  }


  /* =====================================================
     HYDRATE
  ===================================================== */

  async function hydrate() {

    await requireUser();


    const result = {

      farms: [],

      houses: [],

      flocks: [],

      weights: [],

      feed: [],

      water: [],

      mortality: [],

      eggs: [],

      health: [],

      vaccines: [],

      meds: [],

      labs: [],

      environment: [],

      tasks: [],

      settings: {

        clinic:
          'مرکز تخصصی سلامت طیور آدینه'

      }

    };


    const responses =
      await Promise.all(
        TYPES.map(
          type =>
            list(type)
        )
      );


    TYPES.forEach(
      (
        type,
        index
      ) => {

        result[type] =
          responses[index];

      }
    );


    const settings =
      await list(
        'settings'
      );


    if (settings[0]) {

      result.settings = {

        ...result.settings,

        ...settings[0]

      };


      delete result.settings.id;

    }


    return result;

  }


  /* =====================================================
     UUID VALIDATION
  ===================================================== */

  function isUUID(
    value
  ) {

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(
        String(value || '')
      );

  }


  /* =====================================================
     CONVERT RECORD
  ===================================================== */

  function toRow(
    userId,
    type,
    record
  ) {

    const payload =
      clone(
        record || {}
      );


    const id =
      payload.id;


    delete payload._createdAt;

    delete payload._updatedAt;


    return {

      id,

      owner_user_id:
        userId,

      record_type:
        type,

      record_date:
        payload.date ||
        null,

      flock_id:
        payload.flock ||
        payload.flockId ||
        null,

      payload

    };

  }


  /* =====================================================
     SYNC TYPE
  ===================================================== */

  async function syncType(
    userId,
    type,
    records
  ) {

    const safeRecords =
      Array.isArray(records)
        ? records
        : [];


    const {
      data: existing,
      error: existingError
    } =
      await client
        .from(TABLE)
        .select('id')
        .eq(
          'owner_user_id',
          userId
        )
        .eq(
          'record_type',
          type
        );


    if (existingError) {
      throw existingError;
    }


    const rows =
      safeRecords.map(
        record =>
          toRow(
            userId,
            type,
            record
          )
      );


    const invalid =
      rows.find(
        row =>
          !isUUID(
            row.id
          )
      );


    if (invalid) {

      throw new Error(
        `شناسه نامعتبر در بخش ${type}`
      );

    }


    if (rows.length) {

      const {
        error
      } =
        await client
          .from(TABLE)
          .upsert(
            rows,
            {
              onConflict:
                'id'
            }
          );


      if (error) {
        throw error;
      }

    }


    const keep =
      new Set(
        rows.map(
          row =>
            row.id
        )
      );


    const stale =
      (
        existing || []
      )
        .map(
          row =>
            row.id
        )
        .filter(
          id =>
            !keep.has(id)
        );


    if (stale.length) {

      const {
        error
      } =
        await client
          .from(TABLE)
          .delete()
          .eq(
            'owner_user_id',
            userId
          )
          .eq(
            'record_type',
            type
          )
          .in(
            'id',
            stale
          );


      if (error) {
        throw error;
      }

    }

  }


  /* =====================================================
     FULL SYNC
  ===================================================== */

  async function syncSnapshot(
    db
  ) {

    const user =
      await requireUser();


    for (
      const type of TYPES
    ) {

      await syncType(
        user.id,
        type,
        db[type]
      );

    }


    return true;

  }


  /* =====================================================
     SERIALIZED QUEUE
  ===================================================== */

  let syncPromise =
    Promise.resolve();


  function queueSync(
    db
  ) {

    const snapshot =
      clone(db);


    syncPromise =
      syncPromise
        .catch(
          () => {}
        )
        .then(
          () =>
            syncSnapshot(
              snapshot
            )
        );


    return syncPromise;

  }


  /* =====================================================
     BACKUP
  ===================================================== */

  async function backup() {

    const data =
      await hydrate();


    return {

      version:
        2,

      exportedAt:
        new Date().toISOString(),

      data

    };

  }


  /* =====================================================
     RESTORE
  ===================================================== */

  async function restore(
    backupData
  ) {

    if (
      !backupData ||
      !backupData.data
    ) {

      throw new Error(
        'فایل پشتیبان معتبر نیست.'
      );

    }


    const data =
      backupData.data;


    const normalized = {

      farms:
        Array.isArray(
          data.farms
        )
          ? data.farms
          : [],

      houses:
        Array.isArray(
          data.houses
        )
          ? data.houses
          : [],

      flocks:
        Array.isArray(
          data.flocks
        )
          ? data.flocks
          : [],

      weights:
        Array.isArray(
          data.weights
        )
          ? data.weights
          : [],

      feed:
        Array.isArray(
          data.feed
        )
          ? data.feed
          : [],

      water:
        Array.isArray(
          data.water
        )
          ? data.water
          : [],

      mortality:
        Array.isArray(
          data.mortality
        )
          ? data.mortality
          : [],

      eggs:
        Array.isArray(
          data.eggs
        )
          ? data.eggs
          : [],

      health:
        Array.isArray(
          data.health
        )
          ? data.health
          : [],

      vaccines:
        Array.isArray(
          data.vaccines
        )
          ? data.vaccines
          : [],

      meds:
        Array.isArray(
          data.meds
        )
          ? data.meds
          : [],

      labs:
        Array.isArray(
          data.labs
        )
          ? data.labs
          : [],

      environment:
        Array.isArray(
          data.environment
        )
          ? data.environment
          : [],

      tasks:
        Array.isArray(
          data.tasks
        )
          ? data.tasks
          : [],

      settings:
        data.settings ||
        {
          clinic:
            'مرکز تخصصی سلامت طیور آدینه'
        }

    };


    await syncSnapshot(
      normalized
    );


    return normalized;

  }


  /* =====================================================
     PUBLIC API
  ===================================================== */

  window.AdinehCloudDB = {

    TABLE,

    client,

    requireUser,

    list,

    hydrate,

    syncSnapshot,

    queueSync,

    backup,

    restore

  };


  console.info(
    '[Adineh] Cloud database ready.'
  );

})();
