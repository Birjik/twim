var mongoose = require("mongoose");
 
var messageSchema = new mongoose.Schema({
   message: String,
   date: Number,
   user: String
});
 
module.exports = mongoose.model("message", messageSchema);