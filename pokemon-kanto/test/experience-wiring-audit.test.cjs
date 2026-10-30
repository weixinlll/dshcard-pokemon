const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const mvu = require('../mvu.cjs');
const storyEvents = require('../kanto-story-events.cjs');
const sceneContext = require('../scene-context.cjs').sceneContext;
const presentation = require('../presentation.cjs');
const campaign = require('../story-campaign.cjs');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('native view bundle embeds FX/tools scripts and their stylesheet', () => {
  const server = read('index.mjs');
  const page = read('public/index.html');
  const bridge = read('client.js');

  assert.match(server, /'classic-services-ui\.js','stadium-sprites\.js','app\.js'/);
  for (const stylesheet of ['tools-panel.css','cosmetic-fx.css','doubles-ui.css','classic-services.css','map-panzoom.css']) assert.ok(server.includes(`'${stylesheet}'`), `${stylesheet} is bundled by the host`);
  assert.match(server, /'native-stage\.css'/);
  assert.match(page, /\.\/battle-fx-map\.js/);
  assert.match(page, /\.\/tools-panel\.js/);
  assert.match(page, /\.\/tools-panel\.css/);
  for (const stylesheet of ['cosmetic-fx.css','doubles-ui.css','classic-services.css','map-panzoom.css']) assert.ok(page.includes(`./${stylesheet}`), `${stylesheet} is linked by the real game page`);
  assert.match(bridge, /bundle\.css\.replace/);
  assert.match(bridge, /bundle\.js\.replace/);
});

test('a real story-event view choice reaches theaterAction with its event and choice IDs', () => {
  const source = read('client.js');
  const start=source.indexOf('  function storyService('),end=source.indexOf('\n  function ',start+5);
  assert.ok(start>=0&&end>start,'the native story service builds actual choices');

  let variables = mvu.chooseStarter(mvu.createInitialMvu(), 1);
  let world = variables.stat_data['宝可梦'];
  const celadon = require('../public/data/map.json').find(node => node.id === 'celadon');
  world.地图.节点 = celadon.id;
  world.地图.地点 = celadon.name;
  world.战斗 = {轮次: world.地图.轮次, 状态: 'finished', 结果: '', 摘要: '', 操作序号: 0, 奖励: {经验: [], 金币: 0, 物品: [], 徽章: []}};
  const event = storyEvents.view(world).events.find(row => row.id === 'celadon-rocket-hideout');
  assert.equal(event.status, 'available');
  const choice = event.choices[0];
  assert.deepEqual({...choice.payload}, {eventId: event.id, choiceId: choice.id}, 'the actual view payload already has both IDs');
  const option = require('../scenes.cjs').buildTheater(world).options.find(row => row.id === 'kanto-story-event' && row.payload?.eventId === event.id);
  assert.ok(option);
  const serviceChoice = vm.runInNewContext(source.slice(start,end)+`;storyService(data,'kanto-story-event',{eventId:event.id}).choices.find(row=>row.payload.choiceId===choice.id)`, {data:{storyEvents:{events:[event]}},event,choice});
  assert.deepEqual({...serviceChoice.payload}, {eventId: event.id, choiceId: choice.id});
  const head = {turn: 4};
  const routeArgs = {gameId: 'audit-game', action: serviceChoice.id, payload: serviceChoice.payload, turn: head.turn, storyTurn: head.turn};
  variables = mvu.theaterAction(variables, routeArgs.action, {...routeArgs.payload, ...routeArgs, storyTurn: head.turn});
  const result = variables.stat_data['宝可梦'];
  assert.equal(result.剧情.关都事件.记录.at(-1).id, event.id);
  assert.equal(result.剧情.关都事件.记录.at(-1).选择, choice.id);
  assert.equal(result.剧情.剧场.最近动作, 'kanto-story-event');
});

test('battle target filtering recognizes PP deficits and Full Restore status cures', () => {
  const source = read('public/app.js');
  const helper = source.match(/function eligibleBattleItemTargets\(definition, switches\) \{[\s\S]*?\n  \}/)?.[0];
  const effectHelper = source.match(/function battleItemEffect\(definition\) \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(helper, 'battle item target filter remains available');
  assert.ok(effectHelper, 'battle item effect data is read from item definitions');
  const chooseTargets = vm.runInNewContext(`${effectHelper}; ${helper}; eligibleBattleItemTargets`, {
    safeNum: value => Number(value) || 0,
    first: (object, keys, fallback) => { for (const key of keys) if (object?.[key] !== undefined) return object[key]; return fallback; },
  });
  const switches = [
    {slot: 1, hp: 30, maxhp: 30, status: '', moves: [{pp: 5, maxpp: 10}]},
    {slot: 2, hp: 30, maxhp: 30, status: 'par', moves: [{pp: 10, maxpp: 10}]},
    {slot: 3, hp: 0, maxhp: 30, status: '', fainted: true, moves: [{pp: 0, maxpp: 10}]},
  ];
  const ppTargets = chooseTargets({battle: {pp: 'all', allMoves: false}}, switches);
  assert.deepEqual(ppTargets.map(mon => mon.slot), [1, 3], 'PP items may target a fainted teammate because the battle engine accepts PP recovery without HP');
  const fullRestoreTargets = chooseTargets({battle: {heal: 9999, status: ['brn', 'frz', 'par', 'psn', 'tox', 'slp']}}, switches);
  assert.deepEqual(fullRestoreTargets.map(mon => mon.slot), [2]);
  assert.equal(read('public/data/field-items.json').includes('"id": "fullrestore"'), true);
});

test('service controls stop theater advance and expose a return path to story mode', () => {
  const source = read('client.js');
  assert.match(source, /className:'kanto-theater',onClick:\(\)=>advance\?\.\(\)/);
  // Like a galgame, a click on the story text box advances; its controls and an open service scene keep the click.
  assert.match(source, /className:'kanto-theater-box',onClick:e=>\{if\(service\|\|e\.target\.closest\?\.\('button,a,input,select,textarea,summary'\)\)e\.stopPropagation\(\);\}/);
  assert.match(source, /service\?\.choices\?\.length[\s\S]*onServiceChoice\?\.\(choice\)/);
  assert.match(source, /service\?h\('button',[\s\S]*'返回剧情'/);
  assert.match(source, /mode!=='story'\?button\('返回剧情',\(\)=>change\('story'\)\)/);
  assert.match(source, /data\.type==='stage-return'\)\{onChange\('story'\)/);
});

test('center, mart, SS Anne, Rocket base, gym, campaign and tournament scenes select real art and music', () => {
  const backgrounds = JSON.parse(read('public/data/backgrounds.json'));
  const storyScenery = JSON.parse(read('public/data/story-scenery.json')).items;
  const audio = JSON.parse(read('public/data/story-audio.json'));
  const client = read('client.js');
  const selector = client.match(/function storyTrack\(data,manifest,beat\)\{[\s\S]*?\n  \}/)?.[0];
  assert.ok(selector, 'native-stage storyTrack selector exists');
  const storyTrack = vm.runInNewContext(`${selector}; storyTrack`);
  assert.ok(client.includes('const tagged=service?.sceneTag?(stageAssets?.scenery||[]).filter(item=>item.sceneTags?.includes(service.sceneTag)):[];'));
  assert.match(client, /const event=beat\?\.musicEvent\|\|data\?\.presentation\?\.scene\?\.musicEvent/);

  const makeWorld = (node = 'pewter') => {
    const variables = mvu.chooseStarter(mvu.createInitialMvu(), 1);
    const world = variables.stat_data['宝可梦'];
    const mapNode = require('../public/data/map.json').find(entry => entry.id === node);
    world.地图.节点 = mapNode.id;
    world.地图.地点 = mapNode.name;
    world.战斗 = {轮次: world.地图.轮次, 状态: 'finished', 结果: '', 摘要: '', 操作序号: 0, 奖励: {经验: [], 金币: 0, 物品: [], 徽章: []}};
    world.遭遇 = null;
    return {variables, world};
  };
  const assertResolved = (world, expectedTag, expectedEvent) => {
    const context = sceneContext(world);
    assert.equal(context.sceneTag, expectedTag);
    assert.equal(context.musicEvent, expectedEvent);
    const shown = presentation.presentation(world).scene;
    assert.equal(shown.sceneTag, expectedTag);
    assert.equal(shown.musicEvent, expectedEvent);
    const selected = presentation.sceneryFor(world);
    assert.ok(selected, `${expectedTag} selects a background record`);
    assert.ok(selected.sceneTags?.includes(expectedTag), `${selected.id} carries ${expectedTag}`);
    const local = path.resolve(root, 'public', selected.image);
    assert.ok(fs.existsSync(local), `${selected.id} asset exists`);
    const track = storyTrack({world, theater: require('../scenes.cjs').buildTheater(world), presentation: {scene: shown}}, audio, {musicEvent: context.musicEvent});
    assert.ok(track && audio.tracks[track.id], `${expectedEvent} resolves to an included music track`);
    return {selected, track};
  };

  let {variables, world} = makeWorld('pallet');
  variables = mvu.theaterAction(variables, 'heal', {storyTurn: 1});
  world = variables.stat_data['宝可梦'];
  const center = assertResolved(world, 'pokemon-center', 'pokemonCenter');

  ({variables, world} = makeWorld('pewter'));
  world.训练家.徽章 = ['岩石徽章'];
  variables = mvu.theaterAction(variables, 'campaign-prologue', {prologueId: 'kanto-prologue', storyTurn: 2});
  world = variables.stat_data['宝可梦'];
  const chapterContext = assertResolved(world, 'gym:pewter', 'quietReflection');
  assert.ok(chapterContext.selected.generated, 'project-generated chapter scene art is accepted as explicitly generated art');

  ({variables, world} = makeWorld('pewter'));
  world.遭遇 = {类型: 'gym', 道馆: 0, 训练家: '小刚', 队伍: []};
  world.战斗.状态 = 'pending';
  assertResolved(world, 'gym:pewter', 'gymInterior');

  ({variables, world} = makeWorld('vermilion'));
  world.剧情.关都事件.标记.ssTicket = true;
  world.训练家.徽章 = ['岩石徽章'];
  const shipEvent = storyEvents.view(world).events.find(row => row.id === 'ss-anne-captain');
  variables = mvu.theaterAction(variables, 'kanto-story-event', {payload: shipEvent.choices[0].payload, ...shipEvent.choices[0].payload, storyTurn: 3});
  world = variables.stat_data['宝可梦'];
  const ship = assertResolved(world, 'ss-anne', 'ssAnne');
  assert.equal(ship.selected.id, 'original-ss-anne');

  ({variables, world} = makeWorld('celadon'));
  const rocketEvent = storyEvents.view(world).events.find(row => row.id === 'celadon-rocket-hideout');
  variables = mvu.theaterAction(variables, 'kanto-story-event', {payload: rocketEvent.choices[0].payload, ...rocketEvent.choices[0].payload, storyTurn: 3});
  world = variables.stat_data['宝可梦'];
  const rocket = assertResolved(world, 'rocket-base', 'rocketBase');
  assert.equal(rocket.selected.id, 'original-rocket-transfer-room');

  ({variables, world} = makeWorld('pewter'));
  world.剧情.剧场 = {地点: 'pewter', 轮次: world.地图.轮次, 最近动作: 'buy'};
  const mart = assertResolved(world, 'mart', 'mart');
  assert.equal(mart.selected.id, 'original-mart');

  const sceneTags = new Set(backgrounds.flatMap(item => item.sceneTags || []));
  for (const chapter of campaign.data().chapters) {
    assert.ok(sceneTags.has(chapter.sceneTag), `${chapter.id} maps to a real background tag`);
    assert.ok(audio.events[chapter.musicEvent] && audio.tracks[audio.events[chapter.musicEvent]], `${chapter.id} musicEvent resolves`);
  }
  assert.ok(sceneTags.has('tournament') && audio.tracks[audio.events.tournament]);
  assert.ok(sceneTags.has('rocket-base') && audio.tracks[audio.events.rocketBase]);
  assert.ok(sceneTags.has('ss-anne') && audio.tracks[audio.events.ssAnne]);
  assert.ok(sceneTags.has('oak-lab') && audio.tracks[audio.events.opening]);
  assert.ok(center.selected && mart.selected && chapterContext.track && rocket.track && ship.track);
  assert.ok(storyScenery.every(item => item.image && item.sceneType));
});
