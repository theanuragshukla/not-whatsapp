let socket
const chats=document.getElementById('chats')
const inp=document.getElementById('msgInp')
window.onload=()=>{
	socket = io.connect('/')
	socket.emit('join-chat',usrProf)
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
	socket.emit('newMsg',content)
}
