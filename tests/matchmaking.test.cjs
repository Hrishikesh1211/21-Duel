const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MatchmakingController } = require('../.expo/presentation-tests/presentation/MatchmakingController');
function harness(sample = 0.5) {
  let time = 0, found = 0, complete = 0;
  const history = [], jobs = [];
  const controller = new MatchmakingController(phase => history.push([phase, time]), {
    random: () => sample,
    schedule: (callback, delay) => { const job = { callback, delay, cancelled: false }; jobs.push(job); return () => { job.cancelled = true; }; },
    onFound: () => found++, onComplete: () => complete++,
  });
  const tick = () => { const job = jobs.shift(); assert.ok(job); time += job.delay; if (!job.cancelled) job.callback(); };
  return { controller, history, jobs, tick, counts: () => ({ found, complete }) };
}
test('local matchmaking follows deterministic phases within the target duration', () => {
  for (const sample of [0, 0.5, 1]) {
    const h = harness(sample); h.controller.start(); h.controller.start();
    while (h.jobs.length) h.tick();
    assert.deepEqual(h.history.map(x => x[0]), ['searching', 'found', 'intro', 'leaving', 'complete']);
    assert.equal(h.history[1][1], 700 + sample * 500);
    assert.equal(h.history[3][1] - h.history[2][1], 650);
    assert.equal(h.history[3][1] - h.history[1][1], 830); // Fully visible competitors hold before the exit fade.
    assert.ok(h.history.at(-1)[1] >= 1710 && h.history.at(-1)[1] <= 2210);
    assert.deepEqual(h.counts(), { found: 1, complete: 1 });
    assert.equal(h.controller.cancel(), false);
  }
});
test('cancel is immediate, clears search, and suppresses even an already queued callback', () => {
  const h = harness(); h.controller.start(); const stale = h.jobs[0].callback;
  assert.equal(h.controller.cancel(), true);
  assert.equal(h.jobs[0].cancelled, true);
  stale(); h.tick(); h.controller.start();
  assert.deepEqual(h.history, [['searching', 0]]);
  assert.deepEqual(h.counts(), { found: 0, complete: 0 });
});
test('found, intro, and bridge reject cancel but unmount always clears pending work', () => {
  for (const count of [1, 2, 3]) {
    const h = harness(); h.controller.start(); for (let i = 0; i < count; i++) h.tick();
    assert.equal(h.controller.cancel(), false);
    const length = h.history.length, stale = h.jobs[0].callback;
    h.controller.dispose(); h.controller.dispose(); stale(); h.tick();
    assert.equal(h.history.length, length);
    assert.deepEqual(h.counts(), { found: 1, complete: 0 });
  }
});
test('reentering uses a fresh independent search after cancellation', () => {
  const old = harness(); old.controller.start(); old.controller.cancel();
  const next = harness(); next.controller.start(); while (next.jobs.length) next.tick();
  old.jobs[0].callback();
  assert.deepEqual(old.counts(), { found: 0, complete: 0 });
  assert.deepEqual(next.counts(), { found: 1, complete: 1 });
});

test('known friend skips random search and reuses found, intro and bridge timings',()=>{
 const {matchmakingTiming}=require('../.expo/presentation-tests/presentation/MatchmakingController');const jobs=[],phases=[];let complete=0,found=0;
 const controller=new MatchmakingController(phase=>phases.push(phase),{knownOpponent:true,random:()=>{throw Error('Friend intro must not search');},schedule:(callback,delay)=>{const job={callback,delay};jobs.push(job);return()=>job.cancelled=true;},onFound:()=>found++,onComplete:()=>complete++});controller.start();controller.start();assert.deepEqual(phases,['found']);assert.equal(controller.cancel(),false);
 for(const delay of [matchmakingTiming.found,matchmakingTiming.intro,matchmakingTiming.bridge]){const job=jobs.shift();assert.equal(job.delay,delay);job.callback();}
 assert.deepEqual(phases,['found','intro','leaving','complete']);assert.equal(found,1);assert.equal(complete,1);
});
test('disposing known-friend intro blocks stale callbacks and game navigation',()=>{
 let stale,completed=0;const controller=new MatchmakingController(()=>{}, {knownOpponent:true,schedule:callback=>{stale=callback;return()=>{};},onComplete:()=>completed++});controller.start();controller.dispose();stale();assert.equal(completed,0);
});
