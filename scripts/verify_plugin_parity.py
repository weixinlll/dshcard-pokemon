import hashlib, zipfile, sys
from pathlib import Path

ROOT = Path(r'C:\Users\30625\dshcard-pokemon')
full = ROOT / 'dist' / 'pokemon-frlg-1.0.3.dshcard'
code = ROOT / 'dist' / 'pokemon-kanto-1.0.3.zip'
PREFIX = 'plugins/pokemon-kanto/'

def entries(path, prefix):
    out = {}
    with zipfile.ZipFile(path) as z:
        for info in z.infolist():
            if info.is_dir() or not info.filename.startswith(prefix):
                continue
            rel = info.filename[len(prefix):]
            out[rel] = hashlib.sha256(z.read(info)).hexdigest()
        return out

a = entries(full, PREFIX)
b = entries(code, PREFIX)
print('full.dshcard 的插件文件数:', len(a))
print('code zip 的插件文件数   :', len(b))

only_full = sorted(set(a) - set(b))
only_code = sorted(set(b) - set(a))
differing = sorted(k for k in set(a) & set(b) if a[k] != b[k])

print('只在完整包里:', only_full or '（无）')
print('只在代码包里:', only_code or '（无）')
print('内容不同的  :', differing or '（无）')
ok = not only_full and not only_code and not differing
print('\n逐字节一致:', ok)
if differing:
    for k in differing[:10]:
        print('  差异:', k)
sys.exit(0 if ok else 1)

