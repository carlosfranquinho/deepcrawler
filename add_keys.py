import re

with open('main.js', 'r') as f:
    content = f.read()

# 1. Update Tile definition
old_tile = '''  const Tile = {
    Wall: "#", Floor: ".", Up: "<", Down: ">",
    Corpse: "%", DoorClosed: "+", DoorOpen: "/",
  };'''
new_tile = '''  const Tile = {
    Wall: "#", Floor: ".", Up: "<", Down: ">",
    Corpse: "%", DoorClosed: "+", DoorOpen: "/", DoorLocked: "X",
  };'''
content = content.replace(old_tile, new_tile)

# 2. Update isBlockingTile
old_is_blocking = 'function isBlockingTile(t) { return t === Tile.Wall || t === Tile.DoorClosed; }'
new_is_blocking = 'function isBlockingTile(t) { return t === Tile.Wall || t === Tile.DoorClosed || t === Tile.DoorLocked; }'
content = content.replace(old_is_blocking, new_is_blocking)

# 3. Update ITEM_TYPES
old_items = '''  const ITEM_TYPES = {
    potion: { id: "potion", name: "Poção",    cssClass: "tileItemPotion" },
    armor:  { id: "armor",  name: "Armadura", cssClass: "tileItemArmor"  },
    charm:  { id: "charm",  name: "Amuleto",  cssClass: "tileItemCharm"  },
  };'''
new_items = '''  const ITEM_TYPES = {
    potion: { id: "potion", name: "Poção",    cssClass: "tileItemPotion" },
    armor:  { id: "armor",  name: "Armadura", cssClass: "tileItemArmor"  },
    charm:  { id: "charm",  name: "Amuleto",  cssClass: "tileItemCharm"  },
    key:    { id: "key",    name: "Chave",    cssClass: "tileItemKey"    },
  };'''
content = content.replace(old_items, new_items)

# 4. Update generateLevel door locking and keys
# find `placeDoors(tiles, rooms, rng);`
lock_injection = '''    placeDoors(tiles, rooms, rng);

    const doorIndices = [];
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] === Tile.DoorClosed) doorIndices.push(i);
    }
    const numLocked = Math.min(doorIndices.length, clamp(Math.floor(depth / 3), 1, 3));
    for (let i = 0; i < numLocked; i++) {
      const idxToSwap = roll(rng, i, doorIndices.length - 1);
      const temp = doorIndices[i];
      doorIndices[i] = doorIndices[idxToSwap];
      doorIndices[idxToSwap] = temp;
      tiles[doorIndices[i]] = Tile.DoorLocked;
    }
'''
content = content.replace('    placeDoors(tiles, rooms, rng);', lock_injection)

# find where occItems is declared
old_occ_items = '    const occItems = new Set([...nearDoor, idx(playerStart.x, playerStart.y), idx(down.x, down.y), idx(up.x, up.y)]);'
new_occ_items = '''    // Safe zone BFS for keys
    const safeZone = [];
    const visited = new Uint8Array(LEVEL_W * LEVEL_H);
    const q = [idx(playerStart.x, playerStart.y)];
    visited[q[0]] = 1;
    let qh = 0;
    while (qh < q.length) {
      const cur = q[qh++];
      const cx = cur % LEVEL_W, cy = (cur / LEVEL_W) | 0;
      if (tiles[cur] === Tile.Floor) safeZone.push({x: cx, y: cy});
      
      for (const n of neighbors4({x: cx, y: cy})) {
        if (!inBounds(n.x, n.y)) continue;
        const ni = idx(n.x, n.y);
        if (!visited[ni] && tiles[ni] !== Tile.Wall && tiles[ni] !== Tile.DoorLocked) {
          visited[ni] = 1;
          q.push(ni);
        }
      }
    }

    const occItems = new Set([...nearDoor, idx(playerStart.x, playerStart.y), idx(down.x, down.y), idx(up.x, up.y)]);
    
    // Spawn keys in safe zone
    if (safeZone.length > 0) {
      for (let i = 0; i < numLocked; i++) {
        let pos = null;
        for (let t = 0; t < 50; t++) {
          const p = choose(rng, safeZone);
          if (p && !occItems.has(idx(p.x, p.y))) {
            occItems.add(idx(p.x, p.y)); pos = p; break;
          }
        }
        if (pos) {
          items.push({ id: `${depth}-${seed}-key-${i}`, typeId: "key", name: "Chave", cssClass: "tileItemKey", pos });
        }
      }
    }
'''
content = content.replace(old_occ_items, new_occ_items)

# 5. playerTryMove door logic
old_door = '''    if (level.tiles[i] === Tile.DoorClosed) {
      level.tiles[i] = Tile.DoorOpen;
      sfx.door(); pushLog("Abriste uma porta.", "info");
      return;
    }'''
new_door = '''    if (level.tiles[i] === Tile.DoorClosed) {
      level.tiles[i] = Tile.DoorOpen;
      sfx.door(); pushLog("Abriste uma porta.", "info");
      return;
    }
    if (level.tiles[i] === Tile.DoorLocked) {
      const keyIdx = state.inv.findIndex(it => it.typeId === "key");
      if (keyIdx !== -1) {
        state.inv.splice(keyIdx, 1);
        level.tiles[i] = Tile.DoorOpen;
        sfx.door(); pushLog("Destrancaste a porta com uma Chave.", "good");
        renderInventory();
      } else {
        pushLog("A porta está trancada. Precisas de uma Chave.", "bad");
      }
      return;
    }'''
content = content.replace(old_door, new_door)

# 6. cellForTile
old_cell = '''    if (t === Tile.DoorClosed) return "tileDoorClosed";
    if (t === Tile.DoorOpen) return "tileDoorOpen";'''
new_cell = '''    if (t === Tile.DoorClosed) return "tileDoorClosed";
    if (t === Tile.DoorOpen) return "tileDoorOpen";
    if (t === Tile.DoorLocked) return "tileDoorLocked";'''
content = content.replace(old_cell, new_cell)

with open('main.js', 'w') as f:
    f.write(content)
print("Keys injected successfully.")
