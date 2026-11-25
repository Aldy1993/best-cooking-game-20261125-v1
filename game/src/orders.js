// Warung Senja — the order board: spawning tickets, patience, serving.
// One clear job: everything about customer orders and their rewards.

import { DISH_BY_ID, DISH_WEIGHTS, dishForPlate } from './recipes.js';
import { pickWeighted } from './rng.js';

export const ORDER_PATIENCE = 55;
export const RUSH_PATIENCE = 42;
export const MAX_ORDERS = 4;

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const dishId = pickWeighted(state.rng, DISH_WEIGHTS);
  const patienceMax = state.rush ? RUSH_PATIENCE : ORDER_PATIENCE;
  const order = {
    id: ++state.orderSeq,
    dishId,
    patience: patienceMax,
    patienceMax,
  };
  state.orders.push(order);
  return order;
}

function orderTip(dish, order) {
  const fraction = Math.max(0, order.patience / order.patienceMax);
  return Math.round(dish.price * 0.5 * fraction);
}

function comboMultiplier(combo) {
  return 1 + 0.25 * Math.min(combo, 4);
}

// Serve a carried plate. Returns what happened for the toast + effects.
export function servePlate(state, plateItems) {
  const dish = dishForPlate(plateItems);
  if (!dish) {
    state.coins += 5;
    state.combo = 0;
    return { matched: false, dish: null, coins: 5, tip: 0, text: 'Bukan pesanan — +5 koin saja' };
  }
  const orderIndex = state.orders.findIndex((o) => o.dishId === dish.id);
  const mult = comboMultiplier(state.combo);
  if (orderIndex < 0) {
    const coins = Math.round(dish.price * mult);
    state.coins += coins;
    state.combo = 0;
    return { matched: false, dish, coins, tip: 0, text: `${dish.name} tidak dipesan — +${coins} koin` };
  }
  const order = state.orders[orderIndex];
  const tip = orderTip(dish, order);
  const coins = Math.round((dish.price + tip) * mult);
  state.orders.splice(orderIndex, 1);
  state.coins += coins;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.served += 1;
  return { matched: true, dish, coins, tip, text: `${dish.name} tersaji! +${coins} koin` };
}

export function updateOrders(state, dt) {
  for (let i = state.orders.length - 1; i >= 0; i--) {
    const order = state.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders.splice(i, 1);
      state.expired += 1;
      state.hearts -= 1;
      state.combo = 0;
      state.sfx.expire();
      state.toast(`${DISH_BY_ID[order.dishId].name} hangus — pelanggan pergi!`, 'bad');
      if (state.hearts <= 0) state.endShift(false);
    }
  }
}
