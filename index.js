const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();


// >>
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI;
const mongoOpt = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};
const Schema = mongoose.Schema;

// >>
mongoose.connect(mongoUri, mongoOpt).then(
  () => console.log('connection successful'),
  err => console.log('connecting error >>>>>', err)
);
mongoose.connection.on('error', err => console.log('connection error >>>>> ', err));

// >>
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


// >>
app.use(bodyParser.urlencoded({extended: false}));

// >>
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
      console.log('data saved >>>> ', data), 
      res.json({username: data.username, _id: data._id})
      );
  });
});

// >>
app.post('/api/users/:_id/exercises', (req, res) => {

});

// >>
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

});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


// >>
//const uniqueID = () => {
//  const time = (new Date().getTime() / 1000 | 0).toString(16);
//  const suffix = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
//  return `${time}${suffix}`;
//};