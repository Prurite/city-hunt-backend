const app = require('express')(),
      http = require('http').Server(app),
      io = require('socket.io')(http),
      fileUpload = require('express-fileupload');

const config = require("./config.json");
let newPoints = {};

/* app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}); */

app.use(fileUpload({ createParentPath: true }));
app.use(require('express').json());

app.get('/', (req, res) => {
  // res.sendFile(__dirname + '/index.html');
  res.send("Hello");
});

io.on('connection', (socket) => {
  console.log("a user connected");
});

app.get('/update/:id/:state', (req, res) => {
  const id = req.params.id, state = req.params.state;
  const list = require("./TaskList_example.json");
  for (const i of list)
    for (let j of i.points)
      if (j.id === id) {
        j.state = state != "null" ? state : null;
        newPoints[j.id] = j;
        io.emit('update', j.id);
        res.json(j);
        return;
      }
  res.send("not found");
})

app.get('/checkpoint/:id', (req, res) => {
  res.json(newPoints[req.params.id]);
})

app.get('/checkpoints', (req, res) => {
  res.json(require("./TaskList_example.json"));
});

app.post('/submissions/query', (req, res) => {
  res.json(require("./SubList.json"));
})

app.post('/submissions/modify', (req, res) => {
  console.log(req.body);
  res.send("OK");
})

app.post('/login', (req, res) => {
  if (req.body.uid !== "1")
    // res.json({err_msg: "密码错误"});
    res.status(403).json({err_msg: "密码错误"});
  else
    res.json({ uid: "1", token: "token", type: "admin" });
});

app.post('/changepassword', (req, res) => {
  if (req.body.old_password !== "123")
    res.status(403).json({err_msg: "密码错误"});
  else
    res.json({ message: "success" });
});

app.post('/submit/:id', async (req, res) => {
  try {
    if (!req.files)
      res.send({status: false, message: "No file uploaded"});
    else if (!req.params.id)
      res.send({status: false, message: "Invalid id"});
    else {
      let id = req.params.id;
      let file = req.files.photo;
      console.log(id + " " + file.name);
      file.mv('./uploads/' + id + '.' + file.name.split('.')[1]);
      res.send({status: true, message: "Uploaded"});
    }
  } catch (err) {
    res.status(500).send(err.toString());
  }
});
  
var port = parseInt(config.port);

http.listen(port, () => {
  console.log("Server running at http://localhost:" + port + "/");
})