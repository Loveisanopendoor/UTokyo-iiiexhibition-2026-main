(() => {
 works.forEach((w,i)=>{w.venue=String(i);w.author='';});
 // Seeded shuffle: random-looking placement stays stable after a reload.
 const venues=Array.from({length:28},(_,i)=>String(i%2));
 let seed=20260919;
 for(let i=venues.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=Math.floor(seed/4294967296*(i+1));[venues[i],venues[j]]=[venues[j],venues[i]];}
 for(let i=works.length;i<30;i++){
  works.push({title:'',author:'',placeholder:true,venue:venues[i-2],image:'assets/concept/figma-fund.png',description:''});
 }
 // A few slots stand in for the invited-works filter on mobile. Real works stay in A/B.
 for(let i=0;i<works.length;i++){if(i>1&&i%5===4)works[i].venue='invite';}
 const venueName=w=>'会場 '+(w.venue==='0'?'A':'B');
 const section=document.querySelector('#works');
 section.querySelector('.rings').remove();section.querySelector('.works-bottom').remove();section.querySelector('#work-list').remove();
 const ui=document.createElement('div');ui.className='wave-gallery spatial-gallery';
 ui.innerHTML=`<div class="wave-toolbar"><div class="wave-filters" role="group" aria-label="会場で絞り込み"><button data-venue="all" aria-pressed="true">ALL</button><button data-venue="0" aria-pressed="false">会場A</button><button data-venue="1" aria-pressed="false">会場B</button></div><button class="wave-view" aria-pressed="false">一覧表示</button></div><div class="wave-stage" role="region" aria-label="作品の円環。左右キーまたは横ドラッグで作品を移動" tabindex="0"></div><div class="wave-caption" aria-live="polite"><span></span><h3></h3></div><div class="wave-controls"><button class="wave-prev" aria-label="前の作品">←</button><span class="wave-count" aria-live="polite"></span><button class="wave-next" aria-label="次の作品">→</button></div><div class="wave-list" hidden></div>`;
 section.append(ui);
 const stage=ui.querySelector('.wave-stage'),list=ui.querySelector('.wave-list');list.classList.add('person-list');
 const caption=ui.querySelector('.wave-caption'),controls=ui.querySelector('.wave-controls');
 const captionVenue=caption.querySelector('span'),captionTitle=caption.querySelector('h3'),countLabel=ui.querySelector('.wave-count'),prevButton=ui.querySelector('.wave-prev'),nextButton=ui.querySelector('.wave-next');
 let ids=works.map((_,i)=>i),current=0,listMode=false,drag=null,suppressUntil=0,venue='all',focused=false,hovered=-1;
 const centerTitle=document.createElement('div');centerTitle.className='orbit-title';centerTitle.setAttribute('aria-hidden','true');stage.append(centerTitle);
 let orbitAngle=0,orbitFrame=0,orbitTime=0,orbitVisible=false;
 const orbitReduced=matchMedia('(prefers-reduced-motion: reduce)');
 const logoGuide=document.createElement('img');logoGuide.className='works-logo-guide';logoGuide.src='assets/concept/iiiex2026-logo.png';logoGuide.alt='';stage.prepend(logoGuide);
 ui.querySelectorAll('[data-venue]').forEach(b=>{b.textContent=b.dataset.venue==='all'?'ALL':'会場'+(b.dataset.venue==='0'?'A':'B');});
 stage.setAttribute('aria-label','作品の円環。ホバーでタイトル表示、クリックで作品詳細。左右キーで作品を移動');
 const cards=works.map((w,i)=>{
  const b=document.createElement('button');b.className='wave-card';b.innerHTML='<img src="assets/concept/figma-fund.png" alt="" draggable="false">';
  b.addEventListener('click',()=>{if(w.placeholder||performance.now()<suppressUntil)return;const n=ids.indexOf(i);if(n<0)return;current=n;openWork(i);});stage.append(b);
  b.addEventListener('pointerenter',()=>{hovered=i;render();});b.addEventListener('pointerleave',()=>{hovered=-1;render();});
  b.addEventListener('focus',()=>{current=ids.indexOf(i);focused=true;render();});b.addEventListener('blur',()=>{focused=false;render();});
  const item=document.createElement('button');item.type='button';item.className='person-card';
  if(!w.placeholder)item.setAttribute('aria-label',`${w.title}の詳細を見る`);
  const backdrop=document.createElement('img');backdrop.className='person-card__backdrop';backdrop.src=w.image;backdrop.alt='';backdrop.loading='lazy';
  const artwork=document.createElement('img');artwork.className='person-card__art';artwork.src=w.image;artwork.alt='';artwork.loading='lazy';
  const number=document.createElement('span');number.className='person-card__number';number.textContent=`WORK / ${String(i+1).padStart(2,'0')}`;
  const venueLabel=document.createElement('span');venueLabel.className='person-card__venue';venueLabel.textContent=venueName(w);
  const title=document.createElement('span');title.className='person-card__title';title.textContent=w.title;
  const footer=document.createElement('span');footer.className='person-card__footer';footer.textContent=w.author||'';
  const line=document.createElement('span');line.className='person-card__line';line.setAttribute('aria-hidden','true');
  item.append(backdrop,artwork,number,venueLabel,title,footer,line);
  item.onclick=()=>{if(w.placeholder)return;current=ids.indexOf(i);render();openWork(i);};list.append(item);
  return b;
 });
 // The orbit renders every frame; unchanged DOM writes would still invalidate style.
 const assign=(el,key,value)=>{if(el[key]!==value)el[key]=value;};
 const attr=(el,name,value)=>{if(el.getAttribute(name)!==value)el.setAttribute(name,value);};
 const css=(el,name,value)=>{if(el.style[name]!==value)el.style[name]=value;};
 let stageWidth=0,stageHeight=0,logoSize='';
 function measure(){stageWidth=stage.clientWidth;stageHeight=stage.clientHeight;}
 function render(){
  const mobile=stageWidth<600;
  const width=stageWidth||700,height=stageHeight||600;
  const count=ids.length;
  const allMode=venue==='all';
  const visibleRadius=allMode?count:4;
  ui.classList.toggle('is-list-mode',listMode);
  ui.classList.toggle('is-all-orbit',allMode);
  assign(logoGuide,'hidden',!allMode);
  const nextLogoSize=Math.min(width*.72,height*.75)+'px';
  if(nextLogoSize!==logoSize){logoSize=nextLogoSize;stage.style.setProperty('--works-logo-size',logoSize);}
  cards.forEach((b,i)=>{
   const n=ids.indexOf(i),chosen=n===current,included=n>=0;assign(list.children[i],'hidden',!included||!!works[i].placeholder);
   let offset=n-current;
   if(offset>count/2)offset-=count;
   if(offset<-count/2)offset+=count;
   const interactive=included&&!works[i].placeholder&&!listMode&&(!allMode||Math.abs(offset)<=visibleRadius);
   assign(b,'hidden',false);assign(b,'inert',!interactive);attr(b,'aria-hidden',String(!interactive));css(b,'pointerEvents',interactive?'auto':'none');
   b.classList.toggle('is-current',chosen);if(!works[i].placeholder)attr(b,'aria-label',works[i].title+'・'+venueName(works[i])+'の詳細を開く');
   b.removeAttribute('aria-pressed');b.removeAttribute('aria-current');
   // A/B keep the original 15-card ring size; only "all" uses a denser, full-depth ring.
   const angle=Math.PI/2-offset*Math.PI*2/Math.max(1,count)+orbitAngle;
   const depth=(Math.sin(angle)+1)/2;
   const x=Math.cos(angle)*width*(mobile?.36:.39);
   const y=Math.sin(angle)*height*.32-x*.17;
   const size=Math.min(width*.145,height*.23);
   let scale=size/240*(.88+depth*.2)*(allMode?.67:1);
   if(chosen||hovered===i)scale*=1.3;
   b.style.transform=`translate(-50%,-50%) translate3d(${x}px,${y}px,0) perspective(900px) rotateY(${-Math.cos(angle)*12}deg) rotateZ(-4deg) scale(${scale})`;
   css(b,'zIndex',String(hovered===i?50:chosen?40:Math.round(depth*30)+1));
   css(b,'opacity',included&&!listMode&&(!allMode||Math.abs(offset)<=visibleRadius)?'1':'0');
   assign(b,'tabIndex',interactive?0:-1);
  });
  const titleId=hovered>=0&&ids.includes(hovered)?hovered:focused?ids[current]:undefined;
  const titleText='';
  if(centerTitle.textContent!==titleText)centerTitle.textContent=titleText;
  centerTitle.classList.toggle('is-visible',!!titleText);
  const id=titleId===undefined?ids[current]:titleId;assign(captionVenue,'textContent',id===undefined||works[id].placeholder?'':venueName(works[id]));assign(captionTitle,'textContent',id===undefined?'':works[id].title);
  assign(countLabel,'textContent',String(current+1).padStart(2,'0')+' / '+String(ids.length).padStart(2,'0'));
  assign(prevButton,'disabled',count<=1);assign(nextButton,'disabled',count<=1);
  assign(stage,'hidden',listMode||!count);assign(caption,'hidden',listMode||!count);assign(controls,'hidden',listMode||!count);assign(list,'hidden',!listMode||!count);
 }
 function move(delta){if(!ids.length)return;current=(current+delta+ids.length)%ids.length;render();cards[ids[current]].focus({preventScroll:true});}
 ui.querySelector('.wave-prev').onclick=()=>move(-1);ui.querySelector('.wave-next').onclick=()=>move(1);
 function filter(){
  const previous=ids[current];
  ids=works.map((_,i)=>i).filter(i=>venue==='all'||works[i].venue===venue);
  current=Math.max(0,ids.indexOf(previous));focused=false;hovered=-1;render();
 }
 ui.querySelectorAll('[data-venue]').forEach(b=>b.onclick=()=>{
  venue=b.dataset.venue;
  ui.querySelectorAll('[data-venue]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter();
 });
 ui.querySelector('.wave-view').onclick=e=>{listMode=!listMode;e.currentTarget.setAttribute('aria-pressed',String(listMode));e.currentTarget.textContent=listMode?'空間表示':'一覧表示';render();};
 stage.addEventListener('keydown',e=>{if(e.key==='Escape'){focused=false;render();}if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
 stage.addEventListener('click',e=>{if(e.target===stage){focused=false;render();}});
 stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};});
 stage.addEventListener('pointermove',e=>{
  if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)){stage.setPointerCapture(e.pointerId);stage.classList.add('dragging');}
 });
 stage.addEventListener('pointerup',e=>{
  if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)){move(dx<0?1:-1);suppressUntil=performance.now()+350;}
  if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);drag=null;stage.classList.remove('dragging');
 });
 stage.addEventListener('pointercancel',()=>{drag=null;stage.classList.remove('dragging');});
 // Detail navigation and the gallery selection remain synchronized.
 dialog.addEventListener('close',()=>{const n=ids.indexOf(selected);if(n>=0)current=n;render();});
 const next=document.querySelector('#next-work');
 function detailNext(){next.disabled=ids.indexOf(selected)>=ids.length-1;}
 new MutationObserver(detailNext).observe(document.querySelector('#detail-title'),{childList:true});
 next.onclick=()=>{const n=ids.indexOf(selected);if(n>=0&&n<ids.length-1){current=n+1;render();openWork(ids[current]);detailNext();}};
 new ResizeObserver(()=>{measure();render();}).observe(stage);measure();render();
 stage.addEventListener('pointerleave',()=>{hovered=-1;render();});
 function orbitTick(now){orbitFrame=0;const delta=Math.min(50,now-orbitTime);orbitTime=now;if(!orbitVisible||document.hidden||orbitReduced.matches)return;if(!listMode&&!drag&&!focused&&hovered<0&&!dialog.open&&!window.conceptAutoScroll){orbitAngle+=delta*Math.PI*2/240000;render();}orbitFrame=requestAnimationFrame(orbitTick);}
 function startOrbit(){cancelAnimationFrame(orbitFrame);orbitTime=performance.now();if(orbitVisible&&!document.hidden&&!orbitReduced.matches)orbitFrame=requestAnimationFrame(orbitTick);}
 new IntersectionObserver(([entry])=>{orbitVisible=entry.isIntersecting;startOrbit();}).observe(section);
 document.addEventListener('visibilitychange',startOrbit);orbitReduced.addEventListener('change',startOrbit);

 // Mobile catalog: ALL shows one featured work plus a grid. Venue filters are grid-only.
 const mobileRoot=document.createElement('div');
 mobileRoot.className='works-mobile';
 mobileRoot.innerHTML=`<div class="wave-filters works-mobile-filters" role="group" aria-label="作品の絞り込み"><button type="button" data-mobile-venue="all" aria-pressed="true">ALL</button><button type="button" data-mobile-venue="0" aria-pressed="false">会場A</button><button type="button" data-mobile-venue="1" aria-pressed="false">会場B</button><button type="button" data-mobile-venue="invite" aria-pressed="false">招待作品</button></div><div class="works-mobile-list"></div><article class="works-mobile-detail" hidden><img class="works-mobile-detail-image" alt=""><div class="works-mobile-detail-tags"></div><h3></h3><p class="works-mobile-detail-meta">名前が入ります。 所属情報が入ります。</p><p class="works-mobile-detail-body"></p><button type="button" class="works-mobile-back">一覧に戻る</button></article>`;
 ui.append(mobileRoot);
 const mobileList=mobileRoot.querySelector('.works-mobile-list');
 const mobileDetail=mobileRoot.querySelector('.works-mobile-detail');
 const dummyImage='assets/works/memory-landscapes.png';
 const dummyDescription='ダミーテキストです。作品情報が入ります。これはレイアウト確認用の仮の説明文で、正式な作品紹介ではありません。参加学生一同、皆様からご支援をいただけるような展覧会を意欲的に企画しています。東京大学制作展クリエイターズ基金へ、ぜひご協力をお願いいたします。作品情報が入ります。ダミーの文章です。';
 let mobileVenue='all',mobileTrigger=null,listScroll=0;
 const mobileTitle=w=>w.title||'Memory Landscapes';
 const mobileImage=w=>w.placeholder?dummyImage:w.image;
 const mobileChip=w=>w.venue==='invite'?'招待':w.venue==='1'?'会場2':'会場1';
 function tagRow(work,solid){
  const row=document.createElement('span');row.className='works-mobile-tags';
  const view=document.createElement('span');view.className='works-mobile-tag';view.textContent='じっくり';
  const place=document.createElement('span');place.className='works-mobile-tag'+(solid?' is-solid':'');place.textContent=mobileChip(work);
  row.append(view,place);return row;
 }
 function renderMobileList(){
  mobileList.replaceChildren();
  const items=works.map((w,i)=>({w,i})).filter(({w})=>mobileVenue==='all'||w.venue===mobileVenue);
  const featured=mobileVenue==='all'?items[0]:null;
  const gridItems=featured?items.slice(1):items;
  if(featured){
   const button=document.createElement('button');button.type='button';button.className='works-mobile-feature';
   button.setAttribute('aria-label',mobileTitle(featured.w)+'の詳細を開く');
   const frame=document.createElement('span');frame.className='works-mobile-frame';
   const image=document.createElement('img');image.src=mobileImage(featured.w);image.alt='';
   frame.append(tagRow(featured.w,true),image);
   const title=document.createElement('span');title.className='works-mobile-feature-title';title.textContent=mobileTitle(featured.w);
   button.append(frame,title);
   button.onclick=()=>openMobileDetail(featured.i,button);
   mobileList.append(button);
  }
  const grid=document.createElement('div');grid.className='works-mobile-grid';
  if(!featured)grid.classList.add('is-filtered');
  gridItems.forEach(({w,i})=>{
   const button=document.createElement('button');button.type='button';button.className='works-mobile-card';
   button.setAttribute('aria-label',mobileTitle(w)+'の詳細を開く');
   const image=document.createElement('img');image.src=mobileImage(w);image.alt='';image.loading='lazy';
   const title=document.createElement('span');title.className='works-mobile-card-title';title.textContent=mobileTitle(w);
   button.append(tagRow(w,true),image,title);
   button.onclick=()=>openMobileDetail(i,button);
   grid.append(button);
  });
  if(gridItems.length)mobileList.append(grid);
  if(!items.length){
   const empty=document.createElement('p');empty.className='works-mobile-empty';empty.textContent='ダミーテキストです。該当する作品はありません。';
   mobileList.append(empty);
  }
 }
 function openMobileDetail(index,trigger){
  const work=works[index];if(!work)return;
  listScroll=scrollY;mobileTrigger=trigger;
  const image=mobileRoot.querySelector('.works-mobile-detail-image');
  image.src=mobileImage(work);image.alt=mobileTitle(work)+'（ダミー画像）';
  const tags=mobileRoot.querySelector('.works-mobile-detail-tags');
  tags.replaceChildren(tagRow(work,true));
  mobileRoot.querySelector('.works-mobile-detail h3').textContent=mobileTitle(work);
  mobileRoot.querySelector('.works-mobile-detail-body').textContent=dummyDescription;
  mobileList.hidden=true;mobileDetail.hidden=false;
  section.scrollIntoView({block:'start'});
  mobileRoot.querySelector('.works-mobile-back').focus();
 }
 function closeMobileDetail(){
  mobileDetail.hidden=true;mobileList.hidden=false;
  scrollTo({top:listScroll});
  mobileTrigger?.focus();
 }
 mobileRoot.querySelector('.works-mobile-back').onclick=closeMobileDetail;
 mobileRoot.querySelectorAll('[data-mobile-venue]').forEach(b=>b.onclick=()=>{
  mobileVenue=b.dataset.mobileVenue;
  mobileRoot.querySelectorAll('[data-mobile-venue]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  mobileDetail.hidden=true;mobileList.hidden=false;
  renderMobileList();
  section.scrollIntoView({block:'start'});
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileDetail.hidden){e.preventDefault();closeMobileDetail();}});
 renderMobileList();
})();
