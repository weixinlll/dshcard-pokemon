'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
function extractFunction(name) {
  const start = app.indexOf(`function ${name}(`); assert.notEqual(start, -1, `missing ${name}`);
  const open = app.indexOf('{', start); let depth = 0, quote = '', escaped = false;
  for (let i = open; i < app.length; i++) {
    const ch = app[i];
    if (quote) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return app.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

test('move hint reflects live accuracy, category, priority, STAB, weather, and combined type chart', () => {
  const start = app.indexOf('const gen3TypeChart =');
  const end = app.indexOf('const VARIABLE_TAG', start);
  const context = { typeFallbacks: { Water: '水', Electric: '电', Normal: '一般', Flying: '飞行', Ground: '地面' },
    weatherName: value => ({ raindance: '下雨' })[value] || value };
  vm.runInNewContext(`${app.slice(start, end)}\nglobalThis.hint = moveBattleHint;`, context);
  const electric = context.hint({ type: 'Electric', category: 'Special', accuracy: 100, priority: 1 },
    { types: ['Electric'] }, { types: ['Water', 'Flying'] }, 'raindance');
  assert.match(electric, /特殊/); assert.match(electric, /命中 100%/); assert.match(electric, /先制度 \+1/);
  assert.match(electric, /本系加成/); assert.match(electric, /属性相性：4×弱点/); assert.match(electric, /天气：下雨/);
  assert.match(electric, /基础属性相性/); assert.match(electric, /未计特性与招式特殊规则/);
  const ground = context.hint({ type: 'Ground', category: 'Physical', accuracy: true }, { types: ['Ground'] }, { types: ['Electric', 'Flying'] }, 'none');
  assert.match(ground, /必中/); assert.match(ground, /属性相性：无效/);
  assert.doesNotMatch(ground, /天气/);
});

test('battle log retains and renders every real event beyond the previous 100-entry limit', () => {
  const children = [];
  const list = { replaceChildren() { children.length = 0; }, appendChild(node) { children.push(node); } };
  const counter = { textContent: '' };
  const context = { state: { eventLog: [] }, els: { log: list, logCounter: counter },
    document: { createElement() { return { textContent: '' }; } } };
  vm.runInNewContext(`${extractFunction('recordEvent')}\nglobalThis.record = recordEvent;`, context);
  for (let i = 1; i <= 137; i++) context.record(`真实事件 ${i}`);
  assert.equal(context.state.eventLog.length, 137);
  assert.equal(children.length, 137);
  assert.equal(children[0].textContent, '真实事件 1');
  assert.equal(children.at(-1).textContent, '真实事件 137');
  assert.equal(counter.textContent, '137 条记录');
  assert.match(html, /本场完整战斗记录/);
  const formatContext = { protocol: line => line.split('|'), state: {}, safeNum: Number, statusNames: {},
    canonicalMove: () => null, speciesByEnglish: () => null, normalizeLookup: value => value, weatherName: value => value };
  vm.runInNewContext(`${extractFunction('formatEvent')}\nglobalThis.format = formatEvent;`, formatContext);
  assert.equal(formatContext.format('|-sideend|p1|Spikes'), 'p1的Spikes效果结束了。');
  assert.equal(formatContext.format('|cant|p1a:皮卡丘|par'), '皮卡丘因为麻痹无法动弹。');
  assert.equal(formatContext.format('|cant|p1a:皮卡丘|recharge'), '皮卡丘需要恢复力气。');
});

test('battle lines stay on screen long enough to read who used what', () => {
  // At 1× a move line is held after its animation and every other line before the next replaces it;
  // 演出速度 divides these and 跳过 skips them (wait() resolves at once while fast-forwarding).
  assert.match(app, /await animateMove\(p, moveResult\.outcome === 'hit', moveResult\); \}\n[^\n]*\n\s*await wait\(900\);/);
  assert.match(app, /if \(text && kind !== 'move'\) await wait\(650\);/);
  assert.match(app, /function wait\(ms\) \{\n\s*if\(state\.fastForward\)return Promise\.resolve\(\);/);
});
