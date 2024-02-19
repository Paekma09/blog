import dotenv from "dotenv";
dotenv.config();

import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import mongoose from 'mongoose';
import api from './api/index.js';
// import createFakeData from './createFakeData.js';
import jwtMiddleware from './lib/jwtMiddleware.js';

import serve from 'koa-static';
import path from 'path';
import send from 'koa-send';

//비구조화 할당을 통해 process.env 내부 값에 대한 레퍼런스 만들기
const { PORT, MONGO_URI } = process.env;

/*
* MongoDB에 connect 함수를 이용하여 연결
* */
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // createFakeData();
  })
  .catch(e => {
    console.error(e);
  });

const app = new Koa();
const router = new Router();

//라우터 설정
router.use('/api', api.routes()); //api 라우트 적용

/*
//라우터 설정
router.get('/', ctx => {
  ctx.body = '홈';
});
router.get('/about/:name?', ctx => {
  const { name } = ctx.params;
  //name 의 존재 유무에 따라 다른 결과 출력
  ctx.body = name ? `${name}의 소개` : '소개';
});
router.get('/posts', ctx => {
  const { id } = ctx.query;
  //id 의 존재 유무에 따라 다른 결과 출력
  ctx.body = id ? `포스트 #${id}` : '포스트 아이디가 없습니다.';
});
*/
/*
app.use(async (ctx, next) => {
  console.log(ctx.url);
  console.log(1);
  if (ctx.query.authorized !== '1') {
    ctx.status = 401; //Unauthorized
    return;
  }
  await next();
  console.log('END');
});

app.use((ctx, next) => {
  console.log(2);
  next();
});

app.use(ctx => {
  ctx.body = 'hello world';
});
*/

//라우터 적용 전에 bodyParser 적용
app.use(bodyParser());

//토큰 검증
app.use(jwtMiddleware);

//app 인스턴스에 라우터 적용
app.use(router.routes()).use(router.allowedMethods());

const __dirname = path.resolve();
const buildDirectory = path.join(__dirname, '../../blog-frontend/build');
app.use(serve(buildDirectory));
app.use(async ctx => {
  //NotFound 이고, 주소가 /api 로 시작하지 않는 경우
  if (ctx.status === 404 && ctx.path.indexOf('/api') !== 0) {
    //index.html 내용을 반환
    await send(ctx, 'index.html', { root: buildDirectory });
  }
});

//PORT 가 지정되어 있지 않다면 4000을 사용
const port = PORT || 4000;
app.listen(port, () => {
  console.log('Listening to port %d', port);
});