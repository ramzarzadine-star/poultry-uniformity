function value(id){

return String(

document.getElementById(id).value || ""

).trim();

}


function register(){

const username=value("username");

const password=value("password");

const message=
document.getElementById("message");


if(
username.length<3 ||
password.length<4
){

message.textContent=
"نام کاربری حداقل ۳ و رمز عبور حداقل ۴ کاراکتر باشد.";

return;

}


const users=
JSON.parse(

localStorage.getItem(
"adineh_users"
) || "{}"

);


if(users[username]){

message.textContent=
"این نام کاربری قبلاً ثبت شده است.";

return;

}


users[username]={

password:password,

createdAt:
new Date().toISOString()

};


localStorage.setItem(

"adineh_users",

JSON.stringify(users)

);


localStorage.setItem(

"activeUser",

username

);


location.href="panel.html";

}


function login(){

const username=value("username");

const password=value("password");

const message=
document.getElementById("message");


const users=
JSON.parse(

localStorage.getItem(
"adineh_users"
) || "{}"

);


if(
users[username] &&
users[username].password===password
){

localStorage.setItem(

"activeUser",

username

);


location.href="panel.html";

}

else{

message.textContent=
"نام کاربری یا رمز عبور صحیح نیست.";

}

}


function guestLogin(){

localStorage.setItem(

"activeUser",

"guest"

);


location.href="panel.html";

}
