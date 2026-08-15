'use strict';

/*
  Adineh Poultry
  Authentication
*/

function getUsers() {
    try {
        return JSON.parse(
            localStorage.getItem('adineh_users') || '{}'
        );
    } catch {
        return {};
    }
}


function setUsers(users) {
    localStorage.setItem(
        'adineh_users',
        JSON.stringify(users)
    );
}


function message(text, good = false) {

    const el =
        document.getElementById('message');

    if (!el) return;

    el.textContent = text;

    el.style.color =
        good
            ? '#087a4b'
            : '#b42345';
}


function getCredentials() {

    const username =
        document
            .getElementById('username')
            ?.value
            .trim();

    const password =
        document
            .getElementById('password')
            ?.value || '';

    return {
        username,
        password
    };
}


/* =========================
   ثبت نام
========================= */

function register() {

    const {
        username,
        password
    } = getCredentials();


    if (!username || username.length < 3) {

        message(
            'نام کاربری حداقل ۳ کاراکتر باشد.'
        );

        return;
    }


    if (password.length < 6) {

        message(
            'رمز عبور حداقل ۶ کاراکتر باشد.'
        );

        return;
    }


    const users =
        getUsers();


    if (users[username]) {

        message(
            'این نام کاربری قبلاً ثبت شده است.'
        );

        return;
    }


    users[username] = {

        username,

        password,

        createdAt:
            new Date().toISOString()

    };


    setUsers(users);


    localStorage.setItem(
        'activeUser',
        username
    );


    message(
        'ثبت نام با موفقیت انجام شد.',
        true
    );


    setTimeout(
        () => {

            location.href =
                'index.html';

        },
        400
    );

}


/* =========================
   ورود
========================= */

function login() {

    const {
        username,
        password
    } = getCredentials();


    const users =
        getUsers();


    if (
        !username ||
        !users[username] ||
        users[username].password !== password
    ) {

        message(
            'نام کاربری یا رمز عبور صحیح نیست.'
        );

        return;
    }


    localStorage.setItem(
        'activeUser',
        username
    );


    location.href =
        'index.html';

}


/* =========================
   ورود مهمان
========================= */

function guestLogin() {

    localStorage.setItem(
        'activeUser',
        'guest'
    );


    location.href =
        'index.html';

}


/* =========================
   Enter
========================= */

document.addEventListener(
    'keydown',
    event => {

        if (
            event.key === 'Enter'
        ) {

            login();

        }

    }
);
