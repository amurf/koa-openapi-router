const fs = require('fs')
const yaml = require('yaml')


const Router = require('koa-router')
const router = new Router();

const file    = fs.readFileSync('example-swagger.yaml', 'utf8')
const swagger = yaml.parse(file)
const paths   = swagger.paths;

for (let path of Object.keys(paths)) {
    let methods = Object.keys(paths[path]);
    for (let method of methods) {
        let convertedPath = path.replace('{', ':').replace('}', ''); // move to func, make smarter.
        router[method](convertedPath, setupRoute({...paths[path][method], path: convertedPath }));
    }
}


function setupRoute(route) {
    let routeChecks = {
        query: {},
        body: {},
        path: {},
    }

    if (route.parameters) {
        for (let parameter of route.parameters) {
            routeChecks[parameter.in][parameter.name] = {
                type: parameter.schema.type,
                required: parameter.required,
            };
        }
    }

    let validators = {
        string: (val) => typeof val === 'string',
    };

    let koaRouter = route['x-koa-router'];
    let handler = require(`./${ koaRouter.module }`);

    if (!handler[koaRouter.func]) {
        console.log(`* ${ route.path }: ${ koaRouter.func } function not found in module ${ koaRouter.module }`);
    }

    return (ctx, next) => {

        let errors = [];
        for (let paramName of Object.keys(routeChecks.body)) {
            let param = routeChecks.body[paramName];
            if (!ctx.params[paramName] && param.required) {
                errors.push(`${paramName} is required`);
            }
        }

        if (errors.length) {
            ctx.throw(400, errors.toString(), routeChecks.body);
        }

        handler[koaRouter.func](ctx, ctx.params, route);
    };
}


const Koa = require('koa');
const app = new Koa();

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3434);
