process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
let MongoMemoryServer;
try { ({ MongoMemoryServer } = require('mongodb-memory-server')); } catch { /* optional */ }

const app = require('../src/app');
const Admin = require('../src/models/Admin');

let mongod, server, base, token;

async function call(method, path, body, auth = true) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

before(async () => {
  // Use TEST_MONGODB_URI if given, otherwise spin up an in-memory MongoDB
  if (process.env.TEST_MONGODB_URI) {
    await mongoose.connect(process.env.TEST_MONGODB_URI);
    await mongoose.connection.dropDatabase();
  } else {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }
  await Admin.create({ name: 'Admin', email: 'admin@test.com', password: 'secret123' });
  server = http.createServer(app).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.close();
  if (process.env.TEST_MONGODB_URI) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('rejects unauthenticated requests', async () => {
  const r = await call('GET', '/employees', null, false);
  assert.equal(r.status, 401);
});

test('login fails with wrong password, succeeds with right one', async () => {
  const bad = await call('POST', '/auth/login', { email: 'admin@test.com', password: 'nope' }, false);
  assert.equal(bad.status, 401);
  const ok = await call('POST', '/auth/login', { email: 'admin@test.com', password: 'secret123' }, false);
  assert.equal(ok.status, 200);
  token = ok.data.token;
  assert.ok(token);
});

test('full employee + task lifecycle', async () => {
  const e1 = await call('POST', '/employees', { name: 'Ann', email: 'ann@x.com', department: 'IT' });
  assert.equal(e1.status, 201);
  const dup = await call('POST', '/employees', { name: 'Ann2', email: 'ann@x.com' });
  assert.equal(dup.status, 409);
  const e2 = await call('POST', '/employees', { name: 'Bob', email: 'bob@x.com' });

  const edit = await call('PUT', `/employees/${e1.data._id}`, { position: 'Lead' });
  assert.equal(edit.data.position, 'Lead');

  const due = new Date(Date.now() + 86400000).toISOString();
  const t1 = await call('POST', '/tasks', { title: 'T1', assignedTo: e1.data._id, priority: 'high', dueDate: due });
  assert.equal(t1.status, 201);
  assert.equal(t1.data.status, 'pending');
  const t2 = await call('POST', '/tasks', { title: 'T2', assignedTo: e2.data._id, dueDate: due });
  const badEmp = await call('POST', '/tasks', { title: 'X', assignedTo: new mongoose.Types.ObjectId(), dueDate: due });
  assert.equal(badEmp.status, 400);
  const noTitle = await call('POST', '/tasks', { assignedTo: e1.data._id, dueDate: due });
  assert.equal(noTitle.status, 400);

  const st = await call('PATCH', `/tasks/${t1.data._id}/status`, { status: 'in-progress' });
  assert.equal(st.data.status, 'in-progress');
  const badSt = await call('PATCH', `/tasks/${t1.data._id}/status`, { status: 'weird' });
  assert.equal(badSt.status, 400);

  const byStatus = await call('GET', '/tasks?status=in-progress');
  assert.equal(byStatus.data.length, 1);
  const byEmp = await call('GET', `/tasks?employee=${e2.data._id}`);
  assert.equal(byEmp.data.length, 1);
  assert.equal(byEmp.data[0].title, 'T2');

  const upd = await call('PUT', `/tasks/${t2.data._id}`, { title: 'T2 edited', assignedTo: e1.data._id });
  assert.equal(upd.data.assignedTo._id, e1.data._id);

  const stats = await call('GET', '/stats');
  assert.equal(stats.data.totalEmployees, 2);
  assert.equal(stats.data.totalTasks, 2);
  assert.equal(stats.data.status['in-progress'], 1);
  assert.equal(stats.data.status.pending, 1);

  assert.equal((await call('DELETE', `/tasks/${t2.data._id}`)).status, 200);
  const del = await call('DELETE', `/employees/${e1.data._id}`);
  assert.equal(del.data.tasksRemoved, 1);
  assert.equal((await call('GET', '/tasks')).data.length, 0);
});
