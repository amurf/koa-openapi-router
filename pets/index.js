
function getAll(ctx, params, meta) {
    ctx.body = "Reading from swagger: " + "\n" + meta.summary ;
}

function create(ctx, params, meta) {

}

function find(ctx, params, meta) {
  ctx.body = "Found: " + params.petId;
}

module.exports = {
    getAll,
    create,
    find,
};
