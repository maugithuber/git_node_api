'use strict'

var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Like = require('../models/like');

//dar like
function saveLike(req,res){
    var params = req.body;
    var like = new Like(); 
    like.user = req.user.sub;
    like.liked = params.liked;
    like.save((err,likeStored) => {
        if (err) return res.status(500).send({ message: 'error al dar like'});
        if( !likeStored ) return res.status(404).send({ message: 'el like no se ha guardado'});
        return res.status(200).send( { like: likeStored } );
    }); 
}


//quitar like 
function deleteLike(req, res){
    var userId = req.user.sub;    //id del user autenticado
    var likeId = req.params.liked;   //id del user que quiero dejar de seguir
    Like.find({user:userId, liked:likeId}).remove(err =>{
        if(err) return res.status(500).send({message:'error al quitar like'});
        return res.status(200).send({message:'el like se ha eliminado'});
    });
}



module.exports = {
    saveLike,
    deleteLike
}