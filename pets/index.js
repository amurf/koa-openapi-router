
function getAll(ctx, params, meta) {
    ctx.body = "lol: " + params.toString();
}

function create(params, meta) {

}


module.exports = {

    getAll: getAll,
    create: create,

};
