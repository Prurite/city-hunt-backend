const Alert = require("../models/alert");

// Return all alerts belonging to a user, ordered by time from newest to oldest
exports.alerts = async function (req, res) {
  // find all not dismissed alerts of the user
  const alerts_db = await Alert.find({
    uid: req.user.uid, dismissed: false
  }).sort("-date");

  let alerts = JSON.parse(JSON.stringify(alerts_db));
  for (let i = 0; i < alerts.length; i++)
    alerts[i].time = alerts_db[i].time;
  res.json(alerts);
}

// Delete an alert matching the alert posted to API
// If the according alert is not found, return an error
exports.delete = async function (req, res) {
  const alert = req.body;
  // Mark the alert matching its uid and Date as dismissed
  const result = await Alert.updateOne({
    uid: req.user.uid,
    date: new Date(alert.date)
  }, { dismissed: true });
  if (result.nModified === 0)
    return res.status(404).json({ error: "Alert not found" });
  res.send({ message: "success" });
}