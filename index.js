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

// >> a date validator function
function validator (d) {
  console.log('validator-input >>>>', d)
  
  if (new Date(d) !== 'Invalid Date' && !isNan(Date.parse(d))) {
    console.log('validator-valid')
    return true
  } else {
    return false
  }
}

// >> define schemas and models
const logSchema = new Schema({
  description: {type: String, maxLength: 50, required: true},
  duration: {type: Number, min: 1, required: true},
  date: {type: Date, default: Date.now, validate: validator}

  /*
  date: {type: Date, default: () => new Date()}
  */
  
  /*
  date: {
    type: String, 
    default: () => {
      //if (this.null) {
        let x = new Date();
        return x.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',});
      //}
    },
  },
  */
});
const Log = mongoose.model('Log', logSchema);
const userSchema = new Schema({
  username: {type: String, required: true},
  count: Number,
  log: [logSchema],
});
const User = mongoose.model('User', userSchema);


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
// {"username":"Tezcatlipoca","_id":"62aa8f9834b54526f49620c2"} >> MINE
// {"username":"tezcatlipoca","_id":"629b9c828413530938cc4700"} >> FCC
app.post('/api/users/:_id/exercises', (req, res) => {
  /*let dat,
    x = new Date(req.body.date),
    y = Date.parse(req.body.date);
    console.log(dat, x, y);
  if (req.body.date === '') {
    dat = undefined;
  } else {
    dat = req.body.date;
  }*/

  /*
  let dat,
    x = new Date(req.body.date),
    y = Date.parse(req.body.date);
    console.log(dat, x, y);
  if (req.body.date === '') {
    dat = undefined;
  } else if (x === 'Invalid Date' || isNan(y)) {
    dat = null;
  } else {
    dat = req.body.date;
  }
  */
  //let d = new Date(req.body.date);
  console.log('testttt', new Date(req.body.date));
  User.findById(req.body[':_id'], (err, user) => {
     if (err) {
     res.json(err.message);
     } else {
      const newLog = new Log({
        description: req.body.description,
        duration: req.body.duration,
        date: new Date(req.body.date) //req.body.date === '' ? undefined : req.body.date
      });
      user.count++;
      user.log.push(newLog);
      user.save((err, data) => {
        if (err) {
          console.log('saving error >>>', err);
          res.json(err.message);
        } else {
          let x = data.log[data.count - 1];
          res.json({
            _id: data._id, 
            username: data.username, 
            date: x.date.toDateString(), //toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',}), 
            duration: x.duration, 
            description: x.description
          });
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