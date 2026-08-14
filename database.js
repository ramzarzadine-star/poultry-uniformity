let activeUser = localStorage.getItem("activeUser") || "guest";



function canSave(){

    return activeUser !== "guest";

}





function getKey(module){

    return "adineh_" + activeUser + "_" + module;

}





function saveRecord(module,record){


    if(!canSave()){

        alert("ورود مهمان امکان ذخیره ندارد");

        return;

    }



    let oldData = loadRecords(module);



    oldData.push(record);



    localStorage.setItem(

        getKey(module),

        JSON.stringify(oldData)

    );


}







function loadRecords(module){


    if(!canSave()){

        return [];

    }



    let data = localStorage.getItem(

        getKey(module)

    );



    if(data){

        return JSON.parse(data);

    }



    return [];

}







function deleteRecord(module,index){


    let data=loadRecords(module);


    data.splice(index,1);


    localStorage.setItem(

        getKey(module),

        JSON.stringify(data)

    );


}








function showUser(){


    let box=document.getElementById("userBox");



    if(box){


        if(activeUser==="guest"){

            box.innerHTML="👤 ورود مهمان";

        }

        else{

            box.innerHTML="👤 کاربر: "+activeUser;

        }


    }


}






document.addEventListener(

"DOMContentLoaded",

function(){

showUser();

}

);
