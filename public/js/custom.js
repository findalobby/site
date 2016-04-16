$(document).ready(function() {

  'use strict';

  const socket = io();
  const scrolls = [];
  const imagesPlatform = {
    'XBOX ONE': 'one.png',
    'XBOX 360': '360.png',
    'PLAYSTATION 4': 'ps4.png',
    'PLAYSTATION 3': 'ps4.png',
    'IOS': 'ios.png',
    'ANDROID': 'android.png',
    'PC': 'pc.png'
  };

  const validateName = (value) => {
    if(value.length >=2 && value.length <=20){
      return true;
    }
    return false;
  }

  const isInteger = (value) => {
    if(Number.isInteger(value)){
      return true;
    }
    return false;
  }
  const closeChatRoom = () => {
    $('section#room-chat').fadeOut('fast');
    if(!openSearch){
      $('nav').show();
    }
    socket.emit('leave room');
    waitLog = true;
    chatRoomOpen = false;
  }

  const openChatRoom = () => {
    waitLog = true;
    $('nav').hide();
    $('#inside-msgs').html('');
    $('#onlines').html('');
    $('section#room-chat').fadeIn('fast');
    $('div#onlines').append('<div id="'+socket.id+'" class="online">'+strip_tags(gamertag)+'</div>');
  }

  const searchOpen = ()=>{
    openSearch = true;
    $('#input_search').val('');
    $('section#search').show();
    $('nav').hide();
    socket.emit('search', {input: '', selected, limit:limitSearch});
    changeScroll();
  }

  const searchClose = () => {
    openSearch = false;
    limitSearch = 5;
    $('section#search').hide();
    $('section#chat-room').hide();
    $('#inside_rooms').html('');
    changeScroll();
    if(!chatRoomOpen){
      $('header, nav').show();
    }
  }

  let selected = false;
  let idRoom = '';
  let gamertag = '';
  let join = false;
  let logMsg = [];
  let waitLog = true;
  let chatRoomOpen = false;
  let limitRooms = 5;
  let limitSearch = 5;
  let openSearch = false;
  let joinStatus = true;



  //   if(chatRoomOpen){
  // $('section#menu-rooms, header').click(() => {
  //     closeChatRoom();
  //   }
  // });

  $('.page-scroll').each(function(){
      const positionTop = $(this.hash).offset() ? $(this.hash).offset().top-60 : false;
      if(positionTop > 0){
        scrolls[positionTop] = this;
      }
  });

    $(window).scroll(function(){
    	const scrollTopAtual = $(this).scrollTop();
    	const nav = $('nav');

    	if (scrollTopAtual >= 200) {
    		nav.addClass('bg-scroll');
        $('#home-link').css('display', 'block');
    	} else if(scrollTopAtual == 0){
         $('li.on-page').removeClass('on-page');
         $('#home-link').css('display', 'none');
      }else {
    		nav.removeClass('bg-scroll');
    	}

  });

  $('ul.nav > li > a, #logo').click(function() {
    const li = $(this).parent();
    const position = $(this.hash).offset();
    const linkHref = $(this).attr('href');

    $('li.on-page').removeClass('on-page');

    if(linkHref != '#' || !linkHref){
      li.addClass('on-page');
      $("html, body").animate({scrollTop:position.top-60}, 1000);
      return false;
    }
  });

  $('.alert').click(function(){
      $(this).fadeOut('fast');
  });

  $('#more-rooms').click(() => {
    const rooms = $('#menu-rooms');
    if(limitRooms < 300){
      limitRooms += 5;
    }
    $("html, body").animate({scrollTop:rooms.offset().top + rooms.height()}, 1000);
    socket.emit('get news rooms', {selected, limit: limitRooms});
  });

  $('#more-search').click(() => {
    const search = $('#search');
    const valueInput = $('#input_search').val();
    if(limitSearch < 300){
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
      //  data.sort((a,b) => b.online_players - a.online_players);
        $('#inside_news').html('');
        data.forEach((room) => {
            $('#inside_news').append('<div class="room" platform="'+room.platform+'" id="'+room._id+'" name="'+strip_tags(room.name)+'" game="'+strip_tags(room.game)+'"><div class="room-platform-icon"><img class="platform-icon" src="imgs/'+imagesPlatform[room.platform]+'" alt="xbox-one"></div><div class="room-game">'+strip_tags(room.game)+'</div><div class="room-mode">'+strip_tags(room.name)+'</div><div class="room-capacity">'+room.online_players+'/'+room.max_players+'</div></div>');
        });
        if(data.length < limitRooms || data.length >= 300){
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
    registerLog({
          id: socket.id,
          gamertag,
          msg
    });
    scrollBottom("all-msgs");
    return false;
  });


   $('form[name="create_room"]').submit(function() {
     const idError = $('#error-crate-room');
    idError.fadeOut('fast');

     if(gamertag){
        const data = {};

        data.name = strip_tags($('#name').val());
        data.max_players = Math.round(strip_tags($('#limit').val()));
        data.game = strip_tags($('#game').val());
        data.platform = strip_tags($('select#platform option:selected').val());

        if(!validateName(data.game)){
          idError.html('Nome do jogo inválido, deve conter de 2 a 20 caracteres.');
          idError.fadeIn('fast');
        } else if(!validateName(data.name)){
          idError.html('Nome da sala inválido, deve conter de 2 a 20 caracteres.');
          idError.fadeIn('fast');
        } else if(!(data.max_players >= 2 && data.max_players <= 64)){
          idError.html('Número máximo de pessoas na sala inválido, mínimo:2 maximo:64');
          idError.fadeIn('fast');
        } else {
          socket.emit('create room', data);
        }
      } else{
        $('#save-gamertag').modal('show');
      }
       return false;
   });

   $('form[name="save_gamertag"]').submit(() => {
     let tag = strip_tags($('#gamertag').val());
     $('#error-gamertag').fadeOut('fast');
      if(tag.length > 1){
       $('#save-gamertag').modal('hide');
       gamertag = strip_tags($('#gamertag').val());
       socket.emit('save gamertag', gamertag);
       if(join){
        joinRoom(idRoom, gamertag, socket);
      } else {
         $('#criar-sala').modal('show');
      }
     } else {
       $('#error-gamertag').html('Gamertag curta de mais')
       $('#error-gamertag').fadeIn('fast');
     }
     return false;
   });



  socket.on('new msg', (data) => {
    $('div#inside-msgs').append('<div class="msg"><span class="user">'+strip_tags(data.gamertag)+':</span> '+strip_tags(maxLengthstr(data.msg))+'</div>');
    registerLog(data);
    scrollBottom("all-msgs");
  });

  socket.on('new user', (data) => {
      let newUser = true;
      const idData = setId(data);
      $('div.online').each(function(){
          if($(this).attr('id') == idData){
              newUser = false;
              return false;
          }
      });
      if(newUser){
        $('div#onlines').append('<div id="'+idData+'" class="online">'+strip_tags(data.gamertag)+'</div>');
        $('div#inside-msgs').append('<div class="msg online-msg">Usuário <span class="name-on">'+strip_tags(data.gamertag)+'</span> acabou de entrar!</div>');
        registerLog({
          id: '/#online',
          gamertag: data.gamertag,
          msg: 'online'
        });
      }
      socket.emit('im online', data.id);
      scrollBottom("all-msgs");
  });
  socket.on('user leaves', (data) => {
    const div = $('#'+data.id.replace('/#', ''));
    div.fadeOut('fast', () => {
        div.remove();
        $('div#inside-msgs').append('<div class="msg online-msg"><span class="name-on">'+strip_tags(data.gamertag)+'</span> saiu!</div>');
        registerLog(logMsg, {
          id: '/#offline',
          gamertag: data.gamertag,
          msg: 'offline'
        });
        scrollBottom("all-msgs");
    });
  });

  socket.on('log users', (data) => {
      const idUser = setId(data);
      if(!document.getElementById(idUser)){
        $('div#onlines').append('<div id="'+idUser+'" class="online">'+strip_tags(data.gamertag)+'</div>');
      }
  });

  socket.on('get msg', (data) => {
    socket.emit('getting log', {to: data, log:logMsg});
  });

  socket.on('recive log', (data) => {
      if(waitLog && data.length <=30){
        logMsg = data;
        logMsg.forEach((data) => {
          const idData = setId(data);
          if(idData== socket.id){
            $('div#inside-msgs').append('<div class="msg me">'+strip_tags(maxLengthstr(data.msg))+'</div>');
          } else if(idData == 'online'){
             $('div#inside-msgs').append('<div class="msg online-msg"><span class="name-on">'+strip_tags(maxLengthstr(data.gamertag))+'</span> acabou de entrar!</div>');
          } else if(idData == 'offline'){
            $('div#inside-msgs').append('<div class="msg online-msg"><span class="name-on">'+strip_tags(maxLengthstr(data.gamertag))+'</span> saiu!</div>');
          } else {
            $('div#inside-msgs').append('<div class="msg"><span class="user">'+strip_tags(data.gamertag.substring(0,20))+':</span> '+strip_tags(maxLengthstr(data.msg))+'</div>');
          }
        });
      }
      scrollBottom("all-msgs");
      waitLog = false;
  });


  $('.container > .content').on('click', '.room', function() {
      if(!openSearch){
          const name = $(this).attr('name');
          const game = $(this).attr('game');
          const id = $(this).attr('id');
          const platform = $(this).attr('platform');
          $('#users-online > img').attr('src', 'imgs/'+imagesPlatform[platform]);
          $('span#name-span-game').html(strip_tags(game));
          $('span.modo-game').html(strip_tags(name));
          idRoom = id;
        if(!gamertag){
          $('#save-gamertag').modal('show');
          join = true;
        } else {
            joinRoom(idRoom, gamertag, socket);
        }
      }
  });
  socket.on('open chat', openChatRoom);
  socket.on('full chat', () => alert('Sala cheia, por favor tente mais tarde.'));
  socket.on('search response', (data) => {
      //  data.sort((a,b) => b.online_players - a.online_players);
        $('#search_rooms').html('');
        data.forEach((room) => {
          $('#search_rooms').append('<div class="room" platform="'+room.platform+'" id="'+room._id+'" name="'+strip_tags(room.name)+'" game="'+strip_tags(room.game)+'"><div class="room-platform-icon"><img class="platform-icon" src="imgs/'+imagesPlatform[room.platform]+'" alt="xbox-one"></div><div class="room-game">'+strip_tags(room.game)+'</div><div class="room-mode">'+strip_tags(room.name)+'</div><div class="room-capacity">'+room.online_players+'/'+room.max_players+'</div></div>');
        });
        if(data.length < limitSearch || data.length >= 300){
          $('#more-search').hide();
        } else{
          $('#more-search').show();
        }
  });

  socket.on('room response', (data) => {
      if(typeof data === 'object'){
        $('#close_room').click();
        $('#users-online > img').attr('src', 'imgs/'+imagesPlatform[data.platform]);
        $('span#name-span-game').html(strip_tags(data.game));
        $('span.modo-game').html(strip_tags(data.name));
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

  $('#toggle-people').click(function() {
    $('#users-online').slideToggle(1);
  });

  $('a#search_link').click(() => {
      searchOpen();
      return false;
  });
  $('span.close-btn').click(searchClose);

  $('body').keydown(e =>{
      if(e.which == 27){
        if(openSearch){
          searchClose();
        }
        closeChatRoom();
      }
   });

   $('#btn-create-room').click(() => {
     if(!gamertag){
          $('#save-gamertag').modal('show');
          join = false;
     } else {
        $('#criar-sala').modal('show');
     }
   });

  $('#criar-sala').on('show.bs.modal', e => changeScroll());
  $('#criar-sala').on('hidden.bs.modal', e => changeScroll());
  $('#save-gamertag').on('show.bs.modal', e => changeScroll());
  $('#save-gamertag').on('hidden.bs.modal', e => changeScroll());

  socket.on('disconnect', () => {
    window.location.reload(true);
  });

  // setInterval(() =>{
  //   $('header').addClass("transitionBG");
  //   if(defaultBg ==  'url(../../imgs/bg1.jpg)'){
  //     defaultBg = "url(../../imgs/bg2.jpg)";
  //     $('header').css("background-image", "url(../../imgs/bg2.jpg)");
  //   } else if(defaultBg ==  'url(../../imgs/bg2.jpg)'){
  //     defaultBg = "url(../../imgs/bg3.jpg)";
  //     $('header').css("background-image", "url(../../imgs/bg3.jpg)");
  //   }else{
  //     defaultBg = "url(../../imgs/bg1.jpg)";
  //     $('header').css("background-image", "url(../../imgs/bg1.jpg)");
  //   }
  // }, 3000) ;

  function joinRoom(_id, gamertag, socket){
    socket.emit('join room', _id);
    $('div#onlines').append('<div id="'+socket.id+'" class="online">'+strip_tags(gamertag)+'</div>');
  }

  function maxLengthstr(msg){
    return msg.substring(0,255);
  }

  function registerLog(msg){
    msg.msg = maxLengthstr(msg.msg);
    if(logMsg.length <= 30){
      logMsg.push(msg);
    } else {
      logMsg = [];
      logMsg.push(msg);
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
    if($(drop).attr('name') != 'todas'){
      selected = $(drop).attr('name');
      let path = $(drop).attr('data');
      $('.platforms').html('<img src="imgs/'+path+'">');
      $('.dropdown').removeClass('open');
    } else {
      selected = false;
      $('.platforms').html('+');
      $('.dropdown').removeClass('open');
    }
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
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
 (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
 m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
 })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

 ga('create', 'UA-53443086-2', 'auto');
 ga('send', 'pageview');
