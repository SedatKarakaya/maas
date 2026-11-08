(function(){
var K='maas.v2',PW='maas.pw',te=new TextEncoder(),td=new TextDecoder();
var b64=function(u){var s='';new Uint8Array(u).forEach(function(x){s+=String.fromCharCode(x)});return btoa(s)};
var ub=function(s){return Uint8Array.from(atob(s),function(c){return c.charCodeAt(0)})};
async function key(pw,salt,bits){var k=await crypto.subtle.importKey('raw',te.encode(pw),'PBKDF2',false,['deriveBits','deriveKey']);var p={name:'PBKDF2',salt:salt,iterations:150000,hash:'SHA-256'};
 return bits?crypto.subtle.deriveBits(p,k,256):crypto.subtle.deriveKey(p,k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function hashPw(pw,salt){return b64(await key(pw,salt,true))}
async function enc(text,pw){var s=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 var ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},await key(pw,s),te.encode(text));return{v:1,enc:true,s:b64(s),iv:b64(iv),ct:b64(ct)}}
async function dec(o,pw){var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(o.iv)},await key(pw,ub(o.s)),ub(o.ct));return td.decode(pt)}
var $=function(s){return document.querySelector(s)},msg=function(t){var m=$('#gmsg');if(m)m.textContent=t};
function panel(){var d=document.querySelector('details');if(!d)return;var w=document.createElement('div');w.style.marginTop='18px';
 w.innerHTML='<h2>Güvenlik ve yedek</h2><div class="fs"><div><label for="gp1">Uygulama şifresi (en az 4 karakter)</label><input id="gp1" type="password" autocomplete="new-password"></div><div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap"><button class="btn" id="gps">Şifreyi kaydet</button><button class="btn" id="gpr">Şifreyi kaldır</button></div><div><label for="gbp">Yedek şifresi (boşsa şifresiz yedek)</label><input id="gbp" type="password" autocomplete="off"></div><div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap"><button class="btn" id="gbe">Yedek indir</button><button class="btn" id="gbi">Yedekten yükle</button></div></div><input type="file" id="gbf" accept=".json,application/json" hidden><p class="note" id="gmsg">Şifre ekranı bir kilittir; veriler telefonda şifrelenmeden durur. Yedek şifresi yazarsan yedek dosyası şifrelenir.</p>';
 d.appendChild(w);
 $('#gps').onclick=async function(){var p=$('#gp1').value;if(p.length<4){msg('Şifre en az 4 karakter olmalı.');return}
  var s=crypto.getRandomValues(new Uint8Array(16));localStorage.setItem(PW,JSON.stringify({s:b64(s),h:await hashPw(p,s)}));$('#gp1').value='';msg('Şifre kaydedildi. Uygulama bir sonraki açılışta şifre soracak.')};
 $('#gpr').onclick=function(){if(!localStorage.getItem(PW)){msg('Kayıtlı şifre yok.');return}if(confirm('Uygulama şifresi kaldırılsın mı?')){localStorage.removeItem(PW);msg('Şifre kaldırıldı.')}};
 $('#gbe').onclick=async function(){try{var raw=localStorage.getItem(K)||'{}',p=$('#gbp').value,o=p?await enc(raw,p):{v:1,enc:false,data:raw};
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download='maas-yedek-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();msg(p?'Şifreli yedek indirildi.':'Yedek indirildi (şifresiz).')}catch(e){msg('Yedek alınamadı.')}};
 $('#gbi').onclick=function(){$('#gbf').click()};
 $('#gbf').onchange=async function(ev){var f=ev.target.files[0];if(!f)return;try{var o=JSON.parse(await f.text()),raw;
  if(o.enc){var p=$('#gbp').value;if(!p){msg('Şifreli yedek: önce yedek şifresini yaz, sonra tekrar seç.');ev.target.value='';return}raw=await dec(o,p)}else raw=o.data;
  JSON.parse(raw);if(!confirm('Mevcut veriler yedektekilerle değiştirilsin mi?'))return;localStorage.setItem(K,raw);location.reload()}catch(e){msg('Yedek okunamadı. Dosya ya da şifre hatalı.')}ev.target.value=''};
}
function lock(){var st=localStorage.getItem(PW);if(!st)return;var cfg=JSON.parse(st),mn=document.querySelector('main');mn.style.display='none';
 var o=document.createElement('div');o.style.cssText='position:fixed;inset:0;z-index:99;display:grid;place-items:center;padding:20px;background:var(--bg)';
 o.innerHTML='<div class="g" style="max-width:340px;width:100%;text-align:center"><h2>Maaş hesabı</h2><p class="note" style="margin:0 0 12px">Devam etmek için şifreni gir.</p><input id="lpw" type="password" autocomplete="current-password" placeholder="Şifre" style="margin-bottom:10px"><button class="btn" id="lgo" style="width:100%">Aç</button><p class="note" id="lerr" style="color:var(--neg)"></p></div>';
 document.body.appendChild(o);var go=async function(){var h=await hashPw($('#lpw').value,ub(cfg.s));if(h===cfg.h){o.remove();mn.style.display=''}else{$('#lerr').textContent='Şifre yanlış.';$('#lpw').value=''}};
 $('#lgo').onclick=go;$('#lpw').onkeydown=function(e){if(e.key==='Enter')go()};$('#lpw').focus()}
panel();lock();
})();
