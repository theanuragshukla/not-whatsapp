const list =document.getElementById("list")
let timer = null
const searchUsers=()=>{
	const term = document.getElementById("term").value
	fetch('/search-user',{
		method:'POST',
		body:JSON.stringify({term:term}),
		headers: {
			'Accept': 'application/json, text/plain, */*',
			'Content-Type': 'application/json'
		},

		crossdomain: true,
		withCredentials:'include',

	})
		.then(res => res.json())
		.then(res => JSON.parse(res))
		.then(res=>displayData(res))
}
const displayData = (arr) => {
	list.innerHTML=arr.map(user=>{
		return item(user)
	}).join('')
}
const item = (user)=>{
	return (`<div class="item flx">
							<div class="dpDiv">
								<div></div>
							</div>
							<div class="midInfo" onclick="(()=>{location.href='/chat/${user.username}'})()">
								<div class="name">
									<span class="nameSpan">${user.fname} ${user.lname}</span>
								</div>
								<div class="desc">
									<span>
									Hey there! I'm not using whatsapp
									</span>
								</div>
							</div>
						</div>`)
}
const startSearch = async () =>{
	timer!=null ? clearTimeout(timer):null
	timer=setTimeout(searchUsers,1000)
}

window.onload = () =>{
	getAllUsers()
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
const toggleGlobalSearch=(state)=>{
	document.getElementById('globalSearch').style.display=state==1?'flex':'none'
	const elems = document.querySelectorAll('.canHide')
	Array.from(elems).map(elem=>{
		elem.style.display=state==1?'none':'flex'
	})
}
