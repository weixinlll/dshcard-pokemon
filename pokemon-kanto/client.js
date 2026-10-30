// Extend Tavern's own stage; battle and inventory stay in the same native scene.
window.__ModuleLoader__.load({id:'dsh-card-pokemon-frlg-stage',factory:require=>{
  const R=require('react'),h=R.createElement,{useEffect,useMemo,useRef,useState}=R;
  const PLUGIN='dsh-card-pokemon-frlg-stage',CHANNEL='kanto-mvu';
  const ASSET_ROOT='/api/dsh-tavern/plugin-assets/'+PLUGIN+'/web/',VERSION='1.0.1';
  const sessions=new Map(),listeners=new Set(),portraitAssignments=new Map(),staticRequests=new Map();
  const STATIC_REQUEST_LIMIT=24;
  const modes=new Set(['story','battle','party','bag','quests','shop','map']);
  const routes=new Set(['dex','mvu','state','presentation','battle','action','travel','starter','heal','shop','item','box','learn','party','scene','settings','gadget']);
  // 素材包的基址（view / stage-assets 返回）。有它就从包取图，没有才退回插件目录。
  let PACK_ROOT='';
  const asset=(ui,file)=>{
    if(!(typeof file==='string'&&/^assets\/[a-z0-9_./-]+$/i.test(file)&&!file.includes('..')))return '';
    return PACK_ROOT?PACK_ROOT+file:ASSET_ROOT+file+'?v='+VERSION;
  };
  function storyTrack(data,manifest,beat){
    const world=data?.world,theater=data?.theater;if(!world||!manifest)return null;
    let key=manifest.locations?.[world.地图?.节点]||'pallet';
    const action=world.剧情?.剧场?.最近动作,dialogue=String(theater?.dialogue||''),speaker=String(beat?.speaker||'');
    if(theater?.id==='oak-lab')key=manifest.events?.opening;
    else if(world.战斗?.状态==='pending'&&theater?.id==='rival-opening')key=manifest.events?.rivalAppears;
    else if(action==='heal'&&/乔伊|中心|恢复/.test(speaker+String(beat?.text||'')))key=manifest.events?.pokemonCenter;
    else if(action==='challenge-gym'&&world.战斗?.状态!=='finished')key=manifest.events?.gymInterior;
    if(/圣特安努|圣安奴/.test(dialogue))key=manifest.events?.ssAnne||key;
    else if(/西尔佛公司/.test(dialogue))key=manifest.events?.silphCo||key;
    else if(/宝可梦大宅|宝可梦屋/.test(dialogue))key=manifest.events?.pokemonMansion||key;
    else if(world.战斗?.状态==='pending'&&/火箭队/.test(theater?.person?.name||speaker))key=manifest.events?.rocketAppears||key;
    const event=beat?.musicEvent||data?.presentation?.scene?.musicEvent;if(event&&manifest.events?.[event])key=manifest.events[event];
    return manifest.tracks?.[key]?{id:key,...manifest.tracks[key]}:null;
  }
  const notify=id=>listeners.forEach(fn=>fn(id));
  function staticRequest(kind,gameId,load){
    const key=VERSION+':'+kind+':'+String(gameId);let entry=staticRequests.get(key);
    if(entry){staticRequests.delete(key);staticRequests.set(key,entry);return entry.promise;}
    entry={promise:null};entry.promise=Promise.resolve().then(load).catch(error=>{if(staticRequests.get(key)===entry)staticRequests.delete(key);throw error;});
    staticRequests.set(key,entry);while(staticRequests.size>STATIC_REQUEST_LIMIT)staticRequests.delete(staticRequests.keys().next().value);
    return entry.promise;
  }
  function documentFor(bundle,base,query,musicManaged=false){
    const q=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    const boot=JSON.stringify({query,musicManaged}).replace(/</g,'\\u003c');
    // 素材在人物卡的素材包里；插件页面本身仍从 plugins/<插件>/assets/web/ 读。
    const assetRoot=String(bundle.assetRoot||'');
    const assetBoot=`window.__KANTO_ASSET_ROOT__=${JSON.stringify(assetRoot).replace(/</g,'\\u003c')};window.__KANTO_ANIMATED_ROOT__=${JSON.stringify(String(bundle.animatedAssetRoot||assetRoot)).replace(/</g,'\\u003c')};window.__KANTO_FX_ASSET_ROOT__=${JSON.stringify(String(bundle.fxAssetRoot||'')).replace(/</g,'\\u003c')};`;
    return bundle.html.replace(/<link\b[^>]*href=["']\.\/(?:style|battle-theme|tools-panel|cosmetic-fx|shiny-fx|important-battle|battle-camera|doubles-ui|classic-services|tile-world-ui|map-panzoom)\.css["'][^>]*>/gi,'')
      .replace(/<script\b[^>]*src=["']\.\/(?:app|audio|terrain|battle-fx-map|tools-panel|cosmetic-fx|shiny-fx|important-battle|battle-camera|doubles-ui|classic-services-ui|tile-world-ui|map-panzoom)\.js["'][^>]*><\/script>/gi,'')
      .replace(/<head>/i,()=>`<head><base href="${q(base)}"><style>${bundle.css.replace(/<\/style/gi,'<\\/style')}</style><script>${assetBoot}window.__KANTO_EMBED__=${boot};<\/script>`)
      .replace(/<\/body>/i,()=>`<script>${bundle.js.replace(/<\/script/gi,'<\\/script')}<\/script></body>`);
  }
  function BattleFrame({ctx,gameId,mode,onChange,onRefresh,onPrepare,onPreferences,musicEnabled=true,musicManaged=false,effectsEnabled=true,animationSpeed=1,reducedEffects=false}){
    const ui=ctx.tavernUi,frame=useRef(null),port=useRef(null),head=useRef({}),handler=useRef(null);
    const nonce=useRef(globalThis.crypto?.randomUUID?.()||`kanto-${Date.now()}-${Math.random()}`);
    const [bundle,setBundle]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[connected,setConnected]=useState(false);
    const battle=mode==='battle',query=`?native=1&mvu=1&battle=${battle?1:0}&roster=${battle?0:1}&tab=${encodeURIComponent(mode)}&bridge=${nonce.current}`;
    const audioSettings=useRef({});audioSettings.current={music:musicManaged?false:musicEnabled,...(musicManaged?{musicManaged:true}:{}),effects:effectsEnabled,speed:animationSpeed,reducedEffects};
    const base=ASSET_ROOT+'index.html',doc=useMemo(()=>bundle?documentFor(bundle,base,query,musicManaged):'',[bundle,base,query,musicManaged]);
    useEffect(()=>{if(port.current)port.current.postMessage({channel:CHANNEL,bridge:nonce.current,type:'audio-settings',...audioSettings.current});},[musicEnabled,musicManaged,effectsEnabled,animationSpeed,reducedEffects]);
    useEffect(()=>{let active=true;setError('');staticRequest('view',gameId,()=>ui.callHost(PLUGIN+'/view',{gameId})).then(v=>{if(active){PACK_ROOT=v?.assetRoot||PACK_ROOT;setBundle(v);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[gameId,retry]);
    useEffect(()=>ui.watchTurnState?.(gameId,value=>{
      const old=head.current;head.current=value||{};
      if(port.current&&(old.textVersion!==value?.textVersion||old.busy!==value?.busy||old.settled!==value?.settled))port.current.postMessage({channel:CHANNEL,bridge:nonce.current,type:'mvu-refresh'});
    }),[gameId]);
    handler.current=async(data,reply)=>{
      if(!data||data.channel!==CHANNEL||data.bridge!==nonce.current)return;
      if(data.type==='stage-return'){onChange('story');onRefresh(mode==='battle'?'scene':undefined);return;}
      if(data.type==='story-intent'&&['travel','heal','starter','bond','care','train','camp','quest-accept','quest-turn-in','deep-quest-accept','deep-quest-advance','deep-quest-claim'].includes(data.action)){onChange('story');onPrepare?.({id:data.action,label:data.label||'继续旅程',payload:data.payload||{}});return;}
      if(data.type==='open-battle'){onChange('battle');return;}
      if(data.type==='open-roster'){onChange(modes.has(data.tab)?data.tab:'party');return;}
      if(data.type==='music-change'){if(!musicManaged)ui.setMusicEnabled?.(data.enabled);return;}
      if(data.type==='presentation-change'){onPreferences?.(data);return;}
      if(typeof data.requestId!=='string'||data.requestId.length>120)return;
      const route=String(data.path||'').replace(/^\/api\//,''),answer=(body,error)=>{try{reply({channel:CHANNEL,bridge:nonce.current,requestId:data.requestId,body,error});}catch{}};
      if(!routes.has(route)){answer(null,{message:'不支持的操作。'});return;}
      try{
        const read=['dex','mvu','state','presentation'].includes(route),body=data.body&&typeof data.body==='object'?data.body:{};
        const result=await ui.callHost(PLUGIN+'/'+route,{...body,...(!read?{turn:head.current.turn,textVersion:head.current.textVersion}:{}),gameId});
        answer(result);if(!read&&!['action','battle'].includes(route))onRefresh(route);
      }catch(e){answer(null,{message:e.message||'操作失败',code:e.code});}
    };
    const connect=()=>{
      const node=frame.current,view=node?.ownerDocument?.defaultView;
      if(!view?.MessageChannel){setError('消息通道不可用，请重新载入 DSH。');return;}
      port.current?.close();setConnected(false);const channel=new view.MessageChannel();port.current=channel.port1;
      channel.port1.onmessage=event=>{
        const data=event.data;if(data?.channel!==CHANNEL||data.bridge!==nonce.current)return;
        if(data.type==='bridge-connected'){setConnected(true);channel.port1.postMessage({channel:CHANNEL,bridge:nonce.current,type:'audio-settings',...audioSettings.current});channel.port1.postMessage({channel:CHANNEL,bridge:nonce.current,type:'bridge-ready'});return;}
        handler.current?.(data,payload=>channel.port1.postMessage(payload));
      };
      channel.port1.start();node.contentWindow.postMessage({channel:CHANNEL,bridge:nonce.current,type:'bridge-connect'},'*',[channel.port2]);
    };
    useEffect(()=>{
      const view=frame.current?.ownerDocument?.defaultView||window;
      const receive=event=>{if(event.source===frame.current?.contentWindow)handler.current?.(event.data,payload=>event.source.postMessage(payload,'*'));};
      view.addEventListener('message',receive);return()=>{view.removeEventListener('message',receive);port.current?.close();};
    },[bundle]);
    if(error)return h('div',{role:'alert'},error,' ',h('button',{onClick:()=>setRetry(v=>v+1)},'重试连接'));
    if(!bundle)return h('p',{role:'status'},'正在读取原生 MVU…');
    return h('div',{style:{height:'100%',minHeight:0,position:'relative'},'data-kanto-connection':connected?'ready':'connecting'},h('iframe',{ref:frame,srcDoc:doc,onLoad:connect,title:battle?'剧场内宝可梦战斗':'剧场内训练家状态',allow:'autoplay',style:{border:0,width:'100%',height:'100%',display:'block'}}));
  }
  // 舞台台词取自整轮正文的拆分；宿主没剥干净的初始化变量块在这里兜底。
  const VARIABLE_TAG=/<\s*\/?\s*(?:initvar|updatevariable|update|variableupdate|json_?patch)\b[^>]*>/i;
  const VARIABLE_PAYLOAD=/"strictSet"\s*:|\{\s*"\$meta"|"宝可梦"\s*:\s*\{/;
  function stripStagePayload(value){
    let text=String(value===undefined||value===null?'':value);
    if(!text)return '';
    text=text.replace(/<initvar\b[^>]*>[\s\S]*?<\/initvar>/gi,'').replace(/<updatevariable\b[^>]*>[\s\S]*?<\/updatevariable>/gi,'');
    if(VARIABLE_PAYLOAD.test(text)){
      const start=text.search(/\n?\s*\{\s*"(?:\$meta|宝可梦)"/);
      if(start>=0){const tail=text.slice(start);const end=Math.max(tail.lastIndexOf('}'),tail.lastIndexOf(']'));text=text.slice(0,start)+(end>=0?tail.slice(end+1):'');}
    }
    return text.replace(/<\s*\/?\s*(?:initvar|updatevariable|update|variableupdate|json_?patch|mvu-status)\b[^>]*>/gi,'').replace(/\n{3,}/g,'\n\n').trim();
  }
  const carriesStagePayload=value=>VARIABLE_TAG.test(String(value||''))||VARIABLE_PAYLOAD.test(String(value||''));
  // 模型偶尔把思考过程写进正文；整段英文、又没有中文的，不当台词。
  const REASONING_HINT=/\b(?:Write the ending|Hmm\b|I think|Let me|Wait,|That's (?:fine|acceptable|safer)|the player will|narrative|pre-empt|guidance)\b/i;
  function looksLikeReasoning(text){
    const source=String(text||'');
    if(source.length<40)return false;
    const latin=(source.match(/[A-Za-z]/g)||[]).length,cjk=(source.match(/[\u4e00-\u9fff]/g)||[]).length;
    if(latin>=40&&cjk<=latin/8)return true;
    return REASONING_HINT.test(source)&&latin>cjk*2;
  }
  function isStageDataRow(row,rows=[]){
    if(!row)return false;
    const text=String(row.text||'').trim();
    if(!row.speaker&&looksLikeReasoning(text))return true;
    if(row.speaker)return false;
    if(carriesStagePayload(text)||/^(?:[{}\[\],]+|"[^"\n]+"\s*:[\s\S]*)$/.test(text))return true;
    return rows.some(item=>carriesStagePayload(item?.text))&&(!text||/^(?:"(?:[^"\\]|\\.)*"[,]?|(?:true|false|null|-?\d+(?:\.\d+)?)[,]?)$/.test(text));
  }
  function readableStageFooter(footer,rows,index){
    if(!footer?.props||typeof R.cloneElement!=='function'||!rows?.length)return footer;
    const visible=rows.map((row,i)=>isStageDataRow(row,rows)?-1:i).filter(i=>i>=0);
    const children=[].concat(footer.props.children||[]).map(child=>{
      if(!child?.props)return child;
      if(child.props.className==='dsh-tavern-stage-progress')return R.cloneElement(child,{},`${visible.filter(i=>i<=index).length} / ${visible.length}`);
      const back=child.props['data-action']==='back'||child.props['aria-label']==='上一句',next=child.props['aria-label']==='下一句';
      if(!back&&!next)return child;
      const target=back?visible.filter(i=>i<index).at(-1):visible.find(i=>i>index);
      return R.cloneElement(child,{disabled:target===undefined,onClick:event=>{if(target!==undefined)for(let n=0;n<Math.min(400,Math.abs(target-index));n++)child.props.onClick?.(event);}});
    });
    return R.cloneElement(footer,{},...children);
  }


  const THEATER_CSS=`
.dsh-tavern-stage-overlay:has([data-kanto-native-stage][data-kanto-mode]:not([data-kanto-mode="story"]))>.dsh-tavern-stage-choices,.dsh-tavern-stage-overlay:has([data-kanto-native-stage][data-kanto-mode]:not([data-kanto-mode="story"]))>.dsh-tavern-stage-wait{display:none!important;pointer-events:none!important}
.kanto-theater{position:relative;height:100%;min-height:0;overflow:hidden;background:#17392e;cursor:pointer}
.kanto-theater-bg{position:absolute;inset:0;background-size:cover;background-position:center;animation:kanto-reveal .5s ease}
.kanto-theater-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,24,28,.02) 35%,rgba(10,24,28,.5))}
.kanto-cast{position:absolute;inset:2% 4% 9%;display:flex;align-items:flex-end;justify-content:space-evenly;gap:3%;pointer-events:none}
.kanto-actor{position:relative;display:flex;align-items:flex-end;justify-content:center;height:94%;max-height:720px;width:38%;min-width:0;filter:drop-shadow(0 8px 12px #10282077);animation:kanto-arrive .45s ease}
.kanto-actor svg,.kanto-actor img{image-rendering:auto;width:100%;height:100%;object-fit:contain;object-position:center bottom;overflow:visible}
.kanto-actor.is-muted{filter:brightness(.76) drop-shadow(0 6px 12px #10282055);height:88%}
.kanto-actor.is-pokemon{height:43%;max-height:310px;width:25%;margin-bottom:10%;image-rendering:auto}
.kanto-actor.is-speaking{animation:kanto-arrive .4s ease,kanto-breathe 4s ease-in-out .4s infinite}
.kanto-theater-box{position:absolute;left:clamp(12px,4%,80px);right:clamp(12px,4%,80px);bottom:3%;max-height:44%;overflow:auto;background:rgba(14,33,43,.94);border:1px solid #e0eddb88;border-top:3px solid #cfe0ac;border-radius:12px;padding:14px 20px 10px;color:#fffdf4;box-shadow:0 8px 28px #081c2866;backdrop-filter:blur(8px)}
.kanto-theater-name{display:inline-block;margin:0 0 7px;color:#f3d18b;font-weight:800;font-size:16px}
.kanto-theater-text{margin:0;font-size:clamp(15px,1.3vw,21px);line-height:1.75;min-height:2.8em;white-space:pre-wrap}
.kanto-service-summary{margin:0 0 7px;padding:8px 10px;border-left:3px solid #d2af63;border-radius:0 6px 6px 0;background:#ffffff12;color:#e8eee1;font-size:13px;line-height:1.5;white-space:pre-wrap}
.kanto-story-choices{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:7px;max-height:min(30vh,260px);overflow-y:auto;overscroll-behavior:contain;padding:3px 4px 6px;margin:8px 0;scrollbar-width:thin}
.kanto-story-choices .kanto-action{min-height:36px;text-align:left;white-space:normal}
.kanto-theater-controls{display:flex;gap:7px;align-items:center;margin-top:12px;flex-wrap:wrap;font-size:13px}
.kanto-theater-controls{position:sticky;bottom:0;padding:6px 0 2px;background:linear-gradient(180deg,transparent,rgba(14,33,43,.98) 30%)}
.kanto-theater-controls button{font:inherit;padding:4px 10px;border:1px solid #cadbc555;border-radius:6px;background:#ffffff12;color:inherit;cursor:pointer}
.kanto-theater-controls button:disabled{opacity:.4;cursor:default}
.kanto-theater-controls .dsh-tavern-stage-controls{display:flex;align-items:center;gap:7px;flex-wrap:wrap;width:100%;color:inherit}
.kanto-theater-controls .dsh-tavern-spacer{flex:1}
.kanto-defeat{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 8px}.kanto-defeat p{margin:0;font-weight:600}
.kanto-note{position:absolute;left:4%;top:14px;max-width:90%;margin:0;font-size:13px;color:#fff;background:#132e40d9;padding:6px 12px;border-radius:6px;pointer-events:none}
.kanto-safari-prop{position:absolute;left:22%;top:53%;z-index:3;pointer-events:none;width:32px;height:32px;border-radius:50%;background:linear-gradient(#61945a 0 43%,#172e36 44% 56%,#fcf8de 57%);border:2px solid #172e36;box-shadow:0 0 20px #fff5;animation:kanto-safari-arc .85s cubic-bezier(.2,.6,.55,1) both}
.kanto-safari-prop.is-bait{width:23px;height:20px;background:#ba8b4e;border-color:#6a4b2e;border-radius:30%}
.kanto-safari-prop.is-rock{width:29px;height:25px;background:#a5a8a3;border-color:#5e6868;border-radius:45% 30% 38% 25%}
@keyframes kanto-safari-arc{0%{opacity:0;transform:translate(0,80px) rotate(0)}15%{opacity:1}55%{transform:translate(32vw,-18vh) rotate(250deg)}90%{opacity:1}100%{opacity:0;transform:translate(42vw,5vh) rotate(540deg)}}
.kanto-stage-shell .kanto-stage-header{flex-wrap:wrap;gap:8px;flex-shrink:0}
.kanto-stage-shell .kanto-stage-meta{flex-wrap:wrap;gap:8px}
.kanto-stage-shell .kanto-stage-meta label{display:flex;align-items:center;gap:5px;font-size:12px;white-space:nowrap}
.kanto-stage-shell .kanto-stage-meta select{border:1px solid #b7c6b8;border-radius:5px;padding:4px;color:#183149;background:#fffdf5}
.kanto-stage-shell .kanto-stage-viewport{overflow:hidden;scrollbar-gutter:auto}
.kanto-stage-shell.is-fullscreen[data-kanto-mode] .kanto-stage-viewport{height:0;min-height:0;flex:1 1 auto}
.kanto-stage-shell.is-fullscreen[data-kanto-mode]{overflow:hidden}
.kanto-stage-shell .kanto-stage-dock{overflow:auto;max-height:38vh;flex-shrink:0;padding:8px 16px;gap:6px}
.kanto-stage-shell .kanto-stage-actions .kanto-action{min-height:34px;padding:6px 12px;font-size:14px}
.kanto-stage-shell .kanto-stage-nav .kanto-action{min-height:32px;padding:4px 12px;font-size:13px}
.kanto-stage-shell .kanto-stage-prompt{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 14px;border-left:4px solid #34785e;background:#edf2e4;border-radius:6px}
.kanto-stage-shell .kanto-stage-prompt p{flex:1 1 380px;margin:0;font-size:14px}
.kanto-stage-shell .kanto-stage-rewards{font-size:12px;color:#536a63}
.kanto-stage-shell .kanto-stage-rewards p{margin:4px 0}
.kanto-stage-shell .kanto-stage-prompt{display:block;padding:12px 16px;background:#e7eee7}.kanto-draft-label{display:block;font-size:13px;font-weight:700;color:#355a4c}.kanto-draft-label textarea{display:block;width:100%;height:92px;resize:vertical;margin:6px 0 9px;padding:10px 12px;border:1px solid #8aa99a;border-radius:7px;background:#fffef7;color:#173849;font:inherit;font-size:15px;line-height:1.65}.kanto-draft-actions,.kanto-social-tabs,.kanto-social-options{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.kanto-draft-actions small{flex:1;color:#527062}.kanto-social-tabs{justify-content:center}.kanto-quest-offers{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:8px;max-height:25vh;overflow:auto}.kanto-quest-offers article{padding:10px 14px;border:1px solid #abc1b4;border-radius:8px;background:#f3f5eb}.kanto-quest-offers article p{margin:6px 0;font-size:14px;line-height:1.5}.kanto-quest-offers article small{display:block;color:#80622d;margin-bottom:8px}.kanto-person-missing{display:grid;place-content:center;gap:8px;min-width:180px;min-height:220px;padding:25px;border:1px solid #bdd2ca66;border-radius:50% 50% 12px 12px;background:linear-gradient(160deg,#214455aa,#183f3299);color:#e4ece8;text-align:center}.kanto-person-missing small{font-size:12px;color:#b9cec4}.kanto-person-missing button{justify-self:center;padding:7px 13px;border:1px solid #9db5a8;border-radius:6px;background:#f1f2e8;color:#173f38;font:inherit;font-size:13px;cursor:pointer}
@keyframes kanto-arrive{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes kanto-reveal{from{opacity:.35}to{opacity:1}}
@keyframes kanto-breathe{50%{transform:translateY(-3px)}}
@media(max-width:680px){.kanto-theater-box{left:10px;right:10px;padding:10px 13px;bottom:10px;max-height:48%}.kanto-theater-text{font-size:15px}.kanto-cast{inset:2% 1% 16%;gap:0}.kanto-actor{width:48%;height:96%}.kanto-actor.is-pokemon{width:32%}.kanto-stage-shell .kanto-stage-dock{padding:6px 8px;max-height:32vh}.kanto-stage-shell .kanto-stage-meta{justify-content:flex-start}.kanto-stage-shell .kanto-stage-brand{flex:1}.kanto-stage-shell .kanto-stage-header{min-height:46px}}
@media(prefers-reduced-motion:reduce){.kanto-theater *{animation:none!important}}
`;
  // Keep the native stage legible while stage-assets CSS is unavailable.
  const STAGE_SHELL_FALLBACK_CSS=`
.kanto-stage-shell{display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;color:#24372e;background:#f3f1e8;font:14px/1.45 system-ui,sans-serif}
.kanto-stage-shell *{box-sizing:border-box}
.kanto-stage-header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px;background:#e6eadf;border-bottom:1px solid #c6d0c2;z-index:1}
.kanto-stage-brand,.kanto-stage-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.kanto-stage-brand{min-width:0}.kanto-stage-location{color:#52665b}
.kanto-stage-viewport{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;background:#17392e}
.kanto-stage-dock{flex:0 0 auto;max-height:38vh;overflow:auto;padding:10px 14px;background:#edf0e8;border-top:1px solid #c6d0c2}
.kanto-stage-shell .kanto-action,.kanto-stage-dock button{padding:6px 11px;border:1px solid #82998c;border-radius:6px;background:#f8f8ef;color:#193c32;font:inherit;cursor:pointer}
.kanto-stage-shell button:disabled{opacity:.5;cursor:default}
.kanto-stage-action-groups,.kanto-stage-actions,.kanto-stage-nav,.kanto-social-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.kanto-stage-action-group{margin:5px 0}.kanto-action-group-label{display:block;color:#52665b;margin-bottom:4px}
`;
  const normalizeName=name=>String(name||'').replace(/[·•・\s]/g,'').toLowerCase();
  const isShinyMon=mon=>Boolean(mon&&(mon.shiny===true||mon.闪光===true));
  function trainerFor(name,trainers){
    const key=normalizeName(name);if(!key)return null;
    return trainers.find(item=>[item.name,...(item.aliases||[])].some(alias=>normalizeName(alias)===key))
      || trainers.filter(item=>[item.name,...(item.aliases||[])].some(alias=>normalizeName(alias).length>=2&&key.includes(normalizeName(alias)))).sort((a,b)=>b.name.length-a.name.length)[0]
      || null;
  }
  function portraitFor(name,stage,theater,trainers,ui,hint='',profiles=[],identity=''){
    if(/^(?:旁白|叙述者|系统|环境)$/.test(name))return null;
    const cast=(stage?.characters||[]).find(item=>[item.name,...(item.aliases||[])].some(alias=>normalizeName(alias)===normalizeName(name)));
    const roleText=[name,hint,cast?.gender,cast?.age,cast?.role,cast?.description,cast?.appearance].filter(Boolean).join(' ').slice(0,420);
    const manifest=trainerFor(name,trainers)||trainerFor([cast?.role,cast?.description].filter(Boolean).join(' '),trainers);
    const traits=portraitTraits(name,roleText,{...(manifest||{}),gender:['male','female'].includes(cast?.gender)?cast.gender:manifest?.gender,age:cast?.age||manifest?.age});
    const pixelArt=source=>{
      if(!source)return false;
      if(source.stagePixel===true||source.pixelArt===true||/^(?:front|back|sprite)(?:[-_ ]|$)/i.test(String(source.spriteType||'')))return true;
      if(Number(source.width)>0&&Number(source.width)<=128||Number(source.height)>0&&Number(source.height)<=128)return true;
      const image=source.stageArt||source.art||source.image;
      const matching=(trainers||[]).find(item=>item!==source&&[item.stageArt,item.art,item.image].includes(image));
      if(matching)return matching.stagePixel===true||matching.pixelArt===true||/^(?:front|back|sprite)(?:[-_ ]|$)/i.test(String(matching.spriteType||''))||Number(matching.width)>0&&Number(matching.width)<=128||Number(matching.height)>0&&Number(matching.height)<=128;
      return false;
    };
    const emotion=stage?.stage?.figures?.find(f=>f.speaker===name)?.emotion||'neutral';
    const custom=cast?.avatars?.[emotion]||cast?.sprites?.[emotion]||cast?.avatars?.neutral||cast?.sprites?.neutral||cast?.avatarUrl;
    const generated=custom&&((/plugin-assets\/dsh-card-pokemon/.test(custom)||/[?&]pack=kanto-media(?:&|$)/.test(custom))||(PACK_ROOT&&custom.startsWith(PACK_ROOT))||/^assets\//.test(custom));
    const sourceProfiles=Array.isArray(profiles)?profiles:[];
    const safeProfile=item=>Boolean(item?.image&&!pixelArt(item)&&item.displayEligible!==false&&!(item.tags||[]).some(tag=>['visual-reference-only','visual-reference'].includes(tag))&&!/(?:^|_)reference(?:_|$)/.test(item.id||'')&&item.gender===traits.gender&&ageGroup(item.age,item.roles)===traits.age);
    const roleProfiles=sourceProfiles.filter(item=>safeProfile(item)&&(item.roles||[]).some(role=>traits.roles.includes(role)));
    const sameBracket=sourceProfiles.filter(safeProfile).filter(item=>traits.role==='rocket'||traits.role==='swimmer'||traits.role==='fighter'||!(item.roles||[]).some(role=>/rocket|aqua|magma|swimmer|thug|villain/.test(role)));
    const fallbackForManifest=(manifest?.portraitFallbacks||[]).filter(item=>item&&typeof item.image==='string'&&!pixelArt(item));
    const typedCustom=cast&&['male','female'].includes(cast.gender)&&['child','teen','adult','elder'].includes(cast.age)&&Number(cast.width)>128&&Number(cast.height)>128&&!/^(?:front|back|sprite)(?:[-_ ]|$)/i.test(String(cast.spriteType||''));
    const customSource=custom&&!generated&&typedCustom?{image:custom,bounds:null,fullBody:true,width:cast.width,height:cast.height,spriteType:cast.spriteType,external:!custom.startsWith('assets/'),id:'stage-custom'}:null;
    const profileSource=item=>({image:item.image,bounds:item.displayCrop||item.artBounds,fullBody:item.fullBody,scale:item.stageScale,id:item.id});
    const knownSource=manifest&&!pixelArt(manifest)?{image:manifest.stageArt||manifest.art||manifest.image,bounds:manifest.displayCrop||manifest.artBounds,fullBody:manifest.fullBody,scale:manifest.stageScale,id:manifest.id}:null;
    // Known identities and trainer classes keep their intended art first. A custom
    // stage URL is still attempted when supplied, then the exact class/identity art.
    const manifestPixel=Boolean(manifest&&pixelArt(manifest));
    let ordered=manifest?[...(knownSource?[knownSource]:[]),...fallbackForManifest,customSource]:customSource?[customSource]:[];
    // High-resolution general art can replace a pixel-size trainer class image on
    // stage only when the catalogue has the corresponding age/gender role available.
    if(manifest&&knownSource&&manifest.stageArt)ordered[0]={...knownSource,image:manifest.stageArt};
    let remembered=portraitAssignments.get(identity);if(!remembered){try{remembered=window.localStorage?.getItem('kanto-npc-portrait:'+identity);}catch{}}
    const matches=(items)=>items.map(item=>({item,score:Math.max(0,...(item.roles||[]).map(role=>{const at=traits.roles.indexOf(role);return at<0?0:traits.specific?Math.max(10,100-at*15):10;}))+((item.tags||[]).includes('project-original')?1:0)}));
    const classMatches=matches(roleProfiles).sort((a,b)=>b.score-a.score||String(a.item.id).localeCompare(String(b.item.id))).slice(0,3).map(entry=>profileSource(entry.item));
    const bracketMatches=matches(sameBracket).sort((a,b)=>b.score-a.score||String(a.item.id).localeCompare(String(b.item.id))).slice(0,5).map(entry=>profileSource(entry.item));
    const trainerBracket=(trainers||[]).filter(item=>item!==manifest&&!pixelArt(item)&&(item.stageArt||item.art||item.image)&&item.gender===traits.gender&&ageGroup(item.age||item.ageGroup,item.portraitRoles)===traits.age&&(traits.role||!(item.portraitRoles||[]).some(role=>/rocket|aqua|magma|swimmer|thug|villain/.test(role))));
    const trainerMatches=matches(trainerBracket.map(item=>({...item,roles:item.portraitRoles||[]}))).sort((a,b)=>b.score-a.score||String(a.item.id).localeCompare(String(b.item.id))).slice(0,4).map(({item})=>({image:item.stageArt||item.art||item.image,bounds:item.displayCrop||item.artBounds,fullBody:item.fullBody,scale:item.stageScale,id:item.id}));
    if(manifest)ordered.push(...classMatches,...bracketMatches,...trainerMatches);
    else{
      let pool=roleProfiles;
      if(!pool.length)pool=sameBracket;
      if(remembered&&pool.some(item=>item.id===remembered))pool=[pool.find(item=>item.id===remembered),...pool.filter(item=>item.id!==remembered)];
      ordered.push(...matches(pool).sort((a,b)=>b.score-a.score||String(a.item.id).localeCompare(String(b.item.id))).map(entry=>profileSource(entry.item)));
      ordered.push(...bracketMatches,...trainerMatches);
    }
    const sources=[];
    const addSource=source=>{
      if(!source?.image)return;
      const isExternal=source.external||/^https?:\/\//i.test(source.image)||source.image.startsWith('/');
      const primary=isExternal?source.image:asset(ui,source.image);
      if(primary&&!sources.some(item=>item.url===primary))sources.push({url:primary,bounds:source.bounds,fullBody:source.fullBody,scale:source.scale,portraitId:source.id});
      // Retry this exact URL once with a cache buster, then move to another
      // matching portrait instead of probing a second asset root per identity.
      if(!isExternal){
        const retryUrl=primary+(primary.includes('?')?'&':'?')+'v='+VERSION+'&retry=1';
        if(!sources.some(item=>item.url===retryUrl))sources.push({url:retryUrl,bounds:source.bounds,fullBody:source.fullBody,scale:source.scale,portraitId:source.id});
      }
    };
    for(const source of ordered)addSource(source);
    if(!sources.length){
      // The catalogue is expected to cover every ordinary age/gender bracket;
      // this final exact-bracket lookup prevents an empty actor if roles drift.
      for(const item of sameBracket)addSource(profileSource(item));
    }
    let chosenId=sources.find(source=>source.portraitId)?.portraitId;
    if(!manifest&&remembered&&sources.some(source=>source.portraitId===remembered))chosenId=remembered;
    if(!manifest&&sources.length&&identity){portraitAssignments.set(identity,chosenId||'');try{window.localStorage?.setItem('kanto-npc-portrait:'+identity,chosenId||'');}catch{}if(portraitAssignments.size>1000)portraitAssignments.delete(portraitAssignments.keys().next().value);}
    const primary=sources[0]||{url:'',bounds:null,fullBody:true};
    const {portraitId:_portraitId,...primaryView}=primary;
    const generic=!manifest||manifestPixel;
    return {name,...primaryView,sources: sources.length?sources:[primary],fallbacks:sources.slice(1),generic,...(generic&&chosenId?{portraitId:chosenId}:{}),unmatched:!primary.url};
  }
  function ageGroup(age,roles=[]){
    if(['elder','senior','older-adult'].includes(age))return 'elder';
    if(['teen','teenager','youth'].includes(age)||age==='girl'&&(roles||[]).some(role=>['lass','teen-trainer','punk-girl'].includes(role))||age==='boy'&&(roles||[]).some(role=>['camper','youngster','teen-trainer'].includes(role)))return 'teen';
    return ['boy','girl','child','preschooler'].includes(age)?'child':'adult';
  }
  function portraitTraits(name,text,manifest=null){
    const title=String(name||''),source=String(text||'');
    const roles=[
      [/老奶奶|老婆婆|老太太|老妇人|老妇|祖母|外婆|老人女性|老人妇女|老年女性|老年妇女/,['elder','citizen'],'female','elder'],
      [/老爷爷|老汉|老头|老者|大爷|老人家|老人男性|老人男子|老农|老先生|老伯|年长男性|年长男子|老年男性|老年男子|绅士|老绅士/,['elder','gentleman','citizen'],'male','elder'],
      [/母亲|妈妈|妇人/,['mother','citizen','beauty','adult-female'],'female','adult'],[/乔伊|护士/,['nurse'],'female','adult'],
      [/女店员|女职员/,['shop-clerk','office-clerk','clerk','citizen','ace-trainer'],'female','adult'],[/男店员|男职员/,['shop-clerk','office-clerk','clerk','citizen','collector','ace-trainer'],'male','adult'],
      [/捕虫|男孩|小男孩|男童|小男童|短裤小子/,['bug-catcher','youngster','child-trainer'],'male','child'],[/小女孩|女孩|女童|幼儿园|女童训练家/,['preschooler','child-trainer'],'female','child'],
      [/少女|女学生|女少年|女训练家少年/,['lass','ace-trainer','teen-trainer'],'female','teen'],[/少年|男学生|男训练家少年/,['camper','youngster','teen-trainer'],'male','teen'],
      [/女士|小姐|女性|女人|女子|美女|女训练家|阿姨|婶婶|大姐|成年女性|女青年/,['beauty','citizen','ace-trainer'],'female','adult'],[/男士|男性|男人|男子|大叔|男训练家|成年男性|男青年/,['citizen','collector','ace-trainer'],'male','adult'],
      [/研究员|科学家|助手/,['scientist','researcher'],null,'adult'],[/钓鱼|渔夫|钓客|渔民/,['fisherman','outdoors'],'male','adult'],
      [/培育|育儿|饲育|饲养|育幼/,['breeder','day-care-worker'],null,'adult'],[/登山|攀岩/,['hiker','outdoors'],null,'adult'],
      [/店员|售货|店主|职员/,['shop-clerk','office-clerk','clerk','citizen','collector','beauty'],null,'adult'],
      [/水手|船员/,['sailor','outdoors','trainer'],'male','adult'],[/野餐少女|野餐者/,['camper','outdoors','trainer'],'female','teen'],[/理科男|理科生/,['scientist','researcher','trainer'],'male','adult'],[/精灵迷|宝可梦迷/,['collector','hobbyist','trainer'],'male','adult'],
      [/暴走族|机车族/,['street-thug','urban','trainer'],'male','adult'],[/祈祷师|灵媒/,['channeler','spiritualist','citizen'],'female','adult'],[/超能力者(?:（女）|\(女\))|女性超能力者|女超能力者/,['psychic','trainer','citizen'],'female','adult'],[/超能力者(?:（男）|\(男\))|男性超能力者|男超能力者/,['psychic','trainer','citizen'],'male','adult'],
      [/小偷|窃贼/,['burglar','urban','thug'],'male','adult'],[/鸟宝可梦训练家|鸟类训练家/,['bird-keeper','outdoors','trainer'],'male','adult'],[/路霸/,['street-thug','thug','trainer'],'male','adult'],[/工程师/,['engineer','scientist','worker'],'male','adult'],[/魔术师|杂耍师/,['juggler','entertainer','trainer'],'male','adult'],
      [/火箭队/,['team-rocket','rocket-grunt','rocket'],null,'adult'],[/泳装|游泳|泳者/,['swimmer'],null,'adult'],[/格斗|空手道/,['black-belt','fighter'],null,'adult'],
      [/训练家|训练者|对手/,['trainer','ace-trainer','citizen'],null,'adult'],[/外套|夹克|来客|居民|路人/,['citizen','ace-trainer','collector'],null,'adult']
    ];
    const chosen=roles.find(([pattern])=>pattern.test(title+' '+source));
    let gender=chosen?.[2]||(['female','male'].includes(manifest?.gender)?manifest.gender:null);
    if(!gender){
      if(/老奶奶|老婆婆|老太太|老妇|外婆|奶奶|小黄|老年女性|老年妇女|女(?:研究员|科学家|助手|工人|训练家|培育家|店员|职员|子|人|性|青年|学生)|女人|女子|女性|女士|少女|女孩|女童|她(?:的|说|问|看|笑|点头|站|坐|走|提|拿|拄|朝|向|在|把|正)/u.test(title+' '+source))gender='female';
      else if(/老爷爷|老汉|老头|老者|大爷|老伯|老先生|老年男性|老年男子|男(?:研究员|科学家|助手|工人|训练家|培育家|店员|职员|子|人|性|青年|学生)|男人|男子|男性|男士|少年|男孩|男童|他(?:的|说|问|看|笑|点头|站|坐|走|提|拿|拄|朝|向|在|把|正)/u.test(title+' '+source))gender='male';
    }
    if(!gender){let hash=0;for(const ch of title)hash=(hash*31+ch.charCodeAt(0))>>>0;gender=hash%2?'female':'male';}
    let age=chosen?.[3]||manifest?.age||manifest?.ageGroup||null;
    if(!age){
      if(/(?:老年|年迈|年长|老人|长者|老人家|老汉|老奶奶|老妇|老爷爷)/u.test(title+' '+source))age='elder';
      else if(/(?:小孩|兒童|儿童|男童|女童|男孩|女孩|幼儿园|小黄儿童)/u.test(title+' '+source))age='child';
      else if(/(?:少年|少女|青少年|中学生|学生)/u.test(title+' '+source))age='teen';
      else age='adult';
    }
    return {gender,specific:Boolean(chosen),age,roles:chosen?.[1]||manifest?.portraitRoles||['citizen','ace-trainer','beauty','collector','trainer'],role:/火箭队/u.test(title+' '+source)?'rocket':/泳/u.test(title+' '+source)?'swimmer':/格斗|空手道/u.test(title+' '+source)?'fighter':null};
  }
  function Portrait({person,speaking=false,pokemon=false,reducedMotion=false}){
    const sources=Array.isArray(person.sources)&&person.sources.length?person.sources:[person];
    const [sourceIndex,setSourceIndex]=useState(0),[failed,setFailed]=useState(false),actorRef=useRef(null);
    useEffect(()=>{setSourceIndex(0);setFailed(false);},[sources.map(source=>source.url).join('|')]);
    const shiny=Boolean(pokemon&&person.shiny);
    useEffect(()=>{
      if(!shiny||!actorRef.current)return;
      const actor=actorRef.current,play=window.KantoShinyFx?.playEntry;
      if(reducedMotion){actor.classList?.add('kanto-shiny-reduced-motion');return()=>actor.classList?.remove('kanto-shiny-reduced-motion');}
      if(typeof play==='function')return play.call(window.KantoShinyFx,actor,{seed:person.shinySeed||person.uid||person.name,side:person.side,uid:person.uid,reducedMotion,speed:person.speed||1});
      actor.classList?.add('kanto-shiny-entry');return()=>actor.classList?.remove('kanto-shiny-entry');
    },[shiny,person.shinySeed,person.uid,person.name,person.side,reducedMotion,window.KantoShinyFx]);
    const source=sources[Math.min(sourceIndex,sources.length-1)]||person,b=source.bounds;
    const onError=()=>{if(sourceIndex+1<sources.length)setSourceIndex(sourceIndex+1);else setFailed(true);};
    const retry=()=>{setFailed(false);setSourceIndex(0);};
    const accessibleName=shiny?`闪光${person.name}，宝可梦`:person.name;
    return h('div',{ref:actorRef,className:'kanto-actor'+(pokemon?' is-pokemon':speaking?' is-speaking':' is-muted')+(shiny?' kanto-shiny-pokemon':''),'data-speaker':person.name,'data-shiny':shiny||undefined,role:shiny?'img':undefined,'aria-label':shiny?accessibleName:undefined,style:source.scale?{height:Math.round(source.scale*100)+'%'}:source.fullBody===false?{height:'62%',maxHeight:'440px'}:undefined,title:shiny?accessibleName:person.generic?person.name+'（通用训练家立绘）':person.name},
      failed||!source.url?h('div',{className:'kanto-person-missing',role:'status'},h('span',null,person.name),h('small',null,'立绘加载失败'),h('button',{type:'button',onClick:retry,'aria-label':`重试载入${person.name}的立绘`},'重试立绘')):b?h('svg',{viewBox:`${b.x} ${b.y} ${b.width} ${b.height}`,preserveAspectRatio:'xMidYMax meet',role:'img','aria-label':accessibleName},h('image',{href:source.url,width:b.canvasWidth,height:b.canvasHeight,onError}))
        :h('img',{src:source.url,alt:accessibleName,draggable:false,onError}));
  }
  const MARKER=/【(?:查看训练家状态|打开背包|打开商店|查看任务|进入本轮战斗)】/g;
  function markerMode(marker){return ({'【查看训练家状态】':'party','【打开背包】':'bag','【打开商店】':'shop','【查看任务】':'quests'})[marker]||'battle';}
  function actionOptions(data){
    const all=[...(data?.facilities?.options||[]),...(data?.fieldServices?.options||[]),...(data?.theater?.options||[])];
    const seen=new Set();return all.filter(option=>/^facility-|^field-/.test(option?.id||'')).filter(option=>{
      const key=option.id+':'+JSON.stringify(option.payload||{});if(seen.has(key))return false;seen.add(key);return true;
    });
  }
  function findFacilityPrimary(facility, data){
    let target=String(facility?.primaryAction||'');
    if(facility?.id==='fighting-dojo')target='field-challenge-dojo';
    const available=[...(data?.theater?.options||[]),...(data?.fieldServices?.options||[]),...(data?.facilities?.options||[])];
    if(target.startsWith('challenge-gym:')){
      const gym=Number(target.split(':')[1]);return available.find(option=>option.id==='challenge-gym'&&Number(option.payload?.gym)===gym)||null;
    }
    return available.find(option=>option.id===target||option.payload?.eventId===target||option.payload?.deepQuestId===target)||null;
  }
  function facilityService(data, facilityOption){
    const facility=(data?.facilities?.facilities||[]).find(item=>item.id===facilityOption?.payload?.facilityId);
    if(!facility)return null;
    const id=facility.id,local=actionOptions(data),primary=findFacilityPrimary(facility,data),serviceChoices=[];
    const add=option=>{if(option&&!serviceChoices.some(item=>item.id===option.id&&JSON.stringify(item.payload||{})===JSON.stringify(option.payload||{})))serviceChoices.push({...option,immediate:!['kanto-story-event','campaign-choice','deep-quest-accept'].includes(option.id)});};
    add(primary);
    if(facility.kind==='game-corner')local.filter(option=>['facility-coin-case','facility-buy-coins','facility-claim-prize','facility-claim-pokemon'].includes(option.id)).forEach(add);
    if(facility.kind==='safari')local.filter(option=>option.id.startsWith('facility-safari-')).forEach(add);
    if(facility.kind==='department-store')local.filter(option=>option.id.startsWith('facility-department-')||option.id==='facility-rooftop-trade').forEach(add);
    if(facility.kind==='dojo')local.filter(option=>option.id==='field-challenge-dojo'||option.id==='challenge-gym').forEach(add);
    local.filter(option=>option.id.startsWith('field-')||option.id.startsWith('facility-claim-')&&(facility.kind==='game-corner'||option.id===facility.primaryAction)).forEach(add);
    const parts=[facility.description,data?.facilities?.context].filter(Boolean);
    const wallet=data?.facilities?.gameCorner;
    if(facility.kind==='department-store'){
      const department=data?.facilities?.departmentStore,floor=department?.floors?.find(row=>row.id===department.floor);
      parts.push('当前楼层：'+(floor?.name||department?.floor||'2F')+' · 余额 ₽'+(data?.world?.训练家?.金钱||0));
      if(department?.floor==='rooftop')parts.push((department.exchange||[]).map(row=>`${row.drinkName} ×${department.drinks?.[row.drinkId]||0} · ${row.claimed?'已兑换':row.rewardName||row.rewardId}`).join('\n'));
    }
    if(facility.kind==='game-corner'&&wallet)parts.push(wallet.coinCase?`代币盒：${wallet.coins} 枚代币。`:'还没有代币盒。');
    const safari=data?.facilities?.safari;
    if(facility.kind==='safari'&&safari)parts.push(safari.status==='active'?`狩猎进行中：${safari.balls} 个狩猎球，剩余 ${safari.steps} 步。${safari.encounter?`当前目标 Lv.${safari.encounter.level}（图鉴 ${safari.encounter.speciesId}）。`:'当前没有野生遭遇。'}`:`狩猎状态：${safari.status==='finished'?'本次已结束':'尚未入园'}。`);
    return {facilityId:id,title:facility.name,speaker:facility.name,sceneTag:facility.sceneTag,musicEvent:id==='game-corner'?'gameCorner':id==='department-store'?'mart':undefined,text:'请选择一项服务。',summary:parts.join('\n'),choices:serviceChoices};
  }
  function facilityReceipt(result, action, payload={}){
    const world=result?.world||{},state=world?.城市设施||{},rev=payload?.revision;
    const row=Number.isSafeInteger(rev)?state.receipts?.[`r${rev}`]:null;
    return row?.action===action?row.result:'';
  }
  function questService(data,action,payload={},after=false){
    const world=data?.world||{},deep=action.startsWith('deep-quest-'),id=deep?payload.deepQuestId:payload.questId;
    const detail=deep?data?.gadgets?.quests?.find(quest=>quest.id===id):null;
    const task=world.任务?.find(task=>deep?task.id==='deep-quest:'+id:task.category==='npc-quest'&&task.questId===id);
    const stored=data?.questActionResult||world.剧情?.委托回执;
    const receipt=after&&stored?.action===action&&stored?.questId===id?stored:null;
    const record=deep?world.委托?.深度记录?.[id]:world.委托?.记录?.[id];
    const choices=[];
    if(deep&&detail?.status==='unaccepted')for(const choice of detail.choices||[])choices.push({id:'deep-quest-accept',label:'选择方案并接取：'+choice.label,enabled:choice.enabled,reason:choice.reason,payload:{...choice.payload,deepQuestId:id,choiceId:choice.id},immediate:true});
    if(deep&&detail?.status==='ready'&&detail.action)choices.push({...detail.action,immediate:true});
    const stage=detail?.currentStage,completed=record?.status==='completed';
    const text=[receipt?.result,!after&&(detail?.description||task?.描述),action==='deep-quest-accept'&&after&&record?.choiceEcho,stage&&!completed&&stage.description,completed&&(receipt?.ending||record?.ending)].filter(Boolean).join('\n');
    const summary=[detail?.title||task?.标题||receipt?.title||'委托',stage&&!completed&&`当前阶段：${stage.title}`,completed?'已完成':task?.状态,detail?.rewardPreview||task?.奖励预告||receipt?.rewardPreview].filter(Boolean).join(' · ');
    const rocket=/rocket|silph/.test(id||''),camp=/camp/.test(id||'');
    return {questId:id,speaker:detail?.npcName||task?.委托人||receipt?.npcName||'委托人',portraitId:detail?.npcId||receipt?.npcId,sceneTag:rocket?'rocket-base':camp?'camp':undefined,musicEvent:rocket?'rocketInvestigation':camp?'campRest':'questBriefing',text:text||'委托记录已更新，可在任务页查看当前目标。',summary,choices};
  }
  function storyRewardText(reward,detail=false){
    if(typeof reward==='string')return reward;
    if(!reward)return '';
    const gadgets=(reward.gadgets||[]).map(item=>`${item.name||item.id}${item.alreadyUnlocked?'（已拥有）':''}${detail&&item.description?'：'+item.description:''}`);
    const items=(reward.items||[]).map(item=>`${item.name||item.id} ×${item.count}`);
    const alternatives=(reward.alternatives||[]).map(item=>`已有机制替代：${item.name||item.id} ×${item.count}`);
    return [...gadgets,...items,...alternatives].join(detail?'\n':' · ');
  }
  function storyService(data,action,payload={}){
    if(action==='kanto-story-event'){
      const event=data?.storyEvents?.events?.find(item=>item.id===payload.eventId);if(!event)return null;
      return {speaker:event.speaker,portraitId:event.portraitId,text:event.text,summary:event.title,
        sceneTag:event.sceneTag,musicEvent:event.musicEvent,
        choices:[...(event.status==='available'?[{id:'story-converse',label:'和'+event.speaker+'继续交谈',payload:{eventId:event.id}}]:[]),
          ...(event.choices||[]).map(choice=>({id:action,label:choice.label,enabled:choice.enabled,reason:choice.reason,rewardPreview:choice.rewardPreview,payload:{eventId:event.id,...choice.payload,choiceId:choice.id},immediate:true}))]};
    }
    const scene=data?.campaign?.context?.scene;
    if(!scene)return null;
    const prologue=action==='campaign-prologue',target=prologue?{prologue:true}:{chapterId:payload.chapterId};
    if(!prologue&&scene.id!==payload.chapterId)return null;
    return {speaker:scene.actor?.name||scene.speakers?.[0]?.name,portraitId:scene.actor?.id||scene.speakers?.[0]?.id,
      sceneTag:scene.sceneTag,musicEvent:scene.musicEvent,text:[scene.trigger,scene.summary,scene.conflict].filter(Boolean).join('\n'),summary:scene.title,
      choices:[{id:'story-converse',label:'继续这段交谈',payload:target},...(prologue?[{id:action,label:'记录约定，继续旅程',payload,rewardPreview:scene.rewardPreview,immediate:true}]:(scene.choices||[]).map(choice=>({id:action,label:choice.label+(choice.tradeoff?' · '+choice.tradeoff:''),payload:{chapterId:scene.id,choiceId:choice.id},rewardPreview:choice.rewardPreview,immediate:true})))]};
  }
  function serviceReceiptText(action,result,payload={},label=''){
    const world=result?.world||{},fac=result?.facilities||{},safari=fac.safari||world?.城市设施?.safari||{},receipt=facilityReceipt(result,action,payload);
    const target=safari.encounter?`目标：${safari.encounter.name||'图鉴 '+safari.encounter.speciesId}，Lv.${safari.encounter.level}。`:'';
    if(action==='facility-buy-coins')return `购买完成：当前代币 ${fac.gameCorner?.coins??world?.城市设施?.gameCorner?.coins??0} 枚；余额 ₽${world?.训练家?.金钱??0}。`;
    if(action==='facility-coin-case')return '代币盒已领取。';
    if(action==='facility-claim-prize')return `${label||'兑换完成'}，剩余代币 ${fac.gameCorner?.coins??world?.城市设施?.gameCorner?.coins??0} 枚。`;
    if(action==='facility-claim-pokemon')return `${label||'兑奖宝可梦'}已加入队伍或电脑；剩余代币 ${fac.gameCorner?.coins??0} 枚。`;
    if(action==='facility-department-floor')return '已到达'+(fac.departmentStore?.floors?.find(row=>row.id===fac.departmentStore.floor)?.name||fac.departmentStore?.floor||'所选楼层')+'。';
    if(action==='facility-department-buy')return `购买完成，物品已加入背包。余额 ₽${world?.训练家?.金钱??0}。`;
    if(action==='facility-rooftop-trade')return '饮料已交给小女孩，学习器已放入背包。这份礼物只能领取一次。';
    if(action==='facility-safari-enter')return `进入狩猎地带：${safari.balls??0} 个狩猎球，${safari.steps??0} 步。`;
    if(action==='facility-safari-step')return receipt.startsWith('safari-encounter-')?`发现野生宝可梦（图鉴 ${receipt.slice('safari-encounter-'.length)}，Lv.${safari.encounter?.level??'?' }）。剩余 ${safari.steps??0} 步。`:receipt==='safari-no-encounter'?`这次没有遇见宝可梦。剩余 ${safari.steps??0} 步。`: `本次狩猎已结束。剩余 ${safari.steps??0} 步。`;
    if(action==='facility-safari-throw'){
      const caught=[...(world?.队伍||[]),...(world?.电脑||[])].filter(mon=>mon?.捕获地点==='safari'&&String(mon.uid||'').startsWith('caught-safari-')).at(-1);
      return receipt==='safari-caught'?`成功收服图鉴 ${caught?.图鉴编号??'目标'}！狩猎球剩余 ${safari.balls??0} 个，步数剩余 ${safari.steps??0}。`:receipt==='safari-target-fled'?`目标逃走了。狩猎球剩余 ${safari.balls??0} 个，步数剩余 ${safari.steps??0}。`:`没有收服目标。${target}狩猎球剩余 ${safari.balls??0} 个，步数剩余 ${safari.steps??0}。`;
    }
    if(action==='facility-safari-bait'||action==='facility-safari-rock'||action==='facility-safari-watch')return receipt==='safari-target-fled'?`目标逃走了。狩猎球剩余 ${safari.balls??0} 个，步数剩余 ${safari.steps??0}。`:`行动结果：${action==='facility-safari-bait'?'已投下诱饵':action==='facility-safari-rock'?'已投出石头':'已经观察目标'}。${target}狩猎球 ${safari.balls??0} 个，剩余 ${safari.steps??0} 步。`;
    if(action==='facility-safari-run')return `已从遭遇中离开。狩猎球 ${safari.balls??0} 个，剩余 ${safari.steps??0} 步。`;
    if(action==='facility-safari-exit')return '本次狩猎结束，已返回浅红市。';
    const hiddenNames={leftovers:'剩饭',soothebell:'安抚之铃',machobrace:'强制锻炼器'};
    const fieldReceipts={'field-claim-tea':'公馆的老妇人递给你一杯热茶：请带给金黄市门口辛苦值守的警卫。热茶已放入关键物品。','field-claim-itemfinder':'探宝器已放入关键物品。','field-search-itemfinder':`找到${hiddenNames[payload.item]||label||payload.item||'隐藏物品'}。`,'field-claim-oldamber':'秘密琥珀已放入关键物品。','field-choose-fossil':`已选择${payload.item==='helixfossil'?'贝壳化石':'甲壳化石'}。`,'field-revive-fossil':'化石已交给研究员，下一故事轮可以回来领取。','field-claim-revived-fossil':`${label||'复活宝可梦'}已加入队伍或电脑。`,'field-choose-dojo-gift':`${label||'格斗宝可梦'}已加入队伍或电脑。`};
    return fieldReceipts[action]||label||world?.剧情?.剧场?.对白||'服务状态已更新。';
  }
  const SPEECH_VERB='(?:说道|问道|喊道|笑道|答道|回道|低声说|笑着说|说着|回答|提醒道|说|问|喊|答|道)';
  const GENERIC_SPEAKER=/(?:捕虫少年|捕虫者|老汉|老翁|老头|老人家|老人|老妇人|老妇|老奶奶|老爷爷|老太太|男店员|女店员|店员|店主|男研究员|女研究员|研究员|警卫|水手|渔夫|男孩|女孩|小男孩|小女孩|少年|少女|训练家|博士|护士|服务员|父亲|母亲|爸爸|妈妈|乔伊小姐|君莎小姐)/g;
  function knownSpeaker(candidate,stage,trainers,playerName){
    const key=normalizeName(candidate),player=normalizeName(playerName);if(!key)return '';
    const known=[...(stage?.characters||[]),...(trainers||[])].flatMap(item=>[item?.name,...(item?.aliases||[])].filter(Boolean));
    const match=known.filter(name=>{const alias=normalizeName(name);return alias.length>=2&&(key===alias||key.includes(alias));}).sort((a,b)=>normalizeName(b).length-normalizeName(a).length)[0];
    if(match)return normalizeName(match)===player?'':String(match);
    const roles=[...candidate.matchAll(GENERIC_SPEAKER)].map(item=>item[0]).sort((a,b)=>b.length-a.length);
    return roles[0]&&normalizeName(roles[0])!==player?roles[0]:'';
  }
  function quotedSpeech(text,stage,trainers,playerName){
    const value=String(text||'');
    const before=value.match(new RegExp('(?:^|[。！？!?\\n])\\s*([^。！？!?\\n“”「」]{1,64}?)\\s*'+SPEECH_VERB+'[：:,，]?\\s*[“「]([^”」\\n]{1,600})[”」]','u'));
    if(before){const speaker=knownSpeaker(before[1],stage,trainers,playerName);if(speaker)return {speaker,text:before[2].trim(),narration:value.slice(0,before.index).trim()};}
    const after=value.match(new RegExp('[“「]([^”」\\n]{1,600})[”」]\\s*[，,。]?\\s*([^。！？!?\\n“”「」]{1,48}?)\\s*'+SPEECH_VERB,'u'));
    if(after){const speaker=knownSpeaker(after[2],stage,trainers,playerName);if(speaker)return {speaker,text:after[1].trim(),narration:(value.slice(0,after.index)+' '+value.slice(after.index+after[0].length)).trim()};}
    return null;
  }
  function quoteOnly(text){return /^\s*[“「][\s\S]*[”」]\s*[。！？!?，,；;]*\s*$/.test(String(text||''));}
  function inferDialogue(text,beats,index,stage,trainers,playerName){
    const direct=quotedSpeech(text,stage,trainers,playerName);if(direct)return direct;
    if(!quoteOnly(text))return null;
    for(let at=index-1;at>=0;at--){
      const row=beats?.[at],previous=stripStagePayload(row?.text||'');if(!row||!previous)break;
      if(row.speaker&&quoteOnly(previous))return {speaker:String(row.speaker),text:String(text).trim(),narration:''};
      const attributed=quotedSpeech(previous,stage,trainers,playerName);if(attributed)return {speaker:attributed.speaker,text:String(text).trim(),narration:''};
      if(quoteOnly(previous))continue;
      const mention=knownSpeaker(previous,stage,trainers,playerName);if(mention)return {speaker:mention,text:String(text).trim(),narration:''};
      break;
    }
    return null;
  }
  function TheaterScene({ctx,gameId,stage,theater,stageAssets,beat,beats,index,advance,footer,notice,onMode,onServiceChoice,sceneRef,scene,service,busy,playerName,battleOver=false,defeat=null,reducedMotion=false}){
    const current=service||beat||(beats||[])[index],raw=String(current?.text||''),hidden=isStageDataRow(current,beats);
    const beatText=stripStagePayload(hidden?'':raw),theaterText=String(theater?.dialogue||'').trim();
    let text=beatText||theaterText||'……',narration='';
    const trainers=stageAssets?.trainers||[],explicitSpeaker=String(current?.speaker||'');
    const inferred=!explicitSpeaker&&!service?inferDialogue(beatText,beats,index,stage,trainers,playerName):null;
    let speaker=explicitSpeaker||inferred?.speaker||(!service&&!beatText&&theaterText&&['oak-lab','rival-opening'].includes(theater?.id)?theater?.person?.name:'')||'';
    if(inferred){text=inferred.text||text;narration=inferred.narration||'';}
    const nativeFigures=(stage?.stage?.figures||[]).map(item=>item.speaker).filter(Boolean);
    const playerKey=normalizeName(playerName),names=service?.facilityId?[]:[...new Set([...(speaker&&normalizeName(speaker)!==playerKey?[speaker]:[]),...nativeFigures.filter(name=>name!==speaker&&normalizeName(name)!==playerKey&&text.includes(name))])].slice(0,2);
    if(!names.length&&theater?.person?.name&&(text.includes(theater.person.name)||theater.id==='oak-lab'||theater.id==='rival-opening'))names.push(theater.person.name);
    const actors=names.map(name=>{
      const pool=theater?.pokemon||[];
      const mon=pool.find(item=>normalizeName(item.name)===normalizeName(name))
        ||pool.find(item=>String(item.id)===String(name).replace(/^野生的?/,''))
        ||(stageAssets?.species||[]).find(item=>[item.name,item.english].some(alias=>normalizeName(alias)===normalizeName(name.replace(/^野生的?/,''))));
      // 闪光标记可能只在队伍那一份上：图鉴目录回退时按编号把它找回来。
      const shiny=Boolean(mon&&(mon.shiny===true||mon.闪光===true||pool.some(item=>String(item.id)===String(mon.id)&&(item.shiny===true||item.闪光===true))));
      const explicit=name===speaker&&current?.portraitId?trainers.find(entry=>entry.id===current.portraitId):null;
      const contextualOak=name==='博士'&&(trainerFor(theater?.person?.name,trainers)?.id==='oak'||theater?.id==='oak-lab');
      const portraitIdentity=explicit?.name||(contextualOak?'大木博士':name);
      const person=mon?{name,url:asset(ctx.tavernUi,`assets/pokemon/${shiny?'shiny/':''}artwork/${mon.id}.png`),pokemon:true,shiny,shinySeed:mon.uid||mon.id,uid:mon.uid}:portraitFor(portraitIdentity,stage,theater,trainers,ctx.tavernUi,raw,stageAssets?.npcPortraits?.entries||[],gameId+':'+name);
      return person?{...person,name}:null;
    }).filter(Boolean);
    const mons=(theater?.pokemon||[]).filter(mon=>!actors.some(person=>person.url===asset(ctx.tavernUi,`assets/pokemon/${isShinyMon(mon)?'shiny/':''}artwork/${mon.id||mon}.png`))).slice(0,actors.length>1?1:2);
    const tagged=service?.sceneTag?(stageAssets?.scenery||[]).filter(item=>item.sceneTags?.includes(service.sceneTag)):[];
    const override=tagged.sort((a,b)=>(b.scenePriority||0)-(a.scenePriority||0)||Number(!!b.generated)-Number(!!a.generated))[0];
    const background=override?asset(ctx.tavernUi,override.image):scene?.sceneryImage?asset(ctx.tavernUi,scene.sceneryImage):theater?.backgroundImage?asset(ctx.tavernUi,theater.backgroundImage):String(stage?.background||'');
    const parts=text.split(/(【(?:查看训练家状态|打开背包|打开商店|查看任务|进入本轮战斗)】)/g);
    return h('div',{ref:sceneRef,className:'kanto-theater',onClick:()=>advance?.()},
      h('div',{key:background,className:'kanto-theater-bg',style:background?{backgroundImage:`url("${background}")`}:undefined}),
      h('div',{className:'kanto-cast'},actors.map(person=>h(Portrait,{key:person.name,person,pokemon:person.pokemon,speaking:!speaker||person.name===speaker,reducedMotion})),mons.map((mon,i)=>h(Portrait,{key:'mon'+i,pokemon:true,reducedMotion,person:{name:mon.name||'',url:asset(ctx.tavernUi,`assets/pokemon/${isShinyMon(mon)?'shiny/':''}artwork/${mon.id||mon}.png`),shiny:isShinyMon(mon),shinySeed:mon.uid||mon.id,uid:mon.uid}}))),
      service?.effect?h('span',{key:service.effect.key,className:'kanto-safari-prop is-'+service.effect.kind,style:{animationDuration:service.effect.duration+'ms'},'aria-hidden':true}):null,
      notice?h('p',{className:'kanto-note',role:'status'},notice):null,
      h('div',{className:'kanto-theater-box',onClick:e=>{if(service||e.target.closest?.('button,a,input,select,textarea,summary'))e.stopPropagation();}},
        defeat&&!service?h('div',{className:'kanto-defeat',role:'status'},h('p',null,'队伍全部倒下了。'),defeat.heal?h('button',{type:'button',className:'kanto-action',disabled:busy,onClick:defeat.heal},'去宝可梦中心恢复'):h('p',null,'这里没有宝可梦中心，在输入框写下一步，让剧情带你去找。')):null,
        speaker?h('span',{className:'kanto-theater-name'},speaker):null,
        service?.summary?h('p',{className:'kanto-service-summary'},service.summary):null,
        narration?h('p',{className:'kanto-theater-text kanto-theater-narration'},narration):null,
        h('p',{className:'kanto-theater-line kanto-theater-text'},parts.map((part,i)=>/^【/.test(part)?battleOver&&markerMode(part)==='battle'?h('button',{key:i,type:'button',className:'kanto-action',disabled:true,title:'这场战斗已经结算，推进剧情后再开新的一场。'},'本轮战斗已结束'):h('button',{key:i,type:'button',className:'kanto-action',onClick:()=>onMode(markerMode(part))},part.replace(/[【】]/g,'')):part)),
        service?.choices?.length?h('div',{className:'kanto-story-choices','aria-busy':busy||false},service.choices.map((choice,i)=>h('span',{key:i},h('button',{type:'button',className:'kanto-action',title:choice.reason||'',disabled:busy||choice.enabled===false,onClick:()=>onServiceChoice?.(choice)},choice.label),storyRewardText(choice.rewardPreview)?h('details',{className:'kanto-story-reward'},h('summary',null,'奖励：'+storyRewardText(choice.rewardPreview)),h('p',{style:{whiteSpace:'pre-wrap'}},storyRewardText(choice.rewardPreview,true))):null))):null,
        h('div',{className:'kanto-theater-controls'},service?h('button',{type:'button',onClick:()=>advance?.()},'返回剧情'):footer)));
  }

  function NativeStage({ctx,gameId,stage,beats,index,beat,fullscreen,advance,footer,sceneRef}){
    const ui=ctx.tavernUi,[data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0),[,paint]=useState(0);
    const [modelCatalog,setModelCatalog]=useState(null),[socialOpen,setSocialOpen]=useState(false),[questsOpen,setQuestsOpen]=useState(false),[stageAssets,setStageAssets]=useState(null),[musicEnabled,setMusic]=useState(()=>ui.getMusicState?.()?.enabled!==false),[effectsEnabled,setEffects]=useState(()=>sessions.get(gameId)?.preferences?.effects!==false);
    const [animationSpeed,setSpeed]=useState(()=>sessions.get(gameId)?.preferences?.speed||1),[reducedEffects,setReduced]=useState(()=>sessions.get(gameId)?.preferences?.reducedEffects===true),[preview,setPreview]=useState(()=>sessions.get(gameId)?.actionDraft||null);
    const head=useRef({}),entered=useRef(new Set()),shared=sessions.get(gameId)||{},mode=shared.mode||'story';
    const refresh=()=>setRevision(v=>v+1),change=next=>{sessions.set(gameId,{...(sessions.get(gameId)||{}),mode:next});notify(gameId);};
    useEffect(()=>{const fn=id=>{if(id===gameId)paint(v=>v+1);};listeners.add(fn);return()=>listeners.delete(fn);},[gameId]);
    useEffect(()=>{sessions.set(gameId,{...(sessions.get(gameId)||{}),preferences:{speed:animationSpeed,effects:effectsEnabled,reducedEffects}});},[gameId,animationSpeed,effectsEnabled,reducedEffects]);
    useEffect(()=>{let active=true;staticRequest('stage-assets',gameId,()=>ui.callHost(PLUGIN+'/stage-assets',{gameId})).then(value=>{if(active){PACK_ROOT=value?.assetRoot||PACK_ROOT;setStageAssets(value);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[gameId]);
    useEffect(()=>{ui.callHost(PLUGIN+'/models',{gameId}).then(setModelCatalog).catch(()=>setModelCatalog({available:false,groups:[]}));},[gameId]);
    useEffect(()=>{sessions.set(gameId,{...(sessions.get(gameId)||{}),actionDraft:preview});},[gameId,preview]);
    useEffect(()=>ui.watchMusic?.(value=>setMusic(value.enabled!==false)),[gameId]);
    useEffect(()=>ui.watchTurnState?.(gameId,value=>{const previous=head.current;head.current=value||{};if(previous.textVersion&&previous.textVersion!==head.current.textVersion){sessions.set(gameId,{...(sessions.get(gameId)||{}),serviceScene:null,actionDraft:null});setPreview(null);notify(gameId);}if(previous.turn!==head.current.turn||previous.textVersion!==head.current.textVersion||previous.busy!==head.current.busy||previous.settled!==head.current.settled)refresh();}),[gameId]);
    useEffect(()=>{let active=true;ui.callHost(PLUGIN+'/mvu',{gameId,view:'stage'}).then(v=>{if(active){setData(v);setError('');}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[gameId,revision]);
    useEffect(()=>{if(!data||data.writable||typeof ui.watchTurnState==='function')return;const timer=setTimeout(refresh,4000);return()=>clearTimeout(timer);},[data,revision]);
    const world=data?.world,theater=data?.theater,options=theater?.options||[],starters=options.filter(option=>option.id==='starter');
    const finished=world?.战斗?.状态==='finished';
    // A settled battle (result written or rewarded) cannot be entered again: enter-battle only recovers a
    // finished battle that has neither, so the story marker stops offering it rather than failing on click.
    const battleOver=finished&&(world.战斗.已奖励===true||Boolean(world.战斗.结果));
    // A lost battle leaves the whole party fainted and nothing else happens; say so on the stage and offer
    // the center here when there is one, instead of leaving only a greyed-out challenge to explain it.
    const defeated=battleOver&&world.战斗.结果==='lose'&&!world.队伍?.some(mon=>mon.当前HP>0);
    // API 7 stage data carries the native BGM cue (including null for silence).
    // The host owns that player in chat and fullscreen; legacy plugin music is
    // a separate transport, so never start it alongside the native owner.
    const musicManaged=Number(ui.apiVersion)>=7&&Object.prototype.hasOwnProperty.call(stage||{},'music');
    const track=storyTrack(data,stageAssets?.audio,shared.serviceScene||beat),trackUrl=track?asset(ui,track.file):'';
    useEffect(()=>{if(musicManaged||mode==='battle'||!trackUrl)ui.stopMusic?.();else ui.playMusic?.({url:trackUrl,title:track.track,volume:.42});},[gameId,musicManaged,mode==='battle',trackUrl]);
    useEffect(()=>()=>ui.stopMusic?.(),[gameId]);
    const hiddenNow=isStageDataRow(beat,beats);
    const advanceScene=()=>{if((sessions.get(gameId)||{}).serviceScene){sessions.set(gameId,{...(sessions.get(gameId)||{}),serviceScene:null});notify(gameId);return;}let target=index+1;while(target<(beats?.length||0)-1&&isStageDataRow(beats[target],beats))target++;for(let n=0;n<Math.min(400,Math.max(1,target-index));n++)advance?.();};
    useEffect(()=>{if(hiddenNow&&mode==='story'&&index<(beats?.length||0)-1)advanceScene();},[index,hiddenNow,mode]);
    // Read the arrival scene before switching this same viewport into its MVU battle.
    const lastBeat=!beats?.length||index>=beats.length-1;
    const onCurrentTurn=!beats?.length||beat?.turn===data?.turn;
    const readyCue=onCurrentTurn&&(/【进入本轮战斗】/.test(String(beat?.text||''))||lastBeat);
    const roundKey=`${gameId}:${world?.战斗?.轮次}:${data?.turn}`;
    useEffect(()=>{
      if(mode!=='story'||!data?.writable||!readyCue||preview||busy)return;
      if(world?.战斗?.状态==='pending'&&world.战斗.剧情入场&&!starters.length&&!entered.current.has(roundKey)){
        const timer=setTimeout(()=>{entered.current.add(roundKey);change('battle');},Math.min(6500,Math.max(2200,String(beat?.text||'').length*55)));
        return()=>clearTimeout(timer);
      }else if(lastBeat&&world?.剧情?.最近行动?.action==='visit-shop'){
        const key='shop:'+world.剧情.最近行动.turn;if(!entered.current.has(key)){entered.current.add(key);change('shop');}
      }
    },[mode,data?.writable,readyCue,roundKey,index,world?.战斗?.剧情入场,world?.剧情?.最近行动?.turn,preview,busy]);
    useEffect(()=>{if(mode==='battle'&&starters.length)change('story');},[mode,starters.length]);
    useEffect(()=>{
      const view=sceneRef?.current?.ownerDocument?.defaultView||window;
      const escape=event=>{if(event.key!=='Escape'||event.defaultPrevented||busy)return;if(/INPUT|SELECT|TEXTAREA/.test(event.target?.tagName||'')){event.target.blur?.();return;}if(mode!=='story'){change('story');event.preventDefault();}else if((sessions.get(gameId)||{}).serviceScene){sessions.set(gameId,{...(sessions.get(gameId)||{}),serviceScene:null});notify(gameId);event.preventDefault();}};
      view.addEventListener('keydown',escape);return()=>view.removeEventListener('keydown',escape);
    },[mode,gameId,busy]);
    const button=(label,click,disabled=false,className='kanto-action')=>h('button',{type:'button',className,onClick:e=>{e.stopPropagation();click();},disabled},label);
    const prepare=async option=>{
      if(busy||!data?.writable)return;if(option.enabled===false&&!(option.id==='deep-quest-accept'&&!option.immediate)){setError(option.reason||'当前条件尚未满足。');return;}if(option.id==='start-battle'){requestMode('battle');return;}
      const showService=scene=>{sessions.set(gameId,{...(sessions.get(gameId)||{}),serviceScene:scene});notify(gameId);};
      if(option.id==='facility-info'){
        const scene=facilityService(data,option);
        if(!scene){setError('这个设施目前没有可打开的本地服务。');return;}
        showService(scene);return;
      }
      if(!option.immediate&&['kanto-story-event','campaign-choice','campaign-prologue'].includes(option.id)){
        const scene=storyService(data,option.id,option.payload);if(scene)showService(scene);else setError('这段剧情资料还未载入，请重新读取。');return;
      }
      if(!option.immediate&&option.id==='deep-quest-accept'){
        showService(questService(data,option.id,option.payload));return;
      }
      if(['quest-accept','quest-turn-in','deep-quest-accept','deep-quest-advance','deep-quest-claim'].includes(option.id)){
        setBusy(true);setError('');
        try{const result=await ui.callHost(PLUGIN+'/scene',{gameId,action:option.id,payload:option.payload||{},turn:head.current.turn,textVersion:head.current.textVersion});setData(result);setPreview(null);showService(questService(result,option.id,option.payload,true));refresh();}
        catch(error){setError(error.message||'委托操作未能完成。');}finally{setBusy(false);}return;
      }
      // 训练家挑战和道馆挑战本身就是战斗入口：先备好这一场，再当场开打，不写草稿。
      if(['explore','wild','legendary','rocket-battle','trainer-battle','challenge-gym','special-battle','hell-rematch','campaign-enter-round','challenge-elite','field-awaken-snorlax','field-challenge-fossil-researcher','field-challenge-dojo'].includes(option.id)){
        setBusy(true);setError('');
        try{
          await ui.callHost(PLUGIN+'/scene',{gameId,action:option.id,payload:option.payload||{},turn:head.current.turn,textVersion:head.current.textVersion});
          setData(await ui.callHost(PLUGIN+'/enter-battle',{gameId,turn:head.current.turn,textVersion:head.current.textVersion}));
          setPreview(null);sessions.set(gameId,{...(sessions.get(gameId)||{}),serviceScene:null});change('battle');refresh();
        }catch(error){setError(error.message||'未能进入战斗。');}
        finally{setBusy(false);}
        return;
      }
      if(option.id.startsWith('facility-')||option.id.startsWith('field-')){
        setBusy(true);setError('');
        try{
          const result=await ui.callHost(PLUGIN+'/scene',{gameId,action:option.id,payload:option.payload||{},turn:head.current.turn,textVersion:head.current.textVersion});setData(result);
          const previous=(sessions.get(gameId)||{}).serviceScene,facilityId=previous?.facilityId|| (option.id.startsWith('facility-safari-')?'safari-zone':null);
          let scene=facilityId?facilityService(result,{payload:{facilityId}}):null;
          if(!scene){
            const choices=(result?.fieldServices?.options||[]).map(item=>({...item,immediate:true}));
            scene={facilityId:'field-service',title:'场地调查',speaker:'场地调查',summary:result?.facilities?.context||'',choices};
          }
          scene.text=serviceReceiptText(option.id,result,option.payload||{},option.label);
          scene.notice=scene.text;
          if(!reducedEffects&&['facility-safari-throw','facility-safari-bait','facility-safari-rock'].includes(option.id))scene.effect={key:option.id+':'+option.payload?.revision,duration:850/animationSpeed,kind:option.id==='facility-safari-throw'?'ball':option.id==='facility-safari-bait'?'bait':'rock'};
          showService(scene);refresh();return;
        }catch(error){setError(error.message||'这项设施服务暂时无法完成。');}
        finally{setBusy(false);}
        return;
      }
      setBusy(true);setError('');
      try{
        if(['kanto-story-event','campaign-choice','campaign-prologue','campaign-register-tournament'].includes(option.id)){
          const result=await ui.callHost(PLUGIN+'/scene',{gameId,action:option.id,payload:option.payload||{},turn:head.current.turn,textVersion:head.current.textVersion});setData(result);
          const chapter=result.campaign?.data?.chapters?.find(item=>item.id===option.payload?.chapterId),choice=chapter?.choices?.find(item=>item.id===option.payload?.choiceId);
          const text=option.id==='kanto-story-event'?result.world?.剧情?.剧场?.对白:choice?.echo|| (option.id==='campaign-prologue'?result.campaign?.data?.prologue?.summary:option.id==='campaign-register-tournament'?'石英大会报名完成。六轮单败赛，每一轮都需要伙伴们一起争取。请准备好队伍，再进入第一轮。':result.theater?.dialogue||option.label+'，旅程记录已更新。');
          const following=option.id==='kanto-story-event'?result.storyEvents?.events?.find(event=>event.id===option.payload?.eventId&&event.status==='available'):null;
          showService({speaker:chapter?.speakers?.[0]?.name||result.theater?.person?.name||'旅程记录',portraitId:option.id==='kanto-story-event'?result.world?.剧情?.剧场?.角色:undefined,text,choices:following?.choices?.map(choice=>({id:'kanto-story-event',label:choice.label,enabled:choice.enabled,reason:choice.reason,payload:{...choice.payload,eventId:following.id,choiceId:choice.id},immediate:true}))});refresh();return;
        }
        if(option.id==='heal'){const result=await ui.callHost(PLUGIN+'/scene',{gameId,action:'heal',turn:head.current.turn,textVersion:head.current.textVersion});setData(result);sessions.set(gameId,{...(sessions.get(gameId)||{}),serviceScene:{speaker:'乔伊小姐',sceneTag:'pokemon-center',musicEvent:'pokemonCenter',text:'大家的体力、状态和PP都恢复了。旅途中也请留意伙伴的心情，祝你们一路平安。'},notice:'队伍已恢复：HP、状态与PP已同步。'});notify(gameId);refresh();return;}
        if(option.id==='claim-machine'){const result=await ui.callHost(PLUGIN+'/scene',{gameId,action:option.id,...option.payload,turn:head.current.turn,textVersion:head.current.textVersion});setData(result);const giftText={hm05:'这些观察记录很细致。请收下秘传学习器05「闪光」，让伙伴学会后，黑暗的洞窟也会变得容易探索。',expshare:'你已经记录了如此多不同的宝可梦。请收下学习装置：让携带它的伙伴分享战斗经验。',amuletcoin:'四十种不同的伙伴都留下了拥有记录。请收下护符金币：让携带它的宝可梦参加训练家对战，获胜后的奖金便会增加。'};sessions.set(gameId,{...(sessions.get(gameId)||{}),serviceScene:{speaker:'大木博士的助手',text:giftText[option.payload?.item]||option.label+'，已交给你。'},notice:option.label+'，已放入背包。'});notify(gameId);refresh();return;}
        const plan=await ui.callHost(PLUGIN+'/plan',{gameId,action:option.id,payload:option.payload||{},turn:head.current.turn,textVersion:head.current.textVersion});
        setPreview({...option,payload:plan.payload||option.payload||{},text:plan.playerText||`我在${world?.地图?.地点}，${option.label}。`});
      }catch(error){setError(error.message||'当前无法准备这次行动。');
      }finally{setBusy(false);}
    };
    const confirm=async()=>{
      if(!preview||busy)return;setBusy(true);setError('');let queued;
      try{
        queued=await ui.callHost(PLUGIN+'/intent',{gameId,action:preview.id,payload:preview.payload||{},playerText:preview.text,turn:head.current.turn,textVersion:head.current.textVersion});
        if(typeof ui.submitInput!=='function')throw Error('请从剧场输入框发送这次行动，后台会在剧情结束后执行。');
        await ui.submitInput({gameId,text:preview.text});setPreview(null);refresh();
      }catch(e){
        if(queued?.id){await ui.callHost(PLUGIN+'/cancel-intent',{gameId,id:queued.id,turn:head.current.turn,textVersion:head.current.textVersion}).catch(()=>{});ui.setInput?.({gameId,text:queued.playerText});}
        setError(e.message||'剧情未发送，请从输入框继续。');
      }finally{setBusy(false);}
    };
    const requestMode=next=>{
      if(next==='battle'){
        // 「进入本轮战斗」是战斗入口：能打就直接开打，不再让玩家在输入框确认一次。
        if(busy||!data?.writable){setError('这一轮还在生成，等它完成再进战斗。');return;}
        setBusy(true);setError('');
        const turn=head.current.turn,textVersion=head.current.textVersion;
        const enter=()=>ui.callHost(PLUGIN+'/enter-battle',{gameId,turn,textVersion});
        // The backend resolves the settled narrative, habitat and encounter once.
        const run=enter();
        run.then(result=>{
          setData(result);setPreview(null);change('battle');refresh();
        })
          .catch(error=>setError(error.message||'未能进入战斗。'))
          .finally(()=>setBusy(false));
        return;
      }
      if(next==='shop')change('shop');else change(next);
    };
    const generateOffers=async()=>{if(busy||!data?.writable)return;setBusy(true);setError('');try{const fresh=await ui.callHost(PLUGIN+'/quest-generate',{gameId,turn:head.current.turn,textVersion:head.current.textVersion});setData(fresh);setQuestsOpen(true);const offer=fresh?.world?.剧情?.委托发布;if(offer){sessions.set(gameId,{...(sessions.get(gameId)||{}),serviceScene:{speaker:offer.npcName,text:offer.text}});notify(gameId);}}catch(error){setError(error.message||'暂时没有新的委托。');}finally{setBusy(false);}};
    const acceptStoryBattle=async()=>{
      if(busy||!data?.writable)return;
      setBusy(true);setError('');
      try{
        await ui.callHost(PLUGIN+'/enter-battle',{gameId,turn:head.current.turn??data.turn,textVersion:head.current.textVersion??data.textVersion,natural:true});
        setPreview(null);sessions.set(gameId,{...(sessions.get(gameId)||{}),serviceScene:null});change('battle');refresh();
      }catch(error){setError(error.message||'当前剧情没有可进入的对战。');}
      finally{setBusy(false);}
    };
    const setting=async body=>{setBusy(true);try{setData(await ui.callHost(PLUGIN+'/settings',{gameId,...body}));}catch(e){setError(e.message);}finally{setBusy(false);}};
    const visibleOptions=starters.length||world?.战斗?.状态==='active'?[]:options.filter(option=>option.id!=='buy'&&(world?.战斗?.状态!=='pending'||['start-battle','avoid-encounter'].includes(option.id)||option.id==='heal'&&!world.队伍?.some(mon=>mon.当前HP>0)));
    const companionOptions=visibleOptions.filter(option=>['camp','bond','care','train'].includes(option.id));
    const questActions=['quest-accept','quest-turn-in','deep-quest-accept','deep-quest-advance','deep-quest-claim'];
    const questOptions=[...new Map(visibleOptions.filter(option=>questActions.includes(option.id)).map(option=>[option.id+':'+(option.payload?.deepQuestId||option.payload?.questId),option])).values()];
    const mainOptions=[...new Map(visibleOptions.filter(option=>!option.id.startsWith('facility-department-')&&option.id!=='facility-rooftop-trade'&&!['camp','bond','care','train',...questActions,'facility-coin-case','facility-buy-coins','facility-claim-prize','facility-claim-pokemon'].includes(option.id)).map(option=>{const key=option.id==='kanto-story-event'?option.id+option.payload?.eventId:option.id+JSON.stringify(option.payload||{});const label=option.id==='kanto-story-event'?data?.storyEvents?.events?.find(event=>event.id===option.payload?.eventId)?.title:null;return[key,label?{...option,label}:option];})).values()];
    const actionGroups=[{id:'here',label:'此处',options:mainOptions.filter(option=>option.id!=='travel')},{id:'travel',label:'旅途',options:mainOptions.filter(option=>option.id==='travel')}].filter(group=>group.options.length);
    const difficulty=world?.设置?.对手难度||'normal';
    const journal=String(world?.剧情?.行动提示||shared.notice||'').trim();
    return h('div',{'data-kanto-native-stage':true,'data-kanto-mode':mode,className:'kanto-stage-shell'+(fullscreen?' is-fullscreen':''),style:{height:'100%',minHeight:0,flex:'1 1 auto'}},
      h('header',{className:'kanto-stage-header',onClick:e=>e.stopPropagation()},
        h('div',{className:'kanto-stage-brand'},h('strong',null,'宝可梦 · 火红叶绿'),data?.settlementMode==='local'?h('small',null,data?.settlementBackend==='official-mvu'?'原生 MVU':'本地结算'):data?.settlementMode==='legacy'?h('small',{title:'运行同包安装器并重启DSH，启用无需模型的变量结算。'},'需更新结算组件'):null,h('span',{className:'kanto-stage-location'},theater?.title||'关都旅程')),
        h('div',{className:'kanto-stage-meta'},world?h('span',null,'₽ ',world.训练家?.金钱??0,' · 徽章 ',world.训练家?.徽章?.length||0,' · 上限 Lv.',data?.progression?.levelCap||'—'):null,
          h('label',null,'速度',h('select',{'aria-label':'演出速度',value:animationSpeed,onChange:e=>setSpeed(Number(e.target.value))},[1,2,4].map(value=>h('option',{key:value,value},value+'×')))),
          h('label',null,'难度',h('select',{'aria-label':'对手难度',value:difficulty,disabled:busy||!data?.writable||world?.战斗?.状态==='active',onChange:e=>setting({difficulty:e.target.value})},[['easy','容易'],['normal','中等'],['hard','困难'],['expert','极难'],['hell','地狱'],['ai','AI 对手']].map(([id,label])=>h('option',{key:id,value:id},label)))),
          h('label',null,'版本',h('select',{'aria-label':'野生宝可梦版本',value:world?.设置?.版本||'firered',disabled:busy||!data?.writable||world?.战斗?.状态==='active',onChange:e=>setting({version:e.target.value})},h('option',{value:'firered'},'火红'),h('option',{value:'leafgreen'},'叶绿'))),
          difficulty==='ai'?h('label',null,'对手模型',h('select',{'aria-label':'AI对手模型',value:world?.设置?.对手模型?JSON.stringify(world.设置.对手模型):'',disabled:busy||!data?.writable||world?.战斗?.状态==='active'||!modelCatalog?.available,onChange:e=>setting({aiModel:e.target.value?JSON.parse(e.target.value):null})},h('option',{value:''},'本局后台模型'+(modelCatalog?.current?.model?' · '+modelCatalog.current.model:'')),(modelCatalog?.groups||[]).map(group=>h('optgroup',{key:group.provider,label:group.providerName||group.provider},group.models.map(model=>h('option',{key:model.id,value:JSON.stringify({provider:group.provider,model:model.id})},model.name||model.id)))))):null,
          musicManaged?h('span',{className:'kanto-native-music-note'},'音乐由原生舞台控制'):button(musicEnabled?'音乐 开':'音乐 关',()=>{ui.setMusicEnabled?.(!musicEnabled);setMusic(v=>!v);}),
          button(effectsEnabled?'音效 开':'音效 关',()=>setEffects(v=>!v)),
          h('details',{className:'kanto-difficulty-rules'},h('summary',null,'难度规则'),h('p',null,data?.progression?.difficultyDescription||'')),
          h('details',{className:'kanto-stage-settings'},h('summary',null,'旅程设置'),h('div',null,
            h('label',null,'首领强度',h('select',{'aria-label':'首领强度',value:world?.设置?.bossTier||'auto',disabled:busy||!data?.writable||world?.战斗?.状态==='active',onChange:e=>setting({bossTier:e.target.value})},[['auto','随难度'],['original','原版'],['enhanced','强化'],['extreme','极限']].map(([value,label])=>h('option',{key:value,value},label)))),
            h('label',null,'对战方式',h('select',{'aria-label':'对战方式',value:world?.设置?.battleMode||'singles',disabled:busy||!data?.writable||world?.战斗?.状态==='active',onChange:e=>setting({battleMode:e.target.value})},h('option',{value:'singles'},'单打'),h('option',{value:'doubles'},'双打'))),
            h('label',null,h('input',{type:'checkbox',checked:reducedEffects,onChange:e=>setReduced(e.target.checked)}),'减少动态'),
            h('label',null,h('input',{type:'checkbox',checked:world?.设置?.战后补给!==false,disabled:busy||!data?.writable||world?.战斗?.状态==='active',onChange:e=>setting({supplies:e.target.checked})}),'战后补给'),
            h('label',null,h('input',{type:'checkbox',checked:world?.设置?.bondBattleEffects!==false,disabled:busy||!data?.writable||world?.战斗?.状态==='active',onChange:e=>setting({bondBattleEffects:e.target.checked})}),'羁绊闪避与要害辅助'),
            h('label',null,h('input',{type:'checkbox',checked:world?.设置?.道馆等级上限!==false,disabled:busy||!data?.writable||world?.战斗?.状态==='active',onChange:e=>setting({levelCap:e.target.checked})}),'道馆前等级上限'))))),
      h('div',{className:'kanto-stage-viewport'},mode==='story'
        ?h(TheaterScene,{ctx,gameId,stage,theater,stageAssets,beat,beats,index,battleOver,defeat:defeated?{heal:(heal=>heal?()=>prepare(heal):null)(options.find(option=>option.id==='heal'&&option.enabled!==false))}:null,scene:data?.presentation?.scene,service:shared.serviceScene,busy,reducedMotion:reducedEffects,playerName:world?.训练家?.姓名,onServiceChoice:prepare,advance:advanceScene,footer:readableStageFooter(footer,beats,index),notice:defeated?'':journal,onMode:requestMode,sceneRef})
        :h(BattleFrame,{ctx,gameId,mode,musicEnabled,musicManaged,effectsEnabled,animationSpeed,reducedEffects,onChange:change,onRefresh:refresh,onPrepare:prepare,onPreferences:value=>{if([1,2,4].includes(value.speed))setSpeed(value.speed);if(typeof value.effects==='boolean')setEffects(value.effects);if(typeof value.reducedEffects==='boolean')setReduced(value.reducedEffects);}})),
      h('div',{className:'kanto-stage-dock',onClick:e=>e.stopPropagation()},
        mode==='story'&&preview?h('div',{className:'kanto-stage-prompt',role:'region','aria-label':'准备行动'},h('label',{className:'kanto-draft-label'},'编辑这次行动',h('textarea',{'aria-label':'行动草稿',value:preview.text,maxLength:4000,onChange:e=>setPreview({...preview,text:e.target.value}),disabled:busy})),h('div',{className:'kanto-draft-actions'},h('small',null,'可以改写。只有点发送，剧情才会继续。'),button(busy?'正在发送…':'发送并继续剧情',confirm,busy||!data?.writable||!preview.text.trim(),'kanto-action is-primary'),button('放到输入框',()=>{ui.setInput?.({gameId,text:preview.text});setPreview(null);}),button('取消',()=>setPreview(null)))):null,
        mode==='story'&&!preview&&starters.length?h('div',{className:'kanto-stage-starters','aria-label':'选择最初的伙伴'},starters.map(option=>h('button',{key:option.payload.id,type:'button',className:'kanto-starter',disabled:busy||!data?.writable||!option.enabled,onClick:()=>prepare(option)},h('img',{src:asset(ui,`assets/pokemon/artwork/${option.payload.id}.png`),alt:option.label}),h('span',null,option.label)))):null,
        mode==='story'&&!preview&&mainOptions.length?h('div',{className:'kanto-stage-action-groups'},actionGroups.map(group=>h('div',{key:group.id,className:'kanto-action-group',role:'group','aria-label':group.label},h('small',{className:'kanto-action-group-label'},group.label),h('div',{className:'kanto-stage-actions'},group.options.map((option,i)=>h('span',{key:option.id+':'+i,title:option.reason||''},button(option.label,()=>prepare(option),busy||!data?.writable||!option.enabled,'kanto-action'+(['start-battle','explore','challenge-gym','special-battle','campaign-enter-round','challenge-elite'].includes(option.id)?' is-primary':'')))))))):null,
        mode==='story'&&!preview&&!starters.length?h('div',{className:'kanto-social-tabs'},companionOptions.length?button(companionOptions[0].label,()=>prepare(companionOptions[0]),busy||!data?.writable||!companionOptions[0].enabled):null,questOptions.length?button(questsOpen?'收起当地委托':`当地委托 · ${questOptions.length}`,()=>{setQuestsOpen(v=>!v);setSocialOpen(false);}):null,data?.shop?.available&&finished?button(busy?'正在打听…':'问问新的委托',generateOffers,busy||!data?.writable):null):null,
        mode==='story'&&!preview&&questsOpen?h('div',{className:'kanto-quest-offers'},questOptions.map(option=>{const deepId=option.payload?.deepQuestId,card=world?.任务?.find(item=>deepId?item.id==='deep-quest:'+deepId:item.questId===option.payload?.questId);return h('article',{key:option.id+':'+(deepId||option.payload?.questId)},h('strong',null,card?.标题||option.label),h('small',null,option.payload?.npcName||card?.委托人||'当地委托'),h('p',null,card?.描述||card?.description||option.label),card?.奖励预告?h('small',null,typeof card.奖励预告==='string'?card.奖励预告:JSON.stringify(card.奖励预告)):null,option.reason?h('small',null,option.reason):null,button(deepId&&option.id==='deep-quest-accept'?'了解委托与调查方案':option.label,()=>prepare({...option,enabled:deepId&&option.id==='deep-quest-accept'?true:option.enabled}),busy||!option.enabled));})):null,
        h('nav',{className:'kanto-stage-nav','aria-label':'训练家菜单'},mode!=='story'?button('返回剧情',()=>change('story')):null,
          mode==='story'&&finished&&!starters.length?button(busy?'正在进入对战…':'接受剧情对战',acceptStoryBattle,busy||!data?.writable,'kanto-action is-primary'):null,
          world?.战斗?.状态==='active'&&mode!=='battle'?button('继续战斗',()=>change('battle'),false,'kanto-action is-primary'):null,
          mode!=='battle'&&!starters.length?['party','bag','quests',...(data?.shop?.available?['shop']:[]),'map'].map(tab=>h('span',{key:tab},button(({party:'精灵',bag:'背包',quests:'任务',shop:'走进商店',map:'地图'})[tab],()=>requestMode(tab),busy))):null,
          null),
        world?.战斗?.奖励?h('details',{className:'kanto-stage-rewards'},h('summary',null,'本场结算 · 金币 +',world.战斗.奖励.金币||0),h('p',null,(world.战斗.奖励.经验||[]).map(item=>`${item.昵称} 经验 +${item.获得}${item.升级?`，升${item.升级}级`:''}`).join('；')||'经验 +0'),h('p',null,'物品：',(world.战斗.奖励.物品||[]).map(item=>`${item.名称} ×${item.数量}`).join('、')||'无','；徽章：',(world.战斗.奖励.徽章||[]).join('、')||'无')):null,
        !data?.writable?h('p',{className:'kanto-stage-notice',role:'status'},'DSH 正在生成或后台结算，完成后可继续操作。'):null,
        error?h('p',{className:'kanto-stage-notice',role:'alert'},error,' ',button('重新读取',refresh)):null),
      h('style',null,STAGE_SHELL_FALLBACK_CSS+(stageAssets?.css||'')+THEATER_CSS));
  }

  function open(ctx,id,mode='battle'){
    sessions.set(id,{...(sessions.get(id)||{}),mode:modes.has(mode)?mode:'story'});notify(id);
    if(typeof ctx.tavernUi.showStage==='function'){ctx.tavernUi.showStage(id);return;}
    // The official API currently exposes stage views but not a programmatic
    // open method. Use the host's existing, accessible stage entry as a narrow
    // compatibility fallback; it still opens Tavern's own stage and can be
    // removed once a public opening method is available.
    const entry=globalThis.document?.querySelector?.('button[aria-label="舞台"]');
    if(entry&&!entry.disabled&&typeof entry.click==='function'){entry.click();return;}
    throw Error('请点击页面顶部的「舞台」进入关都剧场。');
  }
  function Entry({ctx,gameId,turn,label,mode='battle',natural=false,naturalQuote=''}){
    const [busy,setBusy]=useState(false),[error,setError]=useState('');
    const enter=async e=>{e.stopPropagation();if(busy)return;if(mode!=='battle'){open(ctx,gameId,mode);return;}setBusy(true);setError('');
      try{await ctx.tavernUi.callHost(PLUGIN+'/enter-battle',{gameId,turn,...(natural?{natural:true,naturalQuote}:{})});sessions.set(gameId,{...(sessions.get(gameId)||{}),actionDraft:null});open(ctx,gameId,'battle');}
      catch(error){setError(error.message||'暂时无法进入战斗，请稍后重试。');}finally{setBusy(false);}};
    return h('span',null,h('button',{type:'button',disabled:busy,onClick:enter,style:{padding:'8px 14px',cursor:'pointer'}},busy?'正在进入战斗…':label||'进入本轮战斗'),error?h('span',{role:'alert',style:{display:'block',color:'#a23a31'}},error):null);
  }
  return{name:PLUGIN,inject:['tavernUi'],apply(ctx){
    const ui=ctx.tavernUi;
    ui.registerStageView?.({id:'kanto-native',label:'关都剧场',render:input=>h(NativeStage,{ctx,...input})});
    // Host text markers run before its bubble parser: replacing any slice of
    // a spoken line breaks @bubble. Only a standalone control line is ours;
    // natural invitations use the message action and the native stage dock.
    ui.registerTextMarker?.({pattern:/^[\t ]*(?:【(?:查看训练家状态|打开背包|打开商店|查看任务|进入本轮战斗)】|进入本轮战斗)[\t ]*\r?$/gm,render:({gameId,turn,streaming,match})=>streaming?h('span',null,match):h(Entry,{ctx,gameId,turn,label:String(match).trim().replace(/[【】]/g,''),mode:markerMode(match)})});
    ui.registerMessageAction?.({id:'kanto-check-battle',label:'接受剧情对战',when:({gameId,settled})=>Boolean(gameId&&settled),run:async({gameId,turn})=>{await ui.callHost(PLUGIN+'/enter-battle',{gameId,turn,natural:true});sessions.set(gameId,{...(sessions.get(gameId)||{}),actionDraft:null});open(ctx,gameId,'battle');}});
    ui.registerComposerAction?.({id:'kanto-native-battle',label:'关都剧场',when:({busy})=>!busy,run:({gameId})=>open(ctx,gameId,'story')});
  }};
}});













