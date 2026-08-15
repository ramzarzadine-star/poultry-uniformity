const DB_PREFIX="adineh_v2_";


function activeUser(){

return localStorage.getItem("activeUser") || "guest";

}


function canSave(){

return activeUser()!=="guest";

}


function dbKey(name){

return DB_PREFIX+activeUser()+"_"+name;

}


function read(name,fallback=[]){

try{

return JSON.parse(

localStorage.getItem(dbKey(name))

) ?? fallback;

}

catch(error){

console.error(error);

return fallback;

}

}


function write(name,data){

if(!canSave()){

return false;

}

localStorage.setItem(

dbKey(name),

JSON.stringify(data)

);

return true;

}


function addRecord(name,record){

if(!canSave()){

return null;

}


const data=read(name,[]);


record.id=

record.id ||

(

crypto.randomUUID

?

crypto.randomUUID()

:

String(Date.now()+Math.random())

);


record.createdAt=

record.createdAt ||

new Date().toISOString();


data.push(record);


write(name,data);


return record;

}


function updateRecord(name,id,patch){

const data=read(name,[]);


const index=data.findIndex(

function(item){

return item.id===id;

}

);


if(index<0){

return false;

}


data[index]={

...data[index],

...patch,

updatedAt:new Date().toISOString()

};


return write(name,data);

}


function deleteRecord(name,id){

return write(

name,

read(name,[]).filter(

function(item){

return item.id!==id;

}

)

);

}


function getFlocks(){

return read("flocks",[]);

}


function getSelectedFlock(){

return localStorage.getItem(

"adineh_selected_flock"

) || "";

}


function setSelectedFlock(id){

if(id){

localStorage.setItem(

"adineh_selected_flock",

id

);

}

else{

localStorage.removeItem(

"adineh_selected_flock"

);

}

}


function selectedFlock(){

return getFlocks().find(

function(item){

return item.id===getSelectedFlock();

}

) || null;

}


function todayISO(){

return new Date()

.toISOString()

.slice(0,10);

}


function escapeHTML(value){

return String(value ?? "")

.replace(/[&<>"']/g,function(match){

return {

"&":"&amp;",

"<":"&lt;",

">":"&gt;",

'"':"&quot;",

"'":"&#39;"

}[match];

});

}
