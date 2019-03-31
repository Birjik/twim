var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
 
var UserSchema = new mongoose.Schema({
    fullName: String,
    username: String,
    password: String,
    lastRoom: String,
    bio: String,
    email: String,
    linkToProfilePicture: String
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);