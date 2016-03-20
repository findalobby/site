'use strict';
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const session = require('express-session');

app.use(session({
  cookieName: 'session',
  secret: 'apir4985t943vujicoaç'
}));

mongoose.connect('mongodb://localhost/findalobby');
const Schema = mongoose.Schema;

const _schema = {
    name: {type: String},
    max_players:{type: Number},
    game: {type: String},
    platform: {type: String}
}

const schemaRoom = new Schema(_schema);
const room = mongoose.model('rooms', schemaRoom);

app.use(express.static('public'));

const emitRooms = (emitter) => {
  room.find({}, (err, data) => {
      emitter.emit('news rooms', data);
    });
  }

  io.on('connection', (socket) => {
    console.log('a user connected');


    setInterval(() => {
      room.find({}, (err, data) => {
          io.emit('news rooms', data);
      });
    }, 1000);



    socket.on('disconnect', function(){
      console.log('user disconnected');
    });

    socket.on('search', (data) => {
      const searchName = {};
      const searchGame = {};

      searchName.name = new RegExp(data.input, "i");
      searchGame.game = new RegExp(data.input, "i");
      if(data.platform) {
        searchName.platform = data.platform;
        searchGame.platform = data.platform;
      };

      room.find({$or: [ searchName, searchGame ]}, (err, data) => {
          socket.emit('search response', data);
      });
    });

    socket.on('join room', (data) => {
        socket.join(data['_id']);
    });

    socket.on('send msg', (data) => {
      socket.broadcast.to(data.idRoom).emit('new msg', {msg: data.msg, gamertag: data.gamertag});
    });

    socket.on('create room', (value) => {
        room.create(value, (err, data) => {
          socket.emit('room response',data);
        });
    });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
