#!/bin/sh
# Сборка index.html из src/ (порядок важен). Запуск: sh apps/emberveil/build.sh
set -e
D=$(cd "$(dirname "$0")" && pwd)
cat "$D"/src/p0.html "$D"/src/p1.js "$D"/src/p2.js "$D"/src/p3.js "$D"/src/p3b.js "$D"/src/p3c.js "$D"/src/p4.js "$D"/src/p5.js "$D"/src/p6.js "$D"/src/p7.js "$D"/src/p7b.js "$D"/src/p8.js "$D"/src/p8b.js "$D"/src/p9.js > "$D"/index.html
python3 - "$D" <<'PY'
import sys;d=sys.argv[1];s=open(d+'/index.html').read()
i=s.index('"use strict";'); j=s.rindex('</script>')
open('/tmp/ev_main_check.js','w').write(s[i:j])
PY
node --check /tmp/ev_main_check.js && echo SYNTAX_OK
wc -c "$D"/index.html
