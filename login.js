let message;



document.addEventListener("DOMContentLoaded",function(){

message=document.getElementById("message");

});






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





let user={


username:username,

password:password,


created:new Date().toLocaleDateString("fa-IR")


};




localStorage.setItem(

"user_"+username,

JSON.stringify(user)

);



message.innerHTML="ثبت نام موفق بود";



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


message.innerHTML="رمز عبور اشتباه است";


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
