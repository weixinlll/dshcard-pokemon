(() => {
  'use strict';
  let animatedSpriteData=window.__KANTO_ANIMATED_SPRITES__||null;

  const $ = id => document.getElementById(id);
  const els = {
    connection: $('connectionText'), connectionWrap: document.querySelector('.connection'),
    team: $('teamSlots'), teamCount: $('partyCount'), dexSearch: $('dexSearch'), dexResults: $('dexResults'),
    sound: $('soundToggle'), soundLabel: $('soundLabel'), focusHeader: $('focusHeader'), focusBattle: $('focusBattle'), returnStage: $('returnStageButton'), speed: $('animationSpeed'), speedAction: $('animationSpeedAction'), reduceEffects: $('reduceEffects'), log: $('battleLog'), logCounter: $('logCounter'), stage: $('arena'), arenaBackdrop: $('arenaBackdrop'), effectLayer: $('effectLayer'),
    message: $('battleMessage'), counter: $('eventCounter'), mode: $('battleModeLabel'), turn: $('turnLabel'), weather: $('weatherLabel'), spriteStyle: $('battleSpriteToggle'), sceneryStyle: $('battleSceneryToggle'),
    locationEyebrow: $('locationEyebrow'), trainerSummary: $('trainerSummary'), trainer: $('trainerName'), badges: $('badgeCount'), money: $('moneyText'),
    foeName: $('foeName'), foeLevel: $('foeLevel'), foeHp: $('foeHpBar'), foeHpText: $('foeHpText'), foeSprite: $('foeSprite'), foeCondition: $('foeCondition'), foeBoosts: $('foeBoosts'),
    playerName: $('playerName'), playerLevel: $('playerLevel'), playerHp: $('playerHpBar'), playerHpText: $('playerHpText'), playerSprite: $('playerSprite'), playerCondition: $('playerCondition'), playerBoosts: $('playerBoosts'),
    moves: $('moveGrid'), actionTitle: $('actionTitle'), actionHint: $('actionHint'), switch: $('switchButton'), switchTray: $('switchTray'),
    potion: $('potionButton'), potionCount: $('potionCount'), capture: $('captureButton'), ballCount: $('ballCount'), run: $('runButton'),
    start: $('startBattleButton'), next: $('nextRoundButton'), story: $('storyButton'), storyCopy: $('storyCopy'), roundSummary: $('roundSummary'), inventory: $('inventoryList'), keyItems: $('keyItems'), pcList: $('pcList'), pcCount: $('pcCount'),
    starterPicker: $('starterPicker'), starterOptions: $('starterOptions'), center: $('centerCard'), centerName: $('centerName'), heal: $('healButton'), buyPotion: $('buyPotionButton'), buyBall: $('buyBallButton'),
    starterTitle: $('starterPickerTitle'), starterHint: $('starterChoiceHint'), backStory: $('backStoryButton'), showMvu: $('showMvuButton'), storyScene: $('storyScene'), sceneArt: $('sceneArt'), sceneBackground: $('sceneBackground'), sceneLocation: $('sceneLocation'), sceneRole: $('sceneRole'), sceneText: $('sceneText'), sceneOutcome: $('sceneOutcome'), npcSprite: $('npcSprite'), npcFallback: $('npcFallback'), npcName: $('npcName'), npcRole: $('npcRole'),
    mvuIndicator: $('mvuStateIndicator'), mvuSummary: $('mvuStateSummary'), mvuJson: $('mvuJson'), downloadMvu: $('downloadMvu'), errorPanel: $('errorPanel'), errorText: $('errorText'), retry: $('retryButton'),
    mapSvg: $('mapSvg'), mapTitle: $('mapTitle'), mapCurrent: $('mapCurrent'), mapNote: $('mapNote'), rules: $('rulesNote'), toast: $('toast'),
    hudTrainerName: $('hudTrainerName'), hudMoney: $('hudMoney'), hudBadges: $('hudBadges'), hudLocation: $('hudLocation'), hudProgression: $('hudProgression'), hudTabs: $('hudTabs'), shopItems: $('shopItems'), shopCount: $('shopCount'), shopReturn: $('shopReturnStory'), shopServices: document.querySelector('.service-buttons'), shopQuantity: document.querySelector('.shop-quantity'), tasksList: $('tasksList'), levelCap: $('levelCapBadge'), partySummary: $('partySummary'),
    battleCommandBar: $('battleCommandBar'), battleBagPanel: $('battleBagPanel'), battleBagItems: $('battleBagItems'), battleBagNote: $('battleBagNote'), battleItemConfirm: $('battleItemConfirm'), battleItemTarget: $('battleItemTarget'), battleItemTargetLabel: $('battleItemTargetLabel'), battleItemMove: $('battleItemMove'), battleItemMoveLabel: $('battleItemMoveLabel'), battleItemUse: $('battleItemUse'), battleItemCancel: $('battleItemCancel'), battlePokemonPanel: $('battlePokemonPanel'), battleRunPanel: $('battleRunPanel'), musicResume: $('battleMusicResume'),
    doubleActives: $('doubleActives'), cosmeticPanel: $('cosmeticsPanel'), cosmeticDisclosure: $('cosmeticDisclosure'), classicServices: $('classicServicesPanel'), rocketEvents: $('rocketEventsPanel'), bossTier: $('bossTier'), battleMode: $('battleMode'), battleModeReason: $('battleModeReason')
  };
  const params = new URLSearchParams(window.__KANTO_EMBED__?.query || location.search);
  const embedded = window.parent !== window;
  let useBridge = params.get('mvu') === '1' && embedded;
  const stageMode = params.get('stage') === '1';
  const battleOverlay = params.get('battle') === '1';
  const rosterMode = params.get('roster') === '1';
  const nativeMode = params.get('native') === '1';
  const bridgeNonce = params.get('bridge') || '';
  if (stageMode) document.body.classList.add('stage-mode');
  if (battleOverlay) document.body.classList.add('battle-overlay');
  if (rosterMode) document.body.classList.add('roster-mode');
  if (nativeMode) document.body.classList.add('native-mode');
  if (rosterMode && !embedded) {
    const home = document.querySelector('.brand');
    home.href = './'; home.title = '返回剧情与战斗';
  }
  const initialHudTab = ({ party: 'team', team: 'team', bag: 'bag', quests: 'tasks', tasks: 'tasks', shop: 'shop', map: 'map' })[params.get('tab')] || 'team';
  const state = { world: null, locations: [], items: {}, shop: null, progression: null, classicServices:null, cosmetics:null, rocketEvents:[], battleSettings:{bossTier:'auto',battleMode:'singles'}, partyDisclosure:{}, bagDisclosure:{}, cosmeticTargetUid:'',cosmeticRenderKey:'', cosmeticAuras:new Map(), cosmeticAnchors:new Map(), activeCosmeticUids:new Map(), cosmeticBattleId:'', shinyEntryAnchors:new Map(), shinyEntrySeen:new Set(), battle: null, battleBaseline: [], growthSeenBattleId: '', presentation: null, stageBeat: null, cinematicBattleId: '', importantBattleId:'', importantBattleController:null, skipImportantBattleUpdate:false, cinematicNode: null, cinematicTimer: 0, cinematicMoments: new Set(), battleSpriteStyle: 'pixel', battleSceneryStyle: 'illustrated', sceneryAvailable: false, initialized: false, retryAction: null, dex: null, species: [], moves: {}, types: {}, busy: false, muted: false, reducedEffects: false, battleFocus: false, animationSpeed: 1, boosts: { player: {}, foe: {} }, eventLog: [], starterChosen: false, selectedBattleItem: null, battleActionTab: 'moves', hudTab: initialHudTab, pending: new Map(), serial: 0, toastTimer: 0, mapZoom:1,mapX:0,mapY:0,mapGesture:null };
  const tacticalStates = { player: new Set(), foe: new Set() };
  const protectTimers = { player: null, foe: null };
  function clearProtectTimer(side) { if (protectTimers[side] !== null) clearTimeout(protectTimers[side]); protectTimers[side] = null; }
  let currentWeatherKey = null;
  document.body.dataset.hudTab = state.hudTab;
  const presentationWaiters = new Set();
  const fxLiveNodes = new Set(), fxCleanupTimers = new Set(), fxSpawnTimes = [];
  const FX_NODE_LIMIT = 48, FX_RATE_LIMIT = 96;
  function wait(ms) {
    if(state.fastForward)return Promise.resolve();
    return new Promise(resolve=>{let timer;const finish=()=>{clearTimeout(timer);presentationWaiters.delete(finish);resolve();};presentationWaiters.add(finish);timer=setTimeout(finish,Math.max(0,Math.min(900,ms)/state.animationSpeed));});
  }
  function skipBattlePresentation() {
    if(!state.presenting)return;
    state.fastForward=true;
    state.presentationSerial=(state.presentationSerial||0)+1;
    state.skipImportantBattleUpdate=true;state.importantBattleController?.skip?.();clearShinyEntries();state.camera?.reset();
    for(const finish of [...presentationWaiters])finish();
    clearBattleCinematic();clearFxEffects();
    for(const side of ['player','foe']){const sprite=spriteFor(side);sprite.classList.remove('capture-absorb','capture-release','lunge-vector','hit-flash','enter-in','recall-out','faint-out');sprite.style.removeProperty('animation-duration');}
    if($('skipBattleEffects'))$('skipBattleEffects').disabled=true;
  }
  const statList = [['hp', 'HP'], ['atk', '攻'], ['def', '防'], ['spa', '特攻'], ['spd', '特防'], ['spe', '速']];
  const itemLabels = { potion: '伤药', pokeball: '精灵球', ball: '精灵球', antidote: '解毒药', paralyzeheal: '解麻药', burnheal: '灼伤药', awakening: '解眠药', iceheal: '解冻药', fullheal: '万灵药', revive: '活力碎片', ether: 'PP单项小补剂', maxether: 'PP多项小补剂', rarecandy: '神奇糖果', charcoal:'木炭', leftovers:'吃剩的东西', shellbell:'贝壳之铃', oranberry:'橙橙果', sitrusberry:'文柚果', whiteherb:'白色香草', mentalherb:'心灵香草', choiceband:'专爱头带' };
  const typeFallbacks = { Grass: '草', Poison: '毒', Fire: '火', Water: '水', Electric: '电', Ice: '冰', Psychic: '超能力', Ghost: '幽灵', Normal: '一般', Fighting: '格斗', Flying: '飞行', Ground: '地面', Rock: '岩石', Bug: '虫', Steel: '钢', Dragon: '龙', Dark: '恶' };
  const weatherNames = { none: '无', raindance: '下雨', sunnyday: '晴天', sandstorm: '沙暴', hail: '冰雹' };
  const statusNames = { brn: '灼伤', psn: '中毒', tox: '剧毒', par: '麻痹', slp: '睡眠', frz: '冰冻' };
  const evolutionStonesBySpecies = {
    firestone: [37, 58, 133], waterstone: [61, 90, 120, 133], thunderstone: [25, 133],
    leafstone: [44, 70, 102], moonstone: [30, 33, 35, 39]
  };
  let bridgePort = null, bridgeReady = false, bridgeFallback = false;
  let terrainReady = false;
  const bridgeWaiters = [];

  function waitForBridge() {
    if (!useBridge || bridgeFallback || (bridgeReady && bridgePort)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject, timer: 0 };
      waiter.timer = setTimeout(() => {
        const index = bridgeWaiters.indexOf(waiter); if (index >= 0) bridgeWaiters.splice(index, 1);
        reject(new Error('DSH 消息通道尚未就绪，请重试连接。'));
      }, 8000);
      bridgeWaiters.push(waiter);
    });
  }
  function resolveBridgeReady() {
    bridgeReady = true;
    while (bridgeWaiters.length) {
      const waiter = bridgeWaiters.shift(); clearTimeout(waiter.timer); waiter.resolve();
    }
  }
  // 通道握手失败不是致命错误：父页面同时监听窗口消息，退回它仍能应答。
  async function ensureTransport() {
    if (!useBridge || bridgeFallback) return true;
    try { await waitForBridge(); }
    catch (_) {
      bridgeFallback = true; bridgeReady = false; bridgePort = null;
      bridgeWaiters.length = 0;
    }
    return true;
  }
  function sendBridgeMessage(message) {
    const payload = { channel: 'kanto-mvu', bridge: bridgeNonce, ...message };
    if (useBridge && !bridgeFallback) {
      if (!bridgeReady || !bridgePort) throw new Error('DSH 消息通道尚未就绪，请重试。');
      bridgePort.postMessage(payload); return;
    }
    if (embedded) window.parent.postMessage(payload, '*');
  }

  function toast(text) {
    els.toast.textContent = String(text || '操作失败。'); els.toast.classList.add('show');
    clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2800);
  }
  function setBattleFocus(active) {
    state.battleFocus = Boolean(active); document.body.classList.toggle('battle-focus', state.battleFocus);
    window.KantoAudio?.battle(state.battle, state.world, Boolean(active));
    syncBattleMusicButton();
    [els.focusHeader, els.focusBattle].forEach(button => {
      button.setAttribute('aria-pressed', String(state.battleFocus));
      button.textContent = state.battleFocus ? '退出专注' : '专注战斗';
    });
  }
  function setAnimationSpeed(value) {
    state.animationSpeed = Math.max(1, Math.min(4, safeNum(value, 1)));
    const selected = String(state.animationSpeed);
    els.speed.value = selected; if (els.speedAction) els.speedAction.value = selected;
    document.body.style.setProperty('--battle-speed', selected);
    state.camera?.configure({speed:state.animationSpeed,reduced:state.reducedEffects});
    if(typeof nativeMode!=='undefined'&&nativeMode&&embedded)sendBridgeMessage({type:'presentation-change',speed:state.animationSpeed});
  }
  state.musicManaged=window.__KANTO_EMBED__?.musicManaged===true;
  if (state.musicManaged) $('musicToggle').hidden=true;
  function syncBattleMusicButton() {
    if (!els.musicResume) return;
    const status = window.KantoAudio?.status?.();
    els.musicResume.hidden = state.musicManaged===true || !(state.battleFocus && state.battle && !state.battle.ended && status?.needsGesture);
  }
  function showPersistentError(message, retryAction) {
    els.errorText.textContent = String(message || '操作失败，请重试。');
    state.retryAction = typeof retryAction === 'function' ? retryAction : null;
    els.retry.disabled = !state.retryAction; els.errorPanel.hidden = false;
  }
  function clearPersistentError() {
    els.errorPanel.hidden = true; els.errorText.textContent = ''; state.retryAction = null; els.retry.disabled = true;
  }
  function setMessage(text) { els.message.textContent = text || ''; }
  function safeNum(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
  function first(object, keys, fallback = undefined) {
    if (!object) return fallback;
    for (const key of keys) if (object[key] !== undefined && object[key] !== null) return object[key];
    return fallback;
  }
  function mvuRoot(world) { return world?.宝可梦根 || world?.root || world; }
  function dexId(entry) {
    const raw = first(entry, ['图鉴编号', 'id', 'speciesId', 'pokemonId'], '');
    const match = String(raw).match(/\d+/); return match ? Number(match[0]) : 0;
  }
  function speciesById(id) { return state.species.find(p => Number(p.id) === Number(id)); }
  function moveById(id) {
    const key = String(id || '').toLowerCase();
    return state.moves[key] || Object.values(state.moves).find(m => String(m.id || '').toLowerCase() === key);
  }
  function typeName(type) { return state.types[type] || typeFallbacks[type] || type || '一般'; }
  const gen3TypeChart = {
    Normal: { weak: [], resist: ['Rock','Steel'], immune: ['Ghost'] }, Fighting: { weak: ['Normal','Ice','Rock','Dark','Steel'], resist: ['Poison','Flying','Psychic','Bug'], immune: ['Ghost'] },
    Flying: { weak: ['Grass','Fighting','Bug'], resist: ['Electric','Rock','Steel'], immune: [] }, Poison: { weak: ['Grass'], resist: ['Poison','Ground','Rock','Ghost'], immune: ['Steel'] },
    Ground: { weak: ['Fire','Electric','Poison','Rock','Steel'], resist: ['Grass','Bug'], immune: ['Flying'] }, Rock: { weak: ['Fire','Ice','Flying','Bug'], resist: ['Fighting','Ground','Steel'], immune: [] },
    Bug: { weak: ['Grass','Psychic','Dark'], resist: ['Fire','Fighting','Poison','Flying','Ghost','Steel'], immune: [] }, Ghost: { weak: ['Psychic','Ghost'], resist: ['Dark','Steel'], immune: ['Normal'] },
    Steel: { weak: ['Ice','Rock'], resist: ['Fire','Water','Electric','Steel'], immune: [] }, Fire: { weak: ['Grass','Ice','Bug','Steel'], resist: ['Fire','Water','Rock','Dragon'], immune: [] },
    Water: { weak: ['Fire','Ground','Rock'], resist: ['Water','Grass','Dragon'], immune: [] }, Grass: { weak: ['Water','Ground','Rock'], resist: ['Fire','Grass','Poison','Flying','Bug','Dragon','Steel'], immune: [] },
    Electric: { weak: ['Water','Flying'], resist: ['Electric','Grass','Dragon'], immune: ['Ground'] }, Psychic: { weak: ['Fighting','Poison'], resist: ['Psychic','Steel'], immune: ['Dark'] },
    Ice: { weak: ['Grass','Ground','Flying','Dragon'], resist: ['Fire','Water','Ice','Steel'], immune: [] }, Dragon: { weak: ['Dragon'], resist: ['Steel'], immune: [] },
    Dark: { weak: ['Psychic','Ghost'], resist: ['Fighting','Dark','Steel'], immune: [] }
  };
  function moveBattleHint(move, attacker, defender, weather) {
    const category = String(move?.category || '').toLowerCase();
    const parts = [category === 'physical' ? '物理' : category === 'special' ? '特殊' : category === 'status' ? '变化' : ''];
    if (move?.accuracy === true) parts.push('必中');
    else if (Number.isFinite(Number(move?.accuracy)) && move.accuracy !== '' && move.accuracy != null) parts.push(`基础命中 ${move.accuracy}%`);
    if (Number.isFinite(Number(move?.priority)) && Number(move.priority) !== 0) parts.push(`先制度 ${Number(move.priority) > 0 ? '+' : ''}${Number(move.priority)}`);
    const type = String(move?.type || '').toLowerCase(), typeKey = Object.keys(typeFallbacks).find(key => key.toLowerCase() === type);
    if (typeKey && Array.isArray(attacker?.types) && attacker.types.some(value => String(value).toLowerCase() === type)) parts.push('本系加成');
    if (typeKey && Array.isArray(defender?.types) && defender.types.length) {
      const chart = gen3TypeChart[typeKey];
      if (chart) {
        const multiplier = defender.types.reduce((value, target) => {
          const targetKey = Object.keys(typeFallbacks).find(key => key.toLowerCase() === String(target).toLowerCase()) || target;
          return value * (chart.immune.includes(targetKey) ? 0 : chart.weak.includes(targetKey) ? 2 : chart.resist.includes(targetKey) ? .5 : 1);
        }, 1);
        parts.push(multiplier === 0 ? '基础属性相性：无效' : multiplier > 1 ? `基础属性相性：${multiplier}×弱点` : multiplier < 1 ? `基础属性相性：${multiplier}×抗性` : '基础属性相性：普通');
        parts.push('未计特性与招式特殊规则');
      }
    }
    if (weather && weather !== 'none') parts.push(`天气：${weatherName(weather)}`);
    return parts.filter(Boolean).join(' · ');
  }
  const VARIABLE_TAG = /<\s*\/?\s*(?:initvar|updatevariable|update|variableupdate|json_?patch|mvu-status)\b[^>]*>/i;
  const VARIABLE_PAYLOAD = /"strictSet"\s*:|\{\s*"\$meta"|"宝可梦"\s*:\s*\{/;
  // 变量协议块属于状态而不是台词：宿主若只剥了标签，JSON 内容会留在这里。
  function stripVariablePayload(value) {
    let text = String(value === undefined || value === null ? '' : value);
    if (!text) return '';
    text = text.replace(/<initvar\b[^>]*>[\s\S]*?<\/initvar>/gi, '')
      .replace(/<updatevariable\b[^>]*>[\s\S]*?<\/updatevariable>/gi, '');
    if (VARIABLE_PAYLOAD.test(text)) {
      const start = text.search(/\n?\s*\{\s*"(?:\$meta|宝可梦)"/);
      if (start >= 0) {
        const tail = text.slice(start);
        const end = Math.max(tail.lastIndexOf('}'), tail.lastIndexOf(']'));
        text = text.slice(0, start) + (end >= 0 ? tail.slice(end + 1) : '');
      }
    }
    return text.replace(/<\s*\/?\s*(?:initvar|updatevariable|update|variableupdate|json_?patch|mvu-status)\b[^>]*>/gi, '')
      .replace(/\n{3,}/g, '\n\n').trim();
  }
  /** 只是 JSON 结构的一行：旧宿主把初始化块拆成逐行台词时的兜底判断。 */
  function looksLikeJsonFragment(value) {
    const text = String(value === undefined || value === null ? '' : value).trim();
    if (!text || text.length > 120) return false;
    if (/^[{}\[\],]+\s*$/.test(text)) return true;
    if (/^"\$?[^"]*"\s*:/.test(text)) return true;
    if (/^[{[]\s*"/.test(text)) return true;
    if (/^(?:true|false|null)\s*,?$/.test(text)) return true;
    if (/^-?\d+(?:\.\d+)?\s*,?$/.test(text)) return true;
    if (/^"[^"]*"\s*,?$/.test(text)) return true;
    return false;
  }
  function safeStageText(value, fallback) {
    const raw = value && typeof value === 'object' ? JSON.stringify(value) : String(value || '');
    if (!raw.trim()) return fallback;
    if (/<dsh_battle\b/i.test(raw)) return '本轮遭遇已准备，点击进入战斗。';
    const text = stripVariablePayload(raw);
    if (!text) return fallback;
    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object' && ('enemies' in parsed || 'enemy' in parsed || 'opponent' in parsed || 'battle' in parsed)) return '本轮遭遇已准备，点击进入战斗。';
      } catch (_) {
        if (/(?:"enemies"|"enemy"|<dsh_battle)/i.test(text)) return '本轮遭遇已准备，点击进入战斗。';
      }
    }
    return text;
  }
  // 素材（精灵图、背景、人物、音乐）放在人物卡的素材包里，插件只带代码；
  // 宿主把包的基址注入 __KANTO_ASSET_ROOT__（形如 ...&path=），本地试玩时退回同目录相对路径。
  const ASSET_ROOT = String(window.__KANTO_ASSET_ROOT__ || '').trim();
  function assetHref(path) {
    const relative = String(path || '').replace(/^\.?\//, '');
    if (!relative) return '';
    return ASSET_ROOT ? ASSET_ROOT + relative : new URL('./' + relative, document.baseURI).href;
  }
  window.KantoAssets = { href: assetHref, root: ASSET_ROOT };
  const regionArtwork=document.querySelector('.map-art');
  if(regionArtwork){regionArtwork.onerror=()=>{regionArtwork.onerror=null;regionArtwork.src=assetHref('assets/maps/kanto-region.svg');};regionArtwork.src=assetHref('assets/maps/kanto-region-painted-v1.png');}
  const mapViewport = (() => {
    const wrap = document.querySelector('.map-wrap');
    const svg = els.mapSvg;
    if (!wrap || !svg || !regionArtwork) return null;
    let layer = wrap.querySelector('.map-panzoom-layer');
    if (!layer) {
      layer = document.createElement('div'); layer.className = 'map-panzoom-layer';
      wrap.insertBefore(layer, wrap.firstChild);
      layer.append(regionArtwork, svg);
    }
    let controls = wrap.querySelector('.map-panzoom-controls');
    if (!controls) {
      controls = document.createElement('div'); controls.className = 'map-panzoom-controls'; controls.setAttribute('aria-label', '地图缩放');
      for (const [label, title, delta] of [['−','缩小地图',-1],['＋','放大地图',1]]) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.title = title; button.setAttribute('aria-label', title);
        button.addEventListener('click', () => zoomMap(delta, wrap.clientWidth / 2, wrap.clientHeight / 2)); controls.appendChild(button);
      }
      const reset = document.createElement('button'); reset.type='button'; reset.textContent='重置'; reset.title='重置地图视图'; reset.addEventListener('click', resetMapView); controls.appendChild(reset);
      wrap.appendChild(controls);
      wrap.addEventListener('wheel', event => { event.preventDefault(); const rect=wrap.getBoundingClientRect(); zoomMap(event.deltaY < 0 ? 1 : -1,event.clientX-rect.left,event.clientY-rect.top); }, {passive:false});
      wrap.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.target.closest('.map-node,.map-panzoom-controls')) return;
        state.mapGesture={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:state.mapX,y:state.mapY}; wrap.setPointerCapture(event.pointerId); wrap.classList.add('is-panning');
      });
      wrap.addEventListener('pointermove', event => { const g=state.mapGesture; if(!g||g.pointerId!==event.pointerId)return; state.mapX=g.x+event.clientX-g.startX;state.mapY=g.y+event.clientY-g.startY;applyMapTransform(); });
      const end=event=>{if(state.mapGesture?.pointerId===event.pointerId){state.mapGesture=null;wrap.classList.remove('is-panning');}};
      wrap.addEventListener('pointerup',end);wrap.addEventListener('pointercancel',end);wrap.addEventListener('lostpointercapture',end);
    }
    return {wrap,layer};
  })();
  function applyMapTransform(){if(!mapViewport)return;const {wrap,layer}=mapViewport,z=state.mapZoom,w=wrap.clientWidth,h=wrap.clientHeight;state.mapX=Math.max(w*(1-z),Math.min(0,state.mapX));state.mapY=Math.max(h*(1-z),Math.min(0,state.mapY));layer.style.transform=`translate(${state.mapX}px,${state.mapY}px) scale(${z})`;}
  function zoomMap(direction,x,y){if(!mapViewport)return;const before=state.mapZoom,after=Math.max(1,Math.min(3,before+(direction>0?.2:-.2)));if(after===before)return;const ratio=after/before;state.mapX=x-(x-state.mapX)*ratio;state.mapY=y-(y-state.mapY)*ratio;state.mapZoom=after;applyMapTransform();}
  function resetMapView(){state.mapZoom=1;state.mapX=0;state.mapY=0;applyMapTransform();}
  window.addEventListener('resize',applyMapTransform);
  function assetUrl(id, back = false, shiny = false) {
    return assetHref(`assets/pokemon/${shiny ? 'shiny/' : ''}${back ? 'back/' : ''}${encodeURIComponent(String(id))}.png`);
  }
  function isShiny(mon) { return mon?.闪光 === true || mon?.shiny === true; }
  function artworkUrl(id, shiny = false) { return assetHref(`assets/pokemon/${shiny ? 'shiny/' : ''}artwork/${encodeURIComponent(String(id))}.png`); }
  function localResourceUrl(path) {
    const value = String(path || '').trim();
    if (!value || /^(?:https?:|data:|javascript:)/i.test(value)) return '';
    if (!/^(?:\.\/)?assets\//i.test(value) && !/^\/assets\//i.test(value)) return '';
    return assetHref(value.replace(/^\.?\//, ''));
  }

  function requestOverWindow(path, body) {
    const requestId = `kanto-${Date.now()}-${++state.serial}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { state.pending.delete(requestId); reject(new Error('人物卡没有回应，请刷新舞台后重试。')); }, 20000);
      state.pending.set(requestId, { resolve, reject, timer });
      try { window.parent.postMessage({ channel: 'kanto-mvu', requestId, bridge: bridgeNonce, path, body }, '*'); }
      catch (error) { clearTimeout(timer); state.pending.delete(requestId); reject(new Error(error?.message || 'DSH 消息通道已断开，请重试。')); }
    });
  }
  async function api(path, options = {}) {
    const body = options.body ? JSON.parse(options.body) : {};
    if (useBridge) {
      await ensureTransport();
      if (bridgeFallback || !bridgePort) return requestOverWindow(path, body);
      const requestId = `kanto-${Date.now()}-${++state.serial}`;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { state.pending.delete(requestId); reject(new Error('人物卡响应超时，请检查 DSH 桥接状态。')); }, 15000);
        state.pending.set(requestId, { resolve, reject, timer });
        try { bridgePort.postMessage({ channel: 'kanto-mvu', requestId, bridge: bridgeNonce, path, body }); }
        catch (error) { clearTimeout(timer); state.pending.delete(requestId); reject(new Error(error?.message || 'DSH 消息通道已断开，请重试。')); }
      });
    }
    if (embedded) return requestOverWindow(path, body);
    let response;
    try {
      const url = new URL(path, window.location.origin);
      response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    } catch (_) { throw new Error('无法连接人物卡服务，请确认本地游戏与 MVU API 已启动。'); }
    let result; try { result = await response.json(); } catch (_) { result = {}; }
    if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : `请求失败（${response.status}），请稍后重试。`);
    clearPersistentError();
    return result;
  }
  function handleBridgeMessage(data) {
    if (!data || data.channel !== 'kanto-mvu' || (bridgeNonce && String(data.bridge || '') !== bridgeNonce)) return;
    if (data.type === 'audio-settings') {
      if (typeof data.musicManaged === 'boolean') {
        state.musicManaged=data.musicManaged;
        window.KantoAudio?.managed?.(data.musicManaged);
        $('musicToggle').hidden=data.musicManaged;
        if (els.musicResume) els.musicResume.hidden=data.musicManaged;
      }
      if (typeof data.music === 'boolean') window.KantoAudio?.music(data.music);
      if (typeof data.effects === 'boolean') { window.KantoAudio?.effects(data.effects); state.muted=!data.effects; els.sound.setAttribute('aria-pressed',String(state.muted)); els.soundLabel.textContent=state.muted?'音效 关':'音效 开'; }
      if ([1,2,4].includes(data.speed)) { state.animationSpeed=data.speed; els.speed.value=String(data.speed); if (els.speedAction) els.speedAction.value=String(data.speed); document.body.style.setProperty('--battle-speed',String(data.speed)); }
      if (typeof data.reducedEffects === 'boolean') { state.reducedEffects=data.reducedEffects; els.reduceEffects.checked=data.reducedEffects; document.body.classList.toggle('reduce-effects',data.reducedEffects); }
      state.camera?.configure({speed:state.animationSpeed,reduced:state.reducedEffects});
      return;
    }
    if (data.type === 'mvu-refresh' && String(data.bridge || '') === bridgeNonce) {
      if(!state.busy)refreshMvu().catch(error => showPersistentError(error.message, () => refreshMvu()));
      return;
    }
    if (stageMode && data.type === 'stage-beat' && String(data.bridge || '') === bridgeNonce) {
      const beat = data.beat && typeof data.beat === 'object' ? data.beat : {};
      // 外层宿主把初始化块拆成逐行台词时，这里自己认出来并跳过，不必等宿主升级。
      const quiet = !String(beat.speaker || '') && looksLikeJsonFragment(beat.text);
      if (quiet) {
        state.payloadStreak = (state.payloadStreak || 0) + 1;
        if (state.payloadStreak <= 200) setTimeout(() => requestStageControl('stage-advance'), 16);
      } else state.payloadStreak = 0;
      state.stageBeat = { speaker: String(beat.speaker || ''), text: quiet ? '' : safeStageText(beat.text, ''), emotion: String(beat.emotion || '') };
      renderStoryScene();
      document.body.classList.toggle('stage-fullscreen', Boolean(data.fullscreen));
      return;
    }
    if (typeof data.requestId !== 'string') return;
    const pending = state.pending.get(data.requestId); if (!pending) return;
    state.pending.delete(data.requestId); clearTimeout(pending.timer);
    if (data.error) pending.reject(Object.assign(new Error(typeof data.error === 'string' ? data.error : data.error.message || '人物卡操作失败。'), { code: data.error.code }));
    else { clearPersistentError(); pending.resolve(data.body); }
  }
  window.addEventListener('message', event => {
    if (event.source !== window.parent) return;
    const data = event.data;
    if (!data || data.channel !== 'kanto-mvu' || String(data.bridge || '') !== bridgeNonce) return;
    if (data.type === 'bridge-connect' && useBridge) {
      const nextPort = event.ports?.[0];
      if (!nextPort) return;
      if (bridgePort) { bridgePort.onmessage = null; bridgePort.close(); }
      bridgePort = nextPort; bridgeReady = false;
      bridgePort.onmessage = messageEvent => {
        const message = messageEvent.data;
        if (!message || message.channel !== 'kanto-mvu' || String(message.bridge || '') !== bridgeNonce) return;
        if (message.type === 'bridge-ready') { resolveBridgeReady(); return; }
        handleBridgeMessage(message);
      };
      if (typeof bridgePort.start === 'function') bridgePort.start();
      bridgePort.postMessage({ channel: 'kanto-mvu', type: 'bridge-connected', bridge: bridgeNonce });
      return;
    }
    // Retain compatibility for an older parent while keeping source + nonce validation.
    handleBridgeMessage(data);
  });
  window.addEventListener('pagehide', clearCosmeticEffects, { once: true });
  window.addEventListener('pagehide', clearShinyEntries, { once: true });
  window.addEventListener('pagehide', stopImportantBattlePresentation, { once: true });

  function hydrateDex(data) {
    state.dexRenderCache = null;
    if (!data || !Array.isArray(data.species) || !data.moves) throw new Error('图鉴数据格式不完整。');
    state.dex = data; state.species = data.species; state.moves = data.moves; state.types = data.types || {};
    const extra = '第三世代物理/特殊按属性划分，幽灵系（暗影球）为物理，火系（火焰拳）为特殊。';
    els.rules.textContent = extra;
    els.rules.title = `${data.rules || ''} 招式说明采用现代中文译文，个别描述可能与第三世代效果有差异。`.trim();
  }
  function applyWorld(data, preferredBattle = undefined) {
    if (!data || typeof data !== 'object') throw new Error('人物卡没有返回有效的 MVU 状态。');
    const view = data.worldView || data;
    state.world = mvuRoot(view.world || view);
    state.mvuJsonWorld = undefined; renderMvuJson();
    state.items = view.items || data.items || state.world?.items || state.world?.物品目录 || state.items || {};
    state.machines = view.tmhm || data.tmhm || state.machines || [];
    state.shop = view.shop || data.shop || state.shop;
    state.tools=view.tools||data.tools;state.gadgets=view.gadgets||data.gadgets;state.field=view.field||data.field;
    state.companionship=view.companionship||data.companionship;
    state.progression = view.progression || data.progression || state.progression;
    state.classicServices=view.classicServices||data.classicServices||state.classicServices;
    state.cosmetics=view.cosmetics||data.cosmetics||state.cosmetics;
    state.rocketEvents=Array.isArray(view.rocketEvents)?view.rocketEvents:(Array.isArray(data.rocketEvents)?data.rocketEvents:state.rocketEvents);
    state.battleSettings={...state.battleSettings,...(state.world?.设置||view.settings||data.settings||{})};
    state.locations = Array.isArray(view.locations) ? view.locations : Array.isArray(data.locations) ? data.locations : [];
    const presentation = data.presentation || view.presentation || view.world?.presentation;
    if (presentation) state.presentation = presentation;
    let incoming = view.battle || data.battle || preferredBattle || null;
    if (incoming) {
      incoming = { ...incoming, seq: incoming.seq ?? data.seq ?? preferredBattle?.seq,
        storyTurn: incoming.storyTurn ?? data.turn, textVersion: incoming.textVersion ?? data.textVersion };
      const current = state.battle;
      if (current?.id === incoming.id && Number.isInteger(current.seq) && (!Number.isInteger(incoming.seq) || current.seq > incoming.seq)) incoming = current;
    }
    state.battle = incoming;
    state.initialized = true;
    renderWorld();
  }
  function getMap() { return state.world?.地图 || {}; }
  function getParty() { return Array.isArray(state.world?.队伍) ? state.world.队伍 : []; }
  function getEncounter() { return state.world?.遭遇 || {}; }
  function getBagItems() { return state.world?.背包?.物品 || {}; }
  function currentNodeId() { return String(first(getMap(), ['节点', 'node', 'id'], '')); }
  function battleStatus() {
    if (state.battle) return state.battle.ended ? 'finished' : 'active';
    const raw = state.world?.战斗?.状态;
    return raw === 'active' || raw === 'finished' ? raw : 'pending';
  }
  function winnerSideIndex(snapshot) {
    const winner=String(snapshot?.winner||'').trim();
    if(winner==='p1')return 0;
    if(winner==='p2')return 1;
    const wanted=winner.toLocaleLowerCase();
    if(!wanted||wanted==='tie')return -1;
    const sides=Array.isArray(snapshot?.sides)?snapshot.sides:[];
    return sides.findIndex(side=>String(side?.name||'').trim().toLocaleLowerCase()===wanted);
  }
  function canEditMvuRoster() { return isTown() && battleStatus() !== 'active' && !state.busy; }
  function canLearnMove() {
    const round = safeNum(first(getMap(), ['轮次', 'turn'], 1), 1);
    return !state.busy && (state.battle?.pendingBattleLearning?.length || battleStatus() === 'finished' || (battleStatus() === 'pending' && round <= 1 && !state.battle));
  }
  function formatMode(mode) {
    return ({ wild: '野生遭遇', trainer: '训练家对战', gym: '道馆挑战', practice: '对练' })[mode] || mode || '本轮遭遇';
  }
  function renderWorld() {
    if (!state.world) return;
    els.retry.disabled = state.busy || !state.retryAction;
    renderTrainer();renderStarterPicker();renderRoundControls();renderHudTabs();renderEncounterSettings();
    if(state.battle&&state.battleFocus){renderActions(state.battle);if(typeof renderBattleResult==='function')renderBattleResult(state.battle);}
    if(!battleOverlay){
      if(!rosterMode){renderStoryScene();renderEncounterPreview();}
      // Hidden panels used to rebuild the whole party, shop, map, PC and all
      // quest controls twice for every battle action. Build only the shown tab.
      if(state.hudTab==='team'){renderMvuStatus();renderParty();renderPc();renderCosmetics();renderDex();}
      else if(state.hudTab==='bag'){renderInventory();renderTools();}
      else if(state.hudTab==='tasks'){renderTasks();renderRocketEvents();}
      else if(state.hudTab==='shop'){renderServices();renderShop();renderClassicServices();}
      else if(state.hudTab==='map')renderMap();
    }
  }
  function renderTools(){
    const node=$('toolsPanel');if(!node||!globalThis.KantoTools)return;
    KantoTools.render(node,{tools:state.tools,gadgets:state.gadgets,world:state.world,busy:state.busy},{asset:assetHref,moveName:id=>moveById(id)?.name||id,onAction:async(action,payload)=>{
      if(state.busy)return;state.busy=true;renderWorld();try{applyWorld(await api('/api/gadget',{method:'POST',body:JSON.stringify({action,payload})}));toast('工具效果已写入MVU。');}catch(error){showPersistentError(error.message,()=>renderTools());}finally{state.busy=false;renderWorld();}
    },onConfig:async(key,value)=>{if(state.busy)return;state.busy=true;renderWorld();try{applyWorld(await api('/api/settings',{method:'POST',body:JSON.stringify({gadgetConfig:{key,value}})}));toast('经验共享模式已更新。');}catch(error){showPersistentError(error.message);}finally{state.busy=false;renderWorld();}}});
  }
  async function sceneAction(action,payload={}){
    if(state.busy)return;state.busy=true;renderWorld();
    try{applyWorld(await api('/api/scene',{method:'POST',body:JSON.stringify({action,payload})}));toast(action==='cosmetic-configure'?'特效设置已保存并装备。':action==='cosmetic-clear'?'当前伙伴已卸下全部特效。':'场景操作已记录。');return true;}
    catch(error){showPersistentError(error.message||'场景操作失败。',()=>sceneAction(action,payload));return false;}
    finally{state.busy=false;renderWorld();}
  }
  function renderCosmetics(){
    if(!els.cosmeticPanel)return;
    if(!window.globalKantoCosmetics||!state.cosmetics){els.cosmeticPanel.textContent='读取舞台外观收藏…';return;}
    if(!els.cosmeticDisclosure?.open)return;
    const renderKey=JSON.stringify([state.cosmetics.inventory,state.cosmetics.equipped,state.cosmetics.parameters,state.cosmetics.party,state.busy]);if(renderKey===state.cosmeticRenderKey)return;
    window.globalKantoCosmetics.render(els.cosmeticPanel,{...state.cosmetics,selectedUid:state.cosmeticTargetUid},({action,id,slot,uid,parameters})=>{
      if(action==='preview'){
        if(state.reducedEffects)return;
        const item=(state.cosmetics.catalog||[]).find(row=>row.id===id),method=({aura:'playEntry',entry:'playEntry',move:'playMove',outcome:'playOutcome'})[slot]||'playMove';
        const active=activeMon(state.battle?.sides?.[0]),previewUid=uid||active?.uid;
        if(!item||!previewUid){toast('请在独立预览中查看，或先进入一场战斗再对战预览。');return;}
        const key='collection-preview';clearCosmeticKey(key);
        const anchor=createCosmeticAnchor(previewUid,'player',0,key);
        if(!anchor){toast('这只伙伴当前没有在场，请选择出战伙伴。');return;}
        const stop=window.globalKantoCosmetics[method]?.(anchor,item.effect,{duration:1550,loop:false});
        state.cosmeticAuras.set(key,()=>{stop?.();anchor.remove();state.cosmeticAnchors.delete(key);});return;
      }
      return sceneAction(action.startsWith('cosmetic-')?action:`cosmetic-${action}`,{id,slot,uid,parameters});
    });
    const target=els.cosmeticPanel.querySelector('.kanto-cosmetic-target');if(target){state.cosmeticTargetUid=target.value;target.addEventListener('change',()=>{state.cosmeticTargetUid=target.value;});}
    state.cosmeticRenderKey=renderKey;
    if(els.cosmeticDisclosure)els.cosmeticDisclosure.dataset.available='true';
  }
  function renderClassicServices(){
    if(!els.classicServices)return;
    if(!window.KantoClassicServices||!state.classicServices){els.classicServices.replaceChildren();return;}
    window.KantoClassicServices.render(els.classicServices,{view:{classicServices:state.classicServices},world:state.world,busy:state.busy},(action,payload)=>sceneAction(action,payload));
  }
  function renderRocketEvents(){
    if(!els.rocketEvents)return;els.rocketEvents.replaceChildren();
    for(const event of state.rocketEvents||[]){
      const card=document.createElement('article');card.className='rocket-event-card';
      const title=document.createElement('h3');title.textContent=event.title||event.id||'火箭队剧情';card.appendChild(title);
      const status=document.createElement('small');status.textContent=event.locked?`未解锁 · ${event.reason||''}`:event.status==='complete'?'已完成':event.stage?.text||`当前阶段：${event.stage?.id||event.status||'可调查'}`;card.appendChild(status);
      for(const choice of event.choices||[]){const button=document.createElement('button');button.type='button';button.textContent=choice.label||choice.id;button.disabled=state.busy||event.locked||choice.enabled===false;
        button.addEventListener('click',()=>sceneAction(choice.requiresBattle?'rocket-battle':'rocket-story-choice',choice.requiresBattle?{eventId:event.id}:{eventId:event.id,choiceId:choice.id}));card.appendChild(button);}
      els.rocketEvents.appendChild(card);
    }
  }
  function doubleBattleReason(){
    const partyReady=getParty().filter(mon=>safeNum(first(mon,['当前HP','hp'],0))>0).length;
    const opponents=Array.isArray(state.world?.遭遇?.队伍)?state.world.遭遇.队伍:Array.isArray(state.world?.遭遇?.team)?state.world.遭遇.team:[];
    if(partyReady<2)return '双打至少需要两只未倒下的同行伙伴。';
    if(battleStatus()!=='finished'&&opponents.length<2)return '当前遭遇的对手不足两只，暂时不能开启双打。';
    return '';
  }
  function renderEncounterSettings(){
    const settings=state.battleSettings||{},reason=doubleBattleReason();
    if(els.bossTier){els.bossTier.value=['original','enhanced','extreme'].includes(settings.bossTier)?settings.bossTier:'auto';els.bossTier.disabled=state.busy||battleStatus()==='active';}
    if(els.battleMode){els.battleMode.value=['singles','doubles'].includes(settings.battleMode)?settings.battleMode:'singles';const option=els.battleMode.querySelector('option[value="doubles"]');if(option)option.disabled=Boolean(reason);els.battleMode.disabled=state.busy||battleStatus()==='active';}
    if(els.battleModeReason)els.battleModeReason.textContent=reason;
  }
  async function updateBattleSetting(key,value){
    if(state.busy||battleStatus()==='active')return;
    if(key==='battleMode'&&value==='doubles'&&doubleBattleReason())return toast(doubleBattleReason());
    state.busy=true;renderWorld();try{applyWorld(await api('/api/settings',{method:'POST',body:JSON.stringify({[key]:value})}));toast(key==='bossTier'?'首领难度已更新。':'对战形式已更新。');}
    catch(error){showPersistentError(error.message||'对战设置更新失败。',()=>updateBattleSetting(key,value));}
    finally{state.busy=false;renderWorld();}
  }
  function renderTrainer() {
    const trainer = state.world?.训练家 || {}, map = getMap();
    const name = first(trainer, ['姓名', 'name'], '训练家'), badges = first(trainer, ['徽章', '徽章列表'], []);
    const location = first(map, ['地点', 'locationName'], '关都');
    const round = first(map, ['轮次', 'turn'], 1);
    els.trainer.textContent = name; els.badges.textContent = `${Array.isArray(badges) ? badges.length : safeNum(badges)} 枚徽章`;
    els.money.textContent = `₽ ${first(trainer, ['金钱', 'money'], '—')}`;
    els.hudTrainerName.textContent = name;
    els.hudMoney.textContent = `₽ ${first(trainer, ['金钱', 'money'], '—')}`;
    els.hudBadges.textContent = `徽章 ${Array.isArray(badges) ? badges.length : safeNum(badges)}`;
    els.hudLocation.textContent = `${location} · 第 ${round} 轮`;
    const progression = state.progression || {}, cap = progression.levelCap;
    const hasCap = Number.isFinite(Number(cap)) && cap !== null && cap !== '';
    const badgeTotal = safeNum(progression.badges, Array.isArray(badges) ? badges.length : safeNum(badges));
    const league = progression.leagueProgress;
    const nextGym = progression.nextGym;
    els.levelCap.textContent = hasCap ? `等级上限 Lv. ${cap}` : '等级上限 —';
    const nextGymLabel = nextGym === null ? '道馆挑战完成' : Number.isFinite(Number(nextGym)) ? `下一道馆 ${Number(nextGym) + 1}` : '';
    els.hudProgression.textContent = [hasCap ? `等级上限 Lv. ${cap}` : '', `道馆 ${badgeTotal}/8`, nextGymLabel, league !== undefined && league !== null ? `联盟进度 ${league}` : ''].filter(Boolean).join(' · ');
    els.trainerSummary.textContent = `旅程围绕每轮遭遇推进 · ${location}`;
    els.teamCount.textContent = `${getParty().length} 只同行`;
    const overCap = hasCap ? getParty().filter(mon => safeNum(first(mon, ['等级', 'level'], 0)) > Number(cap)).length : 0;
    els.partySummary.textContent = hasCap
      ? `当前等级上限 Lv. ${cap}${overCap ? ` · ${overCap} 只伙伴已超过上限，保留原等级` : ''}`
      : '队伍数据来自当前 MVU 人物卡';
    els.locationEyebrow.textContent = `${first(map, ['区域', 'region'], '关都地区')} · 第 ${round} 轮`;
    els.mapTitle.textContent = first(map, ['区域', 'region'], '关都地区'); els.mapCurrent.textContent = `当前位置：${location}`;
    els.turn.textContent = `第 ${round} 轮`;
  }
  function renderMvuStatus() {
    const round = safeNum(first(getMap(), ['轮次', 'turn'], 1), 1), status = battleStatus();
    const statusText = ({ pending: '待开始', active: '进行中', finished: '已结束' })[status] || '待开始';
    els.mvuIndicator.textContent = state.initialized ? '已初始化' : '未初始化';
    els.mvuIndicator.classList.toggle('is-ready', state.initialized);
    els.mvuSummary.textContent = state.initialized ? `剧情第 ${round} 轮 · 战斗${statusText} · ${first(getMap(), ['地点', 'locationName'], '关都')}` : '正在连接人物卡…';
    renderMvuJson();
    els.downloadMvu.disabled = !state.world;
  }
  function renderMvuJson() {
    if (!els.mvuJson.parentElement?.open || state.mvuJsonWorld === state.world) return;
    els.mvuJson.textContent = state.world ? JSON.stringify(state.world, null, 2) : '等待人物卡状态。';
    state.mvuJsonWorld = state.world;
  }
  function hasStarterChoice() { return Boolean(state.starterChosen || state.world?.剧情?.初始御三家已选); }
  function isOpeningPreparation() {
    const map = getMap(), round = safeNum(first(map, ['轮次', 'turn'], 1), 1), node = currentNodeId();
    const location = state.locations.find(item => String(item.id) === node);
    return !hasStarterChoice() && getEncounter().训练家 === '小茂' && battleStatus() === 'pending' && !state.battle &&
      (node === 'pallet' || String(first(map, ['地点', 'locationName'], '')) === '真新镇' || String(location?.name || '') === '真新镇');
  }
  function normalizeLookup(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]/g, ''); }
  function findTrainer(presentation, id, name) {
    const trainers = Array.isArray(presentation?.trainers) ? presentation.trainers : [];
    const wantedId = normalizeLookup(id), wantedName = normalizeLookup(name);
    return trainers.find(trainer => normalizeLookup(trainer.id) === wantedId && wantedId) || trainers.find(trainer => {
      const labels = [trainer.name, trainer.role, ...(Array.isArray(trainer.aliases) ? trainer.aliases : [])].map(normalizeLookup);
      return labels.some(label => label && (label === wantedName || (wantedName && label.includes(wantedName))));
    }) || null;
  }
  function chooseSceneBackground(presentation, scene) {
    const backgrounds = Array.isArray(presentation?.backgrounds) ? presentation.backgrounds : [];
    const node = currentNodeId(), location = String(first(getMap(), ['地点', 'locationName'], ''));
    return backgrounds.find(item => String(item.id) === String(scene?.backgroundId)) || backgrounds.find(item => {
      const locations = Array.isArray(item.locations) ? item.locations.map(String) : [];
      return locations.includes(node) || locations.includes(location);
    }) || null;
  }
  function renderStoryScene() {
    const presentation = state.presentation || {}, scene = presentation.scene || {}, initial = isOpeningPreparation(), chosen = hasStarterChoice();
    const sceneLocation = first(scene, ['location'], first(getMap(), ['地点', 'locationName'], '关都旅程'));
    const backgrounds = chooseSceneBackground(presentation, scene), backgroundPath = localResourceUrl(scene.sceneryImage || backgrounds?.image || scene.backgroundImage);
    els.sceneBackground.style.backgroundImage = backgroundPath ? `linear-gradient(90deg,rgba(27,42,31,.12),rgba(27,42,31,.34)),url("${backgroundPath}")` : '';
    const beat = state.stageBeat || {};
    const trainerMatch = beat.speaker ? findTrainer(presentation, beat.speaker, beat.speaker) : initial ? findTrainer(presentation, chosen ? 'rival_early' : '', chosen ? '小茂' : '大木') : findTrainer(presentation, scene.npcId, scene.npcName);
    const npcName = trainerMatch?.name || beat.speaker || (initial ? chosen ? '小茂' : '大木博士' : scene.npcName || '关都旅人');
    const npcRole = trainerMatch?.role || beat.emotion || (initial ? chosen ? '劲敌 · 训练家' : '关都宝可梦博士' : '旅程同行者');
    const npcPath = localResourceUrl(trainerMatch?.art || trainerMatch?.image || scene.npcImage);
    els.npcName.textContent = npcName; els.npcRole.textContent = npcRole;
    els.npcFallback.textContent = npcName;
    els.npcSprite.classList.toggle('portrait-artwork', Boolean(trainerMatch && trainerMatch.spriteType !== 'overworld-frame'));
    els.npcSprite.hidden = !npcPath; els.npcFallback.hidden = Boolean(npcPath);
    if (npcPath) { els.npcSprite.src = npcPath; els.npcSprite.onerror = () => { els.npcSprite.hidden = true; els.npcFallback.hidden = false; }; }
    els.sceneLocation.textContent = `${sceneLocation}${scene.sceneryName ? ` · ${scene.sceneryName}` : backgrounds?.name ? ` · ${backgrounds.name}` : ''}`;
    const encounterTrainer = first(getEncounter(), ['训练家', 'name'], '关都旅程');
    els.sceneRole.textContent = initial ? chosen ? '真新镇 · 首场劲敌对战' : '真新镇 · 大木研究所' : scene.role || (typeof encounterTrainer === 'string' ? encounterTrainer : first(encounterTrainer, ['姓名', 'name'], '关都旅程'));
    const fallbackText = initial ? chosen ? '小茂已经准备好与你进行第一场对战。' : '先从三只关都最初伙伴中选择一只，再开始与小茂对战。' : '剧情与遭遇由人物卡 MVU 推进。';
    els.sceneText.textContent = safeStageText(beat.text || scene.text, fallbackText);
    els.sceneOutcome.hidden = true;
    els.sceneOutcome.textContent = '';
    const arenaPath = localResourceUrl(scene.sceneryImage || scene.backgroundImage || backgrounds?.image);
    els.arenaBackdrop.style.backgroundImage = arenaPath ? `linear-gradient(rgba(226,242,205,.28),rgba(113,151,95,.35)),url("${arenaPath}")` : '';
    state.sceneryAvailable = Boolean(scene.sceneryImage && localResourceUrl(scene.sceneryImage));
    setBattleSceneryStyle(state.battleSceneryStyle);
  }
  async function refreshPresentation() {
    try {
      const presentation = await api('/api/presentation');
      if (presentation && typeof presentation === 'object') state.presentation = presentation;
      renderStoryScene(); return state.presentation;
    } catch (_) { return state.presentation; }
  }
  function downloadWorldJson() {
    if (!state.world) return;
    const blob = new Blob([JSON.stringify(state.world, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'pokemon-mvu-state.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function renderParty() {
    const party = getParty(); els.team.replaceChildren();
    if (!party.length) { const empty = document.createElement('div'); empty.className = 'team-empty'; empty.textContent = '人物卡队伍为空。请在正文中选择或获得同行宝可梦。'; els.team.appendChild(empty); }
    party.forEach(entry => {
      const id = dexId(entry), species = speciesById(id), name = first(entry, ['昵称', 'name'], species?.name || `No. ${id}`);
      const card = document.createElement('details'); card.className = 'mvu-mon-card';
      const disclosureKey = String(entry.uid ?? ''); card.open = Boolean(disclosureKey && state.partyDisclosure[disclosureKey]);
      card.addEventListener('toggle', () => { if (disclosureKey) state.partyDisclosure[disclosureKey] = card.open; });
      const head = document.createElement('summary'); head.className = 'mvu-mon-head mvu-mon-summary';
      const portrait = document.createElement('img'); portrait.className = 'mvu-mon-portrait artwork-portrait'; portrait.alt = ''; portrait.src = artworkUrl(id,isShiny(entry)); portrait.onerror = () => { portrait.onerror = () => { portrait.hidden = true; }; portrait.src = assetUrl(id,false,isShiny(entry)); };
      const identity = document.createElement('div'); identity.className = 'mvu-mon-identity';
      const title = document.createElement('strong'); title.textContent = name;
      if (entry.体型标记 === 'lighthouse-giant-dratini' && id === 147) { portrait.style.scale = '1.2'; title.textContent += ' · 巨型'; }
      const types = (species?.types || []).map(typeName).join(' / ') || '属性未记录';
      const sub = document.createElement('span'); sub.textContent = `No. ${String(id).padStart(3, '0')} · Lv. ${first(entry, ['等级', 'level'], '—')} · ${types}`;
      identity.append(title, sub);
      const status = document.createElement('span'); status.className = `party-status${entry.状态 ? ' has-condition' : ''}`; status.textContent = entry.状态 ? (statusNames[entry.状态] || entry.状态) : '正常';
      const summaryMeta = document.createElement('span'); summaryMeta.className = 'mvu-summary-meta';
      const hp = document.createElement('span'); hp.className = 'mvu-summary-hp'; hp.textContent = `HP ${first(entry, ['当前HP', 'hp'], '—')}/${first(entry, ['最大HP', 'maxhp'], first(entry.能力值, ['hp', 'HP'], '—'))}`;
      summaryMeta.appendChild(hp); summaryMeta.appendChild(status);
      if (isShiny(entry)) { const shiny = document.createElement('span'); shiny.className = 'mvu-summary-badge is-shiny'; shiny.textContent = '✦ 闪光'; summaryMeta.appendChild(shiny); }
      const heldId = String(first(entry, ['携带道具', 'heldItem', 'heldItemId'], '') || '');
      if (heldId) { const held = document.createElement('span'); held.className = 'mvu-summary-badge'; held.textContent = '持有 · '+itemName(heldId); summaryMeta.appendChild(held); }
      head.append(portrait, identity, summaryMeta); card.appendChild(head);
      const content = document.createElement('div'); content.className = 'mvu-mon-detail'; card.appendChild(content);
      if (party.length > 1) {
        const lead = document.createElement('button'); lead.type = 'button'; lead.className = 'roster-button lead-button';
        lead.textContent = party[0].uid === entry.uid ? '首发伙伴' : '设为首发';
        lead.disabled = party[0].uid === entry.uid || state.busy || battleStatus() === 'active' || entry.当前HP <= 0;
        lead.addEventListener('click', () => managePartyAction(entry.uid, 'lead')); content.appendChild(lead);
      }
      const nature = first(entry, ['性格', 'nature'], '性格未记录');
      const expLine = document.createElement('p'); expLine.className = 'mon-exp'; expLine.textContent = `经验 ${first(entry, ['经验', 'exp'], '—')} · ${state.dex?.natureNames?.[normalizeLookup(nature)] || nature}`; content.appendChild(expLine);
      const ability = document.createElement('p'); ability.className = 'mon-ability'; const abilityId = first(entry, ['特性', 'ability'], '未记录'); ability.textContent = `特性 · ${state.dex?.abilityNames?.[normalizeLookup(abilityId)] || abilityId}`; content.appendChild(ability);
      const bondDisclosure = renderCompanionBond(entry, name); if (bondDisclosure) content.appendChild(bondDisclosure);
      const iv = entry.个体值 || {}, ev = entry.努力值 || {}, actual = entry.能力值 || {};
      const stats = document.createElement('div'); stats.className = 'mvu-stats-grid';
      statList.forEach(([key, label]) => {
        const stat = document.createElement('div'); stat.className = 'mvu-stat';
        const statName = document.createElement('b'); statName.textContent = label;
        const statValue = document.createElement('span'); statValue.textContent = `${first(actual, [key, key.toUpperCase()], '—')}`;
        const detail = document.createElement('small'); detail.textContent = `IV ${first(iv, [key, key.toUpperCase()], '—')} · EV ${first(ev, [key, key.toUpperCase()], '—')}`;
        stat.append(statName, statValue, detail); stats.appendChild(stat);
      }); content.appendChild(stats);
      const moves = Array.isArray(entry.招式) ? entry.招式 : [];
      const moveList = document.createElement('div'); moveList.className = 'mvu-moves';
      if (!moves.length) { const noMove = document.createElement('span'); noMove.className = 'party-move empty'; noMove.textContent = '没有登记招式'; moveList.appendChild(noMove); }
      moves.forEach(slot => {
        const move = moveById(slot.id || slot.招式 || slot.name), chip = document.createElement('details'); chip.className = 'party-move';
        const summary=document.createElement('summary');summary.textContent=`${move?.name || slot.id || slot.招式 || slot.name} · ${typeName(move?.type)} · PP ${first(slot,['PP','pp'],'—')}/${first(slot,['PP上限','maxpp'],'—')}`;const explanation=document.createElement('p');explanation.textContent=learningMoveDetail(slot.id || slot.招式 || slot.name, slot);chip.append(summary,explanation);
        if (move?.description) chip.title = move.description;
        moveList.appendChild(chip);
      }); content.appendChild(moveList);
      content.appendChild(renderMonManagement(entry, moves, id));
      const cosmeticSlots = state.cosmetics?.equipped?.伙伴?.[entry.uid] || state.cosmetics?.equipped?.全局 || {};
      const cosmeticCatalog = [...(state.cosmetics?.inventory || []), ...(state.cosmetics?.catalog || [])];
      const equippedEffects = Object.entries(cosmeticSlots).map(([slot, cosmeticId]) => ({slot, cosmetic:cosmeticCatalog.find(item=>item.id===cosmeticId)})).filter(row=>row.cosmetic);
      if (equippedEffects.length) { const effects = document.createElement('p'); effects.className = 'mon-cosmetic-effects'; effects.textContent = '舞台特效 · '+equippedEffects.map(row=>`${({aura:'光环',entry:'登场',move:'招式',outcome:'胜利'})[row.slot]||row.slot}：${row.cosmetic.name}`).join(' · '); content.appendChild(effects); }
      if (canEditMvuRoster() && party.length > 1 && entry.uid !== undefined) {
        const actions = document.createElement('div'); actions.className = 'roster-actions';
        const deposit = document.createElement('button'); deposit.type = 'button'; deposit.className = 'roster-button'; deposit.textContent = '存入电脑';
        deposit.disabled = state.busy; deposit.addEventListener('click', () => moveBox(entry, 'deposit'));
        actions.appendChild(deposit); content.appendChild(actions);
      }
      const pendingMoves = Array.isArray(entry.待学招式) ? entry.待学招式 : [];
      if (pendingMoves.length) {
        const panel = document.createElement('section'); panel.className = 'learn-panel';
        const title = document.createElement('strong'); title.className = 'learn-title'; title.textContent = '待学新招式'+(pendingMoves.length>1?` · 依次处理 ${pendingMoves.length} 招`:''); panel.appendChild(title);
        pendingMoves.slice(0,1).forEach(rawMove => {
          const moveId = String(typeof rawMove === 'string' ? rawMove : first(rawMove, ['id', 'move'], '')).toLowerCase();
          if (!moveId) return;
          const move = moveById(moveId), row = document.createElement('div'); row.className = 'learn-row';
          const label = document.createElement('span'); label.textContent = move?.name || (typeof rawMove === 'string' ? rawMove : moveId);
          const choices = document.createElement('div'); choices.className = 'learn-choices';
          const currentMoves = Array.isArray(entry.招式) ? entry.招式 : [];
          Array.from({ length: 4 }, (_, index) => currentMoves[index] || null).forEach((current, index) => {
            const currentId = current && (current.id || current.招式 || current.name), currentMove = moveById(currentId);
            const button = document.createElement('button'); button.type = 'button'; button.className = 'learn-button';
            button.textContent = `替换 ${index + 1} · ${currentMove?.name || current?.名称 || currentId || '空招式槽'}`;
            button.disabled = !canLearnMove() || entry.uid === undefined || isHmMove(currentId) || index>currentMoves.length;
            button.addEventListener('click', () => learnMove(entry.uid, moveId, index + 1)); choices.appendChild(button);
          });
          const abandon = document.createElement('button'); abandon.type = 'button'; abandon.className = 'learn-button decline'; abandon.textContent = '放弃';
          abandon.disabled = !canLearnMove() || entry.uid === undefined;
          abandon.addEventListener('click', () => learnMove(entry.uid, moveId, 0)); choices.appendChild(abandon);
          row.append(label, choices); panel.appendChild(row);
        });
        if (!canLearnMove()) { const note = document.createElement('small'); note.className = 'learn-note'; note.textContent = '战斗中暂不能学习招式。'; panel.appendChild(note); }
        content.appendChild(panel);
      }
      els.team.appendChild(card);
    });
    for (let index = party.length; index < 6; index++) {
      const emptySlot = document.createElement('div'); emptySlot.className = 'mvu-empty-slot';
      const number = document.createElement('b'); number.textContent = String(index + 1).padStart(2, '0');
      const label = document.createElement('span'); label.textContent = '空队伍槽';
      emptySlot.append(number, label); els.team.appendChild(emptySlot);
    }
  }
  function renderMonManagement(entry, moves, speciesId) {
    const details = document.createElement('details'); details.className = 'mon-management';
    const summary = document.createElement('summary'); summary.textContent = '管理'; details.appendChild(summary);
    const panel = document.createElement('div'); panel.className = 'mon-management-panel';
    const allowed = battleStatus() !== 'active' && !state.busy && entry.uid !== undefined;
    const guard = document.createElement('small'); guard.className = 'management-note';
    if (battleStatus() === 'active') guard.textContent = '战斗中暂不能管理宝可梦。';
    else if (entry.uid === undefined) guard.textContent = '这只宝可梦没有可写回 MVU 的唯一编号。';
    else guard.textContent = '操作会直接更新人物卡 MVU。';

    const moveSection = document.createElement('div'); moveSection.className = 'management-section';
    const moveTitle = document.createElement('strong'); moveTitle.textContent = '忘掉招式'; moveSection.appendChild(moveTitle);
    const moveRow = document.createElement('div'); moveRow.className = 'management-row';
    const moveSelect = document.createElement('select'); moveSelect.className = 'management-select'; moveSelect.setAttribute('aria-label', nameOfMon(entry, speciesId) + '要忘掉的招式');
    moves.forEach((slot, index) => {
      const id = slot.id || slot.招式 || slot.name, def = moveById(id), option = document.createElement('option');
        option.value = String(index + 1); option.textContent = `${index + 1}. ${def?.name || slot.名称 || id || '招式'}${isHmMove(id)?' · 秘传':''}`;option.disabled=isHmMove(id)&&currentNodeId()!=='fuchsia';moveSelect.appendChild(option);
    });
    if (!moves.length) { const option = document.createElement('option'); option.value = ''; option.textContent = '没有可忘掉的招式'; moveSelect.appendChild(option); }
    const forget = document.createElement('button'); forget.type = 'button'; forget.className = 'management-button'; forget.textContent = '忘掉所选';
    forget.disabled = !allowed || moves.length <= 1 || [...moveSelect.options].every(option=>option.disabled);
    const confirm = document.createElement('div'); confirm.className = 'management-confirm'; confirm.hidden = true;
    const confirmText = document.createElement('span'); confirmText.textContent = '确认忘掉所选招式？队伍至少保留一招。';
    const confirmYes = document.createElement('button'); confirmYes.type = 'button'; confirmYes.className = 'management-button danger'; confirmYes.textContent = '确认忘掉';
    const confirmNo = document.createElement('button'); confirmNo.type = 'button'; confirmNo.className = 'management-button'; confirmNo.textContent = '取消';
    forget.addEventListener('click', () => { if (allowed && moves.length > 1) confirm.hidden = false; });
    confirmYes.disabled = !allowed || moves.length <= 1;
    confirmYes.addEventListener('click', () => { const slot = Number(moveSelect.value); if (confirm.hidden || !slot || slot < 1 || slot > moves.length) return; confirm.hidden = true; managePartyAction(entry.uid, isHmMove(moves[slot-1].id)?'forgetHm':'forget', { slot }); });
    confirmNo.addEventListener('click', () => { confirm.hidden = true; });
    confirm.append(confirmText, confirmYes, confirmNo); moveRow.append(moveSelect, forget); moveSection.append(moveRow, confirm);
    if (moves.length <= 1) { const note = document.createElement('small'); note.className = 'management-note'; note.textContent = '至少保留一招，当前不能忘掉最后一招。'; moveSection.appendChild(note); }
    if(moves.some(move=>isHmMove(move.id))){const note=document.createElement('small');note.className='management-note';note.textContent=currentNodeId()==='fuchsia'?'在浅红市，可请遗忘爷爷删除秘传招式。':'秘传招式须到浅红市找遗忘爷爷删除。';moveSection.appendChild(note);}
    panel.appendChild(moveSection);

    const heldId = String(first(entry, ['携带道具', 'heldItem', 'heldItemId'], '') || '');
    const heldSection = document.createElement('div'); heldSection.className = 'management-section';
    const heldTitle = document.createElement('strong'); heldTitle.textContent = '持有物'; heldSection.appendChild(heldTitle);
    const heldNow = document.createElement('small'); heldNow.className = 'management-note'; heldNow.textContent = `当前：${heldId ? itemName(heldId) : '无'}`; heldSection.appendChild(heldNow);
    const heldRow = document.createElement('div'); heldRow.className = 'management-row';
    const heldSelect = document.createElement('select'); heldSelect.className = 'management-select'; heldSelect.setAttribute('aria-label', nameOfMon(entry, speciesId) + '选择持有物');
    const heldDefault = document.createElement('option'); heldDefault.value = ''; heldDefault.textContent = '选择背包中的持有物'; heldSelect.appendChild(heldDefault);
    catalogEntries().filter(([itemId, def]) => String(first(def, ['category', '类别'], '')).toLowerCase() === 'held' && itemCount([itemId]) > 0).forEach(([itemId]) => {
      const option = document.createElement('option'); option.value = itemId; option.textContent = `${itemName(itemId)} ×${itemCount([itemId])}`; heldSelect.appendChild(option);
    });
    const hold = document.createElement('button'); hold.type = 'button'; hold.className = 'management-button'; hold.textContent = '装备';
    hold.disabled = !allowed || !heldSelect.options.length || heldSelect.options.length <= 1;
    hold.addEventListener('click', () => { if (heldSelect.value) managePartyAction(entry.uid, 'hold', { itemId: heldSelect.value }); });
    const take = document.createElement('button'); take.type = 'button'; take.className = 'management-button'; take.textContent = '取下'; take.disabled = !allowed || !heldId;
    take.addEventListener('click', () => { if (heldId) managePartyAction(entry.uid, 'take', { itemId: heldId }); });
    heldRow.append(heldSelect, hold, take); heldSection.appendChild(heldRow); panel.appendChild(heldSection);

    const legalStones = Object.entries(evolutionStonesBySpecies).filter(([, ids]) => ids.includes(Number(speciesId))).map(([itemId]) => itemId);
    const availableStones = legalStones.filter(itemId => itemCount([itemId]) > 0);
    if(entry.待进化?.length)panel.appendChild(renderPendingEvolution(entry));
    const evolveSection = document.createElement('div'); evolveSection.className = 'management-section';
    const evolveTitle = document.createElement('strong'); evolveTitle.textContent = '石头进化'; evolveSection.appendChild(evolveTitle);
    const evolveRow = document.createElement('div'); evolveRow.className = 'management-row';
    const stoneSelect = document.createElement('select'); stoneSelect.className = 'management-select'; stoneSelect.setAttribute('aria-label', nameOfMon(entry, speciesId) + '选择进化石');
    if (availableStones.length) {
      availableStones.forEach(itemId => { const option = document.createElement('option'); option.value = itemId; option.textContent = `${itemName(itemId)} ×${itemCount([itemId])}`; stoneSelect.appendChild(option); });
    } else {
      const option = document.createElement('option'); option.value = ''; option.textContent = legalStones.length ? '背包没有适用的进化石' : '没有可用的石头进化'; stoneSelect.appendChild(option);
    }
    const evolve = document.createElement('button'); evolve.type = 'button'; evolve.className = 'management-button'; evolve.textContent = '使用进化石'; evolve.disabled = !allowed || availableStones.length === 0;
    evolve.addEventListener('click', () => { const itemId = stoneSelect.value; if (itemId && availableStones.includes(itemId)) managePartyAction(entry.uid, 'evolve', { itemId }); });
    evolveRow.append(stoneSelect, evolve); evolveSection.appendChild(evolveRow);
    const evolveNote = document.createElement('small'); evolveNote.className = 'management-note';
    evolveNote.textContent = availableStones.length ? '服务器会再次校验进化条件；确认使用后会消耗一颗石头。' : legalStones.length ? '背包中没有这只宝可梦适用的进化石。' : '此宝可梦没有已支持的关都石头进化方式。';
    evolveSection.appendChild(evolveNote); panel.appendChild(evolveSection);
    panel.appendChild(renderReleaseControl(entry, allowed));
    panel.appendChild(guard); details.appendChild(panel); return details;
  }
  function renderReleaseControl(entry, allowed) {
    const section=document.createElement('div');section.className='management-section';
    const begin=document.createElement('button');begin.type='button';begin.className='management-button danger';begin.textContent='放生';begin.disabled=!allowed;
    const confirmation=document.createElement('div');confirmation.className='management-confirm';confirmation.hidden=true;
    const label=document.createElement('span');label.textContent=`确认放生${first(entry,['昵称','name'],'这只宝可梦')}？放生后无法找回。`;
    const yes=document.createElement('button');yes.type='button';yes.className='management-button danger';yes.textContent='确认永久放生';yes.disabled=!allowed;
    const no=document.createElement('button');no.type='button';no.className='management-button';no.textContent='取消';
    begin.addEventListener('click',()=>{if(allowed)confirmation.hidden=false;});
    no.addEventListener('click',()=>{confirmation.hidden=true;});
    yes.addEventListener('click',()=>{if(!allowed||confirmation.hidden||state.busy)return;confirmation.hidden=true;managePartyAction(entry.uid,'release',{confirmed:true});});
    confirmation.append(label,yes,no);section.append(begin,confirmation);return section;
  }
  function nameOfMon(entry, speciesId) { return String(first(entry, ['昵称', 'name'], speciesById(speciesId)?.name || '宝可梦')); }
  function renderPendingEvolution(entry) {
    const pending=entry.待进化[0],section=document.createElement('section');section.className='evolution-showcase';
    const before=document.createElement('img');before.src=assetUrl(pending.from,false,isShiny(entry));before.alt=entry.昵称||'进化前';
    const after=document.createElement('img');after.src=assetUrl(pending.to,false,isShiny(entry));after.alt=speciesById(pending.to)?.name||'进化后';
    const label=document.createElement('strong');label.textContent=`${entry.昵称||'伙伴'}可以进化为${after.alt}`;
    const yes=document.createElement('button');yes.type='button';yes.textContent='确认进化';
    const no=document.createElement('button');no.type='button';no.textContent='这次不进化';
    yes.disabled=no.disabled=state.busy||battleStatus()==='active';
    yes.addEventListener('click',()=>managePartyAction(entry.uid,'evolutionConfirm',{decisionId:pending.id}));
    no.addEventListener('click',()=>managePartyAction(entry.uid,'evolutionCancel',{decisionId:pending.id}));
    section.append(before,after,label,yes,no);return section;
  }
  async function managePartyAction(uid, operation, extra = {}) {
    if (state.busy || battleStatus() === 'active' || uid === undefined || uid === null) return;
    if (operation === 'forget' && getParty().find(mon => mon.uid === uid)?.招式?.length <= 1) return toast('至少要保留一招。');
    state.busy = true; renderWorld();
    try {
      const result = await api('/api/party', { method: 'POST', body: JSON.stringify({ operation, uid, ...extra }) });
      applyWorld(result);
      const item = extra.itemId ? itemName(extra.itemId) : '';
      toast(({ release:'已放生这只宝可梦。', forget: '已忘掉所选招式。', hold: `已装备${item}。`, take: '已取下持有物。', evolve: `已使用${item}。` })[operation] || '队伍已更新。');
    } catch (error) { showPersistentError(error.message || '队伍管理失败。', () => managePartyAction(uid, operation, extra)); }
    finally { state.busy = false; renderWorld(); }
  }
  function normalizeItemList(items) {
    if (Array.isArray(items)) return items.map(item => typeof item === 'string' ? [item, 1] : [first(item, ['id', 'key', '名称', 'name'], 'item'), safeNum(first(item, ['数量', 'count', 'quantity'], 1))]);
    if (items && typeof items === 'object') return Object.entries(items).map(([id, count]) => [id, safeNum(typeof count === 'object' ? first(count, ['数量', 'count'], 0) : count)]);
    return [];
  }
  let itemCatalogCache = null;
  function catalogIndex() {
    const catalog = state.items?.items || state.items?.catalog || state.items;
    const machines = state.machines;
    if (itemCatalogCache?.catalog === catalog && itemCatalogCache?.machines === machines) return itemCatalogCache;
    const entries=Array.isArray(catalog)?catalog.map(item => [String(first(item, ['id', 'key', 'item'], '')), item]).filter(([id]) => id):catalog&&typeof catalog==='object'?Object.entries(catalog).map(([id, definition]) => [id, typeof definition === 'object' ? definition : { id, name: itemLabels[id.toLowerCase()] || id }]):[];
    entries.push(...(machines||[]).map(machine=>[String(machine.id),machine]));
    const index = new Map();
    for (const [id, definition] of entries) {
      const keys=[String(id).toLowerCase(),String(first(definition,['id','key'],'')).toLowerCase()];
      for (const key of keys) if (key && !index.has(key)) index.set(key,definition);
    }
    return itemCatalogCache={catalog,machines,entries,index};
  }
  function catalogEntries() { return catalogIndex().entries; }
  function itemDefinition(id) { return catalogIndex().index.get(String(id || '').toLowerCase()) || {}; }
  const chineseText = /[㐀-鿿豈-﫿]/;
  function textValue(value) { return typeof value === 'string' ? value.trim() : ''; }
  function hasChineseText(value) { return chineseText.test(textValue(value)); }
  function preferredText(values, fallback = '') {
    const texts = values.map(textValue).filter(Boolean);
    return texts.find(hasChineseText) || texts[0] || fallback;
  }
  function machineMoveName(def) {
    if (!def || (def.kind !== 'tm' && def.kind !== 'hm')) return '';
    const move = def.move && state.moves ? moveById(def.move) : null;
    const name = preferredText([def.moveNameZh, def.moveName, move?.name]);
    if (!name) return '';
    const number = Number(def.number);
    return Number.isInteger(number) && number > 0 ? `${def.kind === 'hm' ? 'HM' : 'TM'}${String(number).padStart(2, '0')} ${name}` : name;
  }
  function itemName(id) {
    const def = itemDefinition(id), fallback = itemLabels[String(id).toLowerCase()] || id;
    return String(preferredText([def.nameZh, def['中文名'], def['名称'], def.name, def.label, machineMoveName(def), fallback]));
  }
  function itemDescription(id, def = itemDefinition(id)) {
    const definition = def || {};
    const direct = preferredText([definition.descriptionZh, definition.descZh, definition['说明'], definition['中文说明'], definition.description, definition.effectDescription, definition['效果说明']]);
    if (direct) return direct;
    if (definition.kind !== 'tm' && definition.kind !== 'hm') return '';
    const move = definition.move && state.moves ? moveById(definition.move) : null;
    return preferredText([definition.moveDescriptionZh, move?.description]);
  }
  function rewardItemLabel(item) {
    const provided = textValue(first(item, ['名称', 'name', 'label'], ''));
    const id = first(item, ['id', 'key'], '');
    const catalogued = id === '' || id === null || id === undefined ? '' : itemName(id);
    return !hasChineseText(provided) && hasChineseText(catalogued) ? catalogued : provided || catalogued || '道具';
  }
  function renderHudTabs() {
    if (els.hudTabs) els.hudTabs.querySelectorAll('[data-hud-tab]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.hudTab === state.hudTab)));
    document.querySelectorAll('[data-hud-panel]').forEach(panel => { panel.hidden = panel.dataset.hudPanel !== state.hudTab; });
  }
  function selectHudTab(tab) {
    if (!['team', 'bag', 'tasks', 'shop', 'map'].includes(tab)) return;
    state.hudTab = tab; document.body.dataset.hudTab = tab; renderWorld();
  }
  function companionBondFor(entry, world = state.world) {
    if (typeof entry?.uid !== 'string' || !entry.uid || !Object.hasOwn(world?.羁绊?.伙伴 || {}, entry.uid)) return null;
    const record = world.羁绊.伙伴[entry.uid];
    if (!record || typeof record !== 'object') return null;
    return {
      trust: Number.isInteger(record.信赖) ? record.信赖 : null,
      mood: typeof record.心情 === 'string' ? record.心情 : '',
      memories: (Array.isArray(record.共同记忆) ? record.共同记忆 : []).slice(-3).reverse().map(item => String(first(item, ['事件', 'event'], '') || '')).filter(Boolean),
    };
  }
  function renderCompanionBond(entry, name) {
    const panel = document.createElement('details'); panel.className = 'companion-bond';
    panel.open=state.companionOpen?.[entry.uid]===true;
    panel.addEventListener('toggle',()=>{state.companionOpen={...(state.companionOpen||{}),[entry.uid]:panel.open};});
    const title = document.createElement('summary'); title.className = 'companion-bond-title';
    const current=state.companionship?.benefits?.find(item=>item.uid===entry.uid);
    title.textContent='共同旅程'+(current?` · ${current.currentTier} · 信赖 ${current.trust}/100`:'');panel.appendChild(title);
    const record = companionBondFor(entry);
    if (record) {
      const details = document.createElement('p'); details.className = 'companion-bond-details';
      const trust = record.trust === null ? '信赖尚未记录' : `信赖 ${record.trust}/100`;
      details.textContent = `${trust}${record.mood ? ` · 心情 ${record.mood}` : ''}`; panel.appendChild(details);
      const benefits=state.companionship?.benefits?.find(item=>item.uid===entry.uid);
      if(benefits){
        if(benefits.trust===100){panel.classList.add('is-bond-max');const badge=document.createElement('strong');badge.className='companion-max-badge';badge.textContent='心意相通';panel.appendChild(badge);for(let i=0;i<7;i++){const mote=document.createElement('i');mote.className='companion-bond-mote';mote.setAttribute('aria-hidden','true');mote.style.setProperty('--mote-index',i);panel.appendChild(mote);}}
        const progress=document.createElement('progress');progress.className='companion-trust-progress';progress.max=100;progress.value=benefits.trust;progress.setAttribute('aria-label',`${name}信赖 ${benefits.trust}/100`);panel.appendChild(progress);
        const effect=document.createElement('p');effect.className='companion-benefits';
        effect.textContent=`${benefits.currentTier} · 战后经验 +${benefits.experienceBonusPercent}% · 休憩恢复 ${benefits.campHpPercent}% HP${benefits.campPp?` / 每招 ${benefits.campPp} PP`:''}`;panel.appendChild(effect);
        if(state.world?.设置?.bondBattleEffects!==false&&(benefits.battleEffects?.inboundAccuracyMultiplier<1||benefits.battleEffects?.critStageBonus)){
          const battle=document.createElement('small');battle.className='companion-friendship';const buffs=[];
          if(benefits.battleEffects.inboundAccuracyMultiplier<1)buffs.push(`对手普通命中检定 ×${benefits.battleEffects.inboundAccuracyMultiplier}`);
          if(benefits.battleEffects.critStageBonus)buffs.push(`要害等级 +${benefits.battleEffects.critStageBonus}`);
          battle.textContent='羁绊辅助：'+buffs.join(' · ');panel.appendChild(battle);
        }
        const next=document.createElement('small');next.className='companion-next-tier';next.textContent=benefits.nextThreshold===null?'已达到最高羁绊档位':`距离下一档还差 ${Math.max(0,benefits.nextThreshold-benefits.trust)} 信赖`;panel.appendChild(next);
      }
      if(Number.isInteger(entry.亲密度)){const value=document.createElement('small');value.className='companion-friendship';value.textContent=`亲密度 ${entry.亲密度}/255 · 报恩、迁怒与对应进化`;panel.appendChild(value);}
      if (record.memories.length) {
        const list = document.createElement('ul'); list.className = 'companion-memories';
        record.memories.forEach(memory => { const item = document.createElement('li'); item.textContent = memory; list.appendChild(item); });
        panel.appendChild(list);
      } else {
        const empty = document.createElement('p'); empty.className = 'companion-bond-empty'; empty.textContent = '还没有记录共同记忆。'; panel.appendChild(empty);
      }
    } else {
      const empty = document.createElement('p'); empty.className = 'companion-bond-empty'; empty.textContent = typeof entry?.uid === 'string' && entry.uid ? '还没有羁绊记录。' : '这只宝可梦没有可识别的伙伴 UID。'; panel.appendChild(empty);
    }
    if (nativeMode && embedded && typeof entry?.uid === 'string' && entry.uid) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'companion-bond-button'; button.textContent = '与伙伴露营 / 休憩';
      button.addEventListener('click', () => {
        try { sendStageStoryIntent('camp', { mode:'rest' }, '与伙伴露营 / 休憩'); }
        catch (error) { toast(error.message || '无法将相处行动写入故事输入框。'); }
      });
      panel.appendChild(button);
    }
    return panel;
  }
  function sendStageStoryIntent(action, payload, label) {
    if (!nativeMode || !embedded) return false;
    sendBridgeMessage({ type: 'story-intent', action, payload, label });
    return true;
  }
  function questActionFor(task, node) {
    if(task?.category==='deep-quest'||String(task?.id||'').startsWith('deep-quest:'))return '';
    if (!task?.questId || task.category !== 'npc-quest' || node?.kind !== 'town') return '';
    const assignedId = String(first(task, ['委托地点ID', 'locationId', 'location'], '') || '').trim();
    const assignedName = String(first(task, ['委托地点', 'locationName'], '') || '').trim();
    if (![String(node.id || ''), String(node.name || '')].some(value => value && (assignedId === value || assignedName === value))) return '';
    const status = String(first(task, ['状态', 'status'], ''));
    if (status === '可交付') return 'quest-turn-in';
    if (status === '未接取' || status === '可接取') return 'quest-accept';
    return '';
  }
  async function performQuestAction(action,payload){
    if(state.busy||battleStatus()==='active')return;
    if(!['quest-accept','quest-turn-in','deep-quest-accept','deep-quest-advance','deep-quest-claim'].includes(action))throw Error('未知委托操作。');
    state.busy=true;renderTasks();
    try{
      const result=await api('/api/scene',{method:'POST',body:JSON.stringify({action,payload})});
      applyWorld(result);const receipt=result.questActionResult||result.world?.剧情?.委托回执;
      toast(receipt?.action===action?receipt.result:'委托记录已更新。');
    }catch(error){showPersistentError(error.message||'委托操作失败。',()=>performQuestAction(action,payload));}
    finally{state.busy=false;renderWorld();}
  }
  function renderQuestDeliveries(container){
    const node=currentLocation(),deliveries=[];
    for(const task of state.world?.任务||[]){
      const deep=deepQuestViewFor(task);
      if(deep?.status==='ready'&&deep.action)deliveries.push({action:deep.action.id,payload:deep.action.payload,label:(deep.action.id==='deep-quest-claim'?'领取奖励：':'报告阶段：')+deep.title,enabled:deep.action.enabled!==false,reason:deep.action.reason});
      else if(questActionFor(task,node)==='quest-turn-in')deliveries.push({action:'quest-turn-in',payload:{questId:task.questId},label:'交付委托：'+(task.标题||task.name),enabled:true});
    }
    if(!deliveries.length)return;
    const section=document.createElement('section');section.className='inventory-quest-deliveries';const title=document.createElement('strong');title.textContent='可交付委托';section.appendChild(title);
    for(const entry of deliveries){const button=document.createElement('button');button.type='button';button.textContent=entry.label;button.title=entry.reason||'';button.disabled=state.busy||!entry.enabled;button.addEventListener('click',()=>performQuestAction(entry.action,entry.payload));section.appendChild(button);}
    container.appendChild(section);
  }
  function deepQuestViewFor(task) {
    if (task?.category !== 'deep-quest' && !String(task?.id || '').startsWith('deep-quest:')) return null;
    const id = String(task.questId || String(task.id || '').replace(/^deep-quest:/, ''));
    const quests = state.gadgets?.quests;
    if (Array.isArray(quests)) return quests.find(quest => String(quest?.id || '') === id) || null;
    if (quests && typeof quests === 'object') return quests[id] || null;
    return null;
  }
  function taskStatusValue(task, deepView = null) {
    const status = deepView?.status;
    if (status === 'active') return '进行中';
    if (status === 'ready') return '可推进';
    if (status === 'completed') return '已完成';
    if (status === 'unaccepted') return '未接取';
    return String(first(task, ['状态', 'status'], '进行中'));
  }
  function taskMatchesLocation(task, deepView, node) {
    if (!node) return false;
    const assigned = [
      first(deepView, ['location'], ''), first(deepView, ['locationName'], ''),
      first(task, ['委托地点ID', 'locationId'], ''), first(task, ['委托地点', 'locationName', 'location'], ''),
    ].map(value => String(value || '').trim()).filter(Boolean);
    return [String(node.id || ''), String(node.name || '')].some(value => value && assigned.includes(value));
  }
  function renderDeepQuestControls(row, quest, title) {
    if (!quest) {
      const note = document.createElement('p'); note.className = 'task-prerequisite';
      note.textContent = '委托详情尚未载入；当前只能查看已记录的任务摘要。'; row.appendChild(note);
      return;
    }
    const questId = String(quest.id || '');
    const stage = quest.currentStage && typeof quest.currentStage === 'object' ? quest.currentStage : null;
    const stageIndex = Number.isInteger(quest.stageIndex) ? quest.stageIndex : null;
    const stageCount = Number.isInteger(quest.stageCount) ? quest.stageCount : null;
    const stageTitle = String(stage?.title || '');
    const stageLine = document.createElement('p'); stageLine.className = 'task-stage-line';
    const stageNumber = stageIndex === null ? '' : `阶段 ${Math.min(stageIndex + 1, stageCount || stageIndex + 1)}${stageCount ? ` / ${stageCount}` : ''}`;
    stageLine.textContent = [stageNumber, stageTitle].filter(Boolean).join(' · ');
    if (stageLine.textContent) row.appendChild(stageLine);
    if (stage?.description) { const detail = document.createElement('p'); detail.className = 'task-stage-description'; detail.textContent = String(stage.description); row.appendChild(detail); }
    if (quest.reason && quest.reason !== '请先选择一项调查方案。') { const reason = document.createElement('p'); reason.className = 'task-prerequisite'; reason.textContent = String(quest.reason); row.appendChild(reason); }
    if (quest.status === 'unaccepted') {
      const choices = Array.isArray(quest.choices) ? quest.choices : [];
      if (choices.length) {
        const choiceList = document.createElement('ul'); choiceList.className = 'task-choice-list';
        choices.forEach(choice => {
          const item = document.createElement('li'); item.textContent = String(choice.label || '委托方案');
          if (choice.echo) { const echo = document.createElement('small'); echo.textContent = String(choice.echo); item.appendChild(echo); }
          if (choice.reason) { const reason = document.createElement('small'); reason.className = 'task-choice-reason'; reason.textContent = String(choice.reason); item.appendChild(reason); }
          const accept=document.createElement('button');accept.type='button';accept.className='task-deep-action';accept.textContent='选择方案并接取';accept.disabled=state.busy||choice.enabled===false||!nativeMode||!embedded;
          accept.addEventListener('click',()=>performQuestAction('deep-quest-accept',{...choice.payload,deepQuestId:questId,choiceId:choice.id}));item.appendChild(accept);
          choiceList.appendChild(item);
        });
        row.appendChild(choiceList);
      }
    } else if (quest.status === 'ready' && quest.action) {
      const action = quest.action, actionId = String(action.id || '');
      if (['deep-quest-advance', 'deep-quest-claim'].includes(actionId)) {
        if (action.reason && action.enabled === false) { const reason = document.createElement('p'); reason.className = 'task-prerequisite'; reason.textContent = String(action.reason); row.appendChild(reason); }
        const button = document.createElement('button'); button.type = 'button'; button.className = 'task-deep-action';
        button.textContent = actionId === 'deep-quest-claim' ? '完成并领取奖励' : '报告并推进阶段';
        button.disabled = state.busy || action.enabled === false || !nativeMode || !embedded;
        if (action.reason) button.title = String(action.reason);
        button.addEventListener('click', () => {
          if (button.disabled || !questId) return;
          const payload = { ...(action.payload || {}), deepQuestId: questId };
          performQuestAction(actionId,payload);
        });
        row.appendChild(button);
      }
    }
  }
  function renderTasks() {
    const raw = first(state.world || {}, ['任务', 'quests', 'tasks'], []);
    els.tasksList.replaceChildren();
    const tasks = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.entries(raw).map(([id, value]) => typeof value === 'object' ? { id, ...value } : { id, status: value }) : [];
    if (!tasks.length) { const empty = document.createElement('p'); empty.className = 'team-empty'; empty.textContent = '当前 MVU 没有登记任务。'; els.tasksList.appendChild(empty); return; }
    const node = currentLocation();
    const statusFor = entry => typeof taskStatusValue === 'function' ? taskStatusValue(entry.task, entry.deep) : String(first(entry.task, ['状态', 'status'], '进行中'));
    const matchesLocation = entry => {
      if (typeof taskMatchesLocation === 'function') return taskMatchesLocation(entry.task, entry.deep, node);
      const assigned = [first(entry.task, ['委托地点ID', 'locationId'], ''), first(entry.task, ['委托地点', 'locationName', 'location'], '')].map(value => String(value || '').trim());
      return !!node && [String(node.id || ''), String(node.name || '')].some(value => value && assigned.includes(value));
    };
    const entries = tasks.map(task => ({ task, deep: typeof deepQuestViewFor === 'function' ? deepQuestViewFor(task) : null }));
    const matches = {
      location: matchesLocation,
      active: entry => statusFor(entry) === '进行中',
      ready: entry => ['可交付', '可推进'].includes(statusFor(entry)),
      all: () => true,
    };
    const labels = { location: '当前地点', active: '进行中', ready: '可交付', all: '全部' };
    const counts = Object.fromEntries(Object.entries(matches).map(([key, match]) => [key, entries.filter(match).length]));
    if (!matches[state.taskFilter] || !state.taskFilter) state.taskFilter = counts.active ? 'active' : 'location';
    const filters = document.createElement('div'); filters.className = 'task-filters'; filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', '任务筛选');
    Object.entries(labels).forEach(([key, label]) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'task-filter';
      button.textContent = `${label} ${counts[key]}`; button.setAttribute('aria-pressed', String(state.taskFilter === key));
      button.addEventListener('click', () => { state.taskFilter = key; renderTasks(); });
      filters.appendChild(button);
    });
    els.tasksList.appendChild(filters);
    const visible = entries.filter(matches[state.taskFilter]);
    if (!visible.length) { const empty = document.createElement('p'); empty.className = 'task-empty'; empty.textContent = state.taskFilter === 'location' ? '当前地点没有可显示的任务。' : `没有符合“${labels[state.taskFilter]}”的任务。`; els.tasksList.appendChild(empty); return; }
    visible.forEach(({task, deep}) => {
      const row = document.createElement('article'); row.className = 'task-row';
      const title = document.createElement('strong'); title.textContent = String(first(task, ['标题', '名称', 'name', 'title', 'id'], '旅程任务'));
      const status = document.createElement('span'); status.className = 'task-status';
      status.textContent = String(deep ? ({unaccepted:'未接取',active:'进行中',ready:'可推进',completed:'已完成'}[deep.status] || statusFor({task, deep})) : statusFor({task, deep}));
      const description = document.createElement('p'); description.className = 'task-description'; description.textContent = String(first(deep, ['description'], first(task, ['描述', 'description', '目标', 'objective'], '')));
      row.append(title, status); if (description.textContent) row.appendChild(description);
      if (task.category === 'npc-quest' || task.questId) {
        const details = document.createElement('p'); details.className = 'task-quest-details';
        const npc = String(first(deep, ['npcName'], first(task, ['委托人', 'npcName'], '')) || ''), location = String(first(deep, ['locationName'], first(task, ['委托地点', 'locationName'], '')) || ''), reward = String(first(deep, ['rewardPreview'], first(task, ['奖励预告', 'rewardPreview'], '')) || '');
        details.textContent = [npc && `委托人：${npc}`, location && `交付地点：${location}`, reward && `奖励预告：${reward}`].filter(Boolean).join(' · ');
        if (details.textContent) row.appendChild(details);
        const generated = first(task, ['AI生成', 'aiGenerated', 'generatedByAi', 'ai_generated'], false);
        const generator = first(task, ['生成来源', 'source', 'generatedBy'], '');
        if (generated === true || /(?:ai|模型|generated)/i.test(String(generator || ''))) {
          const marker = document.createElement('small'); marker.className = 'task-ai-marker'; marker.textContent = 'AI 生成委托'; row.appendChild(marker);
        }
      }
      const amount=Number(first(deep?.currentStage, ['progress'], first(task,['进度','progress'],NaN))),goal=Number(first(deep?.currentStage, ['target'], first(task,['目标','target'],NaN)));
      if(Number.isFinite(amount)&&Number.isFinite(goal)&&goal>0){
        const progress=document.createElement('progress');progress.className='task-progress';progress.max=goal;progress.value=Math.min(goal,Math.max(0,amount));progress.setAttribute('aria-label',title.textContent+'进度');
        const count=document.createElement('small');count.className='task-progress-count';count.textContent=Math.min(goal,Math.max(0,amount))+' / '+goal;
        row.append(progress,count);
      }
      if (deep && typeof renderDeepQuestControls === 'function') renderDeepQuestControls(row, deep, title);
      const action = questActionFor(task, node);
      if (action && nativeMode && embedded) {
        const npcName = String(first(task, ['委托人', 'npcName'], '') || ''), questId = String(task.questId);
        const button = document.createElement('button'); button.type = 'button'; button.className = 'task-quest-action';
        button.textContent = action === 'quest-turn-in' ? '交付并领取奖励' : '接取委托';button.disabled=state.busy;
        button.addEventListener('click', () => {
          performQuestAction(action,{questId,npcName});
        });
        row.appendChild(button);
      }
      els.tasksList.appendChild(row);
    });
  }
  async function useMvuItem(item, uid, options={}) {
    if (state.busy || battleStatus() === 'active' || !item || uid === undefined || uid === null || !itemCount([item])) return;
    state.busy = true; renderWorld();
    try {
      const result = await api('/api/item', { method: 'POST', body: JSON.stringify({ item, uid, ...options }) });
      applyWorld(result); toast(itemName(item) + '已使用。');
    } catch (error) { showPersistentError(error.message || '道具使用失败。', () => useMvuItem(item, uid, options)); }
    finally { state.busy = false; renderWorld(); }
  }
  async function buyItem(item) {
    if (state.busy || battleStatus() === 'active' || !isTown() || !item) return;
    const count = Math.max(1, Math.min(99, safeNum(els.shopCount.value, 1)));
    state.busy = true; renderWorld();
    try {
      const result = await api('/api/shop', { method: 'POST', body: JSON.stringify({ item, count }) });
      applyWorld(result); toast('已购买' + itemName(item) + ' ×' + count + '。');
    } catch (error) { showPersistentError(error.message || '购买失败。', () => buyItem(item)); }
    finally { state.busy = false; renderWorld(); }
  }
  function renderShop() {
    els.shopItems.replaceChildren();
    const shop = state.shop || {}, town = isTown(), canShop = town && shop.available === true && battleStatus() !== 'active';
    const note = document.createElement('p'); note.className = 'shop-note';
    note.textContent = canShop ? (shop.title || '消费训练家 MVU 金币；购买成功后背包会同步更新。') : String(shop.reason || (town ? '当前商店暂不可用。' : '商店只在城镇开放。'));
    els.shopItems.appendChild(note);
    if (!canShop) {
      if (els.shopReturn) els.shopReturn.hidden = false;
      const empty = document.createElement('p'); empty.className = 'shop-empty'; empty.textContent = shop.reason ? '返回城镇后可再次查看库存。' : '当前没有可购买的物品。'; els.shopItems.appendChild(empty);
      return;
    }
    if (els.shopReturn) els.shopReturn.hidden = true;
    const ids = Array.isArray(shop.items) ? shop.items.map(String) : [];
    const entries = ids.map(id => [id, itemDefinition(id)]);
    if (!entries.length) { const empty = document.createElement('p'); empty.className = 'shop-empty'; empty.textContent = '当前商店没有可购买的物品。'; els.shopItems.appendChild(empty); return; }
    entries.forEach(([id, def]) => {
      const row = document.createElement('div'); row.className = 'shop-item-row';
      const name = document.createElement('strong'); name.textContent = itemName(id);
      if (def.image) { const icon = document.createElement('img'); icon.className = 'item-sprite'; icon.alt = ''; icon.src = assetHref(def.image); icon.onerror = () => { icon.hidden = true; }; name.className = 'item-illustrated'; name.appendChild(icon); }
      const price = Number(first(def, ['price', '价格', 'cost'], NaN));
      const detail = document.createElement('span'); detail.textContent = '₽' + (Number.isFinite(price) ? price : '—') + ' · 背包 ×' + itemCount([id]);
      const effect = document.createElement('small'); effect.className='item-effect'; effect.textContent=itemDescription(id, def);
      const button = document.createElement('button'); button.type = 'button'; button.textContent = '购买'; button.disabled = state.busy || !canShop || !Number.isFinite(price); button.addEventListener('click', () => buyItem(id));
      row.append(name, detail, effect, button); els.shopItems.appendChild(row);
    });
  }
  function learningMoveDetail(id, slot) {
    const move=moveById(id)||{}, parts=[move.name||id||'招式'];
    parts.push(typeName(move.type));
    parts.push(({Physical:'物理',Special:'特殊',Status:'变化',physical:'物理',special:'特殊',status:'变化'})[move.category]||move.category||'类别未记录');
    const power=move.power??move.basePower; parts.push(`威力 ${power||'—'}`);
    parts.push(`命中 ${move.accuracy===true?'必中':move.accuracy!=null?move.accuracy+'%':'—'}`);
    parts.push(slot?`PP ${first(slot,['PP','pp'],'—')}/${first(slot,['PP上限','maxpp'],'—')}`:`PP ${move.pp??'—'}`);
    parts.push(move.description||'暂无效果说明'); return parts.join(' · ');
  }
  function renderLearningChoice(mon, moveId, machine, onClose) {
    const panel=document.createElement('section'); panel.className='battle-learn';
    const header=document.createElement('div'); header.className='battle-learn-header';
    const sprite=document.createElement('img'); sprite.src=assetUrl(dexId(mon),false,isShiny(mon)); sprite.alt=mon.昵称||'宝可梦';
    const heading=document.createElement('strong'); heading.textContent=`${mon.昵称||'宝可梦'}想学习${moveById(moveId)?.name||moveId}！`;
    header.append(sprite,heading); panel.appendChild(header);
    const incoming=document.createElement('p'); incoming.className='battle-learn-new'; incoming.textContent='新招式：'+learningMoveDetail(moveId); panel.appendChild(incoming);
    const prompt=document.createElement('p'); prompt.textContent='选择要忘记的招式，或放弃学习。'; panel.appendChild(prompt);
    const choices=document.createElement('div'); choices.className='battle-learn-choices'; const moves=mon.招式||[];
    Array.from({length:4},(_,index)=>{const current=moves[index],id=current&&(current.id||current.招式||current.name),button=document.createElement('button');
      button.type='button'; button.textContent=current?`忘记 ${learningMoveDetail(id,current)}`:'学习到空招式位';
      button.disabled=state.busy||index>moves.length||Boolean(current&&(current.秘传||isHmMove(id)));
      if(current&&(current.秘传||isHmMove(id)))button.title='秘传招式不能在此替换';
      button.addEventListener('click',()=>{if(machine){onClose();useMvuItem(machine.id,mon.uid,{slot:index+1});}else learnMove(mon.uid,moveId,index+1);}); choices.appendChild(button);});
    const decline=document.createElement('button'); decline.type='button'; decline.className='battle-learn-decline'; decline.textContent='放弃学习'; decline.disabled=state.busy;
    decline.addEventListener('click',()=>{if(machine)onClose();else learnMove(mon.uid,moveId,0);}); choices.appendChild(decline); panel.appendChild(choices); return panel;
  }
  function machineControls(machine){
    const box=document.createElement('div');box.className='machine-controls';
    const moveLabel=machine.moveNameZh||moveById(machine.move)?.name||machine.moveName;
    const note=document.createElement('small');note.textContent=`${moveLabel} · ${machine.consumable?'成功学习后消耗一张':'可反复使用；秘传招式须找遗忘爷爷删除'}`;
    const target=document.createElement('select');target.setAttribute('aria-label','选择学习'+moveLabel+'的宝可梦');
    const eligible=getParty().filter(mon=>machine.learners.includes(dexId(mon))&&!mon.招式?.some(move=>move.id===machine.move));
    for(const mon of eligible){const option=document.createElement('option');option.value=mon.uid;option.textContent=nameOfMon(mon,dexId(mon));target.appendChild(option);}
    const use=document.createElement('button');use.type='button';use.textContent='准备学习'; use.disabled=state.busy||battleStatus()==='active'||!eligible.length;
    use.addEventListener('click',()=>{const mon=eligible.find(entry=>String(entry.uid)===target.value);if(!mon)return;
      const overlay=document.createElement('div');overlay.className='battle-learn-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','学习招式');
      box.querySelector?.('.battle-learn-overlay')?.remove();overlay.appendChild(renderLearningChoice(mon,machine.move,machine,()=>overlay.remove()));box.appendChild(overlay);overlay.scrollIntoView?.({block:'nearest',behavior:'smooth'});
    });
    if(!eligible.length)note.textContent+=' · 队伍中没有可学习的新伙伴'; box.append(note,target,use);return box;
  }
  function isHmMove(id){return(state.machines||[]).some(machine=>machine.kind==='hm'&&machine.move===id);}
  function renderInventory() {
    const bag = state.world?.背包 || {}, items = normalizeItemList(getBagItems()), keyItems = first(bag, ['关键物品', 'keyItems'], []);
    els.inventory.replaceChildren();
    renderQuestDeliveries(els.inventory);
    renderStoredMail(els.inventory);
    const nonzero = items.filter(([, count]) => count > 0);
    if (!nonzero.length) { const empty = document.createElement('div'); empty.className = 'team-empty'; empty.textContent = '背包里暂时没有物品。'; els.inventory.appendChild(empty); }
    const groups = [
      ['medicine','药品'],['balls','精灵球'],['held','携带物'],['machines','学习机'],['other','其他物品']
    ].map(([key,label])=>({key,label,rows:[]}));
    const groupFor = (id, definition) => {
      const category=String(first(definition,['category','类别','kind'],'')).toLowerCase();
      if (definition.kind==='tm'||definition.kind==='hm'||['tm','hm','machine','machine-item'].includes(category)||state.machines?.some(machine=>machine.id===id))return 'machines';
      if (category.includes('medicine')||category.includes('potion')||category.includes('healing')||category==='药品')return 'medicine';
      if (category.includes('ball')||category==='精灵球'||/(?:pok[eé]?ball|greatball|ultraball|masterball)$/.test(String(id).toLowerCase()))return 'balls';
      if (category==='held'||category.includes('held')||category==='携带物')return 'held';
      return 'other';
    };
    nonzero.forEach(([id,count])=>groups.find(group=>group.key===groupFor(id,itemDefinition(id)))?.rows.push([id,count]));
    groups.filter(group=>group.rows.length).forEach(group=>{
      const disclosure=document.createElement('details');disclosure.className='inventory-group';disclosure.open=Boolean(state.bagDisclosure[group.key]);
      disclosure.addEventListener('toggle',()=>{state.bagDisclosure[group.key]=disclosure.open;});
      const summary=document.createElement('summary'),quantity=group.rows.reduce((sum,[,count])=>sum+count,0);summary.textContent=`${group.label} · ${group.rows.length} 类 / ${quantity} 件`;
      const list=document.createElement('div');list.className='inventory-list inventory-group-items';disclosure.append(summary,list);els.inventory.appendChild(disclosure);
      group.rows.forEach(([id,count])=>renderInventoryRow(id,count,list));
    });
    els.keyItems.replaceChildren();
    if (Array.isArray(keyItems) && keyItems.length) {
      const disclosure=document.createElement('details');disclosure.className='inventory-group key-items-disclosure';disclosure.open=Boolean(state.bagDisclosure.keyItems);
      disclosure.addEventListener('toggle',()=>{state.bagDisclosure.keyItems=disclosure.open;});
      const summary=document.createElement('summary');summary.textContent=`关键道具 · ${keyItems.length} 件`;disclosure.appendChild(summary);
      const chips=document.createElement('div');chips.className='key-items';
      keyItems.forEach(item => { const chip = document.createElement('span'); chip.className = 'key-item'; chip.textContent = typeof item === 'string' ? item : first(item, ['名称', 'name'], '关键物品'); chips.appendChild(chip); });
      disclosure.appendChild(chips);els.keyItems.appendChild(disclosure);
    }
    const potion = itemCount(['potion', '伤药']), ball = itemCount(['pokeball', 'ball', '精灵球']);
    els.potionCount.textContent = potion; els.ballCount.textContent = ball;
  }
  function renderStoredMail(container) {
    const mail = state.world?.邮件收纳;
    if (!Array.isArray(mail) || !mail.length) return;
    const disclosure = document.createElement('details');
    disclosure.className = 'inventory-group mail-disclosure';
    disclosure.open = Boolean(state.bagDisclosure.mail);
    disclosure.addEventListener('toggle', () => { state.bagDisclosure.mail = disclosure.open; });
    const summary = document.createElement('summary');
    summary.textContent = `信件收纳 · ${mail.length} 件`;
    disclosure.appendChild(summary);
    mail.forEach(letter => {
      if (!letter || typeof letter !== 'object') return;
      const entry = document.createElement('div'); entry.className = 'inventory-row mail-entry';
      for (const [label, value] of [['信纸', letter.itemId ? itemName(letter.itemId) : ''], ['标题', letter.title], ['发件人', letter.sender], ['正文', letter.message]]) {
        if (typeof value !== 'string' || !value) continue;
        const line = document.createElement('div'); line.textContent = `${label}：${value}`; entry.appendChild(line);
      }
      disclosure.appendChild(entry);
    });
    container.appendChild(disclosure);
  }
  function renderInventoryRow(id,count,container) {
      const row = document.createElement('div'); row.className = 'inventory-row';
      const name = document.createElement('span'); name.textContent = itemName(id);
      const amount = document.createElement('b'); amount.textContent = '× ' + count; row.append(name, amount);
      const definition = itemDefinition(id);
      const effect=document.createElement('small');effect.className='item-effect';effect.textContent=itemDescription(id, definition);if(effect.textContent)row.appendChild(effect);
      if(definition.kind==='tm'||definition.kind==='hm'){
        row.appendChild(machineControls(definition));container.appendChild(row);return;
      }
      if (definition.image) { const icon = document.createElement('img'); icon.className = 'item-sprite'; icon.alt = ''; icon.src = assetHref(definition.image); icon.onerror = () => { icon.hidden = true; }; name.className = 'item-illustrated'; name.appendChild(icon); }
      const outsideDefined = Object.prototype.hasOwnProperty.call(definition, 'outside') || Object.prototype.hasOwnProperty.call(definition, 'outsideBattle');
      const outsideAllowed = Object.prototype.hasOwnProperty.call(definition, 'outside') ? definition.outside !== null && definition.outside !== false : definition.outsideBattle !== null && definition.outsideBattle !== false;
      const usableOutside = Boolean(first(definition, ['usableOutsideBattle', '可使用'], Boolean(first(definition, ['actionKey', 'action'], false)) && (!outsideDefined || outsideAllowed)));
      if (usableOutside) {
        const user = document.createElement('select'); user.className = 'item-target'; user.setAttribute('aria-label', '选择使用' + itemName(id) + '的宝可梦');
        const party = getParty();
        party.forEach(mon => { const option = document.createElement('option'); option.value = String(mon.uid ?? ''); option.textContent = first(mon, ['昵称', 'name'], speciesById(dexId(mon))?.name || '宝可梦'); user.appendChild(option); });
        const use = document.createElement('button'); use.type = 'button'; use.className = 'inventory-use'; use.textContent = '使用'; use.disabled = state.busy || battleStatus() === 'active' || !party.length || !user.value;
        row.append(user, use);
        const needsMove=(definition.outside?.pp!==undefined&&!definition.outside?.allMoves)||definition.outside?.ppUps!==undefined;
        const moveSlot=needsMove?document.createElement('select'):null;
        if(moveSlot){
          moveSlot.setAttribute('aria-label','选择使用'+itemName(id)+'的招式');
          const update=()=>{moveSlot.replaceChildren();const mon=party.find(entry=>String(entry.uid)===user.value);for(const [i,entry]of(mon?.招式||[]).entries()){const option=document.createElement('option');option.value=String(i+1);option.textContent=`${moveById(entry.id)?.name||entry.id} · PP ${entry.PP}/${entry.PP上限}`;moveSlot.appendChild(option);}};
          user.addEventListener('change',update);update();row.insertBefore(moveSlot,use);
        }
        use.addEventListener('click', () => { const mon = party.find(candidate => String(candidate.uid) === user.value); if (mon) useMvuItem(id, mon.uid,moveSlot?{slot:Number(moveSlot.value)}:{}); });
      }
      container.appendChild(row);
  }
  function renderPc() {
    const pc = Array.isArray(state.world?.电脑) ? state.world.电脑 : [];
    state.pcPage=Math.max(0,Math.min(13,state.pcPage||0));state.pcSelection||=new Set();state.pcPartySelection||=new Set();
    const party=getParty(),visible=pc.slice(state.pcPage*30,state.pcPage*30+30),editable=canEditMvuRoster()&&!state.busy,free=6-party.length;
    const visibleIds=new Set(visible.map(mon=>String(mon.uid))),partyIds=new Set(party.map(mon=>String(mon.uid)));for(const uid of state.pcSelection)if(!visibleIds.has(uid))state.pcSelection.delete(uid);for(const uid of state.pcPartySelection)if(!partyIds.has(uid))state.pcPartySelection.delete(uid);
    els.pcList.replaceChildren();els.pcList.classList.add('pc-box-list');els.pcCount.textContent=`${pc.length} / 420 只`;
    const controls=document.createElement('div');controls.className='pc-box-controls';
    const button=(text,handler,disabled=false)=>{const b=document.createElement('button');b.type='button';b.className='roster-button';b.textContent=text;b.disabled=disabled;b.addEventListener('click',handler);return b;};
    const previous=button('上一盒',()=>{state.pcPage--;state.pcSelection.clear();renderPc();},state.pcPage===0||state.busy),next=button('下一盒',()=>{state.pcPage++;state.pcSelection.clear();renderPc();},state.pcPage===13||state.busy),select=document.createElement('select');select.setAttribute('aria-label','选择电脑盒子');
    for(let page=0;page<14;page++){const opt=document.createElement('option');opt.value=String(page);opt.textContent=`盒子 ${page+1} · ${pc.slice(page*30,page*30+30).length}/30`;select.appendChild(opt);}select.value=String(state.pcPage);select.disabled=state.busy;select.addEventListener('change',()=>{state.pcPage=Number(select.value);state.pcSelection.clear();renderPc();});controls.append(previous,select,next);els.pcList.appendChild(controls);
    const note=document.createElement('p');note.className='pc-box-note';note.textContent=editable?`同行 ${party.length}/6 · 可取出 ${free} 只 · 选中 ${state.pcSelection.size} 只`:'可查看盒子；请在城镇结束战斗后存取。';els.pcList.appendChild(note);
    const grid=document.createElement('div');grid.className='pc-box-grid';
    for(let index=0;index<30;index++){const entry=visible[index],slot=document.createElement(entry?'label':'div');slot.className='pc-box-slot'+(entry?'':' is-empty');
      if(entry){const uid=String(entry.uid),id=dexId(entry),selected=state.pcSelection.has(uid),check=document.createElement('input');check.type='checkbox';check.checked=selected;check.disabled=!editable||!selected&&state.pcSelection.size>=free;check.setAttribute('aria-label',`选择${first(entry,['昵称','name'],speciesById(id)?.name||'宝可梦')}`);check.addEventListener('change',()=>{if(check.checked)state.pcSelection.add(uid);else state.pcSelection.delete(uid);renderPc();});
        const image=document.createElement('img');image.src=assetUrl(id,false,isShiny(entry));image.alt='';image.onerror=()=>{image.hidden=true;};const name=document.createElement('strong');name.textContent=first(entry,['昵称','name'],speciesById(id)?.name||`No. ${id}`)+(isShiny(entry)?' ✦':'');const detail=document.createElement('small');detail.textContent=`Lv. ${first(entry,['等级','level'],'—')}`;slot.append(check,image,name,detail);slot.classList.toggle('is-selected',selected);
      }else slot.setAttribute('aria-label',`空位 ${index+1}`);grid.appendChild(slot);
    }
    els.pcList.appendChild(grid);const actions=document.createElement('div');actions.className='pc-box-controls';actions.append(button('选满队伍空位',()=>{state.pcSelection=new Set(visible.slice(0,free).map(mon=>String(mon.uid)));renderPc();},!editable||free<1||!visible.length),button('清空选择',()=>{state.pcSelection.clear();renderPc();},!state.pcSelection.size||state.busy),button(`批量取出（${state.pcSelection.size}）`,()=>moveBoxBatch([...state.pcSelection],'withdraw'),!editable||!state.pcSelection.size||state.pcSelection.size>free));els.pcList.appendChild(actions);
    const deposit=document.createElement('details');deposit.className='pc-batch-deposit';const summary=document.createElement('summary');summary.textContent=`批量存入 · 当前队伍 ${party.length} 只`;deposit.appendChild(summary);for(const mon of party){const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=state.pcPartySelection.has(String(mon.uid));check.disabled=!editable;check.addEventListener('change',()=>{if(check.checked)state.pcPartySelection.add(String(mon.uid));else state.pcPartySelection.delete(String(mon.uid));depositButton.textContent=`存入电脑（${state.pcPartySelection.size}）`;depositButton.disabled=!editable||!state.pcPartySelection.size||state.pcPartySelection.size>=party.length||pc.length+state.pcPartySelection.size>420;});label.append(check,document.createTextNode(first(mon,['昵称','name'],speciesById(dexId(mon))?.name||'伙伴')));deposit.appendChild(label);}
    const depositButton=button(`存入电脑（${state.pcPartySelection.size}）`,()=>moveBoxBatch([...state.pcPartySelection],'deposit'),!editable||!state.pcPartySelection.size||state.pcPartySelection.size>=party.length||pc.length+state.pcPartySelection.size>420);deposit.appendChild(depositButton);const reminder=document.createElement('small');reminder.textContent='队伍至少保留一只伙伴。';deposit.appendChild(reminder);els.pcList.appendChild(deposit);
    if(visible.length){
      const release=document.createElement('details');release.className='pc-batch-deposit';
      const heading=document.createElement('summary');heading.textContent='放生本盒中的宝可梦';release.appendChild(heading);
      for(const mon of visible){const row=document.createElement('div'),name=document.createElement('strong');name.textContent=first(mon,['昵称','name'],'宝可梦');row.append(name,renderReleaseControl(mon,editable));release.appendChild(row);}
      els.pcList.appendChild(release);
    }
  }
  async function moveBoxBatch(uids,direction){
    if(!canEditMvuRoster()||state.busy||!uids.length)return;state.busy=true;renderWorld();
    try{const result=await api('/api/box',{method:'POST',body:JSON.stringify({uids,direction})});state.pcSelection?.clear();state.pcPartySelection?.clear();applyWorld(result);toast(`已${direction==='deposit'?'存入电脑':'加入队伍'} ${uids.length} 只宝可梦。`);}catch(error){showPersistentError(error.message||'批量存取失败，请重新选择。');}finally{state.busy=false;renderWorld();}
  }
  async function moveBox(entry, direction) {
    if (!canEditMvuRoster() || entry?.uid === undefined) return;
    const count = getParty().length;
    if (direction === 'deposit' && count <= 1) return toast('队伍至少要留下一只宝可梦。');
    if (direction === 'withdraw' && count >= 6) return toast('同行队伍最多六只。');
    state.busy = true; renderWorld();
    try {
      const result = await api('/api/box', { method: 'POST', body: JSON.stringify({ uid: entry.uid, direction }) });
      applyWorld(result); toast(direction === 'deposit' ? '宝可梦已存入电脑。' : '宝可梦已加入队伍。');
    } catch (error) { showPersistentError(error.message || '电脑存取失败。', () => moveBox(entry, direction)); }
    finally { state.busy = false; renderWorld(); }
  }
  async function learnMove(uid, move, slot) {
    if (!canLearnMove() || uid === undefined) return;
    state.busy = true; renderWorld();
    try {
      const activeLearning=state.battle?.pendingBattleLearning?.includes(uid);
      const result = await api(activeLearning?'/api/learn-battle':'/api/learn', { method: 'POST', body: JSON.stringify({ uid, move, slot, ...(activeLearning?{battleId:state.battle.id,seq:state.battle.seq}: {}) }) });
      applyWorld(result); toast(slot === 0 ? '已放弃学习新招式。' : `已学习${moveById(move)?.name || move}。`);
    } catch (error) { showPersistentError(error.message || '招式学习失败。', () => learnMove(uid, move, slot)); }
    finally { state.busy = false; renderWorld(); if (state.battle) renderBattleResult(state.battle); }
  }
  function atInitialLab() {
    return isOpeningPreparation() && !hasStarterChoice();
  }
  function renderStarterPicker() {
    const opening = isOpeningPreparation(), chosen = hasStarterChoice();
    els.starterPicker.hidden = !opening; els.starterOptions.replaceChildren();
    if (els.starterPicker.hidden) return;
    els.starterTitle.textContent = chosen ? '御三家已选 · 首场对战准备' : '选择你的第一只同行宝可梦';
    [[1, '妙蛙种子'], [4, '小火龙'], [7, '杰尼龟']].forEach(([id, label]) => {
      const species = speciesById(id), button = document.createElement('button'); button.type = 'button'; button.className = 'starter-option'; button.disabled = state.busy || chosen;
      const image = document.createElement('img'); image.src = assetUrl(id); image.alt = ''; image.onerror = () => { image.hidden = true; };
      const name = document.createElement('strong'); name.textContent = species?.name || label;
      const number = document.createElement('small'); number.textContent = `No. ${String(id).padStart(3, '0')} · Lv. 5`;
      button.append(image, name, number); button.addEventListener('click', () => chooseStarter(id)); els.starterOptions.appendChild(button);
    });
    els.starterHint.textContent = chosen ? '已从人物卡读取御三家选择。' : '选择后会写入 MVU，随后可开始与小茂对战。';
  }
  function currentLocation() { return state.locations.find(node => String(node.id) === currentNodeId()) || null; }
  function isTown() { const node = currentLocation(); return Boolean(node && kindClass(node.kind) === 'town'); }
  function renderServices() {
    const town = isTown(), show = town && battleStatus() !== 'active';
    els.center.hidden = !show && !rosterMode && state.hudTab !== 'shop';
    els.centerName.textContent = first(currentLocation(), ['name'], first(getMap(), ['地点'], '当前地点'));
    [els.heal, els.buyPotion, els.buyBall].forEach(button => { button.disabled = state.busy || !show || getParty().length === 0; });
    if (els.shopServices) els.shopServices.hidden = !town;
    if (els.shopQuantity) els.shopQuantity.hidden = !town || !state.shop?.available || battleStatus() === 'active';
    const copy = els.center.querySelector('.center-copy');
    if (copy) copy.textContent = town ? '中心恢复同行宝可梦的HP和异常状态；伤药恢复20 HP。商店消费 MVU 金币。' : '宝可梦中心与商店需要在城镇使用。';
  }
  async function chooseStarter(id) {
    if (!atInitialLab() || state.busy) return;
    if(nativeMode&&embedded){sendBridgeMessage({type:'story-intent',action:'starter',payload:{id},label:'选择'+(speciesById(id)?.name||'伙伴')});return;}
    state.busy = true; renderWorld();
    try {
      const result = await api('/api/starter', { method: 'POST', body: JSON.stringify({ id }) });
      state.starterChosen = true; applyWorld(result); await refreshPresentation(); toast(`已选择${speciesById(id)?.name || '御三家'}。`);
    } catch (error) { showPersistentError(error.message || '无法更新御三家选择。', () => chooseStarter(id)); }
    finally { state.busy = false; renderWorld(); }
  }
  async function useService(path, body, successText) {
    if (state.busy || battleStatus() === 'active' || !isTown()) return;
    if(nativeMode&&embedded&&path==='/api/heal'){sendBridgeMessage({type:'story-intent',action:'heal',label:'宝可梦中心恢复'});return;}
    state.busy = true; renderServices();
    try { const result = await api(path, { method: 'POST', body: JSON.stringify(body) }); applyWorld(result); if (path === '/api/heal') window.KantoAudio?.heal(); toast(successText); }
    catch (error) { showPersistentError(error.message || '服务暂时无法使用。', () => useService(path, body, successText)); }
    finally { state.busy = false; renderWorld(); }
  }
  function itemCount(aliases) {
    const items = getBagItems();
    for (const alias of aliases) {
      if (Array.isArray(items)) {
        const found = items.find(item => String(typeof item === 'string' ? item : first(item, ['id', 'key', '名称', 'name'], '')).toLowerCase() === alias.toLowerCase());
        if (found !== undefined) return safeNum(typeof found === 'string' ? 1 : first(found, ['数量', 'count', 'quantity'], 0));
      } else if (items && Object.hasOwn(items, alias)) return safeNum(typeof items[alias] === 'object' ? first(items[alias], ['数量', 'count'], 0) : items[alias]);
    }
    if (!Array.isArray(items) && items && typeof items === 'object') {
      const match = Object.keys(items).find(id => aliases.some(alias => String(id).toLowerCase() === String(alias).toLowerCase()));
      if (match !== undefined) return safeNum(typeof items[match] === 'object' ? first(items[match], ['数量', 'count', 'quantity'], 0) : items[match]);
    }
    return 0;
  }
  function renderMap() {
    const svg = els.mapSvg; svg.replaceChildren(); applyMapTransform();
    const current = currentNodeId(), nodeMap = new Map(state.locations.map(node => [String(node.id), node]));
    const ns = 'http://www.w3.org/2000/svg';
    const edgeGroup = document.createElementNS(ns, 'g'); edgeGroup.setAttribute('class', 'map-edges');
    const drawn = new Set();
    state.locations.forEach(node => {
      for (const link of Array.isArray(node.links) ? node.links : []) {
        const other = nodeMap.get(String(link)); if (!other) continue;
        const pair = [String(node.id), String(other.id)].sort().join('|'); if (drawn.has(pair)) continue; drawn.add(pair);
        const edge = document.createElementNS(ns, 'line'); edge.setAttribute('x1', safeNum(node.x)); edge.setAttribute('y1', safeNum(node.y)); edge.setAttribute('x2', safeNum(other.x)); edge.setAttribute('y2', safeNum(other.y));
        edgeGroup.appendChild(edge);
      }
    });
    svg.appendChild(edgeGroup);
    const currentNode = nodeMap.get(current), neighborIds = new Set((currentNode?.links || []).map(String));
    state.locations.forEach(node => { if ((node.links || []).some(link => String(link) === current)) neighborIds.add(String(node.id)); });
    const nodeGroup = document.createElementNS(ns, 'g'); nodeGroup.setAttribute('class', 'map-nodes');
    state.locations.forEach(node => {
      const id = String(node.id), x = safeNum(node.x), y = safeNum(node.y), isCurrent = id === current;
      const access=(state.field?.travel||[]).find(item=>item.node===id);
      const enoughBadges=(state.world?.训练家?.徽章?.length||0)>=(node.requiresBadges||0);
      const canMove=neighborIds.has(id)&&!isCurrent&&battleStatus()==='finished'&&!state.busy&&enoughBadges&&access?.allowed!==false;
      const g = document.createElementNS(ns, 'g'); g.setAttribute('class', `map-node kind-${kindClass(node.kind)}${isCurrent ? ' is-current' : ''}${canMove ? ' can-move' : !isCurrent ? ' is-locked' : ''}`);
      g.setAttribute('transform', `translate(${x} ${y})`); g.setAttribute('role', 'button'); g.setAttribute('tabindex', canMove ? '0' : '-1'); g.setAttribute('aria-label', `${node.name}${isCurrent ? '，当前位置' : canMove ? '，点击移动' : ''}`);
      if(!isCurrent&&!canMove)g.setAttribute('aria-disabled','true');
      const title = document.createElementNS(ns, 'title'); title.textContent = `${node.name}${isCurrent ? ' · 当前位置' : canMove ? ' · 相邻地点，点击移动' : ''}`; g.appendChild(title);
      const circle = document.createElementNS(ns, 'circle'); circle.setAttribute('r', isCurrent ? '1.6' : node.kind==='town'?'1.2':'.85'); g.appendChild(circle);
      const label = document.createElementNS(ns, 'text'); label.setAttribute('y',node.kind==='town'?'4.5':'3.8'); label.textContent=node.name;label.setAttribute('class',node.kind==='town'||isCurrent||canMove?'map-label-visible':'map-label-hover');g.appendChild(label);
      if (canMove) {
        g.addEventListener('click', () => travelTo(node));
        g.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); travelTo(node); } });
      }
      nodeGroup.appendChild(g);
    });
    svg.appendChild(nodeGroup);
    if (!state.locations.length) { els.mapNote.textContent = '人物卡尚未提供关都地点节点。'; return; }
    els.mapNote.textContent = battleStatus() === 'finished' ? '点选已开放的相邻地点移动；也可在剧情输入目的地。滚轮或按钮缩放，拖动地图平移。' : battleStatus() === 'active' ? '战斗进行中，地点移动已暂停。滚轮或按钮缩放，拖动地图平移。' : '完成本轮战斗后可查看相邻地点。滚轮或按钮缩放，拖动地图平移。';
  }
  function kindClass(kind) {
    const value = String(kind || '').toLowerCase();
    if (value.includes('gym') || value.includes('道馆')) return 'gym';
    if (value.includes('cave') || value.includes('洞')) return 'cave';
    if (value.includes('route') || value.includes('路线')) return 'route';
    return 'town';
  }
  async function travelTo(node) {
    if (state.busy || battleStatus() !== 'finished') return;
    if(nativeMode&&embedded){sendBridgeMessage({type:'story-intent',action:'travel',payload:{node:node.id},label:'前往'+node.name});return;}
    state.busy = true; renderMap();
    try { const result = await api('/api/travel', { method: 'POST', body: JSON.stringify({ node: node.id }) }); applyWorld(result); toast(`已移动到${node.name}`); }
    catch (error) { showPersistentError(error.message || '移动失败，请重试。', () => travelTo(node)); }
    finally { state.busy = false; renderWorld(); }
  }
  function renderDex() {
    const query = els.dexSearch.value.trim().toLowerCase();
    const cache = state.dexRenderCache;
    if (cache && cache.query === query && cache.species === state.species && cache.types === state.types) return;
    state.dexRenderCache = {query, species:state.species, types:state.types};
    els.dexResults.replaceChildren();
    const results = state.species.filter(p => !query || String(p.id).includes(query) || String(p.name || '').toLowerCase().includes(query) || String(p.key || '').toLowerCase().includes(query));
    if (!results.length) { const empty = document.createElement('div'); empty.className = 'no-results'; empty.textContent = '没有找到匹配的宝可梦。'; els.dexResults.appendChild(empty); return; }
    results.forEach(p => {
      const row = document.createElement('div'); row.className = 'dex-result';
      const image = document.createElement('img'); image.src = assetUrl(p.id); image.alt = ''; image.onerror = () => { image.hidden = true; };
      const info = document.createElement('span'), name = document.createElement('strong'), id = document.createElement('small');
      name.textContent = p.name; id.textContent = `No. ${String(p.id).padStart(3, '0')} · ${(p.types || []).map(typeName).join(' / ')}`; info.append(name, id); row.append(image, info); els.dexResults.appendChild(row);
    });
  }
  function encounterName() {
    const encounter = getEncounter();
    const kind = first(encounter, ['类型', 'type'], 'wild');
    return first(encounter, ['训练家', 'name'], '') ? `${first(encounter, ['训练家', 'name'], '')} · ${formatMode(kind)}` : formatMode(kind);
  }
  function renderEncounterPreview() {
    const party = getParty(), firstPlayer = party[0], opponent = getEncounter().队伍?.[0];
    if (state.battle) { renderBattle(state.battle); return; }
    els.mode.textContent = encounterName(); setWeather('none');
    if (firstPlayer) {
      const id = dexId(firstPlayer), species = speciesById(id), mon = { id, name: first(firstPlayer, ['昵称'], species?.name || '宝可梦'), level: first(firstPlayer, ['等级'], '—') };
      els.playerName.textContent = mon.name; els.playerLevel.textContent = `Lv. ${mon.level}`; setSprite(els.playerSprite, mon, true);
      const hp = safeNum(first(firstPlayer, ['当前HP', 'hp'], 0)), max = safeNum(first(firstPlayer, ['最大HP', 'maxhp'], first(firstPlayer.能力值, ['hp', 'HP'], 1)), 1); updateHp('player', hp, max); setCondition(els.playerCondition, first(firstPlayer, ['状态'], ''));
    }
    if (opponent) {
      const id = dexId(opponent), species = speciesById(id), mon = { id, name: first(opponent, ['昵称'], species?.name || '遭遇宝可梦'), level: first(opponent, ['等级'], '—') };
      els.foeName.textContent = mon.name; els.foeLevel.textContent = `Lv. ${mon.level}`; setSprite(els.foeSprite, mon, false);
      const hp = safeNum(first(opponent, ['当前HP', 'hp'], first(opponent, ['最大HP', 'maxhp'], 1))), max = safeNum(first(opponent, ['最大HP', 'maxhp'], first(opponent.能力值, ['hp', 'HP'], 1)), 1); updateHp('foe', hp, max); setCondition(els.foeCondition, first(opponent, ['状态'], ''));
    }
    setMessage(battleStatus() === 'pending' ? `第 ${first(getMap(), ['轮次'], 1)} 轮遭遇已准备。进入本轮战斗。` : '人物卡尚未提供当前遭遇。');
  }
  function renderRoundControls() {
    const status = battleStatus();
    const opening = isOpeningPreparation(), chosen = hasStarterChoice();
    const outcome=String(state.world?.战斗?.结果||'');
    els.roundSummary.textContent=status==='finished'?(outcome==='win'?'本轮胜利 · MVU 奖励已结算。':outcome==='caught'?'收服成功 · MVU 奖励已结算。':outcome==='escaped'?'已脱离野生对战。':outcome==='lose'?'本轮战斗结束 · 查看 MVU 奖励。':'本轮战斗已结算。'):'等待本轮结算。';
    const resumeOnStage = stageMode && useBridge && status === 'active';
    els.start.hidden = status !== 'pending' && !resumeOnStage; els.start.disabled = state.busy || getParty().length === 0 || (opening && !chosen && !resumeOnStage);
    els.start.textContent = state.busy ? '正在进入本轮…' : resumeOnStage ? '继续本轮战斗' : opening ? chosen ? '开始与小茂对战' : '先选择一只御三家' : '进入本轮战斗';
    els.next.hidden = embedded || status !== 'finished'; els.next.disabled = state.busy;
    els.returnStage.hidden = !((stageMode || battleOverlay) && status === 'finished' && state.battleFocus);
    els.returnStage.disabled = state.busy;
    els.story.disabled = true;
    els.story.textContent = embedded ? '完成战斗后回正文继续' : '独立预览：完成战斗后点击「下一轮」';
    els.storyCopy.textContent = embedded ? '战斗结果会写回 MVU 人物卡。完成本轮后回正文继续。' : '此页用于独立预览。每轮遭遇来自 MVU，完成后可生成下一轮。';
    els.actionTitle.textContent = status === 'active' ? '本轮战斗进行中' : status === 'finished' ? '本轮战斗已结算' : '本轮遭遇待开始';
    els.actionHint.textContent = status === 'active' ? '每个行动都会写回人物卡' : status === 'finished' ? '本轮已经完成' : '开始人物卡安排的遭遇';
    if (status === 'finished') {
      els.moves.replaceChildren(); const done = document.createElement('div'); done.className = 'empty-actions'; done.textContent = embedded ? '战斗结算已同步。回正文继续旅程。' : '战斗结算已同步到 MVU。'; els.moves.appendChild(done);
      setMessage('本轮战斗已结束，MVU 奖励面板已更新。');
    } else if (status === 'pending') {
      els.moves.replaceChildren(); const empty = document.createElement('div'); empty.className = 'empty-actions'; empty.textContent = '本轮战斗会读取人物卡队伍、招式和状态。'; els.moves.appendChild(empty);
    }
  }
  function updateHp(side, hp, maxhp) {
    const bar = side === 'foe' ? els.foeHp : els.playerHp, text = side === 'foe' ? els.foeHpText : els.playerHpText;
    const maximum = Math.max(1, safeNum(maxhp, 1)), current = Math.max(0, Math.min(maximum, safeNum(hp, 0))), pct = Math.round(current / maximum * 100);
    bar.style.width = `${pct}%`; bar.classList.toggle('low', pct <= 50 && pct > 20); bar.classList.toggle('critical', pct <= 20); text.textContent = `${current} / ${maximum}`;
  }
  function setCondition(node, status) {
    const icons = { brn: '🔥', psn: '☠', tox: '☠', par: 'ϟ', slp: 'Zz', frz: '❄' };
    node.textContent = status ? `${icons[status] || '✦'} ${statusNames[status] || status}` : '正常';
    node.classList.toggle('has-condition', Boolean(status));
    node.dataset.status = status || '';
  }
  function activeMon(side) { return side?.team?.find(mon => mon.active) || side?.team?.find(mon => !mon.fainted) || side?.team?.[0] || null; }
  function activeMonAt(side,slot){
    const uid=side?.activeUIDs?.[slot];
    return (uid!==undefined?side?.team?.find(mon=>String(mon.uid)===String(uid)):null)||side?.team?.filter(mon=>mon.active)[slot]||null;
  }
  function renderDoubleActives(snapshot){
    const active=Boolean(snapshot?.doubleBattle&&els.doubleActives);
    els.stage.classList.toggle('is-doubles',active);
    if(!els.doubleActives)return;
    els.doubleActives.hidden=!active;
    if(!active){els.doubleActives.replaceChildren();return;}
    const rows=[];
    for(const [sideIndex,side]of(snapshot.sides||[]).entries())for(let slot=0;slot<2;slot++){
      const mon=activeMonAt(side,slot);if(mon)rows.push({side:sideIndex===0?'player':'foe',slot,mon});
    }
    const signature=rows.map(row=>`${row.side}:${row.slot}:${row.mon.uid}`).join('|');
    if(els.doubleActives.dataset.signature!==signature){
      els.doubleActives.replaceChildren();
      for(const sideName of ['player','foe']){
        const group=document.createElement('div');group.className='double-active-side';group.dataset.side=sideName;
        for(const row of rows.filter(item=>item.side===sideName)){
          const card=document.createElement('article');card.className='double-active-card';card.dataset.uid=String(row.mon.uid||'');card.dataset.side=row.side;card.dataset.slot=String(row.slot);
          const sprite=document.createElement('img');sprite.className='double-active-sprite';sprite.alt='';setSprite(sprite,row.mon,row.side==='player');
          const name=document.createElement('strong'),detail=document.createElement('small'),track=document.createElement('span'),bar=document.createElement('i'),condition=document.createElement('small');
          name.textContent=row.mon.name||'宝可梦';detail.textContent=`Lv. ${row.mon.level}`;track.className='double-active-hp';bar.className='double-active-hp-fill';track.appendChild(bar);condition.className='double-active-condition';condition.textContent=row.mon.status?(statusNames[row.mon.status]||row.mon.status):'正常';
          card.append(sprite,name,detail,track,condition);group.appendChild(card);
        }
        els.doubleActives.appendChild(group);
      }
      els.doubleActives.dataset.signature=signature;
    }
    for(const row of rows){
      const card=[...els.doubleActives.querySelectorAll('.double-active-card')].find(item=>item.dataset.uid===String(row.mon.uid||''));if(!card)continue;
      const bar=card.querySelector('.double-active-hp-fill'),condition=card.querySelector('.double-active-condition'),name=card.querySelector('strong');
      if(bar)bar.style.width=`${Math.max(0,Math.min(100,safeNum(row.mon.hp)/Math.max(1,safeNum(row.mon.maxhp))*100))}%`;
      if(condition)condition.textContent=row.mon.status?(statusNames[row.mon.status]||row.mon.status):'正常';
      if(name)name.textContent=(row.mon.name||'宝可梦')+(isShiny(row.mon)?' ✦':'');
    }
  }
  function cosmeticItem(uid,slot){
    if(!getParty().some(mon=>String(mon.uid)===String(uid)))return null;
    const equipped=state.cosmetics?.equipped||{},own=equipped.伙伴?.[uid],id=own&&Object.hasOwn(own,slot)?own[slot]:equipped.全局?.[slot];
    const item=(state.cosmetics?.catalog||[]).find(item=>item.id===id);if(!item)return null;
    const p=state.cosmetics.parameters?.[uid]?.[slot];return {...item,effect:window.globalKantoCosmetics.resolveEffect(item.effect,p?.id===id?p:null)};
  }
  function clearCosmeticKey(key){const stop=state.cosmeticAuras.get(key);if(stop){stop();state.cosmeticAuras.delete(key);}const anchor=state.cosmeticAnchors.get(key);if(anchor){anchor.remove();state.cosmeticAnchors.delete(key);}}
  function clearCosmeticEffects(){for(const stop of state.cosmeticAuras.values())stop();state.cosmeticAuras.clear();for(const anchor of state.cosmeticAnchors.values())anchor.remove();state.cosmeticAnchors.clear();window.globalKantoCosmetics?.stopAll?.();}
  function clearShinyEntry(key){
    const entry=state.shinyEntryAnchors.get(key);if(!entry)return;
    if(entry.timer)clearTimeout(entry.timer);
    entry.stop?.();window.KantoShinyFx?.stopEntry?.(entry.anchor);entry.anchor.remove();state.shinyEntryAnchors.delete(key);
  }
  function clearShinyEntries(){for(const key of [...state.shinyEntryAnchors.keys()])clearShinyEntry(key);window.KantoShinyFx?.stopAll?.();}
  function createShinyEntryAnchor(uid,side,slot,key){
    const stage=state.camera?.world||els.stage,stageRect=stage?.getBoundingClientRect?.(),actor=cosmeticActorElement(uid,side,slot),rect=actor?.getBoundingClientRect?.();
    if(!stageRect?.width||!stageRect?.height||!rect?.width||!rect?.height)return null;
    const width=Math.min(Math.max(rect.width*.95,stageRect.width*.2),stageRect.width*.46),height=Math.min(Math.max(rect.height*.9,stageRect.height*.24),stageRect.height*.48);
    const centerX=rect.left+rect.width*.5,centerY=rect.top+rect.height*(side==='player'?.64:.58),anchor=document.createElement('div');
    anchor.className='kanto-shiny-entry';anchor.dataset.uid=String(uid);anchor.dataset.side=side;anchor.dataset.slot=String(slot);anchor.dataset.shinyEntryKey=key;anchor.setAttribute('aria-hidden','true');
    anchor.style.position='absolute';anchor.style.pointerEvents='none';anchor.style.left=`${(centerX-stageRect.left-width/2)/stageRect.width*100}%`;anchor.style.top=`${(centerY-stageRect.top-height/2)/stageRect.height*100}%`;anchor.style.width=`${width/stageRect.width*100}%`;anchor.style.height=`${height/stageRect.height*100}%`;
    stage.appendChild(anchor);return anchor;
  }
  function playShinyEntry(token,snapshot,reportedSpecies=''){
    if(state.reducedEffects||state.fastForward||!snapshot?.id||!window.KantoShinyFx?.playEntry)return false;
    const side=actorSide(token);if(!side)return false;
    const slot=actorSlot(token),sideIndex=side==='player'?0:1,team=snapshot.sides?.[sideIndex],mon=activeMonAt(team,slot);
    if(!mon||!isShiny(mon)||mon.fainted||safeNum(mon.hp)<=0)return false;
    const reported=speciesByEnglish(reportedSpecies);if(reported&&Number(reported.id)!==Number(mon.id))return false;
    const uid=team?.activeUIDs?.[slot]||mon.uid||`${snapshot.id}:${side}:${slot}:${mon.id}`;
    if(mon.uid&&String(mon.uid)!==String(uid))return false;
    const stamp=`${snapshot.id}:${snapshot.seq??snapshot.turn??0}:${side}:${slot}:${uid}`;
    if(state.shinyEntrySeen.has(stamp))return false;
    state.shinyEntrySeen.add(stamp);if(state.shinyEntrySeen.size>96)state.shinyEntrySeen.delete(state.shinyEntrySeen.values().next().value);
    const key=`${side}:${slot}`;clearShinyEntry(key);
    const anchor=createShinyEntryAnchor(uid,side,slot,key);if(!anchor)return false;
    const stop=window.KantoShinyFx.playEntry(anchor,{uid,side:side==='player'?'player':'opponent',seed:stamp,speed:state.animationSpeed,reducedMotion:false});
    if(typeof stop!=='function'){anchor.remove();return false;}
    const entry={anchor,stop,timer:0};state.shinyEntryAnchors.set(key,entry);
    entry.timer=setTimeout(()=>{entry.timer=0;clearShinyEntry(key);},Math.round(900/Math.max(.5,Math.min(3,safeNum(state.animationSpeed,1)))+220));
    return true;
  }
  function cosmeticActorElement(uid,side,slot){
    if(state.battle?.doubleBattle||els.stage.classList.contains('is-doubles')){
      const cards=els.doubleActives?.querySelectorAll?.('.double-active-card')||[];
      const card=[...cards].find(item=>item.dataset.uid===String(uid)&&item.dataset.side===side&&item.dataset.slot===String(slot))||[...cards].find(item=>item.dataset.side===side&&item.dataset.slot===String(slot));
      return card?.querySelector?.('.double-active-sprite')||null;
    }
    return spriteFor(side);
  }
  function createCosmeticAnchor(uid,side,slot,key){
    const stage=state.camera?.world||els.stage,stageRect=stage?.getBoundingClientRect?.(),actor=cosmeticActorElement(uid,side,slot),rect=actor?.getBoundingClientRect?.();
    if(!stageRect?.width||!stageRect?.height||!rect?.width||!rect?.height)return null;
    const bounds=window.globalKantoCosmetics?.anchorBounds?.(stageRect,rect,side);if(!bounds)return null;const anchor=document.createElement('div');
    anchor.className='kanto-cosmetic-anchor';anchor.dataset.uid=String(uid);anchor.dataset.side=side;anchor.dataset.slot=String(slot);anchor.dataset.cosmeticKey=key;
    for(const [key,value]of Object.entries(bounds))anchor.style[key]=`${value}%`;stage.appendChild(anchor);state.cosmeticAnchors.set(key,anchor);return anchor;
  }
  function playCosmetic(method,uid,slot,key=String(uid||slot)){
    if(state.reducedEffects||!els.stage||!window.globalKantoCosmetics)return;
    const item=cosmeticItem(uid,slot);if(!item)return;
    clearCosmeticKey(key);
    const keyParts=key.split(':'),side=['move','outcome'].includes(keyParts[0])?keyParts[1]:keyParts[0],slotMatch=key.match(/:(\d+)(?::|$)/),battleSlot=slotMatch?Number(slotMatch[1]):0,anchor=createCosmeticAnchor(uid,side,battleSlot,key);if(!anchor)return;
    const duration=method==='playMove'?900:method==='playOutcome'?1750:1550;
    const stop=window.globalKantoCosmetics[method]?.(anchor,item.effect,{duration,loop:slot==='aura'});
    if(typeof stop==='function')state.cosmeticAuras.set(key,()=>{stop();anchor.remove();state.cosmeticAnchors.delete(key);});
    else {anchor.remove();state.cosmeticAnchors.delete(key);}
  }
  function actorSlot(token){const match=String(token||'').match(/^p[12]([a-z])/i);return match?match[1].toLowerCase().charCodeAt(0)-97:0;}
  function cosmeticUidForActor(token,snapshot){const side=actorSide(token),index=side==='player'?0:side==='foe'?1:-1;if(index<0)return null;const team=snapshot?.sides?.[index];return team?.activeUIDs?.[actorSlot(token)]||activeMonAt(team,actorSlot(token))?.uid||null;}
  function playCosmeticEntry(token,snapshot){
    const side=actorSide(token),key=`${side}:${actorSlot(token)}`,uid=cosmeticUidForActor(token,snapshot);
    clearCosmeticKey(key);clearCosmeticKey(`${key}:aura`);clearCosmeticKey(`move:${side}:${actorSlot(token)}`);if(uid===null||uid===undefined)return;
    playCosmetic('playEntry',uid,'entry',key);playCosmetic('playEntry',uid,'aura',`${key}:aura`);
  }
  function playCosmeticMove(token,snapshot){const uid=cosmeticUidForActor(token,snapshot);if(uid!==null&&uid!==undefined)playCosmetic('playMove',uid,'move',`move:${actorSide(token)}:${actorSlot(token)}`);}
  function playCosmeticOutcome(snapshot){for(const side of ['player','foe'])for(let slot=0;slot<2;slot++){clearCosmeticKey(`${side}:${slot}`);clearCosmeticKey(`${side}:${slot}:aura`);clearCosmeticKey(`move:${side}:${slot}`);clearCosmeticKey(`outcome:${side}:${slot}`);}const winnerIndex=winnerSideIndex(snapshot),winner=winnerIndex===0?'player':winnerIndex===1?'foe':null;if(!winner)return;const side=snapshot.sides?.[winnerIndex];for(let slot=0;slot<2;slot++){const mon=activeMonAt(side,slot);if(mon?.uid!==undefined)playCosmetic('playOutcome',mon.uid,'outcome',`outcome:${winner}:${slot}`);}}
  function syncCosmeticBattle(snapshot){
    if(!snapshot?.id)return;
    if(state.cosmeticBattleId!==snapshot.id){clearCosmeticEffects();clearShinyEntries();state.shinyEntrySeen.clear();state.activeCosmeticUids.clear();state.cosmeticBattleId=snapshot.id;}
    if(state.reducedEffects){clearCosmeticEffects();return;}
    if(snapshot.ended){for(const side of ['player','foe'])for(let slot=0;slot<2;slot++){clearCosmeticKey(`${side}:${slot}`);clearCosmeticKey(`${side}:${slot}:aura`);clearCosmeticKey(`move:${side}:${slot}`);}return;}
    for(const side of ['player','foe'])for(let slot=0;slot<2;slot++){
      const key=`${side}:${slot}`,uid=cosmeticUidForActor(side==='player'?`p1${String.fromCharCode(97+slot)}`:`p2${String.fromCharCode(97+slot)}`,snapshot);
      const previous=state.activeCosmeticUids.get(key);
      const changed=previous!==undefined&&String(previous)!==String(uid);
      if(changed){clearCosmeticKey(key);clearCosmeticKey(`${key}:aura`);clearCosmeticKey(`move:${side}:${slot}`);}
      if(uid!==null&&uid!==undefined)state.activeCosmeticUids.set(key,uid);else state.activeCosmeticUids.delete(key);
      if(side==='player'&&uid!==null&&uid!==undefined&&(previous===undefined||changed))playCosmetic('playEntry',uid,'aura',`${key}:aura`);
    }
  }
  function setSprite(img, mon, back) {
    if (!mon||mon.fainted||mon.hp===0) { img.hidden = true; return; }
    img.classList.remove('faint-out', 'enter-in', 'recall-out'); img.dataset.speciesId = String(mon.id);
    const owned = getParty().find(entry => entry.uid != null && String(entry.uid) === String(mon.uid));
    img.style.scale = owned?.体型标记 === 'lighthouse-giant-dratini' && dexId(owned) === 147 ? '1.2' : '';
    const shiny=isShiny(mon);img.classList.toggle('is-shiny',shiny);
    const id = mon.appearanceId || mon.id, animated=state.battleSpriteStyle==='animated';
    const frames=animatedSpriteData?.pokemon?.find(row=>row.dex===Number(id));
    const animation=frames?.[shiny?'shiny':'animated']?.[back?'back':'front'];
    const hdAnimation=frames?.hd?.[shiny?'shiny':'animated']?.[back?'back':'front'];
    img.classList.remove('artwork-sprite','artwork-player-facing');img.classList.toggle('animated-sprite',animated&&Boolean(animation||window.KantoStadiumSprites?.resolve(id,back,shiny)));
    const custom=animated&&window.KantoStadiumSprites?.resolve(id,back,shiny);
    const builtin=animated&&animation?(window.__KANTO_ANIMATED_ROOT__?window.__KANTO_ANIMATED_ROOT__+animation:assetHref(animation)):null;
    const hd=animated&&hdAnimation?(window.__KANTO_ANIMATED_ROOT__?window.__KANTO_ANIMATED_ROOT__+hdAnimation:assetHref(hdAnimation)):null;
    img.classList.toggle('hd-sprite',Boolean(hd&&!custom));
    const source=custom||hd||builtin||assetUrl(id,back,shiny),requestKey=`${source}|${animated?'animated':back?'back':'front'}|${id}|${shiny?'shiny':'normal'}`;
    if(img.dataset.spriteRequestKey!==requestKey){
      img.hidden=false;img.dataset.spriteFailed='';img.dataset.spriteRequestKey=requestKey;img.dataset.spriteFallback=custom?'custom':hd?'hd':builtin?'animated':back?'back':'front';
      const load=next=>{if(img.dataset.spriteFailedSrc===next){img.dataset.spriteFailed='true';img.hidden=true;return;}if(img.dataset.spriteLoadedSrc===next)return;img.dataset.spriteLoadedSrc=next;img.src=next;};
      img.onerror=()=>{
        img.dataset.spriteFailedSrc=img.dataset.spriteLoadedSrc||'';
        if(img.dataset.spriteFallback==='custom'){
          img.dataset.spriteFallback=hd?'hd':builtin?'animated':back?'back':'front';img.classList.toggle('hd-sprite',Boolean(hd));
          if(!builtin)img.classList.remove('animated-sprite');
          load(hd||builtin||assetUrl(id,back,shiny));return;
        }
        if(img.dataset.spriteFallback==='hd'){
          img.dataset.spriteFallback=builtin?'animated':back?'back':'front';img.classList.remove('hd-sprite');
          if(!builtin)img.classList.remove('animated-sprite');load(builtin||assetUrl(id,back,shiny));return;
        }
        if(img.dataset.spriteFallback==='animated'){
          img.dataset.spriteFallback=back?'back':'front';img.classList.remove('animated-sprite');load(assetUrl(id,back,shiny));return;
        }
        if(back&&img.dataset.spriteFallback==='back'){img.dataset.spriteFallback='front';load(assetUrl(id,false,shiny));return;}
        img.dataset.spriteFailed='true';img.hidden=true;
      };
      load(source);
    }else img.hidden=img.dataset.spriteFailed==='true';
    img.classList.toggle('hd-sprite',animated&&img.dataset.spriteFallback==='hd');
    img.classList.toggle('animated-sprite',animated&&['custom','hd','animated'].includes(img.dataset.spriteFallback));
    img.alt = mon.name || '宝可梦';
  }
  function setBattleSpriteStyle(style) {
    state.battleSpriteStyle = style === 'animated'||style==='3d' ? 'animated' : 'pixel';
    try{localStorage.setItem('kanto-battle-model-style',state.battleSpriteStyle);}catch{}
    if (els.spriteStyle) { els.spriteStyle.textContent = state.battleSpriteStyle === 'pixel' ? '像素精灵 · 切换动态' : '动态精灵 · 切换像素';els.spriteStyle.title='二维 GIF 动画，并非实时 3D；可导入本地素材，缺失时自动回退。'; els.spriteStyle.setAttribute('aria-pressed', String(state.battleSpriteStyle === 'animated')); }
    if (state.battle) { const player = activeMon(state.battle.sides?.[0]), foe = activeMon(state.battle.sides?.[1]); setSprite(els.playerSprite, player, true); setSprite(els.foeSprite, foe, false); if(els.doubleActives)els.doubleActives.dataset.signature='';renderDoubleActives(state.battle); }
  }
  function setBattleSceneryStyle(style) {
    state.battleSceneryStyle = style === 'pixel' ? 'pixel' : 'illustrated';
    const illustrated = state.battleSceneryStyle === 'illustrated' && state.sceneryAvailable;
    els.stage.classList.toggle('illustrated-ready', illustrated);
    if (els.sceneryStyle) {
      els.sceneryStyle.hidden = !state.sceneryAvailable;
      els.sceneryStyle.textContent = illustrated ? '显示像素场地' : '显示高清场景';
      els.sceneryStyle.setAttribute('aria-pressed', String(illustrated));
    }
  }
  function syncTacticalSnapshot(snapshot) {
    const flags={leechseed:'leechseed',confusion:'confusion',substitute:'substitute',protect:'protect',twoturnmove:'charged',mustrecharge:'recharge',encore:'encore',taunt:'taunt',perishsong:'perishsong'};
    for(const [index,side] of ['player','foe'].entries()){
      const mon=activeMon(snapshot?.sides?.[index]);if(!Array.isArray(mon?.volatiles))continue;
      clearProtectTimer(side); tacticalStates[side].clear();for(const id of mon.volatiles)if(flags[id])tacticalStates[side].add(flags[id]);
      const sprite=spriteFor(side);for(const [id,cls] of Object.entries({leechseed:'volatile-seed',confusion:'volatile-confusion',substitute:'volatile-substitute',protect:'volatile-protect',twoturnmove:'volatile-preparing'}))sprite.classList.toggle(cls,mon.volatiles.includes(id));
    }
    const panel=$('battleFieldState');if(!panel)return;
    const names={reflect:'反射壁',lightscreen:'光墙',safeguard:'神秘守护',mist:'白雾',spikes:'撒菱',futuresight:'未来攻击'};
    panel.textContent=(snapshot?.sides||[]).flatMap((side,i)=>(side.conditions||[]).filter(id=>names[id]).map(id=>(i===0?'我方':'对方')+' · '+names[id])).join('　');
    panel.hidden=!panel.textContent;
  }
  function renderBattle(snapshot) {
    if (!snapshot) { renderActionsOnEmpty('当前没有进行中的战斗，请返回剧情选择遭遇。'); return; }
    state.battle = snapshot;
    if(!rosterMode&&window.KantoBattleCamera){if(!state.camera)state.camera=window.KantoBattleCamera.attach(els.stage,{speed:state.animationSpeed,reduced:state.reducedEffects});}
    window.KantoAudio?.battle(snapshot, state.world, Boolean(state.battleFocus && !rosterMode));
    syncBattleMusicButton();
    renderBattleTerrain();
    const player = activeMon(snapshot.sides?.[0]), foe = activeMon(snapshot.sides?.[1]);
    renderDoubleActives(snapshot);
    syncTacticalSnapshot(snapshot);
    els.mode.textContent = encounterName(); els.turn.textContent = `第 ${first(getMap(), ['轮次'], 1)} 轮 · 回合 ${snapshot.turn ?? 1}`;
    setWeather(snapshot.weather);
    if (player) { els.playerName.textContent = player.name+(isShiny(player)?' ✦':''); els.playerLevel.textContent = `Lv. ${player.level}`; updateHp('player', player.hp, player.maxhp); setSprite(els.playerSprite, player, true); setCondition(els.playerCondition, player.status); state.boosts.player = { ...(player.boosts || {}) }; renderBoosts('player', state.boosts.player); }
    if (foe) { els.foeName.textContent = foe.name+(isShiny(foe)?' ✦':''); els.foeLevel.textContent = `Lv. ${foe.level}${foe.overcap?' · 突破':''}`;els.foeLevel.title=foe.overcap?`地狱训练家：IV ${foe.overcap.iv}，每项EV ${foe.overcap.evPerStat}（总${foe.overcap.evTotal}）`:'敌方精灵等级'; updateHp('foe', foe.hp, foe.maxhp); setSprite(els.foeSprite, foe, false); if (snapshot.mode === 'wild' && snapshot.caught) els.foeSprite.hidden = true; setCondition(els.foeCondition, foe.status); state.boosts.foe = { ...(foe.boosts || {}) }; renderBoosts('foe', state.boosts.foe); }
    renderActions(snapshot); renderBattleResult(snapshot); renderRoundControls();
    syncCosmeticBattle(snapshot);
    updateImportantBattle(snapshot);
  }
  function renderGrowthRecap(snapshot, reward) {
    const awards = (Array.isArray(reward?.经验) ? reward.经验 : []).filter(entry => safeNum(entry?.获得) > 0 || safeNum(entry?.升级) > 0 || (Array.isArray(entry?.升级) && entry.升级.length));
    if (!awards.length) return null;
    const battleId = String(snapshot?.id || ''), resultReady = state.world?.战斗?.状态 === 'finished' && Boolean(state.world?.战斗?.奖励);
    if (!battleId || !resultReady) return null;
    const section = document.createElement('section'); section.className = 'growth-recap';
    const title = document.createElement('strong'); title.className = 'growth-recap-title'; title.textContent = '战后成长'; section.appendChild(title);
    let persistedSeen = false;
    try { persistedSeen = typeof window !== 'undefined' && window.sessionStorage?.getItem(`kanto-growth:${battleId}`) === 'shown'; } catch { /* Private contexts may disable session storage. */ }
    const unseen = state.growthSeenBattleId !== battleId && !persistedSeen;
    const animate = Boolean(unseen && !state.reducedEffects);
    if (unseen) {
      state.growthSeenBattleId = battleId;
      try { if (typeof window !== 'undefined') window.sessionStorage?.setItem(`kanto-growth:${battleId}`, 'shown'); } catch { /* In-memory guard still prevents duplicate reveals. */ }
    }
    section.classList.add(animate ? 'is-revealing' : 'is-complete');
    const currentMons = [...getParty(), ...(Array.isArray(state.world?.电脑) ? state.world.电脑 : [])];
    awards.forEach((award, index) => {
      const uid = String(award?.uid || ''), mon = currentMons.find(item => String(item?.uid || '') === uid);
      const row = document.createElement('article'); row.className = 'growth-row'; row.style.setProperty('--growth-delay', `${animate ? index * 120 / Math.max(1, state.animationSpeed) : 0}ms`);
      const identity = document.createElement('div'); identity.className = 'growth-identity';
      const name = document.createElement('strong'); name.textContent = String(mon?.昵称 || award?.昵称 || '宝可梦'); identity.appendChild(name);
      const gained = safeNum(award?.获得); if (gained > 0) { const xp = document.createElement('span'); xp.textContent = `经验 +${gained}`; identity.appendChild(xp); }
      const levelDelta = Array.isArray(award?.升级) ? null : safeNum(award?.升级);
      const legacyTarget = Array.isArray(award?.升级) ? award.升级.map(value => safeNum(value)).filter(value => value > 0).at(-1) : null;
      const level = legacyTarget || (levelDelta > 0 ? safeNum(mon?.等级) : 0);
      if (level) { const badge = document.createElement('b'); badge.className = 'growth-level'; badge.textContent = `升至 Lv. ${level}`; identity.appendChild(badge); }
      else if (levelDelta > 0) { const badge = document.createElement('b'); badge.className = 'growth-level'; badge.textContent = `提升 ${levelDelta} 级`; identity.appendChild(badge); }
      row.appendChild(identity);
      if(mon?.待进化?.length)row.appendChild(renderPendingEvolution(mon));
      const before = state.battleBaseline.find(item => String(item?.uid || '') === uid);
      if (before && mon && String(before.图鉴编号) !== String(mon.图鉴编号)) {
        const evolution = document.createElement('div'); evolution.className = 'evolution-showcase';
        const oldSprite = document.createElement('img'); oldSprite.src = assetUrl(before.图鉴编号,false,isShiny(before)); oldSprite.alt = before.昵称 || '进化前';
        const arrow = document.createElement('span'); arrow.textContent = '→'; arrow.setAttribute('aria-hidden', 'true');
        const newSprite = document.createElement('img'); newSprite.src = assetUrl(mon.图鉴编号,false,isShiny(mon)); newSprite.alt = mon.昵称 || '进化后';
        const label = document.createElement('strong'); label.textContent = `${before.昵称 || '伙伴'}进化为${mon.昵称 || '新形态'}`;
        evolution.append(oldSprite, arrow, newSprite, label); row.appendChild(evolution);
      }
      section.appendChild(row);
    });
    const note = document.createElement('small'); note.className = 'growth-writeback'; note.textContent = '经验与等级已按人物卡结算写回。'; section.appendChild(note);
    if (animate) {
      const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'growth-continue'; skip.textContent = '继续';
      const finish = () => { section.classList.remove('is-revealing'); section.classList.add('is-complete'); skip.hidden = true; };
      skip.addEventListener('click', finish); section.appendChild(skip);
      setTimeout(finish, Math.max(150, 1050 / Math.max(1, state.animationSpeed)));
    }
    return section;
  }
  function renderBattleResult(snapshot) {
    const panel=$('battleResult'),actions=$('battleActionBody');
    if(!panel||!actions)return;
    const pending=snapshot?.pendingBattleLearning?.length;
    panel.hidden=!snapshot?.ended&&!pending; actions.hidden=Boolean(snapshot?.ended||pending);
    if(pending&&!snapshot?.ended){panel.replaceChildren();const learner=getParty().find(mon=>snapshot.pendingBattleLearning.includes(mon.uid)&&mon.待学招式?.length);if(learner)panel.appendChild(renderLearningChoice(learner,learner.待学招式[0]));return;}
    if(!snapshot?.ended)return;
    panel.replaceChildren();
    const result=state.world?.战斗?.结果||'',reward=snapshot.rewards||state.world?.战斗?.奖励;
    panel.dataset.result=result;
    const title=document.createElement('strong');title.textContent=({win:'赢得了这场对战！',lose:'这次没能战胜对手',caught:'收服成功！',escaped:'安全离开了战斗',draw:'本场对战平局'})[result]||'本场战斗结束';panel.appendChild(title);
    if(reward){
      const money=document.createElement('p');money.textContent=`金币 ${reward.金币>=0?'+':''}${reward.金币||0}`;panel.appendChild(money);
      const growth=renderGrowthRecap(snapshot,reward);if(growth)panel.appendChild(growth);
      if(!growth)for(const entry of reward.经验||[]){const line=document.createElement('p');line.textContent=`${entry.昵称} · 经验 +${entry.获得}${entry.升级?` · 提升 ${entry.升级} 级`:''}`;panel.appendChild(line);}
      const items=(reward.物品||[]).map(item=>`${rewardItemLabel(item)} ×${item.数量}`),badges=reward.徽章||[];
      const cosmetics=(Array.isArray(reward.外观)?reward.外观:[]).map(item=>item?.名称||item?.name||item?.id).filter(Boolean);
      if(items.length||badges.length||cosmetics.length){const line=document.createElement('p');line.textContent=[...items,...badges,...cosmetics.map(name=>`外观特效：${name}`)].join(' · ');panel.appendChild(line);}
    }
    const learner=getParty().find(mon=>mon.待学招式?.length);
    if(learner && canLearnMove()) panel.appendChild(renderLearningChoice(learner, learner.待学招式[0]));
    if(nativeMode){const back=document.createElement('button');back.type='button';back.className='return-story-result';back.textContent='返回剧情';back.addEventListener('click',returnToStage);panel.appendChild(back);}
  }
  function renderBattleTerrain() {
    if (!terrainReady) return;
    const canvas = $('battleTerrain'), node = currentNodeId(), location = state.locations.find(entry => entry.id === node);
    const water = ['route19','route20','route21','seafoam'].includes(node);
    const terrain = water ? 'water' : location?.kind === 'cave' ? 'cave' : location?.kind === 'town' || state.world?.遭遇?.类型 === 'gym' ? 'indoor' : 'grass';
    if (!canvas || (canvas.dataset.terrain === terrain && els.stage.classList.contains('terrain-ready'))) return;
    try { window.KantoTerrain.render(canvas, terrain); canvas.dataset.terrain = terrain; els.stage.classList.add('terrain-ready'); }
    catch (error) { els.stage.classList.remove('terrain-ready'); showPersistentError(`战斗背景无法显示：${error.message || '地形绘制失败'}。请重试素材加载。`, initializeBattleTerrain); }
  }
  async function initializeBattleTerrain() {
    if (!window.KantoTerrain?.init) throw new Error('战斗地形模块未载入。');
    await window.KantoTerrain.init(window.__KANTO_TERRAIN_MANIFEST__, { resolveAsset: localResourceUrl });
    terrainReady = true; renderBattleTerrain();
    if (els.stage.classList.contains('terrain-ready')) clearPersistentError();
  }
  const boostNames = { atk: '攻', def: '防', spa: '特攻', spd: '特防', spe: '速', accuracy: '命中', evasion: '闪避' };
  function renderBoosts(side, boosts = {}) {
    const label = side === 'player' ? els.playerBoosts : els.foeBoosts;
    const rows = Object.entries(boosts || {}).filter(([, value]) => safeNum(value) !== 0).map(([key, value]) => `${boostNames[key] || key}${safeNum(value) > 0 ? '↑' : '↓'}${Math.abs(safeNum(value))}`);
    const states = [...(tacticalStates[side] || [])];
    const tacticalLabels = { charged: '蓄力中', recharge:'需要休息', encore:'再来一次', taunt:'挑衅', perishsong:'灭亡之歌', substitute: '替身', protect: '保护中', leechseed: '寄生种子', confusion: '混乱' };
    const tacticalText = states.map(key => tacticalLabels[key] || key);
    const parts = [];
    if (rows.length) parts.push(`能力阶数 ${rows.join(' ')}`);
    if (tacticalText.length) parts.push(`战术状态 ${tacticalText.join(' · ')}`);
    label.textContent = parts.join('　');
    label.classList.toggle('has-boosts', rows.length > 0 || tacticalText.length > 0);
  }
  function setWeather(weather) {
    const key = String(weather || 'none').toLowerCase();
    const classes = ['weather-rain', 'weather-sun', 'weather-sand', 'weather-hail'];
    els.stage.classList.remove(...classes);
    if (key === 'raindance' || key === 'rain') els.stage.classList.add('weather-rain');
    else if (key === 'sunnyday' || key === 'sun') els.stage.classList.add('weather-sun');
    else if (key === 'sandstorm' || key === 'sand') els.stage.classList.add('weather-sand');
    else if (key === 'hail' || key === 'snow') els.stage.classList.add('weather-hail');
    els.weather.textContent = `天气 ${weatherNames[key] || weather || '无'}`;
    const changed = currentWeatherKey !== null && currentWeatherKey !== key;
    currentWeatherKey = key;
    if (changed && !state.reducedEffects) {
      els.stage.classList.remove('weather-change'); void els.stage.offsetWidth;
      els.stage.classList.add('weather-change');
      setTimeout(() => els.stage.classList.remove('weather-change'), 620 / state.animationSpeed);
    }
  }
  function renderActions(snapshot) {
    const request = snapshot?.request || {}, moves = Array.isArray(request.moves) ? request.moves : [];
    els.moves.replaceChildren();
    if (snapshot?.ended) {
      const empty = document.createElement('div'); empty.className = 'empty-actions'; empty.textContent = '本轮战斗已结束，结果已写回人物卡。'; els.moves.appendChild(empty);
    } else if (snapshot.doubleBattle && window.KantoDoubles?.render) {
      state.battleActionTab='moves';els.switchTray.hidden=true;const uiSnapshot=Array.isArray(request.forceSwitch)?{...snapshot,request:{...request,forceSwitchSlots:request.forceSwitch}}:snapshot;window.KantoDoubles.render(els.moves,{snapshot:uiSnapshot,busy:state.busy,onSubmit:takeAction});
    } else if (request.forceSwitch===true) {
      const empty = document.createElement('div'); empty.className = 'empty-actions'; empty.textContent = '当前宝可梦无法继续战斗，请选择同行替补。'; els.moves.appendChild(empty);
    } else if (moves.length) {
      moves.slice(0, 4).forEach((move, i) => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'move-button'; button.disabled = Boolean(move.disabled) || state.busy || request.wait;
        const top = document.createElement('span'); top.className = 'move-top'; const name = document.createElement('span'); name.className = 'move-name'; name.textContent = move.name || moveById(move.id)?.name || move.id || '招式';
        const type = document.createElement('span'); type.className = 'type-pill'; type.textContent = typeName(move.type || moveById(move.id)?.type); top.append(name, type);
        const bottom = document.createElement('span'); bottom.className = 'move-bottom'; const power = document.createElement('span'); power.textContent = move.power ? `威力 ${move.power}` : String(move.category).toLowerCase() === 'status' ? '变化招式' : '特殊伤害'; const pp = document.createElement('span'); pp.textContent = `PP ${move.pp ?? '—'} / ${move.maxpp ?? '—'}`; bottom.append(power, pp);
        const hintText = moveBattleHint(move, activeMon(snapshot.sides?.[0]), activeMon(snapshot.sides?.[1]), snapshot.weather);
        const hint = document.createElement('span'); hint.className = 'move-hint'; hint.textContent = hintText;
        button.title = moveById(move.id)?.description || ''; button.setAttribute('aria-keyshortcuts',String(i+1)); button.append(top, bottom); if (hintText) button.appendChild(hint); button.addEventListener('click', () => takeAction(`move ${i + 1}`)); els.moves.appendChild(button);
      });
    } else { const empty = document.createElement('div'); empty.className = 'empty-actions'; empty.textContent = request.wait ? '等待对手行动…' : '当前没有可用招式。'; els.moves.appendChild(empty); }
    const switches = Array.isArray(request.switches) ? request.switches : [];
    els.switch.disabled = state.busy || Boolean(snapshot.ended) || !switches.some(mon => !mon.active && !mon.fainted);
    els.switchTray.replaceChildren();
    switches.forEach(mon => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'switch-option';
      const image = document.createElement('img'); image.src = assetUrl(mon.id,false,isShiny(mon)); image.alt = ''; image.width = 48; image.height = 48;
      const info = document.createElement('span');
      const name = document.createElement('strong'); name.textContent = `${mon.name}${mon.active ? ' · 出战中' : mon.fainted ? ' · 已倒下' : ''}`;
      const hp = document.createElement('small'); hp.textContent = `Lv. ${mon.level} · HP ${mon.hp} / ${mon.maxhp}${mon.status ? ' · '+(statusNames[mon.status]||mon.status) : ''}`;
      const bar = document.createElement('i'); bar.className = 'switch-hp'; bar.style.setProperty('--hp', Math.max(0, Math.min(100, mon.hp / Math.max(1, mon.maxhp) * 100))+'%');
      info.append(name, hp, bar); button.append(image, info);
      button.disabled = state.busy || mon.active || mon.fainted; button.addEventListener('click', () => takeAction(`switch ${mon.slot}`)); els.switchTray.appendChild(button);
    });
    const itemsAvailable = !snapshot.ended && !request.wait && request.forceSwitch!==true && !(Array.isArray(request.forceSwitch)&&request.forceSwitch.some(Boolean));
    els.potion.disabled = state.busy || !itemsAvailable || itemCount(['potion', '伤药']) <= 0;
    els.capture.disabled = state.busy || !itemsAvailable || snapshot.mode !== 'wild' || itemCount(['pokeball', 'ball', '精灵球']) <= 0;
    const runner=switches.find(mon=>mon.active)||activeMon(snapshot.sides?.[0]);
    const escapeBypass=runner?.heldItem==='smokeball'||['runaway','Run Away','逃跑','逃足'].includes(runner?.abilityId||runner?.ability);
    els.run.disabled = state.busy || !itemsAvailable || snapshot.mode !== 'wild' || request.trapped&&!escapeBypass;
    els.run.title=snapshot.mode!=='wild'?'训练家对战不能逃跑。':request.trapped&&!escapeBypass?'当前受到束缚，无法逃跑。':escapeBypass?'携带烟雾球或具有逃跑特性，可以脱离野生对战。':'逃跑失败会消耗一次行动。';
    if (request.forceSwitch===true) { state.battleActionTab = 'pokemon'; els.switchTray.hidden = false; }
    renderBattleCommandTabs(snapshot);
    renderBattleBag(snapshot);
  }
  function setBattleActionTab(tab) {
    if (!['moves', 'bag', 'pokemon', 'run'].includes(tab)) return;
    state.battleActionTab = tab;
    if (tab === 'pokemon') els.switchTray.hidden = false;
    renderBattleCommandTabs(state.battle);
  }
  function renderBattleCommandTabs(snapshot) {
    const request = snapshot?.request || {};
    els.battleCommandBar.querySelectorAll('[data-battle-tab]').forEach(button => {
      button.setAttribute('aria-selected', String(button.dataset.battleTab === state.battleActionTab));
      const nativeForce=request.forceSwitch===true;
      const doubleForce=Boolean(snapshot?.doubleBattle&&Array.isArray(request.forceSwitch)&&request.forceSwitch.some(Boolean));
      button.disabled = !snapshot || Boolean(snapshot.ended) || Boolean(request.wait) || state.busy || (nativeForce && button.dataset.battleTab !== 'pokemon') || (doubleForce&&button.dataset.battleTab!=='moves');
    });
    els.moves.hidden = state.battleActionTab !== 'moves';
    els.battleBagPanel.hidden = state.battleActionTab !== 'bag';
    els.battlePokemonPanel.hidden = state.battleActionTab !== 'pokemon';
    els.battleRunPanel.hidden = state.battleActionTab !== 'run';
  }
  function battleItemActionKey(id, definition = itemDefinition(id)) {
    if(Object.hasOwn(definition,'battle')&&!definition.battle)return '';
    const raw = String(first(definition, ['actionKey', 'action', '战斗行动'], '') || '').trim();
    const key = String(id).toLowerCase();
    if (raw) return raw;
    if (String(definition.category || '').toLowerCase() === 'ball') return `capture ${key === 'ball' || key === '精灵球' ? 'pokeball' : key}`;
    if (key === 'potion' || key === '伤药') return 'item potion';
    if (['pokeball', 'ball', '精灵球'].includes(key)) return 'capture pokeball';
    return '';
  }
  function battleItemEffect(definition) {
    const effect = first(definition, ['battle', 'effect'], {});
    return effect && typeof effect === 'object' ? effect : {};
  }
  function isBattleBall(id, definition, actionKey) {
    return String(definition.category || '').toLowerCase() === 'ball' || actionKey.startsWith('capture') || /(?:pok[eé]?ball|精灵球|^ball$)/i.test(String(id));
  }
  function eligibleBattleItemTargets(definition, switches) {
    const effect = battleItemEffect(definition), statuses = Array.isArray(effect.status) ? effect.status.map(String) : null;
    return switches.filter(mon => {
      const hp = safeNum(mon.hp), maxhp = safeNum(mon.maxhp), fainted = Boolean(mon.fainted) || hp <= 0;
      if(effect.pp!==undefined){const moves=mon.moves||[];return moves.some(move=>Number(move.pp??move.PP)<Number(move.maxpp??move.PP上限));}
      if (effect.revive !== undefined && effect.revive !== null) return fainted;
      if (fainted) return false;
      if(effect.heal!==undefined||statuses)return(effect.heal!==undefined&&maxhp>0&&hp<maxhp)||(statuses&&statuses.includes(String(mon.status||'')));
      return true;
    });
  }
  function renderBattleBag(snapshot) {
    const request = snapshot?.request || {}, usable = snapshot && !snapshot.ended && !request.wait && !request.forceSwitch && !state.busy;
    els.battleBagItems.replaceChildren();
    const bag = normalizeItemList(getBagItems()).filter(([, count]) => count > 0);
    if (!bag.length) {
      const empty = document.createElement('p'); empty.className = 'team-empty'; empty.textContent = '背包里没有可用道具。'; els.battleBagItems.appendChild(empty);
      els.battleItemConfirm.hidden = true; return;
    }
    bag.forEach(([id, count]) => {
      const def = itemDefinition(id), actionKey = battleItemActionKey(id, def), row = document.createElement('div'); row.className = 'battle-item-row';
      const label = document.createElement('span'); label.textContent = itemName(id) + ' ×' + count;
      if (def.image) { const icon = document.createElement('img'); icon.className = 'item-sprite'; icon.alt = ''; icon.src = assetHref(def.image); icon.onerror = () => { icon.hidden = true; }; label.className = 'item-illustrated'; label.appendChild(icon); }
      const action = document.createElement('small'); action.textContent = actionKey ? itemDescription(id, def) || '使用会消耗本回合' : '当前不可战斗使用';
      const choose = document.createElement('button'); choose.type = 'button'; choose.textContent = state.selectedBattleItem === id ? '已选择' : '选择';
      const isBall = isBattleBall(id, def, actionKey);
      choose.disabled = !usable || !actionKey || (isBall && snapshot.mode !== 'wild');
      choose.setAttribute('aria-pressed', String(state.selectedBattleItem === id));
      choose.addEventListener('click', () => { state.selectedBattleItem = id; renderBattleBag(snapshot); });
      row.append(label, action, choose); els.battleBagItems.appendChild(row);
    });
    if (!state.selectedBattleItem) { els.battleItemConfirm.hidden = true; return; }
    const selected = bag.find(([id]) => id === state.selectedBattleItem);
    if (!selected) { state.selectedBattleItem = null; els.battleItemConfirm.hidden = true; return; }
    const [id] = selected, def = itemDefinition(id), actionKey = battleItemActionKey(id, def);
    const isBall = isBattleBall(id, def, actionKey);
    const needsTarget = !isBall && Boolean(first(def, ['target', 'requiresTarget', '需要目标'], /potion|heal|revive|antidote|item/i.test(actionKey)));
    const party = eligibleBattleItemTargets(def, request.switches || []);
    els.battleItemTarget.replaceChildren();
    party.forEach((mon, index) => {
      const option = document.createElement('option');
      const slot = Number(mon.slot);
      option.value = String(Number.isInteger(slot) && slot > 0 ? slot : index + 1);
      option.textContent = mon.name + ' · ' + mon.hp + '/' + mon.maxhp + ' HP';
      els.battleItemTarget.appendChild(option);
    });
    els.battleItemTarget.hidden = !needsTarget; els.battleItemTargetLabel.hidden = !needsTarget;
    if(els.battleItemMove){
      const singlePP=def.battle?.pp!==undefined&&!def.battle.allMoves;
      els.battleItemMove.hidden=!singlePP;els.battleItemMoveLabel.hidden=!singlePP;
      const update=()=>{els.battleItemMove.replaceChildren();const mon=party.find(entry=>Number(entry.slot)===Number(els.battleItemTarget.value));for(const[i,move]of(mon?.moves||[]).entries()){const option=document.createElement('option');option.value=String(i+1);option.textContent=`${moveById(move.id)?.name||move.name||move.id} · PP ${move.pp}/${move.maxpp}`;option.disabled=move.pp>=move.maxpp;els.battleItemMove.appendChild(option);}};
      els.battleItemTarget.onchange=update;update();
    }
    els.battleItemConfirm.hidden = false;
    els.battleBagNote.textContent = isBall && snapshot.mode !== 'wild' ? '训练家对战中不能使用精灵球。' : needsTarget && !party.length ? '目前没有适用目标：恢复药只对受伤的伙伴有效，状态药对应异常状态，活力碎片对应倒下的伙伴。' : '确认后消耗本回合；取消不会推进回合。';
    els.battleItemUse.textContent = isBall ? '投出精灵球' : '使用' + itemName(id);
    els.battleItemUse.disabled = !usable || !actionKey || (needsTarget && !party.length) || (isBall && snapshot.mode !== 'wild');
    els.battleItemCancel.disabled = state.busy;
  }
  function confirmBattleItem() {
    const id = state.selectedBattleItem; if (!id || !state.battle || state.busy) return;
    const def = itemDefinition(id), actionKey = battleItemActionKey(id, def);
    if (!actionKey) return toast('这个道具不能在战斗中使用。');
    if (isBattleBall(id, def, actionKey)) {
      if (state.battle.mode !== 'wild') return toast('训练家对战中不能使用精灵球。');
      takeAction(actionKey); return;
    }
    const needsTarget = Boolean(first(def, ['target', 'requiresTarget', '需要目标'], /potion|heal|revive|antidote|item/i.test(actionKey)));
    const target = safeNum(els.battleItemTarget.value, 0);
    if (needsTarget && !target) return toast('请选择使用对象。');
    const singlePP=def.battle?.pp!==undefined&&!def.battle.allMoves;
    const slot=singlePP?Number(els.battleItemMove?.value):0;
    if(singlePP&&!slot)return toast('请选择需要恢复PP的招式。');
    const choice = actionKey + (needsTarget ? ' ' + target : '')+(singlePP?' '+slot:'');
    takeAction(choice);
  }
  function describeBattleChoice(choice) {
    const parts = String(choice || '').trim().split(/\s+/), verb = (parts.shift() || '').toLowerCase();
    if (verb === 'move') { const index = Math.max(0, Number(parts[0]) - 1), move = state.battle?.request?.moves?.[index]; return move ? `使用「${move.name || moveById(move.id)?.name || '招式'}」` : '使用招式'; }
    if (verb === 'switch') { const slot = Number(parts[0]), mon = state.battle?.request?.switches?.find(entry => Number(entry.slot) === slot); return `换上${mon?.name || '替补宝可梦'}`; }
    if (verb === 'run') return '尝试逃跑';
    if (verb.startsWith('capture')) return '投出精灵球';
    if (verb === 'potion') return '使用伤药';
    const item = verb === 'use' ? parts[0] : verb;
    return item && item !== 'pass' ? `使用${itemName(item)}` : '继续本回合';
  }
  function canonicalMove(raw) {
    const text = String(raw || '').trim();
    if (state.moves[text.toLowerCase()]) return state.moves[text.toLowerCase()];
    return Object.values(state.moves).find(move => String(move.english || '').toLowerCase() === text.toLowerCase() || String(move.name || '') === text) || null;
  }
  function actorSide(token) { return /^p1/i.test(token || '') ? 'player' : /^p2/i.test(token || '') ? 'foe' : null; }
  function protocol(line) { return String(line).split('|'); }
  function speciesByEnglish(name) {
    const clean = String(name || '').split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return state.species.find(p => [p.english, p.key].some(value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '') === clean));
  }
  function arenaPoint(element, fx = .5, fy = .5) {
    const arena = (state.camera?.world||els.stage).getBoundingClientRect(), rect = element?.getBoundingClientRect?.();
    if (arena.width > 0 && arena.height > 0 && rect?.width > 0 && rect?.height > 0) {
      return { x: Math.max(0, Math.min(1, (rect.left - arena.left + rect.width * fx) / arena.width)), y: Math.max(0, Math.min(1, (rect.top - arena.top + rect.height * fy) / arena.height)) };
    }
    const player = element === els.playerSprite;
    return { x: player ? .28 : .72, y: player ? .68 : .37 };
  }
  function spritePoint(side, fx = .5, fy = .5) { return arenaPoint(spriteFor(side), fx, fy); }
  function arenaVector(from, to, fraction = 1) {
    return { dx: (to.x - from.x) * els.stage.clientWidth * fraction, dy: (to.y - from.y) * els.stage.clientHeight * fraction };
  }
  function pointAlong(from, to, t, offset = 0) {
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t + offset };
  }
  const originalEffectSprites = {
    'fire-stream': { file: 'fire_plume.png', frames: 5, width: 32, height: 32, rotate: 90 },
    'lightning-bolt': { file: 'electricity.png', frames: 4, width: 32, height: 32 },
    'claw-mark': { file: 'claw_slash.png', frames: 5, width: 32, height: 32 },
    'impact-ring': { file: 'impact.png', frames: 1, width: 32, height: 32 },
    'switch-capsule': { file: 'pokeball.png', frames: 1, width: 16, height: 16 },
    'water-impact': { file: 'water_impact.png', frames: 1, width: 32, height: 32 }
  };
  function attachOriginalSprite(node, name) {
    const spec = originalEffectSprites[name]; if (!spec) return;
    const url = assetHref(`assets/effects/${spec.file}`);
    const image = new Image();
    image.onload = () => {
      if (!node.isConnected) return;
      node.classList.add('fx-original', `fx-original-${name}`);
      node.style.width = `${spec.width}px`; node.style.height = `${spec.height}px`;
      const sheet = document.createElement('span'); sheet.className = 'original-effect-sheet';
      sheet.style.backgroundImage = `url("${url}")`;
      sheet.style.setProperty('--frame-height', `${spec.height}px`);
      sheet.style.setProperty('--sheet-frames', spec.frames);
      if (spec.rotate) sheet.style.setProperty('--sheet-rotation', `rotate(${spec.rotate}deg)`);
      node.appendChild(sheet);
    };
    image.src = url;
  }
  function scheduleFxCleanup(callback, delay) {
    let timer = 0;
    timer = setTimeout(() => { if (timer) fxCleanupTimers.delete(timer); callback(); }, Math.max(0, delay));
    fxCleanupTimers.add(timer); return timer;
  }
  function clearFxEffects() {
    for (const timer of fxCleanupTimers) clearTimeout(timer);
    fxCleanupTimers.clear();
    for (const node of fxLiveNodes) node.remove();
    fxLiveNodes.clear(); fxSpawnTimes.length = 0;
    els.stage?.classList?.remove('damage-impact','quake-stage','shake-stage','impact-super','impact-critical');
    els.stage?.style?.removeProperty?.('--impact-origin');
    els.effectLayer?.querySelectorAll?.('.fx-move-phase').forEach(node => node.remove());
  }
  function emitFx(name, x, y, dx = 0, dy = 0, duration = 560, delay = 0, options = null) {
    if (!els.effectLayer || state.fastForward) return null;
    options ||= {};
    duration = Math.max(60, Math.min(1200, safeNum(duration, 560)));
    delay = Math.max(0, Math.min(1200, safeNum(delay)));
    const now = Date.now();
    while (fxSpawnTimes.length && now - fxSpawnTimes[0] > 1000) fxSpawnTimes.shift();
    if (fxSpawnTimes.length >= FX_RATE_LIMIT) return null;
    while (fxLiveNodes.size >= FX_NODE_LIMIT) {
      const oldest = fxLiveNodes.values().next().value;
      if (!oldest) break;
      oldest.remove(); fxLiveNodes.delete(oldest);
    }
    fxSpawnTimes.push(now);
    const node = document.createElement('i'); node.className = `fx fx-${name}`;
    const speed = Math.max(.25, safeNum(state.animationSpeed, 1));
    attachOriginalSprite(node, name);
    node.style.left = `${x * 100}%`; node.style.top = `${y * 100}%`;
    node.style.setProperty('--dx', `${dx}px`); node.style.setProperty('--dy', `${dy}px`);
    if (options.color) node.style.setProperty('--fx-color', options.color);
    if (options.scale) node.style.setProperty('--phase-scale', String(options.scale));
    if (options.phase) node.dataset.phase = options.phase;
    if (options.trajectory) node.dataset.trajectory = String(options.trajectory).replace(/[^a-z0-9-]/gi, '');
    if (options.critical) node.classList.add('critical');
    if (options.reduced) node.classList.add('still');
    node.style.animationDelay = `${delay / speed}ms`;
    node.style.animationDuration = `${duration / speed}ms`;
    els.effectLayer.appendChild(node); fxLiveNodes.add(node);
    scheduleFxCleanup(() => { node.remove(); fxLiveNodes.delete(node); }, (duration + delay) / speed + 150);
    return node;
  }
  function emitMoveChoreography(profile, from, target, allowImpact, critical = false) {
    const phases = profile?.choreography?.phases;
    if (!Array.isArray(phases) || !from || !target) return;
    const travelPoint = pointAlong(from, target, .48);
    const vector = arenaVector(from, target, .76);
    const get = name => phases.find(phase => phase.phase === name);
    const prepare = get('prepare'), travel = get('travel'), impact = get('impact'), settle = get('settle');
    const emitPhase = (phase, point, delay, count, phaseCritical = false) => {
      if (!phase || count < 1) return;
      for (let index = 0; index < count; index++) {
        const t = count === 1 ? 0 : (index - (count - 1) / 2) * .035;
        const dx = phase.phase === 'travel' ? vector.dx * (index % 2 ? .88 : 1) : (index - (count - 1) / 2) * 6;
        const dy = phase.phase === 'travel' ? vector.dy * (index % 2 ? .88 : 1) : -Math.abs(index - (count - 1) / 2) * 4;
        const x = point.x + (phase.phase === 'travel' ? t : 0), y = point.y + (phase.phase === 'travel' ? t * .3 : 0);
        emitFx('move-phase', x, y, dx, dy, phase.duration, delay, {
          color:phase.color, phase:phase.phase, trajectory:profile.choreography.trajectory,
          critical:phaseCritical, scale:phaseCritical ? 1.35 : 1,
          reduced:state.reducedEffects
        });
      }
    };
    const prepDelay = 0, travelDelay = Math.max(65, prepare.duration * .55), impactDelay = travelDelay + Math.max(85, travel.duration * .54);
    const settleDelay = impactDelay + Math.max(75, (impact?.duration || 0) * .56);
    emitPhase(prepare, from, prepDelay, 1);
    emitPhase(travel, travelPoint, travelDelay, Math.min(3, Math.max(1, Math.ceil(travel.particles / 5))));
    if (allowImpact) emitPhase(impact, target, impactDelay, Math.min(5, Math.max(1, Math.ceil(impact.particles / 3))), critical);
    emitPhase(settle, allowImpact ? target : from, allowImpact ? settleDelay : impactDelay, 1, false);
  }
  function showMoveBanner(parts) {
    const move = canonicalMove(parts?.[3]); if (!move || !els.effectLayer) return;
    const type = typeName(move.type), typeKey = String(move.type || 'normal').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const duration = (state.reducedEffects ? 300 : 620) / Math.max(1, safeNum(state.animationSpeed, 1));
    const banner = document.createElement('div'); banner.className = `battle-move-banner type-${typeKey}`;
    banner.dataset.type = typeKey; banner.setAttribute('aria-hidden', 'true');
    banner.style.setProperty('--banner-duration', `${duration}ms`);
    const name = document.createElement('strong'); name.textContent = move.name || parts[3];
    const typeLabel = document.createElement('small'); typeLabel.textContent = type;
    banner.append(name, typeLabel); els.effectLayer.appendChild(banner);
    scheduleFxCleanup(() => banner.remove(), duration + 100);
  }
  function clearBattleCinematic() {
    clearTimeout(state.cinematicTimer); state.cinematicTimer = 0;
    state.cinematicNode?.remove(); state.cinematicNode = null;
  }
  function stopImportantBattlePresentation(){
    window.KantoImportantBattle?.stopAll?.(els.stage);
    state.importantBattleController=null;state.importantBattleId='';
  }
  function updateImportantBattle(snapshot){
    const quiet=state.skipImportantBattleUpdate;state.skipImportantBattleUpdate=false;
    if(!snapshot?.id||state.importantBattleId!==String(snapshot.id)||!window.KantoImportantBattle?.update)return;
    window.KantoImportantBattle.update(els.stage,snapshot,{speed:state.animationSpeed,reduced:state.reducedEffects,playerSide:'p1',quiet});
  }
  function playerTrainerPresentation(){
    const name=String(state.world?.训练家?.姓名||state.world?.训练家?.name||'').trim();
    const trainers=state.presentation?.trainers||[];
    const match=trainers.find(trainer=>[trainer?.name,trainer?.id,...(trainer?.aliases||[])].some(label=>String(label||'').trim()===name));
    return {side:'p1',...(match?.art||match?.image?{art:match.art||match.image}:{})};
  }
  function showCinematicCard({ kind = 'moment', title = '', eyebrow = '', detail = '', accent = '#638770', portrait = '', badge = '', theme = '', themeDuration = 0, duration = 820, skippable = false } = {}) {
    clearBattleCinematic();
    const card = document.createElement('div'); card.className = `battle-cinematic battle-cinematic-${kind}${state.reducedEffects ? ' reduced' : ''}`;
    if (theme) card.classList.add(`theme-${String(theme).replace(/[^a-z0-9-]/gi, '')}`);
    card.style.setProperty('--cinematic-accent', accent); card.setAttribute('role', 'status');
    const rule = document.createElement('i'); rule.className = 'battle-cinematic-rule';
    if (portrait) {
      const image = document.createElement('img'); image.className = 'battle-cinematic-portrait'; image.alt = '';
      image.src = localResourceUrl(portrait); image.onerror = () => { image.hidden = true; }; card.appendChild(image);
    }
    const copy = document.createElement('div'); copy.className = 'battle-cinematic-copy';
    const eyebrowLabel = document.createElement('small'); eyebrowLabel.textContent = eyebrow || (kind === 'intro' ? '对战开幕' : '战况变化');
    const heading = document.createElement('strong'); heading.textContent = title;
    copy.append(eyebrowLabel, heading);
    if (detail) { const text = document.createElement('span'); text.textContent = detail; copy.appendChild(text); }
    if (badge) { const medal = document.createElement('b'); medal.className = 'battle-cinematic-badge'; medal.textContent = `目标 · ${badge}`; copy.appendChild(medal); }
    card.append(rule, copy);
    if (skippable) {
      const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'battle-cinematic-skip'; skip.textContent = '跳过';
      skip.addEventListener('click', clearBattleCinematic); card.appendChild(skip);
    }
    els.stage.appendChild(card); state.cinematicNode = card;
    const scaledDuration = Math.max(240, (themeDuration || duration) / Math.max(1, safeNum(state.animationSpeed, 1)));
    state.cinematicTimer = setTimeout(clearBattleCinematic, scaledDuration);
    return card;
  }
  function showBattleEntrance(snapshot = state.battle) {
    const battleId = String(snapshot?.id || ''); if (!battleId) return;
    const isNewBattle=state.cinematicBattleId!==battleId;
    const theme = state.presentation?.battle;
    if(!isNewBattle&&state.importantBattleId===battleId)return;
    if(isNewBattle){state.cinematicBattleId=battleId;stopImportantBattlePresentation();}
    let seen = false;
    try { seen = window.sessionStorage?.getItem(`kanto-battle-intro:${battleId}`) === 'shown'; } catch { /* Storage may be disabled in embedded views. */ }
    if(isNewBattle&&!seen)state.camera?.entry();
    if(theme?.important&&window.KantoImportantBattle?.enter){
      try{
        const controller=window.KantoImportantBattle.enter(els.stage,state.presentation,{assetHref:localResourceUrl,speed:state.animationSpeed,reduced:state.reducedEffects,playerSide:playerTrainerPresentation(),opponentUid:state.presentation?.scene?.npcId,snapshot,replay:!seen});
        if(controller){state.importantBattleController=controller;state.importantBattleId=battleId;if(!seen)try{window.sessionStorage?.setItem(`kanto-battle-intro:${battleId}`,'shown');}catch{/* Storage may be unavailable in the embedded view. */}return;}
      }catch{/* Keep the existing intro card as a fallback if the standalone layer cannot mount. */}
    }
    if (!isNewBattle || seen) return;
    try { window.sessionStorage?.setItem(`kanto-battle-intro:${battleId}`, 'shown'); } catch { /* In-memory guard prevents repeats during this view. */ }
    if (theme?.important) {
      showCinematicCard({ kind:'intro', title:theme.opponent || theme.title, eyebrow:theme.title || '对战开幕', detail:theme.line, accent:theme.accent, portrait:theme.portrait, badge:theme.badge, theme:theme.key, themeDuration:state.reducedEffects ? 620 : theme.duration, duration:state.reducedEffects ? 620 : 1880, skippable:true });
      return;
    }
    if (!state.reducedEffects && els.effectLayer) {
      const curtain = document.createElement('div'); curtain.className = 'fx-battle-intro'; curtain.setAttribute('aria-hidden', 'true');
      els.effectLayer.appendChild(curtain); scheduleFxCleanup(() => curtain.remove(), 520 / Math.max(1, safeNum(state.animationSpeed, 1)) + 100);
    }
  }
  function showBattleMoment(key, title, detail, accent = '#e4ad4d') {
    if (!key || state.cinematicMoments.has(key)) return;
    state.cinematicMoments.add(key);
    showCinematicCard({ kind:'moment', title, detail, accent, duration:state.reducedEffects ? 420 : 880, skippable:true });
  }
  function markLowHpMoment(side, line) {
    const values = String(line || '').split('/'), hp = parseFloat(values[0]), max = parseFloat(values[1]);
    if (!Number.isFinite(hp) || !Number.isFinite(max) || max <= 0 || hp <= 0 || hp / max > .25) return;
    const oldText = (side === 'player' ? els.playerHpText : els.foeHpText).textContent.split('/');
    const oldHp = parseFloat(oldText[0]), oldMax = parseFloat(oldText[1]);
    if (!Number.isFinite(oldHp) || !Number.isFinite(oldMax) || oldMax <= 0 || oldHp / oldMax <= .25) return;
    const name = side === 'player' ? els.playerName.textContent : els.foeName.textContent;
    showBattleMoment(`low-hp-${side}`, `${name}体力告急`, `HP ${hp} / ${max}`, side === 'player' ? '#cf654f' : '#b14c49');
  }
  function markLastPokemonMoment(side, snapshot) {
    const index = side === 'player' ? 0 : 1, previous = state.battle?.sides?.[index]?.team || [], current = snapshot?.sides?.[index]?.team || [];
    const alive = team => team.filter(mon => !mon.fainted && safeNum(mon.hp) > 0).length;
    if (alive(previous) > 1 && alive(current) === 1) {
      const last = activeMon(current);
      showBattleMoment(`last-mon-${side}`, `${side === 'player' ? '最后一只伙伴' : '对手的最后一只宝可梦'}`, last?.name || '', side === 'player' ? '#668fc0' : '#bd7951');
    }
  }
  function markBattleOutcome(line, snapshot) {
    const event = protocol(line)[1];
    if (!snapshot?.ended || !['win', 'tie'].includes(event)) return;
    const winner=winnerSideIndex(snapshot),title=event==='tie'?'本场平局':winner===0?'本场胜利':winner===1?'本场失利':'本场结束';
    state.camera?.finish();
    showBattleMoment(`result-${winner===0?'p1':winner===1?'p2':event}`, title, winner===0?'对手已无力继续战斗。':winner===1?'队伍需要恢复后再战。':'战斗已经结束。', winner===0?'#62a477':'#bd6756');
  }
  function impactCamera(kind, side) {
    if (state.reducedEffects || !['super', 'critical'].includes(kind)) return;
    if(state.camera){state.camera.impact(side,{critical:kind==='critical'});return;}
    const cls = `impact-${kind}`; els.stage.classList.remove('impact-super', 'impact-critical'); void els.stage.offsetWidth;
    els.stage.style.setProperty('--impact-origin', side === 'foe' ? '72% 34%' : '30% 68%');
    els.stage.classList.add(cls);
    scheduleFxCleanup(() => { els.stage.classList.remove(cls); els.stage.style.removeProperty('--impact-origin'); }, (kind === 'critical' ? 430 : 330) / Math.max(1, safeNum(state.animationSpeed, 1)));
  }
  async function animateMove(parts, allowImpact = true, outcome = null) {
    const move = canonicalMove(parts[3]) || { id: parts[3], type: 'Normal', category: 'Physical', power: 40 }, attacker = actorSide(parts[2]), target = actorSide(parts[4]) || (attacker === 'player' ? 'foe' : 'player');
    if (!attacker) return;
    const source = spriteFor(attacker), rawKey = String(move.id || move.english || parts[3]).toLowerCase().replace(/[^a-z0-9]/g, '');
    const selfTarget = actorSide(parts[4]) === attacker || ['swordsdance', 'calmmind', 'agility', 'barrier', 'focusenergy', 'meditate', 'withdraw', 'defensecurl', 'bellydrum', 'rest', 'synthesis', 'moonlight'].includes(rawKey) || String(move.target || '').toLowerCase() === 'self';
    const from = spritePoint(attacker, .52, .48), intendedHit = selfTarget ? from : spritePoint(target, .5, .53);
    const hit = allowImpact ? intendedHit : pointAlong(from, intendedHit, .82), vector = arenaVector(from, intendedHit, .84);
    const profile = globalThis.KantoBattleFx?.resolve(move, selfTarget || actorSide(parts[4]) === attacker) || { type: move.type || 'Normal', mode: 'projectile', cue: null };
    state.camera?.attack(attacker,selfTarget?attacker:target,{power:move.power||move.basePower,self:selfTarget});
    const physical = String(move.category || '').toLowerCase() === 'physical';
    const lunge = () => {
      if (!physical || state.reducedEffects) return;
      source.classList.remove('lunge-forward', 'lunge-back'); void source.offsetWidth;
      source.style.setProperty('--lunge-x', `${vector.dx * .45}px`); source.style.setProperty('--lunge-y', `${vector.dy * .45}px`);
      source.classList.add('lunge-vector');
    };
    const cuePrep = ({'hypnosis-rings':'hypnosis-windup','dream-drain':'dream-eater-windup',afterimage:'double-team-windup','substitute-pop':'substitute-windup','phase-blink':'teleport-windup','morph-shift':'transform-windup','metronome-orbit':'metronome-orbit'})[profile.cue];
    const prepCue = cuePrep || ({hypnosis:'hypnosis-windup', dreameater:'dream-eater-windup', doubleteam:'double-team-windup', substitute:'substitute-windup', teleport:'teleport-windup', transform:'transform-windup', metronome:'metronome-orbit'})[rawKey];
    const critical = Boolean(outcome && typeof outcome === 'object' && outcome.critical);
    if (state.reducedEffects) {
      const phase = allowImpact ? profile.choreography?.phases?.find(item => item.phase === 'impact') : profile.choreography?.phases?.find(item => item.phase === 'prepare');
      const point = allowImpact ? hit : from;
      if (phase) emitFx('move-phase', point.x, point.y, 0, 0, 120, 0, { color:phase.color, phase:allowImpact ? 'impact' : 'prepare', trajectory:profile.choreography.trajectory, critical:allowImpact && critical, scale:allowImpact && critical ? 1.2 : 1, reduced:true });
      else if (prepCue) emitFx('flash', from.x, from.y, 0, 0, 140);
      await wait(120); return;
    }
    emitMoveChoreography(profile, from, intendedHit, allowImpact, critical);
    if (prepCue) emitFx(prepCue, from.x, from.y, 0, -12, prepCue === 'metronome-orbit' ? 620 : 380);
    if(move.category!=='Status'&&safeNum(move.power)>0){
      const element=String(move.type||'normal').toLowerCase();
      emitFx('focus-'+element,from.x,from.y,0,0,safeNum(move.power)>=90?480:280);
      if(safeNum(move.power)>=90){emitFx('charge-orbit',from.x,from.y,0,0,410);for(let n=0;n<3;n++)emitFx('charge-mote',from.x+Math.cos(n*2.1)*.065,from.y+Math.sin(n*2.1)*.07,-Math.cos(n*2.1)*30,-Math.sin(n*2.1)*24,320,n*35);}
    }
    lunge();
    if (rawKey === 'swordsdance') {
      for (let i = 0; i < 3; i++) emitFx('sword-glint', from.x, from.y, Math.cos(i * 2.09) * 54, Math.sin(i * 2.09) * 42, 540, i * 100);
      emitFx('ability-aura', from.x, from.y, 0, 0, 420, 80);
    } else if (rawKey === 'growl') {
      for (let i = 0; i < 4; i++) { const p = pointAlong(from, hit, .16 + i * .17); emitFx('sound-wave', p.x, p.y, vector.dx * .1, 0, 470, i * 70); }
    } else if (rawKey === 'tailwhip') {
      for (let i = 0; i < 3; i++) emitFx('tail-whip', from.x, from.y + (i - 1) * .035, vector.dx * .5, vector.dy * .5, 400, i * 65);
    } else if (rawKey === 'sleeppowder') {
      for (let i = 0; i < 12; i++) { const p = pointAlong(from, hit, .12 + i * .064, (Math.random() - .5) * .08); emitFx('sleep-spore', p.x, p.y, vector.dx * .12, vector.dy * .12 - 12, 650, i * 32); }
    } else if (rawKey === 'leechseed') {
      emitFx('seed-vine', from.x, from.y, vector.dx * .16, vector.dy * .16, 430);
    } else if (['hypnosis','dreameater','doubleteam','substitute','teleport','transform','metronome'].includes(rawKey)) {
      // Target-side effects wait for the corresponding protocol state/damage event.
    } else if (move.category === 'Status' || !safeNum(move.power)) {
      // A status animation at the target reads as a confirmed effect. Keep failed,
      // protected and missed actions on the actor until protocol confirms state.
      if (allowImpact) emitFx('status-pulse', selfTarget ? from.x : hit.x, selfTarget ? from.y : hit.y, 0, 0, 420);
      else emitFx('charge-glow', from.x, from.y, 0, 0, 300);
    } else if (profile.cue === 'fire-vortex' || rawKey === 'firespin') {
      const mid = pointAlong(from, hit, .56);
      emitFx('fire-vortex', mid.x, mid.y, vector.dx * .08, vector.dy * .08, 760);
      emitFx('fire-stream', from.x, from.y, vector.dx * .82, vector.dy * .82, 540, 100);
      if (allowImpact) emitFx('fire-ring', hit.x, hit.y, 0, 0, 500, 340);
    } else if (rawKey === 'flamethrower' || rawKey === 'fireblast' || rawKey === 'ember') {
      emitFx('fire-charge', from.x, from.y, 0, 0, rawKey === 'fireblast' ? 300 : 210);
      const pieces = rawKey === 'ember' ? 5 : 8;
      for (let i = 0; i < pieces; i++) { const p = pointAlong(from, hit, i / pieces, Math.sin(i * .75) * .025); emitFx('fire-stream', p.x, p.y, vector.dx / pieces * 1.3, vector.dy / pieces * 1.3, 500, 75 + i * 24); }
      if (rawKey === 'flamethrower') for (let i = 0; i < 3; i++) { const p = pointAlong(from, hit, .38 + i * .19, (i - 1) * .025); emitFx('ember', p.x, p.y, vector.dx * .08, -12, 350, 170 + i * 55); }
      if (rawKey === 'fireblast' && allowImpact) { emitFx('fire-sigil', hit.x, hit.y, 0, 0, 520, 240); emitFx('fire-ring', hit.x, hit.y, 0, 0, 500, 340); emitFx('fire-ring', hit.x, hit.y, 0, 0, 500, 430); }
      else if (rawKey === 'ember' && allowImpact) for (let i = 0; i < 4; i++) emitFx('ember', hit.x + (i - 1.5) * .025, hit.y - .04, 0, 10, 450, i * 45);
    } else if (rawKey === 'surf') {
      const leftward = attacker === 'foe', x = leftward ? .94 : .06, dx = (leftward ? -1 : 1) * els.stage.clientWidth * .88;
      const reach = allowImpact ? 1 : .76;
      emitFx('surf-wave', x, .69, dx * reach, -12, 790); emitFx('surf-wave', leftward ? .98 : .02, .76, dx * reach * .9, -6, 790, 90);
    } else if (rawKey === 'watergun' || rawKey === 'hydropump') {
      emitFx('water-charge', from.x, from.y, 0, 0, rawKey === 'hydropump' ? 290 : 180);
      emitFx('water-jet', from.x, from.y, vector.dx * (allowImpact ? 1 : .82), vector.dy * (allowImpact ? 1 : .82), rawKey === 'hydropump' ? 650 : 480, rawKey === 'hydropump' ? 120 : 55);
      if (allowImpact) { emitFx('water-impact', hit.x, hit.y, 0, 0, 440, rawKey === 'hydropump' ? 470 : 160); emitFx('ripple', hit.x, hit.y, 0, 0, 380, rawKey === 'hydropump' ? 500 : 190); for (let i = 0; i < 7; i++) emitFx('drop', hit.x, hit.y, (Math.random() - .5) * 60, (Math.random() - .5) * 45, 430, 190 + i * 25); }
    } else if (['thunderbolt','thunder','thundershock','zapcannon'].includes(rawKey)) {
      if (rawKey === 'thundershock') {
        emitFx('electric-arc', from.x, from.y, vector.dx * .62, vector.dy * .62, 420);
      } else if (rawKey === 'zapcannon') {
        emitFx('electric-charge', from.x, from.y, 0, 0, 350);
        emitFx('electric-arc', from.x, from.y, vector.dx * (allowImpact ? 1 : .72), vector.dy * (allowImpact ? 1 : .72), 560, 120);
      } else {
        if (rawKey === 'thunder') emitFx('storm-flash', .5, .08, 0, 0, 210);
        {
          const strike = allowImpact ? intendedHit : pointAlong(from, intendedHit, .7, (Math.random() - .5) * .22);
          emitFx('electric-arc', from.x, from.y, (strike.x - from.x) * els.stage.clientWidth * .36, (strike.y - from.y) * els.stage.clientHeight * .36, 250);
          emitFx(rawKey === 'thunder' ? 'storm-bolt' : 'lightning-bolt', strike.x + (Math.random() - .5) * (rawKey === 'thunder' ? .1 : .08), .02, 0, Math.max(0, strike.y * els.stage.clientHeight - 50), rawKey === 'thunder' ? 360 : 270, 85);
        }
      }
      if (allowImpact) { emitFx('electric-ring', hit.x, hit.y, 0, 0, 360, 130); for (let i = 0; i < 3; i++) emitFx('activate-spark', hit.x + (i - 1) * .035, hit.y - .025, (i - 1) * 12, -9, 250, 170 + i * 35); }
    } else if (['vinewhip', 'petaldance', 'absorb', 'megadrain'].includes(rawKey)) {
      if (rawKey === 'petaldance') {
        for (let i = 0; i < 9; i++) { const p = pointAlong(from, hit, i / 9, Math.sin(i * .9) * .045); emitFx('razor-leaf', p.x, p.y, vector.dx * .08, vector.dy * .08 - 8, 530, i * 28); }
      } else if (rawKey === 'leechseed') {
        for (let i = 0; i < 5; i++) emitFx('seed-vine', hit.x + (i - 2) * .035, hit.y + .02, 0, 0, 520, i * 45);
      } else {
        emitFx('vine-whip', from.x, from.y, vector.dx * (allowImpact ? 1 : .82), vector.dy * (allowImpact ? 1 : .82), 490);
        if (rawKey === 'megadrain' || rawKey === 'absorb') { if (allowImpact) { emitFx('heal-sparkle', hit.x, hit.y, vector.dx * -.12, -18, 520, 300); emitFx('seed-vine', hit.x, hit.y, vector.dx * -.15, vector.dy * -.12, 520, 150); } }
        else if (allowImpact) emitFx('vine-whip', from.x, from.y + .025, vector.dx * .92, vector.dy * .92, 490, 90);
      }
    } else if (rawKey === 'razorleaf') {
      for (let i = 0; i < 8; i++) { const p = pointAlong(from, hit, i / 8, (i - 3.5) * .018); emitFx('razor-leaf', p.x, p.y, vector.dx / 8 * 1.5, vector.dy / 8 * 1.5, 520, i * 32); }
      if (allowImpact) { emitFx('leaf-impact', hit.x, hit.y, 0, 0, 360, 280); emitFx('impact-ring', hit.x, hit.y, 0, 0, 330, 310); }
    } else if (rawKey === 'magicalleaf' || rawKey === 'leafblade') {
      if (rawKey === 'leafblade') {
        emitFx('leaf-blade', from.x, from.y, vector.dx * .9, vector.dy * .9, 420);
        if (allowImpact) emitFx('leaf-impact', hit.x, hit.y, 0, 0, 360, 180);
      } else {
        for (let i = 0; i < 5; i++) { const p = pointAlong(from, hit, .2 + i * .12, Math.sin(i * 1.2) * .07); emitFx('homing-leaf', p.x, p.y, (hit.x - p.x) * els.stage.clientWidth, (hit.y - p.y) * els.stage.clientHeight, 470, i * 48); }
        if (allowImpact) emitFx('leaf-impact', hit.x, hit.y, 0, 0, 360, 260);
      }
    } else if (rawKey === 'icebeam' || rawKey === 'aurorabeam' || rawKey === 'blizzard' || rawKey === 'icywind' || rawKey === 'powdersnow') {
      if (rawKey === 'blizzard') {
        emitFx('ice-blizzard', from.x, from.y, vector.dx, vector.dy, 680);
        for (let i = 0; i < 13; i++) { const p = pointAlong(from, hit, .16 + i * .055, (Math.random() - .5) * .18); emitFx('ice-crystal', p.x, p.y, vector.dx * .1, 16 + Math.random() * 22, 560, i * 22); }
        if (allowImpact) emitFx('ice-impact', hit.x, hit.y, 0, 0, 500, 180);
      } else if (rawKey === 'icywind' || rawKey === 'powdersnow') {
        const count = rawKey === 'icywind' ? 9 : 7;
        for (let i = 0; i < count; i++) { const p = pointAlong(from, hit, .16 + i * .07, (i % 2 ? 1 : -1) * .08); emitFx('ice-flurry', p.x, p.y, vector.dx / 7, vector.dy / 7 + (i % 2 ? 9 : -9), 440, i * 30); }
        if (allowImpact) emitFx('ice-impact', hit.x, hit.y, 0, 0, 440, 160);
      } else if (rawKey === 'aurorabeam') {
        emitFx('aurora-beam', from.x, from.y, vector.dx, vector.dy, 600);
        for (let i = 0; i < 5; i++) { const p = pointAlong(from, hit, .25 + i * .12, Math.sin(i * 1.25) * .035); emitFx('ice-crystal', p.x, p.y, vector.dx * .04, vector.dy * .04, 430, 100 + i * 38); }
        if (allowImpact) emitFx('ice-impact', hit.x, hit.y, 0, 0, 460, 300);
      } else {
        emitFx('frost-beam', from.x, from.y, vector.dx * (allowImpact ? 1 : .82), vector.dy * (allowImpact ? 1 : .82), 620);
        if (allowImpact) { emitFx('ice-impact', hit.x, hit.y, 0, 0, 460, 330); for (let i = 0; i < 9; i++) emitFx('ice-crystal', hit.x, hit.y, (Math.random() - .5) * 58, (Math.random() - .5) * 52, 540, 350 + i * 22); }
      }
    } else if (rawKey === 'psychic' || rawKey === 'psybeam' || rawKey === 'confusion' || rawKey === 'extrasensory') {
      const windup = pointAlong(from, hit, .22);
      emitFx('mind-charge', windup.x, windup.y, vector.dx * .04, vector.dy * .04, 360);
      if (allowImpact) {
        emitFx('mind-crush', hit.x, hit.y, 0, 0, rawKey === 'psychic' ? 520 : 400, 250);
        const rings = rawKey === 'psychic' ? 5 : rawKey === 'extrasensory' ? 4 : 3;
        for (let i = 0; i < rings; i++) emitFx('mind-ripple', hit.x, hit.y, 0, 0, 600, 250 + i * 75);
        emitFx(rawKey === 'confusion' ? 'mind-orbit' : rawKey === 'extrasensory' ? 'sense-flare' : 'mind-glint', hit.x, hit.y, 0, 0, 470, 390);
      }
    } else if (rawKey === 'shadowball' || rawKey === 'nightshade' || rawKey === 'lick') {
      emitFx(rawKey === 'lick' ? 'ghost-claw' : 'shadow-orb', from.x, from.y, vector.dx, vector.dy, 610);
      emitFx('shadow-trail', from.x, from.y, vector.dx * .82, vector.dy * .82, 570, 80);
    } else if (['earthquake', 'dig', 'bonemerang', 'mudslap', 'rockthrow', 'rocktomb', 'mudshot'].includes(rawKey)) {
      if (rawKey === 'earthquake') {
        const serial=state.presentationSerial;
        for (let i = 0; i < 3; i++) { scheduleFxCleanup(() => { if (!state.reducedEffects && serial===state.presentationSerial) { els.stage.classList.remove('quake-stage'); void els.stage.offsetWidth; els.stage.classList.add('quake-stage'); } }, i * 135 / state.animationSpeed); }
        for (let i = 0; i < 9; i++) emitFx('quake-crack', .08 + i * .105, .76 + (i % 2) * .03, (Math.random() - .5) * 5, -4, 400, i * 23);
      } else if (rawKey === 'rockthrow' || rawKey === 'rocktomb') {
        const count = rawKey === 'rockthrow' ? 2 : 4;
        for (let i = 0; i < count; i++) { const p = pointAlong(from, hit, .22 + i * .14, (i - (count - 1) / 2) * .055); emitFx('stone-projectile', p.x, p.y - .08, (hit.x - p.x) * els.stage.clientWidth, (hit.y - p.y) * els.stage.clientHeight + 12, 440, i * 55); }
        if (allowImpact) emitFx('rock-impact', hit.x, hit.y, 0, 0, 420, 230);
      } else if (rawKey === 'mudshot' || rawKey === 'mudslap') {
        emitFx('mud-sling', from.x, from.y, vector.dx * (allowImpact ? .9 : .72), vector.dy * (allowImpact ? .9 : .72), 470);
        if (allowImpact) for (let i = 0; i < 5; i++) emitFx('mud-splatter', hit.x, hit.y, (Math.random() - .5) * 35, (Math.random() - .5) * 28, 330, i * 24);
      } else {
        emitFx(rawKey === 'dig' ? 'ground-bore' : 'quake-crack', from.x, .76, vector.dx * (allowImpact ? 1 : .78), -10, 460);
        if (allowImpact) { emitFx('ground-burst', hit.x, hit.y, 0, 0, 430, 130); for (let i = 0; i < 5; i++) emitFx('ground-chip', hit.x, hit.y, (Math.random() - .5) * 55, -18 - Math.random() * 26, 380, i * 28); }
      }
    } else if (rawKey === 'hyperbeam') {
      emitFx('hyperbeam-charge', from.x, from.y, 0, 0, 300);
      emitFx('sunbeam', from.x, from.y, vector.dx, vector.dy, 660, 170);
      if (allowImpact) emitFx('hyperbeam-impact', hit.x, hit.y, 0, 0, 500, 560);
    } else if (rawKey === 'solarbeam') {
      emitFx('solar-charge', from.x, from.y, vector.dx * .12, vector.dy * .12, 460);
      emitFx('sunbeam', from.x, from.y, vector.dx, vector.dy, 660, 250);
      if (allowImpact) emitFx('solar-impact', hit.x, hit.y, 0, 0, 480, 620);
    } else if (rawKey === 'rockslide') {
      for (let i = 0; i < 4; i++) {
        const p = pointAlong(from, hit, .3 + i * .15, (i - 1.5) * .055);
        emitFx('falling-rock', p.x, .08 + i * .035, (hit.x - p.x) * els.stage.clientWidth, (hit.y - p.y) * els.stage.clientHeight, 520, i * 95);
      }
      if (allowImpact) { emitFx('rock-impact', hit.x, hit.y, 0, 0, 460, 430); emitFx('impact-ring', hit.x, hit.y, 0, 0, 420, 490); }
    } else if (rawKey === 'dragonrage') {
      emitFx('dragon-orb', from.x, from.y, vector.dx, vector.dy, 580);
      if (allowImpact) emitFx('dragon-impact', hit.x, hit.y, 0, 0, 460, 430);
    } else if (['tackle', 'quickattack', 'scratch', 'slash'].includes(rawKey)) {
      if (!allowImpact) emitFx('speed-streak', from.x, from.y, vector.dx * .72, vector.dy * .72, 300);
      else if (rawKey === 'slash' || rawKey === 'scratch') { for (let i = 0; i < (rawKey === 'slash' ? 3 : 2); i++) emitFx('claw-mark', hit.x, hit.y + (i - 1) * .05, 0, 0, 300, i * 75); emitFx('impact-ring', hit.x, hit.y, 0, 0, 360, 90); }
      else if (rawKey === 'quickattack') emitFx('speed-streak', hit.x, hit.y, 0, 0, 300);
      else { emitFx('impact-ring', hit.x, hit.y, 0, 0, 420); emitFx('speed-streak', from.x, from.y, vector.dx * .56, vector.dy * .56, 260, 70); }
    } else if (allowImpact) {
      if (profile.mode === 'buff' || profile.mode === 'healing') {
        emitFx(profile.mode === 'healing' ? 'heal-sparkle' : 'ability-aura', selfTarget ? from.x : hit.x, selfTarget ? from.y : hit.y, 0, -18, 480);
      } else if (profile.mode === 'debuff') emitFx('status-pulse', hit.x, hit.y, vector.dx * .12, 0, 460);
      else if (profile.mode === 'field' || profile.mode === 'weather') emitFx('field-pulse', .5, .57, 0, 0, 520);
      else if (profile.mode === 'contact' || profile.mode === 'slash') emitFx(profile.mode === 'slash' ? 'claw-mark' : 'impact-ring', hit.x, hit.y, 0, 0, 400);
      else if (profile.mode === 'multi') for (let i = 0; i < 3; i++) emitFx('impact-ring', hit.x, hit.y, 0, 0, 300, i * 75);
      else if (profile.mode === 'beam') emitFx('beam-generic', from.x, from.y, vector.dx, vector.dy, 500);
      else emitFx('projectile-generic', from.x, from.y, vector.dx, vector.dy, 500);
    } else {
      emitFx('speed-streak', from.x, from.y, vector.dx * .65, vector.dy * .65, 340);
    }
    await wait(470); source.classList.remove('lunge-vector'); source.style.removeProperty('--lunge-x'); source.style.removeProperty('--lunge-y');
  }
  function burst(type, x, y) {
    const key = String(type || 'Normal').toLowerCase();
    const add = (kind, left, top, dx = 0, dy = 0, delay = 0) => {
      const node = document.createElement('i'); node.className = `fx fx-${kind}`; node.style.left = `${left * 100}%`; node.style.top = `${top * 100}%`;
      node.style.setProperty('--dx', `${dx}px`); node.style.setProperty('--dy', `${dy}px`); node.style.animationDelay = `${delay / state.animationSpeed}ms`; node.style.animationDuration = `${650 / state.animationSpeed}ms`; els.effectLayer.appendChild(node); scheduleFxCleanup(() => node.remove(), 950 / state.animationSpeed);
    };
    if (key === 'fire') { for (let i = 0; i < 7; i++) add('flame', x - .13 + i * .04, y + (Math.random() - .5) * .2, 34 + Math.random() * 25, (Math.random() - .5) * 36, i * 20); add('flare', x, y, 0, 0, 90); }
    else if (key === 'water') { add('ripple', x, y); add('ripple', x, y, 0, 0, 130); add('splash', x, y, 0, 0, 90); for (let i = 0; i < 7; i++) add('drop', x, y, (Math.random() - .5) * 92, -18 - Math.random() * 48, i * 20); }
    else if (key === 'electric') { for (let i = 0; i < 4; i++) add('arc', x - .1 + i * .07, y + (Math.random() - .5) * .2, 12 + Math.random() * 20, (Math.random() - .5) * 26, i * 24); add('flash', x, y); }
    else if (key === 'grass') { add('vine', x - .16, y + .08, 46, -10); add('vine', x - .12, y - .05, 38, 12, 80); for (let i = 0; i < 8; i++) add('leaf', x + (Math.random() - .5) * .25, y, (Math.random() - .5) * 78, -22 - Math.random() * 44, i * 22); }
    else if (key === 'psychic') { add('ring', x, y); add('ring', x, y, 0, 0, 150); add('ring', x, y, 0, 0, 300); for (let i = 0; i < 8; i++) add('spark', x, y, Math.cos(i * Math.PI / 4) * 48, Math.sin(i * Math.PI / 4) * 38, i * 20); }
    else if (key === 'ice') { for (let i = 0; i < 8; i++) add('shard', x, y, (Math.random() - .5) * 92, (Math.random() - .5) * 78, i * 20); add('ring', x, y); }
    else { for (let i = 0; i < 8; i++) add('impact', x, y, Math.cos(i * Math.PI / 4) * (30 + Math.random() * 18), Math.sin(i * Math.PI / 4) * (30 + Math.random() * 18), i * 12); }
    els.stage.classList.remove('shake-stage'); void els.stage.offsetWidth; els.stage.classList.add('shake-stage'); scheduleFxCleanup(() => els.stage.classList.remove('shake-stage'), 300 / state.animationSpeed);
  }
  function weatherName(value) { return weatherNames[String(value || 'none').toLowerCase()] || value || '无'; }
  function formatEvent(line) {
    const p = protocol(line), kind = p[1], actor = p[2] || '', value = p[3] || '';
    const actorName = actor.includes(':') ? actor.slice(actor.indexOf(':') + 1).trim() : actor;
    if (kind === 'move') return `${actorName || '宝可梦'}使出了${canonicalMove(value)?.name || value || '招式'}！`;
    if (kind === '-damage') return `${actorName || '宝可梦'}受到了伤害！`;
    if (kind === '-heal') {
      const item = String(p.slice(4).join('|').match(/\[from\]\s*item:\s*([^|\]]+)/i)?.[1] || '').trim();
      if (item) return `${actorName || '宝可梦'}借助${itemName(normalizeLookup(item))}恢复了体力。`;
      return `${actorName || '宝可梦'}恢复了体力。`;
    }
    if (kind === 'switch' || kind === 'drag') return `${speciesByEnglish(value)?.name || actorName || '宝可梦'}上场了！`;
    if (kind === 'faint') return `${actorName || '宝可梦'}倒下了！`;
    if (kind === '-status') return `${actorName || '宝可梦'}陷入了${statusNames[value] || value}状态。`;
    if (kind === '-curestatus' || kind === '-cureteam') return `${actorName || '宝可梦'}的状态恢复了。`;
    if (kind === '-boost' || kind === '-unboost') {
      const stat = ({atk:'攻击',def:'防御',spa:'特攻',spd:'特防',spe:'速度',accuracy:'命中率',evasion:'闪避率'})[value] || value;
      const amount = Math.abs(safeNum(p[4], 1)); return `${actorName || '宝可梦'}的${stat}${kind === '-boost' ? '提高' : '降低'}了 ${amount} 阶。`;
    }
    if (kind === 'win') return `${actor || '训练家'}赢得了对战！`;
    if(kind==='turn')return `第 ${Math.max(1,safeNum(actor,1))} 回合。请选择行动。`;
    if(['start','gametype','gen','tier','teamsize','poke','clearpoke','rule','player','upkeep','inactive','inactiveoff'].includes(kind))return '';
    if (kind === 'tie') return '对战以平局结束。';
    if (kind === '-weather') return String(actor).toLowerCase() === 'none' ? '天气恢复平静。' : `天气变为${weatherName(actor)}。`;
    if (kind === 'cant') {const reason=({slp:'正在睡觉',frz:'身体被冰封了',par:'因为麻痹无法动弹',flinch:'畏缩了',recharge:'需要恢复力气',nopp:'已经没有PP',truant:'正在偷懒',recoil:'受到了行动限制'})[value];return `${actorName || '宝可梦'}${reason||'无法行动'}。`;}
    if (kind === '-item') return `${actorName || '宝可梦'}获得了${itemName(normalizeLookup(value))}。`;
    if (kind === '-enditem') {
      const id = normalizeLookup(value), name = itemName(id);
      return /\[eat\]/i.test(line) ? `${actorName || '宝可梦'}吃掉了${name}。` : `${actorName || '宝可梦'}消耗了${name}。`;
    }
    if (kind === '-clearnegativeboost') return `${actorName || '宝可梦'}的能力下降被全部消除了。`;
    if (kind === '-sidestart' || kind === '-sideend') {const key=String(value).replace(/^move:\s*/i,'');return `${actorName||'这一侧'}的${canonicalMove(key)?.name||key}${kind==='-sideend'?'效果结束了':'开始生效'}。`;}
    if (kind === '-miss') return '招式没有命中。';
    if (kind === '-immune') return `${actorName || '宝可梦'}完全免疫了这次攻击！`;
    if (kind === '-supereffective') return '效果拔群！';
    if (kind === '-resisted') return '效果不太理想…';
    if (kind === '-crit') return '击中了要害！';
    if (kind === '-hitcount') return `连续命中 ${Math.max(1, safeNum(p[3], 1))} 次！`;
    if (kind === '-fail') return '招式没有产生效果。';
    if (kind === '-start' || kind === '-end') {
      const detail = String(value).replace(/^move:\s*/i, '').replace(/^ability:\s*/i, '特性：');
      const end = kind === '-end';
      if (/leech seed/i.test(value)) return `${actorName}的寄生种子${end ? '效果结束了' : '缠住了目标'}。`;
      if (/confusion/i.test(value)) return `${actorName}${end ? '从混乱中清醒了' : '陷入混乱了'}。`;
      if (/substitute/i.test(value)) return `${actorName}的替身${end ? '消失了' : '出现了'}！`;
      if (/protect/i.test(value)) return `${actorName}${end ? '的保护消失了' : '被保护起来了'}。`;
      const itemCure = line.match(/\[from\]\s*item:\s*([^|\]]+)/i)?.[1]?.trim();
      const moveEffect = canonicalMove(String(value).replace(/^move:\s*/i, '').trim())?.name;
      if (/^attract$/i.test(String(value).replace(/^move:\s*/i, '').trim())) return itemCure
        ? `${actorName}摆脱了迷人效果，${itemName(normalizeLookup(itemCure))}发挥了作用。`
        : `${actorName}${end ? '不再受到' : '被'}迷人效果影响。`;
      if (moveEffect) return `${actorName}${end ? '摆脱了' : '受到'}${moveEffect}效果。`;
      return `${actorName}${end ? '失去了' : '获得了'}${detail}效果。`;
    }
    if (kind === '-activate' || kind === '-singleturn') {
      const key = String(value).replace(/^(?:move|item):\s*/i, '').trim(), label = canonicalMove(key)?.name || itemName(normalizeLookup(key));
      const ability = String(value).match(/^ability:\s*(.+)$/i)?.[1];
      const shown = ability ? (state.dex?.abilityNames?.[normalizeLookup(ability)] || ability) : label;
      return `${actorName}${kind === '-singleturn' ? '准备使用' : '发动了'}${shown}！`;
    }
    if (kind === '-ability') return `${actorName}发动了特性「${state.dex?.abilityNames?.[normalizeLookup(value)] || value}」！`;
    if (kind === '-prepare') { const prepared = String(value).replace(/^move:\s*/i, '').trim(); return `${actorName}正在为${canonicalMove(prepared)?.name || prepared}蓄力！`; }
    if (kind === 'capture') return `精灵球摇晃了 ${safeNum(p[3])} 次。`;
    if (kind === 'run') return p[2] === 'success' ? '成功逃离了野生对战。' : p[2] === 'failed' ? '没能逃走！' : '';
    if (kind === 'message') return p.slice(2).join(' ').trim();
    if (kind === '-transform') return `${actorName}变身成了对手的样子！`;
    if (kind === '-mustrecharge') return `${actorName}需要蓄力休息一回合。`;
    if (kind === 'detailschange' || kind === '-formechange') return `${actorName}的形态发生了变化。`;
    return kind ? `战斗记录：${p.slice(1).filter(Boolean).join(' · ')}` : '';
  }
  function heldItemCue(line, previousItemEvent = '') {
    const p = protocol(line), kind = p[1], side = actorSide(p[2]);
    if (!side) return null;
    if (kind === '-heal') {
      const item = p.slice(4).join('|').match(/\[from\]\s*item:\s*([^|\]]+)/i)?.[1]?.trim() || '';
      if (/leftovers/i.test(item)) return { cue:'leftovers-glow', side };
      if (/shell bell/i.test(item)) return { cue:'shell-bell-drain', side, sourceSide:actorSide(p.slice(4).join('|').match(/\[of\]\s*([^|]+)/i)?.[1] || '') };
      if (/berry/i.test(item)) return { cue:'berry-heal-glow', side };
    }
    if (kind === '-enditem') {
      const id = normalizeLookup(p[3]);
      if (/\[eat\]/i.test(line)) return { cue:'berry-spark', side };
      if (id === 'whiteherb' || id === 'mentalherb') return { cue:'herb-consume-glow', side };
    }
    if (kind === '-clearnegativeboost') {
      const prior = protocol(previousItemEvent);
      if (prior[1] === '-enditem' && normalizeLookup(prior[3]) === 'whiteherb' && actorSide(prior[2]) === side) return { cue:'herb-cleanse', side };
    }
    return null;
  }
  function choiceBandLockMessage(line, snapshot) {
    const p = protocol(line);
    if (p[1] !== 'move') return null;
    const side = actorSide(p[2]); if (!side) return null;
    const team = snapshot?.sides?.[side === 'player' ? 0 : 1]?.team || [];
    const mon = team.find(entry => entry.active) || team.find(entry => entry.uid && entry.uid === snapshot?.sides?.[side === 'player' ? 0 : 1]?.team?.find(member => member.active)?.uid);
    if (String(mon?.heldItem || '').toLowerCase() !== 'choiceband' || !mon?.volatiles?.includes('choicelock')) return null;
    const rawMove = String(p[3] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const move = canonicalMove(p[3]);
    return { side, moveId:rawMove, text:`${mon.name || '宝可梦'}受专爱头带影响，招式锁定为${move?.name || p[3]}。` };
  }
  function heldTypeBoostCue(move, snapshot) {
    if (!move?.attacker) return null;
    const types = { charcoal:'fire', mysticwater:'water', miracleseed:'grass', magnet:'electric', nevermeltice:'ice', blackbelt:'fighting', poisonbarb:'poison', sharpbeak:'flying', twistedspoon:'psychic', spelltag:'ghost', dragonfang:'dragon', silverpowder:'bug', hardstone:'rock', softsand:'ground' };
    const team = snapshot?.sides?.[move.attacker === 'player' ? 0 : 1]?.team || [];
    const mon = team.find(entry => entry.active), item = String(mon?.heldItem || '').toLowerCase();
    if (!types[item] || types[item] !== String(move.type || '').toLowerCase()) return null;
    return { side:move.attacker, item, label:itemName(item), type:types[item] };
  }
  function applyHpEvent(line) {
    const p = protocol(line), kind = p[1]; if (!['-damage', '-heal', 'switch', 'drag'].includes(kind)) return;
    const side = actorSide(p[2]); if (!side) return;
    const hpText = kind === 'switch' || kind === 'drag' ? p[4] : p[3]; if (!hpText) return;
    const [currentRaw, maxRaw] = hpText.split('/'), current = parseFloat(currentRaw), max = parseFloat(maxRaw);
    if (!Number.isFinite(current)) return;
    const display = side === 'player' ? els.playerHpText : els.foeHpText;
    const before = parseFloat(display.textContent);
    if (Number.isFinite(max)) {
      updateHp(side, current, max);
      if (['-damage','-heal'].includes(kind) && Number.isFinite(before) && before !== current && !state.reducedEffects) {
        const point = spritePoint(side,.5,.25), value = document.createElement('span');
        value.className = 'kanto-damage-number'+(kind==='-heal'?' is-heal':''); value.textContent = (kind==='-heal'?'+':'−')+Math.abs(before-current);
        value.style.left = point.x*100+'%'; value.style.top = point.y*100+'%'; els.effectLayer.appendChild(value); setTimeout(()=>value.remove(),900);
      }
    }
    else {
      const mon = activeMon(state.battle?.sides?.[side === 'player' ? 0 : 1]); if (mon?.maxhp) updateHp(side, Math.round(mon.maxhp * current / 100), mon.maxhp);
    }
  }
  function spriteFor(side) { return side === 'player' ? els.playerSprite : els.foeSprite; }
  function statusFx(side, status) {
    const point = spritePoint(side, .58, .34), x = point.x, y = point.y;
    const map = { slp: ['status-zzz', 'Zz'], par: ['status-zap', 'ϟ'], frz: ['status-ice', '❄'], psn: ['status-poison', '●'], tox: ['status-poison', '●'], brn: ['status-burn', '✦'] };
    const [kind, glyph] = map[status] || ['status-star', '✦'];
    if (state.reducedEffects) return emitFx('flash', x, y, 0, 0, 160);
    emitFx(kind, x, y, 0, -24, 720); emitFx('status-glyph', x, y, 0, -22, 720);
    const node = els.effectLayer.lastElementChild; if (node) node.textContent = glyph;
  }
  function damageHitFx(side, hitIndex = 0) {
    if (state.reducedEffects) return;
    if(hitIndex===0)state.camera?.impact(side);
    const point = spritePoint(side, .5, .54), delay = Math.min(hitIndex, 5) * 35;
    emitFx('impact-ring', point.x, point.y, 0, 0, 300, delay);
    emitFx('hit-star', point.x, point.y, (Math.random() - .5) * 22, (Math.random() - .5) * 18, 220, delay + 35);
    if(hitIndex===0){emitFx('impact-lens',point.x,point.y,0,0,340,delay);for(let n=0;n<3;n++)emitFx('impact-shard',point.x,point.y,Math.cos(n*2.1)*45,Math.sin(n*2.1)*30,290,delay+25);}
  }
  function companionBondFx(mon,kind='entry'){
    if(state.reducedEffects||state.fastForward||!mon?.uid)return;
    const record=state.world?.羁绊?.伙伴?.[mon.uid];
    if(!record||record.信赖<100)return;
    const point=spritePoint('player',.5,.5);
    emitFx('bond-halo',point.x,point.y,0,0,680);
    for(let n=0;n<8;n++)emitFx('bond-particle',point.x,point.y,Math.cos(n*Math.PI/4)*65,Math.sin(n*Math.PI/4)*44-12,650,n*22);
    if(kind==='entry')showBattleMoment('bond-entry-'+mon.uid,'心意相通',`${mon.name||'伙伴'}回头与你交换了一个熟悉的眼神。`,'#d9b665');
  }
  async function animateSwitch(side, mon, kind = 'switch') {
    const sprite = spriteFor(side), landing = arenaPoint(sprite, .5, .55), oldId = Number(sprite.dataset.speciesId || 0);
    const alreadyVisible = !sprite.hidden && oldId === Number(mon.id);
    const start = side === 'player' ? { x: .035, y: .78 } : { x: .965, y: .22 };
    const travel = arenaVector(start, landing, 1);
    if (kind === 'switch' && !alreadyVisible && !sprite.hidden) {
      const recallPoint = arenaPoint(sprite, .5, .55);
      const trainer = side === 'player' ? { x: .035, y: .78 } : { x: .965, y: .22 };
      const recall = arenaVector(recallPoint, trainer, 1);
      sprite.classList.remove('enter-in', 'faint-out'); sprite.classList.add('recall-out');
      emitFx('switch-capsule', recallPoint.x, recallPoint.y, recall.dx, recall.dy, 230);
      await wait(190); sprite.hidden = true; sprite.classList.remove('recall-out');
    }
    emitFx('switch-capsule', start.x, start.y, travel.dx, travel.dy, 280);
    await wait(170);
    setSprite(sprite, mon, side === 'player'); sprite.classList.add('enter-in');
    await wait(220); sprite.classList.remove('enter-in');
    if(side==='player'&&typeof companionBondFx==='function')companionBondFx(mon,'entry');
  }
  function captureOutcome(parts, snapshot) {
    const reportedShakes = safeNum(parts[3]), shakes = Math.max(0, Math.min(3, reportedShakes));
    // Three visible shakes can be either a final failed check or a successful catch.
    return { shakes, success: Number.isInteger(reportedShakes)&&reportedShakes>=0&&reportedShakes<=3&&Boolean(snapshot?.caught) && Boolean(snapshot?.ended) };
  }
  async function animateCapture(parts, snapshot) {
    const { shakes, success } = captureOutcome(parts, snapshot), target = els.foeSprite;
    if (!target || target.hidden) return;
    const landing = spritePoint('foe', .5, .55), reduced = state.reducedEffects;
    const origin = reduced ? landing : { x: .045, y: .75 }, travel = arenaVector(origin, landing, 1), scale = 1;
    const ball = document.createElement('i');
    ball.className = 'fx fx-capture-ball';
    ball.style.left = `${origin.x * 100}%`; ball.style.top = `${origin.y * 100}%`;
    ball.style.setProperty('--dx', `${travel.dx}px`); ball.style.setProperty('--dy', `${travel.dy}px`);
    ball.style.animationDuration = `${Math.round(620 * scale / state.animationSpeed)}ms`;
    els.effectLayer.appendChild(ball);
    const removeBall = () => { if (ball.isConnected) ball.remove(); };
    setTimeout(removeBall, 6500 / state.animationSpeed);
    if (reduced) {
      ball.classList.add('capture-closed');
      await wait(180);
      if (success) target.hidden = true;
      else emitFx('capture-release', landing.x, landing.y, 0, 0, 180);
      removeBall(); return;
    }
    await wait(620 * scale);
    target.classList.remove('capture-absorb', 'capture-release'); void target.offsetWidth;
    target.style.animationDuration = `${Math.round(420 * scale / state.animationSpeed)}ms`;
    target.classList.add('capture-absorb');
    await wait(410 * scale);
    target.hidden = true;target.classList.remove('capture-absorb'); target.style.removeProperty('animation-duration');
    ball.classList.add('capture-closed');
    for (let i = 0; i < shakes; i++) {
      ball.classList.remove('capture-shake'); void ball.offsetWidth; ball.classList.add('capture-shake');
      ball.style.animationDuration = `${Math.round(300 * scale / state.animationSpeed)}ms`;
      await wait(300 * scale);
    }
    ball.classList.remove('capture-shake');
    if (success) {
      ball.style.animationDuration = `${Math.round(500 * scale / state.animationSpeed)}ms`;
      ball.classList.add('capture-success');
      for (let i = 0; i < 8; i++) emitFx('capture-star', landing.x, landing.y - .03, Math.cos(i * Math.PI / 4) * 52, Math.sin(i * Math.PI / 4) * 38, 620, i * 35);
      await wait(520 * scale);
    } else {
      ball.style.animationDuration = `${Math.round(250 * scale / state.animationSpeed)}ms`;
      ball.classList.add('capture-break');
      await wait(180 * scale);
      target.hidden = false; target.classList.remove('capture-absorb'); void target.offsetWidth;
      target.style.animationDuration = `${Math.round(400 * scale / state.animationSpeed)}ms`;
      target.classList.add('capture-release'); emitFx('capture-release', landing.x, landing.y, 0, 0, 440);
      await wait(380 * scale); target.classList.remove('capture-release'); target.style.removeProperty('animation-duration');
    }
    removeBall();
  }
  async function animateRun(parts, snapshot) {
    const success = parts[2] === 'success' && Boolean(snapshot?.ended) && Boolean(snapshot?.escaped);
    if (!success && parts[2] !== 'failed') return;
    const point = spritePoint('player', .48, .55), duration = state.reducedEffects ? 180 : 380;
    if (state.reducedEffects) {
      emitFx(success ? 'run-mark' : 'run-stop', point.x, point.y, 0, 0, duration);
      await wait(duration); return;
    }
    if (success) {
      
      const dx = -Math.max(130, els.stage.clientWidth * .3);
      for (let i = 0; i < 3; i++) emitFx('run-streak', point.x, point.y + (i - 1) * .045, dx, 0, duration, i * 48);
    } else emitFx('run-stop', point.x, point.y, 0, 0, duration);
    await wait(duration);
  }
  function showVolatile(side, kind, active) {
    const sprite = spriteFor(side), classes = { seed: 'volatile-seed', confusion: 'volatile-confusion', substitute: 'volatile-substitute', protect: 'volatile-protect', preparing: 'volatile-preparing', ability: 'volatile-ability' };
    const cls = classes[kind]; if (!cls) return;
    if (kind === 'protect') clearProtectTimer(side);
    sprite.classList.toggle(cls, active);
    const tacticalKey = { seed: 'leechseed', confusion: 'confusion', substitute: 'substitute', protect: 'protect', preparing: 'charged' }[kind];
    if (tacticalKey) {
      if (active) tacticalStates[side]?.add(tacticalKey); else tacticalStates[side]?.delete(tacticalKey);
      renderBoosts(side, state.boosts[side] || {});
    }
    if (kind === 'protect' && active) protectTimers[side] = setTimeout(() => { protectTimers[side] = null; sprite.classList.remove(cls); tacticalStates[side]?.delete('protect'); renderBoosts(side, state.boosts[side] || {}); }, 1800 / state.animationSpeed);
  }
  function applyBoostEvent(parts) {
    const side = actorSide(parts[2]); if (!side) return;
    const stat = String(parts[3] || ''), delta = Math.abs(safeNum(parts[4], 1)) * (parts[1] === '-unboost' ? -1 : 1);
    state.boosts[side][stat] = Math.max(-6, Math.min(6, safeNum(state.boosts[side][stat]) + delta));
    renderBoosts(side, state.boosts[side]);
    const point = spritePoint(side, .5, .36); emitFx(delta > 0 ? 'boost-up' : 'boost-down', point.x, point.y, 0, -16, 420);
  }
  function recordEvent(text) {
    if (!text) return;
    state.eventLog.push(text);
    els.log.replaceChildren();
    state.eventLog.forEach(message => { const item = document.createElement('li'); item.textContent = message; els.log.appendChild(item); });
    els.logCounter.textContent = `${state.eventLog.length} 条记录`;
  }
  function inspectMoveResult(lines, index, attacker, target, category = '') {
    const remaining = lines.slice(index + 1), nextMove = remaining.findIndex(event => typeof event === 'string' && protocol(event)[1] === 'move');
    const tail = nextMove < 0 ? remaining : remaining.slice(0, nextMove);
    const charging = tail.some(event => { const e = protocol(event); return e[1] === '-prepare' && actorSide(e[2]) === attacker; });
    const failed = tail.some(event => { const e = protocol(event); return e[1] === '-fail' && (!actorSide(e[2]) || actorSide(e[2]) === attacker); });
    const missed = tail.some(event => { const e = protocol(event); return e[1] === '-miss' && (actorSide(e[3]) === target || actorSide(e[2]) === target); });
    const immune = tail.some(event => { const e = protocol(event); return e[1] === '-immune' && (actorSide(e[2]) === target || actorSide(e[3]) === target); });
    const protectedTarget = tail.some(event => {
      const e = protocol(event), actor = actorSide(e[2]), detail = `${e[3] || ''} ${e.slice(4).join(' ')}`;
      return actor === target && (e[1] === '-activate' || e[1] === '-singleturn' || e[1] === '-start') && /protect/i.test(detail);
    });
    const critical = tail.some(event => protocol(event)[1] === '-crit');
    const confirmedEffect = tail.some(event => {
      const e = protocol(event), kind = e[1], side = actorSide(e[2]);
      return (kind === '-status' && side === target) || (['-boost','-unboost','-start','-singleturn','-weather','-fieldstart','-sidestart','-transform','-clearboost','-clearnegativeboost','-copyboost','-sethp','-activate','-heal','-nothing'].includes(kind) && (side === attacker || side === target || !side));
    });
    let outcome = failed ? 'fail' : missed ? 'miss' : immune ? 'immune' : protectedTarget ? 'protected' : 'hit';
    if (String(category).toLowerCase() === 'status' && outcome === 'hit' && !confirmedEffect) outcome = 'unconfirmed';
    return { charging, outcome, critical, confirmedEffect };
  }
  function isDirectMoveDamage(parts, move) {
    if (!move) return false;
    const annotations = parts.slice(4).join('|');
    return !/\[(?:from|partiallytrapped|of)\]/i.test(annotations);
  }
  function confirmedMoveCue(line, currentMove) {
    const p = protocol(line), kind = p[1], side = actorSide(p[2]), cue = currentMove?.cue;
    const text = `${p[3] || ''} ${p.slice(4).join(' ')}`;
    if (cue === 'phase-blink' && kind === 'run' && p[2] === 'success' && currentMove.attacker) return { cue:'phase-blink', side:currentMove.attacker };
    if (!side) return null;
    if (kind === 'move' && /\[from\]\s*Metronome/i.test(p.slice(5).join(' '))) return { cue:'metronome-release', side:actorSide(p[2]) };
    if (cue === 'hypnosis-rings' && kind === '-status' && p[3] === 'slp') return { cue:'hypnosis-rings', side };
    if (cue === 'dream-drain') {
      if (kind === '-damage' && side !== currentMove.attacker && isDirectMoveDamage(p, currentMove)) return { cue:'dream-drain', side };
      if (kind === '-heal' && side === currentMove.attacker && /\[from\]\s*drain/i.test(text) && /\[of\]/i.test(text)) return { cue:'dream-return', side };
    }
    if (cue === 'afterimage' && kind === '-boost' && side === currentMove.attacker && p[3] === 'evasion') return { cue:'afterimage', side };
    if (cue === 'substitute-pop' && kind === '-start' && /substitute/i.test(p[3] || '')) return { cue:'substitute-pop', side };
    if (cue === 'phase-blink' && (kind === 'switch' || kind === 'drag') && side === currentMove.attacker) return { cue:'phase-blink', side };
    if (cue === 'morph-shift' && kind === '-transform') return { cue:'morph-shift', side };
    if (cue === 'hyperbeam-charge' && kind === '-prepare' && /hyper beam/i.test(text)) return { cue:'hyperbeam-charge', side };
    if (cue === 'hyperbeam-charge' && kind === '-mustrecharge') return { cue:'hyperbeam-recharge', side };
    if (cue === 'metronome-orbit' && kind === 'move') return { cue:'metronome-orbit', side:currentMove.attacker };
    return null;
  }
  function emitConfirmedMoveCue(result) {
    if (!result?.cue || !result.side) return;
    const point = spritePoint(result.side, .5, .48);
    if (state.reducedEffects) emitFx('flash', point.x, point.y, 0, 0, 140);
    else emitFx(result.cue, point.x, point.y, 0, -10, 520);
  }
  async function processEvents(events, nextSnapshot) {
    state.presenting=true;state.fastForward=false;
    state.presentationSerial=(state.presentationSerial||0)+1;
    const skip=$('skipBattleEffects');if(skip){skip.hidden=false;skip.disabled=false;}
    try{
    if (nextSnapshot?.id && state.eventBattleId !== nextSnapshot.id) {
      clearFxEffects();
      state.eventBattleId = nextSnapshot.id; state.eventLog = []; state.battleChoiceLocks = {}; els.log.replaceChildren(); els.logCounter.textContent = '0 条记录';
      clearCosmeticEffects();state.activeCosmeticUids.clear();state.cosmeticBattleId=nextSnapshot.id;
      state.cinematicMoments = new Set();
      for (const activeSide of ['player', 'foe']) {
        clearProtectTimer(activeSide); tacticalStates[activeSide].clear();
        spriteFor(activeSide).classList.remove('volatile-seed', 'volatile-confusion', 'volatile-substitute', 'volatile-protect', 'volatile-preparing', 'volatile-ability');
        renderBoosts(activeSide, state.boosts[activeSide] || {});
      }
    }
    const lines = Array.isArray(events) ? events : []; let count = 0, currentMove = null, previousItemEvent = ''; const damageHits = Object.create(null), pendingImpact = Object.create(null);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]; if (typeof line !== 'string') continue;
      if(state.fastForward){const text=formatEvent(line);if(text){setMessage(text);recordEvent(text);}count++;continue;}
      window.KantoAudio?.event(line, i, lines);
      const p = protocol(line), kind = p[1], side = actorSide(p[2]), text = formatEvent(line);
      const bondEffect=nextSnapshot?.bondEffect;
      if(bondEffect&&((kind==='-miss'&&bondEffect.type==='dodge')||(kind==='-crit'&&bondEffect.type==='critical'&&currentMove?.attacker==='player'))){
        const partner=(state.world?.队伍||[]).find(mon=>mon.uid===bondEffect.uid),point=spritePoint('player',.5,.48);
        if(partner){
          showBattleMoment(`bond-${bondEffect.type}-${nextSnapshot.id}-${nextSnapshot.seq}`,bondEffect.type==='dodge'?'默契闪避':'心意相通 · 要害',`${partner.昵称||'伙伴'}与你的呼吸合拍。`,'#d4b574');
          if(!state.reducedEffects){emitFx(bondEffect.type==='dodge'?'bond-dodge':'bond-halo',point.x,point.y,0,0,480);for(let n=0;n<4;n++)emitFx('bond-particle',point.x,point.y,Math.cos(n*Math.PI/2)*45,Math.sin(n*Math.PI/2)*30,430,n*35);}
        }
      }
      emitConfirmedMoveCue(confirmedMoveCue(line, currentMove));
      const itemCue = heldItemCue(line, previousItemEvent);
      previousItemEvent = kind === '-enditem' ? line : kind === '-clearnegativeboost' ? '' : '';
      if (itemCue && !state.reducedEffects) {
        const point = spritePoint(itemCue.side, .5, .4);
        if (itemCue.cue === 'shell-bell-drain' && itemCue.sourceSide) {
          const origin = spritePoint(itemCue.sourceSide, .5, .45), vector = arenaVector(origin, point, .8);
          emitFx(itemCue.cue, origin.x, origin.y, vector.dx, vector.dy, 460);
          emitFx('item-heal-glow', point.x, point.y, 0, -18, 430, 180);
        } else emitFx(itemCue.cue, point.x, point.y, 0, -18, itemCue.cue === 'herb-cleanse' ? 500 : 440);
      }
      if (kind === '-damage' && side) markLowHpMoment(side, p[3]);
      if (kind === 'faint' || kind === 'switch' || kind === 'drag') markLastPokemonMoment(side, nextSnapshot);
      if ((kind === 'switch' || kind === 'drag') && actorSide(p[2])==='player') playCosmeticEntry(p[2],nextSnapshot);
      if (kind === 'win' || kind === 'tie') {markBattleOutcome(line, nextSnapshot);playCosmeticOutcome(nextSnapshot);}
      if (kind === 'capture') await animateCapture(p, nextSnapshot);
      if (kind === 'run') await animateRun(p, nextSnapshot);
      if (kind === '-weather') setWeather(p[2]);
      if (kind === '-boost' || kind === '-unboost') applyBoostEvent(p);
      if (kind === '-status' && side) { setCondition(side === 'player' ? els.playerCondition : els.foeCondition, p[3]); statusFx(side, p[3]); }
      if (kind === '-curestatus' && side) setCondition(side === 'player' ? els.playerCondition : els.foeCondition, '');
      if (kind === '-cureteam') { setCondition(els.playerCondition, ''); setCondition(els.foeCondition, ''); }
      if (kind === '-start' || kind === '-end') {
        const detail = String(p[3] || '').toLowerCase(), active = kind === '-start';
        const point = side ? spritePoint(side, .52, .5) : { x: .5, y: .5 }, x = point.x, y = point.y;
        if (side && /leech seed/.test(detail)) { showVolatile(side, 'seed', active); emitFx(active ? 'seed-vine' : 'impact-ring', x, y, 0, 0, 500); }
        else if (side && /confusion/.test(detail)) { showVolatile(side, 'confusion', active); emitFx(active ? 'mind-ripple' : 'activate-spark', x, y, 0, 0, 480); }
        else if (side && /substitute/.test(detail)) { showVolatile(side, 'substitute', active); if (!active || currentMove?.id !== 'substitute') emitFx(active ? 'substitute-pop' : 'substitute-break', x, y, 0, 0, 480); }
        else if (side && /protect/.test(detail)) { showVolatile(side, 'protect', active); if (!active) emitFx('immune-ring', x, y, 0, 0, 480); }
      }
      if (kind === '-singleturn' && /protect/i.test(p[3] || '')) { const point = side ? spritePoint(side) : { x: .5, y: .5 }; showVolatile(side, 'protect', true); emitFx('protect-shield', point.x, point.y, 0, 0, 460); }
      if (kind === '-activate') {
        if (/protect/i.test(p[3] || '')) showVolatile(side, 'protect', true);
        else if (side) { const point = spritePoint(side); emitFx('activate-spark', point.x, point.y, 0, -20, 450); }
      }
      if (kind === '-ability' && side) { const point = spritePoint(side); showVolatile(side, 'ability', true); emitFx('ability-aura', point.x, point.y, 0, 0, 600); scheduleFxCleanup(() => showVolatile(side, 'ability', false), 900 / state.animationSpeed); }
      if (kind === '-prepare' && side) { const point = spritePoint(side); showVolatile(side, 'preparing', true); if (currentMove?.id !== 'hyperbeam') emitFx('charge-glow', point.x, point.y, 0, 0, 620); }
      if (kind === '-immune' && side) { const point = spritePoint(side); emitFx('immune-ring', point.x, point.y, 0, 0, 480); }
      if (kind === '-crit' && side) pendingImpact[side] = { ...(pendingImpact[side] || {}), critical: true };
      if ((kind === '-supereffective' || kind === '-resisted') && side) pendingImpact[side] = { ...(pendingImpact[side] || {}), effectiveness: kind };
      if (kind === '-miss') { const targetSide = actorSide(p[3]); if (targetSide) { const point = spritePoint(targetSide); emitFx('speed-streak', point.x, point.y, targetSide === 'foe' ? -24 : 24, -8, 260); } }
      if (text) { setMessage(text); recordEvent(text); }
      if (kind === 'move') {
        if(side==='player')playCosmeticMove(p[2],nextSnapshot);
        showMoveBanner(p);
        const resolvedMove = canonicalMove(p[3]);
        currentMove = { id: String(resolvedMove?.id || p[3]).toLowerCase().replace(/[^a-z0-9]/g, ''), cue:globalThis.KantoBattleFx?.resolve(resolvedMove)?.cue || null, type: String(resolvedMove?.type || '').toLowerCase(), category:resolvedMove?.category || '', attacker: side, name: p[3] };
        if (side) showVolatile(side, 'preparing', false);
        const targetSide = actorSide(p[4]) || (side === 'player' ? 'foe' : 'player');
        const choiceLock = choiceBandLockMessage(line, nextSnapshot);
        if (choiceLock && state.battleChoiceLocks?.[side] !== choiceLock.moveId) {
          state.battleChoiceLocks ||= {}; state.battleChoiceLocks[side] = choiceLock.moveId;
          setMessage(choiceLock.text); recordEvent(choiceLock.text);
        } else if (!choiceLock && state.battleChoiceLocks) delete state.battleChoiceLocks[side];
        damageHits[targetSide] = 0;
        const moveResult = inspectMoveResult(lines, i, side, targetSide, resolvedMove?.category);
        pendingImpact[targetSide] = {};
        if (!moveResult.charging && moveResult.outcome !== 'fail') { await wait(110); await animateMove(p, moveResult.outcome === 'hit', moveResult); }
        // Hold 「X使出了Y！」 long enough to read before the next line replaces it (scaled by 演出速度; 跳过 skips it).
        await wait(900);
      }
      applyHpEvent(line);
      if (kind === '-damage' && side) {
        const directHit = isDirectMoveDamage(p, currentMove);
        if (directHit) {
          const heldBoost = heldTypeBoostCue(currentMove, nextSnapshot);
          if (heldBoost && currentMove && !currentMove.heldBoostShown) {
            currentMove.heldBoostShown = true;
            const boostText = `${activeMon(nextSnapshot?.sides?.[heldBoost.side === 'player' ? 0 : 1])?.name || '宝可梦'}的${heldBoost.label}强化了这次${heldBoost.type}属性攻击。`;
            setMessage(boostText); recordEvent(boostText);
            if (!state.reducedEffects) { const point = spritePoint(heldBoost.side, .5, .4); emitFx('held-item-boost', point.x, point.y, 0, -18, 420); }
          }
          if (!state.reducedEffects) {
            await wait(55);
            els.stage.classList.remove('damage-impact'); void els.stage.offsetWidth; els.stage.classList.add('damage-impact');
            scheduleFxCleanup(() => els.stage.classList.remove('damage-impact'), 250 / state.animationSpeed);
          }
          const sprite = spriteFor(side); sprite.classList.remove('hit-flash'); void sprite.offsetWidth; sprite.classList.add('hit-flash');
          const hitIndex = damageHits[side] || 0; damageHits[side] = hitIndex + 1; damageHitFx(side, hitIndex);
          if (pendingImpact[side]?.critical) { impactCamera('critical', side); const point = spritePoint(side, .5, .5); for (let n = 0; n < (state.reducedEffects ? 1 : 4); n++) emitFx('hit-star', point.x, point.y, Math.cos(n * Math.PI / 2) * 26, Math.sin(n * Math.PI / 2) * 20, 280, n * 30); }
          if (pendingImpact[side]?.effectiveness === '-supereffective') { impactCamera('super', side); const point = spritePoint(side); emitFx('impact-ring', point.x, point.y, 0, 0, 430); }
          if (pendingImpact[side]?.effectiveness === '-resisted') { const point = spritePoint(side); emitFx('immune-ring', point.x, point.y, 0, 0, 430); }
          pendingImpact[side] = {};
          if (currentMove.type === 'water' && currentMove.attacker !== side) { const point = spritePoint(side, .5, .54); emitFx('water-impact', point.x, point.y, 0, 0, 380, hitIndex * 40); }
        }
      }
      if (kind === '-heal' && side && !itemCue) { const point = spritePoint(side, .5, .45); emitFx('heal-sparkle', point.x, point.y, 0, -20, 550); }
      if (kind === 'turn') {
        els.turn.textContent = `第 ${first(getMap(), ['轮次'], 1)} 轮 · 回合 ${p[2] || ''}`;
        for (const activeSide of ['player', 'foe']) {
          clearProtectTimer(activeSide); tacticalStates[activeSide].delete('protect'); spriteFor(activeSide).classList.remove('volatile-protect');
          renderBoosts(activeSide, state.boosts[activeSide] || {});
        }
      }
      // Each battle line stays readable for a moment, as in the cartridge's text box.
      if (text && kind !== 'move') await wait(650);
      if (kind === 'faint') { const side = actorSide(p[2]), img = side === 'player' ? els.playerSprite : els.foeSprite; img.classList.add('faint-out'); await wait(360); }
      if (kind === 'switch' || kind === 'drag') {
        const side = actorSide(p[2]), species = speciesByEnglish(p[3]), party = nextSnapshot?.sides?.[side === 'player' ? 0 : 1], finalMon = activeMon(party);
        if (side && state.battleChoiceLocks) delete state.battleChoiceLocks[side];
        const mon = finalMon && (!species || Number(finalMon.id) === Number(species.id)) ? finalMon : species ? { id: species.id, appearanceId: species.id, name: species.name, level: Number((p[3] || '').match(/L(\d+)/)?.[1]) || 5 } : null;
        if (mon && side) { clearProtectTimer(side); const img = spriteFor(side); img.classList.remove('volatile-seed', 'volatile-confusion', 'volatile-substitute', 'volatile-protect', 'volatile-preparing', 'volatile-ability'); tacticalStates[side].clear(); renderBoosts(side, state.boosts[side] || {}); await animateSwitch(side, mon, kind); playShinyEntry(p[2],nextSnapshot,p[3]); }
      }
      count++;
    }
    els.counter.textContent = count ? `${count} 条战斗记录` : '';
    }finally{
      const skipped=state.fastForward;state.presenting=false;state.fastForward=false;
      for(const finish of [...presentationWaiters])finish();
      if(skip)skip.hidden=true;
      if(skipped){clearBattleCinematic();clearFxEffects();els.stage.classList.remove('damage-impact','quake-stage','shake-stage');for(const side of ['player','foe']){const sprite=spriteFor(side);sprite.classList.remove('capture-absorb','capture-release','lunge-vector','hit-flash','enter-in','recall-out','faint-out');sprite.style.removeProperty('animation-duration');}}
    }
  }
  let worldRefresh=null;
  async function refreshMvu(preferredBattle = undefined) {
    if(!worldRefresh)worldRefresh=api('/api/mvu').finally(()=>{worldRefresh=null;});
    const data = await worldRefresh; applyWorld(data, preferredBattle);
    els.connection.textContent = useBridge ? '人物卡 MVU 已连接' : 'MVU 状态已读取'; els.connectionWrap.classList.add('ready');
    return data;
  }
  function restoreActiveBattle(snapshot = state.battle) {
    setBattleFocus(true);
    if (snapshot && Array.isArray(snapshot.sides)) {
      renderBattle(snapshot);
      showBattleEntrance(snapshot);
      setMessage('战斗已恢复，请选择下一步行动。');
      return true;
    }
    setMessage('人物卡标记本轮战斗进行中，但没有返回可恢复的战斗状态。请重新读取人物卡。');
    return false;
  }
  async function beginBattle() {
    if (stageMode && useBridge && !battleOverlay) {
      if (!state.busy && ['pending', 'active'].includes(battleStatus())) sendBridgeMessage({ type: 'open-battle' });
      return;
    }
    if (state.busy || battleStatus() !== 'pending' || getParty().length === 0 || (!battleOverlay && isOpeningPreparation() && !hasStarterChoice())) return;
    if(state.battleSettings?.battleMode==='doubles'&&doubleBattleReason())return toast(doubleBattleReason());
    if (battleStatus() === 'pending') state.battleBaseline = getParty().map(mon => ({ uid: mon.uid, 闪光:mon.闪光===true, 图鉴编号: mon.图鉴编号, 昵称: mon.昵称, 等级: mon.等级, 经验: mon.经验 }));
    setBattleFocus(true); state.busy = true; renderRoundControls(); setMessage('正在载入人物卡遭遇…');
    try {
      const snapshot = await api('/api/battle', { method: 'POST', body: '{}' });
      if (!snapshot || !Array.isArray(snapshot.sides)) throw new Error('本轮战斗没有返回有效状态。');
      state.battle = snapshot; await refreshPresentation(); renderStoryScene(); renderBattle(snapshot); showBattleEntrance(snapshot);
      if (Array.isArray(snapshot.events) && snapshot.events.length) { try { await processEvents(snapshot.events, snapshot); } catch (error) { console.warn('Battle presentation failed:', error); } }
      else {
        [els.playerSprite, els.foeSprite].forEach(sprite => { sprite.classList.add('enter-in'); });
        setMessage('野生宝可梦出现了！准备战斗！'); recordEvent('遭遇开始，双方宝可梦登场！'); await wait(380);
      }
      await refreshMvu(snapshot);
      if (!snapshot.events?.length) setMessage('本轮战斗开始。请选择行动。');
    } catch (error) { showPersistentError(error.message || '无法开始本轮战斗。', () => beginBattle()); setMessage('本轮战斗尚未开始。可使用上方重试按钮。'); }
    finally { state.busy = false; renderWorld(); }
  }
  async function takeAction(choice) {
    if (!state.battle || state.battle.ended || state.busy) return;
    state.busy = true; els.switchTray.hidden = true; renderActions(state.battle);
    const description = describeBattleChoice(choice); setMessage(`已提交：${description}。等待对手行动与本回合结算。`);
    els.actionTitle.textContent = '回合处理中'; els.actionHint.textContent = '正在等待对手行动与战斗事件…';
    state.cinematicActionSerial = safeNum(state.cinematicActionSerial) + 1;
    showBattleMoment(`action-${state.battle.id}-${state.cinematicActionSerial}`, '行动已提交', description, '#6b9a79');
    try {
      const snapshot = await api('/api/action', { method: 'POST', body: JSON.stringify({ battleId: state.battle.id, choice, seq: state.battle.seq }) });
      if (!snapshot || !Array.isArray(snapshot.sides)) throw new Error('战斗服务没有返回有效状态。');
      try { await processEvents(snapshot.events, snapshot); } catch (error) { console.warn('Battle presentation failed:', error); } state.battle = snapshot; state.selectedBattleItem = null; renderBattle(snapshot);
      await refreshMvu(snapshot);
      if (snapshot.request?.forceSwitch) { els.switchTray.hidden = false; setMessage('请选择一只未倒下的同行宝可梦上场。'); }
    } catch (error) {
      const reload = async () => { await refreshMvu(); renderBattle(state.battle); setMessage('已读取最新战况，请重新选择行动。'); };
      if (['STALE_ACTION', 'STALE_TURN'].includes(error.code)) {
        try { await reload(); toast('战况已更新，请重新选择行动。'); }
        catch (refreshError) { showPersistentError(refreshError.message, reload); }
      } else {
        showPersistentError(error.message || '行动失败，请重试。', reload);
        setMessage('请重新读取战况后选择行动。');
      }
    }
    finally { state.busy = false; renderWorld(); }
  }
  async function nextRound() {
    if (embedded || state.busy || battleStatus() !== 'finished') return;
    state.busy = true; renderRoundControls();
    try { const data = await api('/api/next', { method: 'POST', body: '{}' }); state.battle = null; applyWorld(data); setMessage('下一轮遭遇已载入。'); }
    catch (error) { showPersistentError(error.message || '无法推进到下一轮。', () => nextRound()); }
    finally { state.busy = false; renderWorld(); }
  }
  async function returnToStage() {
    if (!(stageMode || battleOverlay) || battleStatus() !== 'finished') return;
    clearCosmeticEffects();clearShinyEntries();stopImportantBattlePresentation();state.camera?.stop();state.camera=null;state.activeCosmeticUids.clear();
    await refreshPresentation(); document.body.classList.remove('mvu-open'); setBattleFocus(false); renderWorld();
    if (embedded && battleOverlay) {
      sendBridgeMessage({ type: 'stage-return' });
    }
    els.storyScene.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function requestStageControl(type) {
    if (!stageMode || !embedded || !bridgeNonce || !['stage-advance', 'stage-return'].includes(type)) return;
    sendBridgeMessage({ type });
  }
  function renderActionsOnEmpty(text) {
    els.moves.replaceChildren(); const empty = document.createElement('div'); empty.className = 'empty-actions'; empty.textContent = text; els.moves.appendChild(empty);
  }
  function onDexSearch() { if (state.dex) renderDex(); }
  function showMvuPanel() {
    if (stageMode && useBridge) {
      try { sendBridgeMessage({ type: 'open-roster', tab: 'party' }); }
      catch (error) { showPersistentError(error.message, () => showMvuPanel()); }
      return;
    }
    document.body.classList.add('mvu-open');
    $('mvuPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function backToStory() {
    document.body.classList.remove('mvu-open');
    els.storyScene.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function returnFromShop() {
    if (embedded && (stageMode || rosterMode)) { sendBridgeMessage({ type: 'stage-return' }); return; }
    backToStory();
  }
  els.dexSearch.addEventListener('input', onDexSearch);
  els.start.addEventListener('click', beginBattle); els.next.addEventListener('click', nextRound);
  $('stadiumSpriteFiles')?.addEventListener('change', event => {
    const count=window.KantoStadiumSprites?.importFiles(event.target.files)||0;
    event.target.value='';
    if(!count){toast('未找到符合编号-front/back-n/s.gif 命名的素材。');return;}
    setBattleSpriteStyle('animated');
    toast(`已导入 ${count} 个 GIF，仅在本次页面有效。`);
  });
  els.spriteStyle?.addEventListener('click', () => setBattleSpriteStyle(state.battleSpriteStyle==='pixel'?'animated':'pixel'));
  els.sceneryStyle?.addEventListener('click', () => setBattleSceneryStyle(state.battleSceneryStyle === 'illustrated' ? 'pixel' : 'illustrated'));
  els.focusHeader.addEventListener('click', () => setBattleFocus(!state.battleFocus));
  els.focusBattle.addEventListener('click', () => setBattleFocus(!state.battleFocus));
  els.returnStage.addEventListener('click', returnToStage);
  els.backStory.addEventListener('click', () => { requestStageControl('stage-return'); backToStory(); });
  $('sceneDialogue').addEventListener('click', () => requestStageControl('stage-advance'));
  els.showMvu.addEventListener('click', showMvuPanel);
  els.hudTabs.addEventListener('click', event => {
    const button = event.target.closest('[data-hud-tab]');
    if (button) selectHudTab(button.dataset.hudTab);
  });
  els.retry.addEventListener('click', () => { if (state.retryAction) state.retryAction(); });
  els.downloadMvu.addEventListener('click', downloadWorldJson);
  els.mvuJson.parentElement?.addEventListener('toggle', renderMvuJson);
  els.heal.addEventListener('click', () => useService('/api/heal', {}, '同行队伍已在宝可梦中心恢复。'));
  els.buyPotion.addEventListener('click', () => useService('/api/shop', { item: 'potion', count: 1 }, '已购买伤药，花费 ₽300。'));
  els.buyBall.addEventListener('click', () => useService('/api/shop', { item: 'pokeball', count: 1 }, '已购买精灵球，花费 ₽200。'));
  els.switch.addEventListener('click', () => { if (state.battle?.request?.switches?.length) els.switchTray.hidden = !els.switchTray.hidden; });
  els.battleCommandBar.addEventListener('click', event => {
    const button = event.target.closest('[data-battle-tab]');
    if (button && !button.disabled) setBattleActionTab(button.dataset.battleTab);
  });
  els.battleItemUse.addEventListener('click', confirmBattleItem);
  els.battleItemCancel.addEventListener('click', () => { state.selectedBattleItem = null; if (state.battle) renderActions(state.battle); });
  els.run.addEventListener('click', () => takeAction('run'));
  $('skipBattleEffects')?.addEventListener('click', skipBattlePresentation);
  els.sound.addEventListener('click', () => { state.muted = !state.muted; window.KantoAudio?.effects(!state.muted); els.sound.setAttribute('aria-pressed', String(state.muted)); els.soundLabel.textContent = state.muted ? '音效 关' : '音效 开'; if(nativeMode&&embedded)sendBridgeMessage({type:'presentation-change',effects:!state.muted}); });
  $('musicToggle').addEventListener('click', () => {
    if (state.musicManaged) return;
    const enabled = window.KantoAudio?.toggleMusic();
    if (embedded && typeof enabled === 'boolean') sendBridgeMessage({ type: 'music-change', enabled });
  });
  els.musicResume?.addEventListener('click', async () => { await window.KantoAudio?.resumeMusic?.(); syncBattleMusicButton(); });
  window.KantoAudio?.watchState?.(syncBattleMusicButton);
  els.speed.addEventListener('change', () => setAnimationSpeed(els.speed.value));
  els.speedAction?.addEventListener('change', () => setAnimationSpeed(els.speedAction.value));
  els.shopReturn?.addEventListener('click', returnFromShop);
  els.reduceEffects.addEventListener('change', () => { state.reducedEffects = els.reduceEffects.checked; document.body.classList.toggle('reduce-effects', state.reducedEffects); if(state.reducedEffects){clearCosmeticEffects();clearShinyEntries();} state.camera?.configure({speed:state.animationSpeed,reduced:state.reducedEffects}); if(nativeMode&&embedded)sendBridgeMessage({type:'presentation-change',reducedEffects:state.reducedEffects}); });
  els.bossTier?.addEventListener('change',()=>updateBattleSetting('bossTier',els.bossTier.value));
  els.battleMode?.addEventListener('change',()=>updateBattleSetting('battleMode',els.battleMode.value));
  els.cosmeticDisclosure?.addEventListener('toggle',()=>{if(els.cosmeticDisclosure.open){state.cosmeticRenderKey='';renderCosmetics();}});
  document.addEventListener('keydown', event => { if (event.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) { event.preventDefault(); els.dexSearch.focus(); } if (event.key === 'Escape') { els.dexSearch.blur(); els.switchTray.hidden = true; if(nativeMode && rosterMode && embedded)sendBridgeMessage({type:'stage-return'}); } });
  document.addEventListener('keydown', event => {
    if (!state.battleFocus || !state.battle || state.battle.ended || state.busy || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) return;
    if (state.battle.request?.forceSwitch && event.key.toLowerCase()!=='p') return;
    if (/^[1-4]$/.test(event.key) && state.battleActionTab==='moves' && !state.battle.request?.forceSwitch) {
      const index=Number(event.key)-1,move=state.battle.request?.moves?.[index];
      if(move&&!move.disabled){event.preventDefault();takeAction('move '+(index+1));}
    } else if(event.key.toLowerCase()==='b'){event.preventDefault();setBattleActionTab('bag');}
    else if(event.key.toLowerCase()==='p'){event.preventDefault();setBattleActionTab('pokemon');}
    else if(event.key==='Escape'&&!state.battle.request?.forceSwitch){setBattleActionTab('moves');}
  });

  async function init() {
    try{state.battleSpriteStyle=localStorage.getItem('kanto-battle-model-style')||'pixel';}catch{state.battleSpriteStyle='pixel';}
    setBattleSpriteStyle(state.battleSpriteStyle);
    try {
      await ensureTransport();
      if(!animatedSpriteData){try{animatedSpriteData=await fetch(new URL('./data/battle-animated.json',document.baseURI)).then(r=>r.ok?r.json():null);}catch{}}
      await window.KantoAudio?.init();
      initializeBattleTerrain().catch(error => showPersistentError(`战斗背景加载失败：${error.message || '素材读取失败'}。请重试。`, initializeBattleTerrain));
      const [dex, mvu] = await Promise.all([api('/api/dex'), api('/api/mvu')]);
      state.presentation = mvu.presentation || mvu.worldView?.presentation || state.presentation;
      hydrateDex(dex); applyWorld(mvu);
      els.connection.textContent = useBridge ? '人物卡 MVU 已连接' : 'MVU 状态已读取'; els.connectionWrap.classList.add('ready');
      if (battleOverlay) {
        setBattleFocus(true);
        if (battleStatus() === 'pending') await beginBattle();
        else if (battleStatus() === 'active') restoreActiveBattle();
      } else if (!stageMode && !rosterMode && battleStatus() === 'active' && state.battle) restoreActiveBattle();
    } catch (error) {
      els.connection.textContent = '人物卡连接失败'; els.connectionWrap.classList.add('error');
      els.mvuIndicator.textContent = '连接失败'; els.mvuIndicator.classList.remove('is-ready'); els.mvuSummary.textContent = '人物卡 MVU 未初始化。请查看上方错误并重试。';
      els.team.replaceChildren(); const note = document.createElement('div'); note.className = 'team-empty'; note.textContent = error.message || '无法载入 MVU 人物卡。'; els.team.appendChild(note);
      els.inventory.replaceChildren(); els.dexResults.replaceChildren(); state.dexRenderCache = null;
      renderActionsOnEmpty('无法读取本轮行动。请使用页面上方的重试按钮。'); setMessage('页面已就绪，但人物卡 MVU 尚未连接。');
      showPersistentError(error.message || 'MVU 初始化失败。', () => init());
    }
  }
  init();
})();
