'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const cors = require('cors'); 
const path = require('path');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const routes = require('./routes.js');
const auth = require('./routes.js');
const passport = require('passport');
// const { ObjectID } = require('mongodb');
// const LocalStrategy = require('passport-local');
// const bcrypt = require('bcrypt');

const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });
const cookieParser = require('cookie-parser');

app.use(cors({ origin: '*' }));
fccTesting(app); //For FCC testing purposes


app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');
app.set('views', './views/pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: store
}));
passport.initialize();
passport.session()

// app.route('/').get((req, res) => {
  // res.render('index', { title: 'Hello', message: 'Please log in' });
// });

// passport.serializeUser((user, done) => {
//   done(null, user._id);
// });

// passport.deserializeUser((id, done) => {
//   // myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
//   done(null, null);
//   // });
// });
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');
  routes(app, myDataBase);
  auth(app, myDataBase);

  let currentUsers = 0
  io.on('connection', socket => {
    ++currentUsers;
    io.emit('user count', currentUsers);
    console.log('A user has connected');

    socket.on('disconnect', () => {
      console.log('A user has disconnected');
      --currentUsers;
      io.emit('user count', currentUsers);
    });
  });
  // Be sure to change the title
//   app.route('/').get((req, res) => {
//     // Change the response to render the Pug template
//     res.render('index', {
//       title: 'Connected to Database',
//       message: 'Please login',
//       showLogin: true,
//       showRegistration: true
//     });
//   });

//   app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
//     res.redirect('/profile');
//   });

//   app.route('/profile').get(ensureAuthenticated, (req,res) => {
//     res.render('profile', { username: req.user.username });
//   });

//   app.route('/logout')
//   .get((req, res) => {
//     req.logout();
//     res.redirect('/');
// });

// app.route('/register')
//   .post((req, res, next) => {
//     const hash = bcrypt.hashSync(req.body.password, 12);
//     myDataBase.findOne({ username: hash }, (err, user) => {
//       if (err) {
//         next(err);
//       } else if (user) {
//         res.redirect('/');
//       } else {
//         myDataBase.insertOne({
//           username: req.body.username,
//           password: hash
//         },
//           (err, doc) => {
//             if (err) {
//               res.redirect('/');
//             } else {
//               // The inserted document is held within
//               // the ops property of the doc
//               next(null, doc.ops[0]);
//             }
//           }
//         )
//       }
//     })
//   },
//     passport.authenticate('local', { failureRedirect: '/' }),
//     (req, res, next) => {
//       res.redirect('/profile');
//     }
//   );

// app.use((req, res, next) => {
//   res.status(404)
//     .type('text')
//     .send('Not Found');
// });

// passport.use(new LocalStrategy((username, password, done) => {
//   myDataBase.findOne({ username: username }, (err, user) => {
//     console.log(`User ${username} attempted to log in.`);
//     if (err) return done(err);
//     if (!user) return done(null, false);
//     // if (password !== user.password) return done(null, false);
//     if (!bcrypt.compareSync(password, user.password)) { 
//      return done(null, false);
//     }
//     return done(null, user);
//   });
// }));

//   // Serialization and deserialization here...
//   passport.serializeUser((user, done) => {
//     done(null, user._id);
//   });

//   passport.deserializeUser((id, done) => {
//     myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
//       done(null, doc);
//     });
//   });

  // Be sure to add this...
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});
// app.listen out here...

// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.redirect('/');
// };
function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
