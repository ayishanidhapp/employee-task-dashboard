const Employee = require('../models/Employee');
const Task = require('../models/Task');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

const FIELDS = ['name', 'email', 'phone', 'department', 'position'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

exports.list = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { department: rx }, { position: rx }];
  }
  const employees = await Employee.find(filter).sort({ name: 1 }).lean();

  // attach task counts per employee
  const counts = await Task.aggregate([{ $group: { _id: '$assignedTo', total: { $sum: 1 } } }]);
  const map = new Map(counts.map((c) => [String(c._id), c.total]));
  res.json(employees.map((e) => ({ ...e, taskCount: map.get(String(e._id)) || 0 })));
});

exports.get = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new HttpError(404, 'Employee not found');
  res.json(employee);
});

exports.create = asyncHandler(async (req, res) => {
  const employee = await Employee.create(pick(req.body));
  res.status(201).json(employee);
});

exports.update = asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, pick(req.body), {
    new: true,
    runValidators: true,
  });
  if (!employee) throw new HttpError(404, 'Employee not found');
  res.json(employee);
});

// Deleting an employee also removes their tasks so nothing is left orphaned.
exports.remove = asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndDelete(req.params.id);
  if (!employee) throw new HttpError(404, 'Employee not found');
  const { deletedCount } = await Task.deleteMany({ assignedTo: employee._id });
  res.json({ message: 'Employee deleted', tasksRemoved: deletedCount });
});
