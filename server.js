const express = require('express')
const app = express()
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const cors = require('cors')
const shortid = require('shortid');
const helmet = require('helmet');

var port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

// HelmetJS protection
app.use(helmet());

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


var Schema = mongoose.Schema;

var userSchema = new Schema({
  _id: {'type': String, 'default': shortid.generate},
  username: {type: String, required: true},
  activity: [{date: Date, description: String, duration: Number}]
});

var userModel = mongoose.model('userModel', userSchema);


// Search for and add user
app.route('/api/exercise/new-user').post(function(req, res){
  
  if (!req.body.username) {return res.send("No username provided");}

  // Search the database for the user
  var query = userModel.findOne({username: req.body.username}, function(err, doc){
    // If user is not in the database, add user
    if(!doc){
      var newUser = new userModel({username: req.body.username});
      newUser.save(function(err, data){
        res.json({username: data.username, _id: data._id});
      });
    }
    else{res.json({"message": "already in database"});}
  });
  
});
  

// Add activities
app.route('/api/exercise/add').post(function(req, res){
  
  var date;
  
  // If user does not provide a date, default to current date
  req.body.date ? date = new Date(req.body.date) : date = new Date();
  
  // Errors if user leaves out fields, or uses an invalid date format
  if (!req.body.userId) {return res.send("No user ID provided");}
  if (!req.body.description) {return res.send("No description provided");}
  if (!req.body.duration) {return res.send("No duration provided");}
  if (date == "Invalid Date") {return res.send("Not a valid date format");}
  
  // If user provides correct information, then search for the user
  userModel.findById(req.body.userId, function(err, data){

    if (err) return console.log("ERROR FINDING BY ID");
    
    if(!data) {return res.send("No user with that ID exists")}
    
    // If user is found in database, add activity to the array
    data.activity.push({date: req.body.date, description: req.body.description, duration: req.body.duration});
    
    // Save updated array to the database
    data.save(function(err, updatedActivity){
      if(err) return console.log("ERROR SAVING ACTIVITY");
      res.json({
        username: data.username,
        date: date.toDateString(),
        description: req.body.description,
        duration: req.body.duration,
        userId: req.body.userId
      });
    });
  });
});


// Show exercise log
app.route('/api/exercise/log').get(function(req, res){
  
  var from, to;
  
  // If dates are left blank default to 1970 (javascript 0 time) for the from field
  // and/or the current date for the to field
  (!req.query.from) ? from = new Date(0) : from = new Date(req.query.from);
  (!req.query.to) ? to = new Date() : to = new Date(req.query.to);
  
  if ((from == "Invalid Date") || (to == "Invalid Date")) {return res.json({message: "Not a valid date format"})}
 
  // Find user
  var query = userModel.findById(req.query.userId, function(err, doc){
    
    if (err) return console.log("ERROR FINDING BY ID");
    
    if(!doc) {return res.json({message: "No user with that ID exists"})}
    
    var log = [];

    // Show maximum of user limit or number of records
    var len;
    req.query.limit > doc.activity.length ? len = doc.activity.length : len = req.query.limit;
    
    // Generate an array of all activities fitting the constraints
    for (var i = 0; i < doc.activity.length; i++){
      log.push({"date": doc.activity[i].date, "description": doc.activity[i].description, "duration": doc.activity[i].duration});
    }
    
    // Sort the array by date
    log.sort((a, b) => b.date - a.date);
    
    // Filter out dates outside of user provided date limits
    log = log.filter(d => d.date >= from && d.date <= to);
    
    // If user provides a limit of activities to show, then 
    // slice off the correct amount from the end of the array
    if(req.query.limit > 0){
      log = log.slice(0, req.query.limit);
    }
    
    // Format the date objects for a nicer display
    log.forEach(function(d){
      d.date = d.date.toDateString();
    });
    
    // Return a json response of the requested information
    res.json({_id: doc._id, username: doc.username, from: from.toDateString(), to: to.toDateString(), count: log.length ,log: log});
  }) 
});


// Get a list of all users in the database
app.route('/api/exercise/users').get(function(req, res){
  
  // Select all users
  userModel.find({}, function(err, doc){
    
    if (err) return console.log("ERROR FINDING ALL USERS");
    
    if(!doc) {return res.json({message: "Database is empty"})}
    
    var users = [];
    
    // Create an array of usernames and corresponding id's
    for (var i = 0; i < doc.length; i++){
      users[i] = {"username": doc[i].username, "userId": doc[i]._id}
    }
    
    // Return this array of objects
    res.send(users);
  })
  
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});