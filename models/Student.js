// models/Student.js
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', default: null },
  previousMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' }],
});

module.exports = mongoose.model('Student', StudentSchema);
