'use strict'

 var mongoose = require('mongoose');
 var Schema = mongoose.Schema;
 var UserSchema = Schema({
    name: String,
    surname: String,
    nick: String,
    email: String,
    password: String,
    role: String,
    image: String
});
module.exports = mongoose.model('User',UserSchema); //luego User se pluralizara y se pondra en minuscula = users para ser guadado en la bd