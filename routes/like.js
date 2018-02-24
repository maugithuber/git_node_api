'use strict'

var express = require('express');
var likeController = require('../controllers/like');
var api =  express.Router();
var md_auth = require('../middlewares/authenticated');

api.post('/like',md_auth.ensureAuth, likeController.saveLike);
api.delete('/unlike/:liked',md_auth.ensureAuth,likeController.deleteLike);

module.exports = api;