// Every pixel of Dapur Kilat: a warm warung kitchen drawn on one canvas.
// The renderer only reads the game state; it never changes it. All layout lives
// here in one place so the input layer can ask for the same hit rectangles the
// painter just drew.

import { DISHES, INGREDIENTS, dishById, ingredientById, matchDish } from './recipes.js';
import { MAX_HEARTS, PERFECT_FROM, PERFECT_TO, PHASE_OVER, PHASE_PAUSED, PHASE_PLAY, PHASE_TITLE, SHIFT_SECONDS, TARGET_COINS, timeLeft } from './state.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;

const CREAM = '#f7ead1';
const WOOD = '#7a4a26';
const WOOD_DARK = '#5d3619';
const RED = '#b3372a';
const RED_DARK = '#8c241b';
const GOLD = '#f2c14e';
const INK = '#2b1a10';
const PANEL = '#fff6e3';
const GREEN = '#4d9e57';
const TEAL = '#2f7a6e';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function pill(ctx, x, y, w, h, fill, stroke = null) {
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/** A little drawn icon for each ingredient — shapes only, no images, no emoji. */
export function drawIngredientIcon(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(43,26,16,0.55)';
  switch (id) {
    case 'nasi': {
      ctx.fillStyle = '#f5efe0';
      ctx.beginPath();
      ctx.arc(0, r * 0.25, r * 0.85, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d9cba6';
      for (const [dx, dy] of [[-0.4, -0.2], [0, -0.45], [0.4, -0.2], [-0.15, 0.05], [0.25, 0.05]]) {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'mie': {
      ctx.strokeStyle = '#d99a17';
      ctx.lineWidth = r * 0.16;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, i * r * 0.35);
        ctx.quadraticCurveTo(-r * 0.3, i * r * 0.35 - r * 0.3, r * 0.2, i * r * 0.35);
        ctx.quadraticCurveTo(r * 0.55, i * r * 0.35 + r * 0.3, r * 0.85, i * r * 0.35);
        ctx.stroke();
      }
      break;
    }
    case 'telur': {
      ctx.fillStyle = '#fffdf2';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.95, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f2a007';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.arc(-r * 0.12, -r * 0.12, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'ayam': {
      ctx.fillStyle = '#e07840';
      ctx.beginPath();
      ctx.ellipse(-r * 0.1, r * 0.1, r * 0.7, r * 0.55, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#f7ead1';
      ctx.lineWidth = r * 0.16;
      ctx.beginPath();
      ctx.moveTo(r * 0.35, -r * 0.35);
      ctx.lineTo(r * 0.8, -r * 0.8);
      ctx.stroke();
      ctx.fillStyle = '#f7ead1';
      ctx.beginPath();
      ctx.arc(r * 0.85, -r * 0.85, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bakso': {
      ctx.fillStyle = '#8a5a33';
      for (const [dx, dy, rr] of [[-0.45, 0.2, 0.42], [0.4, 0.25, 0.42], [0, -0.35, 0.45]]) {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, rr * r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#a9743f';
      ctx.beginPath();
      ctx.arc(-r * 0.55, r * 0.05, r * 0.1, 0, Math.PI * 2);
      ctx.arc(r * 0.3, r * 0.1, r * 0.1, 0, Math.PI * 2);
      ctx.arc(-r * 0.1, -r * 0.5, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'sayur': {
      ctx.fillStyle = '#58b368';
      for (const angle of [-0.6, 0, 0.6]) {
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.35, r * 0.3, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = '#2f7a3e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.6);
      ctx.lineTo(0, -r * 0.1);
      ctx.stroke();
      break;
    }
    case 'kecap': {
      ctx.fillStyle = '#3a2418';
      roundRect(ctx, -r * 0.35, -r * 0.5, r * 0.7, r * 1.1, r * 0.12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8c241b';
      ctx.fillRect(-r * 0.35, -r * 0.15, r * 0.7, r * 0.45);
      ctx.fillStyle = '#d9cba6';
      ctx.fillRect(-r * 0.2, -r * 0.75, r * 0.4, r * 0.28);
      break;
    }
    case 'bumbu': {
      ctx.fillStyle = '#e8dcc3';
      ctx.beginPath();
      ctx.arc(0, r * 0.15, r * 0.8, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e2703a';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.1, r * 0.62, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2a007';
      ctx.beginPath();
      ctx.arc(-r * 0.2, r * 0.05, r * 0.09, 0, Math.PI * 2);
      ctx.arc(r * 0.2, r * 0.15, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'kuah': {
      ctx.fillStyle = '#e8dcc3';
      ctx.beginPath();
      ctx.arc(0, r * 0.1, r * 0.85, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e8a34c';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.08, r * 0.68, r * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, -r * 0.35);
      ctx.quadraticCurveTo(-r * 0.15, -r * 0.6, -r * 0.3, -r * 0.8);
      ctx.moveTo(r * 0.25, -r * 0.3);
      ctx.quadraticCurveTo(r * 0.4, -r * 0.55, r * 0.25, -r * 0.75);
      ctx.stroke();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

/** The layout rectangles the input layer clicks on. */
export function layout() {
  const bins = INGREDIENTS.map((ing, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    return { id: ing.id, x: 328 + col * 108, y: 128 + row * 76, w: 98, h: 66 };
  });
  return {
    bins,
    plateSlots: [0, 1, 2, 3].map((i) => ({ x: 344 + i * 76, y: 452, w: 66, h: 66 })),
    wok: { x: 664, y: 392, w: 288, h: 168 },
    serve: { x: 328, y: 584, w: 300, h: 56 },
    trash: { x: 644, y: 584, w: 140, h: 56 },
    mute: { x: 1196, y: 12, w: 68, h: 40 },
    start: { x: 440, y: 560, w: 400, h: 64 },
    restart: { x: 440, y: 560, w: 400, h: 64 },
  };
}

function drawBackground(ctx, t) {
  ctx.fillStyle = '#3a2113';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Tiled floor at the bottom.
  ctx.fillStyle = '#e8dcc3';
  ctx.fillRect(0, 648, VIEW_W, 72);
  ctx.strokeStyle = '#cbb98f';
  ctx.lineWidth = 2;
  for (let x = 0; x <= VIEW_W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 648);
    ctx.lineTo(x - 32, 720);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 684);
  ctx.lineTo(VIEW_W, 684);
  ctx.stroke();
  // Wall tiles.
  ctx.fillStyle = '#f3e2c2';
  ctx.fillRect(0, 64, VIEW_W, 584);
  ctx.strokeStyle = '#e0cda6';
  for (let y = 64; y < 648; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();
  }
  // Hanging lamps with a warm glow.
  for (const lx of [440, 640, 840]) {
    const sway = Math.sin(t * 0.7 + lx) * 3;
    ctx.strokeStyle = '#5d3619';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx + sway, 64);
    ctx.lineTo(lx + sway, 96);
    ctx.stroke();
    const glow = ctx.createRadialGradient(lx + sway, 116, 4, lx + sway, 116, 60);
    glow.addColorStop(0, 'rgba(242,193,78,0.5)');
    glow.addColorStop(1, 'rgba(242,193,78,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx + sway, 116, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8c241b';
    ctx.beginPath();
    ctx.moveTo(lx + sway - 18, 108);
    ctx.lineTo(lx + sway + 18, 108);
    ctx.lineTo(lx + sway + 10, 122);
    ctx.lineTo(lx + sway - 10, 122);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(lx + sway, 122, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTopBar(ctx, game) {
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, VIEW_W, 64);
  ctx.fillStyle = RED_DARK;
  ctx.fillRect(0, 60, VIEW_W, 4);
  text(ctx, 'DAPUR KILAT', 24, 33, 30, '#fff6e3', 'bold');
  const left = Math.ceil(timeLeft(game));
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const urgent = left <= 30 && game.phase === PHASE_PLAY;
  pill(ctx, 520, 10, 240, 44, urgent ? '#7d1a10' : '#5d3619');
  text(ctx, `⏱ ${mm}:${ss}`, 640, 33, 28, urgent ? '#ffb3a3' : '#fff6e3', 'bold', 'center');
  text(ctx, `Rp ${game.coins} / ${TARGET_COINS}`, 788, 33, 22, '#fff6e3', 'bold');
  for (let i = 0; i < MAX_HEARTS; i += 1) {
    const hx = 940 + i * 34;
    ctx.fillStyle = i < game.hearts ? '#ff5a4e' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx + 12, 44);
    ctx.bezierCurveTo(hx + 12, 34, hx - 2, 30, hx - 2, 38);
    ctx.bezierCurveTo(hx - 2, 46, hx + 12, 52, hx + 12, 52);
    ctx.bezierCurveTo(hx + 12, 52, hx + 26, 46, hx + 26, 38);
    ctx.bezierCurveTo(hx + 26, 30, hx + 12, 34, hx + 12, 44);
    ctx.fill();
  }
  if (game.combo > 1) {
    pill(ctx, 1052, 12, 118, 40, GOLD);
    text(ctx, `KOMBO x${game.combo}`, 1111, 33, 19, INK, 'bold', 'center');
  }
  const mute = layout().mute;
  pill(ctx, mute.x, mute.y, mute.w, mute.h, 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.4)');
  text(ctx, game.muted ? 'SUARA ✕' : 'SUARA ✓', mute.x + mute.w / 2, mute.y + mute.h / 2 + 1, 13, '#fff6e3', 'bold', 'center');
}

function drawOrders(ctx, game, t) {
  ctx.fillStyle = 'rgba(43,26,16,0.85)';
  roundRect(ctx, 16, 80, 280, 320, 12);
  ctx.fill();
  text(ctx, 'PESANAN', 156, 106, 20, GOLD, 'bold', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(32, 122, 248, 2);
  if (game.orders.length === 0) {
    text(ctx, 'Belum ada pesanan…', 156, 180, 16, 'rgba(255,246,227,0.7)', 'normal', 'center');
    text(ctx, 'Siapkan bahan selagi', 156, 206, 14, 'rgba(255,246,227,0.5)', 'normal', 'center');
    text(ctx, 'menunggu pelanggan.', 156, 226, 14, 'rgba(255,246,227,0.5)', 'normal', 'center');
  }
  game.orders.forEach((order, i) => {
    const y = 136 + i * 88;
    const dish = dishById(order.dishId);
    const frac = Math.max(0, order.patience / order.patienceMax);
    const low = frac < 0.3;
    const pulse = low ? 0.75 + 0.25 * Math.sin(t * 8) : 1;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#fff6e3';
    roundRect(ctx, 28, y, 256, 78, 10);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = dish.color;
    ctx.beginPath();
    ctx.arc(62, y + 26, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6e3';
    ctx.beginPath();
    ctx.arc(62, y + 26, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dish.color;
    ctx.beginPath();
    ctx.arc(62, y + 26, 7, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, dish.name, 92, y + 18, 17, INK, 'bold');
    text(ctx, dish.recipe.map((id) => ingredientById(id).name).join(' + '), 92, y + 40, 12, '#6b4a2a', 'normal');
    text(ctx, `Rp ${dish.price}`, 268, y + 18, 14, TEAL, 'bold', 'right');
    ctx.fillStyle = '#e5d3ae';
    roundRect(ctx, 92, y + 54, 176, 10, 5);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? GREEN : frac > 0.25 ? GOLD : '#d33f2e';
    if (frac > 0) {
      roundRect(ctx, 92, y + 54, 176 * frac, 10, 5);
      ctx.fill();
    }
  });
  text(ctx, 'Sajikan sebelum sabar habis!', 156, 386, 13, 'rgba(255,246,227,0.65)', 'italic', 'center');
}

function drawCounter(ctx, game, t) {
  const L = layout();
  ctx.fillStyle = WOOD;
  roundRect(ctx, 312, 80, 656, 296, 14);
  ctx.fill();
  ctx.fillStyle = WOOD_DARK;
  roundRect(ctx, 312, 80, 656, 296, 14);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'MEJA BAHAN — klik atau tekan 1–9', 640, 106, 17, CREAM, 'bold', 'center');
  L.bins.forEach((bin) => {
    const ing = ingredientById(bin.id);
    const onPlate = game.plate.includes(bin.id);
    ctx.fillStyle = onPlate ? '#ffe9a8' : PANEL;
    roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 10);
    ctx.fill();
    ctx.strokeStyle = onPlate ? GOLD : 'rgba(43,26,16,0.35)';
    ctx.lineWidth = onPlate ? 3 : 2;
    ctx.stroke();
    drawIngredientIcon(ctx, bin.id, bin.x + 26, bin.y + 33, 20);
    text(ctx, ing.name, bin.x + 50, bin.y + 24, 15, INK, 'bold');
    text(ctx, `[${ing.key}]`, bin.x + 50, bin.y + 46, 12, '#8a6a45', 'bold');
    if (onPlate) text(ctx, '✓ di piring', bin.x + bin.w / 2, bin.y + 58, 10, TEAL, 'bold', 'center');
  });
}

function drawPlate(ctx, game) {
  const L = layout();
  ctx.fillStyle = WOOD;
  roundRect(ctx, 312, 392, 336, 168, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'PIRING', 480, 416, 16, CREAM, 'bold', 'center');
  const dish = matchDish(game.plate);
  L.plateSlots.forEach((slot, i) => {
    const id = game.plate[i];
    ctx.fillStyle = id ? '#fff6e3' : 'rgba(255,255,255,0.12)';
    roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (id) drawIngredientIcon(ctx, id, slot.x + 33, slot.y + 33, 22);
  });
  if (game.messageT > 0 && game.message) {
    ctx.fillStyle = GOLD;
    roundRect(ctx, 336, 528, 288, 22, 8);
    ctx.fill();
    text(ctx, game.message, 480, 540, 13, INK, 'bold', 'center');
  } else if (game.cookedDish) {
    ctx.fillStyle = GOLD;
    roundRect(ctx, 336, 528, 288, 22, 8);
    ctx.fill();
    text(ctx, `${game.cookedDish.name} siap disajikan!`, 480, 540, 14, INK, 'bold', 'center');
  } else if (game.cooking) {
    text(ctx, 'Memasak di wajan — angkat di zona hijau…', 480, 540, 13, 'rgba(255,246,227,0.9)', 'bold', 'center');
  } else if (dish) {
    ctx.fillStyle = '#ffe9a8';
    roundRect(ctx, 336, 528, 288, 22, 8);
    ctx.fill();
    text(ctx, `Resep cocok: ${dish.name} — masak di wajan!`, 480, 540, 13, INK, 'bold', 'center');
  } else if (game.plate.length > 0) {
    text(ctx, 'Belum jadi resep — cek menu di kanan.', 480, 540, 13, 'rgba(255,246,227,0.75)', 'normal', 'center');
  } else {
    text(ctx, 'Piring kosong — ambil bahan dari meja.', 480, 540, 13, 'rgba(255,246,227,0.75)', 'normal', 'center');
  }
}

function drawWok(ctx, game, t) {
  const L = layout();
  const box = L.wok;
  const dish = matchDish(game.plate);
  const cooking = game.cooking;
  ctx.fillStyle = WOOD;
  roundRect(ctx, box.x, box.y, box.w, box.h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 3;
  ctx.stroke();
  const cx = box.x + 144;
  const cy = box.y + 62;
  // Flame under the wok while cooking.
  if (cooking) {
    for (let i = 0; i < 5; i += 1) {
      const fx = cx - 60 + i * 30 + Math.sin(t * 9 + i * 2) * 4;
      const fh = 18 + Math.sin(t * 12 + i * 1.7) * 6;
      ctx.fillStyle = i % 2 ? '#f2a007' : '#e2703a';
      ctx.beginPath();
      ctx.moveTo(fx - 9, cy + 42);
      ctx.quadraticCurveTo(fx, cy + 42 - fh - 10, fx + 9, cy + 42);
      ctx.closePath();
      ctx.fill();
    }
  }
  // The wok itself.
  ctx.fillStyle = '#3a3f45';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 96, 30, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#555b63';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12, 96, 30, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#2b2f34';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12, 96, 30, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (cooking) {
    ctx.fillStyle = cooking.dish.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, 70, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 3; i += 1) {
      const sx = cx - 40 + i * 40;
      const sy = cy - 18 - ((t * 30 + i * 23) % 26);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy + 8);
      ctx.quadraticCurveTo(sx + 5, sy, sx, sy - 8);
      ctx.stroke();
    }
  } else if (game.cookedDish) {
    text(ctx, game.cookedDish.name, cx, cy + 12, 16, '#fff6e3', 'bold', 'center');
    text(ctx, 'sudah matang — sajikan!', cx, cy + 32, 12, GOLD, 'bold', 'center');
  } else if (dish) {
    text(ctx, dish.name, cx, cy + 12, 16, '#fff6e3', 'bold', 'center');
    text(ctx, 'siap dimasak', cx, cy + 32, 12, 'rgba(255,246,227,0.8)', 'normal', 'center');
  } else {
    text(ctx, 'WAJAN', cx, cy + 12, 18, 'rgba(255,246,227,0.6)', 'bold', 'center');
  }
  // Timing bar with the green zone.
  const barX = box.x + 20;
  const barY = box.y + 128;
  const barW = box.w - 40;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, barX, barY, barW, 16, 8);
  ctx.fill();
  ctx.fillStyle = GREEN;
  roundRect(ctx, barX + barW * PERFECT_FROM, barY, barW * (PERFECT_TO - PERFECT_FROM), 16, 4);
  ctx.fill();
  ctx.fillStyle = '#d33f2e';
  roundRect(ctx, barX + barW * 0.9, barY, barW * 0.1, 16, 4);
  ctx.fill();
  if (cooking) {
    const at = Math.min(1, cooking.t / cooking.duration);
    ctx.fillStyle = '#fff6e3';
    ctx.fillRect(barX + barW * at - 2, barY - 4, 4, 24);
    text(ctx, 'Klik wajan untuk angkat!', cx, barY + 30, 13, CREAM, 'bold', 'center');
  } else {
    text(ctx, 'Hijau = sempurna · Merah = gosong', cx, barY + 30, 12, 'rgba(255,246,227,0.7)', 'normal', 'center');
  }
}

function drawMenu(ctx, game) {
  ctx.fillStyle = PANEL;
  roundRect(ctx, 984, 80, 280, 296, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(43,26,16,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'MENU WARUNG', 1124, 106, 18, RED, 'bold', 'center');
  DISHES.forEach((dish, i) => {
    const y = 132 + i * 46;
    ctx.fillStyle = dish.color;
    ctx.beginPath();
    ctx.arc(1012, y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6e3';
    ctx.beginPath();
    ctx.arc(1012, y, 9, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, dish.name, 1036, y - 6, 15, INK, 'bold');
    text(ctx, dish.recipe.map((id) => ingredientById(id).name).join(' + '), 1036, y + 12, 11, '#6b4a2a', 'normal');
    text(ctx, `Rp ${dish.price}`, 1248, y, 14, TEAL, 'bold', 'right');
  });
  text(ctx, 'Tip: sajikan cepat = tip besar.', 1124, 366, 12, '#8a6a45', 'italic', 'center');
  // Served tally.
  ctx.fillStyle = '#f3e2c2';
  roundRect(ctx, 984, 392, 280, 168, 12);
  ctx.fill();
  text(ctx, 'SHIFT HARI INI', 1124, 418, 16, RED, 'bold', 'center');
  text(ctx, `Hidangan tersaji: ${game.served}`, 1008, 448, 15, INK, 'normal');
  text(ctx, `Masakan sempurna: ${game.perfects}`, 1008, 474, 15, INK, 'normal');
  text(ctx, `Hangus: ${game.burnt}`, 1008, 500, 15, INK, 'normal');
  text(ctx, `Kombo terbaik: x${game.bestCombo}`, 1008, 526, 15, INK, 'normal');
  if (game.rush) {
    ctx.save();
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 120);
    text(ctx, 'RUSH! Tip 2x', 1124, 548, 16, '#d33f2e', 'bold', 'center');
    ctx.restore();
  }
}

function drawButtons(ctx, game) {
  const L = layout();
  const canServe = !!game.cookedDish;
  ctx.fillStyle = canServe ? GREEN : '#9aa08f';
  roundRect(ctx, L.serve.x, L.serve.y, L.serve.w, L.serve.h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'SAJIKAN  [Enter]', L.serve.x + L.serve.w / 2, L.serve.y + 29, 20, '#fff6e3', 'bold', 'center');
  ctx.fillStyle = '#6b4a2a';
  roundRect(ctx, L.trash.x, L.trash.y, L.trash.w, L.trash.h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'BUANG', L.trash.x + L.trash.w / 2, L.trash.y + 29, 16, '#fff6e3', 'bold', 'center');
  text(ctx, '1–9 bahan · Spasi masak · Enter sajikan · Backspace buang · P jeda · M suara', 640, 668, 14, '#8a6a45', 'normal', 'center');
}

function overlay(ctx, title, lines, button, accent) {
  ctx.fillStyle = 'rgba(24,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PANEL;
  roundRect(ctx, 340, 110, 600, 440, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, title, 640, 158, 40, RED, 'bold', 'center');
  let y = 216;
  for (const line of lines) {
    text(ctx, line, 640, y, 17, INK, 'normal', 'center');
    y += 30;
  }
  pill(ctx, 440, 560, 400, 64, accent);
  text(ctx, button, 640, 593, 22, '#fff6e3', 'bold', 'center');
}

function drawTitle(ctx, game, best) {
  overlay(ctx, 'DAPUR KILAT', [
    'Warung kecil, pesanan menumpuk, wajan panas.',
    'Rakit hidangan dari bahan di meja, masak sampai',
    'pas di zona hijau, lalu sajikan sebelum pelanggan',
    'kehabisan sabar. Raih Rp 150 dalam 3 menit!',
    '',
    '1–9  pilih bahan      Spasi  masak di wajan',
    'Enter  sajikan          Backspace  buang piring',
  ], 'MULAI SHIFT  [Enter]', RED);
  if (best > 0) text(ctx, `Rekor koin: Rp ${best}`, 640, 520, 16, TEAL, 'bold', 'center');
}

function drawPaused(ctx) {
  overlay(ctx, 'JEDA', [
    'Wajan dimatikan sebentar.',
    'Pesanannya menunggu — jangan lama-lama!',
  ], 'LANJUT  [P]', TEAL);
}

function drawOver(ctx, game) {
  const title = game.won ? 'SHIFT BERHASIL!' : 'SHIFT GAGAL';
  const accent = game.won ? GREEN : RED;
  overlay(ctx, title, [
    game.won
      ? `Target Rp ${TARGET_COINS} tercapai — warungmu laris manis!`
      : `Waktu habis di Rp ${game.coins} — target Rp ${TARGET_COINS} belum sampai.`,
    '',
    `Hidangan tersaji: ${game.served}      Sempurna: ${game.perfects}`,
    `Hangus: ${game.burnt}      Kombo terbaik: x${game.bestCombo}`,
    '',
    game.won ? 'Pelanggan pulang kenyang dan bahagia.' : 'Besok coba lagi — pelanggan menanti.',
  ], 'MAIN LAGI  [R]', accent);
}

/** Paint one frame. `t` is seconds since boot, for lamps, steam and pulses. */
export function render(ctx, game, best, t) {
  ctx.save();
  if (game.shake > 0) {
    const s = game.shake * 14;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  drawBackground(ctx, t);
  drawTopBar(ctx, game);
  if (game.phase === PHASE_TITLE) {
    drawOrders(ctx, { ...game, orders: [] }, t);
    drawCounter(ctx, game, t);
    drawPlate(ctx, game);
    drawWok(ctx, game, t);
    drawMenu(ctx, game);
    drawButtons(ctx, game);
    drawTitle(ctx, game, best);
    ctx.restore();
    return;
  }
  drawOrders(ctx, game, t);
  drawCounter(ctx, game, t);
  drawPlate(ctx, game);
  drawWok(ctx, game, t);
  drawMenu(ctx, game);
  drawButtons(ctx, game);
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(242,193,78,${game.flash * 0.25})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (game.phase === PHASE_PAUSED) drawPaused(ctx);
  if (game.phase === PHASE_OVER) drawOver(ctx, game);
  ctx.restore();
}
