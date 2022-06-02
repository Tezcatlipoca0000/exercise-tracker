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
  username: String,
  count: Number,
  log: [Schema.Types.Mixed],
});
const User = mongoose.model('User', userSchema);
const logSchema = new Schema({
  description: {type: String, maxLength: 50},
  duration: Number,
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
    err 
    ? console.log('saving err >>>> ', err) 
    : (
      console.log('user saved >>>> ', data), 
      res.json({username: data.username, _id: data._id})
      );
  });
});

// >> 
  /*
    You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used. TODO
    The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added. TODO
  */
app.post('/api/users/:_id/exercises', (req, res) => {
  console.log(req.body);
  let id = req.body[':_id'],
    desc = req.body.description,
    dur = req.body.duration,
    dat = req.body.date;
  console.log('the variables >>> ', id, desc, dur, dat);
  const excercise = new Log({
    description: desc,
    duration: dur,
    date: dat,
  });
  console.log('the excercise obj. >>>> ', excercise);
  /*excercise.save((err, data) => {
    err
    ? console.log('saving err >>> ', err)
    : (
        console.log('log saved >>>', data),
        res.json(data);
      );
  });*/

  // find user first then modify log.
  User.findById(id, (err, user) => {
    err
    ? console.log('finding err >>>> ', err)
    : (
      console.log('user found >>>> ', user, 'just the user.log >>>> ', user.log),
      user.log.push(excercise), //maybe not make a log schema nor model just an object dat = req.body.date === '' ? date.now : date.now(req.body.date)
      console.log('pushing worked? >>>> ', user)
      )
  });
  // now save changes 
  res.end();
});

// >> 
  /*
    You can make a GET request to /api/users to get a list of all users. DONE
    The GET request to /api/users returns an array. DONE
    Each element in the array returned from GET /api/users is an object literal containing a user's username and _id. DONE
  */
app.get('/api/users', (req, res) => {
  User.find({}, 'username _id', (err, docs) => {
    err
    ? console.log('finding err >>>>> ', err)
    : (
      console.log('all docs >>>>> ', docs),
      res.json(docs)
      );
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