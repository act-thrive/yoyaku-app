/* 新しい版の通知：アプリ（予約表・在庫管理・施術録・レセプトチェック）が更新されたら、
   「⟳ 更新」ボタンに赤い丸で件数を出す。予約表以外のページでは右下に更新ボタンを出す。 */
(function(){
  var PAGES=['index.html','zaiko.html','sejutsu.html','receipt.html','update-check.js'];
  var INTERVAL=120000;
  var base={},count=0,lastSig=null,busy=false;
  function hash(t){var h=5381;for(var i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return t.length+':'+h;}
  function stamp(p){
    // 中身そのものを比べる（サーバの日時やETagは中身が同じでも変わることがあるため）
    return fetch(p,{cache:'no-cache'}).then(function(r){
      if(!r.ok)return null;return r.text().then(hash);
    }).catch(function(){return null;});
  }
  function reload(){location.replace(location.pathname+'?r='+Date.now()+location.hash);}
  function css(){
    if(document.getElementById('uc-css'))return;
    var s=document.createElement('style');s.id='uc-css';
    s.textContent='.uc-badge{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;margin-left:6px;border-radius:10px;background:#d93025;color:#fff;font-size:12px;font-weight:700;line-height:1}'+
      '#uc-float{position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;align-items:center;gap:6px;padding:10px 14px;border:0;border-radius:24px;background:#1f6f66;color:#fff;font:700 15px/1 sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer}';
    document.head.appendChild(s);
  }
  function show(){
    css();
    var btn=document.getElementById('refresh');
    if(btn){
      var b=btn.querySelector('.uc-badge');
      if(!b){b=document.createElement('span');b.className='uc-badge';btn.appendChild(b);}
      b.textContent=count;
      btn.title='新しい版があります（'+count+'件）。押すと最新の画面になります';
    }else{
      var f=document.getElementById('uc-float');
      if(!f){f=document.createElement('button');f.id='uc-float';f.type='button';f.onclick=reload;document.body.appendChild(f);}
      f.innerHTML='⟳ 新しい版があります<span class="uc-badge">'+count+'</span>';
    }
  }
  var pending=null,recheck=0;
  function check(){
    if(busy||document.hidden)return;busy=true;
    Promise.all(PAGES.map(stamp)).then(function(st){
      if(st.some(function(x){return x==null;}))return;
      var first=!Object.keys(base).length;
      if(first){PAGES.forEach(function(p,i){base[p]=st[i];});return;}
      var changed=PAGES.some(function(p,i){return base[p]!==st[i];});
      var sig=st.join('|');
      if(!changed||sig===lastSig){pending=null;return;}
      // 2回続けて同じ新しい中身が見えたときだけ知らせる
      if(pending!==sig){pending=sig;clearTimeout(recheck);recheck=setTimeout(check,20000);return;}
      pending=null;lastSig=sig;count++;show();
    }).finally(function(){busy=false;});
  }
  if(location.protocol==='file:')return;
  check();
  setInterval(check,INTERVAL);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)check();});
  window.addEventListener('focus',check);
  window.__updateCheck=check;
})();
