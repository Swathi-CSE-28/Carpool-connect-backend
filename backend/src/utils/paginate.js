/**
 * Pagination helpers.
 *
 * Query params:  ?page=1&limit=12   (page >= 1, limit clamped to 1..maxLimit)
 * Response adds: pagination: { page, limit, total, totalPages, hasNext, hasPrev }
 *
 * The existing `count` and list keys are kept so older clients keep working.
 */
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

function parsePagination(query = {}, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

function buildMeta({ page, limit }, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}

/**
 * Runs `Model.find(filter)` with skip/limit plus a countDocuments in parallel.
 * `build(queryChain)` lets the caller add populate/sort/select; returns { items, pagination }.
 */
async function paginateQuery(Model, filter, req, build = (q) => q, opts) {
  const p = parsePagination(req.query, opts);
  const [items, total] = await Promise.all([
    build(Model.find(filter)).skip(p.skip).limit(p.limit),
    Model.countDocuments(filter)
  ]);
  return { items, pagination: buildMeta(p, total) };
}

/** Paginates an already-loaded array (used for computed lists such as ride matching). */
function paginateArray(array, req, opts) {
  const p = parsePagination(req.query, opts);
  return { items: array.slice(p.skip, p.skip + p.limit), pagination: buildMeta(p, array.length) };
}

module.exports = { parsePagination, buildMeta, paginateQuery, paginateArray };
