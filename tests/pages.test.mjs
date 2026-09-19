import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../src/index.js';
test('Cloudflare Pages keeps clean paths and root unchanged to avoid redirect loops', async () => {
  const paths=[];
  const app=createHandler(()=>({
    authenticate:async()=>({id:'member'}),
    access:async()=>({active:true}),
  }));
  const env={PLATFORM:'pages',ASSETS:{fetch:async r=>{paths.push(new URL(r.url).pathname);return new Response('ok');}}};
  await app.fetch(new Request('https://www.sharedpearls.com/'),env);
  await app.fetch(new Request('https://www.sharedpearls.com/premium-tenses',{headers:{Cookie:'__Host-spow_session=token'}}),env);
  assert.deepEqual(paths,['/','/premium-tenses']);
});
test('apex site redirects to the canonical www hostname',async()=>{
  const app=createHandler();
  const response=await app.fetch(new Request('https://sharedpearls.com/account.html?mode=login'),{});
  assert.equal(response.status,308);
  assert.equal(response.headers.get('Location'),'https://www.sharedpearls.com/account.html?mode=login');
});
