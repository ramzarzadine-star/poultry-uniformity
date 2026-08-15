function getUsers() {
    try {
        return JSON.parse(localStorage.getItem("adineh_users")) || {};
    } catch {
        return {};
    }
}

function setUsers(users) {
    localStorage.setItem("adineh_users", JSON.stringify(users));
}

function message(text, good = false) {
    const el = document.getElementById("message");

    if (!el) return;

    el.textContent = text;
    el.style.color = good ? "#087a4b" : "#b42345";
}

function getCredentials() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    return { username, password };
}

function register() {

    const { username, password } = getCredentials();

    if (username.length < 3) {
        message("نام کاربری حداقل ۳ کاراکتر باشد.");
        return;
    }

    if (password.length < 4) {
        message("رمز عبور حداقل ۴ کاراکتر باشد.");
        return;
    }

    const users = getUsers();

    if (users[username]) {
        message("این نام کاربری قبلاً ثبت شده است.");
        return;
    }

    users[username] = {
        password: password,
        createdAt: new Date().toISOString()
    };

    setUsers(users);

    localStorage.setItem("activeUser", username);

    message("ثبت نام با موفقیت انجام شد.", true);

    setTimeout(() => {
        location.href = "panel.html";
    }, 400);
}

function login() {

    const { username, password } = getCredentials();

    const users = getUsers();

    if (!users[username]) {
        message("نام کاربری یا رمز عبور صحیح نیست.");
        return;
    }

    if (users[username].password !== password) {
        message("نام کاربری یا رمز عبور صحیح نیست.");
        return;
    }

    localStorage.setItem("activeUser", username);

    location.href = "panel.html";
}

function guestLogin() {

    localStorage.setItem("activeUser", "guest");

    location.href = "panel.html";
}

document.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        login();
    }
});
