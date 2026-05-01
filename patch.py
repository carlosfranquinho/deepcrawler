import re

with open('main.js', 'r') as f:
    content = f.read()

# Replace GRID_W and GRID_H constants
content = re.sub(r'const GRID_W    = 21;', 'const LEVEL_W   = 61;\n  const VIEW_W    = 21;', content)
content = re.sub(r'const GRID_H    = 21;', 'const LEVEL_H   = 61;\n  const VIEW_H    = 21;', content)

# Replace remaining GRID_W and GRID_H references with LEVEL_W and LEVEL_H
content = content.replace('GRID_W', 'LEVEL_W')
content = content.replace('GRID_H', 'LEVEL_H')

# Fix ensureBorderWalls and other logic
# Wait, for the DOM cells creation, we need VIEW_W * VIEW_H
content = content.replace(
    'const cells = [];\n  for (let i = 0; i < LEVEL_W * LEVEL_H; i++) {',
    'const cells = [];\n  for (let i = 0; i < VIEW_W * VIEW_H; i++) {'
)

# Update generateLevel for larger maps and limited special items
target_rooms_old = 'const targetRooms = clamp(5 + Math.floor(depth * 0.15), 5, 9);'
target_rooms_new = 'const targetRooms = clamp(15 + Math.floor(depth * 0.5), 15, 30);'
content = content.replace(target_rooms_old, target_rooms_new)

items_generation_old = '''    const items = [];
    const itemCount = clamp(2 + Math.floor(depth * 0.15), 2, 6);
    const occItems = new Set([...nearDoor, idx(playerStart.x, playerStart.y), idx(down.x, down.y), idx(up.x, up.y)]);
    for (let i = 0; i < itemCount; i++) {
      let pos = null;
      for (let t = 0; t < 300; t++) {
        const p = randomFloorFromRoom(rng, choose(rng, rooms));
        const ii = idx(p.x, p.y);
        if (occItems.has(ii) || tiles[ii] !== Tile.Floor) continue;
        occItems.add(ii); pos = p; break;
      }
      if (!pos) break;
      const tp = choose(rng, [ITEM_TYPES.potion, ITEM_TYPES.armor, ITEM_TYPES.charm]);
      items.push({ id: `${depth}-${seed}-it-${i}-${tp.id}`, typeId: tp.id, name: tp.name, cssClass: tp.cssClass, pos });
    }'''

items_generation_new = '''    const chunkId = Math.floor((depth - 1) / 10);
    const chunkRng = mulberry32(baseSeed ^ chunkId ^ 0x9A7E);
    const d1 = roll(chunkRng, 1, 10);
    const d2 = roll(chunkRng, 1, 10);
    const depthInChunk = ((depth - 1) % 10) + 1;
    const isSpecialLevel = (depthInChunk === d1 || depthInChunk === d2);
    let specialsSpawned = 0;

    const items = [];
    const itemCount = clamp(4 + Math.floor(depth * 0.3), 4, 12);
    const occItems = new Set([...nearDoor, idx(playerStart.x, playerStart.y), idx(down.x, down.y), idx(up.x, up.y)]);
    for (let i = 0; i < itemCount; i++) {
      let pos = null;
      for (let t = 0; t < 300; t++) {
        const p = randomFloorFromRoom(rng, choose(rng, rooms));
        const ii = idx(p.x, p.y);
        if (occItems.has(ii) || tiles[ii] !== Tile.Floor) continue;
        occItems.add(ii); pos = p; break;
      }
      if (!pos) break;
      
      let tp = ITEM_TYPES.potion;
      if (isSpecialLevel && specialsSpawned < 1 && rng() < 0.6) {
        tp = choose(rng, [ITEM_TYPES.armor, ITEM_TYPES.charm]);
        specialsSpawned++;
      }
      
      items.push({ id: `${depth}-${seed}-it-${i}-${tp.id}`, typeId: tp.id, name: tp.name, cssClass: tp.cssClass, pos });
    }'''
content = content.replace(items_generation_old, items_generation_new)

enemy_count_old = 'const enemyCount = clamp(4 + Math.floor(depth * 0.35), 4, 14);'
enemy_count_new = 'const enemyCount = clamp(12 + Math.floor(depth * 0.8), 12, 35);'
content = content.replace(enemy_count_old, enemy_count_new)

# Update render function
render_old = '''    for (let y = 0; y < LEVEL_H; y++) {
      for (let x = 0; x < LEVEL_W; x++) {
        const i   = idx(x, y);
        const fog = visible[i] ? "fogVisible" : lvl.explored[i] ? "fogExplored" : "fogHidden";
        cells[i].className = `cell ${cellForTile(lvl.tiles[i])} ${fog}`;
        cells[i].textContent = "";
      }
    }
    for (const it of lvl.items) {
      const i = idx(it.pos.x, it.pos.y);
      if (!visible[i]) continue;
      cells[i].className = `cell ${it.cssClass} fogVisible`;
    }
    for (const e of lvl.enemies) {
      if (e.hp <= 0) continue;
      const i = idx(e.pos.x, e.pos.y);
      if (!visible[i]) continue;
      cells[i].className = `cell ${e.cssClass}`;
    }
    const pi = idx(state.pos.x, state.pos.y);
    cells[pi].className = "cell tilePlayer";'''

render_new = '''    let startX = state.pos.x - Math.floor(VIEW_W / 2);
    let startY = state.pos.y - Math.floor(VIEW_H / 2);
    
    startX = clamp(startX, 0, LEVEL_W - VIEW_W);
    startY = clamp(startY, 0, LEVEL_H - VIEW_H);

    for (let vy = 0; vy < VIEW_H; vy++) {
      for (let vx = 0; vx < VIEW_W; vx++) {
        const lx = startX + vx;
        const ly = startY + vy;
        const vi = vy * VIEW_W + vx;
        const li = idx(lx, ly);
        
        const fog = visible[li] ? "fogVisible" : lvl.explored[li] ? "fogExplored" : "fogHidden";
        cells[vi].className = `cell ${cellForTile(lvl.tiles[li])} ${fog}`;
        cells[vi].textContent = "";
      }
    }

    for (const it of lvl.items) {
      if (it.pos.x >= startX && it.pos.x < startX + VIEW_W && it.pos.y >= startY && it.pos.y < startY + VIEW_H) {
        const li = idx(it.pos.x, it.pos.y);
        const vi = (it.pos.y - startY) * VIEW_W + (it.pos.x - startX);
        if (!visible[li]) continue;
        cells[vi].className = `cell ${it.cssClass} fogVisible`;
      }
    }
    
    for (const e of lvl.enemies) {
      if (e.hp <= 0) continue;
      if (e.pos.x >= startX && e.pos.x < startX + VIEW_W && e.pos.y >= startY && e.pos.y < startY + VIEW_H) {
        const li = idx(e.pos.x, e.pos.y);
        const vi = (e.pos.y - startY) * VIEW_W + (e.pos.x - startX);
        if (!visible[li]) continue;
        cells[vi].className = `cell ${e.cssClass}`;
      }
    }
    
    if (state.pos.x >= startX && state.pos.x < startX + VIEW_W && state.pos.y >= startY && state.pos.y < startY + VIEW_H) {
      const vi = (state.pos.y - startY) * VIEW_W + (state.pos.x - startX);
      cells[vi].className = "cell tilePlayer";
    }'''

content = content.replace(render_old, render_new)

with open('main.js', 'w') as f:
    f.write(content)

print("Patch applied.")
