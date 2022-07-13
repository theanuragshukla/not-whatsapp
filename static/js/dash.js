const usrData = {
	"username":"anurag"
}
const viewProfile =(id=usrData.username)=> {
	location.href=`/user/${id}`
}
