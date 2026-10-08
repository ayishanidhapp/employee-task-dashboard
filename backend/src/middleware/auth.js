const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Not authenticated');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
  const admin = await Admin.findById(payload.id);
  if (!admin) throw new HttpError(401, 'Account no longer exists');
  req.admin = admin;
  next();
});
