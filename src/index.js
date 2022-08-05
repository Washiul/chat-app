const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages.js');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '../public');

app.use(express.static(publicDir));

io.on('connection', (socket)=>{

	socket.on('join', (options, callback)=>{
		const {error, user} = addUser({id:socket.id, ...options});
		
		if(error){
			return callback(error);
		}

		socket.join(user.room);
		socket.emit('message',generateMessage('admin','Welcome to this group!!'));
		socket.broadcast.to(user.room).emit('message',generateMessage('admin',`${user.username} has joined!`));

		io.to(user.room).emit('userData',{room: user.room, users: getUsersInRoom(user.room)})

	})

	socket.on('sendMessage', (message, callback)=>{
		const user = getUser(socket.id);
		if( !user ){
			return callback('Something wrong!');
		}
		
		const filter = new Filter();
		if( filter.isProfane(message)){
			return callback('Bad words not permitted!');
		}
		
		io.to(user.room).emit('message', generateMessage(user.username,message));
		callback();
	});

	socket.on('sendLocation', (position, callback)=>{
		const user = getUser(socket.id);
		
		if(!user){
			return callback('Something wrong!');
		}

		io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://www.google.co.in/maps?q=${position.latitude},${position.longitude}`));
		callback();
	})

	socket.on('disconnect', ()=>{
		const user = removeUser(socket.id);
		
		if(user){
			io.to(user.room).emit('message', generateMessage('admin',`${user.username} has left!`));
			io.to(user.room).emit('userData',{room: user.room, users: getUsersInRoom(user.room)})

		}
		
	});

});

server.listen(port, ()=>{
	console.log(`Server running at port ${port}`);
});
