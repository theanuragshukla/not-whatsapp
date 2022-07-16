let socket
const chats=document.getElementById('chats')
const inp=document.getElementById('msgInp')
window.onload=()=>{
	socket = io.connect('/')
	socket.emit('join-chat',usrProf)
	socket.on('oldMsgs',(arr)=>{
		arr.map(data=>{
			chats.innerHTML+=msg(data.message,data.time,data.sender==usrProf.me)
		})
	})
	socket.on('msg',(data)=>{
		chats.innerHTML+=msg(data.msg,data.time,data.sender==usrProf.me)
	})
}
const msg =(msg,time,me=false)=>{
	return (`
	<div class="${me ? "right" : "left"} msgDiv">
							<div class="msg">${msg}
							</div>
							<div class="time">${time}</div>
						</div>
`)
} 
const sendMsg = ()=>{
	const content = inp.value
	inp.value=''
	chats.innerHTML+=msg(content,getTime(),true)
	socket.emit('newMsg',content)
}
function getTime() {
	var now = new Date();
	return (now.getHours() + ':' + ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())))
}
