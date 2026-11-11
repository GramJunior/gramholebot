#!/bin/sh
# Сборка index.html из src/ (порядок важен). Запуск: sh apps/emberveil/build.sh
# В index.html встраиваются: lab/assets.js (EVAssets), lab/postfx.js (EVPostFX/EVFX), lab/manifest.json (EV_MANIFEST)
# и src/ev-net.js (EVNet — копия server/client/ev-net.js; обновляется из server/, если он рядом).
set -e
D=$(cd "$(dirname "$0")" && pwd)
[ -f "$D/../../server/client/ev-net.js" ] && cp "$D/../../server/client/ev-net.js" "$D/src/ev-net.js"
# p58 — карта и карточки этапов (v29, параллельная работа): включается, когда файл есть; p59 — обучение и подсказки (v29)
# p60–p63 — Глава II, веха 4: Изнанка Хмари и финал (v30): данные, системы, боссы и концовки, мир
# p70 — v31: оптимизация и стабильность (вызовы отрисовки, прогрев шейдеров, Telegram, сохранения)
# p64 — правки по аудиту боя и графики (v31): жесты героя, «Клинок Зари», баннер и всплывашки
# p65 — баланс и системы (v32): опыт, ворота Главы II, заточка, Дары Очага, Архив Памяти, отряд на владыках
# p66–p67 — контент v33: Испытания, Именные охоты, Просьбы, новые питомцы (p66 — данные, p67 — движок и интерфейс); p68 — баланс v33
# p71 — v34: интерфейс «Дерево и латунь» (дизайн-система), хаб «Награды» (серия 7 дней, печати, месяц, Колесо судьбы), экран улучшения зданий, карта и карточка этапа
# p76 — v37: загадки и ловушки (7 новых загадок, «Испытание ума», 6 ловушек в коридорах, проверка решаемости в валидаторе, бот-решатель)
P58=""; [ -f "$D/src/p58.js" ] && P58="p58.js"
# p74 — v37: правки боя (захват цели, «Снаряжение» в бою, карта этапа, заряд посоха, плавный возврат с боя)
# p72/p73 — «Дерево и латунь», этап 2 (параллельные части): включаются, когда файл есть
P72=""; [ -f "$D/src/p72.js" ] && P72="p72.js"; P73=""; [ -f "$D/src/p73.js" ] && P73="p73.js"
# p74–p79 — v37: параллельные правки (бой, сюжет и звук, загадки, облик меню): включаются, когда файл есть
# p79 — v38: жители деревни (сетка проходимости, места, мастера у наковальни/котла/стойки) и понятные атрибуты/характеристики в Профиле
# p80 — v39: правки перед запуском (починка сохранений при загрузке, отчёты об ошибках, прогрев живого героя)
# p81 — v39.1: вёрстка (масштаб от полезной области, доски с каруселями не сжимают карточки, подсказка «есть ещё»)
# p82 — v39.4: компактный HUD боя на телефоне (кольца кнопок вокруг атаки, верх слева и мини-карта меньше)
# p90 — v40: правки UX по разбору студии (мини-карта и джойстик, значки боя, короткий плац и подсказки в моменте, первый вечер в Броде, цель этапа в трекере, итоги, доступность, «Ветеран»/«Дар дня», «Путь Угля» 50 × 200)
PX=""; for n in 74 75 76 77 78 79 80 81 82 90; do [ -f "$D/src/p$n.js" ] && PX="$PX p$n.js"; done
PARTS="p0.html p1.js p1i.js p2.js p2a.js p3.js p3b.js p3c.js p4.js p5.js p6.js p6b.js p6c.js p6t.js p7.js p7b.js p8.js p8b.js p8n.js p10.js p11.js p12.js p13.js p14.js p15.js p9.js p16.js p17.js p18.js p19.js p20.js p21.js p22.js p23.js p24.js p25.js p26.js p27.js p28.js p29.js p30.js p31.js p32.js p33.js p34.js p35.js p36.js p37.js p38.js p39.js p40.js p41.js p42.js p43.js p44.js p45.js p46.js p47.js p48.js p49.js p50.js p51.js p52.js p53.js p54.js p55.js p56.js p57.js $P58 p59.js p60.js p61.js p62.js p63.js p64.js p65.js p66.js p67.js p68.js p70.js p71.js $P72 $P73 $PX pz.html"
python3 - "$D" $PARTS <<'PY'
import sys,json
d=sys.argv[1]; parts=sys.argv[2:]
s=''.join(open(d+'/src/'+f,encoding='utf-8').read() for f in parts)
import os
M=json.load(open(d+'/lab/manifest.json',encoding='utf-8'))
M['sizes']={k:os.path.getsize(d+'/assets/'+v) for k,v in M['files'].items() if os.path.exists(d+'/assets/'+v)}
# v31: короткий хэш содержимого — в адрес файла (?v=…): ассеты можно долго кэшировать (apps/_headers), а обновление файла меняет адрес
import hashlib
M['hash']={k:hashlib.sha1(open(d+'/assets/'+v,'rb').read()).hexdigest()[:10] for k,v in M['files'].items() if os.path.exists(d+'/assets/'+v)}
man=json.dumps(M,ensure_ascii=False,separators=(',',':'))
# v31: модули выполняются после движка (vendor/*.js с defer): регистрируются в __evParts и запускаются на DOMContentLoaded
wrap=lambda f:'<script>__evParts.push(function(){\n'+open(d+f,encoding='utf-8').read()+'\n});</script>\n'
mods=(wrap('/lab/assets.js')+wrap('/lab/postfx.js')+
      '<script>window.EV_MANIFEST='+man.replace('</','<\\/')+';</script>\n'+
      wrap('/src/ev-net.js'))
assert '<!--@@MODULES@@-->' in s
s=s.replace('<!--@@MODULES@@-->',mods)
# v31: предзагрузка ядра (.glb, без которых игра не стартует; детальные персонажи — «Авто») с низким приоритетом: движок важнее
G=dict(M['groups']); G.update(M.get('ubcGroups') or {})
pre=[]
for g in ['core']:
  for k in G.get(g,[]):
    f=M['files'].get(k)
    if f: f=f+('?v='+M['hash'][k] if k in M['hash'] else '')
    if f and f not in pre: pre.append(f)
# (не <link rel=preload>: разбор начинается позже, чем через 3 с после load, и Chrome ругается; ранний fetch отдаётся загрузчику в p70.js)
# пропуск: «Модели: простые» или «Классические» персонажи в сохранении — им этот набор не нужен
links=('<script>window.__evPre={};(function(L){ try{ var r=localStorage.getItem("emberveil_save_v1")||""; if(r.indexOf(\'"models":"simple"\')>=0||r.indexOf(\'"chars":"classic"\')>=0||/[?&]chars=classic/.test(location.search)) return; }catch(e){}'
       ' if(!window.fetch) return; L.forEach(function(u){ try{ __evPre[u]=fetch(u,{credentials:"same-origin",priority:"low"}).then(function(r){ return r.ok?r.arrayBuffer():null; }).catch(function(){ return null; }); }catch(e){} }); })('
       +json.dumps(['assets/'+f for f in pre])+');</script>')
assert '<!--@@PRELOAD@@-->' in s
s=s.replace('<!--@@PRELOAD@@-->',links)
# v31: основной код — без пробелов и с упрощённым синтаксисом (имена не меняются: __game.x() и инструменты ищут их по имени),
# если рядом есть esbuild (server/node_modules или ESBUILD=путь); EV_MINIFY=0 — собрать как есть
import subprocess,shutil
esb=os.environ.get('ESBUILD') or (d+'/../../server/node_modules/.bin/esbuild')
if os.environ.get('EV_MINIFY','1')!='0' and os.path.exists(esb):
  i=s.index('__evParts.push(function(){\n"use strict"; /*@@MAIN@@*/'); j=s.rindex('</script>')
  try:
    r=subprocess.run([esb,'--minify-whitespace','--minify-syntax','--charset=utf8','--log-level=error','--loader=js'],input=('var __evParts=[];'+s[i:j]).encode('utf-8'),capture_output=True,check=True)
    out=r.stdout.decode('utf-8').strip()
    out=out[out.index('__evParts.push('):]
    assert '</script' not in out.lower()
    s=s[:i]+out+'\n'+s[j:]
    print('minified main JS:',j-i,'->',len(out))
  except Exception as e:
    print('minify skipped:',e)
open(d+'/index.html','w',encoding='utf-8').write(s)
PY
T=${TMPDIR:-/tmp}/ev_main_check.js
python3 - "$D" "$T" <<'PY'
import sys;d=sys.argv[1];s=open(d+'/index.html',encoding='utf-8').read()
import re
m=re.search(r'__evParts\.push\(function\(\)\{\s*"use strict";',s); i=m.start(); j=s.rindex('</script>')
open(sys.argv[2],'w',encoding='utf-8').write('var __evParts=[];'+s[i:j])
PY
node --check "$T" && echo SYNTAX_OK
for f in lab/assets.js lab/postfx.js src/ev-net.js; do node --check "$D/$f"; done
wc -c "$D"/index.html
