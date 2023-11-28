const express = require("express"),
      path = require("path"),
      router = express.Router();
const { authenticateToken } = require("../auth"),
      auth = authenticateToken;

const checkpoints = require("../controllers/checkpoints"),
      submissions = require("../controllers/submissions"),
      user = require("../controllers/user"),
      alerts = require("../controllers/alerts");

function authAdmin(req, res, next) {
  if (!req.user.type || req.user.type != "admin") 
    return res.status(403).send({err_msg: "您不是管理员"});
  next();
}

router.get("/checkpoints", auth, checkpoints.checkpoints);

router.get("/checkpoint/:id", auth, checkpoints.checkpoint);

router.post("/submit", auth, checkpoints.submit);

router.post("/submissions/query", [auth, authAdmin], submissions.submissions);

router.post("/submission/modify", [auth, authAdmin], submissions.edit_submission);

router.post("/login", user.login);

router.post("/changepassword", user.changepassword);

router.get("/alerts", auth, alerts.alerts);

router.post("/alert/delete", auth, alerts.delete);

module.exports = router;