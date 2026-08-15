'use strict';

/*
=========================================================
 ADINEH POULTRY
 Professional Authentication
 Supabase Auth
=========================================================
*/

(function () {

    const client = window.supabaseClient;

    if (!client) {

        console.error(
            'Supabase client is not available.'
        );

        return;
    }


    /*
    =====================================================
    عناصر
    =====================================================
    */

    const loginTab =
        document.getElementById('loginTab');

    const registerTab =
        document.getElementById('registerTab');

    const loginSection =
        document.getElementById('loginSection');

    const registerSection =
        document.getElementById('registerSection');

    const loginButton =
        document.getElementById('loginButton');

    const registerButton =
        document.getElementById('registerButton');

    const messageElement =
        document.getElementById('message');


    /*
    =====================================================
    پیام
    =====================================================
    */

    function showMessage(
        text,
        type = 'error'
    ) {

        if (!messageElement) {
            return;
        }

        messageElement.textContent =
            text || '';

        messageElement.className =
            'message';

        if (!text) {
            return;
        }

        messageElement.classList.add(
            'show',
            type
        );
    }


    /*
    =====================================================
    تغییر تب
    =====================================================
    */

    function showLogin() {

        loginTab.classList.add('active');

        registerTab.classList.remove('active');

        loginSection.classList.add('active');

        registerSection.classList.remove('active');

        showMessage('');
    }


    function showRegister() {

        registerTab.classList.add('active');

        loginTab.classList.remove('active');

        registerSection.classList.add('active');

        loginSection.classList.remove('active');

        showMessage('');
    }


    loginTab.addEventListener(
        'click',
        showLogin
    );


    registerTab.addEventListener(
        'click',
        showRegister
    );


    /*
    =====================================================
    نمایش / مخفی کردن رمز
    =====================================================
    */

    document
        .querySelectorAll('.password-toggle')
        .forEach(button => {

            button.addEventListener(
                'click',
                function () {

                    const targetId =
                        this.dataset.target;

                    const input =
                        document.getElementById(
                            targetId
                        );

                    if (!input) {
                        return;
                    }

                    if (
                        input.type ===
                        'password'
                    ) {

                        input.type =
                            'text';

                        this.textContent =
                            '◉';

                    } else {

                        input.type =
                            'password';

                        this.textContent =
                            '◉';
                    }

                }
            );

        });


    /*
    =====================================================
    Loading
    =====================================================
    */

    function setLoading(
        button,
        loading,
        text
    ) {

        if (!button) {
            return;
        }

        button.disabled =
            loading;

        if (loading) {

            button.innerHTML =
                `
                <span class="loading">
                    <span class="spinner"></span>
                    ${text}
                </span>
                `;

        } else {

            button.textContent =
                text;
        }

    }


    /*
    =====================================================
    اعتبارسنجی ایمیل
    =====================================================
    */

    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email);

    }


    /*
    =====================================================
    تبدیل شماره فارسی به انگلیسی
    =====================================================
    */

    function normalizeDigits(value) {

        if (!value) {
            return '';
        }

        return value
            .replace(/[۰-۹]/g, digit =>
                String(
                    '۰۱۲۳۴۵۶۷۸۹'
                        .indexOf(digit)
                )
            )
            .replace(/[٠-٩]/g, digit =>
                String(
                    '٠١٢٣٤٥٦٧٨٩'
                        .indexOf(digit)
                )
            );

    }


    /*
    =====================================================
    ورود
    =====================================================
    */

    async function login() {

        const email =
            document
                .getElementById(
                    'loginEmail'
                )
                .value
                .trim()
                .toLowerCase();

        const password =
            document
                .getElementById(
                    'loginPassword'
                )
                .value;


        if (!email) {

            showMessage(
                'ایمیل را وارد کنید.'
            );

            return;
        }


        if (!isValidEmail(email)) {

            showMessage(
                'فرمت ایمیل صحیح نیست.'
            );

            return;
        }


        if (!password) {

            showMessage(
                'رمز عبور را وارد کنید.'
            );

            return;
        }


        setLoading(
            loginButton,
            true,
            'در حال ورود...'
        );


        try {

            const {
                data,
                error
            } =
                await client.auth.signInWithPassword({

                    email,
                    password

                });


            if (error) {

                console.error(
                    'Login error:',
                    error
                );

                showMessage(
                    translateAuthError(
                        error
                    )
                );

                return;
            }


            if (
                !data ||
                !data.user
            ) {

                showMessage(
                    'ورود انجام نشد. دوباره تلاش کنید.'
                );

                return;
            }


            /*
            ---------------------------------------------
            دریافت پروفایل
            ---------------------------------------------
            */

            const {
                data: profile,
                error: profileError
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
                        last_seen_at
                    `)
                    .eq(
                        'id',
                        data.user.id
                    )
                    .maybeSingle();


            if (profileError) {

                console.error(
                    'Profile error:',
                    profileError
                );

                await client.auth.signOut();

                showMessage(
                    'خطا در دریافت اطلاعات حساب کاربری.'
                );

                return;
            }


            if (!profile) {

                await client.auth.signOut();

                showMessage(
                    'پروفایل کاربری شما هنوز ایجاد نشده است. با مدیریت مرکز تماس بگیرید.'
                );

                return;
            }


            /*
            ---------------------------------------------
            وضعیت حساب
            ---------------------------------------------
            */

            if (
                profile.status !==
                'active'
            ) {

                await client.auth.signOut();


                if (
                    profile.status ===
                    'pending'
                ) {

                    showMessage(
                        'حساب شما ثبت شده اما هنوز توسط مدیریت مرکز فعال نشده است.'
                    );

                } else if (
                    profile.status ===
                    'suspended'
                ) {

                    showMessage(
                        'دسترسی حساب شما موقتاً تعلیق شده است.'
                    );

                } else if (
                    profile.status ===
                    'disabled'
                ) {

                    showMessage(
                        'دسترسی این حساب غیرفعال شده است.'
                    );

                } else {

                    showMessage(
                        'وضعیت حساب شما اجازه ورود به سامانه را نمی‌دهد.'
                    );

                }

                return;
            }


            /*
            ---------------------------------------------
            بروزرسانی آخرین فعالیت
            ---------------------------------------------
            */

            try {

                await client
                    .from('profiles')
                    .update({
                        last_seen_at:
                            new Date()
                                .toISOString()
                    })
                    .eq(
                        'id',
                        data.user.id
                    );

            } catch (
                lastSeenError
            ) {

                console.warn(
                    'last_seen update failed:',
                    lastSeenError
                );

            }


            /*
            ---------------------------------------------
            ذخیره اطلاعات غیرحساس برای UI
            ---------------------------------------------
            */

            sessionStorage.setItem(
                'adineh_user_role',
                profile.role || 'user'
            );

            sessionStorage.setItem(
                'adineh_user_name',
                (
                    profile.first_name ||
                    profile.username ||
                    email
                )
            );


            showMessage(
                'ورود با موفقیت انجام شد.',
                'success'
            );


            /*
            ---------------------------------------------
            Owner
            ---------------------------------------------
            */

            setTimeout(
                () => {

                    if (
                        profile.role ===
                        'owner'
                    ) {

                        /*
                        فعلاً به برنامه اصلی می‌رویم.
                        پنل مدیریتی اختصاصی را در مرحله بعد
                        به‌صورت امن اضافه می‌کنیم.
                        */

                        window.location.replace(
                            'index.html'
                        );

                    } else {

                        window.location.replace(
                            'index.html'
                        );

                    }

                },
                500
            );


        } catch (error) {

            console.error(
                'Unexpected login error:',
                error
            );

            showMessage(
                'خطای غیرمنتظره‌ای رخ داد. اتصال اینترنت و اطلاعات ورود را بررسی کنید.'
            );

        } finally {

            setLoading(
                loginButton,
                false,
                'ورود به سامانه'
            );

        }

    }


    /*
    =====================================================
    ثبت نام
    =====================================================
    */

    async function register() {

        const firstName =
            document
                .getElementById(
                    'firstName'
                )
                .value
                .trim();

        const lastName =
            document
                .getElementById(
                    'lastName'
                )
                .value
                .trim();

        const email =
            document
                .getElementById(
                    'registerEmail'
                )
                .value
                .trim()
                .toLowerCase();

        const phone =
            normalizeDigits(
                document
                    .getElementById(
                        'phone'
                    )
                    .value
                    .trim()
            );

        const companyName =
            document
                .getElementById(
                    'companyName'
                )
                .value
                .trim();

        const password =
            document
                .getElementById(
                    'registerPassword'
                )
                .value;

        const confirmPassword =
            document
                .getElementById(
                    'confirmPassword'
                )
                .value;


        if (!firstName) {

            showMessage(
                'نام را وارد کنید.'
            );

            return;
        }


        if (!lastName) {

            showMessage(
                'نام خانوادگی را وارد کنید.'
            );

            return;
        }


        if (!email) {

            showMessage(
                'ایمیل را وارد کنید.'
            );

            return;
        }


        if (!isValidEmail(email)) {

            showMessage(
                'فرمت ایمیل صحیح نیست.'
            );

            return;
        }


        if (
            password.length <
            8
        ) {

            showMessage(
                'رمز عبور باید حداقل ۸ کاراکتر باشد.'
            );

            return;
        }


        if (
            password !==
            confirmPassword
        ) {

            showMessage(
                'تکرار رمز عبور با رمز اصلی یکسان نیست.'
            );

            return;
        }


        setLoading(
            registerButton,
            true,
            'در حال ایجاد حساب...'
        );


        try {

            /*
            ---------------------------------------------
            ثبت نام در Supabase Auth
            ---------------------------------------------
            */

            const {
                data,
                error
            } =
                await client.auth.signUp({

                    email,

                    password,

                    options: {

                        data: {

                            first_name:
                                firstName,

                            last_name:
                                lastName,

                            phone:
                                phone || null,

                            company_name:
                                companyName || null

                        }

                    }

                });


            if (error) {

                console.error(
                    'Register error:',
                    error
                );

                showMessage(
                    translateAuthError(
                        error
                    )
                );

                return;
            }


            if (
                !data ||
                !data.user
            ) {

                showMessage(
                    'ثبت نام انجام نشد. دوباره تلاش کنید.'
                );

                return;
            }


            /*
            ---------------------------------------------
            اگر تأیید ایمیل فعال باشد
            ---------------------------------------------
            */

            if (
                !data.session
            ) {

                showMessage(
                    'ثبت‌نام انجام شد. لینک تأیید به ایمیل شما ارسال شده است. پس از تأیید ایمیل، حساب توسط مدیریت مرکز بررسی و فعال می‌شود.',
                    'success'
                );

                return;
            }


            /*
            ---------------------------------------------
            اگر تأیید ایمیل غیرفعال باشد
            ---------------------------------------------
            */

            showMessage(
                'ثبت‌نام با موفقیت انجام شد. حساب شما در انتظار تأیید مدیریت مرکز است.',
                'success'
            );


            setTimeout(
                () => {

                    showLogin();

                    document
                        .getElementById(
                            'loginEmail'
                        )
                        .value =
                        email;

                },
                1500
            );


        } catch (error) {

            console.error(
                'Unexpected registration error:',
                error
            );

            showMessage(
                'خطای غیرمنتظره‌ای هنگام ثبت‌نام رخ داد.'
            );

        } finally {

            setLoading(
                registerButton,
                false,
                'ایجاد حساب'
            );

        }

    }


    /*
    =====================================================
    ترجمه خطاهای Supabase
    =====================================================
    */

    function translateAuthError(
        error
    ) {

        if (!error) {

            return 'خطایی رخ داد. دوباره تلاش کنید.';

        }


        const message =
            String(
                error.message || ''
            )
                .toLowerCase();


        if (
            message.includes(
                'invalid login credentials'
            )
        ) {

            return 'ایمیل یا رمز عبور صحیح نیست.';

        }


        if (
            message.includes(
                'email not confirmed'
            )
        ) {

            return 'ایمیل حساب هنوز تأیید نشده است. ایمیل خود را بررسی کنید.';

        }


        if (
            message.includes(
                'user already registered'
            )
        ) {

            return 'این ایمیل قبلاً ثبت شده است. از بخش ورود استفاده کنید.';

        }


        if (
            message.includes(
                'password should be at least'
            )
        ) {

            return 'رمز عبور به اندازه کافی قوی نیست.';

        }


        if (
            message.includes(
                'rate limit'
            )
        ) {

            return 'تعداد درخواست‌ها زیاد است. چند دقیقه بعد دوباره تلاش کنید.';

        }


        if (
            message.includes(
                'network'
            )
        ) {

            return 'اتصال اینترنت را بررسی کنید.';

        }


        return (
            error.message ||
            'خطایی در احراز هویت رخ داد.'
        );

    }


    /*
    =====================================================
    Enter
    =====================================================
    */

    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key !==
                'Enter'
            ) {
                return;
            }


            const loginActive =
                loginSection.classList.contains(
                    'active'
                );


            if (loginActive) {

                login();

            } else {

                register();

            }

        }
    );


    /*
    =====================================================
    اتصال دکمه‌ها
    =====================================================
    */

    loginButton.addEventListener(
        'click',
        login
    );


    registerButton.addEventListener(
        'click',
        register
    );


    /*
    =====================================================
    اگر کاربر از قبل وارد شده
    =====================================================
    */

    (async function checkExistingSession() {

        try {

            const {
                data
            } =
                await client.auth.getSession();


            if (
                data &&
                data.session &&
                data.session.user
            ) {

                /*
                اینجا کاربر وارد شده است.
                فعلاً او را به برنامه اصلی می‌بریم.
                */

                console.log(
                    'Existing Supabase session detected.'
                );

            }

        } catch (error) {

            console.warn(
                'Session check failed:',
                error
            );

        }

    })();


})();
