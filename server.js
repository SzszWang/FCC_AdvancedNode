'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const cors = require('cors'); 
const path = require('path');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use(cors());

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views/pug'));

app.route('/').get((req, res) => {
  res.render('index', {
    title: 'FCC Advanced Node and Express',
    message: 'Pug is working!',
    showLogin: false,
    showRegistration: false,
    showSocialAuth: false
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
