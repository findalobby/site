$(document).ready(function() {

  'use strict';

  var socket = io();
  let lastData = false;
  let selected = '';

  socket.on('news rooms', (data) => {
      if(!lastData){lastData = data;}
      if(data != lastData){
        $('#news_rooms').html('');
        data.forEach((room) => {
            $('#news_rooms').append('<div id="'+room._id+'" class="room"><img class="icon_room" src="imgs/360.png">'+room.game+' - <span class="modo">'+room.name+'</span> <div class="rooms-capacity">0/'+room.max_players+'</div></div>');
        });
      }
  });

  socket.on('search response', (data) => {
        $('#inside_rooms').html('');
        data.forEach((room) => {
            $('#inside_rooms').append('<div id="'+room._id+'" class="room"><img class="icon_room" src="imgs/360.png">'+room.game+' - <span class="modo">'+room.name+'</span> <div class="rooms-capacity">0/'+room.max_players+'</div></div>');
        });
  });

  socket.on('room response', (data) => {
      if(typeof data === 'object')
      $('#close_room').click();
  });


  $('#input_search').keydown(function(){
      const valueInput = $(this).val();
      console.log($('#input_search').val());
      console.log(selected);
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

  $('#close-btn').click(() => {
    alert('lalala');
  });

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
        $('section#chat-room').hide();
        $('nav').show();
      }
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

});
