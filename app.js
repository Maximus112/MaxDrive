const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const fs = require('fs');
const jwt = require('jsonwebtoken');

mongoose.promise = global.Promise;

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(session({ secret: 'passport-tutorial', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

app.use(function(err, req, res, next){
	if(err) return res.json(err);
});

fs.readFile('mongouri.txt', 'utf8', function(err, contents){
	if(err)
		console.log(err);
	else 
		mongoose.connect(contents, {useNewUrlParser: true});
});

//mongoose.set('debug', true);

require('./models/users');

const Users = mongoose.model('Users');

/* Retrieves all users. Development purposes only. */
app.get('/api/users', (req, res, next) => {
	return Users.find({}).select('_id email').then((user) =>{
		if(!user)
			return res.status(422).sendStatus(400);
		
		return res.json(user);
	});
});

/* Create an account. */
app.post('/api/users', (req, res, err) => {
	
	/* Validate email */
	if(!req.body.email){
		return res.status(422).json({
			error:{
				email: 'is required'
			}
		});
	}
	
	/* Validate password */
	if(!req.body.password){
		return res.status(422).json({
			error:{
				password: 'is required'
			}
		});
	}
	
	/* Check email is unique. */
	Users.findOne({ 'email' : req.body.email }, function(err, user){
		if(user)
			return res.json({error : "Email address is already registered to another user."});
		else {
			
			console.log("email unique");
			
			var user = {
				email: req.body.email,
				password: req.body.password
			}
			
			const finalUser = new Users(user);
			finalUser.set_password(req.body.password);
			console.log(finalUser);
			/* Return token. */
			return finalUser.save()
				.then(()=> res.json({user: finalUser.to_auth_json()}));
			
		}
	});
	
});

/* Returns jwt on submission of valid login credentials. */
app.post('/api/login', (req, res, err) => {
	
	var email = req.body.email;
	var password = req.body.password;
	
	if(!email){
		return res.status(422).json({
			errors: {
				email: 'is required'
			}
		});
	}
	if(!password){
		return res.status(422).json({
			errors: {
				password: 'is required'
			}
		});
	}
	
	Users.findOne({ 'email' : req.body.email }, function(err, user){
		if(!user || !user.validate_password(password)){
			return res.json({ error: 'email or password is invalid'});
		} else {
			user.token = user.generate_jwt();
			return res.json({user: user.to_auth_json() });
		}
	});
	
	
});

app.get('/api/users/:id', (req, res) => {
	
	if(mongoose.Types.ObjectId.isValid(req.params.id)){
		var id = mongoose.Types.ObjectId(req.params.id);
		Users.find({_id: id}, function(err, user){
			if(!user){
				return res.json({error: "User with id " + req.params.id + " not found."});
			} else{
				return res.json(user);
			}
		});
	} else {
		return res.json({error: "id '" + req.params.id + "' is invalid."});
	}
	
});

app.get('/api/users', (req, res) => {
	return Users.find({}).then((user) =>{
		if(!user){
			return res.sendStatus(400);
		}
		return res.json(user);
	});
});

app.get('/api/users/current', verify_token, (req, res) => {
	return Users.findById(req.user_id).then((user) =>{
		if(!user){
			return res.sendStatus(400);
		}
		return res.json({user: user.to_auth_json() });
	});
});

function verify_token(req, res, next){
	var token = req.headers['x-access-token'];
	if (!token)
		return res.status(403).send({ auth: false, message: 'No token provided.' });
	jwt.verify(token, 'secret', function(err, decoded) {
		if (err)
			return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
		//if everything good, save to request for use in other routes
		req.user_id = decoded._id;
		next();
	});
}

app.listen(8000, () => console.log('Server running on http://localhost:8000/'));
