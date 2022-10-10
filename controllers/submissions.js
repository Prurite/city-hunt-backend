const Submission = require("../models/submission"),
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
  const subs = await Submission.find(filter).lean().exec();
  for (let i = 0; i < subs.length; i++)
    subs[i].uploaded_time = DateTime.fromJSDate(subs[i].uploaded).toISO({ includeOffset: false }).replace("T", " ");
  return res.json(subs);
}

exports.edit_submission = async function(req, res) {
  let sub = await Submission.findOne({id: req.body.id}).exec();
  sub.state = req.body.state;
  if (req.body.bonus)
    sub.bonus = req.body.bonus;
  if (req.body.fail_reason)
    sub.fail_reason = req.body.fail_reason;
  await sub.save();
  let related = await Submission.find({checkpointid: sub.checkpointid, state: "accepted"}).sort("uploaded").exec();
  let scores;
  for (let i of taskList)
    for (let j of i.points)
      if (j.id === sub.checkpointid)
        scores = j.scores;
  for (let i = 0; i < related.length; i++) {
    related[i].score = i < scores.length ? scores[i] : scores[scores.length - 1];
    await related[i].save();
  }
  io.emit("update", sub.checkpointid);
  res.send({message: "success"});
}