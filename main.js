const fs = require('fs')
const yaml = require('yaml')


const Router = require('koa-router')
const router = new Router();

const file    = fs.readFileSync('example-swagger.yaml', 'utf8')
const swagger = yaml.parse(file)
const paths   = swagger.paths;

for (let route of Object.keys(paths)) {
    let methods = Object.keys(paths[route]);
    for (let method of methods) {
        router[method](route.replace('{', ':').replace('}', ''), setupRoute(paths[route][method]));
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

        console.log(ctx.params, ctx.query.abc);
        ctx.body = route.summary;
    };
}


const Koa = require('koa');
const app = new Koa();

// Write a swagger middleware parser ala steves d2

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);
