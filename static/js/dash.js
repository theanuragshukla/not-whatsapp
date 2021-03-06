const viewProfile =(id=usrProf.me)=> {
	location.href=`/user/${id}`
}
const item = (user)=>{
	return (`
		   <div class="item flx">
		   <div class="dpDiv">
		   <div></div>
		   </div>
		   <div class="midInfo" onclick="(()=>{location.href='/chat/${user.username}'})()">
		   <div class="name">
		   <span class="nameSpan">${user.fname} ${user.lname}</span>
		   <span class="date">${user.lastMsg.time}</span>
		   </div>
		   <div class="desc">
		   <span>
		  ${user.username==user.lastMsg.sender ?user.fname:"you"}: ${user.lastMsg.message}
		   </span>
		   </div>
		   </div>
		   </div>
		   `
)
}

const list = document.getElementById('list')

window.onload = () =>{
	getAllUsers()
	if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/static/js/sw.js');
}
}
const getAllUsers = () => {
	fetch('/get-all-unique-contacts',{
		method:'POST',
		headers: {
			'Accept': 'application/json, text/plain, */*',
			'Content-Type': 'application/json'
		},
		crossdomain: true,
		withCredentials:'include',

	})
	.then(res=>res.json())
		.then((res)=>{
			res.map(user=>{
				list.innerHTML+=item(user)
			})
		})

}

