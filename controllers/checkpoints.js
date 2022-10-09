const { isObject } = require("formik");
const Submission = require("../models/submission"),
      config = require("../config.json"),
      taskList = require("../TaskList.json");

exports.checkpoints = async function (req, res) {
  const cur = await Submission.find({uid: req.user.uid}).exec();
  let checkpoints = taskList;
  for (let i of cur)
    for (let i0 = 0; i0 < checkpoints.length; i0++)
      for (let i1 = 0; i1 < checkpoints[i0].points.length; i1++)
        if (checkpoints[i0].points[i1].id === i.checkpointid) {
          checkpoints[i0].points[i1].status = i.status;
          checkpoints[i0].points[i1].uploaded_time = i.uploaded_time;
          checkpoints[i0].points[i1].photo = i.photo;
          checkpoints[i0].points[i1].fail_reason = i.fail_reason;
          if (i.score)
            checkpoints[i0].points[i1].score = i.score +
              (i.bonus ? `(+${i.bonus})` : null);
        }
  let queries = [];
  for (let i = 0; i < checkpoints.length; i++)
    for (let j = 0; j < checkpoints[i].points.length; j++)
        queries.push(Submission.countDocuments({checkpointid: `${i+1}-${j+1}`, state: "accepted"},
          (err, count) => {checkpoints[i].points[j].passed = count;}));
  await Promise.all(queries);
  res.json(checkpoints);
}

exports.checkpoint = async function (req, res) {
  let checkpoint;
  for (let i of taskList)
    for (let j of i.points)
      if (j.id === req.params.id)
        checkpoint = j;
  const cur = await Submission.findOne({uid: req.user.uid, checkpointid: req.params.id}).exec();
  checkpoint.status = cur.status;
  checkpoint.uploaded_time = cur.uploaded_time;
  checkpoint.photo = cur.photo;
  checkpoint.fail_reason = cur.fail_reason;
  if (cur.score)
    checkpoint.score = cur.score + (cur.bonus ? `(+${cur.bonus})` : null);
  checkpoint.passed =
    await Submission.countDocuments({checkpointid: req.params.id, state: "accepted"}).exec();
  res.json(checkpoint);
}

exports.submit = async function (err, req, res, next) {
  try {
    if (!req.files || !req.files.photo)
      return res.status(400).send({ err_msg: "未上传有效文件" });
    const photo = req.files.photo,
      ext = photo.name.match(/\.([^\.]+)$/)[1],
      id = `U${req.user.uid}-P${req.params.checkpointid}`,
      photoName = id + ext;
    if (ext != "jpg" && ext != "png")
      return res.status(400).send({ err_msg: "无效的文件类型" });
    if (photo.size > 10 * 1048576)
      return res.status(400).send({ err_msg: "文件大小超过 10MB" });
    photo.mv("./uploads/" + photoName);
    await Submission.deleteMany({ id: id });
    await Submission.create({
      id: id,
      uid: req.user.uid,
      checkpointgroup: req.params.checkpointid.split('-')[0],
      checkpointid: req.params.checkpointid,
      photo: photoName,
      state: "pending"
    });
    io.emit('update', req.params.checkpointid);
  } catch (err) {
    return next(err);
  }
}