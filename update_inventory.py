import re

with open('main.js', 'r') as f:
    content = f.read()

# 1. Update initialization
content = content.replace('inv: [],', 'inv: new Array(9).fill(null),')

# 2. Update item use logic
old_item_use = '''    } else if (item.typeId === "charm") {
      state.charisma += 1; state.points += 15;
      sfx.pickup();
      pushLog(`Usaste um amuleto (+**1** carisma → **${state.charisma * 10}%** de esquiva, +15 pontos).`, "good");
    } else { return false; }

    state.inv.splice(slotIdx, 1);
    return true;'''
new_item_use = '''    } else if (item.typeId === "charm") {
      state.charisma += 1; state.points += 15;
      sfx.pickup();
      pushLog(`Usaste um amuleto (+**1** carisma → **${state.charisma * 10}%** de esquiva, +15 pontos).`, "good");
    } else { return false; }

    state.inv[slotIdx] = null;
    return true;'''
content = content.replace(old_item_use, new_item_use)

# 3. Add itemDrop function
drop_func = '''
  function itemDrop(slotIdx) {
    if (!state.alive) return false;
    const item = state.inv[slotIdx];
    if (!item) return false;
    
    const lvl = getLevel(state.depth);
    if (lvl.items.some(i => i.pos.x === state.pos.x && i.pos.y === state.pos.y)) {
      pushLog("Já existe um item no chão. Move-te primeiro.", "bad");
      return false;
    }
    
    lvl.items.push({ ...item, pos: { x: state.pos.x, y: state.pos.y } });
    state.inv[slotIdx] = null;
    sfx.pickup(); // reuse pickup sound for dropping
    pushLog(`Largaste **${item.name}**.`, "info");
    return true;
  }
'''
if 'function itemDrop' not in content:
    content = content.replace('function itemUse(slotIdx) {', drop_func + '  function itemUse(slotIdx) {')

# 4. Update key pickup logic
old_pickup = '''    if (it) {
      if (state.inv.length < 9) {
        state.inv.push({ id: it.id, typeId: it.typeId, name: it.name });
        lvl.items = lvl.items.filter(x => x.id !== it.id);
        state.points += 5;
        sfx.pickup();
        pushLog(`Apanhaste **${it.name}** (+5 pontos).`, "info");
      } else {
        pushLog("Inventário cheio (máx. 9).", "bad");
      }
    }'''
new_pickup = '''    if (it) {
      const freeSlot = state.inv.findIndex(x => x === null);
      if (freeSlot !== -1) {
        state.inv[freeSlot] = { id: it.id, typeId: it.typeId, name: it.name, cssClass: it.cssClass };
        lvl.items = lvl.items.filter(x => x.id !== it.id);
        state.points += 5;
        sfx.pickup();
        pushLog(`Apanhaste **${it.name}** (+5 pontos).`, "info");
      } else {
        pushLog("Inventário cheio (máx. 9 slots). Larga um item primeiro.", "bad");
      }
    }'''
content = content.replace(old_pickup, new_pickup)

# 5. Door unlock - consume key without splice
old_key_consume = '''    if (t === Tile.DoorLocked) {
      const keyIdx = state.inv.findIndex(it => it.typeId === "key");
      if (keyIdx !== -1) {
        state.inv.splice(keyIdx, 1);
        lvl.tiles[idx(nx, ny)] = Tile.DoorOpen;'''
new_key_consume = '''    if (t === Tile.DoorLocked) {
      const keyIdx = state.inv.findIndex(it => it && it.typeId === "key");
      if (keyIdx !== -1) {
        state.inv[keyIdx] = null;
        lvl.tiles[idx(nx, ny)] = Tile.DoorOpen;'''
content = content.replace(old_key_consume, new_key_consume)

# 6. Update onKeyDown to handle dropping
old_keys = '''      case "1": case "2": case "3": case "4": case "5":
      case "6": case "7": case "8": case "9":
        acted = itemUse(Number(e.key) - 1); break;'''
new_keys = '''      case "1": case "2": case "3": case "4": case "5":
      case "6": case "7": case "8": case "9":
        if (e.shiftKey) acted = itemDrop(Number(e.key) - 1);
        else acted = itemUse(Number(e.key) - 1);
        break;'''
content = content.replace(old_keys, new_keys)

with open('main.js', 'w') as f:
    f.write(content)
print("Inventory updated in main.js")

with open('index.html', 'r') as f:
    html = f.read()
html = html.replace('Carrega em <b>1–9</b> para usar um item.', 'Carrega em <b>1–9</b> para usar. <b>Shift + 1–9</b> para largar.')
with open('index.html', 'w') as f:
    f.write(html)
print("Hint updated in index.html")
