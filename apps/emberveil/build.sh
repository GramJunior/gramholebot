#!/bin/sh
# Сборка index.html из src/ (порядок важен). Запуск: sh apps/emberveil/build.sh
# В index.html встраиваются: lab/assets.js (EVAssets), lab/postfx.js (EVPostFX/EVFX), lab/manifest.json (EV_MANIFEST)
# и src/ev-net.js (EVNet — копия server/client/ev-net.js; обновляется из server/, если он рядом).
set -e
D=$(cd "$(dirname "$0")" && pwd)
[ -f "$D/../../server/client/ev-net.js" ] && cp "$D/../../server/client/ev-net.js" "$D/src/ev-net.js"
PARTS="p0.html p1.js p2.js p2a.js p3.js p3b.js p3c.js p4.js p5.js p6.js p7.js p7b.js p8.js p8b.js p8n.js p10.js p11.js p12.js p13.js p14.js p15.js p9.js p16.js p17.js p18.js p19.js p20.js p21.js p22.js p23.js pz.html"
python3 - "$D" $PARTS <<'PY'
import sys,json
d=sys.argv[1]; parts=sys.argv[2:]
s=''.join(open(d+'/src/'+f,encoding='utf-8').read() for f in parts)
import os
M=json.load(open(d+'/lab/manifest.json',encoding='utf-8'))
M['sizes']={k:os.path.getsize(d+'/assets/'+v) for k,v in M['files'].items() if os.path.exists(d+'/assets/'+v)}
man=json.dumps(M,ensure_ascii=False,separators=(',',':'))
mods=('<script>\n'+open(d+'/lab/assets.js',encoding='utf-8').read()+'\n</script>\n'
      '<script>\n'+open(d+'/lab/postfx.js',encoding='utf-8').read()+'\n</script>\n'
      '<script>window.EV_MANIFEST='+man.replace('</','<\\/')+';</script>\n'
      '<script>\n'+open(d+'/src/ev-net.js',encoding='utf-8').read()+'\n</script>')
assert '<!--@@MODULES@@-->' in s
s=s.replace('<!--@@MODULES@@-->',mods)
open(d+'/index.html','w',encoding='utf-8').write(s)
PY
T=${TMPDIR:-/tmp}/ev_main_check.js
python3 - "$D" "$T" <<'PY'
import sys;d=sys.argv[1];s=open(d+'/index.html',encoding='utf-8').read()
i=s.index('"use strict"; /*@@MAIN@@*/'); j=s.rindex('</script>')
open(sys.argv[2],'w',encoding='utf-8').write(s[i:j])
PY
node --check "$T" && echo SYNTAX_OK
for f in lab/assets.js lab/postfx.js src/ev-net.js; do node --check "$D/$f"; done
wc -c "$D"/index.html
