function num(value){

return Number(

String(value ?? "")

.replace(/[۰-۹]/g,function(x){

return "۰۱۲۳۴۵۶۷۸۹".indexOf(x);

})

.replace(/[٠-٩]/g,function(x){

return "٠١٢٣٤٥٦٧٨٩".indexOf(x);

})

);

}


function fmt(value,decimals=1){

return Number(value || 0)

.toLocaleString(

"fa-IR",

{

maximumFractionDigits:decimals

}

);

}


function requireUser(){

if(!canSave()){

alert(

"برای ثبت اطلاعات ابتدا با حساب کاربری وارد شوید."

);

return false;

}

return true;

}


function fillFlockSelect(id,all=false){

const element=document.getElementById(id);


if(!element){

return;

}


const flocks=getFlocks();


element.innerHTML=

(

all

?

'<option value="">همه گله‌ها</option>'

:

'<option value="">انتخاب گله</option>'

)

+

flocks.map(function(flock){

return `

<option value="${escapeHTML(flock.id)}">

${escapeHTML(flock.farm)}

—

${escapeHTML(flock.hall)}

</option>

`;

}).join("");


const selected=getSelectedFlock();


if(selected){

element.value=selected;

}

}


document.addEventListener(

"DOMContentLoaded",

function(){

const userBox=document.getElementById("userBox");


if(userBox){

userBox.textContent=

activeUser()==="guest"

?

"👤 ورود مهمان"

:

"👤 کاربر: "+activeUser();

}


document.querySelectorAll(

"[data-logout]"

).forEach(function(button){

button.onclick=function(){

localStorage.removeItem("activeUser");

location.href="login.html";

};

});

}

);
