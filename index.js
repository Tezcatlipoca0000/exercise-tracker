const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();


// >> basic config
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI;
const mongoOpt = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};
const Schema = mongoose.Schema;

// >> conect to db
mongoose.connect(mongoUri, mongoOpt).then(
  () => console.log('connection successful'),
  err => console.log('connecting error >>>>>', err)
);
mongoose.connection.on('error', err => console.log('connection error >>>>> ', err));

// >> define schemas and models
const userSchema = new Schema({
  username: {type: String, required: true},
  count: Number,
  log: [Schema.Types.Mixed],
});
const User = mongoose.model('User', userSchema);
const logSchema = new Schema({
  description: {type: String, maxLength: 50, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: Date.now},
});
const Log = mongoose.model('Log', logSchema);


app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// >> basic config
app.use(bodyParser.urlencoded({extended: false}));

// >> 
  /* 
    You can POST to /api/users with form data username to create a new user. DONE 
    The returned response from POST /api/users with form data username will be an object with username and _id properties. DONE
  */
app.post('/api/users/', (req, res) => {
  const user = new User({
      username: req.body.username,
      count: 0,
      log: []
    });
  user.save((err, data) => {
    err ? res.json(err.message) : res.json({username: data.username, _id: data._id});
  });
});

// >> 
  /*
    You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used. TODO
    The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added. TODO
  */
app.post('/api/users/:_id/exercises', (req, res) => {
  let id = req.body[':_id'],
    desc = req.body.description,
    dur = req.body.duration,
    dat = req.body.date;

  if (new Date(dat) === 'Invalid Date' || isNaN(new Date(dat))) {
    //let today = new Date();
    //console.log('test1', today);
    //dat = today.toDateString();
    dat = new Date();
    console.log('test2', dat);
  } /*else {
    console.log('test3', dat, typeof dat);
    let x = new Date(dat);
    dat = x;
    console.log('test3.2', dat, typeof dat);
  }*/
  User.findById(id, (err, user) => {
     if (err) {
     res.json(err.message);
     } else {
      // maybe do use the log schema to capture validation on save and throw err
      /*const newLog = {
        description: desc,
        duration: dur,
        date: dat
      };*/
      console.log('test4', dat);
      const newLog = new Log({
        description: desc,
        duration: dur,
        date: dat
      });
      /*const excercise = {
        username: user.username,
        description: desc,
        duration: dur,
        date: dat,
        _id: id,
      };*/
      user.count++;
      user.log.push(newLog);
      user.save((err, data) => {
        if (err) {
          console.log('saving err >>', err);
          res.json(err);
        } else {
          console.log('changes saved >>>', data);
          let x = data.count;
          res.json({username: data.username, _id: data.id, description: data.log[x-1].description, duration: data.log[x-1].duration, date: (data.log[x-1].date).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})});
        }
      });
     }  
  });
});

// >> 
  /*
    You can make a GET request to /api/users to get a list of all users. DONE
    The GET request to /api/users returns an array. DONE
    Each element in the array returned from GET /api/users is an object literal containing a user's username and _id. DONE
  */
app.get('/api/users', (req, res) => {
  User.find({}, 'username _id', (err, docs) => {
    err ? res.json(err.message) : res.json(docs);
  });
});

// >>
app.get('/api/users/:_id', (req, res) => {
  res.end();
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});


// >>
//const uniqueID = () => {
//  const time = (new Date().getTime() / 1000 | 0).toString(16);
//  const suffix = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
//  return `${time}${suffix}`;
//};