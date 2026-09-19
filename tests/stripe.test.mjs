import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { createServices } from '../src/services.js';
const env = { SITE_URL:'https://www.sharedpearls.com', STRIPE_PRICE_ID:'price_10', STRIPE_WEBHOOK_SECRET:'whsec_testing_only' };
function database() {
  const writes = [];
  const db = {
    from(table) {
      const q = { select:()=>q, eq:()=>q, in:()=>q, lte:()=>q,
        update:value=>{writes.push(value);return q;}, upsert:()=>q,
        maybeSingle:async()=>({data:table==='billing_customers'?{user_id:'user-1',stripe_customer_id:'cus_1'}:null}),
        single:async()=>({data:{stripe_customer_id:'cus_1'}}),
        then:resolve=>Promise.resolve({data:[]}).then(resolve) };
      return q;
    },
    rpc:async(name,value)=>{writes.push({name,value});return {data:name==='membership_checkout_key'?'attempt-1':null};},
  };
  return { db, writes };
}
test('wrong checkout owner cannot activate a subscription', async () => {
  const {db,writes} = database();
  const stripe = {checkout:{sessions:{retrieve:async()=>({
    id:'cs_test_123',client_reference_id:'someone-else',metadata:{supabase_user_id:'someone-else'},customer:'cus_1',
  })}}};
  await assert.rejects(createServices(env,{db,stripe}).confirm({id:'user-1'},'cs_test_123'), /another account/);
  assert.equal(writes.length,0);
});
test('unpaid completed checkout does not create access', async () => {
  const {db,writes} = database();
  const stripe = {checkout:{sessions:{retrieve:async()=>({
    id:'cs_test_123',client_reference_id:'user-1',metadata:{supabase_user_id:'user-1',price_id:'price_10'},customer:'cus_1',
    mode:'subscription',status:'complete',payment_status:'unpaid',subscription:'sub_1',
  })}}};
  assert.equal((await createServices(env,{db,stripe}).confirm({id:'user-1'},'cs_test_123')).active,false);
  assert.equal(writes.length,0);
});
test('checkout has fixed price, trusted identity, return URLs and stable retry key', async () => {
  const {db} = database();
  const calls = [];
  const stripe = {
    prices:{retrieve:async()=>({active:true,type:'recurring',unit_amount:1000,currency:'usd',recurring:{interval:'month',interval_count:1}})},
    subscriptions:{list:()=>({async *[Symbol.asyncIterator](){}})},
    checkout:{sessions:{list:async()=>({data:[]}),create:async(body,options)=>{
      calls.push({body,options});return {status:'open',url:'https://checkout.stripe.com/test'};
    }}},
  };
  const services = createServices(env,{db,stripe});
  await services.checkout({id:'user-1'}); await services.checkout({id:'user-1'});
  assert.equal(calls[0].body.line_items[0].price,'price_10');
  assert.equal(calls[0].body.client_reference_id,'user-1');
  assert.equal(calls[0].body.mode,'subscription');
  assert.equal(calls[0].body.success_url,'https://www.sharedpearls.com/payment-success.html?session_id={CHECKOUT_SESSION_ID}');
  assert.equal(calls[0].options.idempotencyKey,calls[1].options.idempotencyKey);
});
test('a returning member reuses an open checkout', async () => {
  const {db} = database();
  let creates=0;
  const stripe = {
    prices:{retrieve:async()=>({active:true,type:'recurring',unit_amount:1000,currency:'usd',recurring:{interval:'month',interval_count:1}})},
    subscriptions:{list:()=>({async *[Symbol.asyncIterator](){}})},
    checkout:{sessions:{list:async()=>({data:[{metadata:{supabase_user_id:'user-1',price_id:'price_10'},url:'https://checkout.stripe.com/existing'}]}),
      create:async()=>{creates++;}}},
  };
  assert.equal((await createServices(env,{db,stripe}).checkout({id:'user-1'})).url,'https://checkout.stripe.com/existing');
  assert.equal(creates,0);
});
test('real Stripe signature verification rejects tampering and accepts signed events', async () => {
  const {db,writes} = database();
  const stripe = new Stripe('sk_test_local_only',{httpClient:Stripe.createFetchHttpClient()});
  const services = createServices(env,{db,stripe});
  const body = JSON.stringify({id:'evt_test',type:'unhandled.test',data:{object:{}}});
  await assert.rejects(services.webhook(body,'t=1,v1=forged'), /signature/);
  const header = await stripe.webhooks.generateTestHeaderStringAsync({
    payload:body,secret:env.STRIPE_WEBHOOK_SECRET,cryptoProvider:Stripe.createSubtleCryptoProvider(),
  });
  assert.deepEqual(await services.webhook(body,header),{received:true});
  await assert.rejects(services.webhook(body+' ',header), /signature/);
  assert.equal(writes.length,0);
});

test('an active subscription grants a new period only after its invoice is paid', async () => {
  for (const invoiceStatus of ['paid', 'open']) {
    const {db,writes} = database();
    const stripe = {
      checkout:{sessions:{retrieve:async()=>({
        client_reference_id:'user-1',metadata:{supabase_user_id:'user-1',price_id:'price_10'},
        customer:'cus_1',mode:'subscription',status:'complete',payment_status:'paid',subscription:'sub_1',
      })}},
      subscriptions:{retrieve:async()=>({
        id:'sub_1',customer:'cus_1',status:'active',cancel_at_period_end:false,
        latest_invoice:{status:invoiceStatus},
        items:{data:[{price:{id:'price_10'},current_period_end:2000000000}]},
      })},
    };
    await createServices(env,{db,stripe}).confirm({id:'user-1'},'cs_test_123');
    const sync=writes.find(w=>w.name==='membership_sync_subscription');
    assert.equal(sync.value.p_record.status,invoiceStatus==='paid'?'active':'pending_payment');
  }
});
