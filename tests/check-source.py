from pathlib import Path
from html.parser import HTMLParser
import re, subprocess

class Check(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=set(); self.stack=[]; self.errors=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids: self.errors.append('duplicate ID '+attrs['id'])
            self.ids.add(attrs['id'])
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}: self.stack.append(tag)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack and self.stack[-1]==tag: self.stack.pop()
    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1]!=tag: self.errors.append('unbalanced closing '+tag)
        else: self.stack.pop()

failures=[]; scripts=[]
for p in list(Path('.').glob('*.html')) + [Path('CoiningReason/index.html'), Path('SexMonstersSuperheroes/index.html')]:
    s=p.read_text(encoding='utf-8'); parser=Check(); parser.feed(s)
    if parser.errors or parser.stack: failures.append((str(p),parser.errors,parser.stack))
    scripts += [(str(p),m.group(1)) for m in re.finditer(r'<script[^>]*>([\s\S]*?)</script>',s) if m.group(1).strip()]
scripts += [(str(p),p.read_text(encoding='utf-8')) for p in Path('js').glob('*.js')]
for name,source in scripts:
    result=subprocess.run(['node','--input-type=module','--check'],input=source,text=True,encoding='utf-8',capture_output=True)
    if result.returncode: failures.append((name,result.stderr))
print(f'Checked {len(scripts)} scripts and all HTML pages.'); print(failures or 'All checks passed.')
raise SystemExit(bool(failures))
