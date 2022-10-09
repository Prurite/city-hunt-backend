const jwt = require('jsonwebtoken');
const config = require("./config.json");
const User = require("./models/user");

function generateAccessToken(uid) {
  return jwt.sign(uid, config.secret, { expiresIn: '3600s' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token)
    return res.status(401).json({err_msg: "请登录"});
  jwt.verify(token, config.secret, (err, uid) => {
    console.log(err);
    if (err)
      return res.status(403).json({err_msg: "无效的 token，请重新登录"});
    req.user.uid = uid;
    User.findOne({ uid: uid }, (err, user) => {
      if (err)
        return res.status(500).send(err);
      req.user.type = user.type;
      next();
    })
  });
}