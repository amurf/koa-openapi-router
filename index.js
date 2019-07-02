const fs       = require('fs')
const yaml     = require('yaml')
const Router   = require('@koa/router')
const validate = require('jsonschema').validate;
const path     = require("path");

const testMode = process.env.KOA_OPENAPI_ROUTER_TESTS;

if (testMode) {
  module.exports = {
    validateOpenAPI,
    initialiseRouter,
    getRouteHandler,
    validateParams,
  };
} else {
  module.exports = function(specFile, opts) {
    let openapi = validateOpenAPI(specFile);
    let router  = initialiseRouter(openapi);

    return {
      openapi,
      router,
    };
  };
}

function validateOpenAPI(specFile) {
  // TODO: check file exists
  const file    = fs.readFileSync(specFile, 'utf8');
  const openapi = yaml.parse(file);

  // TODO: add json schema validation here against spec;
  return openapi;
}


function initialiseRouter(specObj) {
  const router = new Router();
  const paths  = Object.keys(specObj.paths);
  paths.sort(); // This ensures paths like /user/details are before /user/{ id }

  for (let path of paths) {
    let methods = Object.keys(specObj.paths[path]);
    for (let method of methods) {
      // TODO: is there a better way to conver this?
      let convertedPath = path.replace('{', ':').replace('}', '');
      let routeHandler  = getRouteHandler({
        ...specObj.paths[path][method],
        path: convertedPath
      });

      router[method](convertedPath, routeHandler);
    }
  }

  return router;
}

function getRouteHandler(route) {
  let routeValidations = {
    query: {},
    body: {},
    path: {},
  }

  if (route.parameters) {
    for (let parameter of route.parameters) {
      routeValidations[parameter.in][parameter.name] = {
        schema:   parameter.schema,
        required: parameter.required,
      };
    }
  }

  let pathRouterOpts = route['x-koa-openapi-router'];
  let modulePath     = path.join(process.cwd(), pathRouterOpts.module);
  let handler        = require(modulePath);

  if (!handler[pathRouterOpts.func]) {
    console.log(`* ${ route.path }: ${ pathRouterOpts.func } function not found in module ${ pathRouterOpts.module }`);
  }

  return (ctx, next) => {
    let paramValidationErrors = [
      ...validateParams(ctx.request.body, routeValidations.body),
      ...validateParams(ctx.params,       routeValidations.path),
      ...validateParams(ctx.query,        routeValidations.query),
    ];

    if (paramValidationErrors.length) {
      ctx.throw(400, paramValidationErrors, routeValidations.body);
    }

    // TODO: Return validated params, so don't need to go looking in ctx object
    // TODO: cut down what is in route, so it's less bloated

    handler[pathRouterOpts.func](ctx, next, ctx.params, route);
  };
}


function validateParams(params, validations) {
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


