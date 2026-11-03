#!/bin/sh
# Сборка index.html из src/ (порядок важен). Запуск: sh apps/emberveil/build.sh
set -e
D=$(cd "$(dirname "$0")" && pwd)
PARTS="p0.html p1.js p2.js p3.js p3b.js p3c.js p4.js p5.js p6.js p7.js p7b.js p8.js p8b.js p10.js p11.js p12.js p13.js p14.js p15.js p9.js p16.js pz.html"
( for f in $PARTS; do cat "$D/src/$f"; done ) > "$D/index.html"
T=${TMPDIR:-/tmp}/ev_main_check.js
python3 - "$D" "$T" <<'PY'
import sys;d=sys.argv[1];s=open(d+'/index.html').read()
i=s.index('"use strict";'); j=s.rindex('</script>')
open(sys.argv[2],'w').write(s[i:j])
PY
node --check "$T" && echo SYNTAX_OK
wc -c "$D"/index.html
