var express        =  require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    mongoose      = require("mongoose"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    methodOverride = require("method-override"),
    User           = require("./models/user"),
    Message        = require("./models/message"),
    Pair           = require("./models/pair");

var indexRoutes  = require("./routes/index"),
    chatRoutes   = require("./routes/chat");

var server = require('http').createServer(app)
  , client = require('socket.io').listen(server).sockets;
var Room = require("./models/room");

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

function getSecondUser(room, user){
    var users = room.split('@');
    if(users[0] == user)
        return users[1];
    return users[0];
}

function createProfileForAnonymIfNotExists(username, lastRoom, linkToProfilePicture){
     User.findOne({ username : username }, function(err, user) {  
        if(err){
            console.log(err);
        }
        if(!user){
             User.create({fullName: '?', username: username, lastRoom: lastRoom, linkToProfilePicture: linkToProfilePicture}, function(err, newUser){
                if(err){
                    console.log(err);
                } 
                newUser.save();
                console.log("saved new user");
             });
        }
     });
}

function updatePair(from, to, room, message, timestamp){
    var minString = getMinOrMaxString(from, to, 0);
    var maxString = getMinOrMaxString(from, to, 1);
    var person1fullName = '?', person2fullName = '?';
    var person1link = 'https://bootdey.com/img/Content/avatar/avatar4.png', person2link = 'https://bootdey.com/img/Content/avatar/avatar4.png';
    User.find({ $or: [ {username : minString}, {username : maxString} ] }, function(err, user) {
        if(err){
            console.log(err);
        }
        else if(user.length > 0){
            for(var i = 0;i < user.length;++ i){
                if(user[i].username == from){
                    user[i].lastRoom = room;     
                    user[i].save();    
                }
                if(user[i].username == minString){
                    person1fullName = user[i].fullName;
                    person1link = user[i].linkToProfilePicture;
                }
                if(user[i].username == maxString){
                    person2fullName = user[i].fullName;
                    person2link = user[i].linkToProfilePicture;
                }
            }
            Pair.findOne({person1username: minString, person2username: maxString}, function(err, foundPair){
                if(err){
                    console.log(err);
                } 
                else if(!foundPair){
                    Pair.create({person1username: minString, person2username: maxString, 
                                 person1fullName: person1fullName, person2fullName: person2fullName,
                        person1lastClick: 0, person2lastClick: 0,
                        person1linkToProfilePicture : person1link, person2linkToProfilePicture: person2link
                    }, function(err, newPair){
                       if(err){
                           console.log(err);
                       }
                       else {
                            console.log("pair was created!");
                            console.log(newPair);
                       }
                    });
                }
                else {
                    foundPair.person1fullName = person1fullName;
                    foundPair.person2fullName = person2fullName;
                    foundPair.lastMessage = message;
                    foundPair.lastSent = from;
                    foundPair.lastTime = timestamp;
                    foundPair.person1lastClick = foundPair.person2lastClick = 0;
                    foundPair.person1linkToProfilePicture = person1link;
                    foundPair.person2linkToProfilePicture = person2link;
                    foundPair.save();
                    console.log("pair was updated!");
                }
            });
        }
    });
}

server.listen(process.env.PORT);
mongoose.connect("mongodb://localhost/talkwithme", { useNewUrlParser: true }, function(err){
    if(err){
        throw err;
    }
    console.log('MongoDB connected...');
    client.on('connection', function(socket){
        // console.log('socket '+socket.id+' connect');
        socket.on('subscribe', function(room) { 
            socket.join(room); 
            Room.findOne({roomName: room}).populate("messages").exec(function(err, foundRoom){
                if(err){
                    throw err;
                }
                if(foundRoom){
                    socket.emit('output', {messages : foundRoom.messages, room: room});
                }
            });
        });
        socket.on('hasDialog', function(room){ 
            socket.join("hasDialog" + room); 
        });
        socket.on('unsubscribe', function(room){ 
            socket.leave(room);
        });
        socket.on('lastClick', function(data){
            let user = getSecondUser(data.room, data.clicked);
            let minString = getMinOrMaxString(data.clicked, user, 0);
            let maxString = getMinOrMaxString(data.clicked, user, 1);
            User.findOne({username: data.clicked}, function(err, foundUser){
                if(err){
                    console.log(err);
                } 
                else if(foundUser){
                    console.log("user found and changed last room");
                    console.log(foundUser);
                    console.log(data.room);
                    foundUser.lastRoom = data.room;
                    foundUser.save();
                }
            });
            Pair.findOne({person1username : minString, person2username: maxString}, function(err, foundPair){
                if(err){
                    console.log(err);
                }
                else if(foundPair){
                    if(data.clicked == minString){
                        foundPair.person1lastClick = Date.now();
                    }
                    else if(data.clicked == maxString || data.clicked == user){
                        foundPair.person2lastClick = Date.now();
                    }
                    foundPair.save();
                }
            })
        });
        socket.on('input', function(data){
            let username = data.username;
            let message = data.message;
            let room = data.room;
            let timestamp = Date.now();
            let to = getSecondUser(room, username);
            let linkToProfilePicture = "https://bootdey.com/img/Content/avatar/avatar4.png";
            if(data.fromProfile && data.fromProfile == 1){
                createProfileForAnonymIfNotExists(username, room, linkToProfilePicture);
                updatePair(username, to, room, message, timestamp);
            }
            Pair.findOne(
                    { $or: [ {person1username : username, person2username : to}, {person2username : username, person1username : to} ] }, 
                function (err, foundPair){
                if(err){
                    console.log(err);
                }          
                else if(foundPair){
                    console.log("pair was found as well!");
                    foundPair.lastTime = timestamp;
                    foundPair.lastMessage = message;
                    foundPair.lastSent = username;
                    if(foundPair.person1username == username){
                        foundPair.person1lastClick = Date.now();
                    }
                    else {
                        foundPair.person2lastClick = Date.now();
                    }
                    foundPair.save();
                }
            });
            if(message != ''){
                Room.findOne({roomName: room}).populate("messages").exec(function(err, foundRoom){
                    if(err){
                        throw err;
                    }
                    if(!foundRoom){
                        Room.create({roomName: room}, function(err, newRoom){   
                            if(err){
                                console.log(err);
                            }
                            else {
                                console.log("room was created!");
                                foundRoom = newRoom;
                            }
                        });
                    }
                    Message.create({message: message, date: timestamp, user: username}, function(err, newMessage){
                        if(err){
                            console.log(err);
                        }    
                        else {
                            foundRoom.messages.push(newMessage);
                            foundRoom.save();
                            console.log("sent to output " + room);
                            client.to("hasDialog" + room).emit('lastMessage', {message: message, room : room, user: username, time: timestamp});
                            client.to(room).emit('output', {messages: foundRoom.messages, room : room});
                        }
                    });
                });
            }
        });
        socket.on('disconnect', function() {
            // console.log('socket ' + this.id + ' disconnect');
        });
    });
    
});

app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname));
app.use(methodOverride("_method"));

app.use(require("express-session")({
   secret : "AdreN to Faze Clan",
   resave: false,
   saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});

app.use("/chat", chatRoutes);
app.use("/", indexRoutes);