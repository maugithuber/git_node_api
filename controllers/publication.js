'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');
var Like = require('../models/like');


function savePublication(req,res){
    var params = req.body;
    if(!params.text) return res.status(200).send( {message:'debes enviar un texto'} );
    var publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix(); 

    publication.save( (err,publicationStored) => {
if(err) return res.status(500).send({message:'error al guardar la publicacion'});        
        if(!publicationStored) return res.status(404).send({message:'la publicacion no ha sido guardada'});
        return res.status(200).send( { publication:publicationStored} );
    });
  }

  //TIMELINE listar publicaciones de los usuarios que yo sigo    paginadamente
  function getPublications(req,res){
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    
    Follow.find( {user: req.user.sub} ).populate('followed').exec( (err,follows) =>{
        if(err) return res.status(500).send({message:'error al devolver el seguimiento'});
        var follows_clean = [];
        follows.forEach( (follow) => {
            follows_clean.push(follow.followed);
            // console.log(follow);
        });
        
        //agregar mis propias publicaciones al arreglo
        follows_clean.push(req.user.sub);
        // console.log(follows_clean);

        Publication.find( {user: {"$in": follows_clean}}).sort('-created_at').populate('user').paginate(page,itemsPerPage,( err,publications,total)  =>{
            if(err) return res.status(500).send({message:'error al devolver publicaciones'});        
            if(!publications) return res.status(404).send({message:'no hay publicaciones'});        
            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total/itemsPerPage),
                page:page,
                items_per_page:itemsPerPage,
                publications   
            });        

        });
    });
  }





  function getPublications2(req,res){
    var identity_user_id = req.user.sub; 
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    
    //obtener todos los user que sigo
    Follow.find( {user: req.user.sub} ).populate('followed').exec( (err,follows) =>{
        if(err) return res.status(500).send({message:'error al devolver el seguimiento'});
        var follows_clean = [];
        follows.forEach( (follow) => {
            follows_clean.push(follow.followed);
        });

        //agregar mis propias publicaciones al arreglo
        follows_clean.push(req.user.sub);




        Publication.find( {user: {"$in": follows_clean}}).sort('-created_at').populate('user').paginate(page,itemsPerPage,( err,publications,total)  =>{
            if(err) return res.status(500).send({message:'error al devolver publicaciones'});        
            if(!publications) return res.status(404).send({message:'no hay publicaciones'});    
            
        
            likePubIds(identity_user_id).then((value)=>{
                return res.status(200).send({
                    total_items: total,
                    pages: Math.ceil(total/itemsPerPage),
                    page:page,
                    items_per_page:itemsPerPage,
                    publications,
                    pub_liking:value.liking,
                    pub_liked:value.liked,
                });      
                
            });


            

        });
    });
  }

//   Publication.find({user: {"$in": follows_clean}}).sort('-created_at').populate('user').paginate( page, itemsPerPage, (err,publications,total) => {
//     if( err ) return res.status(500).send( {message:'error en la peticion'} )
//     if( !publications ) return res.status(404).send({message:'no hay usuarios disponibles'});

//     likePubIds(user).then((value)=>{
//         return res.status(200).send({
//             publications,
//             user_liking:value.liking,
//             user_liked:value.liked,
//             total,
//             page:page,
//             pages: Math.ceil(total/itemsPerPage)    //redondeo para saber el numero de paginas
//         });
//     });

// });



  async function likePubIds(user_id){
    try {
        var liking = await Like.find({user:user_id}).select({'_id':0,'_v':0,'user':0}).exec()
        .then( (liking) => {
            return liking;
        })

        var liked = await Like.find({liked:user_id}).select({'_id':0,'_v':0,'liked':0}).exec()
        .then( (liked) => {
            return liked;
        })
        // .catch((err)=>{
        //     return handleerror(err);
        // });
        //procesar following ids
        var liking_clean = [];
        liking.forEach( (like) => {
            liking_clean.push( like.liked );
        });
        // procesar followed ids
        var liked_clean = [];
        liked.forEach( (like) => {
            liked_clean.push( like.user );
        });
        return {
            liking:liking_clean,
            liked: liked_clean
         }
    }catch(e){
        console.log(e);
    }
}


//solo para las publicaciones de un usuario
  function getPublicationsUser(req,res){
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var user = req.user.sub;
    if(req.params.user){
        user= req.params.user
    }
    var itemsPerPage = 4;

        Publication.find( {user:user}).sort('-created_at').populate('user').paginate(page,itemsPerPage,( err,publications,total)  =>{
            if(err) return res.status(500).send({message:'error al devolver publicaciones'});        
            if(!publications) return res.status(404).send({message:'no hay publicaciones'});        
            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total/itemsPerPage),
                page:page,
                items_per_page:itemsPerPage,
                publications   
            });        

        });




  }











  //getPublication
  function getPublication(req,res){
      var publicationId = req.params.id;
      Publication.findById(publicationId, (err,publication)=>{
        if(err) return res.status(500).send({message:'error al devolver publicacion'});        
        if(!publication) return res.status(404).send({message:'no existe la publicacion'});        
        return res.status(200).send({
            publication
        });        
      })
  }


  //eliminar una publicacion
  function deletePublication(req,res){
    var publicationId = req.params.id;
    //verifico que esa publicacion haiga sigo creada por mi
    Publication.find({user:req.user.sub, _id:publicationId}).remove( (err) =>{
      if(err) return res.status(500).send({message:'error al borrar la publicacion'});        
     // if(!publicationRemoved) return res.status(404).send({message:'no se ha borrado la publicacion'});     
      return res.status(200).send({message:'se ha eliminado correctamente la publicacion'});
    });
}





// subir archivos de imagen/avatar de usuario
function uploadImage(req,res){
    var publicationId = req.params.id;
    if(req.files){  // si se estan enviando ficheros
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\'); // '\\'permite cortar el string en varias partes, segmentarlo ej: uploads\users\SiVCNJw87ejajDtedw92PFha.jpg  => [ 'uploads', 'users', 'SiVCNJw87ejajDtedw92PFha.jpg' ]
        var file_name = file_split[2];   //para quedarme solamente con el indice 2 del arreglo, que es el nombre del archivo
       // var ext_split = file_name.split('\.');   //cortar el string desde el punto(quitar la extension)
       // var file_ext = ext_split[1];    //me quedo con la extension en el indice 1 del arreglo




       if( file_name ){
        //verificar que sea yo el dueno de la publicacion
        Publication.findOne({user:req.user.sub,_id:publicationId}).exec((err,publication)=>{
                if(publication){
                 //actualizar documento de la publicacion    
                    Publication.findByIdAndUpdate( publicationId, {file: file_name} , {new:true}, ( err,publicationUpdated ) => {
                        if (err) return res.status(500).send({message:'error en la peticion'});
                        if (!publicationUpdated) return res.status(404).send( {message:'no se pudo subir el archivo'} );
                        return res.status(200).send( {publication:publicationUpdated} );  
                        });
                }else{
                    return removeFilesUploads(res,file_path,'no tiene permiso para actualizar la publicacion');
                }
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


//OBTENER IMAGEN 
function getImageFile(req,res){
    var imageFile = req.params.imageFile;
    var path_file = './uploads/publications/'+imageFile;
    fs.exists( path_file, (exists) =>{
        if(exists){
            res.sendFile( path.resolve( path_file ));
        }else{
            res.status(200).send( {message:'no existe la imagen...'});   
        }
    });
}





  
module.exports = {
    savePublication,
    getPublications,
    getPublications2,
    getPublicationsUser,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile
}