"""Pack only the plugin half of the card, for users who already installed it.

The .dshcard ships ~530 MiB of media that never changes plus ~14 MiB of code.
Reinstalling the whole card to pick up a bug fix means re-downloading the media,
so every release also publishes this code-only archive:

    pokemon-kanto-<version>.zip
      plugins/pokemon-kanto/...      <- byte-identical to what .dshcard carries

Extracted over data/plugins/card-dsh-card-pokemon-frlg-stage-*/ and followed by
a DSH restart, it upgrades the plugin in place: saves, variables and story
memory are untouched, because media lives in data/asset-packs and the plugin
folder carries no player data.

Usage:  python scripts/pack_plugin.py
Output: dist/pokemon-kanto-<version>.zip  +  dist/pack-plugin-manifest.json
"""
import hashlib, json, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / 'pokemon-kanto'
EXCLUDED = {'import-tile-world.cjs', 'test-stadium-sprites.cjs', 'tile-world-data.json'}


def collect():
    """Mirror build_card.py's plugin set exactly, so the archive never drifts.

    Each entry is (path or None, bytes or None): client.js is delivered with the
    shiny-fx bootstrap prepended, exactly as build_card.py does it.
    """
    files = {}
    prefix = 'plugins/pokemon-kanto/'

    def add(name, path=None, data=None):
        if name in files:
            raise ValueError('Duplicate package entry: ' + name)
        files[name] = (path, data)

    for path in sorted(BASE.iterdir()):
        if path.is_file() and (path.suffix in {'.cjs', '.mjs', '.json'} or path.name == 'tile-world-data.json.br') and path.name not in EXCLUDED:
            add(prefix + path.name, path)
    add(prefix + 'README.md', BASE / 'README.md')
    add(prefix + 'client.js', data=(
        'if(!window.KantoShinyFx){\n'
        + (BASE / 'public/shiny-fx.js').read_text(encoding='utf8')
        + '\n}\n'
        + (BASE / 'client.js').read_text(encoding='utf8')
    ).encode())
    for folder in ['public', 'vendor']:
        for path in sorted((BASE / folder).rglob('*')):
            if not path.is_file():
                continue
            relative = path.relative_to(BASE).as_posix()
            if relative.startswith('public/assets/') or relative in {'public/tile-world-ui.js', 'public/tile-world-ui.css'}:
                continue
            add(prefix + relative, path)
    for name in ['audio.json', 'battle-terrain.json', 'battle-animated.json']:
        add(prefix + 'assets/web/data/' + name, BASE / 'public/data' / name)
    return files


def build():
    version = json.loads((BASE / 'package.json').read_text(encoding='utf8'))['version']
    files = collect()
    out = ROOT / 'dist'
    out.mkdir(exist_ok=True)
    target = out / f'pokemon-kanto-{version}.zip'
    temporary = target.with_suffix('.tmp')
    records = []
    try:
        with zipfile.ZipFile(temporary, 'w', allowZip64=True, compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
            for name, (path, data) in sorted(files.items()):
                content = data if data is not None else path.read_bytes()
                info = zipfile.ZipInfo(name, date_time=(2026, 10, 30, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                z.writestr(info, content, compresslevel=6)
                records.append({'path': name, 'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()})
        with zipfile.ZipFile(temporary) as z:
            if z.testzip() is not None:
                raise ValueError('Package CRC check failed')
        temporary.replace(target)
    finally:
        if temporary.exists():
            temporary.unlink()
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    report = {
        'version': version,
        'artifact': target.name,
        'bytes': target.stat().st_size,
        'sha256': digest,
        'entries': len(records),
        'uncompressedBytes': sum(r['bytes'] for r in records),
    }
    (out / 'pack-plugin-manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps(report, ensure_ascii=True))
    return report


if __name__ == '__main__':
    build()
