const express = require('express')
const app = express()
const http = require('http').Server(app)
const db = require("./config/database");
const port = process.env.PORT || 3000
const bcrypt = require("bcryptjs")
const saltRounds=10
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET_KEY
const cookieParser=require('cookie-parser')
const {engine} = require('express-handlebars')
const excludedRoutes = ['/','/new-user','/let-me-in','/add-new-user']
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
		next()
})
app.set('view engine', 'hbs');

app.engine('hbs', engine({
	layoutsDir: __dirname + '/views/layouts',
	extname: 'hbs',
	defaultLayout:false,
	partialsDir: __dirname + '/views/partials/'
}));

app.get('/',(req,res)=>{
	res.status=200
	res.sendFile(__dirname+'/index.html')
})

app.get('/new-user',(req,res)=>{
	res.status=200
	res.sendFile(__dirname+'/signup.html')
})
app.get('/user/:id',async (req,res)=>{
	//	const token = req.cookies.token
	//	const authData = await verifyToken(token)
/*	const username = req.params.id
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
			res.send({status:false,result:"wrong username or password"})
		}
	}*/
	res.render('profile',{user:req.params.id})
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
	res.sendFile(__dirname+'/dash.html')
})

app.get('/chat',(req,res)=>{
	res.status(200).sendFile(__dirname+'/chat.html')
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




const server = http.listen(port,()=>{
	console.log(`server is running on port ${port}`)
})


