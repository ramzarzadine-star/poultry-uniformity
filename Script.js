let message=document.getElementById("message");
let weightChart;
let cvChart;
let weightTrendChart;


let currentUser="";
let guest=false;


let cvHistory=[];
let weightHistory=[];
let ageHistory=[];



const rossAge=[
7,14,21,28,35,42,49,56
];


const rossWeight=[
190,490,900,1400,1950,2500,3050,3600
];


const rossCV=[
13,12,11,10,9,8,7,6
];





function register(){

let user=document.getElementById("username").value.trim();

let pass=document.getElementById("password").value.trim();


if(user==="" || pass===""){

message.innerHTML="نام کاربری و رمز را وارد کنید";

return;

}


if(localStorage.getItem("user_"+user)){

message.innerHTML="این کاربر قبلا ثبت شده";

return;

}


localStorage.setItem(

"user_"+user,

JSON.stringify({

password:pass

})

);


message.innerHTML="ثبت نام موفق بود";


}

localStorage.setItem(

"user_"+user,

JSON.stringify({

password:pass

})

);


message.innerHTML="ثبت نام انجام شد";


}






function login(){

let user=document.getElementById("username").value.trim();

let pass=document.getElementById("password").value.trim();


let data=localStorage.getItem("user_"+user);



if(!data){

message.innerHTML="کاربر پیدا نشد";

return;

}



let obj=JSON.parse(data);



if(obj.password!==pass){

message.innerHTML="رمز اشتباه است";

return;

}



localStorage.setItem("activeUser",user);


window.location="index.html";


}




}







function guestLogin(){

localStorage.setItem(

"activeUser",

"guest"

);


window.location.href="index.html";


}







function getUser(){


let u=localStorage.getItem("activeUser");


if(!u){

return "guest";

}


return u;


}









function saveFarmData(){


if(guest){

return;

}


let farm=document.getElementById("farm").value.trim();


let data={


cvHistory,

weightHistory,

ageHistory

};



localStorage.setItem(

getUser()+"_"+farm,

JSON.stringify(data)

);


}








function loadFarmData(){


if(guest){

return;

}



let farm=document.getElementById("farm").value.trim();


let data=localStorage.getItem(

getUser()+"_"+farm

);



if(data){


let obj=JSON.parse(data);


cvHistory=obj.cvHistory || [];

weightHistory=obj.weightHistory || [];

ageHistory=obj.ageHistory || [];


}

}









function persianNumber(str){


return str.replace(/[۰-۹]/g,function(x){

return "۰۱۲۳۴۵۶۷۸۹".indexOf(x);

});

}








function parseWeights(text){


text=persianNumber(text);



return text

.replace(/،/g,",")

.split(/[\s,]+/)

.map(Number)

.filter(x=>Number.isFinite(x)&&x>0);


}









function average(arr){

return arr.reduce((a,b)=>a+b,0)/arr.length;

}








function standard(arr,mean){


let sum=0;


arr.forEach(x=>{

sum+=Math.pow(x-mean,2);

});


return Math.sqrt(sum/(arr.length-1));


}








function uniformity(arr,mean,p){


let min=mean*(1-p);

let max=mean*(1+p);


return arr.filter(x=>x>=min&&x<=max).length/arr.length*100;


}









function calculate(){


let farm=document.getElementById("farm").value.trim();


if(farm===""){

alert("نام فارم را وارد کنید");

return;

}



loadFarmData();



let weights=parseWeights(

document.getElementById("weightsInput").value

);



if(weights.length<2){

alert("حداقل دو وزن وارد کنید");

return;

}




let mean=average(weights);


let sd=standard(weights,mean);


let cv=(sd/mean)*100;



let u10=uniformity(weights,mean,.1);

let u15=uniformity(weights,mean,.15);





sample.innerHTML=weights.length;

mean.innerHTML=mean.toFixed(1);

min.innerHTML=Math.min(...weights);

max.innerHTML=Math.max(...weights);

sd.innerHTML=sd.toFixed(1);

cv.innerHTML=cv.toFixed(2)+"%";

u10.innerHTML=u10.toFixed(1)+"%";

u15.innerHTML=u15.toFixed(1)+"%";






let age=document.getElementById("age").value;


if(age===""){

age=(ageHistory.length+1)*7;

}





cvHistory.push(Number(cv.toFixed(2)));

weightHistory.push(Number(mean.toFixed(1)));

ageHistory.push(Number(age));





saveFarmData();



drawWeight(weights);

drawCV();

drawWeightTrend();


}










function drawWeight(data){



if(weightChart){

weightChart.destroy();

}



weightChart=new Chart(

document.getElementById("weightChart"),

{

type:"line",

data:{


labels:data.map((x,i)=>"نمونه "+(i+1)),


datasets:[{

label:"وزن واقعی",

data:data,

borderWidth:3,

fill:false,

tension:.3

}]

}

}

);


}









function drawWeightTrend(){


if(weightTrendChart){

weightTrendChart.destroy();

}




weightTrendChart=new Chart(

document.getElementById("weightTrendChart"),

{

type:"line",

data:{


labels:rossAge.map(x=>x+" روز"),


datasets:[


{

label:"وزن واقعی گله",

data:weightHistory,

borderWidth:3,

fill:false,

tension:.3

},



{

label:"استاندارد Ross 308",

data:rossWeight,

borderWidth:3,

borderDash:[10,5],

fill:false,

tension:.3

}



]

}

}

);


}









function drawCV(){


if(cvChart){

cvChart.destroy();

}



cvChart=new Chart(

document.getElementById("cvChart"),

{

type:"line",

data:{


labels:rossAge.map(x=>x+" روز"),



datasets:[


{

label:"CV واقعی گله",

data:cvHistory,

borderWidth:3,

fill:false,

tension:.3

},


{

label:"استاندارد Ross 308",

data:rossCV,

borderWidth:3,

borderDash:[10,5],

fill:false,

tension:.3

}


]

}

}

);


}







window.onload=function(){


let user=getUser();


if(document.getElementById("userBox")){


if(user==="guest"){

userBox.innerHTML="ورود مهمان (بدون ذخیره اطلاعات)";

}

else{

userBox.innerHTML="کاربر: "+user;

}


}



};
;
let activeUser = localStorage.getItem("activeUser");


function logout(){

localStorage.removeItem("activeUser");

window.location.href="login.html";

}





function saveData(){


if(activeUser==="guest"){

return;

}



let data={


farm:document.getElementById("farm").value,

hall:document.getElementById("hall").value,

type:document.getElementById("type").value,

age:document.getElementById("age").value,

countBird:document.getElementById("countBird").value,


weights:document.getElementById("weightsInput").value,


cvHistory:cvHistory,

weightHistory:weightHistory,

ageHistory:ageHistory


};



localStorage.setItem(

"data_"+activeUser,

JSON.stringify(data)

);


}







function loadData(){



if(activeUser==="guest"){

userBox.innerHTML="ورود مهمان";

return;

}



userBox.innerHTML="کاربر: "+activeUser;



let data=localStorage.getItem(

"data_"+activeUser

);



if(!data){

return;

}



let obj=JSON.parse(data);



farm.value=obj.farm || "";

hall.value=obj.hall || "";

type.value=obj.type || "";

age.value=obj.age || "";

countBird.value=obj.countBird || "";

weightsInput.value=obj.weights || "";


cvHistory=obj.cvHistory || [];

weightHistory=obj.weightHistory || [];

ageHistory=obj.ageHistory || [];


}







window.addEventListener(

"load",

function(){


loadData();


}

);
