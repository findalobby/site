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

const schemaRoom = new Schema(_schema);
const room = mongoose.model('rooms', schemaRoom);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('a user connected');

  setInterval(() => {
    room.find({}, (err, data) => {
        io.emit('news rooms', data);
    });
  }, 5000);

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('search', (value) => {
    room.find({$or: [ {name:new RegExp(value, "i")}, {game:new RegExp(value, "i")} ]}, (err, data) => {
        socket.emit('search response', data);
    });
  });

  socket.on('create room', (value) => {
      room.create(value, (err, data) => {
        console.log(data);
      });
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
