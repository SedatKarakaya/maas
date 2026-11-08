(function(){
var K='maas.v2',PW='maas.pw',LAST='maas.last',DLK='maas.dl',te=new TextEncoder(),td=new TextDecoder();
var b64=function(u){var s='';new Uint8Array(u).forEach(function(x){s+=String.fromCharCode(x)});return btoa(s)};
var ub=function(s){return Uint8Array.from(atob(s),function(c){return c.charCodeAt(0)})};
async function key(pw,salt,bits){var k=await crypto.subtle.importKey('raw',te.encode(pw),'PBKDF2',false,['deriveBits','deriveKey']);var p={name:'PBKDF2',salt:salt,iterations:150000,hash:'SHA-256'};
 return bits?crypto.subtle.deriveBits(p,k,256):crypto.subtle.deriveKey(p,k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function hashPw(pw,salt){return b64(await key(pw,salt,true))}
async function enc(text,pw){var s=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 var ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},await key(pw,s),te.encode(text));return{v:1,enc:true,s:b64(s),iv:b64(iv),ct:b64(ct)}}
async function dec(o,pw){var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(o.iv)},await key(pw,ub(o.s)),ub(o.ct));return td.decode(pt)}
var $=function(s){return document.querySelector(s)},msg=function(t){var m=$('#gmsg');if(m)m.textContent=t};
var locked=false,ov=null;
var dl=function(){var v=parseFloat(localStorage.getItem(DLK));return isNaN(v)?2:v};
var stamp=function(){try{localStorage.setItem(LAST,String(Date.now()))}catch(e){}};
var stale=function(){var l=parseInt(localStorage.getItem(LAST)||'0',10);return Date.now()-l>=dl()*60000};
async function saveCred(type,secret){var s=crypto.getRandomValues(new Uint8Array(16));localStorage.setItem(PW,JSON.stringify({t:type,s:b64(s),h:await hashPw(secret,s)}));stamp()}
async function check(cfg,secret){return (await hashPw(secret,ub(cfg.s)))===cfg.h}
function pad(cb){var ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg'),cs=[],seq=[],down=false;
 s.setAttribute('viewBox','0 0 240 240');s.style.cssText='width:240px;max-width:100%;height:auto;touch-action:none;display:block;margin:8px auto;background:var(--gl2);border:1px solid var(--bd);border-radius:20px';
 var ln=document.createElementNS(ns,'polyline');ln.setAttribute('fill','none');ln.setAttribute('stroke-width','5');ln.setAttribute('stroke-linecap','round');ln.setAttribute('stroke-linejoin','round');ln.style.stroke='var(--acc)';s.appendChild(ln);
 var X=function(i){return 40+(i%3)*80},Y=function(i){return 40+Math.floor(i/3)*80};
 for(var i=0;i<9;i++){var c=document.createElementNS(ns,'circle');c.setAttribute('cx',X(i));c.setAttribute('cy',Y(i));c.setAttribute('r',10);c.style.fill='var(--tx)';c.style.opacity='.5';s.appendChild(c);cs.push(c)}
 var pt=function(e){var r=s.getBoundingClientRect();return[(e.clientX-r.left)*240/r.width,(e.clientY-r.top)*240/r.height]};
 var upd=function(p){var a=seq.map(function(i){return X(i)+','+Y(i)});if(p)a.push(p[0]+','+p[1]);ln.setAttribute('points',a.join(' '))};
 var hit=function(p){for(var i=0;i<9;i++){if(Math.hypot(p[0]-X(i),p[1]-Y(i))<26&&seq.indexOf(i)<0){seq.push(i);cs[i].style.opacity='1';cs[i].setAttribute('r',14)}}};
 s.reset=function(){seq=[];ln.setAttribute('points','');cs.forEach(function(c){c.style.opacity='.5';c.setAttribute('r',10)})};
 s.addEventListener('pointerdown',function(e){e.preventDefault();s.reset();down=true;try{s.setPointerCapture(e.pointerId)}catch(x){}var p=pt(e);hit(p);upd(p)});
 s.addEventListener('pointermove',function(e){if(!down)return;var p=pt(e);hit(p);upd(p)});
 var end=function(){if(!down)return;down=false;upd();var r=seq.join('');setTimeout(function(){s.reset()},350);cb(r)};
 s.addEventListener('pointerup',end);s.addEventListener('pointercancel',end);return s}
function panel(){var d=document.querySelector('details');if(!d)return;var w=document.createElement('div');w.style.marginTop='18px';
 w.innerHTML='<h2>Güvenlik ve yedek</h2><div class="fs"><div><label for="gp1">Uygulama şifresi (en az 4 karakter)</label><input id="gp1" type="password" autocomplete="new-password"></div><div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap"><button class="btn" id="gps">Şifreyi kaydet</button><button class="btn" id="gpt">Desen belirle</button><button class="btn" id="gpr">Kilidi kaldır</button></div><div><label for="gdl">Kilit gecikmesi (dakika): uygulamadan bu süreden uzun ayrılırsan kilit sorar</label><input id="gdl" type="number" min="0" step="1"></div><div><label for="gbp">Yedek şifresi (boşsa şifresiz yedek)</label><input id="gbp" type="password" autocomplete="off"></div><div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap"><button class="btn" id="gbe">Yedek indir</button><button class="btn" id="gbi">Yedekten yükle</button></div></div><div id="gpa"></div><input type="file" id="gbf" accept=".json,application/json" hidden><p class="note" id="gmsg">Kilit ekranı bir kilittir; veriler telefonda şifrelenmeden durur. Yedek şifresi yazarsan yedek dosyası şifrelenir. Şifreni ya da desenini unutursan tarayıcı verisini silmen gerekir; bu yüzden düzenli yedek al.</p>';
 d.appendChild(w);$('#gdl').value=dl();
 $('#gdl').onchange=function(e){var v=parseFloat(e.target.value);if(isNaN(v)||v<0)v=2;localStorage.setItem(DLK,String(v));e.target.value=v;msg('Kilit gecikmesi '+v+' dakika.')};
 $('#gps').onclick=async function(){var p=$('#gp1').value;if(p.length<4){msg('Şifre en az 4 karakter olmalı.');return}
  await saveCred('w',p);$('#gp1').value='';msg('Şifre kaydedildi. Uygulamadan kilit gecikmesinden uzun ayrılınca şifre sorar.')};
 $('#gpt').onclick=function(){var a=$('#gpa'),first=null;a.innerHTML='<p class="note" id="gpm" style="text-align:center">Deseni çiz (en az 4 nokta)</p>';
  var p=pad(async function(r){var m=$('#gpm');if(r.length<4){m.textContent='En az 4 nokta bağla, tekrar dene.';first=null;return}
   if(first===null){first=r;m.textContent='Aynı deseni tekrar çiz.';return}
   if(r!==first){first=null;m.textContent='Desenler eşleşmedi. Baştan başla.';return}
   await saveCred('p','P'+r);a.innerHTML='';msg('Desen kaydedildi. Uygulamadan kilit gecikmesinden uzun ayrılınca desen sorar.')});a.appendChild(p)};
 $('#gpr').onclick=function(){if(!localStorage.getItem(PW)){msg('Kayıtlı kilit yok.');return}if(confirm('Şifre ya da desen kaldırılsın mı?')){localStorage.removeItem(PW);msg('Kilit kaldırıldı.')}};
 $('#gbe').onclick=async function(){try{var raw=localStorage.getItem(K)||'{}',p=$('#gbp').value,o=p?await enc(raw,p):{v:1,enc:false,data:raw};
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download='maas-yedek-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();msg(p?'Şifreli yedek indirildi.':'Yedek indirildi (şifresiz).')}catch(e){msg('Yedek alınamadı.')}};
 $('#gbi').onclick=function(){$('#gbf').click()};
 $('#gbf').onchange=async function(ev){var f=ev.target.files[0];if(!f)return;try{var o=JSON.parse(await f.text()),raw;
  if(o.enc){var p=$('#gbp').value;if(!p){msg('Şifreli yedek: önce yedek şifresini yaz, sonra tekrar seç.');ev.target.value='';return}raw=await dec(o,p)}else raw=o.data;
  JSON.parse(raw);if(!confirm('Mevcut veriler yedektekilerle değiştirilsin mi?'))return;localStorage.setItem(K,raw);location.reload()}catch(e){msg('Yedek okunamadı. Dosya ya da şifre hatalı.')}ev.target.value=''};
}
function showLock(){var st=localStorage.getItem(PW);if(!st||locked)return;var cfg=JSON.parse(st),isP=cfg.t==='p',mn=document.querySelector('main');locked=true;mn.style.display='none';
 ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:99;display:grid;place-items:center;padding:20px;background:var(--bg)';
 ov.innerHTML='<div class="g" style="max-width:340px;width:100%;text-align:center"><h2>Maaş hesabı</h2><p class="note" style="margin:0 0 12px">'+(isP?'Devam etmek için desenini çiz.':'Devam etmek için şifreni gir.')+'</p>'+(isP?'<div id="lpad"></div>':'<input id="lpw" type="password" autocomplete="current-password" placeholder="Şifre" style="margin-bottom:10px"><button class="btn" id="lgo" style="width:100%">Aç</button>')+'<p class="note" id="lerr" style="color:var(--neg)"></p></div>';
 document.body.appendChild(ov);
 var open=function(){ov.remove();ov=null;locked=false;mn.style.display='';stamp()};
 if(isP){$('#lpad').appendChild(pad(async function(r){if(r.length>=4&&await check(cfg,'P'+r))open();else $('#lerr').textContent='Desen yanlış.'}))}
 else{var go=async function(){if(await check(cfg,$('#lpw').value))open();else{$('#lerr').textContent='Şifre yanlış.';$('#lpw').value=''}};
  $('#lgo').onclick=go;$('#lpw').onkeydown=function(e){if(e.key==='Enter')go()};$('#lpw').focus()}}
panel();
if(localStorage.getItem(PW)){if(stale())showLock();else stamp()}
setInterval(function(){if(!locked&&!document.hidden&&localStorage.getItem(PW))stamp()},15000);
document.addEventListener('visibilitychange',function(){if(!localStorage.getItem(PW))return;if(document.hidden){if(!locked)stamp()}else if(!locked&&stale())showLock()});
window.addEventListener('pagehide',function(){if(!locked)stamp()});
})();
