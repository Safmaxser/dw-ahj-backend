const http = require('http');
const { streamEvents } = require('http-event-stream');
const WS = require('ws');
const Koa = require('koa');
const Router = require('koa-router');
const { koaBody } = require('koa-body');
const koaStatic = require('koa-static');
const cors = require('koa-cors');
const path = require('path');
const { DataRepository } = require('./src/DataRepository');

const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 7070
}
const dirPublic = path.join(__dirname, 'public');
const dataRepository = new DataRepository(dirPublic);
const app = new Koa();
const router = new Router();

router
  .get('/sse', async (ctx) => {  
    streamEvents(ctx.req, ctx.res, {
      async fetch(lastEventId) {
        setTimeout(() => {
          for (const message of dataRepository.listToId(lastEventId)) {
            dataRepository.subscribersMessage(message);
          }  
        }, 10);
        return [];
      },        
      async stream(sse) {
        dataRepository.listen((item) => {
          sse.sendEvent({
            id: item.id,
            data: JSON.stringify(item),
          });
        });        
        return () => {};
      }
    });
    ctx.response = false;
  })
  .get('/messages/:shift', (ctx) => {
    try {
      ctx.body = dataRepository.responseList(ctx.params.shift);
    } catch (error) {
      ctx.body = {
        status: 'error',
        type: 'list',
      };
    }
  })
  .get('/message/search', (ctx) => {
    try {
      const result = dataRepository.searchByMessages(ctx.request.query.q); 
      ctx.body = {
        status: 'ok',
        type: 'search',
        messages: result,
      };
    } catch (error) {
      ctx.body = {
        status: 'error',
        type: 'search',
      };
    }
  })
  .post('/message/add/text', (ctx) => {
    try {
      dataRepository.processMessage(ctx.request.body);
      ctx.body = {
        status: 'ok',
        type: 'add',
      };
    } catch (error) {
      ctx.body = {
        status: 'error',
        type: 'add',
        id: ctx.request.body.id,
      };
    } 
  })
  .post('/message/add/file', (ctx) => {
    try {
      dataRepository.processMessage(ctx.request.body, ctx.request.files.file);
      ctx.body = {
        status: 'ok',
        type: 'add',
      };
    } catch (error) {
      ctx.body = {
        status: 'error',
        type: 'add',
        id: ctx.request.body.id,
      };
    }  
  });

app.use(cors());
app.use(koaStatic(dirPublic, { hidden: true }));
app.use(koaBody({
  urlencoder: true,
  multipart: true,
}));

app
  .use(router.routes())
  .use(router.allowedMethods());

const server = http.createServer(app.callback());
const wsServer = new WS.Server({
  server
});

wsServer.on('connection', (ws) => {
  dataRepository.listenNotify((item) => {
    ws.send(JSON.stringify(item));
  });
});

const port = process.env.PORT || 7070;
const bootstrap = async () => {
  try {
    server.listen(port, () =>
      console.log(`Server has been started on http://localhost:${port}`)
    );
  } catch (error) {
    console.error(error);
  }
};
bootstrap();
