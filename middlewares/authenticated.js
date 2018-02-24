'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_curso_desarrollar_red_social_mean';

exports.ensureAuth = function( req,res,next ){
    if( !req.headers.authorization ){  //si no llega una cabecera authorization
        return res.status(403).send({message:'la peticion no tiene la cabecera de autenticacion'})
    }
    //si llega:
    var token = req.headers.authorization.replace( /['"]+/g , '');// eliminar las comillas simples y dobles que puedan haber en cualquier parte
    try{ //debido a que le payload es sensible a exepciones se hace uso de un try/catch
        var payload = jwt.decode( token,secret ); //se decodifica el token, usando la llave secreta
        if( payload.exp <= moment().unix() ){ // verificar la expiracion con la fecha actual
            return res.status(401).send({message:'el token ha expirado'});
        }
    }catch(ex){
        return res.status(404).send( {message:'el token no es valido'} );
    }
    //adjuntar el payload a la request, para tener siempre en el controlador el objeto de usuario logeado
    req.user = payload;   //se guarda dentro de la propiedad req.user, todos los datos del usuario
    next(); //saltar a lo siguiente que vaya a ejecutar Node
}