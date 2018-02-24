'use strict'

var express = require('express');
var UserController = require('../controllers/user');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');  //middleware
var multipart = require('connect-multiparty');  //middleware para subir archivos
var md_upload = multipart( {uploadDir: './uploads/users'} );

api.post('/register',UserController.saveUser);
api.post('/login',UserController.loginUser);
//metodo obtener user, usando el middleware md_auth
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
//users paginados
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
//contadores
api.get('/counters/:id?',md_auth.ensureAuth,UserController.getCounters);
//actulizar un user usando metodo PUT
api.put('/update-user/:id',md_auth.ensureAuth,UserController.updateUser);
//actualizar imagen
api.post('/upload-image-user/:id',[md_auth.ensureAuth,md_upload],UserController.uploadImage);
//obtener imagen de un user
api.get('/get-image-user/:imageFile', UserController.getImageFile);

module.exports = api;

