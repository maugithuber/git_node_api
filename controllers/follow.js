'use strict'

var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Follow = require('../models/follow');

//seguir usuario
function saveFollow(req,res){
    var params = req.body;
    var follow = new Follow(); 
    follow.user = req.user.sub;
    follow.followed = params.followed;
    follow.save((err,followStored) => {
        if (err) return res.status(500).send({ message: 'error al guardar el seguimiento'});
        if( !followStored ) return res.status(404).send({ message: 'el seguimiento no se ha guardado'});
        return res.status(200).send( { follow: followStored } );
    }); 
}


//dejar de serguir 
function deleteFollow(req, res){
    var userId = req.user.sub;    //id del user autenticado
    var followId = req.params.id;   //id del user que quiero dejar de seguir
    Follow.find({user:userId, followed:followId}).remove(err =>{
        if(err) return res.status(500).send({message:'error al dejar de seguir'});
        return res.status(200).send({message:'el follow se ha eliminado'});
    });
}




//listado de users que estoy siguiendo PAGINADAMENTE
//permite enviar el id y/o la pagina o ninguno de los dos, opcionalmente
function getFollowingUsers(req,res){
    var userId = req.user.sub;
    if( req.params.id  && req.params.page){ //verificar si llegan los dos parametros
        userId = req.params.id;
    }
    var page =1;
    if(req.params.page){ //verificar si llega por parametro
        page =req.params.page;
    }else{
        page = req.params.id; // en caso de que solo se envia 1 parametro, lo tomara como la
    }
    var itemsPerPage = 4;   //por defecto 4 items por pagina
    //usando.popualte('followed'), se sustituye el campo follows, por el Objeto{} followed al que esta haciendo referencia
    Follow.find({user:userId}).populate('followed').paginate( page, itemsPerPage, (err,follows,total)=>{
        if(err) return res.status(500).send({message:'error en el servidor'});
        if(!follows) return res.status(404).send({message:'no estas siguiendo a ningun usuario'});


        followUserIds(req.user.sub).then((value)=>{

            return res.status(200).send({
                total: total,
                pages: Math.ceil(total/itemsPerPage),
                follows,
                user_following:value.following,
                user_followed:value.followed,
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

////listado de users que me estan siguiendo PAGINADAMENTE
function getFollowedUsers(req,res){
    var userId = req.user.sub;  // id del user autenticado
    if( req.params.id  && req.params.page){ //verificar si llegan los dos parametros
        userId = req.params.id;
    }
    var page =1; //por defecto
    if(req.params.page){ //verificar si llega por parametro
        page =req.params.page;
    }else{
        page = req.params.id; // en caso de que solo se envia 1 parametro, lo tomara como la
    }
    var itemsPerPage = 4;   //por defecto 4 items por pagina
    //usando.popualte('user'), se sustituye el campo follows, por los Objetos{}user  que esta haciendo referencia
    Follow.find({followed:userId}).populate('user').paginate( page, itemsPerPage, (err,follows,total)=>{
        if(err) return res.status(500).send({message:'error en el servidor'});
        if(!follows) return res.status(404).send({message:'no te esta siguiendo ningun usuario'});

        followUserIds(req.user.sub).then((value)=>{

            return res.status(200).send({
                total: total,
                pages: Math.ceil(total/itemsPerPage),
                follows,
                user_following:value.following,
                user_followed:value.followed,
            });
        });
    });
}

// obtener listado ususarios,dependiento sin parametro, los usuarios que me siguen, 
//y con parametro los usaurios que estan siguiendo , sin paginar
function getMyFollows(req,res){
    var userId = req.user.sub;
    var find =  Follow.find({user: userId}); //usuarios que yo estoy siguiendo
    if(req.params.followed){ // si se recive el parametro followed, listo a los que me estan siguiendo
        find = Follow.find({followed: userId});
    }
    find.populate('user followed').exec((err,follows)=>{
        if(err) return res.status(500).send({message:'error en el servidor'});
        if(!follows) return res.status(404).send({message:'no siges a ningun usuario'});
        return res.status(200).send({ follows });
    });
}


module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}