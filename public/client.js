document.addEventListener("DOMContentLoaded", function () {
const roomName=document.querySelector("#roomName").innerHTML;
const uname=document.querySelector("#uname").innerHTML;
const memberList=document.querySelector("#memberList");
console.log(uname);

const socket = io();
const member=[];

let scrollHeight = document.getElementById("msg-area").scrollHeight;
document.getElementById("msg-area").scrollTop=scrollHeight;

socket.on('connect',()=>{
    socket.emit('joinRoom',roomName,uname);
})


socket.on('newJoined',(results)=>{
    console.log('results is '+results);

     let oldmember=document.querySelectorAll('.member');
        oldmember.forEach((oldmember)=>{
            oldmember.remove();
        })

    results.forEach((results)=>{
        console.log(results.name);
        let member=document.createElement("p");
        member.classList.add('member','m-1')
        // member.className='member';
        member.innerHTML=results.name;
        memberList.appendChild(member);

    })
    
})

socket.on('leftRoom',()=>{
    console.log("disconnected by client");
})


let checkbtn=document.querySelector("#checkbtn");
let sendbtn=document.querySelector("#sendbtn");

// $('#inputGroupFile01').on('change',function(e){
//     var result = e.target.files[0];
//     var reader = new FileReader();
 
//     reader.readAsDataURL(result);
//     console.log(reader.result);
// })

let base64

document.getElementById('inputGroupFile01').addEventListener('change', function() {

    const reader = new FileReader();
    reader.onload = function() {
      base64 = this.result.replace(/.*base64,/, '');
      console.log(base64);
    //   socket.emit('image', base64);
    };
    reader.readAsDataURL(this.files[0]);
  
  }, false);


checkbtn.addEventListener('click',()=>{
    $('#exampleModalCenter').modal('show');

    let msgval=$('#msgbox').val();
    let plusnyaconnect;
    let devided=msgval.split('。');
    let plusnya=[];

    if(msgval.indexOf('。')>0){

    devided=devided.filter((item)=>{
        return item !== "";
    })

    devided.forEach((devided)=>{
        devided=devided+"にゃ。";
        plusnya.push(devided);
    })

    plusnyaconnect=plusnya.join('');
    console.log(plusnyaconnect);

    }else{
        plusnyaconnect=msgval+"にゃ。";
    }

    document.querySelector('#default-text').innerHTML=msgval;
    document.querySelector('#changed-text').innerHTML=plusnyaconnect;

    sendbtn.addEventListener('click',()=>{
        // setTimeout(()=>{
        //     socket.emit('sendmsg',{msgval:plusnyaconnect,poster:uname})},
        //     1000);
        if(plusnyaconnect!==""){
        socket.emit('sendmsg',{msgval:plusnyaconnect,poster:uname,img:base64});
        console.log(plusnyaconnect+'is send to server');
        plusnyaconnect="";
        $('#exampleModalCenter').modal('hide');
        }else{}
    })


})


socket.on('msgsendcomp',(results)=>{
    console.log("got message is")
    console.log(results[0]);
    let msgarea=document.querySelector('.msg-area');

    let newmsgbox=document.createElement('div');
    newmsgbox.classList.add('p-1');
    let newname=document.createElement('h6');
    newname.innerHTML=results[0].postedby;
    newname.classList.add('text-muted');
    let newmsg=document.createElement('p');
    newmsg.innerHTML=results[0].text;
    let newtime=document.createElement('span');
    newtime.classList.add('text-muted','mb-1');
    newtime.innerHTML=results[0].time;

    newmsgbox.appendChild(newtime);
    newmsgbox.appendChild(newname);
    newmsgbox.appendChild(newmsg);

    newmsgbox.classList.add('card','w-100','msg-box');
    msgarea.appendChild(newmsgbox);

    let scrollHeight = document.getElementById("msg-area").scrollHeight;
    document.getElementById("msg-area").scrollTop=scrollHeight;

    document.querySelector("#msgbox").value="";


})






})
