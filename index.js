const express = require('express')
const app = express()
const cors = require('cors')
const http = require('http').Server(app)
const db = require("./config/database");
const port = process.env.PORT || 5000
const bcrypt = require("bcryptjs")
const saltRounds=10
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET_KEY
const cookieParser=require('cookie-parser')
const {engine} = require('express-handlebars')
const excludedRoutes = ['/','/new-user','/let-me-in','/add-new-user','/checkDup','/checkAuth']
app.use(cors())
app.use('/static',express.static(__dirname + "/static"))
app.use(express.json());
app.use(express.urlencoded({
	extended: true
}));
app.use(cookieParser());
app.use(async (req, res, next) => {
	const url = req.originalUrl
	if(excludedRoutes.includes(url)){
		next()
		return
	}
	const token = req.cookies.token
	const authData = await verifyToken(token)
	if (!authData.result)
		res.redirect(`http://${req.header('host')}`)
	else
		req.usrProf = authData.data
	next()
})
app.set('view engine', 'hbs');

app.engine('hbs', engine({
	layoutsDir: __dirname + '/views/layouts',
	extname: 'hbs',
	defaultLayout:false,
	partialsDir: __dirname + '/views/partials/'
}));

function generateUid() {
	var pass = '';
	var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (i = 1; i <= 16; i++) {
		var char = Math.floor(Math.random()
				* str.length + 1);
		pass += str.charAt(char)
	}
	return pass;
}
function getDate() {
	var now = new Date();
	return ((now.getFullYear()) + '-' + (now.getMonth()+1) + '-' + now.getDate())
}

function getTime() {
	var now = new Date();
	return (now.getHours() + ':' + ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())))
}
const verifyToken = async (authToken)=>{
	try{
		const payload = jwt.verify(authToken, secret)
		const query = `SELECT * FROM users WHERE uid = $1;`;
		const values = [payload.data];
		const { rows } = await db.query(query, values)
		if(rows.length==0){
			return {result:false}
		}else{
			return {result:true,data:rows[0],uid:payload.data}
		}
	}catch(e){
		return {result:false}
	}
}

app.get('/',(req,res)=>{
	res.status=200
	res.sendFile(__dirname+'/index.html')
})

app.get('/start-new-chat',(req,res)=>{
	res.render('new')
})

app.get('/new-user',(req,res)=>{
	res.status=200
	res.sendFile(__dirname+'/signup.html')
})
app.get('/user/:id',async (req,res)=>{
	const username = req.params.id
	const query = `
	SELECT * FROM users WHERE username = $1;
	`;
	const values = [username];
	const { rows } = await db.query(query, values);
	if(rows.length==0){
		res.send({result:false,message:"user doesn't exists"})
	}else{
		const match = false
		if(match){
			res.send({status:true})
		}
		else{
			res.render('profile',{user:username,fname:rows[0].fname,lname:rows[0].lname})
		}
	}
})

app.post("/add-new-user",async (req,res)=>{
	const userquery = `
	SELECT * FROM users WHERE username = $1;
	`;
	const uservalues = [req.body.user];
	const dupUser = await db.query(userquery, uservalues);
	if( dupUser.rows.length!=0){
		res.send({status:false,user:true,result:"user exists"})
		return
	}
	const emailquery = `
	SELECT * FROM users WHERE email = $1;
	`;
	const emailvalues = [req.body.email];
	const dupEmail = await db.query(emailquery, emailvalues);
	if( dupEmail.rows.length!=0){
		res.send({status:false,email:true,result:"email exists"})
		return
	}
	const query = `
	INSERT INTO users (username,fname,lname,email,pass,uid) 
	VALUES($1,$2,$3,$4,$5,$6)
	RETURNING *;
	`;
	var passhash
	await bcrypt.hash(req.body.pass, saltRounds).then(function(hash) {
		passhash=hash
	});
	const values = [req.body.user, req.body.fname,req.body.lname,req.body.email,passhash,generateUid()];
	const { rows } = await db.query(query, values)
	res.send({status:true})
})

app.get('/dashboard',(req,res)=>{
	res.render('dash',{myfname:req.usrProf.fname,mylname:req.usrProf.lname, me:req.usrProf.username})
})

app.get('/chat/:id',async (req,res)=>{
	const user = req.params.id
	const query = `
	SELECT * FROM users WHERE username = $1;
	`;
	const values = [user];
	const { rows } = await db.query(query, values);
	if(rows.length==0){
		res.send({result:false,message:"user doesn't exists"})
	}else{
		const match = false
		if(match){
			res.send({status:true})
		}
		else{
			res.render('chat',{myfname:req.usrProf.fname,mylname:req.usrProf.lname, me:req.usrProf.username,user:user,fname:rows[0].fname,lname:rows[0].lname})
		}
	}
})

app.post("/let-me-in",async (req,res)=>{
	const query = `
	SELECT * FROM users WHERE username = $1;
	`;
	const values = [req.body.user];
	const { rows } = await db.query(query, values);
	if(rows.length==0){
		res.send({status:false,result:"wrong username or password"})
	}else{
		const match = await bcrypt.compare(req.body.pass, rows[0].pass)
		if(match){
			const token = jwt.sign({
				data:rows[0].uid
			}, secret, { expiresIn: '7d' })
			var expiryDate = new Date(Number(new Date()) + (7*24*3600000));
			res.setHeader("Set-Cookie", `token=${token};expires=${expiryDate}; Path=/;HttpOnly`)

			res.send({status:true})
		}
		else{
			res.send({status:false,result:"wrong username or password"})
		}
	}
})

app.get('/log-me-out',(req,res)=>{
	res.clearCookie("token")
	res.json({status:true})
})

app.get('/checkAuth',async (req,res)=>{
	const token = req.cookies.token
	const authData = await verifyToken(token)
	res.status(200).json({result:authData.result,data:
		authData.result ? 
		{
			fname:authData.data.fname,
			lname:authData.data.lname,
			username:authData.data.username,
			email:authData.data.email,
		}
		:{}
	})
})

app.post('/checkDup', async (req,res)=>{
	const toCheck=req.body.email ? "email" : "username"
	const query = `SELECT * FROM users WHERE ${toCheck} = $1;`;
	const value = [req.body.data];
	const dups = await db.query(query, value);
	if( dups.rows.length!=0){
		res.status(200).send({status:false})
		return
	}else 
		res.status(200).send({status:true})

})
app.post('/search-user',async (req,res)=>{
	const term = req.body.term
	const data = []
	if(term.length==0){

		res.json(JSON.stringify(data))
		return
	}
	const query = `SELECT * FROM users WHERE username ilike '${term}%';`
	const value = []
	const {rows} = await db.query(query, value)
	rows.map(user=>{
		data.push({username:user.username,fname:user.fname,lname:user.lname})
	})
	res.json(JSON.stringify(data))
})

app.post('/get-all-unique-contacts',async(req,res)=>{
	const user = req.usrProf.username
	const query = `SELECT distinct room FROM chats WHERE room ilike '%*${user}*%';`
	const {rows} = await db.query(query, [])
	let lastMessages = []
	const ret = []
	for(let i = 0;i<rows.length;i++){
		const room = rows[i]
		lastMessages=[...lastMessages, await getLastMessage(room)]
		ret.push(room.room.replaceAll(user,'').replaceAll('*',''))
	}
	const data = await getUsers(ret,lastMessages)
	res.json(data)
})

const getLastMessage = async(room) => {
	const query = `select room,sender, time, message from chats where room = $1 order by timestamp desc limit 1;`
	const {rows} = await db.query(query,[room.room])
//	console.log(rows)
	return rows[0]
}

const getUsers =async (arr,lastMsgs) => {
	var params = [];
	for(var i = 1; i <= arr.length; i++) {
		params.push('$' + i);	
	}
	const query = 'SELECT username, fname,lname FROM "users" WHERE "username" IN ('+params.join(',')+') order by username ;'
	const {rows} = await db.query(query, arr)
	for(let i = 0;i<rows.length;i++){
		for(let j = 0;j<lastMsgs.length;j++){
			if(lastMsgs[j].room.indexOf(rows[i].username)> -1){
				rows[i].lastMsg=lastMsgs[j]
				break
			}
		}
	}
//	console.log(rows)
	return rows
}
const server = http.listen(port,()=>{
	console.log(`server is running on port ${port}`)
})

const io = require('socket.io')(server)
io.on('connection',(socket)=>{

	socket.on('newMsg',async (msg)=>{
		const query = `INSERT INTO chats (sender,reciever,message,room,time,date) VALUES($1,$2,$3,$4,$5,$6) RETURNING *;`;
		const values = [socket.data.user,socket.data.to,msg,socket.data.room,getTime(),getDate()];
		const { rows } = await db.query(query, values)
		socket.to(socket.data.room).emit("msg",{sender:socket.user,"msg":msg,time:getTime()})
	})

	socket.on('join-chat',async(obj)=>{
		const room = obj.me>obj.user ? '*'+obj.user+'*'+obj.me+'*' : '*'+obj.me+'*'+obj.user+'*'
		socket.data.user=obj.me
		socket.data.fname = obj.myfname
		socket.data.lname = obj.mylname
		socket.data.room = room
		socket.data.to = obj.user
		socket.join(socket.data.room)
		const query = `SELECT sender,reciever,message,room,time,date FROM chats WHERE room = $1;`
		const {rows} = await db.query(query, [room])
		socket.emit('oldMsgs',rows)
	})
})
