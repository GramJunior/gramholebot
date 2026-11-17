# usage: python3 -I fetch_gltf.py <repo> <outdir> <relpath> [<relpath>...]   (relpath under assets/kaykit/)
import sys, os, json, subprocess, urllib.parse
repo, out = sys.argv[1], sys.argv[2]
base = 'https://raw.githubusercontent.com/%s/main/assets/kaykit/' % repo
def get(rel, dst):
    if os.path.exists(dst) and os.path.getsize(dst) > 0: return True
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    r = subprocess.run(['curl', '-s', '-f', '-o', dst, base + urllib.parse.quote(rel)])
    if r.returncode != 0:
        print('FAIL', rel); 
        if os.path.exists(dst): os.remove(dst)
        return False
    return True
for rel in sys.argv[3:]:
    dst = os.path.join(out, rel)
    if not get(rel, dst): continue
    if rel.endswith('.gltf'):
        d = json.load(open(dst))
        for b in d.get('buffers', []) + d.get('images', []):
            u = b.get('uri')
            if u and not u.startswith('data:'):
                get(os.path.dirname(rel) + '/' + urllib.parse.unquote(u), os.path.join(os.path.dirname(dst), urllib.parse.unquote(u)))
print('done', len(sys.argv) - 3)
