function getAll(ctx, next, params, meta) {
  ctx.body = meta;
}

function create(ctx, next, params, meta) {
  ctx.body = { status: 'ok' };
}

function find(ctx, next, params, meta) {
  ctx.body = "Found: " + params.petId;
}

module.exports = {
  getAll,
  create,
  find,
};
