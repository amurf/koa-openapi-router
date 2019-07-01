
function getAll(ctx, params, meta) {
  ctx.body = meta;
}

function create(ctx, params, meta) {
  ctx.body = { status: 'ok' };
}

function find(ctx, params, meta) {
  ctx.body = "Found: " + params.petId;
}

module.exports = {
  getAll,
  create,
  find,
};
