const mongoose = require('mongoose');

const SocketConnectionSchema = new mongoose.Schema({
  socketid:  {
    type: String, 
    unique: true
  },   
  email: {
    type: String,  
    lowercase: true    
  }, 
  datetime: String,
  device: String
})

const SocketConnection = mongoose.model('SocketConnection', SocketConnectionSchema);

module.exports = SocketConnection
