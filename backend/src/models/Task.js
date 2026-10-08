const mongoose = require('mongoose');

const STATUSES = ['pending', 'in-progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    description: { type: String, trim: true, default: '', maxlength: 2000 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: [true, 'Assigned employee is required'] },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    dueDate: { type: Date, required: [true, 'Due date is required'] },
    status: { type: String, enum: STATUSES, default: 'pending' },
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, assignedTo: 1 });

module.exports = mongoose.model('Task', taskSchema);
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
