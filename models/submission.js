var mongoose = require("mongoose");
const { DateTime } = require("luxon");

var Schema = mongoose.Schema;

var SubmissionSchema = new Schema({
  id: {type: String, required: true},
  checkpointgroup: {type: String, required: true},
  checkpointid: {type: String, required: true },
  uid: {type: String, required: true },
  photo: {type: String, required: true },
  uploaded: {type: Date, required: true },
  state: {type: String, enum:["pending", "accepted", "denied"], required: true },
  score: Number,
  bonus: Number,
  fail_reason: String
})

SubmissionSchema.virtual("uploaded_time").get(function () {
  return DateTime.fromJSDate(this.uploaded).toISO({ includeOffset: false }).replace("T", " ");
})

module.exports = mongoose.model("Submission", SubmissionSchema);