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

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// >> basic config
app.use(bodyParser.urlencoded({extended: false}));

// >> define schemas and models
const logSchema = new Schema({
  description: {type: String, maxLength: 50, required: true},
  duration: {type: Number, min: 1, required: true},
  date: {type: Date, default: Date.now},
  _id: {select: false},
});
const Log = mongoose.model('Log', logSchema);
const userSchema = new Schema({
  username: {type: String, required: true},
  count: Number,
  log: [logSchema],
});
const User = mongoose.model('User', userSchema);

// >> conect to db
mongoose.connect(mongoUri, mongoOpt).then(
  () => console.log('connection successful'),
  err => console.log('connecting error >>>>>', err)
);
mongoose.connection.on('error', err => console.log('connection error >>>>> ', err));
  
app.post('/api/users/', (req, res) => {
  const user = new User({
      username: req.body.username,
      count: 0,
      log: []
    });
  user.save((err, data) => {
    err ? res.json(err.message) : (console.log('doc saved!!', data), res.json({username: data.username, _id: data._id}));
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const dateInput = req.body.date,
    re = /\d+/g;
  let formatedDate,
    y,
    m,
    d;
  if (new Date(dateInput) != 'Invalid Date') {
    let x = dateInput.match(re);
    y = x[0];
    m = x[1][0] === '0' ? `${x[1][1]}` : x[1];
    d = x[2][0] === '0' ? `${x[2][1]}` : x[2];
    formatedDate = new Date(`${y}-${m}-${d}`);
  } else {
    formatedDate = new Date(dateInput);
  }
  const newLog = new Log({
      description: req.body.description,
      duration: req.body.duration,
      date: formatedDate 
    }),
    conditions = {_id: req.params._id},
    update = {$push: {log: newLog}, $inc: {count: 1}},
    options = {
      new: true, 
      fields: {
        username: 1, 
        count: 0, 
        'log': {$slice: -1},
      } 
    }; 
  User.findOneAndUpdate(conditions, update, options, (err, doc) =>{
    if (err) {
      console.log('error found!', err);
      res.json(err.message);
    } else if (doc === null) {
      console.log('doc is null', doc, 'id is>>', req.params._id, 'the req.body2', req.body);
      res.json({'error': 'User does not exist'});
    } else {
      console.log('document updated!', doc);
      res.json({
        _id: doc._id, 
        username: doc.username,
        date: doc.log[0].date.toDateString(),
        duration: doc.log[0].duration, 
        description: doc.log[0].description,
      });
    }
  });
});
  
app.get('/api/users', (req, res) => {
  User.find({}, 'username _id', (err, docs) => {
    err ? res.json(err.message) : res.json(docs);
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id,
    {from, to, limit} = req.query;
  User.find({_id: id}, '_id username count log', (err, doc) => {
    if (err) {
      console.log('error finding logs', err);
      res.json(err.message);
    } else if (doc === null) {
      console.log('doc is null', doc, req.params._id);
      res.json({error: 'user not found'});
    } else {
      console.log('user found', doc[0]);
      let x = doc[0].log.map((n) => {
        return {
          description: n.description, 
          duration: n.duration,
          date: n.date.toDateString()
        }
      });
      if (from || to) {
        let a = from === undefined ? 0 : from,
          b = to === undefined ? new Date() : to;
        x = x.filter((d) => ( 
          Date.parse(d.date) >= Date.parse(a) 
          && Date.parse(d.date) <= Date.parse(b) 
        ) );
      }
      if (limit) {
        x = x.filter((d, i) => (i < limit));
      }
      let r = {
        _id: doc[0]._id,
        username: doc[0].username,
        count: doc[0].count,
        log: x
      };
      res.json(r);
    }
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});