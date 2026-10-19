const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePagination, buildMeta, paginateArray } = require('../src/utils/paginate');

test('parsePagination applies defaults, clamps and computes skip', () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 12, skip: 0 });
  assert.deepEqual(parsePagination({ page: '3', limit: '10' }), { page: 3, limit: 10, skip: 20 });
  assert.equal(parsePagination({ page: '-4' }).page, 1);
  assert.equal(parsePagination({ page: 'abc', limit: 'x' }).limit, 12);
  assert.equal(parsePagination({ limit: '9999' }).limit, 100);
  assert.equal(parsePagination({ limit: '0' }).limit, 12);
});

test('buildMeta reports totals and navigation flags', () => {
  assert.deepEqual(buildMeta({ page: 2, limit: 10 }, 25), { page: 2, limit: 10, total: 25, totalPages: 3, hasNext: true, hasPrev: true });
  assert.deepEqual(buildMeta({ page: 1, limit: 10 }, 0), { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
});

test('paginateArray slices a loaded list', () => {
  const { items, pagination } = paginateArray([1, 2, 3, 4, 5], { query: { page: '2', limit: '2' } });
  assert.deepEqual(items, [3, 4]);
  assert.equal(pagination.totalPages, 3);
});
