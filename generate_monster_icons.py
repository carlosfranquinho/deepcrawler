import json
import urllib.parse
import re

# Read main.js to get monsters
with open('main.js', 'r') as f:
    js_content = f.read()

# Extract ENEMY_TYPES block
start = js_content.find('const ENEMY_TYPES = {')
end = js_content.find('  };', start)
enemy_str = js_content[start:end+4]

monsters = []
for line in enemy_str.split('\n'):
    if 'id: "' in line:
        match_id = re.search(r'id: "([^"]+)"', line)
        match_class = re.search(r'cssClass: "([^"]+)"', line)
        if match_id and match_class:
            monsters.append({'id': match_id.group(1), 'cls': match_class.group(1)})

# Map CSS classes to colors
color_map = {
    'tileEnemyG': '#fbbf24',
    'tileEnemyO': '#f87171',
    'tileEnemyS': '#a78bfa',
    'tileEnemySK': '#e2e8f0',
    'tileEnemyV': '#e11d48',
    'tileEnemyTR': '#22c55e',
    'tileEnemyD': '#ef4444'
}

templates = {
    'beast': "<path d='M4 7l2-4 3 2 3-2 2 4v4c0 3-2 5-5 5s-5-2-5-5z' fill='{color}'/><circle cx='7' cy='8' r='1' fill='#0f172a'/><circle cx='11' cy='8' r='1' fill='#0f172a'/>",
    'goblin': "<path d='M2 9l3-2c1-3 7-3 8 0l3 2-2 3c0 3-3 4-6 4s-6-1-6-4z' fill='{color}'/><circle cx='7' cy='8' r='1' fill='#0f172a'/><circle cx='11' cy='8' r='1' fill='#0f172a'/><path d='M6 12l1-2h4l1 2' stroke='#0f172a' stroke-width='1' fill='none'/>",
    'undead': "<circle cx='9' cy='7' r='4' fill='{color}'/><path d='M7 11h4v3H7z' fill='{color}'/><circle cx='7.5' cy='7' r='1.2' fill='#0f172a'/><circle cx='10.5' cy='7' r='1.2' fill='#0f172a'/>",
    'slime': "<path d='M3 13c0-4.5 3-8 6-8s6 3.5 6 8c0 2-1.5 3-3 3H6C4.5 16 3 15 3 13Z' fill='{color}'/><circle cx='7' cy='10' r='1.2' fill='#0f172a' opacity='0.9'/><circle cx='11' cy='10' r='1.2' fill='#0f172a' opacity='0.9'/>",
    'troll': "<rect x='3' y='3' width='12' height='12' rx='2' fill='{color}'/><path d='M5 7h8v2H5z' fill='#0f172a'/><path d='M6 12h6' stroke='#0f172a' stroke-width='1.5' stroke-linecap='round'/>",
    'demon': "<path d='M9 2L2 8v8h14V8z' fill='{color}'/><path d='M7 9l1 1-1 1M11 9l-1 1 1 1' stroke='#0f172a' stroke-width='1.5'/><path d='M5 4l1 3M13 4l-1 3' stroke='{color}' stroke-width='2' stroke-linecap='round'/>",
    'insect': "<circle cx='9' cy='9' r='3' fill='{color}'/><path d='M3 9h12M9 3v12M5 5l8 8M5 13l8-8' stroke='{color}' stroke-width='1.5'/>"
}

def get_template(name):
    if 'morcego' in name or 'raposa' in name or 'lobo' in name or 'chacal' in name or 'tigre' in name or 'urso' in name or 'besta' in name: return 'beast'
    if 'esqueleto' in name or 'mumia' in name or 'carnical' in name or 'espectro' in name: return 'undead'
    if 'bolha' in name or 'geleia' in name or 'limo' in name: return 'slime'
    if 'troll' in name or 'ogre' in name or 'gigante' in name or 'brutamontes' in name or 'perfurador' in name: return 'troll'
    if 'demon' in name or 'dragao' in name or 'balrog' in name or 'feiticeiro' in name or 'vampiro' in name or 'medusa' in name or 'vlad' in name or 'devorador' in name: return 'demon'
    if 'inseto' in name or 'formiga' in name: return 'insect'
    return 'goblin'

css_rules = []
for m in monsters:
    color = color_map.get(m['cls'], '#ffffff')
    tpl = get_template(m['id'])
    svg_inner = templates[tpl].format(color=color)
    svg = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'>{svg_inner}</svg>"
    
    encoded = "data:image/svg+xml," + urllib.parse.quote(svg)
    
    css_rules.append(f".tileEnemy-{m['id']} {{\n  background-image: url(\"{encoded}\");\n  background-size: cover;\n}}")

with open('monsters.css', 'w') as f:
    f.write("\n\n".join(css_rules))

print("Created monsters.css")
