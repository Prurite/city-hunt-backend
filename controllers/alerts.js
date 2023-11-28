const Alert = require("../models/alert");

// Return all alerts belonging to a user, ordered by time from newest to oldest
exports.alerts = async function (req, res) {
  const alerts_db = await Alert.find({uid: req.user.uid}).sort({date: -1});
  let alerts = JSON.parse(JSON.stringify(alerts_db));
  for (let i = 0; i < alerts.length; i++)
    alerts[i].time = alerts_db[i].time;
  res.json(alerts);
}

// Delete an alert matching the alert posted to API
// If the according alert is not found, return an error
exports.delete = async function (req, res) {
  const alert = req.body;
  // Delete the alert based on its uid and Date
  const result = await Alert.deleteOne({uid: alert.uid, date: alert.date});
  if (result.deletedCount === 0)
    return res.status(404).send({ err_msg: "未找到该消息" });
  res.send({ message: "success" });
}