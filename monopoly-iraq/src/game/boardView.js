// يحوّل اللوحة المنطقية (28 مربعاً) إلى شبكة CSS 8×8 بصرية
// الزوايا (0، 7، 14، 21) تقع في زوايا الشبكة الأربع

import { BOARD } from '../data/board.js';
import { getProvince, GROUPS } from '../data/provinces.js';

export function gridPos(i) {
  if (i < 8) return { row: 1, col: i + 1 };
  if (i < 15) return { row: i - 8 + 2, col: 8 };
  if (i < 22) return { row: 8, col: 7 - (i - 15) };
  return { row: 7 - (i - 22), col: 1 };
}

const SPECIAL_ICONS = {
  start: '🏁',
  jail: '🚔',
  free_parking: '🅿️',
  goto_jail: '👮',
  chance: '❓',
  community: '📦',
  tax: '💰',
};

const SPECIAL_LABELS = {
  start: 'البداية',
  jail: 'زيارة السجن',
  free_parking: 'موقف مجاني',
  goto_jail: 'اذهب للسجن',
  chance: 'فرصة',
  community: 'صندوق مجتمع',
};

export function renderBoardCells(state) {
  return BOARD.map((space, i) => {
    const pos = gridPos(i);
    const isCorner = i % 7 === 0;
    let content = '';
    let bandColor = '';
    let title = '';
    let ownerColor = '';

    if (space.type === 'province') {
      const province = getProvince(space.id);
      bandColor = GROUPS[province.group].color;
      title = province.name;
      const owner = state?.properties?.[space.id];
      if (owner) {
        const ownerPlayer = state.players.find((p) => p.id === owner.ownerId);
        if (ownerPlayer) ownerColor = ownerPlayer.color;
      }
      content = `
        <div class="cell-band" style="background:${bandColor}"></div>
        <div class="cell-icon">${province.icon}</div>
        <div class="cell-name">${title}</div>
        <div class="cell-price">${province.price}</div>
        ${ownerColor ? `<div class="cell-owner" style="background:${ownerColor}"></div>` : ''}
      `;
    } else {
      title = space.type === 'tax' ? space.name : SPECIAL_LABELS[space.type];
      content = `
        <div class="cell-icon special">${SPECIAL_ICONS[space.type]}</div>
        <div class="cell-name">${title}</div>
        ${space.type === 'tax' ? `<div class="cell-price">${space.amount}</div>` : ''}
      `;
    }

    const tokens = (state?.players || [])
      .filter((p) => p.position === i && !p.bankrupt)
      .map((p) => `<div class="token" style="background:${p.color}" title="${p.name}">${p.name[0]}</div>`)
      .join('');

    return `
      <div class="board-cell ${isCorner ? 'corner' : ''} space-${space.type}"
           style="grid-row:${pos.row}; grid-column:${pos.col};"
           data-index="${i}">
        ${content}
        <div class="cell-tokens">${tokens}</div>
      </div>
    `;
  }).join('');
}
