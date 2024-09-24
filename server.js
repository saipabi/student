const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./db');
const Mentor = require('./models/Mentor');
const Student = require('./models/Student');

const app = express();
const PORT = 5000;

// Connect Database
connectDB();

// Middleware
app.use(bodyParser.json());

// Create a Mentor
app.post('/api/mentor', async (req, res) => {
  const { name } = req.body;
  const mentor = new Mentor({ name });
  await mentor.save();
  res.json(mentor);
});

// Create a Student
app.post('/api/student', async (req, res) => {
  const { name } = req.body;
  const student = new Student({ name });
  await student.save();
  res.json(student);
});

// Assign multiple students to a mentor
app.put('/api/mentor/:mentorId/assign', async (req, res) => {
  const { mentorId } = req.params;
  const { studentIds } = req.body;

  const mentor = await Mentor.findById(mentorId);
  if (!mentor) {
    return res.status(404).json({ error: 'Mentor not found' });
  }

  const students = await Student.find({
    _id: { $in: studentIds },
    mentor: null, // Students without a mentor
  });

  if (students.length !== studentIds.length) {
    return res.status(400).json({ error: 'Some students already have a mentor' });
  }

  // Add students to mentor
  mentor.students.push(...students.map((student) => student._id));

  // Update students with the new mentor
  await Student.updateMany(
    { _id: { $in: studentIds } },
    { $set: { mentor: mentorId } }
  );

  await mentor.save();
  res.json(mentor);
});

// Get students without a mentor
app.get('/api/students/unassigned', async (req, res) => {
  const students = await Student.find({ mentor: null });
  res.json(students);
});

// Assign or Change Mentor for a Student
app.put('/api/student/:studentId/assign-mentor', async (req, res) => {
  const { studentId } = req.params;
  const { mentorId } = req.body;

  const student = await Student.findById(studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const mentor = await Mentor.findById(mentorId);
  if (!mentor) {
    return res.status(404).json({ error: 'Mentor not found' });
  }

  if (student.mentor) {
    student.previousMentors.push(student.mentor);
  }

  student.mentor = mentorId;
  await student.save();

  res.json(student);
});

// Get all students for a particular mentor
app.get('/api/mentor/:mentorId/students', async (req, res) => {
  const { mentorId } = req.params;
  const students = await Student.find({ mentor: mentorId });
  res.json(students);
});

// Get previously assigned mentors for a student
app.get('/api/student/:studentId/previous-mentors', async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId).populate('previousMentors');
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(student.previousMentors);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
