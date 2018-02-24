'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

function proba(req,res){
  return res.status(200).send({message:'holas'})
}

function saveMessage(req,res){
    var params = req.body;
    if(!params.text || !params.receiver) return res.status(200).send({message:'envia los datos necesarios'});
    var message = new Message();
    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.text = params.text;
    message.created_at = moment().unix();
    message.viewed = 'false';

    message.save((err,messageStored)=>{
        if(err) return res.status(500).send({message:'error en la peticion'});
        if(!messageStored) return res.status(500).send({message:'error al enviar el mensaje'});
        return res.status(200).send({message: messageStored});
    });
}

function getReceivedMessages(req,res){
    var userId = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
//como 2do parametro del metodo populate('emitter','name surname image nick_id)se colocan los campos que solo se quiere mostrar
    Message.find({receiver:userId}).populate('emitter','name surname image nick _id').sort('-created_at').paginate(page,itemsPerPage,(err,messages,total)=>{
        if(err) return res.status(500).send({message:'error en la peticion'});
        if(!messages) return res.status(404).send({message:'no hay mensajes'});
        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });
}

function getEmittedMessages(req,res){
    var userId = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
//como 2do parametrp del metodo populate('emitter','name surname image nick_id)se colocan los campos que solo se quiere mostrar
    Message.find({emitter:userId}).populate('emitter receiver','name surname image nick _id').sort('-created_at').paginate(page,itemsPerPage,(err,messages,total)=>{
        if(err) return res.status(500).send({message:'error en la peticion'});
        if(!messages) return res.status(404).send({message:'no hay mensajes'});
        return res.status(200).send({
            total:total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });
    });
}

function getUnviwedMessages(req,res){
    var userId = req.user.sub;
    Message.count({receiver:userId,viewed: 'false'}).exec((err,count)=>{
        if(err) return res.status(500).send({message:'error en la peticion'});
        return res.status(200).send({'unviewed':count})
    });
}

function setViwedMessages(req,res){
    var userId = req.user.sub;
    Message.update({receiver:userId,viewed: 'false'},{viewed:true},{multi:true},(err,messageUpdated)=>{
        if(err) return res.status(500).send({message:'error en la peticion'});
        return res.status(200).send({message:messageUpdated})
    });
    
}
module.exports ={
    saveMessage,
    getReceivedMessages,
    getEmittedMessages,
    getUnviwedMessages,
    setViwedMessages
}