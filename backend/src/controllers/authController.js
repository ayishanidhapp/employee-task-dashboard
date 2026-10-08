const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

const sign = (admin) =>
  jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new HttpError(400, 'Email and password are required');

  const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!admin || !(await admin.comparePassword(String(password)))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  res.json({ token: sign(admin), admin: { id: admin._id, name: admin.name, email: admin.email } });
});

exports.me = (req, res) => {
  const { _id, name, email } = req.admin;
  res.json({ admin: { id: _id, name, email } });
};
