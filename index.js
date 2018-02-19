var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname));
app.use(express.static('assets'));


var usersOnLine = {};
io.on('connection', function(socket) {
  //cuando el usuario conecta al chat comprobamos si está logueado
  //el parámetro es la sesión login almacenada con sessionStorage
  socket.on("loginUser", function(username) {
    //si existe el nombre de usuario en el chat
    if (usersOnLine[username]) {
      socket.emit("userInUse");
      return;
    }
    //Guarda el nombre de usuario en la sesión del socket para este cliente
    socket.username = username;
    //añade al usuario a la lista global donde almacenamos usuarios
    usersOnLine[username] = socket.username;
    //mostramos al cliente como que se ha conectado
    socket.emit("refreshChat", "yo", "Bienvenido " + socket.username + ", te has conectado correctamente.");
    //mostramos de forma global a todos los usuarios que un usuario
    //se acaba de conectar al chat
    socket.broadcast.emit("refreshChat", "conectado", "El usuario " + socket.username + " se ha conectado al chat.");
    //actualizamos la lista de usuarios en el chat del lado del cliente
    io.sockets.emit("updateSidebarUsers", usersOnLine);
  });

  socket.on('addNewMessage', function(message) {
    //con socket.emit, el mensaje es para mi
    socket.emit("refreshChat", "msg", "Yo : " + message);
    //con socket.broadcast.emit, es para el resto de usuarios
    socket.broadcast.emit("refreshChat", "msg", socket.username + " dice: " + message);
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function() {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function() {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });
  //cuando el usuario cierra o actualiza el navegador
  socket.on("disconnect", function() {
    //si el usuario, por ejemplo, sin estar logueado refresca la
    //página, el typeof del socket username es undefined, y el mensaje sería 
    //El usuario undefined se ha desconectado del chat, con ésto lo evitamos
    if (typeof(socket.username) == "undefined") {
      return;
    }
    //en otro caso, eliminamos al usuario
    delete usersOnLine[socket.username];
    //actualizamos la lista de usuarios en el chat, zona cliente
    io.sockets.emit("updateSidebarUsers", usersOnLine);
    //emitimos el mensaje global a todos los que están conectados con broadcasts
    socket.broadcast.emit("refreshChat", "desconectado", "El usuario " + socket.username + " se ha desconectado del chat.");
  });
});
http.listen(3000, function() {
  console.log('listening on *:3000');
})