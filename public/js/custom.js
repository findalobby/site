$(document).ready(function() {

  'use strict';

  var socket = io();
  let lastData = false;
  let selected = '';
  let idRoom = '';
  let gamertag = '';
  let join = false;
  let logMsg = [];
  let inverter = 0;
  let  waitLog = true;

  socket.on('news rooms', (data) => {
      if(!lastData){lastData = data;}
      if(data != lastData){
        $('#news_rooms').html('');
        data.forEach((room) => {
            $('#news_rooms').append('<div class="room" id="'+room._id+'" name="'+room.name+'" game="'+room.game+'"><div class="room-platform-icon"><img class="platform-icon" src="imgs/one.png" alt="xbox-one"></div><div class="room-game">'+room.game+'</div><div class="room-mode">'+room.name+'</div><div class="room-capacity">'+room.online_players+'/'+room.max_players+'</div></div>');
        });
      }
  });

  $('form[name="msg-chat"]').submit(() => {
    const msg = $('#text-msg').val();
    if(msg && gamertag){
      socket.emit('send msg', msg);
      $('div#inside-msgs').append('<div class="msg me">'+msg+'</div>');
      $('#text-msg').val('');
    }
    registerLog(logMsg,{
          id: socket.id,
          gamertag,
          msg
    });
    return false
  });


   $('form[name="create_room"]').submit(function() {
      const data = {};
      data.name = $('#name').val();
      data.max_players = $('#limit').val();
      data.game = $('#game').val();
      data.platform = $('select#plataform option:selected').val();
      socket.emit('create room', data);
      return false;
   });

   $('form[name="save_gamertag"]').submit(() => {
     $('#save-gamertag').modal('hide');
     gamertag = $('#gamertag').val();
     if(join){
      joinRoom(idRoom, gamertag, socket);
     }
     return false;
   });



  socket.on('new msg', (data) => {
    $('div#inside-msgs').append('<div class="msg"><span class="user">'+data.gamertag+':</span> '+data.msg+'</div>');
    registerLog(logMsg, data);
  });

  socket.on('new user', (data) => {
      $('div#onlines').append('<div id="'+data.id+'" class="online">'+data.gamertag+'</div>');
      $('div#inside-msgs').append('<div class="msg online">Usuário <span class="name-on">'+data.gamertag+'</span> acabou de entrar!</div>');
      socket.emit('im online', data.id);
      registerLog(logMsg, {
        id: '/#online',
        gamertag: data.gamertag,
        msg: 'online'
      });
  });

  socket.on('log users', (data) => {
      $('div#onlines').append('<div id="'+data.id+'" class="online">'+data.gamertag+'</div>');
  });

  socket.on('get msg', (data) => {
    socket.emit('getting log', {to: data, log:logMsg});
    console.log(logMsg);
  });

  socket.on('recive log', (data) => {
      if(waitLog){
        logMsg = data;
        logMsg.forEach((data) => {
          let idData = data['id'].replace('/#', '');
          if(idData== socket.id){
            $('div#inside-msgs').append('<div class="msg me">'+data.msg+'</div>');
            console.log('meu');
          } else if(idData == 'online'){
             $('div#inside-msgs').append('<div class="msg online">Usuário <span class="name-on">'+data.gamertag+'</span> acabou de entrar!</div>');
          } else {
            $('div#inside-msgs').append('<div class="msg"><span class="user">'+data.gamertag+':</span> '+data.msg+'</div>');
          }
        });
      }
      console.log(data);
  });


  $('.container > .content').on('click', '.room', function() {
      const id = $(this).attr('id');
      const name = $(this).attr('name');
      const game = $(this).attr('game');
      idRoom = id;
      waitLog = true;
      $('nav').hide();
      $('#inside-msgs').html('');
      $('#onlines').html('');
      $('span#name-span-game').html(game);
      $('span.modo-game').html(name);
      $('section#room-chat').fadeIn('fast');

      if(!gamertag){
        $('#save-gamertag').modal('show');
        join = true;
      } else {
        joinRoom(idRoom, gamertag, socket);
      }
  });

  socket.on('search response', (data) => {
        $('#search_rooms').html('');
        data.forEach((room) => {
          $('#search_rooms').append('<div class="room" id="'+room._id+'" name="'+room.name+'" game="'+room.game+'"><div class="room-platform-icon"><img class="platform-icon" src="imgs/one.png" alt="xbox-one"></div><div class="room-game">'+room.game+'</div><div class="room-mode">'+room.name+'</div><div class="room-capacity">1/'+room.max_players+'</div></div>');
        });
  });

  socket.on('room response', (data) => {
      if(typeof data === 'object')
      $('#close_room').click();
  });


  $('#input_search').keydown(function(){
      const valueInput = $(this).val();
      socket.emit('search', {input: valueInput, platform: selected});
  });


  let defaultBg = 'url(../../imgs/bg1.jpg)';

  const changeScroll = () => {
    if($('body').css('overflow') == 'visible'){
        $('body').css('overflow', 'hidden');
    }else{
      $('body').css('overflow', 'visible');
    }
  }

  let open = false;


  const searchOpen = ()=>{
    open = true;
    $('section#search').show();
    $('nav').hide();
    changeScroll();
  }

  const searchClose = () => {
    open = false;
    $('section#search').hide();
    $('section#chat-room').hide();
    $('header, nav').show();
    $('#inside_rooms').html('');
    changeScroll();
  }

  console.log(socket);

  $('#toggle-people').click(function() {
    $('#people-in-the-room').toggle('slide');
  });

  $('a#search_link').click(searchOpen);
  $('span.close-btn').click(searchClose);

  $('body').keydown(e =>{
      if(e.which == 27){
        if(open){
          searchClose();
        }
        $('section#room-chat').hide();
        $('nav').show();
        socket.emit('leave room');
      }
   });

   $('#btn-create-room').click(() => {
     $('#criar-sala').modal('show');
     if(!gamertag){
          $('#save-gamertag').modal('show');
     }
   });

  $('#criar-sala').on('show.bs.modal', e => changeScroll());
  $('#criar-sala').on('hidden.bs.modal', e => changeScroll());

  $('.dropdown-menu > li').click(function() {
    selected = $(this).attr('name');
    let path = $(this).attr('data');
    $('.platforms').html('<img src="imgs/'+path+'">');
    $('.dropdown').removeClass('open');
    return false;
  });

  setInterval(() =>{
    $('header').addClass("transitionBG");
    if(defaultBg ==  'url(../../imgs/bg1.jpg)'){
      defaultBg = "url(../../imgs/bg2.jpg)";
      $('header').css("background-image", "url(../../imgs/bg2.jpg)");
    } else if(defaultBg ==  'url(../../imgs/bg2.jpg)'){
      defaultBg = "url(../../imgs/bg3.jpg)";
      $('header').css("background-image", "url(../../imgs/bg3.jpg)");
    }else{
      defaultBg = "url(../../imgs/bg1.jpg)";
      $('header').css("background-image", "url(../../imgs/bg1.jpg)");
    }
  }, 3000) ;

  function joinRoom(_id, gamertag, socket){
    socket.emit('join room', {_id, gamertag});
    $('div#onlines').append('<div id="'+socket.id+'" class="online">'+gamertag+'</div>');
  }

  function registerLog(arr, msg){
      arr.push(msg);
  }

});
