var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var http = require('http');
var fs = require('fs');
var url = require('url');
var MongoClient = require('mongodb').MongoClient;
var basicAuth = require('basic-auth-connect');

var auth = basicAuth(function(user, pass) {
  return((user ==='cs360')&&(pass === 'test'));
});

var app = express();
app.use(bodyParser.json());

var options = {
    host: '127.0.0.1',
    key: fs.readFileSync('ssl/server.key'),
    cert: fs.readFileSync('ssl/server.crt')
};

http.createServer(app).listen(80);

https.createServer(options, app).listen(443);

app.get('/', function (req, res) {
  res.send("Get Index");
});

app.use('/', express.static('./html', {maxAge: 60*60*1000}));
app.get('/getcity', function (req, res){
  console.log("In getcity route");
  res.json([{city:"Price"},{city:"Provo"}]);
});

app.get('/comment', function (req, res) {
  console.log("in GET comment route");
  MongoClient.connect("mongodb://localhost/weather",function(err, db){
    if(err) throw err;
    db.collection("comments", function(err, comments){
      if(err) throw err;
      comments.find(function(err, items){
	items.toArray(function(err, itemArr){
	  console.log("Document Array: ");
	  console.log(itemArr);
	  res.status(200);
	  res.json(itemArr);
  	});
      });
    });
  });
});

app.post('/comment', auth, function (req, res) {
  console.log("in POST comment route");
  console.log(req.user);
  console.log("Remote User");
  console.log(req.remoteUser);
  var jsonData = "";
  jsonData = [{Name: req.body.Name, Comment: req.body.Comment}];
  //var reqObj = JSON.parse(jsonData);
  req.on('data', function(chunk) {
    jsonData += chunk;
  });
  //req.on('end',function(){
    //var reqObj = JSON.parse(jsonData);
 
    console.log(req.body);
    MongoClient.connect("mongodb://localhost/weather", function(err, db) {
      if(err){
        console.log('There was an ERROR');
        throw err;
      }
      db.collection('comments').insert(jsonData,function(err,records) {
        console.log("Record added as " + records[0]._id);
      });
    });
  //});
  res.status(200);
  res.end();
});

