var express = require("express");
var router = express.Router();
var passport = require("passport");
var User  = require("../models/user");
var Room = require("../models/room");
var Message = require("../models/message");
var Pair = require("../models/pair");
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

const requestIp = require('request-ip'); 

router.post('/uploadProfilePicture', upload.single('avatar'), function (req, res, next) {
  User.findOne({username: req.body.username}, function(err, user){
        if(err)
            console.log(err);
        else if(user){
            console.log("saved");
            user.linkToProfilePicture = req.file.path;
            user.save();
            res.render("editProfile", {user: user});
        }
  });
});

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

router.get("/", function(req, res){
   res.render("landing"); 
});

router.post("/login",
    passport.authenticate("local", 
      {successRedirect: "/chat", 
       failureRedirect: "/"
    }), function(req, res){
         
});

router.post("/register", function(req, res){
   var newUser = new User({username : req.body.username, fullName : req.body.fullName, email : req.body.email, bio : ""});
   User.register(newUser, req.body.password, function(err, user){
      if(err){
          console.log(err);
         return res.render("landing");
      }
      else {
          console.log(user);
          passport.authenticate("local")(req, res, function(){
              console.log(req);
             res.redirect("/chat");
          });
      }
   })
});

router.get("/logout", function(req, res){
   req.logout();
   res.redirect("/");
});

router.get("/:username", function(req, res){
    User.findOne({username: req.params.username}, function(err, user){
        if(err)
            res.redirect("/");
        else if(user){
            var from = requestIp.getClientIp(req);
            if(req.user)
                from = req.user.username;
            var room = getMinOrMaxString(from, user.username, 0) + '@' + getMinOrMaxString(from, user.username, 1);
            res.render("profile", {user: user, from : from, room: room});
        }
   });
});

router.get("/:username/edit", function(req, res){
    User.find({username: req.params.username}, function(err, user){
        if(user.length == 0)
            res.redirect("/");
        else 
            res.render("editProfile", {user: user[0]});
   });
});

router.post("/changePassword", passport.authenticate("local", {failureRedirect: "/" }), function(req, res){
    User.find({username: req.body.username}, function(err, user){
        if(user.length == 0)
            res.redirect("back");
        else if(req.body.newPassword == req.body.confirmedNewPassword){
            user[0].setPassword(req.body.newPassword, function(){
                user[0].save();
            });
            res.redirect("/chat");
        }
        else {
            res.redirect("back");
        }
    });
});

router.post("/changeInfo", function(req, res){
    User.findOne({username: req.body.user.username}, function(err, user){
        if(err){
            console.log(err);
        }
        console.log(req.body.user);
        var username = req.body.user.username;
        var fullName = req.body.user.fullName;
        user.fullName = fullName;
        user.bio = req.body.user.bio;
        user.email = req.body.user.email;
        user.save();    
        Pair.find({ $or: [ {person1username : username}, {person2username : username} ] }, function (err, foundPair){
            if(err){
                console.log(err);
            }
            else if(foundPair){
                for(var i = 0;i < foundPair.length;++ i){
                    if(foundPair[i].person1username == username){
                        foundPair[i].person1fullName = fullName;
                        foundPair[i].save();
                    }
                    if(foundPair[i].person2fullName == username) {
                        foundPair[i].person2fullName = fullName;
                        foundPair[i].save();
                    }
                }
            }
        });
        res.redirect("back");
    });
});

router.post("/uploadProfilePicture", function(req, res){
   res.send("!");
   console.log(req.body); 
});

module.exports = router;