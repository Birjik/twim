var mongoose = require("mongoose");
 
// person1 minString, person2 maxString
 
var pairSchema = new mongoose.Schema({
   person1username: String,
   person2username: String,
   person1linkToProfilePicture: String,
   person2linkToProfilePicture: String,
   person1lastClick: Number,
   person2lastClick: Number,
   person1fullName: String,
   person2fullName: String,
   lastMessage: String,
   lastSent: String,
   lastTime: Number
});
 
module.exports = mongoose.model("pair", pairSchema);