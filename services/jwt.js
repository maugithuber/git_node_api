'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_curso_desarrollar_red_social_mean';

exports.createToken = function( user ){
    var payload = {
        sub: user._id,   //id
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),   //fecha
        exp: moment().add(30, 'days').unix()  // expiracion en 30 dias
    };
    return jwt.encode(payload,secret);
};