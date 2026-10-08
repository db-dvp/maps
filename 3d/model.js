import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
// 인천계양·부산·일광 콘타모형 공통 코드 (각 현장 html에서 window.SITE='gy' 등으로 지정)
const SITE=window.SITE;
const EMBED = (window.top!==window);   // 분양가 지도(메인 사이트) 안에 끼워 넣어진 경우
const toTop = (o)=>{ try{ window.top.postMessage(o,'*'); }catch(e){} };
{ const st=document.createElement('style'); st.textContent="\n  :root{\n    --table:#d9d6cf;          /* 모형 받침대 */\n    --panel:#fbfaf7;\n    --ink:#1c2433;\n    --ink-soft:#5b6272;\n    --line:#d4d0c6;\n    --navy:#1b2f5c;           /* 대방 네이비 */\n    --navy-soft:#e6eaf3;\n    --water:#6f93b0;\n    --warn:#b4552f;\n    color-scheme: light;\n  }\n  html,body{height:100%;}\n  body{\n    margin:0; background:var(--table); color:var(--ink);\n    font-family:\"IBM Plex Sans KR\",\"Apple SD Gothic Neo\",\"Malgun Gothic\",system-ui,sans-serif;\n    font-size:14px; overflow:hidden;\n  }\n  #stage{position:fixed; inset:0;}\n  #stage canvas{display:block;}\n  #labels{position:fixed; inset:0; pointer-events:none;}\n\n  .panel{\n    position:fixed; top:calc(16px + env(safe-area-inset-top,0px)); left:16px;\n    width:min(300px, calc(100vw - 32px));\n    background:var(--panel); border:1px solid var(--line); border-radius:10px;\n    box-shadow:0 6px 24px rgba(28,36,51,.12);\n    padding:16px; display:flex; flex-direction:column; gap:14px;\n  }\n  .panel h1{margin:0; font-size:18px; font-weight:600; letter-spacing:-.01em; text-wrap:balance;}\n  .panel .sub{margin:2px 0 0; color:var(--ink-soft); font-size:12px; line-height:1.5;}\n  .group{display:flex; flex-direction:column; gap:6px;}\n  .group > .lab{font-size:11px; color:var(--ink-soft); letter-spacing:.04em;}\n  .seg{display:grid; grid-template-columns:1fr 1fr; border:1px solid var(--line); border-radius:8px; overflow:hidden;}\n  .seg button{\n    border:0; background:transparent; padding:8px 6px; font:inherit; font-size:13px; color:var(--ink); cursor:pointer;\n  }\n  .seg button + button{border-left:1px solid var(--line);}\n  .seg button[aria-pressed=\"true\"]{background:var(--navy); color:#fff;}\n  .chips{display:flex; flex-wrap:wrap; gap:6px;}\n  .chip{\n    border:1px solid var(--line); background:#fff; color:var(--ink); border-radius:999px;\n    padding:5px 11px; font:inherit; font-size:12.5px; cursor:pointer;\n  }\n  .chip[aria-pressed=\"true\"]{background:var(--navy-soft); border-color:#b9c3dc; color:var(--navy);}\n  .chip:focus-visible,.seg button:focus-visible{outline:2px solid var(--navy); outline-offset:2px;}\n  .stats{\n    display:grid; grid-template-columns:auto 1fr; gap:3px 10px; font-size:12px; color:var(--ink-soft);\n    border-top:1px solid var(--line); padding-top:10px;\n  }\n  .stats b{font-family:\"IBM Plex Mono\",ui-monospace,monospace; font-weight:500; color:var(--ink); font-variant-numeric:tabular-nums; text-align:right;}\n  .hint{font-size:11.5px; color:var(--ink-soft); line-height:1.5;}\n\n  .src{\n    position:fixed; right:16px; bottom:calc(12px + env(safe-area-inset-bottom,0px));\n    max-width:calc(100vw - 32px);\n    font-size:11px; color:#4a4f58; background:rgba(251,250,247,.85); padding:5px 9px; border-radius:6px;\n  }\n  #loading[hidden]{display:none;}\n  #loading{\n    position:fixed; inset:0; display:grid; place-items:center; font-size:14px; color:var(--ink-soft);\n  }\n\n  /* 3D 라벨 */\n  .lbl{font-size:12px; white-space:nowrap; padding:2px 7px; border-radius:4px; transform:translateY(-4px);}\n  .lbl.mtn{color:#3d3a31; background:rgba(251,250,247,.82);}\n  .lbl.river{color:#2d5677; font-style:italic; background:rgba(235,242,248,.78);}\n  .lbl.site{\n    color:#fff; background:var(--navy); font-weight:600; font-size:13px; padding:5px 10px; border-radius:6px;\n    box-shadow:0 3px 10px rgba(27,47,92,.35);\n  }\n  .lbl.cx{font-size:11px;color:#fff;background:var(--cxc,#7d5ba6);opacity:.92;padding:1px 6px;}\n  .lbl.cx.unbuilt{background:rgba(251,250,247,.9);color:#5b6272;border:1px dashed #9aa0ad;}\n  .lbl.cx.plan{outline:1px dashed rgba(255,255,255,.85);outline-offset:-3px;}\n  .lbl.hide,.lbl.fhide{display:none;}\n\n  @media (max-width:520px){\n    .panel{padding:12px; gap:10px;}\n    .stats,.hint{display:none;}\n  }\n  @media (prefers-reduced-motion: reduce){ *{transition:none!important;} }\n"; document.head.appendChild(st);
  document.body.insertAdjacentHTML('afterbegin',"<div id=\"stage\"></div>\n<div id=\"labels\"></div>\n<div id=\"loading\">모형 데이터를 불러오는 중…</div>\n\n<aside class=\"panel\" aria-label=\"모형 조작\">\n  <div>\n    <a id=\"back3d\" href=\"index.html\" hidden style=\"display:inline-block;font-size:12px;color:#1b2f5c;text-decoration:none;margin-bottom:6px\">← 전체 현장</a>\n    <h1 id=\"ttl\">콘타모형</h1>\n    <p class=\"sub\" id=\"sub\"></p>\n  </div>\n  <div class=\"group\">\n    <span class=\"lab\">지형 표현</span>\n    <div class=\"seg\" role=\"group\" aria-label=\"지형 표현\">\n      <button type=\"button\" id=\"modeSmooth\" aria-pressed=\"true\">매끈형 + 등고선</button>\n      <button type=\"button\" id=\"modeStep\" aria-pressed=\"false\">계단형 콘타</button>\n    </div>\n  </div>\n  <div class=\"group\">\n    <span class=\"lab\">레이어</span>\n    <div class=\"chips\">\n      <button type=\"button\" class=\"chip\" id=\"tBld\" aria-pressed=\"true\">건물</button>\n      <button type=\"button\" class=\"chip\" id=\"tRoad\" aria-pressed=\"true\">도로</button>\n      <button type=\"button\" class=\"chip\" id=\"tWater\" aria-pressed=\"true\">하천</button>\n      <button type=\"button\" class=\"chip\" id=\"tLbl\" aria-pressed=\"true\">지명</button>\n    </div>\n  </div>\n  <div class=\"group\">\n    <span class=\"lab\">시점</span>\n    <div class=\"chips\">\n      <button type=\"button\" class=\"chip\" id=\"vAll\" aria-pressed=\"false\">전체</button>\n      <button type=\"button\" class=\"chip\" id=\"vSite\" aria-pressed=\"false\">현장 주변</button>\n      <button type=\"button\" class=\"chip\" id=\"vMtn\" aria-pressed=\"false\" hidden>산 방향</button>\n      <button type=\"button\" class=\"chip\" id=\"vIC\" aria-pressed=\"false\" hidden>IC</button>\n    </div>\n  </div>\n  <div class=\"stats\" id=\"stats\"></div>\n  <div class=\"hint\">왼쪽 드래그 이동 · <b>휠버튼 드래그 회전</b> (Shift+휠버튼 이동) · 휠 확대/축소(커서 기준)<br>등고선 간격 5 m (굵은 선 25 m) · 높이 과장 없음(1:1)</div>\n</aside>\n\n<div class=\"src\">출처: 국토지리정보원 연속수치지형도(2024), 공공누리 제1유형 · 건물 높이는 층수 × 3.1 m 추정</div>"); }
const [meta, buf] = await Promise.all([
  fetch(SITE+'_meta.json').then(r=>r.json()),
  fetch(SITE+'_data.bin').then(r=>r.arrayBuffer())
]);
const TA = {'<i2':Int16Array,'<u4':Uint32Array,'<u2':Uint16Array,'<f4':Float32Array,'|u1':Uint8Array};
const D = {};
for (const [k,v] of Object.entries(meta.blobs)) D[k] = new TA[v.t](buf, v.o, v.n);
if (meta.bldcx && meta.blobs.bld_cx){ const a=new Uint8Array(meta.blobs.bld_cx.n); for(let j=0;j<meta.bldcx.length;j+=2) a[meta.bldcx[j]]=meta.bldcx[j+1]; D.bld_cx=a; }
const Q = meta.Q, STEP = meta.STEP, G = meta.grid;
const HIDE = new Set(meta.bldhide||[]);   // 철거·재개발로 지금은 없는 옛 건물(배치 추정 볼륨 자리)
const BASE = -6;               // 모형 받침 윗면

// ---------- 격자 샘플링 ----------
function sampler(arr, scale, nearest){
  return (x,z)=>{
    let c=(x-G.x0)/G.res-0.5, r=(z-G.z0)/G.res-0.5;
    c=Math.min(Math.max(c,0),G.w-1.001); r=Math.min(Math.max(r,0),G.h-1.001);
    if (nearest){ return arr[Math.round(r)*G.w+Math.round(c)]*scale; }
    const c0=c|0, r0=r|0, fc=c-c0, fr=r-r0, i=r0*G.w+c0;
    const a=arr[i], b=arr[i+1], d=arr[i+G.w], e=arr[i+G.w+1];
    return ((a*(1-fc)+b*fc)*(1-fr)+(d*(1-fc)+e*fc)*fr)*scale;
  };
}
const hSmooth = sampler(D.g_smooth, 0.1, false);
const hGraded = sampler(D.g_graded, 0.1, false);
const lvlAt   = sampler(D.g_lvl, 1, true);
const hStep   = (x,z)=>Math.max(0,lvlAt(x,z))*STEP;

// ---------- 폴리곤 풀기 ----------
function* polys(prefix){
  const xy=D[prefix+'_xy'], rl=D[prefix+'_rl'], nr=D[prefix+'_nr'];
  let ri=0, vi=0;
  for (let p=0;p<nr.length;p++){
    const rings=[]; const v0=vi;
    for (let k=0;k<nr[p];k++){
      const n=rl[ri++], ring=new Array(n);
      for (let j=0;j<n;j++){ ring[j]=new THREE.Vector2(xy[vi*2]*Q, xy[vi*2+1]*Q); vi++; }
      rings.push(ring);
    }
    yield [p, rings, v0];
  }
}
function signedArea(r){ let s=0; for(let i=0,n=r.length;i<n;i++){const a=r[i],b=r[(i+1)%n]; s+=a.x*b.y-b.x*a.y;} return s/2; }

// 기둥(윗면 + 옆벽) 생성기
function Builder(){ this.p=[]; this.c=[]; }
Builder.prototype.tri=function(a,b,c,col){
  const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2], vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  const ny=uz*vx-ux*vz;
  if (ny<0){ const t=b; b=c; c=t; }
  this.p.push(...a,...b,...c); for(let i=0;i<3;i++) this.c.push(col.r,col.g,col.b);
};
Builder.prototype.quad=function(p,q,y0,y1,yq0,yq1,outwardA,col){
  // p,q: Vector2 edge; wall from y0..y1 at p, yq0..yq1 at q
  const pb=[p.x,y0,p.y], qb=[q.x,yq0,q.y], qt=[q.x,yq1,q.y], pt=[p.x,y1,p.y];
  const P=this.p;
  if (outwardA){ P.push(...pb,...qt,...qb, ...pb,...pt,...qt); }
  else { P.push(...pb,...qb,...qt, ...pb,...qt,...pt); }
  for(let i=0;i<6;i++) this.c.push(col.r,col.g,col.b);
};
Builder.prototype.prism=function(rings, topY, botY, colTop, colWall, walls=true, noTop=false){
  const [outer,...holes]=rings;
  const all=[].concat(outer,...holes);
  const ys=(typeof topY==='function')? all.map(v=>topY(v.x,v.y)) : topY;
  let tris=[]; if(!noTop){ try { tris=THREE.ShapeUtils.triangulateShape(outer,holes); } catch(e){ tris=[]; } }
  for (const [i,j,k] of tris){
    this.tri([all[i].x,ys[i],all[i].y],[all[j].x,ys[j],all[j].y],[all[k].x,ys[k],all[k].y],colTop);
  }
  if (!walls) return;
  let off=0;
  rings.forEach((r,ri)=>{
    const s=signedArea(r); const isHole=ri>0;
    // (x,z)평면에서 s>0 이면 바깥 법선 = (ez,-ex) = A
    const outwardA = (s>0) !== isHole;
    for (let i=0,n=r.length;i<n;i++){
      const a=r[i], b=r[(i+1)%n];
      const ya=ys[off+i], yb=ys[off+(i+1)%n];
      this.quad(a,b,botY(a.x,a.y,ya),ya,botY(b.x,b.y,yb),yb,outwardA,colWall);
    }
    off+=r.length;
  });
};
Builder.prototype.mesh=function(mat){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));
  g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat); m.castShadow=true; m.receiveShadow=true; m.userData.rng=this.rng||{}; return m;
};

// ---------- 장면 ----------
const stage=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);
const labelRenderer=new CSS2DRenderer({element:document.getElementById('labels')});
labelRenderer.setSize(innerWidth,innerHeight);

const scene=new THREE.Scene();
scene.background=new THREE.Color('#d9d6cf');
scene.fog=new THREE.Fog('#d9d6cf', 9000, 16000);
const camera=new THREE.PerspectiveCamera(32, innerWidth/innerHeight, 5, 30000);
const controls=new OrbitControls(camera, renderer.domElement);
controls.enableDamping=true; controls.maxPolarAngle=Math.PI*0.47; controls.minDistance=60; controls.maxDistance=11000;
// 스케치업/맵박스 방식: 왼쪽=이동, 휠버튼=회전(Shift+휠버튼=이동), 오른쪽=회전, 휠=커서 기준 확대
controls.mouseButtons={LEFT:THREE.MOUSE.PAN, MIDDLE:THREE.MOUSE.ROTATE, RIGHT:THREE.MOUSE.ROTATE};
controls.touches={ONE:THREE.TOUCH.PAN, TWO:THREE.TOUCH.DOLLY_ROTATE};
controls.screenSpacePanning=false; controls.zoomToCursor=true;
renderer.domElement.addEventListener('mousedown',e=>{ if(e.button===1) e.preventDefault(); });
renderer.domElement.addEventListener('auxclick',e=>{ if(e.button===1) e.preventDefault(); });
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());

scene.add(new THREE.HemisphereLight('#ffffff','#a39d90',1.7));
const sun=new THREE.DirectionalLight('#fff6e8',2.3);
sun.position.set(-2600,3400,-1800); sun.castShadow=true;
sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-3800,right:3800,top:3800,bottom:-3800,near:100,far:9000});
sun.shadow.bias=-0.0004; sun.shadow.normalBias=1.5;
scene.add(sun);

const vcMat = (rough=0.92)=>new THREE.MeshStandardMaterial({vertexColors:true, roughness:rough, metalness:0});
const C = (h)=>new THREE.Color(h);

// 모형 받침판 (하천 바닥 역할)
const ext={x0:G.x0, x1:G.x0+G.w*G.res, z0:G.z0, z1:G.z0+G.h*G.res};
const baseB=new Builder();
baseB.prism([[new THREE.Vector2(ext.x0,ext.z0),new THREE.Vector2(ext.x1,ext.z0),new THREE.Vector2(ext.x1,ext.z1),new THREE.Vector2(ext.x0,ext.z1)]],
  ()=>BASE-0.5, ()=>BASE-40, C('#6c7a80'), C('#8a7f6b'));
const baseMesh=baseB.mesh(vcMat()); scene.add(baseMesh);

// --- 계단형 지형 ---
const maxLv=Math.max(...D.ter_lv);
const lowC=C('#efece4'), highC=C('#c4b89c');
const stepB=new Builder();
for (const [i,rings] of polys('ter')){
  const lv=Math.max(0,D.ter_lv[i]); const y=lv*STEP;
  const t=Math.pow(lv/maxLv,0.7);
  const top=lowC.clone().lerp(highC,t); const wall=top.clone().multiplyScalar(0.8);
  stepB.prism(rings, ()=>y, ()=>BASE, top, wall);
}
const stepMesh=stepB.mesh(vcMat()); scene.add(stepMesh);

// --- 매끈형 지형 + 등고선 셰이더 ---
const tg=new THREE.BufferGeometry();
{
  const n=G.w*G.h, pos=new Float32Array(n*3), col=new Float32Array(n*3);
  for (let r=0;r<G.h;r++) for (let c=0;c<G.w;c++){
    const i=r*G.w+c, x=G.x0+(c+0.5)*G.res, z=G.z0+(r+0.5)*G.res, y=D.g_smooth[i]*0.1;
    pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
    const t=Math.min(1,Math.max(0,y/260)), cc=lowC.clone().lerp(highC,Math.pow(t,0.7));
    col[i*3]=cc.r; col[i*3+1]=cc.g; col[i*3+2]=cc.b;
  }
  const idx=new Uint32Array((G.w-1)*(G.h-1)*6); let k=0;
  for (let r=0;r<G.h-1;r++) for (let c=0;c<G.w-1;c++){
    const a=r*G.w+c, b=a+1, d=a+G.w, e=d+1;
    idx[k++]=a; idx[k++]=d; idx[k++]=b; idx[k++]=b; idx[k++]=d; idx[k++]=e;
  }
  tg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  tg.setAttribute('color',new THREE.BufferAttribute(col,3));
  tg.setIndex(new THREE.BufferAttribute(idx,1));
  tg.computeVertexNormals();
}
const smoothMat=vcMat();
smoothMat.onBeforeCompile=(sh)=>{
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float vH;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\nvH=position.y;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vH;')
    .replace('#include <dithering_fragment>',`#include <dithering_fragment>
      float f5=abs(fract(vH/5.0+0.5)-0.5)/max(fwidth(vH/5.0),1e-4);
      float f25=abs(fract(vH/25.0+0.5)-0.5)/max(fwidth(vH/25.0),1e-4);
      float l5=1.0-min(f5,1.0), l25=1.0-min(f25/1.6,1.0);
      float show=step(4.0,vH);
      gl_FragColor.rgb=mix(gl_FragColor.rgb, vec3(0.43,0.36,0.25), show*max(l5*0.35,l25*0.7));`);
};
const smoothMesh=new THREE.Mesh(tg,smoothMat); smoothMesh.receiveShadow=true; smoothMesh.castShadow=true;
scene.add(smoothMesh);

// --- 하천 ---
function buildWater(hArr, vArr){
  const b=new Builder(); const col=C('#86aac6');
  for (const [i,rings,v0] of polys('wat')){
    if (vArr) b.prism(rings, vtxH(vArr,v0,rings,0), (x,z,y)=>y, col, col, false);
    else { const y=hArr[i]; b.prism(rings,()=>y,()=>y,col,col,false); }
  }
  const m=b.mesh(new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.35, metalness:0.05, transparent:true, opacity:0.9}));
  m.castShadow=false; return m;
}
const waterStep=buildWater(D.wat_ht), waterSmooth=buildWater(D.wat_hs, D.wat_hv);
scene.add(waterStep, waterSmooth);

// --- 도로 (두께 있는 판) + 교량 ---
// 일반도로·교량·고속도로 모두 같은 색(이음매가 티 나지 않게)
const ROAD_TOP='#8f8b84', ROAD_WALL='#6f6b64', ROAD_UNDER='#5f5b55';
// 도로: 중심선 종단 높이(교량 접속부 경사 포함)를 꼭짓점마다 적용 → 교량과 끊김 없이 이어짐
function vtxH(arr, v0, rings, add){ const n=rings.reduce((a,r)=>a+r.length,0), out=new Float32Array(n); for(let i=0;i<n;i++) out[i]=arr[v0+i]*0.1+add; return out; }
function buildRoads(smooth){
  const b=new Builder(); const top=C(ROAD_TOP), wall=C(ROAD_WALL);
  for (const [i,rings,v0] of polys('rd')){
    if (smooth) b.prism(rings, vtxH(D.rd_h,v0,rings,0.6), (x,z)=>Math.min(hGraded(x,z),hSmooth(x,z))-1.0, top, wall, true, D.rd_f[i]===1);
    else b.prism(rings,(x,z)=>hStep(x,z)+0.5,(x,z)=>hStep(x,z)-1.8,top,wall);
  }
  return b.mesh(vcMat(0.8));
}
function buildBridges(){
  const b=new Builder(); const top=C(ROAD_TOP), wall=C(ROAD_WALL);
  for (const [i,rings,v0] of polys('brg')) b.prism(rings, vtxH(D.brg_hv,v0,rings,0.6), (x,z,y)=>y-1.6, top, wall, true, D.brg_f[i]===1);
  return b.mesh(vcMat(0.8));
}
const roadStep=buildRoads(false), roadSmooth=buildRoads(true);
// 고가·램프 구간: 도로중심선 리본(폭=도로폭). 도로망 전체에서 높이가 이어져 끊김이 없음
{
  const b=new Builder(); const top=C(ROAD_TOP), wall=C(ROAD_WALL), under=C(ROAD_UNDER);
  const V=D.rib_v, Hh=D.rib_h; let o=0; const P=b.p, Cc=b.c;
  const push=(pts,col)=>{ for(const q of pts){P.push(q[0],q[1],q[2]); Cc.push(col.r,col.g,col.b);} };
  for (const n of D.rib_n){
    const L=(k)=>[V[(o+k)*4]*Q, V[(o+k)*4+1]*Q], R=(k)=>[V[(o+k)*4+2]*Q, V[(o+k)*4+3]*Q];
    const t=(k)=>Hh[(o+k)*2]*0.1, bt=(k)=>Hh[(o+k)*2+1]*0.1;
    for (let k=0;k<n-1;k++){
      const l0=L(k),l1=L(k+1),r0=R(k),r1=R(k+1);
      const A=[l0[0],t(k),l0[1]],B=[r0[0],t(k),r0[1]],Cq=[r1[0],t(k+1),r1[1]],Dq=[l1[0],t(k+1),l1[1]];
      push([A,B,Cq, A,Cq,Dq],top);
      const a2=[l0[0],bt(k),l0[1]],b2=[r0[0],bt(k),r0[1]],c2=[r1[0],bt(k+1),r1[1]],d2=[l1[0],bt(k+1),l1[1]];
      push([A,Dq,d2, A,d2,a2],wall); push([B,b2,c2, B,c2,Cq],wall);
      push([a2,d2,c2, a2,c2,b2],under);
    }
    o+=n;
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));
  g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.8,side:THREE.DoubleSide}));
  m.castShadow=true; m.receiveShadow=false; roadSmooth.add(m);
}
const brgStep=buildBridges(), brgSmooth=buildBridges();
scene.add(roadStep,roadSmooth,brgStep,brgSmooth);
// 고가 교각
const nP=D.piers.length/4;
const pierMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1.8,1,1.8), new THREE.MeshStandardMaterial({color:'#9d978d',roughness:0.9}), nP);
{ const m=new THREE.Matrix4(); for(let i=0;i<nP;i++){ const x=D.piers[i*4], z=D.piers[i*4+1], y0=D.piers[i*4+2], y1=D.piers[i*4+3];
  m.makeScale(1,Math.max(0.5,y1-y0),1); m.setPosition(x,(y0+y1)/2,z); pierMesh.setMatrixAt(i,m);} }
pierMesh.castShadow=true; scene.add(pierMesh);

// --- 건물 ---
// 단지 색 = 카카오맵 범례 색 계열(채도만 낮춤): [윗면, 옆면]
const _mix=(a,b,k)=>new THREE.Color(a).lerp(new THREE.Color(b),k);
const LEG={upcoming:'#202a5d',competitor:'#7d5ba6',presale:'#7d5ba6',scheduled:'#c23b7a',under1:'#e0a728','1to5':'#2f6fd6','5to10':'#12a39c',over10:'#9c6b3f'};
const CXC={}; for(const [k,c] of Object.entries(LEG)) CXC[k]=k==='over10'?[_mix(c,'#f3f0e9',0.42), _mix(c,'#e9e4da',0.55)]:[_mix(c,'#f3f0e9',0.38), _mix(c,'#e9e4da',0.52)]; // 10년 초과는 참고용이라 조금 옅게
const CXBOX={}; // 단지별 실제 건물 범위(이름표 위치가 아니라 건물 덩어리 가운데로 카메라를 맞추기 위함)
function _cxb(ci,x,z){ const b=CXBOX[ci]||(CXBOX[ci]=[1e9,1e9,-1e9,-1e9]); if(x<b[0])b[0]=x; if(z<b[1])b[1]=z; if(x>b[2])b[2]=x; if(z>b[3])b[3]=z; }
function buildBuildings(hFn, flatBase){
  const b=new Builder(); b.rng={}; const roof=C('#fbfaf6'), wall=C('#ecE8df'), tall=C('#f4f1ea');
  for (const [i,rings] of polys('bld')){
    if (HIDE.has(i)) continue;
    const fl=D.bld_fl[i]; const h=fl*3.1+1.0;
    let base;
    if (flatBase){ const o=rings[0]; let cx=0,cz=0; for(const v of o){cx+=v.x;cz+=v.y;} base=hFn(cx/o.length,cz/o.length); }
    else { base=Infinity; for (const v of rings[0]) base=Math.min(base,hFn(v.x,v.y)); }
    const y=base+h;
    const ci=D.bld_cx?D.bld_cx[i]:0;
    if (ci){ for(const v of rings[0]) _cxb(ci,v.x,v.y); const cc=CXC[meta.complexes[ci-1].key]||CXC.competitor; const s0=b.p.length/3; b.prism(rings,()=>y,()=>base-1.5, cc[0], cc[1]); (b.rng[ci]=b.rng[ci]||[]).push([s0,b.p.length/3]); }
    else b.prism(rings,()=>y,()=>base-1.5, fl>=10?tall:roof, wall);
  }
  return b.mesh(vcMat(0.95));
}
const bldStep=buildBuildings(hStep,true), bldSmooth=buildBuildings(hSmooth,false);
scene.add(bldStep,bldSmooth);
// --- 배치 추정 볼륨: 2024 지형도 이후 지어졌거나 공사·분양 중인 단지(공고문 동수·최고층 기준, 동 위치는 추정) ---
function buildPlan(hFn){
  const b=new Builder(); b.rng={};
  for (const [x,z,w,d,a,f,ci] of []){
    const key=(meta.complexes[ci-1]||{}).key, base_c=LEG[key]||'#7d5ba6';
    const top=_mix(base_c,'#ffffff',0.5), wall=_mix(base_c,'#f3f0e9',0.4);
    const ca=Math.cos(a), sa=Math.sin(a), pts=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>new THREE.Vector2(x+u*ca-v*sa, z+u*sa+v*ca));
    let base=Infinity; for(const p of pts) base=Math.min(base,hFn(p.x,p.y));
    const y=base+f*3.1+1.0;
    b.prism([pts],()=>y,()=>base-1.5,top,wall);
  }
  // 실제 배치(카카오맵에 그려진 동 모양): [단지번호, 층수, [x,z,x,z,...]]
  for (const [ci,f,flat] of (meta.planfp||[])){
    const key=(meta.complexes[ci-1]||{}).key, base_c=LEG[key]||'#7d5ba6';
    const nv=key==='upcoming', top=_mix(base_c,'#ffffff',nv?0.06:0.35), wall=_mix(base_c,'#f3f0e9',nv?0.04:0.3);
    const pts=[]; for(let k=0;k<flat.length;k+=2) pts.push(new THREE.Vector2(flat[k],flat[k+1]));
    if (pts.length<3) continue;
    for(const p of pts) _cxb(ci,p.x,p.y);
    let base=Infinity; for(const p of pts) base=Math.min(base,hFn(p.x,p.y));
    const y=base+f*3.1+1.0;
    const s0=b.p.length/3; b.prism([pts],()=>y,()=>base-1.5,top,wall); (b.rng[ci]=b.rng[ci]||[]).push([s0,b.p.length/3]);
  }
  const m=b.mesh(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9,metalness:0,transparent:true,opacity:0.9}));
  return m;
}
const planStep=buildPlan(hStep), planSmooth=buildPlan(hSmooth);
scene.add(planStep,planSmooth);

// --- 라벨 ---
const BRAND_ICON="data:image/png;base64,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";
const labelObjs=[];
for (const L of meta.labels){
  const el=document.createElement('div'); el.className='lbl '+L.k; el.textContent=L.t;
  const o=new CSS2DObject(el);
  const gy=hSmooth(L.x,L.z);
  o.position.set(L.x, gy+(L.k==='site'?120:L.k==='mtn'?25:L.k==='cx'?(L.h||40)+12:8), L.z);
  if(L.k==='cx'){ o.userData.cx=true; el.style.setProperty('--cxc', LEG[L.key]||'#7d5ba6'); if(L.fp){ el.textContent=L.t+(['presale','scheduled'].includes(L.key)?' (계획)':''); } else if(L.plan){ el.classList.add('unbuilt'); el.textContent=L.t+' (공사 전·중)'; } else if(L.unbuilt){ el.classList.add('unbuilt'); el.textContent=L.t+(L.nomap&&!['scheduled','upcoming'].includes(L.key)?' (지형도 미반영)':' (공사 전·중)'); } }
  o.userData.name=L.t; o.userData.k=L.k;
  if (L.k==='site'){
    const ux=(meta.complexes||[]).find(c=>c.key==='upcoming');
    el.innerHTML='<img src="'+BRAND_ICON+'" alt="" style="width:20px;height:20px;border-radius:4px;vertical-align:-5px;margin-right:6px;background:#fff">'; el.appendChild(document.createTextNode(L.t));
    if (EMBED && ux){ el.style.pointerEvents='auto'; el.style.cursor='pointer'; el.addEventListener('click',()=>{ const r=el.getBoundingClientRect(); toTop({t:'cx-click',name:ux.name,site:SITE,x:Math.round(r.left+r.width/2),y:Math.round(r.top)}); }); }
  }
  if (EMBED && L.k==='cx'){ el.style.pointerEvents='auto'; el.style.cursor='pointer'; el.addEventListener('click',()=>{ const r=el.getBoundingClientRect(); toTop({t:'cx-click',name:L.t,site:SITE,x:Math.round(r.left+r.width/2),y:Math.round(r.top)}); }); }
  scene.add(o); labelObjs.push(o);
}
// 엘리움 표시봉
const site=meta.labels.find(l=>l.k==='site');
{
  const gy=hSmooth(site.x,site.z);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,115,8), new THREE.MeshStandardMaterial({color:'#1b2f5c'}));
  pole.position.set(site.x, gy+57, site.z); scene.add(pole);
  const disk=new THREE.Mesh(new THREE.CylinderGeometry(70,70,1.2,48), new THREE.MeshStandardMaterial({color:'#1b2f5c', transparent:true, opacity:0.35}));
  disk.position.set(site.x, gy+1.2, site.z); scene.add(disk);
  window.__sitePole=[pole,disk];
}

// ---------- 모드/레이어 ----------
const state={mode:'smooth', bld:true, road:true, water:true, lbl:true};
function apply(){
  const s=state.mode==='step';
  stepMesh.visible=s; smoothMesh.visible=!s;
  waterStep.visible=s&&state.water; waterSmooth.visible=!s&&state.water;
  roadStep.visible=s&&state.road; brgStep.visible=s&&state.road;
  roadSmooth.visible=!s&&state.road; brgSmooth.visible=!s&&state.road; pierMesh.visible=state.road;
  bldStep.visible=s&&state.bld; bldSmooth.visible=!s&&state.bld;
  planStep.visible=s&&state.bld; planSmooth.visible=!s&&state.bld;
  for (const o of labelObjs) o.element.classList.toggle('hide',!state.lbl);
  const gy=(s?hStep:hSmooth)(site.x,site.z);
  window.__sitePole[0].position.y=gy+57; window.__sitePole[1].position.y=gy+1.2;
  document.getElementById('modeStep').setAttribute('aria-pressed',s);
  document.getElementById('modeSmooth').setAttribute('aria-pressed',!s);
  for (const [id,k] of [['tBld','bld'],['tRoad','road'],['tWater','water'],['tLbl','lbl']])
    document.getElementById(id).setAttribute('aria-pressed',state[k]);
}
document.getElementById('modeStep').onclick=()=>{state.mode='step';apply();};
document.getElementById('modeSmooth').onclick=()=>{state.mode='smooth';apply();};
for (const [id,k] of [['tBld','bld'],['tRoad','road'],['tWater','water'],['tLbl','lbl']])
  document.getElementById(id).onclick=()=>{state[k]=!state[k];apply();};

// ---------- 시점 ----------
const CFG=meta.cfg||{};
const EXT=Math.max(G.w,G.h)*G.res;
const views={
  all:{pos:[EXT*0.52,EXT*0.61,EXT*0.81], tgt:[0,20,EXT*0.02]},
  site:{pos:[site.x+900,700,site.z+1100], tgt:[site.x-80,10,site.z-60]},
  ...(CFG.views||{})
};
document.getElementById('ttl').textContent=CFG.title||'콘타모형';
if(/\/3d\//.test(location.pathname)) document.getElementById('back3d').hidden=false;
document.getElementById('sub').innerHTML=(CFG.sub||'')+'<br>국토지리정보원 1:5,000 연속수치지형도 기반 프로토타입';
if(CFG.siteLabel) document.getElementById('vSite').textContent=CFG.siteLabel;
for (const [id,k] of [['vMtn','mtn'],['vIC','ic']]){ const el=document.getElementById(id); if(views[k]){ el.hidden=false; el.textContent=views[k].label||el.textContent; } }
let anim=null;
function pose(pos, tgt, instant, dur=1100){
  const p0=camera.position.clone(), t0=controls.target.clone();
  const p1=new THREE.Vector3(...pos), t1=new THREE.Vector3(...tgt);
  if (instant || matchMedia('(prefers-reduced-motion: reduce)').matches){ anim=null; camera.position.copy(p1); controls.target.copy(t1); return; }
  const start=performance.now();
  anim=(now)=>{ const k=Math.min(1,(now-start)/dur), e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
    camera.position.lerpVectors(p0,p1,e); controls.target.lerpVectors(t0,t1,e); if(k>=1) anim=null; };
}
function go(name, instant, dur){ const v=views[name]; pose(v.pos, v.tgt, instant, dur); }
// 전체 현장 지도(index)에서 들어올 때: 위에서 내려다본 자세 → 기본 시점으로 이어지는 연출
function topPose(){ const t=Math.tan(camera.fov*Math.PI/360), a=camera.aspect; const h=Math.min(EXT*1.15/(2*t*a),10500); return [[0,h,h*0.015],[0,0,0]]; }
window.__introStart=()=>{ const [p,q]=topPose(); pose(p,q,true); controls.update(); };
window.__introPlay=(dur=1700)=>go('all',false,dur);
window.__introOut=(dur=900)=>new Promise(res=>{ const [p,q]=topPose(); pose(p,q,false,dur); setTimeout(res, matchMedia('(prefers-reduced-motion: reduce)').matches?0:dur); });
document.getElementById('vAll').onclick=()=>go('all');
document.getElementById('vSite').onclick=()=>go('site');
document.getElementById('vMtn').onclick=()=>go('mtn');
document.getElementById('vIC').onclick=()=>go('ic');
go(location.hash==='#site'?'site':'all', true);


function cxLOD(){ for(const o of labelObjs){ const k=o.userData.k; if(k!=='cx'&&k!=='mtn') continue; const dist=camera.position.distanceTo(o.position); const sc=k==='cx'?Math.max(0.55,Math.min(2.6,dist<=2200?2200/dist:Math.pow(2200/dist,2))):Math.max(0.6,Math.min(1,1100/dist)); const el=o.element; if(k==='cx'){ el.style.fontSize=(12*sc).toFixed(1)+'px'; el.style.padding=(2*Math.max(1,sc)).toFixed(1)+'px '+(7*sc).toFixed(1)+'px'; } else { el.style.fontSize=(12*sc).toFixed(1)+'px'; } el.style.visibility='visible'; } }
controls.addEventListener('change',cxLOD);
// 통계
const mts=meta.labels.filter(l=>l.k==='mtn').map(l=>({t:l.t,h:parseFloat((l.t.match(/(\d+)m$/)||[0,0])[1])})).sort((a,b)=>b.h-a.h);
const peakTxt=mts.length? mts[0].t.replace(/(\d+)m$/,'$1 m') : (Math.round(D.g_smooth.reduce((a,b)=>b>a?b:a,-1e9)*0.1)+' m');
const nBld=D.bld_nr.length, nRd=D.rd_nr.length;
document.getElementById('stats').innerHTML=
  `<span>건물</span><b>${nBld.toLocaleString()}동</b><span>도로면</span><b>${nRd.toLocaleString()}개</b><span>계단 단수</span><b>${maxLv+1}단 (${STEP} m)</b><span>최고점</span><b>${peakTxt}</b>`;

apply();
document.getElementById('loading').hidden=true;
function fit(){camera.aspect=innerWidth/innerHeight; if(innerWidth>900 && window.parent===window.top) camera.setViewOffset(innerWidth,innerHeight,-150,0,innerWidth,innerHeight); else camera.clearViewOffset(); camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);labelRenderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',fit); fit();
renderer.setAnimationLoop((now)=>{ if(anim) anim(now); controls.update(); renderer.render(scene,camera); labelRenderer.render(scene,camera); postLink(); });
cxLOD(); window.__ready=true;
// ---------- 메인 사이트와 주고받기 ----------
window.__goView=(name)=>{ if(views[name]) go(name,false,1300); };
window.__hasView=(name)=>!!views[name];
window.__focusName=(name)=>{ let o=labelObjs.find(x=>x.userData.name===name); if(!o){ const ux=(meta.complexes||[]).find(c=>c.key==='upcoming'); if(ux&&ux.name===name) o=labelObjs.find(x=>x.userData.k==='site'); } if(!o) return false;
  const ci=(meta.complexes||[]).findIndex(c=>c.name===name)+1, bb=CXBOX[ci];
  const p=o.position, cx=bb?(bb[0]+bb[2])/2:p.x, cz=bb?(bb[1]+bb[3])/2:p.z, gy=hSmooth(cx,cz);
  const K=2.2; // 이전보다 멀리서(단지 전체가 여유 있게 보이도록)
  pose([cx+380*K,gy+300*K,cz+520*K],[cx,gy+40,cz],false,1300); return true; };
// ---- 필터 연동: 메인 사이트에서 걸러진 단지는 이름표를 숨기고 건물을 회색으로 ----
window.__filter=(names)=>{
  const vis=names?new Set(names):null; const G0=new THREE.Color('#dcd8cf'); const hid=new Set();
  (meta.complexes||[]).forEach((c,i)=>{ if(vis && c.key!=='upcoming' && c.key!=='over10' && !vis.has(c.name)) hid.add(i+1); }); // 10년 초과는 목록에 없는 참고용이라 필터와 무관하게 항상 표시
  for(const m of [bldStep,bldSmooth,planStep,planSmooth]){
    const col=m.geometry.attributes.color; if(!m.userData.orig) m.userData.orig=col.array.slice();
    col.array.set(m.userData.orig);
    for(const ci of hid) for(const [a,b] of (m.userData.rng[ci]||[])) for(let v=a;v<b;v++){ col.array[v*3]=G0.r; col.array[v*3+1]=G0.g; col.array[v*3+2]=G0.b; }
    col.needsUpdate=true;
  }
  for(const o of labelObjs) if(o.userData.k==='cx') o.element.classList.toggle('fhide', !!vis && !vis.has(o.userData.name));
};
// ---- 비교 연결선: 두 단지 이름표의 화면 좌표를 메인 사이트로 보내 점선·거리 라벨을 그리게 함 ----
let linkPair=null, lastLink='';
function linkObj(name){ let o=labelObjs.find(x=>x.userData.name===name); if(!o){ const ux=(meta.complexes||[]).find(c=>c.key==='upcoming'); if(ux&&ux.name===name) o=labelObjs.find(x=>x.userData.k==='site'); } return o; }
window.__link=(a,b)=>{ const oa=linkObj(a), ob=linkObj(b); if(!oa||!ob){ linkPair=null; return false; }
  linkPair=[oa,ob]; lastLink=''; const pa=oa.position, pb=ob.position; const cx=(pa.x+pb.x)/2, cz=(pa.z+pb.z)/2, d=Math.hypot(pa.x-pb.x,pa.z-pb.z), gy=hSmooth(cx,cz); let R=Math.max(700,d*1.15);
  const tc=camera.clone(); const fitsAt=(r)=>{ tc.position.set(cx+r*0.35,gy+r*0.85,cz+r*0.75); tc.lookAt(cx,gy,cz); tc.updateMatrixWorld(true);
    return [pa,pb].every(p=>{ const v=p.clone().project(tc); return Math.abs(v.x)<0.62&&Math.abs(v.y)<0.7&&v.z<1; }); };
  for(let i=0;i<40&&!fitsAt(R);i++) R*=1.12;
  pose([cx+R*0.35,gy+R*0.85,cz+R*0.75],[cx,gy,cz],false,1200); return true; };
window.__unlink=()=>{ linkPair=null; lastLink=''; toTop({t:'link-pos',off:true}); };
function postLink(){ if(!linkPair||!EMBED) return; const w=innerWidth,h=innerHeight;
  const pr=o=>{ const v=o.position.clone().project(camera); return {x:Math.round((v.x+1)/2*w),y:Math.round((1-v.y)/2*h),vis:v.z<1}; };
  const a=pr(linkPair[0]), b=pr(linkPair[1]); const k=[a.x,a.y,b.x,b.y].join(','); if(k!==lastLink){ lastLink=k; toTop({t:'link-pos',a,b}); } }
window.__rotate=(on)=>{ controls.autoRotate=!!on; controls.autoRotateSpeed=0.7; };
if (EMBED){
  const st=document.createElement('style'); st.textContent='#back3d{display:none!important} .panel{display:none!important}'; document.head.appendChild(st);
  window.addEventListener('message',(e)=>{ const d=e.data||{}; if(d.t==='focus') window.__focusName(d.name); else if(d.t==='view') window.__goView(d.v); else if(d.t==='rotate') window.__rotate(d.on); });
  toTop({t:'model-ready',site:SITE});
}
document.addEventListener('keydown',function(e){ if(e.key==='Escape' && window.parent!==window){ try{ window.parent.postMessage({t:'esc'}, location.origin); }catch(_){} } });
