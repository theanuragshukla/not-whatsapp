const usrData = {
	"username":"anurag"
}
const viewProfile =(id=usrData.username)=> {
	location.href=`/user/${id}`
}
const item = `
		   <div class="item">
		   <div class="dpDiv">
		   <div></div>
		   </div>
		   <div class="midInfo" onclick="(()=>{location.href='/chat'})()">
		   <div class="name">
		   <span class="nameSpan">Anurag Shukla</span>
		   <span class="date">18:45am</span>
		   </div>
		   <div class="desc">
		   <span>
		   Dolor dolores magnam tempora praesentium ducimus! Repellat debitis ipsam commodi explicabo minima Rem praesentium eos minima ipsum ratione sequi, error.
		   </span>
		   </div>
		   </div>
		   </div>
		   `
const list = document.getElementById('list')

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

}

