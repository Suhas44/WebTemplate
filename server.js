const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

var MongoClient = require('mongodb').MongoClient;
var url = "<MONGODB_URL>";

app.use(express.static('public'));
app.use('/', express.static(path.join(__dirname, 'public/pages')));
app.use(bodyParser.json());

// Sending registering users to MongoDB
app.post('/register', async(req, res) => {
  const duplicate = await readAtlasUser(req.body.username).then(r => {
    if (r[0] != null) {
      res.json({status: false, message: 'Username already exists'});
    } else {
      req.body.portfolios = {};
      writeToAtlas(req.body);
      res.json({status: true, message: 'User registered'});
    }
  });
});

// Loading users from MongoDB
app.get('/list', async(req, res) => {
  readAtlasAll().then(r => {
    res.json(JSON.stringify(r));
   }).catch(err => {
     console.log(err);
   });
});

// Authenticating a User from Login
app.post('/auth', async(req, res) => {
  var user = req.body;
  console.log(user);
  const authenticated = await authenticateUser(user.username, user.password).then(r => {
    return (r[0]) ? res.json({status: true, message: 'User authenticated', user: r[1]}) : res.json({status: false, message: 'User not authenticated'});
  });
});

app.listen(9999, () => {
  console.log('Server up at port 9999');
});

async function writeToAtlas(obj) {
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("<DB_NAME>");
      var collection = dbo.collection("<COLLECTION_NAME>");
      collection.insertOne(obj, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        db.close();
      });
    });
}

async function readAtlasAll() {
  const db = await MongoClient.connect(url);
  const dbo = db.db("<DB_NAME>");
  const c = dbo.collection("<COLLECTION_NAME>");
  const r = await c.find({}).toArray();
  return r;
}

async function readAtlasUser(username) {
  const db = await MongoClient.connect(url);
  const dbo = db.db("<DB_NAME>");
  const c = dbo.collection("<COLLECTION_NAME>");
  const r = await c.find({"username" : username}).toArray();
  if (r.length == 0) {
    r.push(null);
  }
  return r;
}

async function authenticateUser(username, password) {
  const user = await readAtlasUser(username).then(r => {
    return r[0];
  });
  const authenticated = (user != null) ? (user.password == password) : false;
  return [authenticated, user];
};