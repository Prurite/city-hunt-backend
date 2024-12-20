const User = require("../models/user");
const {generateAccessToken} = require("../auth");

exports.login = async function (req, res) {
  const user = await User.findOne({uid: req.body.uid, password: req.body.password});
  if (user) {
    token = generateAccessToken(user.uid);
    res.json({ uid: user.uid, type: user.type, token });
  }
  else
    res.status(403).send({err_msg: "无效的用户名或密码"});
}

exports.changepassword = async function (req, res) {
  let user;
  if (req.user && req.user.type === "admin")
    user = await User.findOne({uid: req.body.uid});
  else
    user = await User.findOne({uid: req.body.uid, password: req.body.old_password});
  if (user) {
    if (req.body.new_password.length < 8)
      return res.status(400).send({err_msg: "密码过短"});
    user.password = req.body.new_password;
    user.save();
    res.send({message: "success"});
  }
  else
    res.status(403).send({err_msg: "无效的用户名或密码"});
}