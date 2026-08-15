'use strict';

/*
=========================================================
 ADINEH POULTRY
 Authentication Guard
=========================================================

این فایل مسئول:

1. بررسی Session
2. بررسی Profile
3. بررسی status
4. بررسی role
5. خروج امن
6. جلوگیری از ورود حساب غیرفعال
=========================================================
*/


(function () {

    const client =
        window.supabaseClient;


    if (!client) {

        console.error(
            'Supabase client is not available.'
        );

        return;
    }


    /*
    =====================================================
    دریافت کاربر فعلی
    =====================================================
    */

    async function getCurrentUser() {

        const {
            data,
            error
        } =
            await client.auth.getUser();


        if (error) {

            console.error(
                'getCurrentUser:',
                error
            );

            return null;
        }


        return data?.user || null;

    }


    /*
    =====================================================
    دریافت Profile
    =====================================================
    */

    async function getCurrentProfile() {

        const user =
            await getCurrentUser();


        if (!user) {
            return null;
        }


        const {
            data,
            error
        } =
            await client
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
                'getCurrentProfile:',
                error
            );

            return null;
        }


        return data || null;

    }


    /*
    =====================================================
    بررسی دسترسی
    =====================================================
    */

    async function requireActiveUser(
        options = {}
    ) {

        const redirect =
            options.redirect !== false;


        const loginUrl =
            'login.html';


        const user =
            await getCurrentUser();


        if (!user) {

            if (redirect) {

                window.location.replace(
                    loginUrl
                );

            }

            return null;
        }


        const profile =
            await getCurrentProfile();


        if (!profile) {

            await client.auth.signOut();


            if (redirect) {

                window.location.replace(
                    loginUrl
                );

            }

            return null;
        }


        if (
            profile.status !==
            'active'
        ) {

            await client.auth.signOut();


            if (redirect) {

                window.location.replace(
                    loginUrl
                );

            }

            return null;
        }


        return {

            user,

            profile

        };

    }


    /*
    =====================================================
    بررسی Owner
    =====================================================
    */

    async function requireOwner() {

        const session =
            await requireActiveUser();


        if (!session) {
            return null;
        }


        if (
            session.profile.role !==
            'owner'
        ) {

            window.location.replace(
                'index.html'
            );

            return null;
        }


        return session;

    }


    /*
    =====================================================
    خروج
    =====================================================
    */

    async function logout() {

        try {

            await client.auth.signOut();

        } catch (error) {

            console.error(
                'Logout error:',
                error
            );

        }


        try {

            sessionStorage.removeItem(
                'adineh_user_role'
            );

            sessionStorage.removeItem(
                'adineh_user_name'
            );

        } catch (_) {}


        window.location.replace(
            'login.html'
        );

    }


    /*
    =====================================================
    API عمومی
    =====================================================
    */

    window.AdinehAuth = {

        getCurrentUser,

        getCurrentProfile,

        requireActiveUser,

        requireOwner,

        logout

    };

})();
