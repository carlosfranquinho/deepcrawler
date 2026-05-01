(() => {
  "use strict";

  const GRID_W = 21;
  const GRID_H = 21;
  const ARMOR_MAX = 5;

  const Tile = {
    Wall: "#",
    Floor: ".",
    Up: "<",
    Down: ">",
    Corpse: "%",
    DoorClosed: "+",
    DoorOpen: "/",
  };

  /** @typedef {{x:number,y:number}} Pos */
  /** @typedef {{id:string,name:string,glyph:string,cssClass:string,maxHp:number,atk:[number,number]}} EnemyType */
  /** @typedef {{id:string,typeId:string,name:string,glyph:string,cssClass:string,pos:Pos,hp:number}} Enemy */
  /** @typedef {{id:string,typeId:string,name:string,cssClass:string,pos:Pos}} Item */
  /** @typedef {{depth:number,seed:number,tiles:string[],playerStart:Pos,up:Pos,down:Pos,enemies:Enemy[],items:Item[],explored:Uint8Array}} Level */

  const ENEMY_TYPES /** @type {Record<string, EnemyType>} */ = {
    goblin: { id: "goblin", name: "Goblin", glyph: "g", cssClass: "tileEnemyG", maxHp: 3, atk: [1, 2] },
    orc:    { id: "orc",    name: "Orc",    glyph: "o", cssClass: "tileEnemyO", maxHp: 6, atk: [1, 3] },
    slime:  { id: "slime",  name: "Slime",  glyph: "s", cssClass: "tileEnemyS", maxHp: 4, atk: [1, 2] },
  };

  // RNG de combate global — avança ao longo de toda a sessão, eliminando o determinismo por turno
  let combatRng;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function idx(x, y)      { return y * GRID_W + x; }
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H; }

  // RNG determinística por seed (Mulberry32)
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Hash (seed, depth) → nova seed
  function mixSeed(baseSeed, depth) {
    let x = (baseSeed ^ (depth * 0x9E3779B9)) >>> 0;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7FEB352D) >>> 0;
    x ^= x >>> 15;
    x = Math.imul(x, 0x846CA68B) >>> 0;
    x ^= x >>> 16;
    return x >>> 0;
  }

  function roll(rng, min, max)  { return min + Math.floor(rng() * (max - min + 1)); }
  function choose(rng, arr)     { return arr[Math.floor(rng() * arr.length)]; }
  function manhattan(a, b)      { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

  function neighbors4(p) {
    return [
      { x: p.x + 1, y: p.y },
      { x: p.x - 1, y: p.y },
      { x: p.x, y: p.y + 1 },
      { x: p.x, y: p.y - 1 },
    ];
  }

  function isWalkableTile(t) {
    return t === Tile.Floor || t === Tile.Up || t === Tile.Down || t === Tile.Corpse || t === Tile.DoorOpen;
  }

  function isBlockingTile(t) { return t === Tile.Wall || t === Tile.DoorClosed; }

  function ensureBorderWalls(tiles) {
    for (let x = 0; x < GRID_W; x++) {
      tiles[idx(x, 0)] = Tile.Wall;
      tiles[idx(x, GRID_H - 1)] = Tile.Wall;
    }
    for (let y = 0; y < GRID_H; y++) {
      tiles[idx(0, y)] = Tile.Wall;
      tiles[idx(GRID_W - 1, y)] = Tile.Wall;
    }
  }

  function rectsOverlap(a, b, pad = 0) {
    return !(
      a.x + a.w + pad <= b.x ||
      b.x + b.w + pad <= a.x ||
      a.y + a.h + pad <= b.y ||
      b.y + b.h + pad <= a.y
    );
  }

  function carveRoom(tiles, room) {
    for (let y = room.y + 1; y < room.y + room.h - 1; y++)
      for (let x = room.x + 1; x < room.x + room.w - 1; x++)
        tiles[idx(x, y)] = Tile.Floor;
  }

  function carveCorridor(tiles, a, b, rng) {
    const horizFirst = rng() < 0.5;
    const mid = horizFirst ? { x: b.x, y: a.y } : { x: a.x, y: b.y };

    const carveLine = (p1, p2) => {
      let x = p1.x, y = p1.y;
      tiles[idx(x, y)] = Tile.Floor;
      while (x !== p2.x || y !== p2.y) {
        if (x < p2.x) x++;
        else if (x > p2.x) x--;
        else if (y < p2.y) y++;
        else y--;
        tiles[idx(x, y)] = Tile.Floor;
      }
    };

    carveLine(a, mid);
    carveLine(mid, b);
  }

  function randomFloorFromRoom(rng, room) {
    return {
      x: roll(rng, room.x + 1, room.x + room.w - 2),
      y: roll(rng, room.y + 1, room.y + room.h - 2),
    };
  }

  function posInRoom(p, room) {
    return p.x >= room.x && p.x < room.x + room.w && p.y >= room.y && p.y < room.y + room.h;
  }

  function isPerimeterCell(p, room) {
    if (!posInRoom(p, room)) return false;
    return p.x === room.x || p.y === room.y || p.x === room.x + room.w - 1 || p.y === room.y + room.h - 1;
  }

  function placeDoors(tiles, rooms, rng) {
    for (const room of rooms) {
      /** @type {Pos[]} */
      const candidates = [];
      for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
          const p = { x, y };
          if (!isPerimeterCell(p, room)) continue;
          const i = idx(x, y);
          if (tiles[i] !== Tile.Floor) continue;
          let hasInside = false, hasOutside = false;
          for (const n of neighbors4(p)) {
            if (!inBounds(n.x, n.y)) continue;
            const nt = tiles[idx(n.x, n.y)];
            const inside = posInRoom(n, room);
            if (inside && nt === Tile.Floor && !isPerimeterCell(n, room)) hasInside = true;
            if (!inside && nt === Tile.Floor) hasOutside = true;
          }
          if (hasInside && hasOutside) candidates.push(p);
        }
      }
      const doorCount = clamp(roll(rng, 1, 2), 1, 2);
      for (let k = 0; k < doorCount && candidates.length; k++) {
        const p = candidates.splice(Math.floor(rng() * candidates.length), 1)[0];
        tiles[idx(p.x, p.y)] = Tile.DoorClosed;
      }
    }
  }

  const ITEM_TYPES = {
    potion: { id: "potion", name: "Poção",    cssClass: "tileItemPotion" },
    armor:  { id: "armor",  name: "Armadura", cssClass: "tileItemArmor"  },
    charm:  { id: "charm",  name: "Amuleto",  cssClass: "tileItemCharm"  },
  };

  function generateLevel(depth, baseSeed) {
    const seed = mixSeed(baseSeed, depth);
    const rng = mulberry32(seed);

    const tiles = new Array(GRID_W * GRID_H).fill(Tile.Wall);
    ensureBorderWalls(tiles);

    /** @type {{x:number,y:number,w:number,h:number,cx:number,cy:number}[]} */
    const rooms = [];
    const targetRooms = clamp(5 + Math.floor(depth * 0.15), 5, 9);

    for (let tries = 0; tries < 500 && rooms.length < targetRooms; tries++) {
      const w = roll(rng, 6, 9);
      const h = roll(rng, 6, 9);
      const x = roll(rng, 1, GRID_W - w - 2);
      const y = roll(rng, 1, GRID_H - h - 2);
      const room = { x, y, w, h, cx: (x + ((w / 2) | 0)) | 0, cy: (y + ((h / 2) | 0)) | 0 };
      if (rooms.some((r) => rectsOverlap(r, room, 2))) continue;
      carveRoom(tiles, room);
      rooms.push(room);
    }

    if (rooms.length < 4) return generateLevel(depth, (baseSeed + 1337) >>> 0);

    rooms.sort((a, b) => (a.cx - b.cx) || (a.cy - b.cy));
    for (let i = 1; i < rooms.length; i++) {
      carveCorridor(tiles, { x: rooms[i - 1].cx, y: rooms[i - 1].cy }, { x: rooms[i].cx, y: rooms[i].cy }, rng);
    }

    const extra = roll(rng, 0, 2);
    for (let i = 0; i < extra; i++) {
      const r1 = choose(rng, rooms);
      const r2 = choose(rng, rooms);
      if (r1 !== r2) carveCorridor(tiles, { x: r1.cx, y: r1.cy }, { x: r2.cx, y: r2.cy }, rng);
    }

    placeDoors(tiles, rooms, rng);

    const startRoom   = choose(rng, rooms);
    const playerStart = randomFloorFromRoom(rng, startRoom);

    const otherRooms = rooms.filter((r) => r !== startRoom);
    otherRooms.sort((a, b) => manhattan({ x: b.cx, y: b.cy }, playerStart) - manhattan({ x: a.cx, y: a.cy }, playerStart));
    const downRoom = otherRooms[0] || startRoom;
    const upRoom   = otherRooms[Math.min(roll(rng, 1, Math.min(3, otherRooms.length - 1)), otherRooms.length - 1)] || startRoom;
    const down = randomFloorFromRoom(rng, downRoom);
    const up   = randomFloorFromRoom(rng, upRoom);

    tiles[idx(down.x, down.y)] = Tile.Down;
    tiles[idx(up.x,   up.y)]   = Tile.Up;
    tiles[idx(playerStart.x, playerStart.y)] = Tile.Floor;

    /** @type {Item[]} */
    const items = [];
    const itemCount = clamp(2 + Math.floor(depth * 0.15), 2, 6);
    const occupiedItems = new Set([idx(playerStart.x, playerStart.y), idx(down.x, down.y), idx(up.x, up.y)]);
    for (let i = 0; i < itemCount; i++) {
      let pos = null;
      for (let tries = 0; tries < 300; tries++) {
        const p = randomFloorFromRoom(rng, choose(rng, rooms));
        const ii = idx(p.x, p.y);
        if (occupiedItems.has(ii) || tiles[ii] !== Tile.Floor) continue;
        occupiedItems.add(ii);
        pos = p;
        break;
      }
      if (!pos) break;
      const t = choose(rng, [ITEM_TYPES.potion, ITEM_TYPES.armor, ITEM_TYPES.charm]);
      items.push({ id: `${depth}-${seed}-it-${i}-${t.id}`, typeId: t.id, name: t.name, cssClass: t.cssClass, pos });
    }

    const enemies = [];
    const enemyCount = clamp(4 + Math.floor(depth * 0.35), 4, 14);
    const occupied = new Set([idx(playerStart.x, playerStart.y), idx(down.x, down.y), idx(up.x, up.y)]);

    const enemyTypeBag = depth < 5
      ? [ENEMY_TYPES.goblin, ENEMY_TYPES.slime, ENEMY_TYPES.goblin]
      : depth < 12
        ? [ENEMY_TYPES.goblin, ENEMY_TYPES.slime, ENEMY_TYPES.orc]
        : [ENEMY_TYPES.orc, ENEMY_TYPES.slime, ENEMY_TYPES.goblin, ENEMY_TYPES.orc];

    for (let i = 0; i < enemyCount; i++) {
      let pos = null;
      for (let tries = 0; tries < 500; tries++) {
        const p = randomFloorFromRoom(rng, choose(rng, rooms));
        const ii = idx(p.x, p.y);
        if (occupied.has(ii) || manhattan(p, playerStart) < 4) continue;
        occupied.add(ii);
        pos = p;
        break;
      }
      if (!pos) break;
      const t = choose(rng, enemyTypeBag);
      enemies.push({ id: `${depth}-${seed}-${i}-${t.id}`, typeId: t.id, name: t.name, glyph: t.glyph, cssClass: t.cssClass, pos, hp: t.maxHp });
    }

    /** @type {Level} */
    return { depth, seed, tiles, playerStart, up, down, enemies, items, explored: new Uint8Array(GRID_W * GRID_H) };
  }

  // ── DOM ─────────────────────────────────────────────────────────────────────

  function el(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Elemento #${id} não encontrado`);
    return node;
  }

  const gridEl          = el("grid");
  const logEl           = el("log");
  const depthVal        = el("depthVal");
  const hpVal           = el("hpVal");
  const lvlVal          = el("lvlVal");
  const xpVal           = el("xpVal");
  const armVal          = el("armVal");
  const chaVal          = el("chaVal");
  const seedVal         = el("seedVal");
  const pointsVal       = el("pointsVal");
  const newGameBtn      = el("newGameBtn");
  const helpBtn         = el("helpBtn");
  const helpEl          = el("help");
  const invEl           = el("inv");
  const startModal      = el("startModal");
  const playerNameInput = el("playerNameInput");
  const startBtn        = el("startBtn");
  const scoresEl        = el("scores");

  // Pré-criar células DOM para melhor performance
  /** @type {HTMLDivElement[]} */
  const cells = [];
  for (let i = 0; i < GRID_W * GRID_H; i++) {
    const c = document.createElement("div");
    c.className = "cell tileFloor";
    cells.push(c);
    gridEl.appendChild(c);
  }
  gridEl.tabIndex = 0;
  gridEl.addEventListener("click", () => gridEl.focus());

  function pushLog(text, kind = "info") {
    const p   = document.createElement("p");
    p.className = "logLine";
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = kind === "info" ? "•" : kind === "good" ? "✓" : "!";
    const msg = document.createElement("span");
    msg.innerHTML =
      " " +
      text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll(/\*\*(.+?)\*\*/g, '<span class="' + (kind === "bad" ? "bad" : kind === "good" ? "good" : "tag") + '">$1</span>');
    p.appendChild(tag);
    p.appendChild(msg);
    logEl.prepend(p);
    while (logEl.childNodes.length > 60) logEl.removeChild(logEl.lastChild);
  }

  function cellForTile(t) {
    if (t === Tile.Wall)       return { cls: "tileWall" };
    if (t === Tile.Floor)      return { cls: "tileFloor" };
    if (t === Tile.Up)         return { cls: "tileStairsUp" };
    if (t === Tile.Down)       return { cls: "tileStairsDown" };
    if (t === Tile.Corpse)     return { cls: "tileCorpse" };
    if (t === Tile.DoorClosed) return { cls: "tileDoorClosed" };
    if (t === Tile.DoorOpen)   return { cls: "tileDoorOpen" };
    return { cls: "tileFloor" };
  }

  /** @type {{seed:number,playerName:string,depth:number,hp:number,maxHp:number,pos:Pos,levels:Map<number,Level>,alive:boolean,xp:number,lvl:number,armor:number,charisma:number,atk:[number,number],inv:{id:string,typeId:string,name:string}[],points:number}} */
  let state;

  // ── Pontuações (localStorage) ────────────────────────────────────────────────

  function getScores() {
    try { return JSON.parse(localStorage.getItem("deepcrawler_scores") || "[]"); }
    catch { return []; }
  }

  function saveScore() {
    const scores = getScores();
    scores.push({
      name:   state.playerName || "Anónimo",
      points: state.points,
      depth:  state.depth,
      lvl:    state.lvl,
      date:   new Date().toLocaleDateString("pt-PT"),
    });
    scores.sort((a, b) => b.points - a.points);
    localStorage.setItem("deepcrawler_scores", JSON.stringify(scores.slice(0, 10)));
    renderScores();
  }

  function renderScores() {
    const scores = getScores();
    scoresEl.innerHTML = "";
    if (!scores.length) {
      const p = document.createElement("p");
      p.className = "muted scoresEmpty";
      p.textContent = "Ainda não há pontuações registadas.";
      scoresEl.appendChild(p);
      return;
    }
    scores.forEach((s, i) => {
      const row = document.createElement("div");
      row.className = "scoreRow" + (i === 0 ? " scoreTop" : "");
      const safeName = s.name.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
      row.innerHTML = `<span class="scoreRank">${i + 1}</span><span class="scoreName">${safeName}</span><span class="scoreDepth">Andar ${s.depth}</span><span class="scoreLvl">Nív.&nbsp;${s.lvl}</span><span class="scorePoints">${s.points}&nbsp;pts</span><span class="scoreDate">${s.date}</span>`;
      scoresEl.appendChild(row);
    });
  }

  // ── Modal de início / novo jogo ──────────────────────────────────────────────

  function showModal() {
    startModal.removeAttribute("hidden");
    playerNameInput.value = "";
    setTimeout(() => playerNameInput.focus(), 50);
  }

  function hideModal() {
    startModal.setAttribute("hidden", "");
  }

  function startFromModal() {
    const name = playerNameInput.value.trim() || "Anónimo";
    hideModal();
    newGame((Math.random() * 2 ** 32) >>> 0, name);
  }

  startBtn.addEventListener("click", startFromModal);
  playerNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); startFromModal(); }
    // Escape fecha o modal se já houver um jogo em curso
    if (e.key === "Escape" && state) { hideModal(); gridEl.focus(); }
  });

  // ── Lógica do jogo ───────────────────────────────────────────────────────────

  function newGame(seed = (Math.random() * 2 ** 32) >>> 0, playerName = "Anónimo") {
    // Novo RNG de combate — avança ao longo de toda a partida
    combatRng = mulberry32(seed ^ 0xDEADBEEF);
    state = {
      seed,
      playerName,
      depth:    1,
      hp:       10,
      maxHp:    10,
      pos:      { x: 10, y: 10 },
      levels:   new Map(),
      alive:    true,
      xp:       0,
      lvl:      1,
      armor:    0,
      charisma: roll(mulberry32(seed ^ 0xC0FFEE), 0, 3),
      atk:      [2, 4],
      inv:      [],
      points:   0,
    };
    const lvl = getLevel(1);
    state.pos = { ...lvl.playerStart };
    pushLog(`Nova partida — **${playerName}**. Seed **${seed}**.`, "good");
    render();
    gridEl.focus();
  }

  function getLevel(depth) {
    let lvl = state.levels.get(depth);
    if (!lvl) { lvl = generateLevel(depth, state.seed); state.levels.set(depth, lvl); }
    return lvl;
  }

  function enemyAt(level, x, y) {
    return level.enemies.find((e) => e.hp > 0 && e.pos.x === x && e.pos.y === y) || null;
  }

  function isBlocked(level, x, y) {
    if (!inBounds(x, y)) return true;
    return isBlockingTile(level.tiles[idx(x, y)]);
  }

  function dealDamageToEnemy(enemy, amount) {
    enemy.hp -= amount;
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      pushLog(`Derrotaste o(a) **${enemy.name}**.`, "good");
    } else {
      pushLog(`Acertaste no(a) **${enemy.name}** em **${amount}**.`, "info");
    }
  }

  function dealDamageToPlayer(amount, sourceName) {
    // Armadura reduz o dano mas garante sempre pelo menos 1 ponto de dano
    const mitigated = Math.max(1, amount - state.armor);
    state.hp -= mitigated;
    if (state.hp <= 0) {
      state.hp = 0;
      state.alive = false;
      saveScore();
      pushLog(`Foste morto por **${sourceName}**. Fim de jogo.`, "bad");
      pushLog(`Pontuação final: **${state.points}** pontos (andar ${state.depth}, nível ${state.lvl}).`, "bad");
      pushLog("Clica em **Novo jogo** para tentar novamente.", "bad");
    } else if (state.armor > 0 && mitigated !== amount) {
      pushLog(`O(a) **${sourceName}** acerta-te em **${mitigated}** (armadura bloqueou **${amount - mitigated}**).`, "bad");
    } else {
      pushLog(`O(a) **${sourceName}** acerta-te em **${mitigated}**.`, "bad");
    }
  }

  function xpToNext(lvl) { return 8 + (lvl - 1) * 6; }

  function grantXp(amount) {
    state.xp += amount;
    state.points += amount * 10;
    pushLog(`Ganhaste **${amount}** XP e **${amount * 10}** pontos.`, "good");
    while (state.xp >= xpToNext(state.lvl)) {
      state.xp -= xpToNext(state.lvl);
      state.lvl += 1;
      state.maxHp += 2;
      state.hp = Math.min(state.maxHp, state.hp + 2);
      state.atk = [state.atk[0] + 1, state.atk[1] + 1];
      state.points += 50;
      pushLog(`Subiste de nível! Agora és nível **${state.lvl}** (+50 pontos).`, "good");
    }
  }

  function playerTryMove(dx, dy) {
    if (!state.alive) return false;
    const lvl = getLevel(state.depth);
    const nx = state.pos.x + dx;
    const ny = state.pos.y + dy;
    if (!inBounds(nx, ny)) return false;

    const targetEnemy = enemyAt(lvl, nx, ny);
    if (targetEnemy) {
      const dmg = roll(combatRng, state.atk[0], state.atk[1]);
      dealDamageToEnemy(targetEnemy, dmg);
      if (targetEnemy.hp <= 0) grantXp(2 + Math.floor(ENEMY_TYPES[targetEnemy.typeId].maxHp / 2));
      return true;
    }

    const t = lvl.tiles[idx(nx, ny)];
    if (t === Tile.DoorClosed) {
      lvl.tiles[idx(nx, ny)] = Tile.DoorOpen;
      state.points += 1;
      pushLog("Abriste uma porta (+1 ponto).", "info");
      return true;
    }
    if (!isWalkableTile(t)) return false;

    state.pos = { x: nx, y: ny };

    const it = lvl.items.find((ii) => ii.pos.x === nx && ii.pos.y === ny) || null;
    if (it) {
      if (state.inv.length < 9) {
        state.inv.push({ id: it.id, typeId: it.typeId, name: it.name });
        lvl.items = lvl.items.filter((x) => x.id !== it.id);
        state.points += 5;
        pushLog(`Apanhaste **${it.name}** (+5 pontos).`, "info");
      } else {
        pushLog("Inventário cheio (máx. 9).", "bad");
      }
    }

    if (t === Tile.Down) { goDepth(state.depth + 1, "down"); return true; }
    if (t === Tile.Up)   { goDepth(Math.max(1, state.depth - 1), "up"); return true; }
    return true;
  }

  function goDepth(newDepth, dir) {
    if (newDepth === state.depth) return;
    state.depth = newDepth;
    const lvl = getLevel(newDepth);
    state.pos = dir === "down" ? { ...lvl.up } : { ...lvl.down };
    if (dir === "down") {
      state.points += 25;
      pushLog(`Desceste para o andar **${newDepth}** (+25 pontos).`, "info");
    } else {
      pushLog(`Subiste para o andar **${newDepth}**.`, "info");
    }
  }

  function playerWait() {
    if (!state.alive) return false;
    pushLog("Esperaste um turno.", "info");
    return true;
  }

  function itemUse(slotIdx) {
    if (!state.alive) return false;
    const item = state.inv[slotIdx];
    if (!item) return false;

    if (item.typeId === "potion") {
      const before = state.hp;
      state.hp = Math.min(state.maxHp, state.hp + 4);
      state.points += 10;
      pushLog(`Bebeste uma poção (+**${state.hp - before}** HP, +10 pontos).`, "good");
    } else if (item.typeId === "armor") {
      if (state.armor >= ARMOR_MAX) {
        pushLog(`A armadura já está ao máximo (**${ARMOR_MAX}**). Guarda para mais tarde.`, "info");
        return false;
      }
      state.armor += 1;
      state.points += 15;
      pushLog(`Equipaste armadura (+**1** armadura, +15 pontos). [${state.armor}/${ARMOR_MAX}]`, "good");
    } else if (item.typeId === "charm") {
      state.charisma += 1;
      state.points += 15;
      pushLog(`Usaste um amuleto (+**1** carisma → **${state.charisma * 10}%** de esquiva, +15 pontos).`, "good");
    } else {
      return false;
    }

    state.inv.splice(slotIdx, 1);
    return true;
  }

  function blocksSight(t) { return t === Tile.Wall || t === Tile.DoorClosed; }

  function bresenhamLine(a, b) {
    const points = [];
    let x0 = a.x, y0 = a.y;
    const dx = Math.abs(b.x - x0), dy = -Math.abs(b.y - y0);
    const sx = x0 < b.x ? 1 : -1, sy = y0 < b.y ? 1 : -1;
    let err = dx + dy;
    while (true) {
      points.push({ x: x0, y: y0 });
      if (x0 === b.x && y0 === b.y) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return points;
  }

  function computeFov(level, origin, radius) {
    const visible = new Uint8Array(GRID_W * GRID_H);
    const r2 = radius * radius;
    for (let y = origin.y - radius; y <= origin.y + radius; y++) {
      for (let x = origin.x - radius; x <= origin.x + radius; x++) {
        if (!inBounds(x, y)) continue;
        const dx = x - origin.x, dy = y - origin.y;
        if (dx * dx + dy * dy > r2) continue;
        const line = bresenhamLine(origin, { x, y });
        for (let i = 0; i < line.length; i++) {
          const p = line[i];
          const ii = idx(p.x, p.y);
          visible[ii] = 1;
          level.explored[ii] = 1;
          if (i < line.length - 1 && blocksSight(level.tiles[ii])) break;
        }
      }
    }
    return visible;
  }

  function bfsNextStep(level, from, to, blocked) {
    const startI = idx(from.x, from.y);
    const goalI  = idx(to.x, to.y);
    const prev   = new Int32Array(GRID_W * GRID_H).fill(-1);
    const q      = new Int32Array(GRID_W * GRID_H);
    let qh = 0, qt = 0;
    q[qt++] = startI;
    prev[startI] = startI;
    while (qh < qt) {
      const curI = q[qh++];
      if (curI === goalI) break;
      const cx = curI % GRID_W, cy = (curI / GRID_W) | 0;
      for (const [nx, ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]) {
        if (!inBounds(nx, ny)) continue;
        const ni = idx(nx, ny);
        if (prev[ni] !== -1 || blocked(nx, ny)) continue;
        prev[ni] = curI;
        q[qt++] = ni;
      }
    }
    if (prev[goalI] === -1) return null;
    let cur = goalI, p = prev[cur];
    while (p !== startI && p !== cur) { cur = p; p = prev[cur]; }
    return { x: cur % GRID_W, y: (cur / GRID_W) | 0 };
  }

  function enemiesTurn() {
    const lvl = getLevel(state.depth);
    if (!state.alive) return;

    const occ = new Set();
    for (const e of lvl.enemies) {
      if (e.hp > 0) occ.add(idx(e.pos.x, e.pos.y));
    }

    const blockedForEnemy = (x, y) => {
      if (isBlocked(lvl, x, y)) return true;
      if (x === state.pos.x && y === state.pos.y) return false; // permitir atacar o jogador
      return occ.has(idx(x, y));
    };

    for (const e of lvl.enemies) {
      if (e.hp <= 0 || !state.alive) continue;

      const dist = manhattan(e.pos, state.pos);
      const et   = ENEMY_TYPES[e.typeId];

      if (dist === 1) {
        // Carisma: cada ponto dá 10% de chance de esquivar (máx. 50% com carisma 5)
        if (state.charisma > 0 && combatRng() < state.charisma * 0.10) {
          pushLog(`Esquivaste-te do ataque de **${e.name}**! (Carisma)`, "good");
          continue;
        }
        dealDamageToPlayer(roll(combatRng, et.atk[0], et.atk[1]), e.name);
        continue;
      }

      let next = null;
      if (dist <= 8) next = bfsNextStep(lvl, e.pos, state.pos, blockedForEnemy);
      if (!next) {
        const dirs = [{ x:1,y:0 },{ x:-1,y:0 },{ x:0,y:1 },{ x:0,y:-1 }];
        const d = choose(combatRng, dirs);
        const nx = e.pos.x + d.x, ny = e.pos.y + d.y;
        const nt = lvl.tiles[idx(nx, ny)];
        if (!blockedForEnemy(nx, ny) && nt !== Tile.Up && nt !== Tile.Down) next = { x: nx, y: ny };
      }

      if (next) {
        occ.delete(idx(e.pos.x, e.pos.y));
        e.pos = next;
        occ.add(idx(e.pos.x, e.pos.y));
      }
    }
  }

  function cleanupDead() {
    const lvl = getLevel(state.depth);
    for (const e of lvl.enemies) {
      if (e.hp <= 0) {
        const i = idx(e.pos.x, e.pos.y);
        if (lvl.tiles[i] === Tile.Floor) lvl.tiles[i] = Tile.Corpse;
      }
    }
  }

  function renderInventory() {
    invEl.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const row  = document.createElement("div");
      row.className = "invRow";
      const left = document.createElement("div");
      left.className = "left";
      const slot = document.createElement("div");
      slot.className = "invSlot";
      slot.textContent = String(i + 1);
      const name = document.createElement("div");
      name.className = "invName";
      name.textContent = state.inv[i] ? state.inv[i].name : "—";
      left.appendChild(slot);
      left.appendChild(name);
      row.appendChild(left);
      invEl.appendChild(row);
    }
  }

  function render() {
    const lvl = getLevel(state.depth);
    depthVal.textContent  = String(state.depth);
    hpVal.textContent     = `${state.hp}/${state.maxHp}`;
    lvlVal.textContent    = String(state.lvl);
    xpVal.textContent     = `${state.xp}/${xpToNext(state.lvl)}`;
    armVal.textContent    = `${state.armor}/${ARMOR_MAX}`;
    chaVal.textContent    = String(state.charisma);
    seedVal.textContent   = String(state.seed >>> 0);
    pointsVal.textContent = String(state.points);

    const visible = computeFov(lvl, state.pos, 8);

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const i    = idx(x, y);
        const { cls } = cellForTile(lvl.tiles[i]);
        const fog  = visible[i] ? "fogVisible" : lvl.explored[i] ? "fogExplored" : "fogHidden";
        cells[i].className = `cell ${cls} ${fog}`;
        cells[i].textContent = "";
      }
    }

    for (const it of lvl.items) {
      const i = idx(it.pos.x, it.pos.y);
      if (!visible[i]) continue;
      cells[i].className = `cell ${it.cssClass} fogVisible`;
      cells[i].textContent = "";
    }

    for (const e of lvl.enemies) {
      if (e.hp <= 0) continue;
      const i = idx(e.pos.x, e.pos.y);
      if (!visible[i]) continue;
      cells[i].className = `cell ${e.cssClass}`;
      cells[i].textContent = "";
    }

    const pi = idx(state.pos.x, state.pos.y);
    cells[pi].className = "cell tilePlayer";
    cells[pi].textContent = "";

    renderInventory();
  }

  function doTurn(playerActed) {
    if (!playerActed) return;
    cleanupDead();
    enemiesTurn();
    cleanupDead();
    render();
  }

  function onKeyDown(e) {
    if (e.key === "Tab") return;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d","W","A","S","D"," ","1","2","3","4","5","6","7","8","9"].includes(e.key)) {
      e.preventDefault();
    }
    if (!state) return;

    let acted = false;
    switch (e.key) {
      case "ArrowUp":  case "w": case "W": acted = playerTryMove(0, -1); break;
      case "ArrowDown":  case "s": case "S": acted = playerTryMove(0,  1); break;
      case "ArrowLeft":  case "a": case "A": acted = playerTryMove(-1, 0); break;
      case "ArrowRight": case "d": case "D": acted = playerTryMove( 1, 0); break;
      case " ": acted = playerWait(); break;
      case "1": case "2": case "3": case "4": case "5":
      case "6": case "7": case "8": case "9":
        acted = itemUse(Number(e.key) - 1); break;
      default: return;
    }
    doTurn(acted);
  }

  document.addEventListener("keydown", onKeyDown, { passive: false });

  newGameBtn.addEventListener("click", showModal);
  helpBtn.addEventListener("click", () => {
    const willShow = helpEl.hasAttribute("hidden");
    if (willShow) helpEl.removeAttribute("hidden");
    else helpEl.setAttribute("hidden", "");
    helpBtn.setAttribute("aria-expanded", willShow ? "true" : "false");
  });

  // Arranque
  renderScores();
  showModal();
})();
