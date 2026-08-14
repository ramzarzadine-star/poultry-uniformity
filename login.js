let message = document.getElementById("message");


function register(){

    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();


    if(username==="" || password===""){

        message.innerHTML="نام کاربری و رمز را وارد کنید";
        return;

    }


    let user = {

        username: username,
        password: password

    };


    localStorage.setItem(

        "user_"+username,

        JSON.stringify(user)

    );


    message.innerHTML="ثبت نام موفق شد";

}




function login(){

    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();



    let data = localStorage.getItem(

        "user_"+username

    );



    if(!data){

        message.innerHTML="کاربر وجود ندارد";
        return;

    }



    let user = JSON.parse(data);



    if(user.password !== password){

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
function register(){

alert("ثبت نام فعال شد");

}



function login(){

alert("ورود فعال شد");

}



function guestLogin(){

alert("مهمان فعال شد");

}
