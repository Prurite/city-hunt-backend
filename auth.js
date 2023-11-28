const jwt = require("jsonwebtoken");
const config = require("./config.json");
const User = require("./models/user");

exports.generateAccessToken = function (uid) {
  return jwt.sign( {uid: uid}, config.secret, { expiresIn: 3600 });
}

exports.authenticateToken = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({err_msg: "请登录"});
  jwt.verify(token, config.secret, (err, data) => {
    if (err)
      return res.status(403).json({err_msg: "无效或已过期的 token，请退出后重新登录"});
    req.user = {};
    req.user.uid = data.uid;
    User.findOne({ uid: data.uid })
      .then(user => {
        if (!user)
          return res.status(403).json({err_msg: "用户不存在"});
        req.user = user;
        next();
      })
      .catch(err => {
        console.log(err);
        return res.status(500).json({err_msg: "服务器错误"});
      });
    });
}