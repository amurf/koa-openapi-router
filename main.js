const fs = require('fs')
const yaml = require('yaml')

const Router = require('koa-router')
const router = new Router();

const validate = require('jsonschema').validate;

const file    = fs.readFileSync('example-swagger.yaml', 'utf8')
const swagger = yaml.parse(file)
const paths   = swagger.paths;


for (let path of Object.keys(paths)) {
  let methods = Object.keys(paths[path]);
  for (let method of methods) {
    let convertedPath = path.replace('{', ':').replace('}', '');
    router[method](convertedPath, setupRoute({...paths[path][method], path: convertedPath }));
  }
}


function setupRoute(route) {
  let routeValidations = {
    query: {},
    body: {},
    path: {},
  }

  if (route.parameters) {
    for (let parameter of route.parameters) {
      routeValidations[parameter.in][parameter.name] = {
        schema: parameter.schema,
        required: parameter.required,
      };
    }
  }

  let koaRouter = route['x-koa-router'];
  let handler   = require(`./${ koaRouter.module }`);

  if (!handler[koaRouter.func]) {
    console.log(`* ${ route.path }: ${ koaRouter.func } function not found in module ${ koaRouter.module }`);
  }

  return (ctx, next) => {
    let paramValidationErrors = [
      ...checkParams(ctx.request.body, routeValidations.body),
      ...checkParams(ctx.params,       routeValidations.path),
      ...checkParams(ctx.query,        routeValidations.query),
    ];

    if (paramValidationErrors.length) {
      ctx.throw(400, paramValidationErrors, routeValidations.body);
    }

    handler[koaRouter.func](ctx, ctx.params, route);
  };
}


function checkParams(params, validations) {
  let errors = [];

  for (let paramName of Object.keys(validations)) {
    let param = validations[paramName];
    let value = params[paramName];

    if (!value && param.required) {
      errors.push(`${paramName} is required`);
    }

    if (value) {
      let validationResult = validate(value, validations[paramName].schema);
      if (!validationResult.valid) {
        let errorMessages = validationResult.errors.map(error => error.message);
        errors.push({ errors: errorMessages, value: value, param: paramName });
      }
    }
  }

  return errors;
}


const Koa = require('koa');
const app = new Koa();
const bodyParser =  require('koa-bodyparser');

app.use(bodyParser())
app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3434);
