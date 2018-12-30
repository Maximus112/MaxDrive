const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const users_schema = new Schema({
	email: String,
	hash: String,
	salt: String
});

users_schema.methods.set_password = (password) => {
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
}

users_schema.methods.validate_password = function(password){
	const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
	return this.hash === hash;
}

users_schema.methods.generate_jwt = function(){
	const today = new Date();
	const exp_date = new Date(today);
	exp_date.setDate(today.getDate + 60);
	return jwt.sign({
		email: this.email,
		id: this._id,
		exp: parseInt(exp_date.getTime() / 1000)
	}, 'secret');
}

users_schema.methods.to_auth_json = function(){
	return{
		_id: this._id,
		email: this.email,
		token: this.generate_jwt()
	};
}

mongoose.model('Users', users_schema);