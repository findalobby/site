'use strict';
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

mongoose.connect('mongodb://localhost/findalobby');
const Schema = mongoose.Schema;

const _schema = {
    name: {type: String, required: true,
      validate:{
        validator: (value) => {
          if(value.length >=2 && value.length <=20){
            return true;
          }
          return false;
        }
      }
    },
    max_players:{type: Number, min: 2, max:64, required: true, validate:{
        validator: (value) =>  Number.isInteger(value)
    }},
    game: {type: String,
      required: true,
      validate:{
        validator: (value) => {
          if(value.length >=2 && value.length <=20){
            return true;
          }
          return false;
        }
      }
    },
    platform: {type: String,
      enum:['XBOX 360', 'XBOX ONE', 'PLAYSTATION 4', 'PLAYSTATION 3', 'PC', 'IOS', 'ANDROID'],
      required: true
    }
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



    socket.on('get news rooms', (data) => {
      const query = {};
      if(data.selected){
        query.platform = data.selected;
      }
      if(data.limit > 300){
        data.limit = 300;
      }
      room.find(query).sort({_id:'desc'}).limit(data.limit).exec((err, data) => {
          socket.emit('news rooms', data);
      });
    });

    socket.on('save gamertag', (gamertag) => {
      if(gamertag.substring(0,20).length > 1){
        socket.gamertag = gamertag.substring(0,20)
      }
    });

    socket.on('search', (data) => {
      const searchName = {};
      const searchGame = {};

      searchName.name = new RegExp(data.input, "i");
      searchGame.game = new RegExp(data.input, "i");

      if(data.selected) {
        searchName.platform = data.selected;
        searchGame.platform = data.selected;
      };

      if(data.limit > 300){
        data.limit = 300;
      }

      room.find({$or: [ searchName, searchGame ]}).limit(data.limit).exec((err, data) => {
            socket.emit('search response', data);
      });
  });

    socket.on('join room', (data) => {
        joinRoom(socket, data);
    });

    socket.on('getting log', (data) => {
        socket.broadcast.to(data.to).emit('recive log', data.log);
    });

    socket.on('leave room', () => leaveRoom(socket,1));

    socket.on('im online', (data) =>   {
      if(sameRoom(socket.idRoom, io, data, socket.id)){
        socket.broadcast.to(data).emit('log users', {gamertag:socket.gamertag, id:socket.id});
      }
    });

    socket.on('send msg', (data) => {
      if(socket.idRoom){
        socket.broadcast.to(socket.idRoom).emit('new msg', {msg: data.substring(0,255), gamertag: socket.gamertag, id: socket.id});
      }
    });

    socket.on('create room', (value) => {
      if((socket.gamertag) && !(socket.idRoom)){
        room.create(value, (err, data) => {
          if(data && !err){
            joinRoom(socket, data._id);
            socket.emit('room response',data);
          }
        });
      }
    });

    socket.on('disconnect', function(){
      leaveRoom(socket, 0);
      console.log('Online: ', Object.keys(io.sockets['connected']).length);
    //  console.log(io.sockets.adapter.rooms);
    });
});

function joinRoom(socket, idRoom){
  room.findOne({_id:idRoom}, (err, data) => {
    if(data && !err && (onlineRoom(data._id, io) < data.max_players)){
      if((socket.gamertag) && (!socket.idRoom)){
          socket.idRoom = data._id;
          socket.join(socket.idRoom);
          console.log(socket.idRoom+': '+onlineRoom(socket.idRoom, io));
          socket.broadcast.to(socket.idRoom).emit('new user', {gamertag:socket.gamertag, id:socket.id});

          const hostId = hostRoom(socket.idRoom, io);
          if(hostId != socket.id){
            socket.broadcast.to(hostId).emit('get msg', socket.id);
          }
          socket.emit('open chat');
      } else {
        socket.emit('full chat');
      }
    } else {
      socket.emit('full chat');
    }
  });
}
function leaveRoom(socket, limit){
  if(socket.idRoom){
    if(onlineRoom(socket.idRoom, io) == limit){
        console.log(onlineRoom(socket.idRoom, io));
        room.remove({_id:socket.idRoom}, (err) => '');
    }else{
      socket.broadcast.to(socket.idRoom).emit('user leaves', socket.id);
    }
    socket.leave(socket.idRoom);
    delete socket.idRoom;
  }
}

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
