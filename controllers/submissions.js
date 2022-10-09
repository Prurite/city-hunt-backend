const Submission = require("../models/submission"),
  taskList = require("../TaskList.json");

exports.submissions = async function(req, res) {
  let filter = {
    checkpointgroup: req.body.checkpointgroups,
    state: req.body.states
  };
  if (req.body.checkpoints && req.body.checkpoints.length)
    filter.checkpointid = req.body.checkpoints;
  if (req.body.uids && req.body.uids.length)
    filter.uid = req.body.uids;
  return res.json(await Submission.find(filter).exec());
}

exports.edit_submission = async function(req, res) {
  let sub = await Submission.findOne({id: req.body.id}).exec();
  sub.state = req.body.state;
  if (req.body.bonus)
    sub.bonus = req.body.bonus;
  if (req.body.fail_reason)
    sub.fail_reason = req.body.fail_reason;
  await sub.save();
  let related = await Submission.find({checkpointid: sub.checkpointid, state: "accepted"}).sort('uploaded').exec();
  let scores;
  for (let i of taskList)
    for (let j of i.points)
      if (j.id === sub.checkpointid)
        scores = j.scores;
  for (let i = 0; i < related.length; i++) {
    related[i].score = i < scores.length ? scores[i] : scores[scores.length - 1];
    await related[i].save();
  }
  io.emit('update', sub.checkpointid);
}