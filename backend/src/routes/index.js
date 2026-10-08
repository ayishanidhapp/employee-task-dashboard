const router = require('express').Router();
const auth = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const emp = require('../controllers/employeeController');
const task = require('../controllers/taskController');
const stats = require('../controllers/statsController');

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.post('/auth/login', authCtrl.login);
router.get('/auth/me', auth, authCtrl.me);

// Everything below requires a valid admin token
router.use(auth);

router.get('/stats', stats.summary);

router.route('/employees').get(emp.list).post(emp.create);
router.route('/employees/:id').get(emp.get).put(emp.update).delete(emp.remove);

router.route('/tasks').get(task.list).post(task.create);
router.patch('/tasks/:id/status', task.updateStatus);
router.route('/tasks/:id').get(task.get).put(task.update).delete(task.remove);

module.exports = router;
