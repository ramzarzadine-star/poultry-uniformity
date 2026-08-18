
'use strict';

/*
=========================================================
مرکز تخصصی سلامت طیور آدینه
CLOUD DATABASE
Supabase-first Data Layer
=========================================================
*/

(function () {

    const TABLE = 'poultry_records';

    const client =
        window.adinehSupabase ||
        window.supabaseClient ||
        null;

    if (!client) {
        console.error(
            '[Adineh CloudDB] Supabase client not found.'
        );
        return;
    }


    /* =====================================================
       USER
    ===================================================== */

    async function getUser() {

        const {
            data,
            error
        } = await client.auth.getUser();

        if (error) {
            throw error;
        }

        return data?.user || null;
    }


    async function requireUser() {

        const user = await getUser();

        if (!user) {
            throw new Error(
                'کاربر وارد نشده است.'
            );
        }

        return user;
    }


    /* =====================================================
       NORMALIZE
    ===================================================== */

    function normalize(record) {

        if (!record) {
            return null;
        }

        return {

            id:
                record.id,

            type:
                record.record_type,

            date:
                record.record_date || null,

            flockId:
                record.flock_id || null,

            ...(
                record.payload || {}
            ),

            _createdAt:
                record.created_at,

            _updatedAt:
                record.updated_at

        };
    }


    /* =====================================================
       LIST
    ===================================================== */

    async function list(
        type,
        options = {}
    ) {

        const user =
            await requireUser();

        let query =
            client
                .from(TABLE)
                .select('*')
                .eq(
                    'owner_user_id',
                    user.id
                )
                .eq(
                    'record_type',
                    type
                );

        if (
            options.flockId
        ) {

            query =
                query.eq(
                    'flock_id',
                    options.flockId
                );

        }

        if (
            options.from
        ) {

            query =
                query.gte(
                    'record_date',
                    options.from
                );

        }

        if (
            options.to
        ) {

            query =
                query.lte(
                    'record_date',
                    options.to
                );

        }

        query =
            query.order(
                'record_date',
                {
                    ascending:
                        options.ascending === true
                }
            );

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
        } = await query;

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
       GET
    ===================================================== */

    async function get(
        id
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
                    'id',
                    id
                )
                .eq(
                    'owner_user_id',
                    user.id
                )
                .maybeSingle();

        if (error) {
            throw error;
        }

        return normalize(data);
    }


    /* =====================================================
       CREATE
    ===================================================== */

    async function create(
        type,
        payload = {},
        options = {}
    ) {

        const user =
            await requireUser();

        const row = {

            owner_user_id:
                user.id,

            record_type:
                type,

            record_date:
                options.date ||
                payload.date ||
                null,

            flock_id:
                options.flockId ||
                payload.flockId ||
                payload.flock ||
                null,

            payload:
                {
                    ...payload
                }

        };

        const {
            data,
            error
        } =
            await client
                .from(TABLE)
                .insert(row)
                .select('*')
                .single();

        if (error) {
            throw error;
        }

        return normalize(data);
    }


    /* =====================================================
       UPDATE
    ===================================================== */

    async function update(
        id,
        payload = {},
        options = {}
    ) {

        const user =
            await requireUser();

        const changes = {

            payload:
                {
                    ...payload
                }

        };

        if (
            options.date !== undefined
        ) {

            changes.record_date =
                options.date;

        }

        if (
            options.flockId !== undefined
        ) {

            changes.flock_id =
                options.flockId;

        }

        const {
            data,
            error
        } =
            await client
                .from(TABLE)
                .update(changes)
                .eq(
                    'id',
                    id
                )
                .eq(
                    'owner_user_id',
                    user.id
                )
                .select('*')
                .single();

        if (error) {
            throw error;
        }

        return normalize(data);
    }


    /* =====================================================
       DELETE
    ===================================================== */

    async function remove(
        id
    ) {

        const user =
            await requireUser();

        const {
            error
        } =
            await client
                .from(TABLE)
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
            throw error;
        }

        return true;
    }


    /* =====================================================
       DELETE TYPE
    ===================================================== */

    async function clearType(
        type
    ) {

        const user =
            await requireUser();

        const {
            error
        } =
            await client
                .from(TABLE)
                .delete()
                .eq(
                    'owner_user_id',
                    user.id
                )
                .eq(
                    'record_type',
                    type
                );

        if (error) {
            throw error;
        }

        return true;
    }


    /* =====================================================
       TEST
    ===================================================== */

    async function test() {

        try {

            const user =
                await getUser();

            if (!user) {

                return {

                    ok: false,

                    message:
                        'کاربر وارد نشده است.'

                };

            }

            const {
                count,
                error
            } =
                await client
                    .from(TABLE)
                    .select(
                        'id',
                        {
                            count:
                                'exact',
                            head:
                                true
                        }
                    )
                    .eq(
                        'owner_user_id',
                        user.id
                    );

            if (error) {
                throw error;
            }

            return {

                ok: true,

                userId:
                    user.id,

                count:
                    count || 0

            };

        }

        catch (error) {

            console.error(
                '[Adineh CloudDB]',
                error
            );

            return {

                ok: false,

                message:
                    error.message ||
                    'خطای اتصال'

            };

        }

    }


    /* =====================================================
       BACKUP
    ===================================================== */

    async function backup() {

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
                .order(
                    'created_at',
                    {
                        ascending:
                            true
                    }
                );

        if (error) {
            throw error;
        }

        return {

            version:
                1,

            exportedAt:
                new Date().toISOString(),

            records:
                data || []

        };

    }


    /* =====================================================
       RESTORE
    ===================================================== */

    async function restore(
        backupData
    ) {

        const user =
            await requireUser();

        if (
            !backupData ||
            !Array.isArray(
                backupData.records
            )
        ) {

            throw new Error(
                'فایل پشتیبان معتبر نیست.'
            );

        }

        const rows =
            backupData.records.map(
                row => ({

                    owner_user_id:
                        user.id,

                    record_type:
                        row.record_type,

                    record_date:
                        row.record_date ||
                        null,

                    flock_id:
                        row.flock_id ||
                        null,

                    payload:
                        row.payload ||
                        {}

                })
            );

        if (!rows.length) {
            return 0;
        }

        const {
            error
        } =
            await client
                .from(TABLE)
                .insert(rows);

        if (error) {
            throw error;
        }

        return rows.length;
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.AdinehCloudDB = {

        TABLE,

        client,

        getUser,

        requireUser,

        list,

        get,

        create,

        update,

        remove,

        clearType,

        test,

        backup,

        restore

    };


    console.info(
        '[Adineh] Cloud database ready.'
    );

})();
