const express = require('express')
const app = express()
const http = require('http').Server(app)
const db = require("./config/database");
const port = process.env.PORT || 3000

app.use('/static',express.static(__dirname + "/static"))
app.use(express.json());
app.use(express.urlencoded({
	extended: true
}));

app.get('/',(req,res)=>{
	res.status=200
	res.sendFile(__dirname+'/static/index.html')
})

app.get('/new-user',(req,res)=>{
	res.status=200
	res.sendFile(__dirname+'/static/signup.html')
})

app.post("/add-new-user",async (req,res)=>{
	const query = `
	INSERT INTO users (username,fname,lname,email,pass) 
	VALUES($1,$2,$3,$4,$5)
	RETURNING *;
	`;
	const values = [req.body.user, req.body.fname,req.body.lname,req.body.email,req.body.pass];
	const { rows } = await db.query(query, values);
	console.log(rows);
	res.send({result:"done"})
})
app.post("/let-me-in",async (req,res)=>{
	const query = `
	SELECT * FROM users WHERE username = $1;
	`;
	const values = [req.body.user];
	const { rows } = await db.query(query, values);
	if(rows.length==0){
		res.send({status:false ,result:"not found"})
	}else{
		if(rows[0].pass==req.body.pass){
			res.send({status:true,result:rows[0].fname+" "+rows[0].lname})
		}
		else{
			res.send({status:false,result:"wrong username or password"})
		}
	}
})


const server = http.listen(port,()=>{
	console.log(`server is running on port ${port}`)
})


