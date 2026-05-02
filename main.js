(() => {
  "use strict";

  const LEVEL_W = 41;
  const LEVEL_H = 41;
  const VIEW_W = 21;
  const VIEW_H = 21;
  const ARMOR_MAX = 5;

  const Tile = {
    Wall: "#", Floor: ".", Up: "<", Down: ">",
    Corpse: "%", DoorClosed: "+", DoorOpen: "/", DoorLocked: "X",
  };

  const SUPABASE_URL = "https://nyfoxreoogblnqptpomz.supabase.co";
  const SUPABASE_KEY = "sb_publishable_2RFiYJ5GGivIBfJNsp_LLw_qWkxe0s1";

  /** @typedef {{x:number,y:number}} Pos */
  /** @typedef {{id:string,name:string,glyph:string,cssClass:string,maxHp:number,atk:[number,number]}} EnemyType */
  /** @typedef {{id:string,typeId:string,name:string,article:string,va:number,glyph:string,cssClass:string,pos:Pos,hp:number,maxHp:number,atk:[number,number]}} Enemy */
  /** @typedef {{id:string,typeId:string,name:string,cssClass:string,pos:Pos}} Item */
  /** @typedef {{depth:number,seed:number,tiles:string[],playerStart:Pos,up:Pos,down:Pos,enemies:Enemy[],items:Item[],explored:Uint8Array}} Level */

  const ENEMY_TYPES = {
    ratazana_de_esgoto: { id: "ratazana_de_esgoto", name: "Ratazana de esgoto", article: "a", glyph: "r", va: 1, cssClass: "tileEnemyG", maxHp: 3, atk: [1, 2] },
    morcego_das_cavernas: { id: "morcego_das_cavernas", name: "Morcego das cavernas", article: "o", glyph: "f", va: 1, cssClass: "tileEnemyG", maxHp: 3, atk: [1, 2] },
    beringela_radioativa: { id: "beringela_radioativa", name: "Beringela Radioativa", article: "a", glyph: "d", va: 2, cssClass: "tileEnemyG", maxHp: 5, atk: [2, 3] },
    gnomo_das_trevas: { id: "gnomo_das_trevas", name: "Gnomo das Trevas", article: "o", glyph: "k", va: 2, cssClass: "tileEnemyG", maxHp: 5, atk: [2, 3] },
    homunculo: { id: "homunculo", name: "Coelho Desnorteado", article: "o", glyph: "i", va: 2, cssClass: "tileEnemyG", maxHp: 5, atk: [2, 3] },
    raposa: { id: "raposa", name: "Raposa no Cio", article: "a", glyph: "d", va: 2, cssClass: "tileEnemyG", maxHp: 5, atk: [2, 3] },
    formiga_gigante: { id: "formiga_gigante", name: "Formiga gigante", article: "a", glyph: "a", va: 3, cssClass: "tileEnemyG", maxHp: 6, atk: [2, 4] },
    bolha_acida: { id: "bolha_acida", name: "Bolha ácida", article: "a", glyph: "b", va: 3, cssClass: "tileEnemyG", maxHp: 6, atk: [2, 4] },
    lagarto_das_rochas: { id: "lagarto_das_rochas", name: "Lagarto das rochas", article: "o", glyph: ":", va: 3, cssClass: "tileEnemyG", maxHp: 6, atk: [2, 4] },
    luz_de_presenca: { id: "luz_de_presenca", name: "Luz de Presença", article: "a", glyph: "y", va: 3, cssClass: "tileEnemyG", maxHp: 6, atk: [2, 4] },
    lobo_selvagem: { id: "lobo_selvagem", name: "Lobo selvagem", article: "o", glyph: "d", va: 4, cssClass: "tileEnemyG", maxHp: 8, atk: [3, 4] },
    goblin: { id: "goblin", name: "Goblin", article: "o", glyph: "o", va: 4, cssClass: "tileEnemyG", maxHp: 8, atk: [3, 4] },
    serpente: { id: "serpente", name: "Serpente", article: "a", glyph: "S", va: 4, cssClass: "tileEnemyG", maxHp: 8, atk: [3, 4] },
    orc: { id: "orc", name: "Orc", article: "o", glyph: "o", va: 5, cssClass: "tileEnemyG", maxHp: 9, atk: [3, 5] },
    berbequim_descontrolado: { id: "berbequim_descontrolado", name: "Berbequim Descontrolado", article: "o", glyph: "p", va: 6, cssClass: "tileEnemyO", maxHp: 11, atk: [4, 6] },
    geleia_ocre: { id: "geleia_ocre", name: "Pudim fora de prazo", article: "o", glyph: "j", va: 7, cssClass: "tileEnemyO", maxHp: 12, atk: [4, 6] },
    besta_chifruda: { id: "besta_chifruda", name: "Besta chifruda", article: "a", glyph: "q", va: 8, cssClass: "tileEnemyO", maxHp: 14, atk: [5, 7] },
    urso_coruja: { id: "urso_coruja", name: "Urso-Coruja", article: "o", glyph: "h", va: 10, cssClass: "tileEnemyO", maxHp: 17, atk: [6, 8] },
    tigre_dentes_de_sabre: { id: "tigre_dentes_de_sabre", name: "Tigre dentes-de-sabre", article: "o", glyph: "f", va: 10, cssClass: "tileEnemyO", maxHp: 17, atk: [6, 8] },
    geleia_azul: { id: "geleia_azul", name: "Geleia Azul", article: "a", glyph: "j", va: 11, cssClass: "tileEnemyO", maxHp: 18, atk: [6, 9] },
    soldado_anao: { id: "soldado_anao", name: "Soldado Anão", article: "o", glyph: "h", va: 11, cssClass: "tileEnemyO", maxHp: 18, atk: [6, 9] },
    duende_ladrao: { id: "duende_ladrao", name: "Duende Ladrão", article: "o", glyph: "l", va: 13, cssClass: "tileEnemyO", maxHp: 21, atk: [7, 10] },
    comedor_de_miolos: { id: "comedor_de_miolos", name: "Comedor de Miolos", article: "o", glyph: "M", va: 14, cssClass: "tileEnemyO", maxHp: 23, atk: [8, 11] },
    mimico: { id: "mimico", name: "Mímico", article: "o", glyph: "m", va: 15, cssClass: "tileEnemyO", maxHp: 24, atk: [8, 12] },
    gnomo_feiticeiro: { id: "gnomo_feiticeiro", name: "Gnomo Feiticeiro", article: "o", glyph: "G", va: 16, cssClass: "tileEnemySK", maxHp: 26, atk: [9, 12] },
    ogre: { id: "ogre", name: "Ogre", article: "o", glyph: "O", va: 18, cssClass: "tileEnemySK", maxHp: 29, atk: [10, 14] },
    mosca_choca: { id: "mosca_choca", name: "Mosca Choca", article: "a", glyph: "x", va: 20, cssClass: "tileEnemySK", maxHp: 32, atk: [11, 15] },
    limo_verde: { id: "limo_verde", name: "Limo Verde", article: "o", glyph: "P", va: 22, cssClass: "tileEnemySK", maxHp: 35, atk: [12, 16] },
    gigante_das_colinas: { id: "gigante_das_colinas", name: "Funcionário das Finanças", article: "o", glyph: "H", va: 24, cssClass: "tileEnemySK", maxHp: 38, atk: [13, 18] },
    brutamontes: { id: "brutamontes", name: "Brutamontes", article: "o", glyph: "U", va: 26, cssClass: "tileEnemyTR", maxHp: 41, atk: [14, 19] },
    troll: { id: "troll", name: "Troll", article: "o", glyph: "T", va: 28, cssClass: "tileEnemyTR", maxHp: 44, atk: [15, 20] },
    elemental_do_fogo: { id: "elemental_do_fogo", name: "Elemental do Fogo", article: "o", glyph: "E", va: 30, cssClass: "tileEnemyTR", maxHp: 47, atk: [16, 22] },
    basilisco: { id: "basilisco", name: "Basilisco", article: "o", glyph: "c", va: 32, cssClass: "tileEnemyTR", maxHp: 50, atk: [17, 23] },
    sombra_veloz: { id: "sombra_veloz", name: "Sombra veloz", article: "a", glyph: "i", va: 35, cssClass: "tileEnemyTR", maxHp: 54, atk: [18, 25] },
    policia_bebado: { id: "policia_bebado", name: "Polícia Bêbado", article: "o", glyph: "K", va: 38, cssClass: "tileEnemyTR", maxHp: 59, atk: [20, 27] },
    carnical: { id: "carnical", name: "Carniçal", article: "o", glyph: "Z", va: 40, cssClass: "tileEnemyTR", maxHp: 62, atk: [21, 28] },
    vampiro: { id: "vampiro", name: "Vampiro", article: "o", glyph: "V", va: 42, cssClass: "tileEnemyV", maxHp: 65, atk: [22, 30] },
    necromante: { id: "necromante", name: "Necromante", article: "o", glyph: "L", va: 45, cssClass: "tileEnemyV", maxHp: 69, atk: [23, 32] },
    espectro: { id: "espectro", name: "Espectro", article: "o", glyph: "W", va: 46, cssClass: "tileEnemyV", maxHp: 71, atk: [24, 32] },
    dragao: { id: "dragao", name: "Dragão", article: "o", glyph: "D", va: 50, cssClass: "tileEnemyV", maxHp: 77, atk: [26, 35] },
    balrog: { id: "balrog", name: "Balrog", article: "o", glyph: "&", va: 55, cssClass: "tileEnemyV", maxHp: 84, atk: [28, 38] },
    medusa: { id: "medusa", name: "Medusa", article: "a", glyph: "@", va: 60, cssClass: "tileEnemyD", maxHp: 92, atk: [31, 42] },
    feiticeiro_das_trevas: { id: "feiticeiro_das_trevas", name: "Feiticeiro das Trevas", article: "o", glyph: "@", va: 75, cssClass: "tileEnemyD", maxHp: 114, atk: [38, 52] },
    vlad_o_empalador: { id: "vlad_o_empalador", name: "Vlad, o Empalador", article: "o", glyph: "V", va: 80, cssClass: "tileEnemyD", maxHp: 122, atk: [41, 55] },
    devorador_de_almas: { id: "devorador_de_almas", name: "Devorador de Almas", article: "o", glyph: "&", va: 95, cssClass: "tileEnemyD", maxHp: 144, atk: [48, 65] },
  };

  // Comportamentos dos inimigos
  const BEHAVIORS = {
    static:    new Set(["bolha_acida","geleia_ocre","geleia_azul","limo_verde","luz_de_presenca","mimico"]),
    timid:     new Set(["ratazana_de_esgoto","morcego_das_cavernas","homunculo","beringela_radioativa"]),
    berserker: new Set(["brutamontes","berbequim_descontrolado","besta_chifruda","balrog","tigre_dentes_de_sabre"]),
    ranged:    new Set(["gnomo_feiticeiro","necromante","gnomo_das_trevas","feiticeiro_das_trevas","medusa","mosca_choca"]),
    pack:      new Set(["goblin","soldado_anao","orc","policia_bebado","carnical"]),
  };

  // Arquétipos de jogador — valores tabelados
  const PLAYER_ARCHETYPES = [
    { name: "Guerreiro", maxHp: 14, atk: [2, 5], armor: 1, charisma: 0, emoji: "😠" },
    { name: "Ladrão", maxHp: 9, atk: [3, 5], armor: 0, charisma: 3, emoji: "😈" },
    { name: "Mago", maxHp: 8, atk: [1, 7], armor: 0, charisma: 1, emoji: "🧐" },
    { name: "Paladino", maxHp: 12, atk: [2, 4], armor: 1, charisma: 2, emoji: "😇" },
    { name: "Bárbaro", maxHp: 16, atk: [3, 6], armor: 0, charisma: 0, emoji: "🤬" },
    { name: "Turista", maxHp: 10, atk: [1, 3], armor: 0, charisma: 1, emoji: "🤪" },
  ];

  // RNG de combate global — avança ao longo de toda a sessão
  let combatRng;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function idx(x, y) { return y * LEVEL_W + x; }
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < LEVEL_W && y < LEVEL_H; }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mixSeed(baseSeed, depth) {
    let x = (baseSeed ^ (depth * 0x9E3779B9)) >>> 0;
    x ^= x >>> 16; x = Math.imul(x, 0x7FEB352D) >>> 0;
    x ^= x >>> 15; x = Math.imul(x, 0x846CA68B) >>> 0;
    return (x ^ (x >>> 16)) >>> 0;
  }

  function roll(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }
  function choose(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function manhattan(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

  function neighbors4(p) {
    return [{ x: p.x + 1, y: p.y }, { x: p.x - 1, y: p.y }, { x: p.x, y: p.y + 1 }, { x: p.x, y: p.y - 1 }];
  }

  function isWalkableTile(t) {
    return t === Tile.Floor || t === Tile.Up || t === Tile.Down || t === Tile.Corpse || t === Tile.DoorOpen;
  }
  function isBlockingTile(t) { return t === Tile.Wall || t === Tile.DoorClosed || t === Tile.DoorLocked; }

  function ensureBorderWalls(tiles) {
    for (let x = 0; x < LEVEL_W; x++) { tiles[idx(x, 0)] = Tile.Wall; tiles[idx(x, LEVEL_H - 1)] = Tile.Wall; }
    for (let y = 0; y < LEVEL_H; y++) { tiles[idx(0, y)] = Tile.Wall; tiles[idx(LEVEL_W - 1, y)] = Tile.Wall; }
  }

  function rectsOverlap(a, b, pad = 0) {
    return !(a.x + a.w + pad <= b.x || b.x + b.w + pad <= a.x || a.y + a.h + pad <= b.y || b.y + b.h + pad <= a.y);
  }

  function carveRoom(tiles, room) {
    for (let y = room.y + 1; y < room.y + room.h - 1; y++)
      for (let x = room.x + 1; x < room.x + room.w - 1; x++)
        tiles[idx(x, y)] = Tile.Floor;
  }

  function carveCorridor(tiles, a, b, rng) {
    const horizFirst = rng() < 0.5;
    const mid = horizFirst ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
    const line = (p1, p2) => {
      let x = p1.x, y = p1.y;
      tiles[idx(x, y)] = Tile.Floor;
      while (x !== p2.x || y !== p2.y) {
        if (x < p2.x) x++; else if (x > p2.x) x--;
        else if (y < p2.y) y++; else y--;
        tiles[idx(x, y)] = Tile.Floor;
      }
    };
    line(a, mid); line(mid, b);
  }

  function randomFloorFromRoom(rng, room) {
    return { x: roll(rng, room.x + 1, room.x + room.w - 2), y: roll(rng, room.y + 1, room.y + room.h - 2) };
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
      const candidates = [];
      for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
          const p = { x, y };
          if (!isPerimeterCell(p, room) || tiles[idx(x, y)] !== Tile.Floor) continue;
          const tN = inBounds(x, y - 1) ? tiles[idx(x, y - 1)] : Tile.Wall;
          const tS = inBounds(x, y + 1) ? tiles[idx(x, y + 1)] : Tile.Wall;
          const tE = inBounds(x + 1, y) ? tiles[idx(x + 1, y)] : Tile.Wall;
          const tW = inBounds(x - 1, y) ? tiles[idx(x - 1, y)] : Tile.Wall;

          // A valid doorway must be exactly between two walls
          const isHorizDoor = (tN === Tile.Wall && tS === Tile.Wall && tE === Tile.Floor && tW === Tile.Floor);
          const isVertDoor = (tE === Tile.Wall && tW === Tile.Wall && tN === Tile.Floor && tS === Tile.Floor);

          if (isHorizDoor || isVertDoor) candidates.push(p);
        }
      }
      const count = clamp(roll(rng, 1, 2), 1, 2);
      for (let k = 0; k < count && candidates.length; k++) {
        const p = candidates.splice(Math.floor(rng() * candidates.length), 1)[0];
        tiles[idx(p.x, p.y)] = Tile.DoorClosed;
      }
    }
  }

  // Devolve o conjunto de índices adjacentes a portas (incluindo a própria porta)
  function doorExclusions(tiles) {
    const ex = new Set();
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] !== Tile.DoorClosed) continue;
      ex.add(i);
      const px = i % LEVEL_W, py = (i / LEVEL_W) | 0;
      for (const n of neighbors4({ x: px, y: py }))
        if (inBounds(n.x, n.y)) ex.add(idx(n.x, n.y));
    }
    return ex;
  }

  // Escolhe posição de chão dentro de um quarto, evitando o conjunto de exclusão
  function safeFloor(rng, room, exclude, maxTries = 80) {
    for (let t = 0; t < maxTries; t++) {
      const p = randomFloorFromRoom(rng, room);
      if (!exclude.has(idx(p.x, p.y))) return p;
    }
    return randomFloorFromRoom(rng, room); // fallback sem garantia
  }

  // Aplica multiplicador de dificuldade ao tipo de inimigo (retorna novo objecto)
  function scaleEnemy(base, tier) {
    if (tier === 0) return base;
    return {
      ...base,
      maxHp: Math.round(base.maxHp * (1 + tier * 0.4)),
      atk: [base.atk[0] + tier, base.atk[1] + tier],
    };
  }

  const ITEM_TYPES = {
    potion: { id: "potion", name: "Poção", cssClass: "tileItemPotion" },
    armor: { id: "armor", name: "Armadura", cssClass: "tileItemArmor" },
    charm: { id: "charm", name: "Amuleto", cssClass: "tileItemCharm" },
    key: { id: "key", name: "Chave", cssClass: "tileItemKey" },
    sword: { id: "sword", name: "Espada", cssClass: "tileItemSword" },
    scroll: { id: "scroll", name: "Pergaminho", cssClass: "tileItemScroll" },
  };

  function generateLevel(depth, baseSeed) {
    const seed = mixSeed(baseSeed, depth);
    const rng = mulberry32(seed);

    const tiles = new Array(LEVEL_W * LEVEL_H).fill(Tile.Wall);
    ensureBorderWalls(tiles);

    const rooms = [];
    const targetRooms = clamp(8 + Math.floor(depth * 0.3), 8, 15);
    for (let tries = 0; tries < 500 && rooms.length < targetRooms; tries++) {
      const w = roll(rng, 6, 9), h = roll(rng, 6, 9);
      const x = roll(rng, 1, LEVEL_W - w - 2), y = roll(rng, 1, LEVEL_H - h - 2);
      const room = { x, y, w, h, cx: (x + ((w / 2) | 0)) | 0, cy: (y + ((h / 2) | 0)) | 0 };
      if (rooms.some(r => rectsOverlap(r, room, 2))) continue;
      carveRoom(tiles, room);
      rooms.push(room);
    }
    if (rooms.length < 4) return generateLevel(depth, (baseSeed + 1337) >>> 0);

    rooms.sort((a, b) => (a.cx - b.cx) || (a.cy - b.cy));
    for (let i = 1; i < rooms.length; i++)
      carveCorridor(tiles, { x: rooms[i - 1].cx, y: rooms[i - 1].cy }, { x: rooms[i].cx, y: rooms[i].cy }, rng);

    const extra = roll(rng, 0, 2);
    for (let i = 0; i < extra; i++) {
      const r1 = choose(rng, rooms), r2 = choose(rng, rooms);
      if (r1 !== r2) carveCorridor(tiles, { x: r1.cx, y: r1.cy }, { x: r2.cx, y: r2.cy }, rng);
    }

    placeDoors(tiles, rooms, rng);

    // ── Escolher sala de início ANTES de trancar portas ────────────────────
    // (para garantir que nenhuma porta da sala inicial fica trancada)
    const startRoom = choose(rng, rooms);

    // Portas da sala inicial — nunca podem ser trancadas
    const startRoomDoorIndices = new Set();
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] !== Tile.DoorClosed) continue;
      const px = i % LEVEL_W, py = (i / LEVEL_W) | 0;
      // Uma porta "pertence" à sala inicial se ela ou um vizinho imediato está dentro da sala
      if (posInRoom({ x: px, y: py }, startRoom)) { startRoomDoorIndices.add(i); continue; }
      for (const n of neighbors4({ x: px, y: py })) {
        if (posInRoom(n, startRoom)) { startRoomDoorIndices.add(i); break; }
      }
    }

    const doorIndices = [];
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] === Tile.DoorClosed && !startRoomDoorIndices.has(i)) doorIndices.push(i);
    }
    const numLocked = Math.min(doorIndices.length, clamp(Math.floor(depth / 3), 1, 3));
    for (let i = 0; i < numLocked; i++) {
      const idxToSwap = roll(rng, i, doorIndices.length - 1);
      const temp = doorIndices[i];
      doorIndices[i] = doorIndices[idxToSwap];
      doorIndices[idxToSwap] = temp;
      tiles[doorIndices[i]] = Tile.DoorLocked;
    }

    // Exclusões: tiles adjacentes a portas
    const nearDoor = doorExclusions(tiles);

    const playerStart = safeFloor(rng, startRoom, nearDoor);

    const otherRooms = rooms.filter(r => r !== startRoom);
    otherRooms.sort((a, b) => manhattan({ x: b.cx, y: b.cy }, playerStart) - manhattan({ x: a.cx, y: a.cy }, playerStart));
    const downRoom = otherRooms[0] || startRoom;
    const upRoom = otherRooms[Math.min(roll(rng, 1, Math.min(3, otherRooms.length - 1)), otherRooms.length - 1)] || startRoom;

    const stairExclude = new Set([...nearDoor, idx(playerStart.x, playerStart.y)]);
    const down = safeFloor(rng, downRoom, stairExclude);
    stairExclude.add(idx(down.x, down.y));
    const up = safeFloor(rng, upRoom, stairExclude);

    tiles[idx(down.x, down.y)] = Tile.Down;
    tiles[idx(up.x, up.y)] = Tile.Up;
    tiles[idx(playerStart.x, playerStart.y)] = Tile.Floor;

    // Itens
    const chunkId = Math.floor((depth - 1) / 10);
    const chunkRng = mulberry32(baseSeed ^ chunkId ^ 0x9A7E);
    const d1 = roll(chunkRng, 1, 10);
    const d2 = roll(chunkRng, 1, 10);
    const depthInChunk = ((depth - 1) % 10) + 1;
    const isSpecialLevel = (depthInChunk === d1 || depthInChunk === d2);
    let specialsSpawned = 0;

    const items = [];
    const itemCount = clamp(2 + Math.floor(depth * 0.1), 2, 5);
    // Safe zone BFS for keys
    const safeZone = [];
    const visited = new Uint8Array(LEVEL_W * LEVEL_H);
    const q = [idx(playerStart.x, playerStart.y)];
    visited[q[0]] = 1;
    let qh = 0;
    while (qh < q.length) {
      const cur = q[qh++];
      const cx = cur % LEVEL_W, cy = (cur / LEVEL_W) | 0;
      if (tiles[cur] === Tile.Floor) safeZone.push({ x: cx, y: cy });

      for (const n of neighbors4({ x: cx, y: cy })) {
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
        tp = choose(rng, [ITEM_TYPES.armor, ITEM_TYPES.charm, ITEM_TYPES.sword, ITEM_TYPES.scroll]);
        specialsSpawned++;
      }

      items.push({ id: `${depth}-${seed}-it-${i}-${tp.id}`, typeId: tp.id, name: tp.name, cssClass: tp.cssClass, pos });
    }

    const availableMonsters = Object.values(ENEMY_TYPES);
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
    };

    // Inimigos
    const enemies = [];
    const enemyCount = Math.floor(rooms.length * (1 + rng()));
    const occEnemies = new Set([...nearDoor, idx(playerStart.x, playerStart.y), idx(down.x, down.y), idx(up.x, up.y)]);
    for (let i = 0; i < enemyCount; i++) {
      let pos = null;
      for (let t = 0; t < 500; t++) {
        const p = randomFloorFromRoom(rng, choose(rng, rooms));
        const ii = idx(p.x, p.y);
        if (occEnemies.has(ii) || manhattan(p, playerStart) < 4) continue;
        occEnemies.add(ii); pos = p; break;
      }
      if (!pos) break;
      const et = pickMonster();
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
      });
    }

    return { depth, seed, tiles, playerStart, up, down, enemies, items, explored: new Uint8Array(LEVEL_W * LEVEL_H) };
  }

  // ── Sons (Web Audio API) ─────────────────────────────────────────────────────

  let soundMuted = false;
  let _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
    }
    return _audioCtx;
  }

  function beep(freq, dur, type = "square", vol = 0.18, delay = 0) {
    if (soundMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      g.gain.setValueAtTime(vol, ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur + 0.01);
    } catch (e) { }
  }

  const sfx = {
    // Jogador ataca
    attack: () => { beep(330, 0.06, "sawtooth", 0.18); beep(200, 0.08, "sawtooth", 0.10, 0.05); },
    // Inimigo morre
    kill: () => { beep(440, 0.07, "square", 0.16); beep(330, 0.07, "square", 0.12, 0.08); beep(220, 0.10, "square", 0.08, 0.16); },
    // Jogador é atingido
    hit: () => { beep(140, 0.10, "sawtooth", 0.25); beep(100, 0.12, "sawtooth", 0.14, 0.07); },
    // Jogador esquiva
    dodge: () => beep(660, 0.06, "sine", 0.12),
    // Apanhar item
    pickup: () => { beep(523, 0.07, "sine", 0.16); beep(659, 0.09, "sine", 0.11, 0.07); },
    // Subir de nível
    levelUp: () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.13, "sine", 0.18, i * 0.10)),
    // Abrir porta
    door: () => beep(180, 0.07, "square", 0.12),
    // Usar escadas
    stairs: () => { beep(330, 0.08, "sine", 0.13); beep(440, 0.10, "sine", 0.11, 0.09); },
    // Morte do jogador
    death: () => [220, 165, 110, 82].forEach((f, i) => beep(f, 0.22, "sawtooth", 0.24, i * 0.20)),
  };

  // ── DOM ──────────────────────────────────────────────────────────────────────

  function el(id) {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Elemento #${id} não encontrado`);
    return node;
  }

  const gridEl = el("grid");
  const toastContainer = el("toastContainer");
  const invEl = el("inv");
  const depthVal = el("depthVal");
  const hpVal = el("hpVal");
  const hpBar = el("hpBar");
  const lvlVal = el("lvlVal");
  const xpVal = el("xpVal");
  const xpBar = el("xpBar");
  const chaVal = el("chaVal");
  const chaBar = el("chaBar");
  const seedVal = el("seedVal");
  const pointsVal = el("pointsVal");
  const heroEmoji = el("heroEmoji");
  const heroName  = el("heroName");
  const heroArchetype = el("heroArchetype");
  const compassEl = el("compassEl");
  const newGameBtn = el("newGameBtn");
  const helpBtn = el("helpBtn");
  const scoresBtn = el("scoresBtn");
  const gameOverModal = el("gameOverModal");
  const gameOverMsg = el("gameOverMsg");
  const restartBtnSim = el("restartBtnSim");
  const restartBtnNao = el("restartBtnNao");
  const scoresModal = el("scoresModal");
  const closeScoresBtn = el("closeScoresBtn");
  const helpModal = el("helpModal");
  const closeHelpBtn = el("closeHelpBtn");
  const startModal = el("startModal");
  const playerNameInput = el("playerNameInput");
  const startBtn = el("startBtn");
  const scoresEl = el("scores");
  const archetypeGrid = el("archetypeGrid");
  const muteBtn = el("muteBtn");
  const continueBtn = el("continueBtn");
  const continueSection = el("continueSection");

  const cells = [];
  for (let i = 0; i < VIEW_W * VIEW_H; i++) {
    const c = document.createElement("div");
    c.className = "cell tileFloor";
    cells.push(c);
    gridEl.appendChild(c);
  }
  gridEl.tabIndex = 0;
  gridEl.addEventListener("click", () => gridEl.focus());

  function pushLog(text, kind = "info") {
    const msg = document.createElement("div");
    msg.className = `toastMsg ${kind}`;
    msg.innerHTML = text
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll(/\*\*(.+?)\*\*/g, `<span class="${kind === "bad" ? "bad" : kind === "good" ? "good" : "tag"}">$1</span>`);
    
    // Icon based on kind
    const icon = kind === "good" ? "✓ " : kind === "bad" ? "⚠ " : "";
    msg.innerHTML = icon + msg.innerHTML;

    toastContainer.appendChild(msg);

    // Keep max 3 toasts at a time
    while (toastContainer.childNodes.length > 3) {
      toastContainer.removeChild(toastContainer.firstChild);
    }

    setTimeout(() => {
      if (msg.parentNode) {
        msg.classList.add("fadeOut");
        setTimeout(() => {
          if (msg.parentNode) msg.parentNode.removeChild(msg);
        }, 500); // Wait for fadeOut animation
      }
    }, 3000); // Visible for 3 seconds
  }

  function cellForTile(t) {
    if (t === Tile.Wall) return "tileWall";
    if (t === Tile.Floor) return "tileFloor";
    if (t === Tile.Up) return "tileStairsUp";
    if (t === Tile.Down) return "tileStairsDown";
    if (t === Tile.Corpse) return "tileCorpse";
    if (t === Tile.DoorClosed) return "tileDoorClosed";
    if (t === Tile.DoorOpen) return "tileDoorOpen";
    if (t === Tile.DoorLocked) return "tileDoorLocked";
    return "tileFloor";
  }

  /** @type {{seed:number,playerName:string,archetype:string,depth:number,hp:number,maxHp:number,pos:Pos,levels:Map<number,Level>,alive:boolean,xp:number,lvl:number,armor:number,charisma:number,atk:[number,number],inv:{id:string,typeId:string,name:string}[],points:number}} */
  let state;

  // ── Persistência ─────────────────────────────────────────────────────────────

  function saveGame() {
    if (!state?.alive) return;
    try {
      const s = {
        ...state,
        levels: [...state.levels.entries()].map(([d, l]) => [d, { ...l, explored: [...l.explored] }]),
      };
      localStorage.setItem("deepcrawler_save", JSON.stringify(s));
    } catch (e) {}
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem("deepcrawler_save");
      if (!raw) return false;
      const s = JSON.parse(raw);
      s.levels = new Map(s.levels.map(([d, l]) => [d, { ...l, explored: new Uint8Array(l.explored) }]));
      state = s;
      state.weaponName = state.weaponName || "Mãos";
      state.weaponUpgrades = state.weaponUpgrades || 0;
      selectedArchIdx = PLAYER_ARCHETYPES.findIndex(a => a.name === state.archetype);
      if (selectedArchIdx < 0) selectedArchIdx = 0;
      combatRng = mulberry32((state.seed ^ state.points) >>> 0);
      return true;
    } catch (e) { return false; }
  }

  function hasSave() { return !!localStorage.getItem("deepcrawler_save"); }
  function clearSave() { localStorage.removeItem("deepcrawler_save"); }

  // ── Pontuações ───────────────────────────────────────────────────────────────

  async function getScores() {
    if (SUPABASE_URL === "SUA_SUPABASE_URL_AQUI") {
      try { return JSON.parse(localStorage.getItem("deepcrawler_scores") || "[]"); }
      catch { return []; }
    }
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/scores?select=*&order=points.desc&limit=10`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      });
      if (!res.ok) throw new Error("Erro de rede ao ler Supabase.");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async function saveScore() {
    const scoreData = {
      name: state.playerName || "Anónimo",
      archetype: state.archetype,
      points: state.points,
      depth: state.depth,
      lvl: state.lvl,
      date: new Date().toLocaleDateString("pt-PT"),
    };

    if (SUPABASE_URL === "SUA_SUPABASE_URL_AQUI") {
      const scores = await getScores();
      scores.push(scoreData);
      scores.sort((a, b) => b.points - a.points);
      localStorage.setItem("deepcrawler_scores", JSON.stringify(scores.slice(0, 10)));
      return;
    }

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(scoreData)
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function renderScores() {
    scoresEl.innerHTML = "<p class='muted scoresEmpty'>A carregar pontuações...</p>";
    const scores = await getScores();
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
      const safeName = (s.name || "?").replaceAll("&", "&amp;").replaceAll("<", "&lt;");
      const arch = s.archetype ? ` <span class="scoreArch">${s.archetype}</span>` : "";
      row.innerHTML = `<span class="scoreRank">${i + 1}</span><span class="scoreName">${safeName}${arch}</span><span class="scoreDepth">Piso ${s.depth}</span><span class="scoreLvl">Nív.&nbsp;${s.lvl}</span><span class="scorePoints">${s.points}&nbsp;pts</span><span class="scoreDate">${s.date}</span>`;
      scoresEl.appendChild(row);
    });
  }

  // ── Modal ────────────────────────────────────────────────────────────────────

  let selectedArchIdx = 0;

  const ARCH_META = [
    { color: "#38bdf8", tagline: "Tanque resistente e confiável", img: "arquetipos/guerreiro.png" },
    { color: "#f59e0b", tagline: "Ágil, furtivo, esquiva elevada", img: "arquetipos/ladrao.png" },
    { color: "#a78bfa", tagline: "Frágil mas com dano explosivo", img: "arquetipos/mago.png" },
    { color: "#34d399", tagline: "Proteção e equilíbrio total", img: "arquetipos/paladino.png" },
    { color: "#ef4444", tagline: "Força bruta sem recuo", img: "arquetipos/barbaro.png" },
    { color: "#fbbf24", tagline: "Perdido, confuso mas sortudo!", img: "arquetipos/turista.png" },
  ];

  function archStatBar(val, max, color) {
    return Array.from({ length: 5 }, (_, i) => {
      const on = i < Math.round((val / max) * 5);
      return `<span class="archDot${on ? " on" : ""}"${on ? ` style="background:${color}"` : ""}></span>`;
    }).join("");
  }

  function buildArchetypePicker() {
    archetypeGrid.innerHTML = "";
    PLAYER_ARCHETYPES.forEach((arch, i) => {
      const meta = ARCH_META[i];
      const isSelected = i === selectedArchIdx;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "archCard" + (isSelected ? " archSelected" : "");
      card.style.setProperty("--arch-color", meta.color);
      const atkAvg = (arch.atk[0] + arch.atk[1]) / 2;
      card.innerHTML = `
        <div class="archPortraitWrap">
          <img class="archPortrait" src="${meta.img}" alt="${arch.name}" loading="lazy" />
          <div class="archPortraitGlow" style="background:radial-gradient(ellipse at bottom, ${meta.color}55 0%, transparent 70%)"></div>
        </div>
        <div class="archCardBody">
          <div class="archName" style="color:${meta.color}">${arch.name}</div>
          <div class="archTagline">${meta.tagline}</div>
          <div class="archStatList">
            <div class="archStat"><span class="archStatLbl">HP</span><div class="archBarWrap">${archStatBar(arch.maxHp, 16, meta.color)}</div><span class="archStatNum">${arch.maxHp}</span></div>
            <div class="archStat"><span class="archStatLbl">ATK</span><div class="archBarWrap">${archStatBar(atkAvg, 4.5, meta.color)}</div><span class="archStatNum">${arch.atk[0]}-${arch.atk[1]}</span></div>
            <div class="archStat"><span class="archStatLbl">ARM</span><div class="archBarWrap">${archStatBar(arch.armor, 1, meta.color)}</div><span class="archStatNum">${arch.armor}</span></div>
            <div class="archStat"><span class="archStatLbl">CAR</span><div class="archBarWrap">${archStatBar(arch.charisma, 3, meta.color)}</div><span class="archStatNum">${arch.charisma}</span></div>
          </div>
        </div>
        ${isSelected ? `<div class="archCheckmark" style="color:${meta.color}">✓</div>` : ""}
      `;
      card.addEventListener("click", () => { selectedArchIdx = i; buildArchetypePicker(); });
      archetypeGrid.appendChild(card);
    });
  }

  function showModal() {
    startModal.removeAttribute("hidden");
    playerNameInput.value = "";
    buildArchetypePicker();
    continueSection.hidden = !hasSave();
    setTimeout(() => playerNameInput.focus(), 50);
  }

  function hideModal() { startModal.setAttribute("hidden", ""); }

  function startFromModal() {
    const name = playerNameInput.value.trim() || "Anónimo";
    hideModal();
    newGame((Math.random() * 2 ** 32) >>> 0, name, selectedArchIdx);
  }

  startBtn.addEventListener("click", startFromModal);
  playerNameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); startFromModal(); }
    if (e.key === "Escape" && state) { hideModal(); gridEl.focus(); }
  });

  // ── Jogo ─────────────────────────────────────────────────────────────────────

  function newGame(seed = (Math.random() * 2 ** 32) >>> 0, playerName = "Anónimo", archIdx = selectedArchIdx) {
    combatRng = mulberry32(seed ^ 0xDEADBEEF);
    const arch = PLAYER_ARCHETYPES[archIdx] ?? PLAYER_ARCHETYPES[0];

    state = {
      seed, playerName, archetype: arch.name,
      depth: 1, hp: arch.maxHp, maxHp: arch.maxHp,
      pos: { x: 10, y: 10 }, levels: new Map(),
      alive: true, xp: 0, lvl: 1,
      armor: arch.armor, charisma: arch.charisma,
      atk: [...arch.atk], inv: new Array(9).fill(null), points: 0,
      weaponName: "Mãos", weaponUpgrades: 0,
    };

    const lvl = getLevel(1);
    state.pos = { ...lvl.playerStart };
    pushLog(`Nova partida — **${playerName}** [${arch.name}]. Seed **${seed}**.`, "good");
    pushLog(`HP ${arch.maxHp} · ATK ${arch.atk[0]}-${arch.atk[1]} · Armadura ${arch.armor} · Carisma ${arch.charisma}`, "info");
    render();
    gridEl.focus();
  }

  function getLevel(depth) {
    let lvl = state.levels.get(depth);
    if (!lvl) { lvl = generateLevel(depth, state.seed); state.levels.set(depth, lvl); }
    return lvl;
  }

  function enemyAt(level, x, y) {
    return level.enemies.find(e => e.hp > 0 && e.pos.x === x && e.pos.y === y) || null;
  }

  function isBlocked(level, x, y) {
    if (!inBounds(x, y)) return true;
    return isBlockingTile(level.tiles[idx(x, y)]);
  }

  function dealDamageToEnemy(enemy, amount) {
    enemy.hp -= amount;
    showFloat(enemy.pos.x, enemy.pos.y, `-${amount}`, "floatDmg");
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      sfx.kill();
      pushLog(`Derrotaste ${enemy.article === "a" ? "a" : "o"} **${enemy.name}**.`, "good");
    } else {
      sfx.attack();
      pushLog(`Acertaste n${enemy.article === "a" ? "a" : "o"} **${enemy.name}** em **${amount}**.`, "info");
    }
  }

  function dealDamageToPlayer(amount, sourceEnemy) {
    const sourceName = sourceEnemy.name;
    const art = sourceEnemy.article || "o";
    const Art = art.toUpperCase();
    const mitigated = Math.max(1, amount - state.armor);
    state.hp -= mitigated;
    showFloat(state.pos.x, state.pos.y, `-${mitigated}`, "floatHit");
    if (state.hp <= 0) {
      state.hp = 0; state.alive = false;
      sfx.death();
      clearSave();
      saveScore();
      pushLog(`Foste morto por um${art === "a" ? "a" : ""} **${sourceName}**. Fim de jogo.`, "bad");
      pushLog(`Pontuação final: **${state.points}** pts (piso ${state.depth}, nível ${state.lvl}).`, "bad");
      pushLog("Clica em **Novo jogo** para tentar novamente.", "bad");
      gameOverMsg.innerHTML = `<b>${state.playerName}</b>, ${state.archetype} de nível ${state.lvl}, foi morto por um${art === "a" ? "a" : ""} <b>${sourceName}</b> no piso ${state.depth}.<br><br>Pontuação final: <b>${state.points}</b> pts`;
      gameOverModal.removeAttribute("hidden");
    } else {
      sfx.hit();
      if (state.armor > 0 && mitigated !== amount)
        pushLog(`${Art} **${sourceName}** acerta-te em **${mitigated}** (armadura bloqueou **${amount - mitigated}**).`, "bad");
      else
        pushLog(`${Art} **${sourceName}** acerta-te em **${mitigated}**.`, "bad");
    }
  }

  function xpToNext(lvl) { return 8 + (lvl - 1) * 6; }

  function grantXp(amount) {
    state.xp += amount;
    showFloat(state.pos.x, state.pos.y, `+${amount} xp`, "floatXp");
    pushLog(`Ganhaste **${amount}** XP.`, "good");
    while (state.xp >= xpToNext(state.lvl)) {
      state.xp -= xpToNext(state.lvl);
      state.lvl += 1; state.maxHp += 2;
      state.hp = Math.min(state.maxHp, state.hp + 2);
      state.atk = [state.atk[0] + 1, state.atk[1] + 1];
      state.points += 50;
      sfx.levelUp();
      pushLog(`Subiste de nível! Agora és nível **${state.lvl}** (+50 pontos).`, "good");
    }
  }

  function playerTryMove(dx, dy) {
    if (!state.alive) return false;
    const lvl = getLevel(state.depth);
    const nx = state.pos.x + dx, ny = state.pos.y + dy;
    if (!inBounds(nx, ny)) return false;

    const targetEnemy = enemyAt(lvl, nx, ny);
    if (targetEnemy) {
      const dmg = roll(combatRng, state.atk[0], state.atk[1]);
      dealDamageToEnemy(targetEnemy, dmg);
      if (targetEnemy.hp <= 0) {
        grantXp(2 + Math.floor(targetEnemy.maxHp / 2));
        const pts = (targetEnemy.va * 10) + (state.depth * 2);
        state.points += pts;
        pushLog(`Recebeste **${pts}** pontos extra.`, "good");
      }
      return true;
    }

    const t = lvl.tiles[idx(nx, ny)];
    if (t === Tile.DoorClosed) {
      lvl.tiles[idx(nx, ny)] = Tile.DoorOpen;
      state.points += 1;
      sfx.door();
      pushLog("Abriste uma porta (+1 ponto).", "info");
      return true;
    }
    if (t === Tile.DoorLocked) {
      const keyIdx = state.inv.findIndex(it => it && it.typeId === "key");
      if (keyIdx !== -1) {
        state.inv[keyIdx] = null;
        lvl.tiles[idx(nx, ny)] = Tile.DoorOpen;
        state.points += 5;
        sfx.door();
        pushLog("Destrancaste a porta com uma Chave (+5 pontos).", "good");
        renderInventory();
        return true;
      } else {
        beep(120, 0.08, "square", 0.15);
        pushLog("A porta está trancada. Precisas de uma Chave.", "bad");
        return false;
      }
    }
    if (!isWalkableTile(t)) return false;

    state.pos = { x: nx, y: ny };

    const it = lvl.items.find(ii => ii.pos.x === nx && ii.pos.y === ny) || null;
    if (it) {
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
    }

    if (t === Tile.Down) { goDepth(state.depth + 1, "down"); return true; }
    if (t === Tile.Up) { goDepth(Math.max(1, state.depth - 1), "up"); return true; }
    return true;
  }

  function goDepth(newDepth, dir) {
    if (newDepth === state.depth) return;
    state.depth = newDepth;
    const lvl = getLevel(newDepth);
    state.pos = dir === "down" ? { ...lvl.up } : { ...lvl.down };
    sfx.stairs();
    if (dir === "down") { state.points += 25; pushLog(`Desceste para o piso **${newDepth}** (+25 pontos).`, "info"); }
    else { pushLog(`Subiste para o piso **${newDepth}**.`, "info"); }
  }

  function playerWait() {
    if (!state.alive) return false;
    pushLog("Esperaste um turno.", "info");
    return true;
  }


  // ── Efeitos aleatórios ────────────────────────────────────────────────────

  // Poções — sempre afetam HP (80% positivas, 20% negativas)
  const POTION_POOL = [
    "heal_sm","heal_sm","heal_sm","heal_sm",  // 40%
    "heal_lg","heal_lg","heal_lg",             // 30%
    "heal_full",                               // 10%
    "curse","curse",                           // 20%
  ];
  // Pergaminhos — qualquer stat (90% positivos)
  const SCROLL_POOL = [
    "xp_sm","xp_sm",
    "xp_lg",
    "reveal_map",
    "kill_room",
    "carisma",
    "armor",
    "points_sm",
    "heal_lg",
    "curse",
  ];
  // Amuletos — magia de aura/proteção (90% positivos)
  const CHARM_POOL = [
    "carisma","carisma","carisma",
    "armor","armor",
    "xp_sm",
    "reveal_map",
    "teleport",
    "points_sm",
    "curse",
  ];

  function killRoom(lvl) {
    const visited = new Set();
    const queue = [idx(state.pos.x, state.pos.y)];
    while (queue.length && visited.size < 120) {
      const ci = queue.shift();
      if (visited.has(ci)) continue;
      visited.add(ci);
      const cx = ci % LEVEL_W, cy = (ci / LEVEL_W) | 0;
      for (const n of neighbors4({ x: cx, y: cy })) {
        if (inBounds(n.x, n.y) && !visited.has(idx(n.x, n.y)) && !isBlockingTile(lvl.tiles[idx(n.x, n.y)]))
          queue.push(idx(n.x, n.y));
      }
    }
    let killed = 0;
    for (const e of lvl.enemies) {
      if (e.hp > 0 && visited.has(idx(e.pos.x, e.pos.y))) { e.hp = 0; killed++; }
    }
    return killed;
  }

  function teleportPlayer(lvl) {
    const floors = [];
    for (let i = 0; i < lvl.tiles.length; i++)
      if (isWalkableTile(lvl.tiles[i])) floors.push(i);
    if (!floors.length) return;
    const ti = choose(combatRng, floors);
    state.pos = { x: ti % LEVEL_W, y: (ti / LEVEL_W) | 0 };
  }

  function applyRandomEffect(pool) {
    const effectId = choose(combatRng, pool);
    const lvl = getLevel(state.depth);
    switch (effectId) {
      case "heal_sm": {
        const h = Math.min(state.maxHp - state.hp, roll(combatRng, 3, 6));
        state.hp += h; state.points += 5; sfx.pickup();
        showFloat(state.pos.x, state.pos.y, `+${h} HP`, "floatHeal");
        pushLog(h > 0 ? `Curaste **${h}** HP (+5 pontos).` : "Já tens HP máximo.", h > 0 ? "good" : "info");
        break;
      }
      case "heal_lg": {
        const h = Math.min(state.maxHp - state.hp, roll(combatRng, 7, 12));
        state.hp += h; state.points += 10; sfx.pickup();
        showFloat(state.pos.x, state.pos.y, `+${h} HP`, "floatHeal");
        pushLog(h > 0 ? `Cura poderosa! **+${h}** HP (+10 pontos).` : "Já tens HP máximo.", h > 0 ? "good" : "info");
        break;
      }
      case "heal_full": {
        const h = state.maxHp - state.hp;
        state.hp = state.maxHp; state.points += 20; sfx.pickup();
        showFloat(state.pos.x, state.pos.y, `+${h} HP`, "floatHeal");
        pushLog(h > 0 ? `Elixir raro! HP completamente restaurado (**+${h}**, +20 pontos).` : "Já tens HP máximo.", h > 0 ? "good" : "info");
        break;
      }
      case "xp_sm": {
        const xp = roll(combatRng, 5, 15);
        grantXp(xp); state.points += 5;
        break;
      }
      case "xp_lg": {
        const xp = roll(combatRng, 20, 40);
        grantXp(xp); state.points += 10;
        break;
      }
      case "armor": {
        if (state.armor >= ARMOR_MAX) {
          pushLog("Armadura já ao máximo! Energia desperdiçada.", "info");
        } else {
          state.armor += 1; state.points += 15; sfx.pickup();
          pushLog(`Armadura reforçada! +**1** armadura [${state.armor}/${ARMOR_MAX}] (+15 pontos).`, "good");
        }
        break;
      }
      case "carisma": {
        state.charisma += 1; state.points += 10; sfx.pickup();
        pushLog(`Carisma aumentou! +**1** (${state.charisma * 10}% esquiva, +10 pontos).`, "good");
        break;
      }
      case "reveal_map": {
        lvl.explored.fill(1); state.points += 20; sfx.pickup();
        pushLog("O mapa revelou os seus segredos! (+20 pontos).", "good");
        break;
      }
      case "kill_room": {
        const killed = killRoom(lvl);
        state.points += killed * 10; sfx.pickup();
        pushLog(killed > 0 ? `Poder destrutivo! **${killed}** inimigos eliminados (+${killed * 10} pontos).` : "A sala estava vazia.", killed > 0 ? "good" : "info");
        break;
      }
      case "teleport": {
        teleportPlayer(lvl); sfx.stairs();
        pushLog("Foste teleportado para um local desconhecido!", "info");
        break;
      }
      case "points_sm": {
        const pts = roll(combatRng, 25, 75);
        state.points += pts; sfx.pickup();
        showFloat(state.pos.x, state.pos.y, `+${pts} pts`, "floatHeal");
        pushLog(`Fortuna! **+${pts}** pontos.`, "good");
        break;
      }
      case "curse": {
        const dmg = roll(combatRng, 2, 8);
        state.hp = Math.max(1, state.hp - dmg);
        pushLog(`Estava amaldiçoado! -**${dmg}** HP.`, "bad");
        break;
      }
    }
  }

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
  function itemUse(slotIdx) {
    if (!state.alive) return false;
    const item = state.inv[slotIdx];
    if (!item) return false;

    if (item.typeId === "potion") {
      applyRandomEffect(POTION_POOL);
    } else if (item.typeId === "armor") {
      if (state.armor >= ARMOR_MAX) {
        pushLog(`A armadura já está ao máximo (**${ARMOR_MAX}**). Guarda para mais tarde.`, "info");
        return false;
      }
      state.armor += 1; state.points += 15;
      sfx.pickup();
      pushLog(`Equipaste armadura (+**1** armadura, +15 pontos). [${state.armor}/${ARMOR_MAX}]`, "good");
    } else if (item.typeId === "charm") {
      applyRandomEffect(CHARM_POOL);
    } else if (item.typeId === "sword") {
      state.atk[0] += 1; state.atk[1] += 1; state.points += 20;
      state.weaponUpgrades = (state.weaponUpgrades || 0) + 1;
      const wnames = ["Mãos", "Espada", "Espada Afiada", "Espada de Batalha", "Espada Lendária"];
      state.weaponName = wnames[Math.min(state.weaponUpgrades, wnames.length - 1)];
      sfx.pickup();
      showFloat(state.pos.x, state.pos.y, `ATK+1`, "floatHeal");
      pushLog(`Equipaste **${state.weaponName}** (ATK **+1/+1**, +20 pontos). [${state.atk[0]}–${state.atk[1]}]`, "good");
    } else if (item.typeId === "scroll") {
      applyRandomEffect(SCROLL_POOL);
    } else { return false; }

    state.inv[slotIdx] = null;
    return true;
  }

  function itemUseFirst(typeId) {
    const slot = state.inv.findIndex(it => it?.typeId === typeId);
    if (slot === -1) {
      pushLog(`Não tens ${typeId === "scroll" ? "nenhum Pergaminho" : "nenhuma Poção"} no inventário.`, "info");
      return false;
    }
    return itemUse(slot);
  }

  function blocksSight(t) { return t === Tile.Wall || t === Tile.DoorClosed || t === Tile.DoorLocked; }

  function bresenhamLine(a, b) {
    const pts = [];
    let x0 = a.x, y0 = a.y;
    const dx = Math.abs(b.x - x0), dy = -Math.abs(b.y - y0);
    const sx = x0 < b.x ? 1 : -1, sy = y0 < b.y ? 1 : -1;
    let err = dx + dy;
    while (true) {
      pts.push({ x: x0, y: y0 });
      if (x0 === b.x && y0 === b.y) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return pts;
  }

  function computeFov(level, origin, radius) {
    const visible = new Uint8Array(LEVEL_W * LEVEL_H);
    const r2 = radius * radius;
    for (let y = origin.y - radius; y <= origin.y + radius; y++) {
      for (let x = origin.x - radius; x <= origin.x + radius; x++) {
        if (!inBounds(x, y)) continue;
        const dx = x - origin.x, dy = y - origin.y;
        if (dx * dx + dy * dy > r2) continue;
        const line = bresenhamLine(origin, { x, y });
        for (let i = 0; i < line.length; i++) {
          const p = line[i], ii = idx(p.x, p.y);
          visible[ii] = 1; level.explored[ii] = 1;
          if (i < line.length - 1 && blocksSight(level.tiles[ii])) break;
        }
      }
    }
    return visible;
  }

  function bfsNextStep(level, from, to, blocked) {
    const startI = idx(from.x, from.y), goalI = idx(to.x, to.y);
    const prev = new Int32Array(LEVEL_W * LEVEL_H).fill(-1);
    const q = new Int32Array(LEVEL_W * LEVEL_H);
    let qh = 0, qt = 0;
    q[qt++] = startI; prev[startI] = startI;
    while (qh < qt) {
      const curI = q[qh++];
      if (curI === goalI) break;
      const cx = curI % LEVEL_W, cy = (curI / LEVEL_W) | 0;
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        if (!inBounds(nx, ny)) continue;
        const ni = idx(nx, ny);
        if (prev[ni] !== -1 || blocked(nx, ny)) continue;
        prev[ni] = curI; q[qt++] = ni;
      }
    }
    if (prev[goalI] === -1) return null;
    let cur = goalI, p = prev[cur];
    while (p !== startI && p !== cur) { cur = p; p = prev[cur]; }
    return { x: cur % LEVEL_W, y: (cur / LEVEL_W) | 0 };
  }

  function enemiesTurn() {
    const lvl = getLevel(state.depth);
    if (!state.alive) return;

    const occ = new Set();
    for (const e of lvl.enemies) { if (e.hp > 0) occ.add(idx(e.pos.x, e.pos.y)); }

    const blockedForEnemy = (x, y) => {
      if (isBlocked(lvl, x, y)) return true;
      if (x === state.pos.x && y === state.pos.y) return false;
      return occ.has(idx(x, y));
    };

    const hasLos = (a, b) => {
      const line = bresenhamLine(a, b);
      for (let i = 1; i < line.length - 1; i++) {
        if (blocksSight(lvl.tiles[idx(line[i].x, line[i].y)])) return false;
      }
      return true;
    };

    const tryAttack = (e, bonus = 0) => {
      if (state.charisma > 0 && combatRng() < state.charisma * 0.10) {
        sfx.dodge();
        pushLog(`Esquivaste-te do ataque d${e.article} **${e.name}**! (Carisma)`, "good");
        return;
      }
      dealDamageToPlayer(roll(combatRng, e.atk[0], e.atk[1]) + bonus, e);
    };

    const moveTowards = (e, target) => {
      const next = bfsNextStep(lvl, e.pos, target, blockedForEnemy);
      if (next) { occ.delete(idx(e.pos.x, e.pos.y)); e.pos = next; occ.add(idx(e.pos.x, e.pos.y)); }
    };

    const moveAway = (e, target) => {
      const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
      const best = dirs
        .map(d => { const nx = e.pos.x + d.x, ny = e.pos.y + d.y; return blockedForEnemy(nx, ny) ? null : { pos: { x: nx, y: ny }, dist: manhattan({ x: nx, y: ny }, target) }; })
        .filter(Boolean).sort((a, b) => b.dist - a.dist);
      if (best.length) { occ.delete(idx(e.pos.x, e.pos.y)); e.pos = best[0].pos; occ.add(idx(e.pos.x, e.pos.y)); }
    };

    const wander = (e) => {
      const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
      const d = choose(combatRng, dirs);
      const nx = e.pos.x + d.x, ny = e.pos.y + d.y;
      const nt = lvl.tiles[idx(nx, ny)];
      if (!blockedForEnemy(nx, ny) && nt !== Tile.Up && nt !== Tile.Down) {
        occ.delete(idx(e.pos.x, e.pos.y)); e.pos = { x: nx, y: ny }; occ.add(idx(e.pos.x, e.pos.y));
      }
    };

    for (const e of lvl.enemies) {
      if (e.hp <= 0 || !state.alive) continue;
      const dist = manhattan(e.pos, state.pos);

      // IMÓVEL — nunca se move, só ataca se adjacente
      if (BEHAVIORS.static.has(e.typeId)) {
        if (dist === 1) tryAttack(e);
        continue;
      }

      // COVARDE — foge quando HP < 50%; defende-se se encurralado
      if (BEHAVIORS.timid.has(e.typeId) && e.hp < e.maxHp * 0.5) {
        if (dist === 1) tryAttack(e);
        else moveAway(e, state.pos);
        continue;
      }

      // ALCANCE — ataca à dist ≤ 3 com LoS, recua se o jogador estiver perto de mais
      if (BEHAVIORS.ranged.has(e.typeId)) {
        const inRange = dist <= 3 && hasLos(e.pos, state.pos);
        if (inRange) {
          tryAttack(e);
          if (dist <= 2) moveAway(e, state.pos);
        } else {
          moveTowards(e, state.pos);
        }
        continue;
      }

      // ALCATEIA — bónus de ATK por aliados adjacentes (máx +3)
      if (BEHAVIORS.pack.has(e.typeId)) {
        if (dist === 1) {
          const allies = lvl.enemies.filter(o => o.id !== e.id && o.hp > 0 && manhattan(o.pos, e.pos) === 1).length;
          const bonus = Math.min(3, allies);
          if (bonus > 0) pushLog(`**${e.name}** ataca em grupo! (+${bonus} ATK)`, "bad");
          tryAttack(e, bonus);
        } else if (dist <= 8) {
          moveTowards(e, state.pos);
        } else {
          wander(e);
        }
        continue;
      }

      // BERSERKER — persegue sempre sem limite de distância
      // DEFAULT — persegue até dist 8, depois vagueia
      if (dist === 1) { tryAttack(e); continue; }
      const chaseRange = BEHAVIORS.berserker.has(e.typeId) ? Infinity : 8;
      if (dist <= chaseRange) moveTowards(e, state.pos);
      else wander(e);
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
    const potions = state.inv.filter(it => it?.typeId === "potion").length;
    const scrolls = state.inv.filter(it => it?.typeId === "scroll").length;
    const keys    = state.inv.filter(it => it?.typeId === "key").length;

    const pips = (filled, total, iconCls) => {
      const wrap = document.createElement("div"); wrap.className = "invPips";
      for (let i = 0; i < total; i++) {
        const p = document.createElement("div");
        p.className = `invPip ${iconCls}${i < filled ? " on" : ""}`;
        wrap.appendChild(p);
      }
      return wrap;
    };

    const row = (iconCls, label, content, clickFn) => {
      const div  = document.createElement("div"); div.className = "invCat";
      const icon = document.createElement("div"); icon.className = `invCatIcon ${iconCls}`;
      const lbl  = document.createElement("span"); lbl.className = "invCatLabel"; lbl.textContent = label;
      const val  = document.createElement("span"); val.className = "invCatValue";
      typeof content === "string" ? (val.textContent = content) : val.appendChild(content);
      div.appendChild(icon); div.appendChild(lbl); div.appendChild(val);
      if (clickFn) { div.style.cursor = "pointer"; div.addEventListener("click", clickFn); }
      invEl.appendChild(div);
    };

    row("tileItemSword",  "Arma",       `${state.weaponName || "Mãos"}  [${state.atk[0]}–${state.atk[1]}]`);
    row("tileItemArmor",  "Armadura",   pips(state.armor, ARMOR_MAX, "tileItemArmor"));
    row("tileItemCharm",  "Carisma",    pips(Math.min(state.charisma, 5), 5, "tileItemCharm"));
    row("tileItemPotion", "Poções",     potions ? String(potions) : "—",
        potions ? () => { if (state?.alive) { const a = itemUseFirst("potion"); if (a) doTurn(true); } } : null);
    row("tileItemScroll", "Pergaminhos", scrolls ? String(scrolls) : "—",
        scrolls ? () => { if (state?.alive) { const a = itemUseFirst("scroll"); if (a) doTurn(true); } } : null);
    row("tileItemKey",    "Chaves",     keys    ? String(keys)    : "—");
  }

  let viewOriginX = 0, viewOriginY = 0;

  function renderCompass(lvl) {
    if (!lvl?.down) { compassEl.innerHTML = ""; return; }
    const dx = lvl.down.x - state.pos.x, dy = lvl.down.y - state.pos.y;
    const dist = Math.abs(dx) + Math.abs(dy);
    const angle = dist === 0 ? 0 : (Math.atan2(dy, dx) * 180 / Math.PI + 90);
    const distLabel = dist === 0
      ? `<text x="30" y="30" text-anchor="middle" dominant-baseline="central" fill="rgba(52,211,153,.8)" font-size="10" font-family="system-ui,sans-serif">!</text>`
      : `<text x="30" y="42" text-anchor="middle" dominant-baseline="central" fill="rgba(148,163,184,.45)" font-size="6.5" font-family="system-ui,sans-serif">${dist}</text>`;
    compassEl.innerHTML = `<svg viewBox="0 0 60 60" width="60" height="60" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="28" fill="rgba(15,23,42,.85)" stroke="rgba(255,255,255,.14)" stroke-width="1"/>
      <text x="30" y="10" text-anchor="middle" dominant-baseline="central" fill="rgba(52,211,153,.9)" font-size="9" font-weight="700" font-family="system-ui,sans-serif">N</text>
      <text x="30" y="50" text-anchor="middle" dominant-baseline="central" fill="rgba(148,163,184,.45)" font-size="8" font-family="system-ui,sans-serif">S</text>
      <text x="50" y="30" text-anchor="middle" dominant-baseline="central" fill="rgba(148,163,184,.45)" font-size="8" font-family="system-ui,sans-serif">E</text>
      <text x="10" y="30" text-anchor="middle" dominant-baseline="central" fill="rgba(148,163,184,.45)" font-size="8" font-family="system-ui,sans-serif">O</text>
      <g transform="rotate(${angle.toFixed(1)}, 30, 30)">
        <polygon points="30,13 27,28 33,28" fill="#34d399" opacity="0.92"/>
        <rect x="28.5" y="32" width="3" height="13" rx="1.5" fill="rgba(148,163,184,.32)"/>
      </g>
      <circle cx="30" cy="30" r="2.8" fill="rgba(226,232,240,.75)" stroke="rgba(0,0,0,.5)" stroke-width="0.8"/>
      ${distLabel}
    </svg>`;
  }

  function showFloat(wx, wy, text, cssClass) {
    const vx = wx - viewOriginX, vy = wy - viewOriginY;
    if (vx < 0 || vx >= VIEW_W || vy < 0 || vy >= VIEW_H) return;
    const span = document.createElement("span");
    span.className = "floatNum " + cssClass;
    span.textContent = text;
    span.style.left = (14 + vx * 27 + 12) + "px";
    span.style.top = (14 + vy * 27) + "px";
    gridEl.appendChild(span);
    span.addEventListener("animationend", () => span.remove(), { once: true });
  }

  function render() {
    const lvl = getLevel(state.depth);
    const archIdx = PLAYER_ARCHETYPES.findIndex(a => a.name === state.archetype);
    const arch = archIdx >= 0 ? PLAYER_ARCHETYPES[archIdx] : PLAYER_ARCHETYPES[0];
    const meta = ARCH_META[Math.max(0, archIdx)];

    // Hero badge — portrait image with archetype colour tint
    heroEmoji.style.background = meta.color + "28";
    heroEmoji.style.borderColor = meta.color + "88";
    heroEmoji.innerHTML = `<img src="${meta.img}" alt="${arch.name}">`;
    heroName.textContent  = state.playerName;
    heroArchetype.textContent = state.archetype;

    depthVal.textContent  = String(state.depth);
    lvlVal.textContent    = String(state.lvl);
    seedVal.textContent   = String(state.seed >>> 0);
    pointsVal.textContent = String(state.points);

    // HP bar (green → yellow → red)
    hpVal.textContent = `${state.hp}/${state.maxHp}`;
    const hpPct = Math.max(0, Math.min(100, (state.hp / state.maxHp) * 100));
    hpBar.style.width = hpPct + "%";
    hpBar.style.background = hpPct < 30 ? "#ef4444" : hpPct < 60 ? "#f59e0b" : "#34d399";

    // XP bar (accent)
    xpVal.textContent = `${state.xp}/${xpToNext(state.lvl)}`;
    const xpPct = Math.max(0, Math.min(100, (state.xp / xpToNext(state.lvl)) * 100));
    xpBar.style.width = xpPct + "%";
    xpBar.style.background = "#a78bfa";

    // Carisma bar (amber, capped at 10)
    chaVal.textContent = String(state.charisma);
    const chaPct = Math.max(0, Math.min(100, (state.charisma / 10) * 100));
    chaBar.style.width = chaPct + "%";
    chaBar.style.background = "#f59e0b";

    renderCompass(lvl);

    const visible = computeFov(lvl, state.pos, 8);

    let startX = state.pos.x - Math.floor(VIEW_W / 2);
    let startY = state.pos.y - Math.floor(VIEW_H / 2);

    startX = clamp(startX, 0, LEVEL_W - VIEW_W);
    startY = clamp(startY, 0, LEVEL_H - VIEW_H);
    viewOriginX = startX;
    viewOriginY = startY;

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
        cells[vi].className = `cell ${e.cssClass} tileEnemy-${e.typeId}`;
        cells[vi].textContent = "";
      }
    }

    if (state.pos.x >= startX && state.pos.x < startX + VIEW_W && state.pos.y >= startY && state.pos.y < startY + VIEW_H) {
      const vi = (state.pos.y - startY) * VIEW_W + (state.pos.x - startX);
      cells[vi].className = "cell tilePlayer";
      const arch = PLAYER_ARCHETYPES.find(a => a.name === state.archetype) || PLAYER_ARCHETYPES[0];
      cells[vi].textContent = arch.emoji;
    }

    renderInventory();
  }

  function doTurn(playerActed) {
    if (!playerActed) return;
    cleanupDead(); enemiesTurn(); cleanupDead(); render();
    saveGame();
  }

  function onKeyDown(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "Tab") return;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d","W","A","S","D"," ",
         "y","u","b","n","Y","U","B","N",
         "b","l",
         "1","2","3","4","5","6","7","8","9"].includes(e.key))
      e.preventDefault();
    if (!state) return;
    let acted = false;

    if (e.code && e.code.startsWith("Digit") && e.code.length === 6) {
      const num = Number(e.code[5]);
      if (num >= 1 && num <= 9) {
        e.preventDefault();
        if (e.shiftKey) acted = itemDrop(num - 1);
        else acted = itemUse(num - 1);
      }
    } else {
      switch (e.key) {
        // Cardinal
        case "ArrowUp":    case "w": case "W": case "8": acted = playerTryMove( 0, -1); break;
        case "ArrowDown":  case "s": case "S": case "2": acted = playerTryMove( 0,  1); break;
        case "ArrowLeft":  case "a": case "A": case "4": acted = playerTryMove(-1,  0); break;
        case "ArrowRight": case "d": case "D": case "6": acted = playerTryMove( 1,  0); break;
        // Diagonal — numpad + VI-keys
        case "7": case "y": case "Y": acted = playerTryMove(-1, -1); break; // ↖
        case "9": case "u": case "U": acted = playerTryMove( 1, -1); break; // ↗
        case "1":                     acted = playerTryMove(-1,  1); break; // ↙
        case "3": case "n": case "N": acted = playerTryMove( 1,  1); break; // ↘
        case " ": case "5": acted = playerWait(); break;
        case "b": case "B": acted = itemUseFirst("potion"); break;
        case "l": case "L": acted = itemUseFirst("scroll"); break;
        default: return;
      }
    }
    doTurn(acted);
  }

  document.addEventListener("keydown", onKeyDown, { passive: false });
  newGameBtn.addEventListener("click", () => {
    gameOverModal.setAttribute("hidden", "");
    showModal();
  });
  restartBtnSim.addEventListener("click", () => {
    gameOverModal.setAttribute("hidden", "");
    newGame((Math.random() * 2 ** 32) >>> 0, state.playerName);
  });
  restartBtnNao.addEventListener("click", async () => {
    gameOverModal.setAttribute("hidden", "");
    scoresModal.removeAttribute("hidden");
    await renderScores();
  });
  helpBtn.addEventListener("click", () => helpModal.removeAttribute("hidden"));
  closeHelpBtn.addEventListener("click", () => helpModal.setAttribute("hidden", ""));
  scoresBtn.addEventListener("click", async () => {
    scoresModal.removeAttribute("hidden");
    await renderScores();
  });
  closeScoresBtn.addEventListener("click", () => scoresModal.setAttribute("hidden", ""));
  continueBtn.addEventListener("click", () => {
    if (loadGame()) { hideModal(); render(); gridEl.focus(); }
  });
  muteBtn.addEventListener("click", () => {
    soundMuted = !soundMuted;
    muteBtn.textContent = soundMuted ? "Sem som" : "Som";
  });

  ["dpadUp","dpadDown","dpadLeft","dpadRight",
   "dpadUL","dpadUR","dpadDL","dpadDR","dpadWait"].forEach(id => {
    el(id).addEventListener("click", () => {
      if (!state) return;
      let acted = false;
      if      (id === "dpadUp")    acted = playerTryMove( 0, -1);
      else if (id === "dpadDown")  acted = playerTryMove( 0,  1);
      else if (id === "dpadLeft")  acted = playerTryMove(-1,  0);
      else if (id === "dpadRight") acted = playerTryMove( 1,  0);
      else if (id === "dpadUL")    acted = playerTryMove(-1, -1);
      else if (id === "dpadUR")    acted = playerTryMove( 1, -1);
      else if (id === "dpadDL")    acted = playerTryMove(-1,  1);
      else if (id === "dpadDR")    acted = playerTryMove( 1,  1);
      else if (id === "dpadWait")  acted = playerWait();
      doTurn(acted);
    });
  });

  renderScores();
  showModal();
})();
