$(document).ready(function() {

  'use strict';

  let defaultBg = 'url(../../imgs/bg1.jpg)';
  const searchClose = () => {
    $('section#search').hide();
    $('header, nav').show();
  };

  $('a#search_link').click(()=>{
    $('section#search').show();
    $('nav').hide();
  });

  $('.slider').hide();

  $('span#close').click(searchClose);
  $('body').keydown((event) => {
      if(event.which == 27){
        searchClose();
      }
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
