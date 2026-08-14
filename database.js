
let activeUser = localStorage.getItem("activeUser") || "guest";


function canSave(){

return activeUser !== "guest";

}





function saveModule(module,data){


if(!canSave()){

return;

}



let key="adineh_"+activeUser+"_"+module;


localStorage.setItem(

key,

JSON.stringify(data)

);


}





function loadModule(module){


if(!canSave()){

return null;

}



let key="adineh_"+activeUser+"_"+module;


let data=localStorage.getItem(key);



if(data){

return JSON.parse(data);

}



return null;


}





function showCurrentUser(){


let box=document.getElementById("userBox");


if(box){

box.innerHTML="👤 کاربر: "+activeUser;

}


}



document.addEventListener(

"DOMContentLoaded",

showCurrentUser

);
