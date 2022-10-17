const Submission = require("../models/submission"),
      taskList = require("../TaskList.json");

exports.checkpoints = async function (req, res) {
  const cur = await Submission.find({uid: req.user.uid}).exec();
  let checkpoints = taskList;
  for (let i of cur)
    for (let i0 = 0; i0 < checkpoints.length; i0++)
      for (let i1 = 0; i1 < checkpoints[i0].points.length; i1++)
        if (checkpoints[i0].points[i1].id === i.checkpointid) {
          checkpoints[i0].points[i1].state = i.state;
          checkpoints[i0].points[i1].uploaded_time = i.uploaded_time;
          checkpoints[i0].points[i1].photo = i.photo;
          checkpoints[i0].points[i1].fail_reason = i.fail_reason;
          if (i.score)
            checkpoints[i0].points[i1].score = i.score +
              (i.bonus ? `(+${i.bonus})` : null);
        }
  let queries = [], points = [];
  for (let i = 0; i < checkpoints.length; i++)
    for (let j = 0; j < checkpoints[i].points.length; j++)
        queries.push(Submission.countDocuments({checkpointid: checkpoints[i].points[j].id, state: "accepted"})),
        points.push({i, j});
  let counts = await Promise.all(queries);
  for (let i = 0; i < queries.length; i++)
    checkpoints[points[i].i].points[points[i].j].passed = counts[i];
  res.json(checkpoints);
}

exports.checkpoint = async function (req, res) {
  let checkpoint;
  for (let i of taskList)
    for (let j of i.points)
      if (j.id === req.params.id)
        checkpoint = j;
  const cur = await Submission.findOne({uid: req.user.uid, checkpointid: req.params.id}).exec();
  if (cur) {
    checkpoint.state = cur.state;
    checkpoint.uploaded_time = cur.uploaded_time;
    checkpoint.photo = cur.photo;
    checkpoint.fail_reason = cur.fail_reason;
    if (cur.score)
      checkpoint.score = cur.score + (cur.bonus ? `(+${cur.bonus})` : null);
  }
  checkpoint.passed =
    await Submission.countDocuments({checkpointid: req.params.id, state: "accepted"}).exec();
  res.json(checkpoint);
}

exports.submit = async function (req, res) {
  const checkpointid = req.body.checkpointid;
  if (!req.files || !req.files.photo)
    return res.status(400).send({ err_msg: "未上传有效文件" });
  const photo = req.files.photo,
    ext = photo.name.match(/\.([^\.]+)$/)[1],
    id = `U${req.user.uid}-P${checkpointid}`,
    now = new Date().toISOString(),
    photoName = id + '-' + now + '.' + ext;
  console.log(now);
  if (ext != "jpg" && ext != "jpeg")
    return res.status(400).send({ err_msg: "无效的文件类型 " + ext });
  if (photo.size > 10 * 1048576)
    return res.status(400).send({ err_msg: "文件大小超过 10MB" });
  photo.mv("./uploads/" + photoName);
  await Submission.deleteMany({ id: id });
  await Submission.create({
    id: id,
    uid: req.user.uid,
    checkpointgroup: checkpointid.split('-')[0],
    checkpointid: checkpointid,
    photo: photoName,
    uploaded: new Date(),
    state: "pending"
  });
  io.emit('update', checkpointid);
  res.send({message: "success"});
}