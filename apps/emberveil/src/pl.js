// ---------- v40: «Об игре» в Настройках — Политика конфиденциальности, Пользовательское соглашение (apps/legal/, на Pages: /legal/*.html) и удаление аккаунта (DELETE /me) ----------
const LEGAL_URL=f=>{ try{ return new URL('../legal/'+f,location.href).href; }catch(e){ return '/legal/'+f; } };
function legalOpen(f){ const url=LEGAL_URL(f); try{ const w=window.Telegram&&Telegram.WebApp; if(w&&w.initData&&w.openLink){ w.openLink(url); return; } }catch(e){} try{ window.open(url,'_blank','noopener'); }catch(e){ location.href=url; } }
function accDelete(){
  if(!netOn()||!NET.tg||!window.EVNet||!EVNet.deleteAccount){ toast('Удалить аккаунт на сервере можно в Telegram при подключении к сети. Локальный прогресс стирает «Сбросить прогресс…»'); return; }
  EVNet.deleteAccount().then(r=>{
    if(r&&r.ok){ try{ track('account','deleted'); }catch(e){} saveWipe(); S=newSave(); toast('Аккаунт и данные удалены'); setTimeout(()=>location.reload(),900); return; }
    toast(r&&r.error==='leader'?'Сначала передайте лидерство в клане или покиньте клан':'Не удалось удалить: '+esc((r&&r.message)||'нет связи'));
  }).catch(()=>toast('Не удалось удалить: нет связи'));
}
// v41: «Отправлять статистику» (p94: statsOn/statsSet) — по умолчанию вкл.; выкл. — игра не шлёт события, сервер их не учитывает
function statsRow(){ const on=typeof statsOn==='function'?statsOn():true; return `<div class="row evStats" style="gap:6px;flex-wrap:wrap;align-items:center;margin:0 0 6px"><button class="btn ${on?'leather':'woodb'} small" id="evStats" ${act(()=>{ if(typeof statsSet==='function') statsSet(!on); })}>${on?ico('check')+' ':''}Отправлять статистику: ${on?'вкл.':'выкл.'}</button></div><div class="muted" style="margin:-2px 0 6px">Обезличенные счётчики (какие этапы проходят, где застревают, сколько длится игра) помогают делать Эмбервейл лучше. Можно выключить — игра продолжит работать как обычно.</div>`; }
{ const _ps=pSettings; pSettings=function(pause){ const h=_ps.apply(this,arguments); if(pause||typeof h!=='string') return h; try{
  const del=`<button class="btn woodb small" ${act(()=>{ PANEL.opts.accDel=!PANEL.opts.accDel; rerender(); })}>Удалить аккаунт и данные…</button>${PANEL.opts.accDel?`<div class="card" style="margin-top:6px">Будут удалены облачное сохранение, рекорды, деревня, клан, друзья и имя профиля, а также прогресс на этом устройстве. Покупки пропадут. Отменить нельзя. <button class="btn leather small" id="evAccDel" ${act(()=>accDelete())}>Да, удалить навсегда</button></div>`:''}`;
  const about=`<div class="sect">Об игре</div><div class="row evLegal" style="gap:6px;flex-wrap:wrap;margin:2px 0 6px"><button class="btn woodb small" id="evPriv" ${act(()=>legalOpen('privacy.html'))}>Конфиденциальность</button><button class="btn woodb small" id="evTerms" ${act(()=>legalOpen('terms.html'))}>Соглашение</button></div><div class="muted" style="margin:-2px 0 6px">Вопросы и покупки: бот @emberveil_game_bot → /paysupport</div>`+statsRow();
  return h+about+`<div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0 4px">${del}</div>`;
}catch(e){ return h; } }; }
