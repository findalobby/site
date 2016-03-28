$(document).ready(function() {

  'use strict';

  var socket = io();
  let lastData = false;
  let selected = false;
  let idRoom = '';
  let gamertag = '';
  let join = false;
  let logMsg = [];
  let inverter = 0;
  let  waitLog = true;
  let chatRoomOpen = false;

  const closeChatRoom = () => {
    $('section#room-chat').fadeOut('fast');
    $('nav').show();
    socket.emit('leave room');
    waitLog = true;
    chatRoomOpen = false;
  }

  const openChatRoom = () => {
    chatRoomOpen = true;
    waitLog = true;
    logMsg = [];
    $('nav').hide();
    $('#inside-msgs').html('');
    $('#onlines').html('');
    $('section#room-chat').fadeIn('fast');
  }

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
    $('#inside_rooms').html('');
    changeScroll();
    if(!chatRoomOpen){
      $('header, nav').show();
    }
  }

  // $('section#menu-rooms, header').click(() => {
  //   if(chatRoomOpen){
  //     closeChatRoom();
  //   }
  // });

  $('#close_room_chat').click(closeChatRoom);

  socket.on('news rooms', (data) => {
      if(!lastData){lastData = data;}
      if(data != lastData){
        $('#news_rooms').html('');
        data.forEach((room) => {
            $('#news_rooms').append('<div class="room" id="'+room._id+'" name="'+room.name+'" game="'+room.game+'"><div class="room-platform-icon"><img class="platform-icon" src="imgs/one.png" alt="xbox-one"></div><div class="room-game">'+room.game+'</div><div class="room-mode">'+room.name+'</div><div class="room-capacity">'+room.online_players+'/'+room.max_players+'</div></div>');
        });
      }
  });

  onLoaded();

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
    scrollBottom("all-msgs");
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
     socket.emit('save gamertag', gamertag);
     if(join){
       openChatRoom();
      joinRoom(idRoom, gamertag, socket);
     }
     return false;
   });



  socket.on('new msg', (data) => {
    $('div#inside-msgs').append('<div class="msg"><span class="user">'+data.gamertag+':</span> '+data.msg+'</div>');
    registerLog(logMsg, data);
    scrollBottom("all-msgs");
  });

  socket.on('new user', (data) => {
      const idData = setId(data);
      $('div#onlines').append('<div id="'+idData+'" class="online">'+data.gamertag+'</div>');
      $('div#inside-msgs').append('<div class="msg online">Usuário <span class="name-on">'+data.gamertag+'</span> acabou de entrar!</div>');
      socket.emit('im online', data.id);
      registerLog(logMsg, {
        id: '/#online',
        gamertag: data.gamertag,
        msg: 'online'
      });
  });
  socket.on('user leaves', (id) => $('#'+id.replace('/#', '')).fadeOut('fast'));

  socket.on('log users', (data) => {
      const idUser = setId(data);
      if(!document.getElementById(idUser)){
        $('div#onlines').append('<div id="'+idUser+'" class="online">'+data.gamertag+'</div>');
      }
  });

  socket.on('get msg', (data) => {
    socket.emit('getting log', {to: data, log:logMsg});
    console.log(logMsg);
  });

  socket.on('recive log', (data) => {
      if(waitLog){
        logMsg = data;
        logMsg.forEach((data) => {
          const idData = setId(data);
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
      scrollBottom("all-msgs");
      waitLog = false;
  });


  $('.container > .content').on('click', '.room', function() {
        const name = $(this).attr('name');
        const game = $(this).attr('game');
        const id = $(this).attr('id');
        $('span#name-span-game').html(game);
        $('span.modo-game').html(name);
        idRoom = id;
      if(!gamertag){
        $('#save-gamertag').modal('show');
        join = true;
      } else {
        openChatRoom();
        joinRoom(idRoom, gamertag, socket);
      }
  });
  socket.on('search response', (data) => {
        $('#search_rooms').html('');
        data.forEach((room) => {
          $('#search_rooms').append('<div class="room" id="'+room._id+'" name="'+room.name+'" game="'+room.game+'"><div class="room-platform-icon"><img class="platform-icon" src="imgs/one.png" alt="xbox-one"></div><div class="room-game">'+room.game+'</div><div class="room-mode">'+room.name+'</div><div class="room-capacity">'+room.online_players+'/'+room.max_players+'</div></div>');
        });
  });

  socket.on('room response', (data) => {
      if(typeof data === 'object')
      $('#close_room').click();
      openChatRoom();
      $('span#name-span-game').html(data.game);
      $('span.modo-game').html(data.name);
      $('div#onlines').append('<div id="'+socket.id+'" class="online">'+gamertag+'</div>');

  });

  setInterval(() => socket.emit('get news rooms', selected), 5000);


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

  $('#toggle-people').click(function() {
    $('#users-online').toggle('slide');
  });

  $('a#search_link').click(searchOpen);
  $('span.close-btn').click(searchClose);

  $('body').keydown(e =>{
      if(e.which == 27){
        if(open){
          searchClose();
        }
        closeChatRoom();
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
    socket.emit('get news rooms', selected);
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
    socket.emit('join room', _id);
    $('div#onlines').append('<div id="'+socket.id+'" class="online">'+gamertag+'</div>');
  }

  function registerLog(arr, msg){
    if(arr.length <= 100){
      arr.push(msg);
    } else {
      arr = [];
      ar.push(msg);
    }
  }

  function setId(data){
    return data['id'].replace('/#', '');
  }
  function onLoaded(){
    socket.emit('get news rooms', selected);
    socket.emit('get news rooms', selected);
  }

  function scrollBottom(divId){
    let objDiv = document.getElementById(divId);
    objDiv.scrollTop = objDiv.scrollHeight;
  }

});
