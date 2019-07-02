const Koa = require('koa');
const app = new Koa();

const bodyParser =  require('koa-bodyparser');
app.use(bodyParser())


require('./pets')
const OpenAPIRouter = require('..');
const { router }    = OpenAPIRouter('swagger.yaml');
app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3434);
