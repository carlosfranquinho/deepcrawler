import json
import urllib.parse
import re
import hashlib

# Read main.js to get monsters
with open('main.js', 'r') as f:
    js_content = f.read()

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

color_map = {
    'tileEnemyG': '#fbbf24',
    'tileEnemyO': '#f87171',
    'tileEnemyS': '#a78bfa',
    'tileEnemySK': '#e2e8f0',
    'tileEnemyV': '#e11d48',
    'tileEnemyTR': '#22c55e',
    'tileEnemyD': '#ef4444'
}

def get_hash_val(s, max_val):
    return int(hashlib.md5(s.encode()).hexdigest(), 16) % max_val

css_rules = []
for m in monsters:
    color = color_map.get(m['cls'], '#ffffff')
    m_id = m['id']
    
    # Generate deterministic variations based on ID
    eye_size = 0.8 + (get_hash_val(m_id + 'eye', 10) / 10.0) * 0.8
    eye_dist = get_hash_val(m_id + 'dist', 4) - 1 # -1 to 2
    eye_y = 7 + get_hash_val(m_id + 'eyey', 4) - 2 # 5 to 9
    
    horn_size = get_hash_val(m_id + 'horn', 5)
    has_horns = get_hash_val(m_id + 'has_horn', 2) == 1
    
    mouth_type = get_hash_val(m_id + 'mouth', 3)
    
    # Base shapes
    if 'morcego' in m_id or 'raposa' in m_id or 'lobo' in m_id or 'chacal' in m_id or 'tigre' in m_id or 'urso' in m_id or 'besta' in m_id:
        shape = f"<path d='M{4 - horn_size} {7 - horn_size}l{2 + horn_size} {-(4 + horn_size)} 3 2 3-2 {2 + horn_size} {4 + horn_size}v4c0 3-2 5-5 5s-5-2-5-5z' fill='{color}'/>"
    elif 'esqueleto' in m_id or 'mumia' in m_id or 'carnical' in m_id or 'espectro' in m_id:
        shape = f"<circle cx='9' cy='7' r='{4 + horn_size/2}' fill='{color}'/><path d='M7 11h4v3H7z' fill='{color}'/>"
    elif 'bolha' in m_id or 'geleia' in m_id or 'limo' in m_id:
        shape = f"<path d='M{3 - horn_size/2} 13c0-4.5 3-8 6-8s6 3.5 6 8c0 2-1.5 3-3 3H6C4.5 16 3 15 3 13Z' fill='{color}'/>"
    elif 'troll' in m_id or 'ogre' in m_id or 'gigante' in m_id or 'brutamontes' in m_id or 'perfurador' in m_id:
        shape = f"<rect x='3' y='{3 - horn_size}' width='12' height='12' rx='{horn_size}' fill='{color}'/>"
    elif 'demon' in m_id or 'dragao' in m_id or 'balrog' in m_id or 'feiticeiro' in m_id or 'vampiro' in m_id or 'medusa' in m_id or 'vlad' in m_id or 'devorador' in m_id:
        shape = f"<path d='M9 {2 - horn_size}L2 8v8h14V8z' fill='{color}'/>"
        if has_horns:
            shape += f"<path d='M5 4l1 3M13 4l-1 3' stroke='{color}' stroke-width='2' stroke-linecap='round'/>"
    elif 'inseto' in m_id or 'formiga' in m_id:
        shape = f"<circle cx='9' cy='9' r='3' fill='{color}'/><path d='M3 9h12M9 3v12M5 5l8 8M5 13l8-8' stroke='{color}' stroke-width='1.5'/>"
    else: # goblin
        shape = f"<path d='M2 9l3-2c1-3 7-3 8 0l3 2-2 3c0 3-3 4-6 4s-6-1-6-4z' fill='{color}'/>"
    
    # Eyes
    eyes = f"<circle cx='{7 - eye_dist}' cy='{eye_y}' r='{eye_size}' fill='#0f172a'/><circle cx='{11 + eye_dist}' cy='{eye_y}' r='{eye_size}' fill='#0f172a'/>"
    
    # Mouth
    if mouth_type == 0:
        mouth = f"<path d='M7 {eye_y + 3}h4' stroke='#0f172a' stroke-width='1.5' stroke-linecap='round'/>"
    elif mouth_type == 1:
        mouth = f"<path d='M6 {eye_y + 3}l1 2h4l1-2' stroke='#0f172a' stroke-width='1' fill='none'/>"
    else:
        mouth = f"<path d='M7 {eye_y + 3}l1-1 1 1 1-1 1 1' stroke='#0f172a' stroke-width='1' fill='none'/>"
        
    svg_inner = shape + eyes + mouth
    svg = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'>{svg_inner}</svg>"
    
    encoded = "data:image/svg+xml," + urllib.parse.quote(svg)
    css_rules.append(f".tileEnemy-{m_id} {{\n  background-image: url(\"{encoded}\");\n  background-size: cover;\n}}")

with open('monsters.css', 'w') as f:
    f.write("\n\n".join(css_rules))

print("Created distinct monsters.css")
