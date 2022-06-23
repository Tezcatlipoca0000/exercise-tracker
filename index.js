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

// {"username":"Tezcatlipoca","_id":"62b26aa37bd40ffe6e9f4db0"} >> MINE
// {"username":"tezcatlipoca","_id":"629b9c828413530938cc4700"} >> FCC
  
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

// >>

    // You can add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. from and to are dates in yyyy-mm-dd format. limit is an integer of how many logs to send back. TODO

app.get('/api/users/:_id/logs?/:other?', (req, res) => {
  // http://localhost:3000/api/users/62b26aa37bd40ffe6e9f4db0/logs?[2022-1-1][&2022-2-1][&5] MINE
  // https://exercise-tracker.freecodecamp.rocks/api/users/62b33e9e179bfa0908269cc7/logs?[2022-1-1][&2022-2-1][&5] FCC
  console.log('heyyyy', req.params);
  const id = req.params._id;
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

/* v1 

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

  
  //date: {type: Date, default: () => new Date()}
  
  
  
  //date: {
    //type: String, 
    //default: () => {
      //if (this.null) {
        //let x = new Date();
        //return x.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',});
      //}
    //},
  //},
  
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
   
    //You can POST to /api/users with form data username to create a new user. DONE 
    //The returned response from POST /api/users with form data username will be an object with username and _id properties. DONE
  
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
  
    //You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used. TODO
    //The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added. TODO
  
// {"username":"Tezcatlipoca","_id":"62aa8f9834b54526f49620c2"} >> MINE
// {"username":"tezcatlipoca","_id":"629b9c828413530938cc4700"} >> FCC
app.post('/api/users/:_id/exercises', (req, res) => {
  //let dat,
    //x = new Date(req.body.date),
    //y = Date.parse(req.body.date);
    //console.log(dat, x, y);
  //if (req.body.date === '') {
    //dat = undefined;
  //} else {
    //dat = req.body.date;
  //}

  
  //let dat,
    //x = new Date(req.body.date),
    //y = Date.parse(req.body.date);
    //console.log(dat, x, y);
  //if (req.body.date === '') {
    //dat = undefined;
  //} else if (x === 'Invalid Date' || isNan(y)) {
    //dat = null;
  //} else {
    //dat = req.body.date;
  //}
  
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
  
    //You can make a GET request to /api/users to get a list of all users. DONE
    //The GET request to /api/users returns an array. DONE
    //Each element in the array returned from GET /api/users is an object literal containing a user's username and _id. DONE
  
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

*/

/* v2 

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
  date: {type: Date, default: Date.now}

});
const Log = mongoose.model('Log', logSchema);
const userSchema = new Schema({
  username: {type: String, required: true},
  count: Number,
  log: [logSchema],
  //_id: String,
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
   
    //You can POST to /api/users with form data username to create a new user. DONE 
    //The returned response from POST /api/users with form data username will be an object with username and _id properties. DONE
  
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

// >> MAYBE >> change to >>> User.findOneAndUpdate(conditions, update, options, callback)
//  conditions >>> {_id: req.body[':_id']}
// update >>> newLog
// options >>> {new: true, fields: '_id username log'}
// callback >>> (err, doc) => {}
  
    //You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used. DONE
    //The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added. TODO
  
// {"username":"Tezcatlipoca","_id":"62abdac9b52242ec5a512173"} >> MINE
// {"username":"tezcatlipoca","_id":"629b9c828413530938cc4700"} >> FCC
app.post('/api/users/:_id/exercises', (req, res) => {
  let d1 = new Date(req.body.date),
    d2 = Date.parse(req.body.date);
  console.log(d1);
  console.log(d2);
  User.findById(req.body[':_id'], (err, user) => {
     if (err) {
     res.json(err.message);
     } else {
      if (user === null) {
        res.json({'error': 'If the user is not in our database then the user does not exist.'})
      } else {
        const newLog = new Log({
          description: req.body.description,
          duration: req.body.duration,
          date: new Date(req.body.date) //req.body.date === '' ? undefined : req.body.date
        });
        // !!!!! error!!!! >>>>> Cannot read property 'count' of null
        console.log('heyyyy >>> ', user);
        //
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
    }  
  });
});

// >> 
  
    //You can make a GET request to /api/users to get a list of all users. DONE
    //The GET request to /api/users returns an array. DONE
    //Each element in the array returned from GET /api/users is an object literal containing a user's username and _id. DONE
  
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

*/

/* v3

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
const logSchema = new Schema({
  description: {type: String, maxLength: 50, required: true},
  duration: {type: Number, min: 1, required: true},
  date: {type: Date, default: Date.now}

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
   
    //You can POST to /api/users with form data username to create a new user. DONE 
    //The returned response from POST /api/users with form data username will be an object with username and _id properties. DONE
  
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
  
    //You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used. DONE
    //The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added. TODO
  
// {"username":"Tezcatlipoca","_id":"62b12d19393c3008702bcb47"} >> MINE
// {"username":"tezcatlipoca","_id":"629b9c828413530938cc4700"} >> FCC

app.post('/api/users/:_id/exercises', (req, res) => {
  const newLog = new Log({
    description: req.body.description,
    duration: req.body.duration,
    date: new Date(req.body.date) 
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
 
//  User.findById(req.body[':_id'], (err, user) => {
//     if (err) {
//     res.json(err.message);
//     } else {
//      if (user === null) {
//        res.json({'error': 'If the user is not in our database then the user does not exist.'})
//      } else {
//        const newLog = new Log({
//          description: req.body.description,
//          duration: req.body.duration,
//          date: new Date(req.body.date) //req.body.date === '' ? undefined : req.body.date
//        });
        // !!!!! error!!!! >>>>> Cannot read property 'count' of null
//        console.log('heyyyy >>> ', user);
        //
//        user.count++;
//        user.log.push(newLog);
//        user.save((err, data) => {
//          if (err) {
//            console.log('saving error >>>', err);
//            res.json(err.message);
//          } else {
//            let x = data.log[data.count - 1];
//            res.json({
//              _id: data._id, 
//              username: data.username, 
//              date: x.date.toDateString(), //toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',}), 
//              duration: x.duration, 
//              description: x.description
//            });
//          } 
//        });
//      }
//    }  
//  }); 
//});

// >> 
  
    //You can make a GET request to /api/users to get a list of all users. DONE
    //The GET request to /api/users returns an array. DONE
    //Each element in the array returned from GET /api/users is an object literal containing a user's username and _id. DONE
  
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

*/

/* v4 

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
const logSchema = new Schema({
  description: {type: String, maxLength: 50, required: true},
  duration: {type: Number, min: 1, required: true},
  date: {type: String}, // MAYBE change to string
  _id: {select: false},
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
   
    //You can POST to /api/users with form data username to create a new user. DONE 
    //The returned response from POST /api/users with form data username will be an object with username and _id properties. DONE
  
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
  
    //You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used. DONE
    //The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added. TODO
  
// {"username":"Tezcatlipoca","_id":"62b20a9f91e8f7c1837bf859"} >> MINE
// {"username":"tezcatlipoca","_id":"629b9c828413530938cc4700"} >> FCC

app.post('/api/users/:_id/exercises', (req, res) => {
  let d;
  if (req.body.date === '') {
    d = (new Date()).toDateString();
  } else if (new Date(req.body.date) === 'Invalid Date') {
    console.log('invalid d');
    res.json({'error': 'Invalid Date'});
  } else {
    d = (new Date(req.body.date)).toDateString();
  }
  const newLog = new Log({
      description: req.body.description,
      duration: req.body.duration,
      date: d 
    }),
    conditions = {_id: req.params._id},
    update = {$push: {log: newLog}, $inc: {count: 1}},
    options = {
      new: true, 
      //fields: {
      //  username: 1, 
      //  count: 0, 
      //  'log': {$slice: -1},

      //} 
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
      let x = doc.count - 1;
      res.json({
        _id: doc._id, 
        username: doc.username,
        date: doc.log[x].date,
        duration: doc.log[x].duration, 
        description: doc.log[x].description,
      });
    }
  });
});

// >> 
  
    //You can make a GET request to /api/users to get a list of all users. DONE
    //The GET request to /api/users returns an array. DONE
    //Each element in the array returned from GET /api/users is an object literal containing a user's username and _id. DONE
  
app.get('/api/users', (req, res) => {
  User.find({}, 'username _id', (err, docs) => {
    err ? res.json(err.message) : res.json(docs);
  });
});

// >>

    // You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user. DONE
    // A request to a user's log GET /api/users/:_id/logs returns a user object with a count property representing the number of exercises that belong to that user. DONE
    // A GET request to /api/users/:id/logs will return the user object with a log array of all the exercises added. DONE
    // Each item in the log array that is returned from GET /api/users/:id/logs is an object that should have a description, duration, and date properties. DONE
    // The description property of any object in the log array that is returned from GET /api/users/:id/logs should be a string. DONE
    // The duration property of any object in the log array that is returned from GET /api/users/:id/logs should be a number. DONE
    // The date property of any object in the log array that is returned from GET /api/users/:id/logs should be a string.. Use the dateString format of the Date API. TODO
    // You can add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. from and to are dates in yyyy-mm-dd format. limit is an integer of how many logs to send back. TODO

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id;
  User.find({_id: id}, '_id username count log', (err, doc) => {
    if (err) {
      console.log('error finding logs', err);
      res.json(err.message);
    } else if (doc === null) {
      console.log('doc is null', doc, req.params._id);
      res.json({error: 'user not found'});
    } else {
      console.log('user found', doc);
      res.json(doc[0]);
    }
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

*/