const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const users_schema = new Schema({
	owner_id: String,
	path: String,
	type: String,
	parent_id: String,
	revisions: [],
	sharing :{
		link:{
			url: String,
			edit:String
		},
		members:[]
	},
	deleted: String,
	activity:[]
});

mongoose.model('Resources', users_schema, 'resources');