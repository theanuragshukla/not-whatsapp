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
		return `<div><a href="/user/${user}">${user}</a></div>`
	}).join('')
}
const startSearch = async () =>{
	timer!=null ? clearTimeout(timer):null
	timer=setTimeout(searchUsers,1000)
}

