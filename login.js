let message=document.getElementById("message");


function register(){

let username=document.getElementById("username").value.trim();
let password=document.getElementById("password").value.trim();


if(username==="" || password===""){

message.innerHTML="نام کاربری و رمز را وارد کنید";
return;

}



if(localStorage.getItem("user_"+username)){

message.innerHTML="این کاربر قبلا ثبت شده";
return;

}



localStorage.setItem(

"user_"+username,

JSON.stringify({

password:password

})

);



message.innerHTML="ثبت نام موفق شد";

}





function login(){


let username=document.getElementById("username").value.trim();

let password=document.getElementById("password").value.trim();



let data=localStorage.getItem(

"user_"+username

);



if(!data){

message.innerHTML="کاربر وجود ندارد";
return;

}



let user=JSON.parse(data);



if(user.password!==password){

message.innerHTML="رمز اشتباه است";
return;

}



localStorage.setItem(

"activeUser",

username

);



window.location.href="panel.html";


}






function guestLogin(){


localStorage.setItem(

"activeUser",

"guest"

);


window.location.href="panel.html";


}
localStorage.setItem(
"activeUser",
username
);
