'use strict'

var express = require('express');
var bodyParser = require('body-parser');
var app = express();       //cargar el framework

/**MUY IMPORTANTE
 * El orden de (cargar rutas, cors, middlewares, rutas y exportar) son muy importantes
 si se cambian de orden, se frega todo
 */

//cargar rutas
var user_routes = require('./routes/user');
var follow_routes = require('./routes/follow');
var publication_routes = require('./routes/publication');
var message_routes = require('./routes/message');
var likes_routes = require('./routes/like');

//cors:   
//(cipiado desde un recurso de victorrobles.es)
//como medida de  precaucion a la hora de realizar peticiones entre dominios de manera Cruzada desde el frontend con Angular
// configurar cabeceras http:
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
	res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
	next();
});


//middelwares:
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());


//rutas:
app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);
app.use('/api', likes_routes);


//exportar:
module.exports = app;