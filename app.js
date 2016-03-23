'use strict';
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
let numberOnline = 0;
// const session = require('express-session');
//
// app.use(session({
//   cookieName: 'session',
//   secret: 'apir4985t943vujicoaç'
// }));

mongoose.connect('mongodb://localhost/findalobby');
const Schema = mongoose.Schema;

const _schema = {
    name: {type: String},
    max_players:{type: Number},
    game: {type: String},
    platform: {type: String}
}

const schemaRoom = new Schema(_schema, {  toObject: { virtuals: true},  toJSON: {virtuals: true } });
const room = mongoose.model('rooms', schemaRoom);

app.use(express.static('public'));

const emitRooms = (emitter) => {
  room.find({}, (err, data) => {
      emitter.emit('news rooms', data);
    });

  }

  io.on('connection', (socket) => {
    console.log('Online: ', Object.keys(io.sockets['connected']).length);

    schemaRoom.virtual('online_players').get(function(){
            const idRoom = this._id;
            return onlineRoom(idRoom, io);
    });


    setInterval(() => {
      room.find({}, (err, data) => {
          const rooms = data.map(obj => {
            obj['online_players'] = 19;
            return obj;
          });
          io.emit('news rooms', rooms);
      });
    }, 1000);



    socket.on('disconnect', function(){
      console.log('Online: ', Object.keys(io.sockets['connected']).length);
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
        const idRoom = data._id;
        socket.idRoom = idRoom;
        socket.gamertag = data.gamertag;
        socket.join(idRoom);
        console.log(idRoom+': '+onlineRoom(idRoom, io));
        socket.broadcast.to(idRoom).emit('new user', socket.gamertag);
    });

    socket.on('send msg', (data) => {
      socket.broadcast.to(socket.idRoom).emit('new msg', {msg: data, gamertag: socket.gamertag});
    });

    socket.on('create room', (value) => {
        room.create(value, (err, data) => {
          socket.emit('room response',data);
        });
    });
});

function onlineRoom(idRoom, io){
  const room = io.sockets.adapter.rooms[idRoom];
  if(room){
    return room.length;
  }
    return 0;
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});
