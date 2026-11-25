// Warung Senja — screenshot staging (?shot=...&seed=...).
// One clear job: put a fresh shift into a fixed, photogenic state using the
// game's own state fields, so screenshots are real renders of the game code.
// Normal play never passes ?shot=, so this changes nothing for players.

function setOrder(state, dishId, fraction) {
  const patienceMax = state.rush ? 42 : 55;
  state.orders.push({
    id: ++state.orderSeq,
    dishId,
    patience: patienceMax * fraction,
    patienceMax,
  });
}

function setCooker(st, item, fraction, done = false, burnt = false) {
  st.item = item;
  st.dur = { nasi: 4, telur: 3, mie: 5, ayam: 6 }[item] ?? 4;
  st.t = st.dur * fraction;
  st.done = done;
  st.burnt = burnt;
  st.burnT = 0;
}

export function applyShot(state, name) {
  state.orders = [];
  state.plates.forEach((p) => { p.items = []; p.held = false; });
  state.woks.forEach((w) => { w.item = null; w.t = 0; w.done = false; w.burnt = false; });
  state.grill.item = null;
  state.grill.t = 0;
  state.grill.done = false;
  state.grill.burnt = false;
  state.carry = null;
  state.cook.x = 640;
  state.cook.targetX = 640;
  state.toasts = [];

  if (name === 'cover') {
    // The full game at a glance: board, wok mid-cook, one dish mid-assembly,
    // one plate ready to serve, timer running.
    setOrder(state, 'nasi-goreng', 0.72);
    setOrder(state, 'mie-goreng', 0.45);
    setOrder(state, 'sate-ayam', 0.88);
    setCooker(state.woks[0], 'nasi', 0.7);
    setCooker(state.woks[1], 'telur', 1, true);
    state.plates[0].items = ['nasi_masak', 'telur_masak'];
    state.plates[1].items = ['nasi_masak', 'telur_masak', 'cabai'];
    state.coins = 185;
    state.shiftLeft = 151;
    state.combo = 2;
    state.toast('Nasi Goreng hampir lengkap — tambah cabai!', 'info');
  } else if (name === 'serve') {
    // The serve moment: a finished plate in hand at the pass.
    setOrder(state, 'mie-goreng', 0.6);
    setOrder(state, 'ayam-geprek', 0.8);
    setCooker(state.woks[0], 'mie', 0.5);
    setCooker(state.grill, 'ayam', 0.6);
    state.plates[0].items = ['mie_masak', 'telur_masak', 'timun'];
    state.plates[0].held = true;
    state.carry = { kind: 'plate', index: 0 };
    state.plates[1].items = ['ayam_masak'];
    state.cook.x = 980;
    state.cook.targetX = 980;
    state.coins = 240;
    state.shiftLeft = 96;
    state.combo = 3;
    state.passFlash = 1;
    state.toast('Mie Goreng tersaji! +68 koin', 'good');
  } else if (name === 'rush') {
    // Dinner rush: four tickets, one about to expire, both cookers busy.
    state.rush = true;
    setOrder(state, 'nasi-goreng', 0.12);
    setOrder(state, 'mie-goreng', 0.35);
    setOrder(state, 'ayam-geprek', 0.55);
    setOrder(state, 'sate-ayam', 0.75);
    setCooker(state.woks[0], 'mie', 0.4);
    setCooker(state.woks[1], 'telur', 1, true);
    setCooker(state.grill, 'ayam', 0.8);
    state.plates[0].items = ['ayam_masak', 'cabai'];
    state.plates[1].items = ['mie_masak'];
    state.coins = 342;
    state.shiftLeft = 47;
    state.combo = 3;
    state.hearts = 2;
    state.toast('RUSH! Satu pesanan hampir hangus!', 'bad');
  } else if (name === 'results') {
    // End of shift: the results panel over the kitchen.
    setOrder(state, 'es-teh', 0.5);
    state.plates[0].items = ['nasi_masak', 'telur_masak', 'cabai'];
    state.coins = 612;
    state.shiftLeft = 0;
    state.screen = 'results';
    state.result = {
      won: true, stars: 3, coins: 612, served: 12, expired: 1, bestCombo: 4,
    };
    state.particles.confetti(640, 200);
  }
  state.screen = name === 'results' ? 'results' : 'playing';
}
