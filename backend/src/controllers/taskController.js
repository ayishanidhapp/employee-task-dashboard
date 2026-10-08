const mongoose = require('mongoose');
const Task = require('../models/Task');
const Employee = require('../models/Employee');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

const FIELDS = ['title', 'description', 'assignedTo', 'priority', 'dueDate', 'status'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

async function ensureEmployee(id) {
  if (!mongoose.isValidObjectId(id) || !(await Employee.exists({ _id: id }))) {
    throw new HttpError(400, 'Assigned employee does not exist');
  }
}

exports.list = asyncHandler(async (req, res) => {
  const { status, employee, priority, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (employee) {
    if (!mongoose.isValidObjectId(employee)) throw new HttpError(400, 'Invalid employee');
    filter.assignedTo = employee;
  }
  if (search) filter.title = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const tasks = await Task.find(filter).populate('assignedTo', 'name email').sort({ dueDate: 1, createdAt: -1 });
  res.json(tasks);
});

exports.get = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('assignedTo', 'name email');
  if (!task) throw new HttpError(404, 'Task not found');
  res.json(task);
});

exports.create = asyncHandler(async (req, res) => {
  const data = pick(req.body);
  await ensureEmployee(data.assignedTo);
  const task = await Task.create(data);
  res.status(201).json(await task.populate('assignedTo', 'name email'));
});

exports.update = asyncHandler(async (req, res) => {
  const data = pick(req.body);
  if (data.assignedTo !== undefined) await ensureEmployee(data.assignedTo);
  const task = await Task.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).populate(
    'assignedTo',
    'name email'
  );
  if (!task) throw new HttpError(404, 'Task not found');
  res.json(task);
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  ).populate('assignedTo', 'name email');
  if (!task) throw new HttpError(404, 'Task not found');
  res.json(task);
});

exports.remove = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  res.json({ message: 'Task deleted' });
});
