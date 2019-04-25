const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

/* Subdocument for representing files and folders. */
const resource_schema = new Schema({ 'guid': String, 'name': String, 'type': String, 'items': Array, 'revisions': Array, 'sharing': Array, 'activity': Array });

/* The main user schema. */
const users_schema = new Schema({
	email: String,
	hash: String,
	salt: String,
	resources: resource_schema,
	favourites: [],
	recent: [],
	shared_with_me: [],
	deleted: []
});

users_schema.methods.set_password = function(password) {
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
}

users_schema.methods.validate_password = function(password){
	const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
	return this.hash === hash;
}

/* Generate a JSON web token for the user. */
users_schema.methods.generate_jwt = function(){
	return (jwt.sign( { _id: this._id }, 'Shhh!', { expiresIn: 3600 } ));
}

users_schema.methods.to_auth_json = function(){
	return{
		_id: this._id,
		email: this.email,
		token: this.generate_jwt()
	};
}

module.exports = mongoose.model('Users', users_schema, 'users');