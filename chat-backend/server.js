const express = require('express');
const app = express();
const userRoutes = require('./routes/userRoutes')
const User = require('./models/User');
const Message = require('./models/Message')
const SocketConnection = require('./models/SocketConnection')
const rooms = ['Nội bộ'];
const cors = require('cors');

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());

app.use('/users', userRoutes)
require('./connection')

const server = require('http').createServer(app);
const PORT = 5001;
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})


async function getLastMessagesFromRoom(room){
  let roomMessages = await Message.aggregate([
    {$match: {to: room}},
    {$group: {_id: '$date', messagesByDate: {$push: '$$ROOT'}}}
  ])
  return roomMessages;
}

function sortRoomMessagesByDate(messages){
  return messages.sort(function(a, b){
    let date1 = a._id.split('/');
    let date2 = b._id.split('/');

    date1 = date1[2] + date1[0] + date1[1]
    date2 =  date2[2] + date2[0] + date2[1];

    return date1 < date2 ? -1 : 1
  })
}

// socket connection

io.on('connection',async (socket)=> { 
 // const members = await User.find();
  console.log('user connection: ',socket.id);
//  console.log('user connection members: ',members);
  socket.on('disconnect', async function(a){
     let conn=await SocketConnection.findOneAndDelete({socketid:socket.id});
     if(conn) {
        let exist_conn=await SocketConnection.find({email:conn.email});
        console.log('current user connections: ',exist_conn);
        if(exist_conn.length==0){
          let user = await User.findOne({email:conn.email});
          user.status = "offline"; 
          await user.save();
        }
     } 
     console.log('user disconnected a: '+a, conn);
  });


  socket.on('new-user', async (email)=> {
    const members = await User.find();
    console.log('new-user: ',email);
    try{
      const conn = await SocketConnection.create({ socketid:socket.id, email, datetime:new Date(),device:""});
      let user = await User.findOne({email:email});
      user.status = "online"; 
      await user.save();
      console.log('new-conn: ',conn);
    }catch(e){
      console.log('err save new-conn: ', e);
    }
  
    io.emit('new-user', members)
  })

  socket.on('join-room', async(newRoom, previousRoom)=> {
    console.log('join-room newRoom:', newRoom);
    console.log('join-room previousRoom:', previousRoom);
    socket.join(newRoom);
    socket.leave(previousRoom);
    let roomMessages = await getLastMessagesFromRoom(newRoom);
    roomMessages = sortRoomMessagesByDate(roomMessages);
    socket.emit('room-messages', roomMessages)
  })

  socket.on('message-room', async(room, content, sender, time, date) => {
    const newMessage = await Message.create({content, from: sender, time, date, to: room});
    let roomMessages = await getLastMessagesFromRoom(room);
    roomMessages = sortRoomMessagesByDate(roomMessages);
    // sending message to room
    io.to(room).emit('room-messages', roomMessages);
    socket.broadcast.emit('notifications', room)
  })

  app.delete('/logout', async(req, res)=> {
    try {
      const {_id, newMessages} = req.body;
      const user = await User.findById(_id);
      user.status = "offline";
      user.newMessages = newMessages;
      await user.save();
      const members = await User.find();
      socket.broadcast.emit('new-user', members);
      res.status(200).send();
    } catch (e) {
      console.log(e);
      res.status(400).send()
    }
  })

})


app.get('/rooms', (req, res)=> {
  res.json(rooms)
})


server.listen(PORT, ()=> {
  console.log('listening to port', PORT)
})
