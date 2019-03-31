var express = require("express");
var router = express.Router();
var passport = require("passport");
var User  = require("../models/user");
var Pair = require("../models/pair");
var Room = require("../models/room");
const requestIp = require('request-ip'); 

function getMinOrMaxString(string1, string2, if_max){
    if(string1.length < string2.length){
        if(if_max == 1)
            return string2;
        return string1;
    }
    else if(string1.length > string2.length){
        if(if_max == 1)
            return string1;
        return string2;
    }
    for(var i = 0;i < string1.length;i ++){
        if(string1[i] < string2[i]){
            if(if_max == 1)
                return string2;
            return string1;            
        }
        else if(string1[i] > string2[i]){
            if(if_max == 1)
                return string1;
            return string2;
        }   
    }
    return string1;
}

router.post("/", function(req, res){
    res.redirect("/chat");
});

router.get("/", function(req, res){
    var user;
    if(!req.user){
        user = requestIp.getClientIp(req);
    }
    else {
        user = req.user.username; 
    }
    var dialogs = [];
    var lastRoom = "";
    User.findOne({username: user}, function(err, foundUser){
        if(err){
            console.log(err);
        } 
        else if(foundUser){
            lastRoom = foundUser.lastRoom;
        }
    });
    Pair.find({ $or: [ {person1username : user}, {person2username : user} ] }, {}, {sort : {lastTime : -1}}, function(err, people){
        if(err){
            console.log("!!");
            console.log(err);
        } 
        else {
           var dialogs = [];
           for(var i = 0;i < people.length;++ i){
               if(!people[i].person1lastClick){
                   people[i].person1lastClick = 0;
               }
               if(!people[i].person2lastClick){
                   people[i].person2lastClick = 0;
               }
               var room;
               if(people[i].person1username != user){
                    room = getMinOrMaxString(user, people[i].person1username, 0) + '@' + getMinOrMaxString(user, people[i].person1username, 1);
                    dialogs.push({fullName : people[i].person1fullName, username: people[i].person1username, lastTime : people[i].lastTime, 
                    lastClick: people[i].person2lastClick, lastSent : people[i].lastSent,
                    room : room,
                    lastMessage: people[i].lastMessage, linkToProfilePicture : people[i].person1linkToProfilePicture
                    });
               }
               else {
                    room = getMinOrMaxString(user, people[i].person2username, 0) + '@' + getMinOrMaxString(user, people[i].person2username, 1);
                    dialogs.push({fullName : people[i].person2fullName, username: people[i].person2username, lastTime : people[i].lastTime, 
                    lastClick: people[i].person1lastClick, lastSent : people[i].lastSent,
                    room : getMinOrMaxString(user, people[i].person2username, 0) + '@' + getMinOrMaxString(user, people[i].person2username, 1),
                    lastMessage: people[i].lastMessage, linkToProfilePicture : people[i].person2linkToProfilePicture});
               }
               if(lastRoom == ""){
                   lastRoom = room;
               }
           }
           for(var i = 0;i < people.length;++ i){
                people[i].save();
           }
           res.render("chat", {people : dialogs,  personsUsername: user, lastRoom: lastRoom});
        }
    });
});

module.exports = router;