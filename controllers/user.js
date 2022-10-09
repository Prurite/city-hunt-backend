const User = require("../models/user");
import generateAccessToken from "../auth";

exports.login = async function (req, res) {
  const user = User.findOne({uid: req.body.uid, password: req.body.password});
  if (user) {
    token = generateAccessToken(user.uid);
    res.json({ uid: user.uid, type: user.type, token });
  }
  else
    res.status(403).send({err_msg: "无效的用户名或密码"});
}

exports.changepassword = async function (req, res) {
  let user = User.findOne({uid: req.body.uid, password: req.body.old_password});
  if (user) {
    user.password = req.body.new_password;
    user.save();
    res.send({message: "success"});
  }
  else
    res.status(403).send({err_msg: "无效的用户名或密码"});
}