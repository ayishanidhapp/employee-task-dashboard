require('dotenv').config();
const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const Employee = require('./models/Employee');
const Task = require('./models/Task');

const day = 24 * 60 * 60 * 1000;

(async () => {
  await connectDB(process.env.MONGODB_URI);

  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  if (!(await Admin.findOne({ email }))) {
    await Admin.create({ name: 'Administrator', email, password });
    console.log(`Admin created: ${email} / ${password}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  if (process.argv.includes('--demo') && (await Employee.countDocuments()) === 0) {
    const emps = await Employee.insertMany([
      { name: 'Aisha Khan', email: 'aisha@example.com', phone: '+971501110001', department: 'Marketing', position: 'Campaign Manager' },
      { name: 'Omar Hassan', email: 'omar@example.com', phone: '+971501110002', department: 'Sales', position: 'Account Executive' },
      { name: 'Sara Ali', email: 'sara@example.com', phone: '+971501110003', department: 'Design', position: 'Graphic Designer' },
      { name: 'Yusuf Rahman', email: 'yusuf@example.com', phone: '+971501110004', department: 'IT', position: 'Support Engineer' },
    ]);
    const t = (i, title, description, priority, offset, status) => ({
      title, description, priority, status, assignedTo: emps[i]._id, dueDate: new Date(Date.now() + offset * day),
    });
    await Task.insertMany([
      t(0, 'Plan Q4 social campaign', 'Draft calendar and budget for Q4 campaign.', 'high', 5, 'in-progress'),
      t(0, 'Review ad performance', 'Weekly report on ad spend and ROI.', 'medium', -2, 'pending'),
      t(1, 'Follow up with key clients', 'Call top 10 clients about renewals.', 'high', 2, 'pending'),
      t(1, 'Update CRM records', 'Clean up duplicate contacts.', 'low', 10, 'completed'),
      t(2, 'Design brochure', 'Tri-fold brochure for exhibition.', 'medium', 7, 'in-progress'),
      t(2, 'Refresh brand assets', 'Export logo pack in all formats.', 'low', -5, 'completed'),
      t(3, 'Set up new laptops', 'Configure 5 laptops for new hires.', 'high', 1, 'pending'),
    ]);
    console.log('Demo employees and tasks inserted');
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
