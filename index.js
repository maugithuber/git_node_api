'use strict'  //permite utilzar nuevas carcateristicas de los nuevos estandares js

var mongoose = require('mongoose');
var app = require('./app');   //para usar express desde el fichero app.js
var port = 3800;

mongoose.Promise = global.Promise; //Conectar a la bd
// mongoose.connect('mongodb://localhost:27017/curso_mean_social',{ useMongoClient: true } )  //reemplazada por
mongoose.connect('mongodb://localhost:27017/curso_mean_social')   //conectar a la bd
    .then( () => {
        console.log("La conexion a la bd curso_mean_social se ha realizado correctamente!!!")
        //crear servidor
        app.listen(port, () =>{
            console.log("servidor corriendo en http://localhost:3800");
        });
    })
    .catch( err =>console.log( err ) );