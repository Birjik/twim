var mongoose = require("mongoose");
 
var roomSchema = new mongoose.Schema({
    roomName: String,
    messages: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "message" 
   }]
});

module.exports = mongoose.model("room", roomSchema);