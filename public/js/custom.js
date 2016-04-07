$(document).ready(function() {

  'use strict';

  var socket = io();
  let selected = false;
  let idRoom = '';
  let gamertag = '';
  let join = false;
  let logMsg = [];
  let waitLog = true;
  let chatRoomOpen = false;
  let limitRooms = 5;
  let limitSearch = 5;

  const closeChatRoom = () => {
    $('section#room-chat').fadeOut('fast');
    $('nav').show();
    socket.emit('leave room');
    waitLog = true;
    chatRoomOpen = false;
  }

  const openChatRoom = () => {
    waitLog = true;
    logMsg = [];
    $('nav').hide();
    $('#inside-msgs').html('');
    $('#onlines').html('');
    $('section#room-chat').fadeIn('fast');
  }

  const searchOpen = ()=>{
    open = true;
    $('#input_search').val('');
    $('section#search').show();
    $('nav').hide();
    socket.emit('search', {input: '', selected, limit:limitSearch});
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

    $(window).scroll(function(){
    	const scrollTopAtual = $(this).scrollTop();
    	const nav = $('nav');

    	if (scrollTopAtual >= 200) {
    		nav.addClass('bg-scroll');
    	}
    	else {
    		nav.removeClass('bg-scroll');
    //    $('li.on-page').removeClass('on-page');
    	}
  });

  $('ul.nav > li > a').click(function() {
    const li = $(this).parent();
    const position = $(this.hash).offset();
    const linkHref = $(this).attr('href');

    $('li.on-page').removeClass('on-page');

    if(linkHref != '#' || !linkHref){
      li.addClass('on-page');
      $("html, body").animate({scrollTop:position.top}, 1000);
      return false;
    }
  });

  $('#more-rooms').click(() => {
    const rooms = $('#menu-rooms');
    if(limitRooms < 100){
      limitRooms += 5;
    }
    $("html, body").animate({scrollTop:rooms.offset().top + rooms.height()}, 1000);
    socket.emit('get news rooms', {selected, limit: limitRooms});
  });

  $('#more-search').click(() => {
    const search = $('#search');
    const valueInput = $('#input_search').val();
    if(limitSearch < 100){
      limitSearch += 5;
    }
    socket.emit('search', {input: valueInput, selected, limit: limitSearch});
  //  search.animate({scrollTop:limitSearch*40}, 1000);
  });

  $('#ul-rooms > li').click(function (){
    dropdownUpdate(this);
    limitRooms = 5;
    limitSearch = 5;
    socket.emit('get news rooms', {selected, limit: limitRooms});
    return false;
  });
  $('#ul-search > li').click(function() {
    dropdownUpdate(this);
    const valueInput = $('#input_search').val();
    limitRooms = 5;
    limitSearch = 5;
    socket.emit('get news rooms', {selected, limit: limitRooms});
    socket.emit('search', {input: valueInput, selected, limit: limitSearch});
    return false;
  });
  $('#close_room_chat').click(closeChatRoom);

  socket.on('news rooms', (data) => {
        data.sort((a,b) => b.online_players - a.online_players);
        $('#inside_news').html('');
        data.forEach((room) => {
            $('#inside_news').append('<div class="room" id="'+room._id+'" name="'+strip_tags(room.name)+'" game="'+strip_tags(room.game)+'"><div class="room-platform-icon"><img class="platform-icon" src="imgs/one.png" alt="xbox-one"></div><div class="room-game">'+strip_tags(room.game)+'</div><div class="room-mode">'+strip_tags(room.name)+'</div><div class="room-capacity">'+room.online_players+'/'+room.max_players+'</div></div>');
        });
        if(data.length < limitRooms || data.length >= 100){
          $('#more-rooms').hide();
        } else{
          $('#more-rooms').show();
        }
  });

  $('form[name="msg-chat"]').submit(() => {
    let msg = strip_tags($('#text-msg').val());
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
    return false;
  });


   $('form[name="create_room"]').submit(function() {
     if(gamertag){
        const data = {};
        data.name = strip_tags($('#name').val());
        data.max_players = strip_tags($('#limit').val());
        data.game = strip_tags($('#game').val());
        data.platform = strip_tags($('select#plataform option:selected').val());
        socket.emit('create room', data);
      } else{
        $('#save-gamertag').modal('show');
      }
       return false;
   });

   $('form[name="save_gamertag"]').submit(() => {
     $('#save-gamertag').modal('hide');
     gamertag = strip_tags($('#gamertag').val());
     socket.emit('save gamertag', gamertag);
     if(join){
       openChatRoom();
      joinRoom(idRoom, gamertag, socket);
     }
     return false;
   });



  socket.on('new msg', (data) => {
    $('div#inside-msgs').append('<div class="msg"><span class="user">'+strip_tags(data.gamertag)+':</span> '+strip_tags(data.msg)+'</div>');
    registerLog(logMsg, data);
    scrollBottom("all-msgs");
  });

  socket.on('new user', (data) => {
      const idData = setId(data);
      $('div#onlines').append('<div id="'+idData+'" class="online">'+strip_tags(data.gamertag)+'</div>');
      $('div#inside-msgs').append('<div class="msg online">Usuário <span class="name-on">'+strip_tags(data.gamertag)+'</span> acabou de entrar!</div>');
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
        $('div#onlines').append('<div id="'+idUser+'" class="online">'+strip_tags(data.gamertag)+'</div>');
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
            $('div#inside-msgs').append('<div class="msg me">'+strip_tags(data.msg)+'</div>');
            console.log('meu');
          } else if(idData == 'online'){
             $('div#inside-msgs').append('<div class="msg online">Usuário <span class="name-on">'+strip_tags(data.gamertag)+'</span> acabou de entrar!</div>');
          } else {
            $('div#inside-msgs').append('<div class="msg"><span class="user">'+strip_tags(data.gamertag)+':</span> '+strip_tags(data.msg)+'</div>');
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
        $('span#name-span-game').html(strip_tags(game));
        $('span.modo-game').html(strip_tags(name));
        idRoom = id;
      if(!gamertag){
        $('#save-gamertag').modal('show');
        join = true;
      } else {
        if(!chatRoomOpen){
          openChatRoom();
          joinRoom(idRoom, gamertag, socket);
        }
      }
  });
  socket.on('search response', (data) => {
        data.sort((a,b) => b.online_players - a.online_players);
        $('#search_rooms').html('');
        data.forEach((room) => {
          $('#search_rooms').append('<div class="room" id="'+room._id+'" name="'+strip_tags(room.name)+'" game="'+strip_tags(room.game)+'"><div class="room-platform-icon"><img class="platform-icon" src="imgs/one.png" alt="xbox-one"></div><div class="room-game">'+strip_tags(room.game)+'</div><div class="room-mode">'+strip_tags(room.name)+'</div><div class="room-capacity">'+room.online_players+'/'+room.max_players+'</div></div>');
        });
        if(data.length < limitSearch || data.length >= 100){
          $('#more-search').hide();
        } else{
          $('#more-search').show();
        }
  });

  socket.on('room response', (data) => {
      if(typeof data === 'object'){
        $('#close_room').click();
        openChatRoom();
        $('span#name-span-game').html(strip_tags(data.game));
        $('span.modo-game').html(strip_tags(data.name));
        $('div#onlines').append('<div id="'+socket.id+'" class="online">'+strip_tags(gamertag)+'</div>');
    }

  });

  setInterval(() => socket.emit('get news rooms', {selected, limit: limitRooms}), 5000);


  $('#input_search').keydown(function(){
      const valueInput = $(this).val();
      socket.emit('search', {input: valueInput, selected, limit: limitSearch});
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
          join = false;
     }
   });

  $('#criar-sala').on('show.bs.modal', e => changeScroll());
  $('#criar-sala').on('hidden.bs.modal', e => changeScroll());

  socket.on('disconnect', () => {
    alert('Desconectado, atualizando página.');
    window.location.reload(true);
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
    $('div#onlines').append('<div id="'+socket.id+'" class="online">'+strip_tags(gamertag)+'</div>');
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
    socket.emit('get news rooms', {selected, limit: 5});
    socket.emit('get news rooms', {selected, limit: 5});
  }
  onLoaded();

  function scrollBottom(divId){
    let objDiv = document.getElementById(divId);
    objDiv.scrollTop = objDiv.scrollHeight;
  }

  function dropdownUpdate(drop){
    selected = $(drop).attr('name');
    let path = $(drop).attr('data');
    $('.platforms').html('<img src="imgs/'+path+'">');
    $('.dropdown').removeClass('open');
    return false;
  }

  function strip_tags(input, allowed) {
    allowed = (((allowed || '') + '')
      .toLowerCase()
      .match(/<[a-z][a-z0-9]*>/g) || [])
      .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
      commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '')
      .replace(tags, function($0, $1) {
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
      });
  }

});
