const express = require("express"),
      router = express.Router();
import { authenticateToken as auth } from "../auth";

const checkpoints = require("../controllers/checkpoints"),
      submissions = require("../controllers/submissions"),
      user = require("../controllers/user");

router.get("/checkpoints", auth, checkpoints.checkpoints);

router.get("/checkpoint/:id", auth, checkpoints.checkpoint);

router.post("/submit/:checkpointid", auth, checkpoints.submit);

router.post("/submissions/query", auth, submissions.submissions);

router.post("/submission/modify", auth, submissions.edit_submission);

router.post("/login", user.login);

router.post("/changepassword", user.changepassword);

module.exports = router;