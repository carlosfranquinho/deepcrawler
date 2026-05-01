import re
import unicodedata

def slugify(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value).strip().lower()
    return re.sub(r'[-\s]+', '_', value)

with open('monsters.md', 'r') as f:
    lines = f.readlines()

monsters = []
for line in lines:
    if line.startswith('|') and not line.startswith('| :---') and not line.startswith('| Símbolo'):
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 6:
            glyph = parts[1]
            article = parts[2]
            name = parts[3]
            va_str = parts[4]
            if not va_str.isdigit(): continue
            va = int(va_str)
            
            if va <= 5: css = 'tileEnemyG'
            elif va <= 15: css = 'tileEnemyO'
            elif va <= 25: css = 'tileEnemySK'
            elif va <= 40: css = 'tileEnemyTR'
            elif va <= 59: css = 'tileEnemyV'
            else: css = 'tileEnemyD'
            
            maxHp = int(va * 1.5 + 2)
            atk_min = int(va / 2) + 1
            atk_max = int(va / 1.5) + 2
            
            id_str = slugify(name)
            
            monsters.append(f'    {id_str}: {{ id: "{id_str}", name: "{name}", article: "{article}", glyph: "{glyph}", va: {va}, cssClass: "{css}", maxHp: {maxHp}, atk: [{atk_min}, {atk_max}] }},')

enemy_types_str = "  const ENEMY_TYPES = {\n" + "\n".join(monsters) + "\n  };"

with open('main.js', 'r') as f:
    content = f.read()

# Replace ENEMY_TYPES
start_idx = content.find('  const ENEMY_TYPES')
end_idx = content.find('  };', start_idx) + 4
if start_idx != -1 and end_idx > 3:
    content = content[:start_idx] + enemy_types_str + content[end_idx:]
else:
    print("Could not find ENEMY_TYPES")

# Replace Enemy typedef
content = content.replace(
    '/** @typedef {{id:string,typeId:string,name:string,glyph:string,cssClass:string,pos:Pos,hp:number,maxHp:number}} Enemy */',
    '/** @typedef {{id:string,typeId:string,name:string,article:string,va:number,glyph:string,cssClass:string,pos:Pos,hp:number,maxHp:number,atk:[number,number]}} Enemy */'
)

# Replace Enemy generation logic in generateLevel
old_enemy_bag = '''    // Tier de dificuldade: sobe ~a cada 10 andares com ±2 de aleatoriedade
    const tier = Math.max(0, Math.floor((depth - 1 + roll(rng, -2, 2)) / 10));

    // Bolsa de inimigos por profundidade
    const rawBag =
      depth < 5  ? [ENEMY_TYPES.goblin, ENEMY_TYPES.slime, ENEMY_TYPES.goblin] :
      depth < 8  ? [ENEMY_TYPES.goblin, ENEMY_TYPES.slime, ENEMY_TYPES.skeleton, ENEMY_TYPES.goblin] :
      depth < 12 ? [ENEMY_TYPES.orc, ENEMY_TYPES.slime, ENEMY_TYPES.skeleton, ENEMY_TYPES.goblin] :
      depth < 18 ? [ENEMY_TYPES.orc, ENEMY_TYPES.skeleton, ENEMY_TYPES.vampire, ENEMY_TYPES.slime] :
      depth < 25 ? [ENEMY_TYPES.orc, ENEMY_TYPES.vampire, ENEMY_TYPES.troll, ENEMY_TYPES.skeleton] :
                   [ENEMY_TYPES.vampire, ENEMY_TYPES.demon, ENEMY_TYPES.troll, ENEMY_TYPES.orc];

    const enemyTypeBag = rawBag.map(t => scaleEnemy(t, tier));'''

new_enemy_bag = '''    const availableMonsters = Object.values(ENEMY_TYPES);
    const enemyWeights = availableMonsters.map(et => {
      let diff = Math.abs(et.va - depth);
      let weight = Math.max(0, 100 - diff * 15);
      if (et.va > depth + 5) weight = 0; // Too strong
      return { et, weight };
    }).filter(w => w.weight > 0);
    
    let totalWeight = enemyWeights.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight === 0) {
      enemyWeights.push({ et: availableMonsters[0], weight: 1 });
      totalWeight = 1;
    }
    
    const pickMonster = () => {
      let r = rng() * totalWeight;
      for (let w of enemyWeights) {
        r -= w.weight;
        if (r <= 0) return w.et;
      }
      return enemyWeights[enemyWeights.length - 1].et;
    };'''

if old_enemy_bag in content:
    content = content.replace(old_enemy_bag, new_enemy_bag)
else:
    print("Could not find old_enemy_bag")

# Now replace the enemy pushing loop
old_enemy_push = '''      const et = choose(rng, enemyTypeBag);
      enemies.push({
        id: `${depth}-${seed}-${i}-${et.id}`, typeId: et.id, name: et.name,
        glyph: et.glyph, cssClass: et.cssClass, pos, hp: et.maxHp, maxHp: et.maxHp,
      });'''

new_enemy_push = '''      const et = pickMonster();
      let name = et.name;
      let va = et.va;
      let maxHp = et.maxHp;
      let atk = [...et.atk];
      
      if (depth > et.va + 50) {
        const mod = Math.floor(rng() * 3);
        if (mod === 0) {
          name = `${et.name} Alfa`;
          va += 10;
          maxHp = maxHp * 2;
        } else if (mod === 1) {
          name = `${et.name} Corrompido`;
          atk[1] += 5; // poison
        } else {
          name = `${et.name} das Profundezas`;
          va += 50;
          maxHp += 50;
          atk[0] += 10; atk[1] += 10;
        }
      }
      
      enemies.push({
        id: `${depth}-${seed}-${i}-${et.id}`, typeId: et.id, name, article: et.article, va,
        glyph: et.glyph, cssClass: et.cssClass, pos, hp: maxHp, maxHp: maxHp, atk
      });'''

if old_enemy_push in content:
    content = content.replace(old_enemy_push, new_enemy_push)
else:
    print("Could not find old_enemy_push")

# Deal damage to player needs to use e.atk instead of et.atk
old_enemies_turn_atk = 'dealDamageToPlayer(roll(combatRng, et.atk[0], et.atk[1]), e.name);'
new_enemies_turn_atk = 'dealDamageToPlayer(roll(combatRng, e.atk[0], e.atk[1]), e.name);'
if old_enemies_turn_atk in content:
    content = content.replace(old_enemies_turn_atk, new_enemies_turn_atk)
else:
    print("Could not find old_enemies_turn_atk")

# Fix score/xp calculation
old_xp = 'if (targetEnemy.hp <= 0) grantXp(2 + Math.floor(targetEnemy.maxHp / 2));'
new_xp = '''if (targetEnemy.hp <= 0) {
        grantXp(2 + Math.floor(targetEnemy.maxHp / 2));
        const pts = (targetEnemy.va * 10) + (state.depth * 2);
        state.points += pts;
        pushLog(`Recebeste **${pts}** pontos extra.`, "good");
      }'''
if old_xp in content:
    content = content.replace(old_xp, new_xp)
else:
    print("Could not find old_xp")

# In grantXp
content = content.replace('state.points += amount * 10;', '')
content = content.replace(' e **${amount * 10}** pontos', '')

with open('main.js', 'w') as f:
    f.write(content)

print("Applied!")
