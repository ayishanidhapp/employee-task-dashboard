const Employee = require('../models/Employee');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

exports.summary = asyncHandler(async (_req, res) => {
  const [totalEmployees, byStatus, byPriority, overdue, perEmployee, upcoming] = await Promise.all([
    Employee.countDocuments(),
    Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.countDocuments({ status: { $ne: 'completed' }, dueDate: { $lt: new Date() } }),
    Task.aggregate([
      { $group: { _id: { emp: '$assignedTo', status: '$status' }, count: { $sum: 1 } } },
    ]),
    Task.find({ status: { $ne: 'completed' } }).sort({ dueDate: 1 }).limit(5).populate('assignedTo', 'name'),
  ]);

  const status = { pending: 0, 'in-progress': 0, completed: 0 };
  byStatus.forEach((s) => (status[s._id] = s.count));
  const priority = { low: 0, medium: 0, high: 0 };
  byPriority.forEach((p) => (priority[p._id] = p.count));

  // fold (employee, status) groups into one row per employee, keep the 5 busiest
  const rows = new Map();
  perEmployee.forEach(({ _id, count }) => {
    const r = rows.get(String(_id.emp)) || { _id: _id.emp, total: 0, completed: 0 };
    r.total += count;
    if (_id.status === 'completed') r.completed += count;
    rows.set(String(_id.emp), r);
  });
  const top = [...rows.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  const names = await Employee.find({ _id: { $in: top.map((t) => t._id) } }, 'name').lean();
  const nameOf = new Map(names.map((n) => [String(n._id), n.name]));
  const topEmployees = top.filter((t) => nameOf.has(String(t._id))).map((t) => ({ ...t, name: nameOf.get(String(t._id)) }));

  res.json({
    totalEmployees,
    totalTasks: status.pending + status['in-progress'] + status.completed,
    status,
    priority,
    overdue,
    topEmployees,
    upcoming,
  });
});
