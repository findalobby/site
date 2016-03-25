'use strict';
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

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
        socket.broadcast.to(idRoom).emit('new user', {gamertag:socket.gamertag, id:socket.id});

        const hostId = hostRoom(socket.idRoom, io);
        if(hostId != socket.id){
          socket.broadcast.to(hostId).emit('get msg', socket.id);
        }
    });

    socket.on('getting log', (data) => {
        socket.broadcast.to(data.to).emit('recive log', data.log);
    });

    socket.on('leave room', () => socket.leave(socket.idRoom));

    socket.on('im online', (data) =>   {
      if(sameRoom(socket.idRoom, io, data, socket.id)){
        socket.broadcast.to(data).emit('log users', {gamertag:socket.gamertag, id:socket.id});
      }
    });

    socket.on('send msg', (data) => {
      socket.broadcast.to(socket.idRoom).emit('new msg', {msg: data, gamertag: socket.gamertag, id: socket.id});
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

function sameRoom(idRoom, io, id1, id2){
  const findIds = [];
  for(let i in io.sockets.adapter.rooms[idRoom].sockets){
      if(i == id1 || i == id2){
        findIds.push(i);
      }
      if(findIds.length == 2){
        return true;
        break;
      }
  }
}

function hostRoom(idRoom, io){
  for(var i in io.sockets.adapter.rooms[idRoom].sockets){break;}
  return i;
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});
