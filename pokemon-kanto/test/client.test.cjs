'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// There is no React/jsdom dependency in this project. This small React-compatible
// hook runner invokes the actual addon components and their effects so callbacks,
// preservation of the native scene, and the bridge lifecycle are exercised.
function createReactHarness() {
  let activeKey = '', cursor = 0;
  const hooks = new Map();
  const element = (type, props, ...children) => {
    const nextProps = { ...(props || {}) };
    if (children.length) nextProps.children = children.length < 2 ? children[0] : children;
    const childValue = nextProps.children;
    return { type, props: nextProps, children: childValue == null ? [] : Array.isArray(childValue) ? childValue : [childValue] };
  };
  function slot() {
    const list = hooks.get(activeKey) || [];
    hooks.set(activeKey, list);
    const index = cursor++;
    return { list, index };
  }
  const React = {
    createElement: element,
    cloneElement: (node, props, ...children) => element(node.type, { ...node.props, ...props }, ...(children.length ? children : node.children)),
    useState(initial) {
      const { list, index } = slot();
      if (!(index in list)) list[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [list[index].value, next => { list[index].value = typeof next === 'function' ? next(list[index].value) : next; }];
    },
    useRef(initial) {
      const { list, index } = slot();
      if (!(index in list)) list[index] = { value: { current: initial } };
      return list[index].value;
    },
    useMemo(factory, deps) {
      const { list, index } = slot(), old = list[index];
      if (!old || !sameDeps(old.deps, deps)) list[index] = { value: factory(), deps };
      return list[index].value;
    },
    useEffect(effect, deps) {
      const { list, index } = slot(), old = list[index];
      if (!old || !sameDeps(old.deps, deps)) {
        old?.cleanup?.();
        const entry = { deps, cleanup: null };
        list[index] = entry;
        queueMicrotask(() => { entry.cleanup = effect() || null; });
      }
    }
  };
  function sameDeps(a, b) { return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, i) => Object.is(value, b[i])); }
  function render(component, props, key) {
    activeKey = key; cursor = 0;
    return component(props);
  }
  return { React, render, hooks };
}

class FakePort {
  constructor() { this.messages = []; this.onmessage = null; this.closed = false; }
  postMessage(data) { this.messages.push(data); }
  start() {}
  close() { this.closed = true; }
  deliver(data) { this.onmessage?.({ data }); }
}

function browserPlugin({ mvu, battle, fakeTimers = false, noShowStage = false, stageButton = null } = {}) {
  const { React, render, hooks } = createReactHarness();
  let plugin;
  const listeners = [], stageCalls = [], inputs = [], submissions = [], apiCalls = [], channels = [], windowHandlers = new Map();
  const timers = []; let timerId = 0;
  const schedule = fakeTimers ? (fn, delay = 0) => { const timer = { id: ++timerId, fn, delay }; timers.push(timer); return timer.id; } : setTimeout;
  const cancel = fakeTimers ? id => { const index = timers.findIndex(timer => timer.id === id); if (index >= 0) timers.splice(index, 1); } : clearTimeout;
  const assetRoot = 'https://assets.example/pack-file?root=kanto&path=';
  const viewBundle = {
    html: '<html><head><link href="./style.css"></head><body><script src="./app.js"></script></body></html>',
    css: 'body{color:#263b2d}', js: 'window.__KANTO_BUNDLE__=true', assetRoot
  };
  const stageAssets = {
    assetRoot,
    npcPortraits:JSON.parse(fs.readFileSync(path.join(__dirname,'../public/data/npc-portraits.json'),'utf8')),
    trainers: [
      { name: '大木博士', image: 'assets/trainers/official/professor_oak.png', art: 'assets/trainers/official/professor_oak.png', artBounds: { x: 10, y: 20, width: 120, height: 240, canvasWidth: 1024, canvasHeight: 1024 } },
      { name: '赤红', image: 'assets/trainers/official/red.png', art: 'assets/trainers/official/red.png', artBounds: { x: 30, y: 40, width: 100, height: 200, canvasWidth: 1024, canvasHeight: 1024 } },
    ],
    audio: {
      locations: { pallet: 'pallet' },
      events: { opening: 'opening', rivalAppears: 'rival' },
      tracks: {
        opening: { file: 'assets/music/opening.mp3', track: '真新镇' },
        rival: { file: 'assets/music/rival.mp3', track: '劲敌登场' }
      }
    }, css: '.kanto-stage-shell{color:green}'
  };
  const musicCalls = [];
  const ui = {
    registerStageView: view => { ui.stageView = view; },
    registerStageAddon: () => assert.fail('舞台画面由插件自己画，不再扩展原生舞台'),
    registerTextMarker: marker => { ui.marker ||= marker; (ui.markers ||= []).push(marker); },
    registerComposerAction: action => { ui.action = action; },
    registerMessageAction: action => { ui.messageAction = action; },
    registerPanel: () => assert.fail('Battle and roster belong in the stage view'),
    registerStatusSection: () => assert.fail('The MVU HUD belongs in the stage view'),
    openOverlay: options => { ui.overlay = options; return { close() {} }; },
    showStage: id => { ui.shownStage = id; },
    assetUrl: value => `https://assets.example/${value}`,
    getMusicState: () => ({ enabled: true }),
    watchMusic: listener => { ui.musicListener = listener; return () => {}; },
    playMusic: options => musicCalls.push({ type: 'play', ...options }),
    stopMusic: () => musicCalls.push({ type: 'stop' }),
    setMusicEnabled: enabled => { ui.musicEnabled = enabled; },
    watchTurnState: (_gameId, listener) => { listeners.push(listener); return () => {}; },
    setInput: value => inputs.push(value),
    submitInput: async value => { submissions.push(value); return {}; },
    callHost: async (route, data = {}) => {
      apiCalls.push({ route, data });
      if (route.endsWith('/mvu')) return mvu || { writable: true, turn: 1, battleId: 'battle-1', progression: { levelCap: 41 }, shop: { available: true, title: '玉虹百货', items: ['greatball'] }, world: { 训练家: { 姓名: '小智', 金钱: 300, 徽章: [] }, 地图: { 地点: '真新镇', 轮次: 1 }, 队伍: [], 背包: { 物品: {} }, 战斗: { 状态: 'pending' } }, theater: { person: { name: '大木博士', image: 'assets/trainers/official/professor_oak.png' }, pokemon: [], backgroundImage: 'assets/backgrounds/lab.png', dialogue: '欢迎来到宝可梦世界。', options: [{ id: 'start-battle', label: '进入本轮战斗', enabled: true }] } };
      if (route.endsWith('/view')) return viewBundle;
      if (route.endsWith('/stage-assets')) return stageAssets;
      if (route.endsWith('/presentation')) return {};
      if (route.endsWith('/plan')) return {action:data.action,payload:data.payload,playerText:data.action==='travel'?'我和伙伴前往1号道路。':'我在这里继续与伙伴相处。'};
      if (route.endsWith('/intent')) return { id: 'intent-1', playerText: data.playerText||'我握住精灵球，向眼前的对手应战。' };
      if (route.endsWith('/battle')) return battle || { id: 'battle-1', events: [], sides: [] };
      return {};
    }
  };
  if(noShowStage)delete ui.showStage;
  class FakeMessageChannel { constructor() { this.port1 = new FakePort(); this.port2 = new FakePort(); channels.push(this); } }
  const sandbox = {
    window: { __ModuleLoader__: { load: entry => { plugin = entry.factory(name => { assert.equal(name, 'react'); return React; }); } }, addEventListener(type, fn) { windowHandlers.set(type, fn); }, removeEventListener(type) { windowHandlers.delete(type); } },
    crypto: { randomUUID: () => 'fixed-kanto-bridge-nonce' },
    MessageChannel: FakeMessageChannel,
    setTimeout: schedule, clearTimeout: cancel, queueMicrotask, URL, Promise, Map, Set,
    document: {querySelector: selector => selector==='button[aria-label="舞台"]'?stageButton:null},
    globalThis: null
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../client.js'), 'utf8'), sandbox);
  plugin.apply({ tavernUi: ui });
  return { ui, render, hooks, stageCalls, inputs, submissions, apiCalls, listeners, channels, viewBundle, stageAssets, musicCalls, windowHandlers, flushTimers: () => { const pending = timers.splice(0); pending.forEach(timer => timer.fn()); }, timers, setMvu: value => { mvu = value; } };
}

function walk(node, predicate, found = []) {
  if (node == null || typeof node === 'boolean') return found;
  if (Array.isArray(node)) { node.forEach(child => walk(child, predicate, found)); return found; }
  if (typeof node !== 'object') return found;
  if (predicate(node)) found.push(node);
  walk(node.props?.children, predicate, found);
  walk(node.children, predicate, found);
  return found;
}

const tick = () => new Promise(resolve => setImmediate(resolve));

test('without a programmatic stage API the composer uses the existing native stage button',()=>{
 let clicks=0;const app=browserPlugin({noShowStage:true,stageButton:{disabled:false,click(){clicks++;}}});
 app.ui.action.run({gameId:'game-1'});assert.equal(clicks,1);assert.equal(app.ui.overlay,undefined);
 const missing=browserPlugin({noShowStage:true});assert.throws(()=>missing.ui.action.run({gameId:'game-2'}),/页面顶部的「舞台」/);
});

test('native dialogue and invitations stay intact for the host bubble parser',()=>{
 const app=browserPlugin();assert.equal(app.ui.markers.length,1);
 const lines=['@bubble:oak|大木博士|平静|[选择与你一起旅行的伙伴吧！]',
  '@bubble:gary|小茂|得意|[选好了吗？出发之前，先和我打一场！]',
  '@bubble:leaf|叶子|期待|[“来吧。真打一个！”]',
  '@bubble:leaf|叶子|期待|[【进入本轮战斗】]',
  '叶子握住精灵球，准备与你对战。'];
 for(const line of lines){for(const marker of app.ui.markers){marker.pattern.lastIndex=0;assert.equal(marker.pattern.exec(line),null,line);}}
 assert.ok(app.ui.messageAction,'natural invitations retain the separate turn action');
});

test('only standalone markers become controls, leaving neighboring bubble lines whole',()=>{
 const app=browserPlugin(),line='@bubble:gary|小茂|得意|[先和我打一场！]';
 const source=line+'\n\n【进入本轮战斗】\n';
 const transformed=source.replace(app.ui.marker.pattern,'<CONTROL>');
 assert.equal(transformed,line+'\n\n<CONTROL>\n');
});

test('message action submits the whole settled turn for host validation',async()=>{
 const app=browserPlugin(),action=app.ui.messageAction;
 assert.equal(action.id,'kanto-check-battle');assert.equal(action.when({gameId:'game-1',settled:true}),true);
 assert.equal(action.when({gameId:'game-1',settled:false}),false);
 await action.run({gameId:'game-1',turn:7,settled:true});
 assert.ok(app.apiCalls.some(call=>call.route.endsWith('/enter-battle')&&call.data.natural===true&&call.data.turn===7&&!('naturalQuote' in call.data)));
});

test('registers a native stage view; markers and the composer action open it without an overlay', async () => {
  const app = browserPlugin();
  assert.equal(app.ui.stageView.id, 'kanto-native');
  assert.equal(app.ui.stageView.label, '关都剧场');
  assert.equal(typeof app.ui.stageView.render, 'function');
  assert.ok(app.ui.marker.pattern.test('【进入本轮战斗】'));
  const marker = app.ui.marker.render({ gameId: 'game-1', turn: 4, streaming: false, match: '【进入本轮战斗】' });
  const button = walk(app.render(marker.type, marker.props, 'marker-entry'),node=>node.type==='button')[0];
  await button.props.onClick({ stopPropagation() {} });
  assert.ok(app.apiCalls.some(call=>call.route.endsWith('/enter-battle')&&call.data.turn===4));
  assert.equal(app.ui.shownStage, 'game-1', 'the story marker opens the native stage');
  assert.equal(app.ui.overlay, undefined, 'opening a battle never creates a second overlay');
  assert.equal(app.ui.action.id, 'kanto-native-battle');
  app.ui.action.run({ gameId: 'game-2' });
  assert.equal(app.ui.shownStage, 'game-2', 'the composer action opens the stage in its default story mode');
});

test('the in-stage battle marker never falls back to a trainer RP draft',async()=>{
  const app=browserPlugin({mvu:{writable:true,turn:4,world:{训练家:{金钱:100,徽章:[]},地图:{节点:'route1',地点:'1号道路'},队伍:[],战斗:{状态:'finished'}},theater:{options:[{id:'trainer-battle',label:'接受训练家挑战',enabled:true}],dialogue:'一只波波来到路边。'}}});
  const beat={kind:'line',text:'【进入本轮战斗】',turn:4},input={gameId:'game-1',stage:{},beats:[beat],index:0,beat};
  let stage=app.ui.stageView.render(input);app.render(stage.type,stage.props,'direct-stage');await tick();
  stage=app.ui.stageView.render(input);let tree=app.render(stage.type,stage.props,'direct-stage');
  const scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  const sceneTree=app.render(scene.type,scene.props,'direct-scene');
  const enter=walk(sceneTree,node=>node.type==='button'&&[].concat(node.props.children).join('')==='进入本轮战斗')[0];
  enter.props.onClick();await tick();
  tree=app.render(stage.type,stage.props,'direct-stage');
  assert.ok(app.apiCalls.some(call=>call.route.endsWith('/enter-battle')));
  assert.equal(app.apiCalls.some(call=>/\/(plan|intent)$/.test(call.route)),false);
  assert.equal(walk(tree,node=>node.type==='textarea'&&node.props['aria-label']==='行动草稿').length,0);
  assert.equal(app.submissions.length,0);
  assert.equal(tree.props['data-kanto-mode'],'battle');
});

test('the in-stage battle marker is disabled once this battle is settled',async()=>{
  const app=browserPlugin({mvu:{writable:true,turn:4,world:{训练家:{金钱:100,徽章:[]},地图:{节点:'pallet',地点:'真新镇'},队伍:[],战斗:{状态:'finished',结果:'lose',已奖励:true}},theater:{options:[],dialogue:'小茂把精灵球收了回去。'}}});
  const beat={kind:'line',text:'【进入本轮战斗】',turn:4},input={gameId:'game-1',stage:{},beats:[beat],index:0,beat};
  let stage=app.ui.stageView.render(input);app.render(stage.type,stage.props,'direct-stage');await tick();
  stage=app.ui.stageView.render(input);const tree=app.render(stage.type,stage.props,'direct-stage');
  const scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  const sceneTree=app.render(scene.type,scene.props,'direct-scene');
  assert.equal(walk(sceneTree,node=>node.type==='button'&&[].concat(node.props.children).join('')==='进入本轮战斗').length,0);
  const done=walk(sceneTree,node=>node.type==='button'&&[].concat(node.props.children).join('')==='本轮战斗已结束')[0];
  assert.equal(done.props.disabled,true);
  assert.equal(app.apiCalls.some(call=>call.route.endsWith('/enter-battle')),false);
});

test('stage view draws cropped art and edits an RP action before explicitly sending it', async () => {
  const app = browserPlugin({mvu:{writable:true,turn:1,progression:{levelCap:41},shop:{available:true},world:{训练家:{金钱:300,徽章:[]},地图:{节点:'pallet',地点:'真新镇',轮次:1},战斗:{状态:'finished'},队伍:[]},theater:{person:{name:'大木博士'},pokemon:[],backgroundImage:'assets/backgrounds/lab.png',options:[{id:'travel',label:'前往1号道路',enabled:true,payload:{node:'route1'}}]}}});
  const line = { kind: 'line', speaker: '大木博士', text: '欢迎来到宝可梦世界。' };
  const footer = { type: 'aside', props: { className: 'host-stage-footer' }, children: ['宿主原生控制'] };
  const sceneRef={current:null};
  const input = { gameId: 'game-1', stage: {}, beats: [line], index: 0, beat: line, fullscreen: true, advance() {}, footer,sceneRef };
  let stageElement = app.ui.stageView.render(input);
  assert.equal(stageElement.type.name, 'NativeStage');
  let tree = app.render(stageElement.type, stageElement.props, 'stage');
  assert.equal(tree.props['data-kanto-native-stage'], true);
  assert.ok(walk(tree, node => node.type === 'header' && node.props.className === 'kanto-stage-header').length);
  assert.ok(walk(tree, node => node.type === 'div' && node.props.className === 'kanto-stage-viewport').length);
  assert.ok(walk(tree, node => node.type === 'div' && node.props.className === 'kanto-stage-dock').length);
  assert.ok(walk(tree, node => node.type === 'style').length);
  await tick();
  stageElement = app.ui.stageView.render(input);
  tree = app.render(stageElement.type, stageElement.props, 'stage');
  assert.ok(walk(tree, node => node.type === 'button' && node.children.join('') === '走进商店').length, 'shop availability is read from the top-level MVU response');
  assert.ok(walk(tree, node => node.type === 'span' && node.children.join('').includes('上限 Lv.41')).length, 'the stage header reads the top-level progression cap');
  const sceneElement = walk(tree, node => node.type?.name === 'TheaterScene')[0];
  assert.ok(sceneElement, 'the plugin owns the scene instead of borrowing the native one');
  const theater = app.render(sceneElement.type, sceneElement.props, 'theater');
  assert.equal(theater.props.ref,sceneRef,'the native director can animate this same scene and its named actors');
  assert.ok(walk(theater, node => node.props?.className === 'kanto-theater').length, 'the theater is drawn by the plugin');
  assert.ok(walk(theater, node => node.props?.className === 'host-stage-footer').length, 'the native stage footer is preserved inside the story controls');
  const backdrop = walk(theater, node => node.props?.className === 'kanto-theater-bg' && node.props.style?.backgroundImage)[0];
  assert.ok(backdrop && backdrop.props.style.backgroundImage.includes('?root=kanto&path=assets/backgrounds/lab.png'), 'the scene background uses the card media-pack root');
  const oakElement = walk(theater, node => node.type?.name === 'Portrait')[0];
  const oakTree = app.render(oakElement.type, oakElement.props, 'oak-portrait');
  const oak = walk(oakTree, node => node.type === 'svg' && node.props.viewBox === '10 20 120 240')[0];
  assert.ok(oak, 'manifest bounds crop transparent canvas margins around the speaker portrait');
  assert.ok(walk(oak, node => node.type === 'image' && String(node.props.href).includes('?root=kanto&path=assets/trainers/official/professor_oak.png')).length, 'the portrait comes from the card asset pack');
  const text = walk(theater, node => String(node.props?.className||'').includes('kanto-theater-text'))[0];
  assert.equal([].concat(text.children).join(''), '欢迎来到宝可梦世界。');
  assert.equal(tree.props.style.height, '100%', 'stage content fills the host-provided stage container');

  // 角色素材（卡里登记的立绘）优先于剧场里单个人物图，和原生舞台用的是同一套。
  const redLine = { kind: 'line', speaker: '赤红', text: '那就走吧。' };
  const redInput = { ...input, beats: [redLine], index: 0, beat: redLine, stage: { characters: [{ name: '赤红', aliases: ['Red'], avatarUrl: 'https://assets.example/plugin-assets/dsh-card-pokemon-frlg-stage/web/generated/red.png', sprites: { neutral: 'https://assets.example/plugin-assets/dsh-card-pokemon-frlg-stage/web/generated/red.png' } }] } };
  const redTree = app.render(stageElement.type, app.ui.stageView.render(redInput).props, 'stage');
  const redScene = walk(redTree, node => node.type?.name === 'TheaterScene')[0];
  const redTheater = app.render(redScene.type, redScene.props, 'red-theater');
  const redElement = walk(redTheater, node => node.type?.name === 'Portrait')[0];
  const redPortrait = app.render(redElement.type, redElement.props, 'red-portrait');
  assert.ok(walk(redPortrait, node => node.type === 'svg' && node.props.viewBox === '30 40 100 200').length, 'the current manifest portrait supersedes an older generated character image');

  const battleOption = walk(tree, node => node.type === 'button' && [].concat(node.props.children).join('') === '前往1号道路')[0];
  assert.ok(battleOption, 'scene options stay clickable in the dock');
  battleOption.props.onClick({ stopPropagation() {} });
  await tick();
  stageElement = app.ui.stageView.render(input); tree = app.render(stageElement.type, stageElement.props, 'stage');
  assert.equal(walk(tree, node => node.type?.name === 'BattleFrame').length, 0, 'choosing an action only previews RP and does not mutate MVU');
  assert.equal(app.apiCalls.some(call => call.route.endsWith('/intent')), false);
  const draft=walk(tree,node=>node.type==='textarea'&&node.props['aria-label']==='行动草稿')[0];
  assert.ok(draft,'the prepared action is editable in the same stage');
  draft.props.onChange({target:{value:'我和伙伴沿着小路，慢慢前往1号道路。'}});
  tree=app.render(stageElement.type,stageElement.props,'stage');
  const confirm = walk(tree, node => node.type === 'button' && [].concat(node.props.children).join('') === '发送并继续剧情')[0];
  assert.ok(confirm);
  confirm.props.onClick({ stopPropagation() {} });
  await tick(); await tick();
  assert.equal(app.apiCalls.filter(call => call.route.endsWith('/intent')).length, 1, 'intent is queued only after confirmation');
  assert.equal(app.submissions.length, 1, 'confirmed RP is sent through the native input flow');
  assert.equal(app.submissions[0].text,'我和伙伴沿着小路，慢慢前往1号道路。');
  assert.equal(app.apiCalls.find(call=>call.route.endsWith('/intent')).data.playerText,app.submissions[0].text);
  assert.equal(app.apiCalls.some(call => call.route.endsWith('/scene')), false, 'the preview does not directly mutate the world through a scene route');

});

test('a writable MVU pending arrival switches the same stage viewport to battle on the last beat', async () => {
  const app = browserPlugin({ fakeTimers: true, mvu: {
    writable: true, turn: 3, battleId: 'battle-3', progression: { levelCap: 41 }, shop: { available: true, items: ['greatball'] },
    world: { 训练家: { 姓名: '小智', 金钱: 300, 徽章: [] }, 地图: { 节点: 'pallet', 地点: '真新镇', 轮次: 3 }, 队伍: [{ 图鉴编号: 1, 昵称: '妙蛙种子', 当前HP: 20 }], 背包: { 物品: {} }, 战斗: { 状态: 'pending', 剧情入场: true } },
    theater: { id: 'rival-opening', person: { name: '小茂', image: 'assets/trainers/official/blue.png' }, pokemon: [], backgroundImage: 'assets/backgrounds/lab.png', dialogue: '对手已经来到场地。', options: [] }
  } });
  const arrivalBeat = { kind: 'line', text: '小茂向你挑战！', turn: 3 };
  const input = { gameId: 'game-1', stage: {}, beats: [arrivalBeat], index: 0, beat: arrivalBeat, footer: null };
  let element = app.ui.stageView.render(input), tree = app.render(element.type, element.props, 'arrival-stage');
  await tick(); await tick();
  element = app.ui.stageView.render(input); tree = app.render(element.type, element.props, 'arrival-stage');
  await tick();
  assert.ok(app.timers.some(timer => timer.delay >= 2200), 'the stage allows the current arrival line to play before changing modes');
  app.flushTimers();
  await tick();
  element = app.ui.stageView.render(input); tree = app.render(element.type, element.props, 'arrival-stage');
  assert.equal(tree.props['data-kanto-mode'], 'battle', JSON.stringify(app.hooks.get('arrival-stage')?.map(x => x?.deps||x?.value)));
  assert.ok(walk(tree, node => node.type?.name === 'BattleFrame').length, 'pending encounter opens the BattleFrame in the theater viewport');
});

test('stage view skips initialisation payload lines and shows the theatre dialogue instead', async () => {
  const app = browserPlugin({ mvu: {
    writable: true, turn: 1,
    world: { 训练家: { 姓名: '小智', 金钱: 300, 徽章: [] }, 地图: { 节点: 'pallet', 地点: '真新镇', 轮次: 1 }, 队伍: [], 背包: { 物品: {} }, 战斗: { 状态: 'pending' } },
    theater: { id: 'oak-lab', person: { name: '大木博士', image: 'assets/trainers/oak.png' }, pokemon: [], backgroundImage: 'assets/backgrounds/lab.png', dialogue: '欢迎来到宝可梦世界。', options: [] }
  } });
  const beats = [
    { kind: 'line', text: '真新镇的夏风穿过窗户。' },
    { kind: 'line', text: '{\n  "$meta": { "strictSet": true },\n  "宝可梦": { "版本": 1 }\n}' },
    { kind: 'line', text: '大木博士把三枚精灵球推到桌前。' }
  ];
  let advanced = 0;
  const input = { gameId: 'game-1', stage: {}, beats, index: 1, beat: beats[1], advance: () => { advanced += 1; }, footer: null };
  const element = app.ui.stageView.render(input);
  app.render(element.type, element.props, 'payload-stage');
  await tick(); await tick();
  assert.ok(advanced >= 1, 'a payload line is skipped instead of being shown as narration');
  const input2 = { ...input, index: 2, beat: beats[2] };
  const tree = app.render(element.type, app.ui.stageView.render(input2).props, 'payload-stage');
  const sceneElement = walk(tree, node => node.type?.name === 'TheaterScene')[0];
  const theater = app.render(sceneElement.type, sceneElement.props, 'payload-theater');
  const text = walk(theater, node => String(node.props?.className||'').includes('kanto-theater-text'))[0];
  assert.ok(!/\$meta|"宝可梦"/.test([].concat(text.children).join('')), 'state payload never reaches the dialogue box');
});

test('native stage maps story music by scene and stops it when the battle view opens', async () => {
  const app = browserPlugin({ mvu: {
    writable: true, turn: 1,
    world: { 训练家: { 姓名: '小智', 金钱: 300, 徽章: [] }, 地图: { 节点: 'pallet', 地点: '真新镇', 轮次: 1 }, 队伍: [], 背包: { 物品: {} }, 战斗: { 状态: 'pending' } },
    theater: { id: 'oak-lab', person: { name: '大木博士', image: 'assets/trainers/oak.png' }, pokemon: [], backgroundImage: 'assets/backgrounds/lab.png', dialogue: '欢迎来到宝可梦世界。', options: [] }
  } });
  const blank = { gameId: 'game-1', stage: {}, beats: [], index: 0, beat: null };
  let addon = app.ui.stageView.render(blank);
  app.render(addon.type, addon.props, 'music-stage');
  await tick(); await tick();
  addon = app.ui.stageView.render(blank);
  app.render(addon.type, addon.props, 'music-stage');
  await tick();
  assert.ok(app.musicCalls.some(call => call.type === 'play' && call.url === 'https://assets.example/pack-file?root=kanto&path=assets/music/opening.mp3' && call.title === '真新镇'), 'scene audio resolves through the media-pack query root');
  const marker = app.ui.marker.render({ gameId: 'game-1', streaming: false, match: '【进入本轮战斗】' });
  await walk(app.render(marker.type, marker.props, 'music-battle-marker'),node=>node.type==='button')[0].props.onClick({ stopPropagation() {} });
  addon = app.ui.stageView.render(blank);
  app.render(addon.type, addon.props, 'music-stage');
  await tick();
  assert.ok(app.musicCalls.some(call => call.type === 'stop'), 'opening battle playback stops native stage music');
});

test('API 7 native BGM remains the sole owner in story and battle, including director silence',async()=>{
 const app=browserPlugin();app.ui.apiVersion=7;
 const input={gameId:'native-bgm-game',stage:{music:null},beats:[],index:0,beat:null};
 let node=app.ui.stageView.render(input);app.render(node.type,node.props,'native-bgm');
 await tick();await tick();node=app.ui.stageView.render(input);const story=app.render(node.type,node.props,'native-bgm');await tick();
 assert.equal(app.musicCalls.filter(call=>call.type==='play').length,0);
 assert.ok(app.musicCalls.some(call=>call.type==='stop'),'legacy plugin transport is released');
 assert.ok(walk(story,n=>n.type==='span'&&n.props.children==='音乐由原生舞台控制').length);
 const marker=app.ui.marker.render({gameId:input.gameId,turn:1,match:'【进入本轮战斗】',streaming:false});
 await walk(app.render(marker.type,marker.props,'native-bgm-entry'),n=>n.type==='button')[0].props.onClick({stopPropagation(){}});
 node=app.ui.stageView.render({...input,stage:{music:{identity:'native-track',url:'https://native.example/track.ogg'}}});
 const battleTree=app.render(node.type,node.props,'native-bgm');await tick();
 const frame=walk(battleTree,n=>n.type?.name==='BattleFrame')[0];assert.equal(frame.props.musicManaged,true);
 app.render(frame.type,frame.props,'native-bgm-frame');await tick();
 const loaded=app.render(frame.type,frame.props,'native-bgm-frame');
 const iframe=walk(loaded,n=>n.type==='iframe')[0];assert.ok(iframe.props.srcDoc.includes('"musicManaged":true'),'ownership is embedded before iframe audio initializes');
 assert.equal(app.musicCalls.filter(call=>call.type==='play').length,0);
});

test('battle frame refreshes securely and completion never requests a report or writes composer text', async () => {
  const app = browserPlugin();
  // A story marker opens the same native stage directly in battle mode.
  const marker = app.ui.marker.render({ gameId: 'game-1', streaming: false, match: '【进入本轮战斗】' });
  await walk(app.render(marker.type, marker.props, 'bridge-marker'),node=>node.type==='button')[0].props.onClick({ stopPropagation() {} });
  const stageInput = { gameId: 'game-1', stage: {}, beats: [], index: 0, beat: null };
  const native = app.ui.stageView.render(stageInput);
  const nativeTree = app.render(native.type, native.props, 'stage-battle');
  const frameElement = walk(nativeTree, node => node.type === 'BattleFrame' || node.type?.name === 'BattleFrame')[0];
  assert.equal(frameElement.type.name, 'BattleFrame');
  let tree = app.render(frameElement.type, frameElement.props, 'frame');
  await tick();
  tree = app.render(frameElement.type, frameElement.props, 'frame');
  const iframe = walk(tree, node => node.type === 'iframe')[0];
  assert.ok(iframe);
  const iframeWindow = { postMessage: (...args) => { iframeWindow.lastPost = args; } };
  const eventTarget = { handlers: new Map(), addEventListener(type, fn) { this.handlers.set(type, fn); }, removeEventListener(type) { this.handlers.delete(type); }, MessageChannel: class { constructor() { this.port1 = new FakePort(); this.port2 = new FakePort(); app.channels.push(this); } } };
  iframe.props.ref.current = { ownerDocument: { defaultView: eventTarget }, contentWindow: iframeWindow };
  await tick(); // React commits the iframe ref before running layout/effects.
  iframe.props.onLoad();
  const channel = app.channels[0], nonce = 'fixed-kanto-bridge-nonce';
  assert.equal(iframeWindow.lastPost[0].type, 'bridge-connect');
  assert.equal(iframeWindow.lastPost[0].bridge, nonce);
  assert.equal(iframeWindow.lastPost[1], '*');
  channel.port1.deliver({ channel: 'kanto-mvu', bridge: 'wrong', type: 'bridge-connected' });
  assert.equal(channel.port1.messages.some(message => message.type === 'bridge-ready'), false, 'a wrong nonce is ignored');
  channel.port1.deliver({ channel: 'kanto-mvu', bridge: nonce, type: 'bridge-connected' });
  assert.equal(channel.port1.messages.at(-1).type, 'bridge-ready');
  assert.deepEqual(JSON.parse(JSON.stringify(channel.port1.messages.find(message => message.type === 'audio-settings'))), {
    channel: 'kanto-mvu', bridge: nonce, type: 'audio-settings', music: true, effects: true, speed: 1, reducedEffects: false
  }, 'the iframe receives current audio settings over the authenticated bridge');

  const receive = eventTarget.handlers.get('message');
  assert.equal(typeof receive, 'function', 'window messages are subscribed from the iframe owner window');
  receive({ source: {}, data: { channel: 'kanto-mvu', bridge: nonce, type: 'battle-finished', battleId: 'battle-1' } });
  await tick();
  assert.equal(app.apiCalls.filter(call => call.route.endsWith('/report')).length, 0, 'foreign iframe source cannot trigger host writes');
  const source = iframe.props.ref.current.contentWindow;
  const finishedMessage = { channel: 'kanto-mvu', bridge: nonce, type: 'battle-finished', battleId: 'battle-1' };
  receive({ source, data: { ...finishedMessage, bridge: 'wrong' } });
  await tick();
  assert.equal(app.apiCalls.filter(call => call.route.endsWith('/report')).length, 0);
  receive({ source, data: finishedMessage });
  await tick();
  receive({ source, data: finishedMessage });
  await tick();
  assert.equal(app.apiCalls.filter(call => call.route.endsWith('/report')).length, 0, 'battle completion does not call a report route');
  assert.equal(app.inputs.length, 0, 'battle completion leaves the player composer untouched');
  assert.equal(app.submissions.length, 0, 'battle completion never submits generated text');

  const watch = app.listeners.at(-1);
  assert.ok(watch);
  watch({ textVersion: '2', turn: 2, busy: false, settled: true });
  assert.equal(channel.port1.messages.at(-1).type, 'mvu-refresh');
  const refreshed = app.render(frameElement.type, frameElement.props, 'frame');
  const nextIframe = walk(refreshed, node => node.type === 'iframe')[0];
  assert.equal(nextIframe.props.ref, iframe.props.ref, 'watch updates keep the same iframe ref instead of remounting it');
  const audioUpdated = app.render(frameElement.type, { ...frameElement.props, musicEnabled: false, effectsEnabled: false }, 'frame');
  await tick();
  const sameFrameAfterAudioUpdate = walk(audioUpdated, node => node.type === 'iframe')[0];
  assert.equal(sameFrameAfterAudioUpdate.props.ref, iframe.props.ref, 'audio preference changes do not replace the iframe ref');
  assert.deepEqual(JSON.parse(JSON.stringify(channel.port1.messages.at(-1))), {
    channel: 'kanto-mvu', bridge: nonce, type: 'audio-settings', music: false, effects: false, speed: 1, reducedEffects: false
  }, 'updated settings are bridged to the existing iframe');

  receive({ source, data: { channel: 'kanto-mvu', bridge: nonce, type: 'presentation-change', speed: 4, effects: false, reducedEffects: true } });
  await tick();
  const refreshedStage = app.ui.stageView.render(stageInput);
  const refreshedTree = app.render(refreshedStage.type, refreshedStage.props, 'stage-battle');
  const updatedFrame = walk(refreshedTree, node => node.type?.name === 'BattleFrame')[0];
  assert.equal(updatedFrame.props.animationSpeed, 4, 'trusted iframe preference changes reach the native stage owner');
  assert.equal(updatedFrame.props.effectsEnabled, false);
  assert.equal(updatedFrame.props.reducedEffects, true);
  await tick(); // NativeStage persists the updated values in the per-game session.

  const reopenedStage = app.ui.stageView.render(stageInput);
  const reopenedTree = app.render(reopenedStage.type, reopenedStage.props, 'stage-reopened');
  const reopenedFrame = walk(reopenedTree, node => node.type?.name === 'BattleFrame')[0];
  assert.equal(reopenedFrame.props.animationSpeed, 4, 'speed is restored when the native stage is mounted again');
  assert.equal(reopenedFrame.props.effectsEnabled, false);
  assert.equal(reopenedFrame.props.reducedEffects, true);
});






test('fragmented MVU JSON keys and braces never appear as theater dialogue',async()=>{
  const app=browserPlugin();let advanced=0;
  const beats=[{text:'研究所里传来脚步声。'},{text:'"区域": "关都",'},{text:'小茂走了进来。'}];
  const element=app.ui.stageView.render({gameId:'game-json',stage:{},beats,index:1,beat:beats[1],advance:()=>advanced++});
  app.render(element.type,element.props,'json-stage');await tick();await tick();
  const tree=app.render(element.type,element.props,'json-stage');
  const scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  const rendered=app.render(scene.type,scene.props,'json-scene');
  const text=walk(rendered,node=>String(node.props?.className||'').includes('kanto-theater-text'))[0];
  assert.doesNotMatch(text.children.join(''),/"区域"|"关都"/);
  assert.ok(advanced>=1,'a fragmented key/value line is skipped');
});


test('native previous/next controls and progress skip split variable pages in both directions',async()=>{
  const app=browserPlugin();let backs=0,nexts=0;
  const beats=[{text:'大木博士打开了门。'},{text:'"$meta": {'},{text:'"strictSet": true'},{text:'},'},{text:'"区域": "关都",'},{text:'小茂走了进来。'}];
  const footer={type:'div',props:{children:[{type:'button',props:{'aria-label':'上一句',onClick:()=>backs++},children:[]},{type:'span',props:{className:'dsh-tavern-stage-progress',children:'6 / 6'},children:['6 / 6']},{type:'button',props:{'aria-label':'下一句',onClick:()=>nexts++},children:[]}]}};
  const renderAt=index=>{const element=app.ui.stageView.render({gameId:'game-controls',stage:{},beats,index,beat:beats[index],footer,advance:()=>nexts++});return app.render(element.type,element.props,'control-stage');};
  renderAt(5);await tick();await tick();
  let tree=renderAt(5),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  const previous=walk(scene.props.footer,node=>node.props?.['aria-label']==='上一句')[0];previous.props.onClick({});
  assert.equal(backs,5,'one previous click returns to the previous readable sentence');
  const progress=walk(scene.props.footer,node=>node.props?.className==='dsh-tavern-stage-progress')[0];assert.equal(progress.children.join(''),'2 / 2');
  tree=renderAt(0);scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  walk(scene.props.footer,node=>node.props?.['aria-label']==='下一句')[0].props.onClick({});assert.equal(nexts,5,'one next click skips the complete variable block');
});


test('an unlisted speaking shop clerk receives a clearly marked generic trainer portrait',async()=>{
  const app=browserPlugin();app.stageAssets.trainers.push({id:'gentleman',name:'绅士',role:'绅士',image:'assets/trainers/gentleman.png'});
  const line={speaker:'女店员阿明',text:'欢迎光临，货架上有旅行补给。'};
  const element=app.ui.stageView.render({gameId:'shop-actor',stage:{stage:{figures:[{speaker:line.speaker}]}},beats:[line],beat:line,index:0});
  app.render(element.type,element.props,'clerk-stage');await tick();await tick();
  const tree=app.render(element.type,element.props,'clerk-stage'),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  const theater=app.render(scene.type,scene.props,'clerk-theater'),portrait=walk(theater,node=>node.type?.name==='Portrait')[0];
  assert.equal(portrait.props.person.name,'女店员阿明');assert.equal(portrait.props.person.generic,true);assert.ok(portrait.props.person.url);assert.doesNotMatch(portrait.props.person.url,/gentleman\.png/);const match=app.stageAssets.npcPortraits.entries.find(item=>item.id===portrait.props.person.portraitId);assert.equal(match.gender,'female');
});

test('generic portrait selection enforces elder and child identity and ignores native figure art',async()=>{
  const app=browserPlugin();
  const renderPortrait=async(name,text,characters=[])=>{
    const beat={speaker:name,text},input={gameId:'traits-'+name,stage:{characters,stage:{figures:[{speaker:name}]}},beats:[beat],beat,index:0};
    let element=app.ui.stageView.render(input);app.render(element.type,element.props,'traits-'+name);await tick();await tick();
    element=app.ui.stageView.render(input);const tree=app.render(element.type,element.props,'traits-'+name),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
    return walk(app.render(scene.type,scene.props,'traits-theater-'+name),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0]?.props.person;
  };
  const forbiddenSprite='https://assets.example/Lusamine.png';
  const oldMan=await renderPortrait('老汉','他在田边休息。',[{name:'老汉',avatarUrl:forbiddenSprite}]);
  assert.equal(oldMan.portraitId,'elder_man_v1');
  assert.notEqual(oldMan.url,forbiddenSprite);
  const oldWoman=await renderPortrait('老奶奶','她坐在长椅上。');
  assert.equal(oldWoman.portraitId,'elder_woman_v1','the generic elder woman is used instead of named Agatha or a young woman');
  const child=await renderPortrait('男孩','他拿着精灵球。');
  assert.ok(['boy','child'].includes(app.stageAssets.npcPortraits.entries.find(item=>item.id===child.portraitId).age));
});

test('ordinary unknown NPCs get stable adult portraits and caches are reselected when traits change',async()=>{
  const app=browserPlugin();
  const renderPortrait=async(name,text,gameId='trait-cache')=>{
    const beat={speaker:name,text},input={gameId,stage:{stage:{figures:[{speaker:name}]}},beats:[beat],beat,index:0};
    let element=app.ui.stageView.render(input);app.render(element.type,element.props,'cache-stage');await tick();await tick();
    element=app.ui.stageView.render(input);const tree=app.render(element.type,element.props,'cache-stage'),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
    return walk(app.render(scene.type,scene.props,'cache-theater'),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0]?.props.person;
  };
  const unknown=await renderPortrait('神秘来客','沉默地看着远方。','unknown-scene');
  assert.ok(unknown.url&&!unknown.unmatched,'an ordinary unnamed visitor gets a conservative adult fallback instead of an empty stage slot');
  const same=await renderPortrait('神秘来客','沉默地看着远方。','unknown-scene');
  assert.equal(same.portraitId,unknown.portraitId,'the same anonymous identity remains stable across renders');
  const male=await renderPortrait('居民','一位成年男子递来一颗树果。');
  assert.equal(app.stageAssets.npcPortraits.entries.find(item=>item.id===male.portraitId).gender,'male');
  const female=await renderPortrait('居民','一位成年女子递来一颗树果。');
  assert.equal(app.stageAssets.npcPortraits.entries.find(item=>item.id===female.portraitId).gender,'female','a same-identity cache entry is invalidated when the inferred gender changes');
});

test('named trainer-class art wins over generic profiles and anonymous people never borrow child, elder, villain or reference art',async()=>{
 const app=browserPlugin(),manifest=require('../public/data/trainers.json');app.stageAssets.trainers.push(...manifest.filter(entry=>entry.id==='bug_catcher'));
 const renderPortrait=async(name,text,characters=[],gameId='portrait-priority')=>{
  const beat={speaker:name,text},input={gameId,stage:{characters,stage:{figures:[{speaker:name}]}},beats:[beat],beat,index:0};
  let element=app.ui.stageView.render(input);app.render(element.type,element.props,'priority-'+gameId);await tick();await tick();
  element=app.ui.stageView.render(input);const tree=app.render(element.type,element.props,'priority-'+gameId),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  return walk(app.render(scene.type,scene.props,'priority-theater-'+gameId),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0]?.props.person;
 };
 const catcher=await renderPortrait('捕虫少年','我最擅长捕虫！');
 assert.match(catcher.url,/assets\/trainers\/project-original\/bug-catcher-v1\.png$/,'the profession-specific transparent full-body original stays ahead of generic boy art');
 assert.equal(catcher.portraitId,undefined);
 const male=await renderPortrait('训练家','低沉的男声从路边传来。',[],'plain-trainer');
 const maleSource=app.stageAssets.npcPortraits.entries.find(entry=>entry.id===male.portraitId);
 assert.equal(maleSource.gender,'male');assert.equal(maleSource.age,'adult');
 const jacket=await renderPortrait('穿深色外套的人','他朝你点了点头。',[],'dark-jacket');
 const jacketSource=app.stageAssets.npcPortraits.entries.find(entry=>entry.id===jacket.portraitId);
 assert.equal(jacketSource.gender,'male');assert.equal(jacketSource.age,'adult');
 const visitor=await renderPortrait('神秘来客','沉默地看着远方。',[],'plain-visitor');
 const visitorSource=app.stageAssets.npcPortraits.entries.find(entry=>entry.id===visitor.portraitId);
 assert.equal(visitorSource.age,'adult');assert.notEqual(visitorSource.displayEligible,false);
 assert.doesNotMatch((visitorSource.roles||[]).join(','),/rocket|aqua|magma|villain|thug/);
 assert.doesNotMatch(visitorSource.id,/reference|oak|agatha/i);
});

test('nonpixel catalogue class art overrides only matching pixel-size stage cards',async()=>{
 const app=browserPlugin(),manifest=require('../public/data/trainers.json');app.stageAssets.trainers.push(...manifest.filter(entry=>['cool_trainer_m','cool_trainer_f','swimmer_m','swimmer_f','fisherman'].includes(entry.id)));
 const cases=[['精英训练家（男）','cool_trainer_m','ace_trainer_male'],['精英训练家（女）','cool_trainer_f','ace_trainer_female'],['游泳者（男）','swimmer_m','swimmer_male'],['游泳者（女）','swimmer_f','swimmer_female'],['钓鱼人','fisherman','fisherman_oras']];
 for(const [name,id,sourceId] of cases){
  const trainer=manifest.find(entry=>entry.id===id),profile=app.stageAssets.npcPortraits.entries.find(entry=>entry.id===sourceId);
  const expectedArt=trainer.stageArt||profile.image;
  assert.ok(trainer.image!==expectedArt&&expectedArt,name);
  const beat={speaker:name,text:'伙伴已经准备好了。'},input={gameId:`stage-class-${id}`,stage:{stage:{figures:[{speaker:name}]}},beats:[beat],beat,index:0};
  let element=app.ui.stageView.render(input);app.render(element.type,element.props,`stage-class-${id}`);await tick();await tick();
  element=app.ui.stageView.render(input);const tree=app.render(element.type,element.props,`stage-class-${id}`),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0],actor=walk(app.render(scene.type,scene.props,`stage-class-theater-${id}`),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0].props.person;
  assert.ok(actor.url.endsWith(expectedArt),name);assert.equal(actor.fullBody,trainer.fullBody??profile.fullBody,name);
 }
 const catcher=manifest.find(entry=>entry.id==='bug_catcher');assert.equal(catcher.stageArt,'assets/trainers/project-original/bug-catcher-v1.png','the bug catcher class uses its new profession-specific nonpixel artwork');
});

test('all 210 trainer manifests render only real nonpixel stage images and nonpixel fallbacks',async()=>{
 const app=browserPlugin(),manifest=require('../public/data/trainers.json');app.stageAssets.trainers.push(...manifest);
 const checked=[];
 for(let index=0;index<manifest.length;index++){
  const entry=manifest[index],beat={speaker:entry.name,text:'伙伴已经准备好了。'},input={gameId:`manifest-pixel-audit-${index}`,stage:{stage:{figures:[{speaker:entry.name}]}},beats:[beat],beat,index:0};
  let element=app.ui.stageView.render(input);app.render(element.type,element.props,`manifest-pixel-stage-${index}`);await tick();await tick();
  element=app.ui.stageView.render(input);const tree=app.render(element.type,element.props,`manifest-pixel-stage-${index}`),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];assert.ok(scene,entry.id);
  const person=walk(app.render(scene.type,scene.props,`manifest-pixel-scene-${index}`),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0]?.props.person;assert.ok(person?.url,entry.id);
  assert.ok(person.fallbacks.length>=2,`${entry.id} keeps at least two usable fallback URLs`);
  const urls=person.sources.map(source=>source.url);assert.ok(urls.length>=3,entry.id);
  const imagePaths=urls.map(url=>{
   const at=url.indexOf('assets/trainers/');assert.ok(at>=0,`${entry.id} uses a local trainer asset URL`);
    return decodeURIComponent(url.slice(at).split(/[?#&]/)[0]);
  });
  for(const relative of imagePaths){
   const data=fs.readFileSync(path.join(__dirname,'../public',relative));assert.equal(data.toString('ascii',1,4),'PNG',`${entry.id}: ${relative}`);
   assert.ok(data.readUInt32BE(16)>128&&data.readUInt32BE(20)>128,`${entry.id} excludes pixel-size art ${relative}`);
  }
  const originalStageImage=entry.stageArt||entry.art||entry.image;
  const actualPixel=entry.stagePixel===true||/^(?:front|back|sprite)(?:[-_ ]|$)/i.test(entry.spriteType||'')||imagePaths.some(relative=>relative===originalStageImage&&(/^(?:front|back|sprite)(?:[-_ ]|$)/i.test(entry.spriteType||'')||entry.stagePixel));
  if(actualPixel){
   assert.equal(person.generic,true,`${entry.id} moves to age/gender-matched nonpixel art`);assert.equal(imagePaths.includes(originalStageImage),false,`${entry.id} never falls back to its pixel source`);
   const fallback=app.stageAssets.npcPortraits.entries.find(item=>item.id===person.portraitId);assert.ok(fallback,entry.id);assert.equal(fallback.gender,entry.gender,entry.id);
   const fallbackAge=fallback.age==='older-adult'?'elder':fallback.age==='boy'&&['camper','youngster'].some(role=>fallback.roles.includes(role))||fallback.age==='girl'&&['lass','teen-trainer','punk-girl'].some(role=>fallback.roles.includes(role))?'teen':['boy','girl','child'].includes(fallback.age)?'child':fallback.age;
   assert.equal(fallbackAge,entry.ageGroup||entry.age,`${entry.id} fallback preserves its age bracket`);
  }
  checked.push(entry.id);
 }
 assert.equal(checked.length,manifest.length);
});

test('generic full-body portraits cover age, gender and occupation across anonymous dialogue speakers',async()=>{
 const app=browserPlugin();
 const cases=[['老汉','他拄着手杖。','male','elder'],['老妇人','她提着篮子。','female','elder'],['男店员','欢迎光临。','male','adult'],['女店员','欢迎光临。','female','adult'],['男孩','我要去旅行。','male','child'],['女孩','我也带着伙伴。','female','child'],['男研究员','样本已经送到了。','male','adult'],['女研究员','报告已经完成。','female','adult'],['穿灰工装的男人','请等一下。','male','adult']];
 for(const [name,text,gender,age] of cases){
  const beat={speaker:name,text},input={gameId:'coverage-'+name,stage:{characters:[{name,avatarUrl:'https://example.com/wrong-female.png'}],stage:{figures:[{speaker:name}]}},beats:[beat],beat,index:0};
  const element=app.ui.stageView.render(input);app.render(element.type,element.props,'coverage-'+name);await tick();await tick();
  const tree=app.render(element.type,element.props,'coverage-'+name),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  const actor=walk(app.render(scene.type,scene.props,'coverage-scene-'+name),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0].props.person;
  const source=app.stageAssets.npcPortraits.entries.find(entry=>entry.id===actor.portraitId);assert.ok(source,name);assert.equal(source.gender,gender,name);assert.equal(source.age,age,name);
  assert.equal(source.fullBody,true,name);assert.ok(source.tags.includes('project-original'),name);assert.doesNotMatch(actor.url,/wrong-female|pixel/);
  if(/研究员/.test(name))assert.ok(source.roles.includes('scientist'));
 }
});

test('one hundred plus role descriptions always resolve a same-age same-gender portrait with two fallbacks',async()=>{
 const app=browserPlugin(),manifest=require('../public/data/trainers.json');app.stageAssets.trainers.push(...manifest.filter(item=>item.id==='manga-green'));const descriptions=[
  ['年长男性居民','他拄着手杖。','male','elder'],['老汉','他在田边休息。','male','elder'],['老人男性','他朝你点头。','male','elder'],['老人女性','她提着篮子。','female','elder'],['老妇人','她坐在长椅上。','female','elder'],['老妇','她慢慢走来。','female','elder'],
  ['男孩','他拿着精灵球。','male','child'],['捕虫少年','他带着虫网。','male','child'],['男童训练家','他准备挑战。','male','child'],['女孩','她也带着伙伴。','female','child'],['小黄儿童','她戴着草帽。','female','child'],['女童训练家','她检查图鉴。','female','child'],
  ['少年','他追着波波跑。','male','teen'],['男学生','他朝你微笑。','male','teen'],['少女','她站在路边。','female','teen'],['女学生','她拿着地图。','female','teen'],
  ['成年男性训练家','他带着伙伴。','male','adult'],['穿深色外套的男人','他朝你点了点头。','male','adult'],['成年女性训练家','她带着伙伴。','female','adult'],['穿深色外套的女人','她朝你点头。','female','adult'],
  ['男研究员','他在检查仪器。','male','adult'],['女研究员','她记录样本。','female','adult'],['男店员','他整理货架。','male','adult'],['女店员','她欢迎来客。','female','adult'],
  ['男渔夫','他收起鱼竿。','male','adult'],['女培育家','她照料宝可梦。','female','adult'],['男性登山者','他背着行囊。','male','adult'],['女性训练家','她准备出发。','female','adult'],
 ];
 const cases=Array.from({length:112},(_,index)=>descriptions[index%descriptions.length]);
 for(let index=0;index<cases.length;index++){
  const [label,text,gender,age]=cases[index],name=`${label}#${index}`,beat={speaker:name,text},input={gameId:`broad-portrait-${index}`,stage:{stage:{figures:[{speaker:name}]}},beats:[beat],beat,index:0};
  let element=app.ui.stageView.render(input);app.render(element.type,element.props,`broad-stage-${index}`);await tick();await tick();
  element=app.ui.stageView.render(input);const tree=app.render(element.type,element.props,`broad-stage-${index}`),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  const actor=walk(app.render(scene.type,scene.props,`broad-theater-${index}`),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0]?.props.person;
  assert.ok(actor?.url&&!actor.unmatched,`${name} receives art`);
  const primary=app.stageAssets.npcPortraits.entries.find(entry=>entry.id===actor.portraitId);assert.ok(primary,name);assert.equal(primary.gender,gender,name);
  const actualAge=primary.age==='older-adult'?'elder':primary.age==='boy'&&['camper','youngster'].some(role=>primary.roles.includes(role))||primary.age==='girl'&&['lass','teen-trainer','punk-girl'].some(role=>primary.roles.includes(role))?'teen':['boy','girl','child'].includes(primary.age)?'child':primary.age;
  assert.equal(actualAge,age,name);
  assert.ok(actor.fallbacks.length>=2,`${name} has at least two same-bracket fallback sources`);
  for(const fallback of actor.sources.slice(0,4)){
   const entry=app.stageAssets.npcPortraits.entries.find(item=>item.id===fallback.portraitId);
   if(entry){assert.equal(entry.gender,gender,name);const fallbackAge=entry.age==='older-adult'?'elder':entry.age==='boy'&&['camper','youngster'].some(role=>entry.roles.includes(role))||entry.age==='girl'&&['lass','teen-trainer','punk-girl'].some(role=>entry.roles.includes(role))?'teen':['boy','girl','child'].includes(entry.age)?'child':entry.age;assert.equal(fallbackAge,age,name);}
  }
 }
 for(const name of ['普通训练家','穿深色外套的人']){
  const beat={speaker:name,text:'沉默地站在路边。'},input={gameId:`neutral-${name}`,stage:{stage:{figures:[{speaker:name}]}},beats:[beat],beat,index:0};
  let element=app.ui.stageView.render(input);app.render(element.type,element.props,`neutral-stage-${name}`);await tick();await tick();
  element=app.ui.stageView.render(input);const tree=app.render(element.type,element.props,`neutral-stage-${name}`),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  const actor=walk(app.render(scene.type,scene.props,`neutral-theater-${name}`),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0]?.props.person;
  const source=app.stageAssets.npcPortraits.entries.find(entry=>entry.id===actor?.portraitId);assert.ok(source,name);assert.ok(['male','female'].includes(source.gender),name);assert.equal(source.age,'adult',name);assert.ok(actor.fallbacks.length>=2,name);
 }
});

test('portrait image failures advance through custom, same-identity, then same-bracket art and offer retry',async()=>{
 const app=browserPlugin(),name='有明确性别的外部定制居民',beat={speaker:name,text:'他穿着便服。'},input={gameId:'portrait-onerror',stage:{characters:[{name,gender:'male',age:'adult',width:1024,height:1536,avatarUrl:'https://external.example/missing.png'}],stage:{figures:[{speaker:name}]}},beats:[beat],beat,index:0};
 let element=app.ui.stageView.render(input);app.render(element.type,element.props,'portrait-onerror-stage');await tick();await tick();
 element=app.ui.stageView.render(input);let tree=app.render(element.type,element.props,'portrait-onerror-stage'),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];assert.ok(scene,'the test dialogue is rendered in the theater');const theater=app.render(scene.type,scene.props,'portrait-onerror-theater');let portraitNode=walk(theater,node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0];assert.ok(portraitNode,'an explicitly described resident is included in the cast');
 const person=portraitNode.props.person;assert.equal(person.url,'https://external.example/missing.png');assert.ok(person.fallbacks.length>=2);
 let rendered=app.render(portraitNode.type,portraitNode.props,'portrait-onerror-component');await tick();
 const getImage=tree=>walk(tree,node=>node.type==='img'||node.type==='image')[0];
 const image=getImage(rendered);assert.equal(image.props.src||image.props.href,person.url);image.props.onError();
 rendered=app.render(portraitNode.type,portraitNode.props,'portrait-onerror-component');
 const recovered=getImage(rendered),recoveredUrl=recovered.props.src||recovered.props.href;assert.ok(recoveredUrl!==person.url);assert.match(recoveredUrl,/assets\/trainers\//,'the failed external URL advances to bundled portrait art');
 let current=rendered;
 for(let guard=0;guard<person.sources.length+1;guard++){
  const currentImage=getImage(current);if(!currentImage)break;currentImage.props.onError();current=app.render(portraitNode.type,portraitNode.props,'portrait-onerror-component');
 }
 const retry=walk(current,node=>node.type==='button'&&node.children.join('')==='重试立绘')[0];assert.ok(retry,'when every URL fails the stage shows a working retry control instead of an empty silhouette');
 retry.props.onClick();current=app.render(portraitNode.type,portraitNode.props,'portrait-onerror-component');assert.ok(getImage(current));
});

test('a failed installed-pack Gary image retries that URL once before same-identity art',async()=>{
 const app=browserPlugin(),manifest=require('../public/data/trainers.json');app.stageAssets.trainers.push(...manifest.filter(entry=>entry.id==='rival_early'));
 const beat={speaker:'小茂',text:'劲敌已经准备好了。'},input={gameId:'gary-fallback',stage:{stage:{figures:[{speaker:'小茂'}]}},beats:[beat],beat,index:0};
 let element=app.ui.stageView.render(input);app.render(element.type,element.props,'gary-fallback-stage');await tick();await tick();
 element=app.ui.stageView.render(input);const tree=app.render(element.type,element.props,'gary-fallback-stage'),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0],portraitNode=walk(app.render(scene.type,scene.props,'gary-fallback-theater'),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0];
 assert.match(portraitNode.props.person.url,/pack-file.*gary-v3\.png/);
 let rendered=app.render(portraitNode.type,portraitNode.props,'gary-fallback-image');await tick();
 const getImage=tree=>walk(tree,node=>node.type==='img'||node.type==='image')[0];
 getImage(rendered).props.onError();rendered=app.render(portraitNode.type,portraitNode.props,'gary-fallback-image');
  assert.ok((getImage(rendered).props.src||getImage(rendered).props.href).endsWith(`gary-v3.png&v=${require('../package.json').version}&retry=1`),'the pack URL gets one retry using the current release version');
 getImage(rendered).props.onError();rendered=app.render(portraitNode.type,portraitNode.props,'gary-fallback-image');
 assert.match(getImage(rendered).props.src||getImage(rendered).props.href,/pack-file.*official\/blue\.png/,'the next image is a same-identity portrait from the pack, distinct from manga Green');
});

test('new Gary and Nurse Joy full-body art supersedes stale native character cards',async()=>{
 const app=browserPlugin(),manifest=require('../public/data/trainers.json');app.stageAssets.trainers.push(...manifest.filter(entry=>['rival_early','nurse_joy'].includes(entry.id)));
 for(const [name,file] of [['小茂','gary-v3.png'],['乔伊小姐','nurse-joy-v1.png']]){
  const beat={speaker:name,text:'伙伴已经准备好了。'},input={gameId:'new-art-'+name,stage:{characters:[{name,avatarUrl:'https://example.com/old-blue-card.png'}],stage:{figures:[{speaker:name}]}},beats:[beat],beat,index:0};
  const element=app.ui.stageView.render(input);app.render(element.type,element.props,'new-art-'+name);await tick();await tick();
  const tree=app.render(element.type,element.props,'new-art-'+name),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0],actor=walk(app.render(scene.type,scene.props,'new-art-scene-'+name),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0].props.person;
  assert.ok(actor.url.endsWith(file),name);assert.equal(actor.fullBody,true);assert.ok(actor.bounds.height>1400);assert.doesNotMatch(actor.url,/old-blue-card/);
 }
});

test('exact Kanto identities keep separate portraits and child characters keep child art',async()=>{
 const app=browserPlugin(),manifest=require('../public/data/trainers.json');app.stageAssets.trainers.push(...manifest);
 const renderPortrait=async(name,gameId)=>{
  const beat={speaker:name,text:'我已经准备好了。'},input={gameId,stage:{stage:{figures:[{speaker:name}]}},beats:[beat],beat,index:0};
  let element=app.ui.stageView.render(input);app.render(element.type,element.props,'identity-'+gameId);await tick();await tick();
  element=app.ui.stageView.render(input);const tree=app.render(element.type,element.props,'identity-'+gameId),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  return walk(app.render(scene.type,scene.props,'identity-theater-'+gameId),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0]?.props.person;
 };
 const gary=await renderPortrait('小茂','identity-gary');
 const green=await renderPortrait('小绿','identity-green');
 const yellow=await renderPortrait('小黄','identity-yellow');
 assert.match(gary.url,/gary-v3\.png$/);assert.match(green.url,/official\/blue\.png$/);assert.match(yellow.url,/yellow-child-v2\.png$/);
 assert.notEqual(gary.url,green.url,'Gary and manga Green remain separate identities');
 assert.equal(manifest.find(entry=>entry.id==='manga-yellow').ageGroup,'child');
});

test('teen girl role portraits accept the catalog age label girl',async()=>{
 const app=browserPlugin(),name='迷你裙少女训练家',beat={speaker:name,text:'我会和伙伴一起旅行。'},input={gameId:'teen-girl-class',stage:{stage:{figures:[{speaker:name}]}},beats:[beat],beat,index:0};
 let element=app.ui.stageView.render(input);app.render(element.type,element.props,'teen-girl-class');await tick();await tick();
 element=app.ui.stageView.render(input);const tree=app.render(element.type,element.props,'teen-girl-class'),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
 const person=walk(app.render(scene.type,scene.props,'teen-girl-theater'),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0]?.props.person;
 assert.equal(person.portraitId,'lass');assert.ok(person.url);
});


test('a speaking Pokémon uses its species sprite rather than an unknown trainer fallback',async()=>{
  const app=browserPlugin();app.stageAssets.species=[{id:25,name:'皮卡丘',english:'Pikachu'}];app.stageAssets.trainers.push({id:'gentleman',name:'绅士',image:'assets/trainers/gentleman.png'});
  const line={speaker:'皮卡丘',text:'皮卡，皮卡！'};
  const element=app.ui.stageView.render({gameId:'pokemon-actor',stage:{stage:{figures:[{speaker:line.speaker}]}},beats:[line],beat:line,index:0});
  app.render(element.type,element.props,'pokemon-stage');await tick();await tick();
  const tree=app.render(element.type,element.props,'pokemon-stage'),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  const theater=app.render(scene.type,scene.props,'pokemon-theater'),portrait=walk(theater,node=>node.type?.name==='Portrait')[0];
  assert.equal(portrait.props.pokemon,true);assert.match(portrait.props.person.url,/assets\/pokemon\/artwork\/25\.png/);assert.equal(portrait.props.person.name,'皮卡丘');
});

test('a mother gets a stable appropriate nonpixel portrait and stale stage actors disappear',async()=>{
  const app=browserPlugin();
  const renderLine=text=>{
    const beat={speaker:'母亲',text};
    return app.ui.stageView.render({gameId:'family-scene',stage:{characters:[{name:'母亲',avatarUrl:'/api/dsh-tavern/pack-file?pack=kanto-media&v=old&path=assets/trainers/gentleman.png'}],stage:{figures:[{speaker:'大木博士'},{speaker:'母亲'}]}},beats:[beat],beat,index:0});
  };
  let element=renderLine('她放下饭碗，提醒你照顾好伙伴。');app.render(element.type,element.props,'family-stage');await tick();await tick();
  const tree=app.render(element.type,element.props,'family-stage'),scene=walk(tree,node=>node.type?.name==='TheaterScene')[0];
  const theater=app.render(scene.type,scene.props,'family-theater');
  const actors=walk(theater,node=>node.type?.name==='Portrait'&&!node.props.pokemon);
  assert.equal(actors[0].props.person.name,'母亲');assert.equal(actors.some(node=>node.props.person.name==='大木博士'),false);
  const chosen=app.stageAssets.npcPortraits.entries.find(item=>item.id===actors[0].props.person.portraitId);
  assert.equal(chosen.gender,'female');assert.ok(chosen.roles.includes('mother'));assert.notEqual(chosen.displayEligible,false);
  element=renderLine('今天也记得和伙伴慢慢相处。');
  const nextTree=app.render(element.type,element.props,'family-stage'),nextScene=walk(nextTree,node=>node.type?.name==='TheaterScene')[0];
  const nextActor=walk(app.render(nextScene.type,nextScene.props,'family-theater'),node=>node.type?.name==='Portrait'&&!node.props.pokemon)[0];
  assert.equal(nextActor.props.person.portraitId,chosen.id,'dialogue changes do not reroll the mother’s face');
});

test('healing from the stage calls the native service immediately and never submits prose',async()=>{
  const app=browserPlugin({mvu:{writable:true,turn:2,world:{训练家:{金钱:0,徽章:[]},地图:{地点:'真新镇'},队伍:[{uid:'p',当前HP:1}],战斗:{状态:'finished'}},theater:{options:[{id:'heal',label:'宝可梦中心恢复',enabled:true}]}}});
  const input={gameId:'heal-service',stage:{},beats:[],index:0};const element=app.ui.stageView.render(input);
  app.render(element.type,element.props,'heal-stage');await tick();await tick();
  const tree=app.render(element.type,element.props,'heal-stage');
  walk(tree,node=>node.type==='button'&&node.children.join('')==='宝可梦中心恢复')[0].props.onClick({stopPropagation(){}});
  await tick();await tick();
  assert.ok(app.apiCalls.some(call=>call.route.endsWith('/scene')&&call.data.action==='heal'));
  assert.equal(app.apiCalls.some(call=>call.route.endsWith('/intent')),false);assert.equal(app.submissions.length,0);
});
