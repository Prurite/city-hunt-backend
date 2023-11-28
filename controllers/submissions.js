const Submission = require("../models/submission"),
      Alert = require("../models/alert"),
      taskList = require("../TaskList.json");
const { DateTime } = require("luxon");

exports.submissions = async function(req, res) {
  let filter = {
    state: req.body.states
  };
  if (req.body.checkpointgroups && req.body.checkpointgroups.length)
    checkpointgroup = req.body.checkpointgroups;
  if (req.body.checkpoints && req.body.checkpoints.length)
    filter.checkpointid = req.body.checkpoints;
  if (req.body.uids && req.body.uids.length)
    filter.uid = req.body.uids;
  console.log("Submission filter:");
  console.log(filter);
  const subs = await Submission.find(filter).lean();
  for (let i = 0; i < subs.length; i++)
    subs[i].uploaded_time = DateTime.fromJSDate(subs[i].uploaded).toISO({ includeOffset: false }).replace("T", " ");
  return res.json(subs);
}

exports.edit_submission = async function(req, res) {
  let sub = await Submission.findOne({id: req.body.id});
  let prior_state = sub.state;
  sub.state = req.body.state;
  if (req.body.bonus)
    sub.bonus = req.body.bonus;
  if (req.body.fail_reason)
    sub.fail_reason = req.body.fail_reason;
  await sub.save();
  let related = await Submission.find({checkpointid: sub.checkpointid, state: "accepted"}).sort("uploaded");
  let scores;
  for (let i of taskList)
    for (let j of i.points)
      if (j.id === sub.checkpointid)
        scores = j.scores;
  for (let i = 0; i < related.length; i++) {
    related[i].score = i < scores.length ? scores[i] : scores[scores.length - 1];
    await related[i].save();
  }
  // An array mapping the state code to the Chinese name
  const state_names = {
    pending: "待审核",
    accepted: "已通过",
    denied: "未通过"
  }
  // Create an alert notifying the user the status change
  await Alert.create({
    uid: sub.uid,
    date: new Date(),
    content: `您的 ${sub.checkpointid} 提交状态已由 ${state_names[prior_state]} 更新为 ${state_names[sub.state]}`
  });
  io.emit("update", sub.checkpointid);
  res.send({message: "success"});
}