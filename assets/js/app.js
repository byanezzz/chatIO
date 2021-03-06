var socket = io();

//al actualizar la página eliminamos la sesión del usuario de sessionStorage
$(document).ready(function() {
  manageSessions.unset('login');
});

function animateScroll() {
  var container = $('#containerMessages');
  container.animate({ 'scrollTop': $('#containerMessages')[0].scrollHeight }, 'slow');
}

//función anónima donde vamos añadiendo toda la funcionalidad del chat
$(function() {
  animateScroll();
  showModal('Formulario de inicio de sesión', renderForm());
  //al poner el foco en el campo de texto del mensaje o pulsar el botón de enviar
  $('#containerSendMessages, #containerSendMessages input').on('focus click', function(e) {
    e.preventDefault();
    if (!manageSessions.get('login')) {
      showModal('Formulario de inicio de sesión', renderForm(), false);
    }
  });

  //al pulsar en el botón de Entrar 
  $('#loginBtn').on('click', function(e) {
    e.preventDefault();
    if ($('.username').val().length < 2) {
      $('.errorMsg').hide();
      //mostramos el mensaje de nuevo y ponemos el foco en el campo de texto
      $('.username').after('<div class="col-md-12 alert alert-danger errorMsg">Debes introducir un nombre para acceder al chat.</div>').focus();
      return;
    }
    //en otro caso, creamos la sesión login y lanzamos el evento loginUser
    //pasando el nombre del usuario que se ha conectado
    manageSessions.set('login', $('.username').val());
    //llamamos al evento loginUser, el cuál creará un nuevo socket asociado a nuestro usuario
    socket.emit('loginUser', manageSessions.get('login'));
    $('#formModal').modal('hide');
    animateScroll();
  });

  //si el usuario está en uso lanzamos el evento userInUse y mostramos el mensaje
  socket.on('userInUse', function() {
    //mostramos la ventana modal
    $('#formModal').modal('show');
    //eliminamos la sesión que se ha creado relacionada al usuario
    manageSessions.unset('login');
    //ocultamos los mensajes de error del modal
    $('.errorMsg').hide();
    //añadimos un nuevo mensaje de error y ponemos el foco en el campo de texto de la modal
    $('.username').after('<div class="col-md-12 alert alert-danger errorMsg">El usuario que intenta escoger está en uso.</div>').focus();
    return;
  });

  $('.message').focus(function() {
    socket.emit('typing', 'typing...');
  })
  socket.on('typing', function(message) {
    $('#typing').html(`<span id="${message.username}"> ${message.username} está escribiendo.. </span>`);
  });

  $('.message').blur(function() {
    socket.emit('stop typing', 'typing...');
  })
  socket.on('stop typing', function(message) {
    $(`#${message.username}`).remove();
  });

  //cuando se emite el evento refreshChat
  socket.on('refreshChat', function(action, message) {
    //simplemente mostramos el nuevo mensaje a los usuarios
    //si es una nueva conexión
    if (action == 'conectado') {
      $('#chatMsgs').append(`<p class="col-md-12 alert-info"> ${message} </p>`);
    }
    //si es una desconexión
    else if (action == 'desconectado') {
      $('#chatMsgs').append(`<p class="col-md-12 alert-danger"> ${message} </p>`);
    }
    //si es un nuevo mensaje 
    else if (action == 'msg') {
      $('#chatMsgs').append(`<p class="col-md-12 alert-warning"> ${message} </p>`);
    }
    //si el que ha conectado soy yo
    else if (action == 'yo') {
      $('#chatMsgs').append(`<p class="col-md-12 alert-success"> ${message} </p>`);
    }
    animateScroll();
  });

  //actualizamos el sidebar que contiene los usuarios conectados cuando
  //alguno se conecta o desconecta, el parámetro son los usuarios online actualmente
  socket.on('updateSidebarUsers', function(usersOnline) {
    //limpiamos el sidebar donde almacenamos usuarios
    $('#chatUsers').html('');
    //si hay usuarios conectados, para evitar errores
    if (!isEmptyObject(usersOnline)) {
      //recorremos el objeto y los mostramos en el sidebar, los datos
      //están almacenados con {clave : valor}
      $.each(usersOnline, function(key, val) {
        $('#chatUsers').append(`<p class="col-md-12 alert-info"> ${key} </p>`);
      })
    }
  });

  $('.message').on('keypress', function(e) {
    var key = e.which;
    if (key == 13) { // the enter key code
      var message = $('.message').val();
      if (message.length > 2) {
        socket.emit('addNewMessage', message);
        $('.message').val('');
      } else {
        showModal('Error formulario', '<p class="alert alert-danger">El mensaje debe ser de al menos dos carácteres.</p>', 'true');
      }
      animateScroll();
    }
  });
  //al pulsar el botón de enviar mensaje
  $('.sendMsg').on('click', function() {
    //capturamos el valor del campo de texto donde se escriben los mensajes
    var message = $('.message').val();
    if (message.length > 1) {
      socket.emit('addNewMessage', message);
      $('.message').val('');
    } else {
      showModal('Error formulario', '<p class="alert alert-danger">El mensaje debe ser de al menos dos carácteres.</p>', 'true');
    }
    //llamamos a la función que mantiene el scroll al fondo
    animateScroll();
  });

});

function showModal(title, message, showClose) {
  console.log(showClose)
  $('h2.title-modal').text(title).css({ 'text-align': 'center' });
  $('p.formModal').html(message);
  if (showClose === 'true') {
    $('.modal-footer').html('<a data-dismiss="modal" aria-hidden="true" class="btn btn-danger">Cerrar</a>');
    $('#formModal').modal({ show: true });
  } else {
    $('#formModal').modal({ show: true, backdrop: 'static', keyboard: true });
  }
}

//formulario html para mostrar en la ventana modal
function renderForm() {
  var html = '';
  html += '<div class="form-group" id="formLogin">';
  html += '<input type="text" id="username" class="form-control username" placeholder="Introduce un nombre de usuario">';
  html += '</div>';
  html += '<button type="submit" class="btn btn-primary btn-large" id="loginBtn">Entrar</button>';
  return html;
}

//objeto para el manejo de sesiones
var manageSessions = {
  //obtenemos una sesión //getter
  get: function(key) {
    return sessionStorage.getItem(key);
  },
  //creamos una sesión //setter
  set: function(key, val) {
    return sessionStorage.setItem(key, val);
  },
  //limpiamos una sesión
  unset: function(key) {
    return sessionStorage.removeItem(key);
  }
};

//función que comprueba si un objeto está vacio, devuelve un boolean
function isEmptyObject(obj) {
  var name;
  for (name in obj) {
    return false;
  }
  return true;
}