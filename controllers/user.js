'use strict'

var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var bcrypt = require('bcrypt-nodejs');   //encriptador
var jwt = require('../services/jwt');   //token
var mongoosePaginate = require('mongoose-pagination'); //paginador
var fs = require('fs'); //libreria filessytem de node para manejo de ficheros
var path = require('path'); //permite trabajar con rutas de ficheros

//REGISTRAR USUARIO
function saveUser(req,res) {
    var params = req.body; //recoger los parametros de la peticion , cuando se usa POST los parametros pasan por req.body
    var user = new User();  //crear un nuevo objeto del modelo User
    if(params.name && params.surname && params.nick && params.email && params.password){ //verificar que lleguen los datos
        //setear la informacion
        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;
        // Controlar usuarios duplicados
        User.find({ $or: [   //se usa $or para usar el OR en el .find 
            {email: user.email.toLowerCase()}, //se convierte la cadena a minuscula
            {nick: user.nick.toLowerCase()} //se convierte la cadena a minuscula
        ]}).exec((err ,users) => {  //.exec para ejecutar la query
            if(err) return res.status(500).send( {message: 'error en la peticion de registro de usuario'} );
            if(users && users.length >= 1){
                return res.status(200).send( {message: 'El usuario que intenta registrar ya existe'} );
            }else{
                //cifrar y guardar
                bcrypt.hash( params.password, null ,null, (err,hash) =>{
                    user.password = hash;
                    user.save( (err,userStored) => {
                        if(err) return res.status(500).send( {message:'error al guardar el usuario'} );
                        if(userStored){
                            res.status(200).send( {user: userStored} );
                        }else{
                            res.status(404).send( {message:'no se ha registrado el usuario'} );
                        }
                    });
            });
            }
        });
    }else{
        res.status(200).send({message: 'envia todos los campos necesarios'});
    }
}



//LOGIN
function loginUser(req,res){
    var params = req.body;  //por el metodo POST, los parametros van en el req.body
    var email = params.email;
    var password = params.password;
    User.findOne( { email:email }, (err,user) => {
        if( err ) return res.status(500).send({message: 'error en la peticion'});
        if( user ){
            bcrypt.compare(password, user.password,(err,check)=>{ 
                if(check){
                    if(params.gettoken){   //si se envia el paramentro gettoken
                        //generar y devolver token
                        return res.status(200).send({ token: jwt.createToken(user) });
                    }else{
                        //devolver datos del usuario
                        user.password = undefined; // eliminar el password para no devolverlo
                        return res.status(200).send({ user });
                    }
                }else{
                    return res.status(404).send({ message: 'el usuario no se ha podido identificar' });
                }
            });
        }else{
            return res.status(404).send({ message: 'el usuario no se ha podido identificar...' });
        }
    });
}



//OBTENER DATOS DE UN USUARIO
function getUser(req,res){
    var userId = req.params.id;
    User.findById( userId, ( err,user ) => {
        if( err ) return res.status(500).send({ message:'error en la peticion' });
        if( !user ) return res.status(404).send({ message:'el usuario no existe' });
        //verificamos si como usuarios autenticados estamos siguiendo al user que se busca por la url
        //debido a que el async devuelve una promesa se usa el .then()
        followThisUser( req.user.sub, userId ).then( (value) => {  
            return res.status(200).send({
                user,
                value
            });
        });
    });
}
async function followThisUser(identity_user_id, user_id){
    try {
        var following = await Follow.findOne({ user: identity_user_id, followed: user_id}).exec()
            .then((following) => {
                return following;
            })
            // .catch((err)=>{
            //     return handleerror(err);
            // });
        var followed = await Follow.findOne({ user: user_id, followed: identity_user_id}).exec()
            .then((followed) => {
                return followed;
            })
            // .catch((err)=>{
            //     return handleerror(err);
            // });
        return {
            following: following,
            followed: followed
        }
    } catch(e){
        console.log(e);
    }
}
//ESTA FUNCION  ES LA DEL EJEMPLO PERO NO FUNCIONA:
// async function followThisUser( identity_user_id, user_id ){
//     var following = await Follow.findOne({ "user": identity_user_id, "followed":user_id}).exec((err,follow)=>{       
//         if(err) return handleError(err);
//         return follow;
//         });
//     var followed = await Follow.findOne({ "user": user_id, "followed":identity_user_id}).exec((err,follow)=>{       
//         if(err) return handleError(err);
//         return follow;
//         });
//     return{ 
//         following: following,
//         followed: followed
//     }
// }
//funcion Auxiliar usando ASYNC y AWAIT:



//CONTADOR DE USUARIOS SIGUIENDO Y SEGUIDOS
function getCounters(req,res){
    var userId = req.user.sub;  //el id del user autenticado
    if(req.params.id){ //si se envia por parametro el id se lo actualiza userId
        userId = req.params.id;
    }
    getCountFollow( userId ).then( (value) => {
      return res.status(200).send( {value} )
    });
}
// funcion axiliar ascincrona para contar
async function getCountFollow(user_id){
    try{
        var following = await Follow.count( {user: user_id} ).exec()
        .then( (following ) => {
            return following;
        })
        // .catch((err)=>{
        //     return handleerror(err);
        // });
        var followed = await Follow.count( {followed: user_id} ).exec()
        .then( ( followed ) => {
            return followed;
        })
        // .catch((err)=>{
        //     return handleerror(err);
        // });
        var publications = await Publication.count( {user: user_id} ).exec()
        .then( ( publications ) => {
            return publications;
        })
        // .catch((err)=>{
        //     return handleerror(err);
        // });

        
        return {
            following: following,
            followed: followed,
            publications:publications
         }
    }catch(e){
        console.log(e);
    }
}



//DEVOLVER UN LISTADO DE USUARIOS PAGINADOS
function getUsers(req,res){
    var identity_user_id = req.user.sub;  //tenemos el id del user logeado, .sub por el id del payload en services/jwt.js
    var page = 1;
    if(req.params.page){ //si se envia la pagina por parametro, se la actualiza
        page = req.params.page;
    }
    var itemsPerPage = 5;
    User.find().sort('_id').paginate( page, itemsPerPage, (err,users,total) => {
        if( err ) return res.status(500).send( {message:'error en la peticion'} )
        if( !users ) return res.status(404).send({message:'no hay usuarios disponibles'});
        followUserIds(identity_user_id).then((value)=>{
            return res.status(200).send({
                users,
                user_following:value.following,
                user_followed:value.followed,
                total,
                pages: Math.ceil(total/itemsPerPage)    //redondeo para saber el numero de paginas
            });
        });
    });
}
//arreglo con los ids de usersd
async function followUserIds(user_id){
    try {
        var following = await Follow.find({user:user_id}).select({'_id':0,'_v':0,'user':0}).exec()
        .then( (following) => {
            return following;
        })
        // .catch((err)=>{
        //     return handleerror(err);
        // });
        var followed = await Follow.find({followed:user_id}).select({'_id':0,'_v':0,'followed':0}).exec()
        .then( (followed) => {
            return followed;
        })
        // .catch((err)=>{
        //     return handleerror(err);
        // });
        //procesar following ids
        var following_clean = [];
        following.forEach( (follow) => {
            following_clean.push( follow.followed );
        });
        // procesar followed ids
        var followed_clean = [];
        followed.forEach( (follow) => {
            followed_clean.push( follow.user );
        });
        return {
            following:following_clean,
            followed: followed_clean
         }
    }catch(e){
        console.log(e);
    }
}



//EDITAR DATOS DE UN USUARIO
function updateUser(req,res){
    var userId = req.params.id;
    var update = req.body;
    delete update.password; //borrar propiedad password
    if( userId != req.user.sub ){
        return res.status(500).send({message: 'no tiene permiso para actualizar los datos del usuario'});
    }
    User.find({ $or: [   //se usa $or para usar el OR en el .find 
        {email: update.email.toLowerCase()}, //se convierte la cadena a minuscula
        {nick: update.nick.toLowerCase()} //se convierte la cadena a minuscula
    ]}).exec((err,users)=>{
        var user_isset = false; //para comprobar que no se repitan los nick
        users.forEach((user) => {
            if(user && user._id != userId) user_isset =true;
        });

        if(user_isset) return res.status(404).send({message:'los datos ya estan en uso'});
        
            User.findByIdAndUpdate(userId ,update,  {new:true}  , ( err,userUpdated ) => {   //{new: true} para devolver el objeto actualizado
            if (err) return res.status(500).send({message:'error en la peticion'});
            if (!userUpdated) return res.status(404).send({message:'no se pudo actualizar usuario'});
            return res.status(200).send( {user:userUpdated} );
            });
    });


}



// subir archivos de imagen/avatar de usuario
function uploadImage(req,res){
    var userId = req.params.id;
    if(req.files){  // si se estan enviando ficheros
        var file_path = req.files.image.path;
       // console.log(file_path);
        var file_split = file_path.split('\\'); // '\\'permite cortar el string en varias partes, segmentarlo ej: uploads\users\SiVCNJw87ejajDtedw92PFha.jpg  => [ 'uploads', 'users', 'SiVCNJw87ejajDtedw92PFha.jpg' ]
      //  console.log(file_split);
        var file_name = file_split[2];   //para quedarme solamente con el indice 2 del arreglo, que es el nombre del archivo
      //  console.log(file_name);
        var ext_split = file_name.split('\.');   //cortar el string desde el punto(quitar la extension)
       // console.log(ext_split);
        var file_ext = ext_split[1];    //me quedo con la extension en el indice 1 del arreglo
       // console.log(file_ext);
            if( userId != req.user.sub ){
                return removeFilesUploads(res,file_path,'no tiene permiso para actualizar imagen');
            }
            if( file_ext == 'png' || file_ext == 'jpg' || file_ext =='jpeg' || file_ext == 'gif' ){
                    //actualizar documento de usuario logeado
                    User.findByIdAndUpdate( userId, {image: file_name} , {new:true}, ( err,userUpdated ) => {
                        if (err) return res.status(500).send({message:'error en la peticion'});
                        if (!userUpdated) return res.status(404).send( {message:'no se pudo actualizar usuario'} );
                        return res.status(200).send( {user:userUpdated} );  
                    });
            }else{
               return removeFilesUploads(res,file_path,'archivo con extension no valida');
            }
    }else{
        return res.status(200).send({message:'no se ha subido imagen'});
    }
}
//funcion axiliar
function removeFilesUploads( res,file_path, message ){
    fs.unlink( file_path, (err) => {  //borrado del fichero
        return res.status(200).send( {message: message} );
    });
}



//OBTENER IMAGEN DE UN USUARIO
function getImageFile(req,res){
    var imageFile = req.params.imageFile;
    var path_file = './uploads/users/'+imageFile;
    fs.exists( path_file, (exists) =>{
        if(exists){
            res.sendFile( path.resolve( path_file ));
        }else{
            res.status(200).send({message:'no existe la imagen...'});   
        }
    });
}



//exportar funciones para ser usadas externamente
module.exports = {
    saveUser,
    loginUser,
    getUser,
    getCounters,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile
}