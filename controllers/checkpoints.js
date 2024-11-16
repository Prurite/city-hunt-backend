const Submission = require("../models/submission"),
      Alert = require("../models/alert"),
      taskList = require("../TaskList.json");

const sharp = require('sharp'); // Image processing library
const fs = require('fs');
const path = require('path');

// Returns the list of checkpoints with submissions merged in
exports.checkpoints = async function (req, res) {
  // Get all submissions of the user
  const userSubmissions = await Submission.find({ uid: req.user.uid }).lean();

  // Create a copy of the taskList and merge submissions into the tasklist
  const copyTaskList = JSON.parse(JSON.stringify(taskList));
  const updatedCheckpoints = copyTaskList.map(checkpointGroup => {
    checkpointGroup.points = checkpointGroup.points.map(point => {
      const submission = userSubmissions.find(sub => sub.checkpointid === point.id);
      if (submission) {
        point.state = submission.state;
        point.uploaded_time = submission.uploaded_time;
        point.photo = submission.photo;
        point.fail_reason = submission.fail_reason;
        if (submission.score)
          point.score = submission.score + (submission.bonus ? `(+${submission.bonus})` : '');
      }
      point.passed = 0;
      return point;
    });
    return checkpointGroup;
  });

  // Count the number of accepted submissions for each checkpoint
  // and merge the count into checkpoint by the exact point id
  const acceptedSubmissions = await Submission.aggregate([
    { $match: { state: "accepted" } },
    { $group: { _id: "$checkpointid", count: { $sum: 1 } } }
  ]);
  acceptedSubmissions.forEach(sub => {
    const checkpoint = updatedCheckpoints.flatMap(checklist => checklist.points)
      .find(point => point.id === sub._id);
    if (checkpoint)
      checkpoint.passed = sub.count;
  });
  
  res.json(updatedCheckpoints);
}

// Returns a single checkpoint with submission merged in
exports.checkpoint = async function (req, res) {
  // Find the requested checkpoint
  const checkpointId = req.params.id;
  const checkpoint = taskList.flatMap(checklist => checklist.points)
    .find(point => point.id === checkpointId);
  if (!checkpoint) {
    res.status(404).json({ error: 'Checkpoint not found' });
    return;
  }

  // Merge the submission in
  const userSubmission = await Submission.findOne({
    uid: req.user.uid,
    checkpointid: req.params.id
  });
  if (userSubmission) {
    checkpoint.state = userSubmission.state;
    checkpoint.uploaded_time = userSubmission.uploaded_time;
    checkpoint.photo = userSubmission.photo;
    checkpoint.fail_reason = userSubmission.fail_reason;
    if (userSubmission.score)
      checkpoint.score = userSubmission.score + (userSubmission.bonus ? `(+${userSubmission.bonus})` : null);
  }

  // Count the accepted submissions
  checkpoint.passed = await Submission.countDocuments({
    checkpointid: req.params.id,
    state: "accepted"
  });

  res.json(checkpoint);
}


exports.submit = async function (req, res) {
  const checkpointid = req.body.checkpointid;

  // Check if the photo is included in the request
  if (!req.files || !req.files.photo)
    return res.status(400).send({ err_msg: "未上传有效文件" });

  const photo = req.files.photo,
        ext = photo.name.match(/\.([^\.]+)$/)[1].toLowerCase(),
        id = `U${req.user.uid}-P${checkpointid}`,
        now = new Date().toISOString().replace(/:/g, '-'), // Replace colons for valid filenames
        photoName = id + '-' + now + '.jpg', // Save as JPEG

        uploadDir = './uploads/',
        tempPath = path.join(uploadDir, 'temp-' + photo.name); // Temporary file path

  // Validate file type and size
  if (!['jpg', 'jpeg', 'png', 'heic'].includes(ext))
    return res.status(400).send({ err_msg: "无效的文件类型 " + ext });
  if (photo.size > 10 * 1048576) // 10MB limit
    return res.status(400).send({ err_msg: "文件大小超过 10MB" });

  // Save the uploaded file temporarily
  try {
    await photo.mv(tempPath);

    // Process the image using sharp
    const processedPath = path.join(uploadDir, photoName);
    await sharp(tempPath)
      .resize({ width: 2000, withoutEnlargement: true }) // Resize to max width of 2000px, maintain aspect ratio
      .jpeg({ quality: 90 }) // Convert to JPEG with quality 80
      .toFile(processedPath);

    // Clean up the temporary file
    fs.unlinkSync(tempPath);

    console.log('Image processed and saved as:', photoName);
  } catch (err) {
    console.error('Image processing error:', err);
    return res.status(500).send({ err_msg: "图片处理失败" });
  }

  // Delete any existing submissions with the same ID
  await Submission.deleteMany({ id: id });

  // Create a new submission record
  const now_date = new Date();
  await Submission.create({
    id: id,
    uid: req.user.uid,
    checkpointgroup: checkpointid.split('-')[0],
    checkpointid: checkpointid,
    photo: photoName,
    uploaded: now_date,
    state: "pending"
  });

  // Create an alert for the user about the checkpoint status change: photo uploaded
  await Alert.create({
    uid: req.user.uid,
    date: now_date,
    content: `您在打卡点 ${checkpointid} 的照片已上传，正在等待审核`
  });
  io.emit('update', checkpointid);

  res.send({message: "success"});
}