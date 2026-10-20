const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const env = require('../src/config/env');
const app = require('../src/app');

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

async function call(method, path, body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const response = await fetch(base + path, options);
  return { status: response.status, body: await response.json() };
}

function fields(result) {
  return result.body.error.details.map((detail) => detail.field);
}

test('health returns ok in the data envelope', async () => {
  const result = await call('GET', '/health');
  assert.equal(result.status, 200);
  assert.equal(result.body.data.status, 'ok');
});

test('unknown route returns NOT_FOUND in the error envelope', async () => {
  const result = await call('GET', '/does-not-exist');
  assert.equal(result.status, 404);
  assert.equal(result.body.error.code, 'NOT_FOUND');
});

test('malformed JSON returns VALIDATION_ERROR', async () => {
  const result = await call('POST', '/auth/login', '{bad json');
  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, 'VALIDATION_ERROR');
});

test('register with an invalid body lists every bad field', async () => {
  const result = await call('POST', '/auth/register', { name: 'A', email: 'nope', password: 'short', role: 'admin', terms: false });
  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, 'VALIDATION_ERROR');
  for (const field of ['name', 'email', 'password', 'role', 'terms']) {
    assert.ok(fields(result).includes(field), `missing ${field}`);
  }
});

test('register requires provider_type for providers and rejects unknown types', async () => {
  const base = { name: 'Nour Atelier', email: 'nour@example.com', password: 'Password1', role: 'provider', terms: true };
  const missing = await call('POST', '/auth/register', base);
  assert.equal(missing.status, 400);
  assert.deepEqual(fields(missing), ['provider_type']);
  const unknown = await call('POST', '/auth/register', { ...base, provider_type: 'factory' });
  assert.equal(unknown.status, 400);
  assert.deepEqual(fields(unknown), ['provider_type']);
});

test('valid register body passes validation and reaches the skeleton handler', async () => {
  const result = await call('POST', '/auth/register', {
    name: 'Nour Atelier',
    email: 'Nour@Example.com',
    password: 'Password1',
    role: 'provider',
    provider_type: 'manufacturer',
    terms: true
  });
  assert.equal(result.status, 501);
  assert.equal(result.body.error.code, 'NOT_IMPLEMENTED');
});

test('provider search requires category_id when filtering by quantity', async () => {
  const result = await call('GET', '/providers?quantity=50');
  assert.equal(result.status, 400);
  assert.deepEqual(fields(result), ['category_id']);
});

test('provider search rejects page_size above 100', async () => {
  const result = await call('GET', '/providers?page_size=500');
  assert.equal(result.status, 400);
  assert.deepEqual(fields(result), ['page_size']);
});

test('valid provider search passes validation', async () => {
  const result = await call('GET', '/providers?category_id=7d1b8f0e-3c52-4c64-9a0e-0c1f6d2b9a11&quantity=50&max_price=1500&sort=price');
  assert.equal(result.status, 501);
});

test('provider id must be a UUID', async () => {
  const result = await call('GET', '/providers/not-a-uuid');
  assert.equal(result.status, 400);
  assert.deepEqual(fields(result), ['id']);
});

test('project budget_max below budget_min is rejected', async () => {
  const result = await call('POST', '/projects', { title: '50 black evening dresses', budget_min: 100, budget_max: 50 });
  assert.equal(result.status, 400);
  assert.deepEqual(fields(result), ['budget_max']);
});

test('project can be created as a draft with only a title', async () => {
  const result = await call('POST', '/projects', { title: '50 black evening dresses' });
  assert.equal(result.status, 501);
});

test('project status cannot be set back to draft', async () => {
  const result = await call('PATCH', '/projects/7d1b8f0e-3c52-4c64-9a0e-0c1f6d2b9a11/status', { status: 'draft' });
  assert.equal(result.status, 400);
  assert.deepEqual(fields(result), ['status']);
});

test('empty message is rejected', async () => {
  const result = await call('POST', '/conversations/7d1b8f0e-3c52-4c64-9a0e-0c1f6d2b9a11/messages', { message: '   ' });
  assert.equal(result.status, 400);
  assert.deepEqual(fields(result), ['message']);
});

test('db health fails cleanly when Supabase is not configured', { skip: Boolean(env.SUPABASE_URL) }, async () => {
  const result = await call('GET', '/health/db');
  assert.equal(result.status, 500);
  assert.equal(result.body.error.code, 'INTERNAL_ERROR');
});

const ID = '7d1b8f0e-3c52-4c64-9a0e-0c1f6d2b9a11';
const ID2 = '0b8c3d6a-5f2e-4a7b-8e19-3c4d5e6f7a8b';

test('project can be created with several items of different categories', async () => {
  const result = await call('POST', '/projects', {
    title: 'Wedding outfit set',
    items: [
      { category_id: ID, quantity: 1, item_name: 'dress', material_id: ID2, material_confirmed: true },
      { category_id: ID2, quantity: 2, item_name: 'trousers' },
      { category_id: ID, quantity: 1, item_name: 'shoes' }
    ]
  });
  assert.equal(result.status, 501);
});

test('project item needs quantity of at least 1', async () => {
  const result = await call('POST', '/projects', { title: 'Bad quantity', items: [{ category_id: ID, quantity: 0 }] });
  assert.equal(result.status, 400);
  assert.ok(fields(result).some((field) => field.startsWith('items')));
});

test('confirmed material requires a material_id', async () => {
  const result = await call('PUT', `/projects/${ID}/items`, { items: [{ category_id: ID, quantity: 5, material_confirmed: true }] });
  assert.equal(result.status, 400);
});

test('replacing items requires at least one item', async () => {
  const result = await call('PUT', `/projects/${ID}/items`, { items: [] });
  assert.equal(result.status, 400);
});

test('materials list is public and reaches the skeleton', async () => {
  const result = await call('GET', '/materials');
  assert.equal(result.status, 501);
});

test('provider materials accept a list of ids and reject non-UUIDs', async () => {
  const ok = await call('PUT', '/providers/me/materials', { material_ids: [ID, ID2] });
  assert.equal(ok.status, 501);
  const bad = await call('PUT', '/providers/me/materials', { material_ids: ['cotton'] });
  assert.equal(bad.status, 400);
});

test('provider search accepts material_id', async () => {
  const result = await call('GET', `/providers?material_id=${ID}`);
  assert.equal(result.status, 501);
});

test('request status accepts negotiating-free MVP values only', async () => {
  const ok = await call('PATCH', `/project-requests/${ID}`, { status: 'accepted' });
  assert.equal(ok.status, 501);
  const bad = await call('PATCH', `/project-requests/${ID}`, { status: 'negotiating' });
  assert.equal(bad.status, 400);
});

test('notifications list validates the unread filter', async () => {
  const ok = await call('GET', '/notifications?unread=true');
  assert.equal(ok.status, 501);
  const bad = await call('GET', '/notifications?unread=maybe');
  assert.equal(bad.status, 400);
});

test('order cancellation requires a reason', async () => {
  const bad = await call('PATCH', `/orders/${ID}/status`, { status: 'cancelled' });
  assert.equal(bad.status, 400);
  const ok = await call('PATCH', `/orders/${ID}/status`, { status: 'cancelled', reason: 'Customer changed plans' });
  assert.equal(ok.status, 501);
});

test('order status rejects awaiting_deposit', async () => {
  const bad = await call('PATCH', `/orders/${ID}/status`, { status: 'awaiting_deposit' });
  assert.equal(bad.status, 400);
});

test('payment kind must be deposit or balance', async () => {
  const bad = await call('POST', `/orders/${ID}/payments`, { kind: 'refund' });
  assert.equal(bad.status, 400);
  const ok = await call('POST', `/orders/${ID}/payments`, { kind: 'deposit' });
  assert.equal(ok.status, 501);
});

test('quote needs at least one item and a non-negative price', async () => {
  const bad = await call('POST', `/project-requests/${ID}/quotes`, { lead_time_days: 20, items: [] });
  assert.equal(bad.status, 400);
  const neg = await call('POST', `/project-requests/${ID}/quotes`, {
    lead_time_days: 20,
    items: [{ project_item_id: ID, quantity: 10, unit_price: -5 }]
  });
  assert.equal(neg.status, 400);
  const ok = await call('POST', `/project-requests/${ID}/quotes`, {
    lead_time_days: 20,
    items: [{ project_item_id: ID, quantity: 10, unit_price: 250 }]
  });
  assert.equal(ok.status, 501);
});

test('issue description must be meaningful', async () => {
  const bad = await call('POST', `/orders/${ID}/issues`, { type: 'defect', description: 'bad' });
  assert.equal(bad.status, 400);
});

test('stage update accepts only known statuses', async () => {
  const bad = await call('PATCH', `/orders/${ID}/stages/${ID2}`, { status: 'pending' });
  assert.equal(bad.status, 400);
  const ok = await call('PATCH', `/orders/${ID}/stages/${ID2}`, { status: 'approved' });
  assert.equal(ok.status, 501);
});
