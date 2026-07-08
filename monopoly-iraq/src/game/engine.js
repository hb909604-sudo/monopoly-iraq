// محرك اللعبة: يحتوي كل قواعد "مونوبولي العراق"
// يعمل فوق حالة مخزنة في LocalStorage (انظر storage.js)

import { BOARD, BOARD_SIZE, PASS_START_BONUS, JAIL_FINE } from '../data/board.js';
import { PROVINCES, getProvince } from '../data/provinces.js';
import { CHANCE_CARDS, COMMUNITY_CARDS } from '../data/cards.js';
import { saveRoom, loadRoom, generateRoomId, onRoomChange } from './storage.js';

const PLAYER_COLORS = ['#CE1126', '#0E7A3D', '#C79A2E', '#1868A8', '#8B5A2B', '#6B2D8C'];
const STARTING_MONEY = 1500;

export class GameEngine {
  constructor(roomId) {
    this.roomId = roomId;
    this.listeners = [];
    this.unsubscribeStorage = onRoomChange(roomId, (state) => {
      if (state) {
        this.state = state;
        this.emit();
      }
    });
    this.state = loadRoom(roomId);
  }

  // ---------- الأساسيات ----------

  static createNewRoom() {
    const roomId = generateRoomId();
    const state = {
      roomId,
      status: 'lobby',
      players: [],
      currentPlayerIndex: 0,
      properties: {},
      log: [{ ts: Date.now(), text: 'تم إنشاء الغرفة. بانتظار انضمام اللاعبين...' }],
      chat: [],
      lastDice: [1, 1],
      turnPhase: 'roll',
      pendingCard: null,
      freeParkingPot: 0,
      createdAt: Date.now(),
    };
    saveRoom(roomId, state);
    return roomId;
  }

  exists() {
    return !!this.state;
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  emit() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  persist() {
    saveRoom(this.roomId, this.state);
    this.emit();
  }

  addLog(text) {
    this.state.log.unshift({ ts: Date.now(), text });
    if (this.state.log.length > 100) this.state.log.length = 100;
  }

  destroy() {
    if (this.unsubscribeStorage) this.unsubscribeStorage();
  }

  // ---------- اللاعبون ----------

  addPlayer(name) {
    if (!this.state) return null;
    if (this.state.players.length >= 6) return null;
    const id = 'p_' + Math.random().toString(36).slice(2, 9);
    const color = PLAYER_COLORS[this.state.players.length % PLAYER_COLORS.length];
    const isHost = this.state.players.length === 0;
    const player = {
      id,
      name,
      color,
      money: STARTING_MONEY,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailFree: 0,
      properties: [],
      bankrupt: false,
      isHost,
      connected: true,
    };
    this.state.players.push(player);
    this.addLog(`${name} انضم إلى اللعبة 🎉`);
    this.persist();
    return id;
  }

  currentPlayer() {
    return this.state.players[this.state.currentPlayerIndex];
  }

  getPlayer(id) {
    return this.state.players.find((p) => p.id === id);
  }

  startGame() {
    if (this.state.players.length < 2) return false;
    this.state.status = 'playing';
    this.state.currentPlayerIndex = 0;
    this.state.turnPhase = 'roll';
    this.addLog('بدأت اللعبة! بالتوفيق للجميع 🎲');
    this.persist();
    return true;
  }

  // ---------- الدور والنرد ----------

  rollDice(playerId) {
    if (this.state.status !== 'playing') return null;
    const player = this.currentPlayer();
    if (!player || player.id !== playerId) return null;
    if (this.state.turnPhase !== 'roll') return null;

    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    this.state.lastDice = [d1, d2];
    const isDouble = d1 === d2;

    if (player.inJail) {
      if (isDouble) {
        player.inJail = false;
        player.jailTurns = 0;
        this.addLog(`${player.name} رمى دبل (${d1},${d2}) وخرج من السجن!`);
      } else {
        player.jailTurns += 1;
        if (player.jailTurns >= 3) {
          player.inJail = false;
          player.jailTurns = 0;
          player.money -= JAIL_FINE;
          this.addLog(`${player.name} دفع ${JAIL_FINE} غرامة وخرج من السجن بعد 3 محاولات.`);
        } else {
          this.addLog(`${player.name} حاول الهروب من السجن ولم ينجح (${d1},${d2}).`);
          this.state.turnPhase = 'end';
          this.persist();
          return { d1, d2, isDouble, stayedInJail: true };
        }
      }
    }

    this.movePlayer(player, d1 + d2);
    this.state.turnPhase = 'action';
    if (isDouble && !player.inJail) {
      // دبل يعطي دور إضافي بعد إنهاء هذا الدور (مبسّط: يُسمح للاعب بالرمي مجدداً)
      this.state.allowExtraRoll = true;
    } else {
      this.state.allowExtraRoll = false;
    }
    this.persist();
    return { d1, d2, isDouble };
  }

  movePlayer(player, steps) {
    const prevPos = player.position;
    let newPos = (prevPos + steps) % BOARD_SIZE;
    if (newPos < 0) newPos += BOARD_SIZE;
    if (prevPos + steps >= BOARD_SIZE && steps > 0) {
      player.money += PASS_START_BONUS;
      this.addLog(`${player.name} مر بنقطة البداية واستلم ${PASS_START_BONUS} دينار.`);
    }
    player.position = newPos;
    this.addLog(`${player.name} تحرك إلى ${this.spaceName(newPos)}.`);
    this.resolveSpace(player, newPos);
  }

  spaceName(pos) {
    const space = BOARD[pos];
    if (space.type === 'province') return getProvince(space.id).name;
    const names = {
      start: 'نقطة البداية',
      chance: 'فرصة',
      community: 'صندوق المجتمع',
      tax: space.name,
      jail: 'السجن (زيارة)',
      free_parking: 'موقف مجاني',
      goto_jail: 'اذهب إلى السجن',
    };
    return names[space.type] || space.type;
  }

  resolveSpace(player, pos) {
    const space = BOARD[pos];
    switch (space.type) {
      case 'province': {
        const owner = this.state.properties[space.id];
        if (!owner) {
          // متاحة للشراء - ينتظر قرار اللاعب
          this.state.pendingCard = null;
        } else if (owner.ownerId !== player.id) {
          const province = getProvince(space.id);
          const rentOwner = this.getPlayer(owner.ownerId);
          if (rentOwner && !rentOwner.bankrupt) {
            const rent = province.rent;
            player.money -= rent;
            rentOwner.money += rent;
            this.addLog(`${player.name} دفع إيجار ${rent} دينار إلى ${rentOwner.name} (${province.name}).`);
          }
        }
        break;
      }
      case 'tax': {
        player.money -= space.amount;
        this.state.freeParkingPot = (this.state.freeParkingPot || 0) + space.amount;
        this.addLog(`${player.name} دفع ${space.name}: ${space.amount} دينار.`);
        break;
      }
      case 'goto_jail': {
        this.sendToJail(player);
        break;
      }
      case 'free_parking': {
        const pot = this.state.freeParkingPot || 0;
        if (pot > 0) {
          player.money += pot;
          this.addLog(`${player.name} حصل على وعاء الموقف المجاني: ${pot} دينار!`);
          this.state.freeParkingPot = 0;
        }
        break;
      }
      case 'chance': {
        this.drawCard(player, 'chance');
        break;
      }
      case 'community': {
        this.drawCard(player, 'community');
        break;
      }
      default:
        break;
    }
  }

  sendToJail(player) {
    player.position = BOARD.findIndex((s) => s.type === 'jail');
    player.inJail = true;
    player.jailTurns = 0;
    this.addLog(`${player.name} ذهب إلى السجن 🚔`);
  }

  drawCard(player, deckType) {
    const deck = deckType === 'chance' ? CHANCE_CARDS : COMMUNITY_CARDS;
    const card = deck[Math.floor(Math.random() * deck.length)];
    this.state.pendingCard = { deckType, text: card.text };
    this.addLog(`${player.name} سحب بطاقة ${deckType === 'chance' ? 'فرصة' : 'صندوق مجتمع'}: ${card.text}`);
    this.applyCardEffect(player, card.effect);
  }

  applyCardEffect(player, effect) {
    switch (effect.kind) {
      case 'receive':
        player.money += effect.amount;
        break;
      case 'pay':
        player.money -= effect.amount;
        this.state.freeParkingPot = (this.state.freeParkingPot || 0) + effect.amount;
        break;
      case 'goto': {
        const idx = BOARD.findIndex((s) => s.type === 'province' && s.id === effect.id);
        if (idx >= 0) {
          if (idx < player.position) player.money += PASS_START_BONUS; // لف حول اللوحة
          player.position = idx;
          this.resolveSpace(player, idx);
        }
        break;
      }
      case 'move':
        this.movePlayer(player, effect.steps);
        break;
      case 'jail':
        this.sendToJail(player);
        break;
      case 'gotoJailFree':
        player.getOutOfJailFree += 1;
        break;
      case 'collectFromAll':
        this.state.players.forEach((p) => {
          if (p.id !== player.id && !p.bankrupt) {
            p.money -= effect.amount;
            player.money += effect.amount;
          }
        });
        break;
      case 'payAll':
        this.state.players.forEach((p) => {
          if (p.id !== player.id && !p.bankrupt) {
            p.money += effect.amount;
            player.money -= effect.amount;
          }
        });
        break;
      default:
        break;
    }
  }

  // ---------- الملكية ----------

  buyCurrentProperty(playerId) {
    const player = this.currentPlayer();
    if (!player || player.id !== playerId) return false;
    const space = BOARD[player.position];
    if (space.type !== 'province') return false;
    if (this.state.properties[space.id]) return false;
    const province = getProvince(space.id);
    if (player.money < province.price) return false;

    player.money -= province.price;
    player.properties.push(space.id);
    this.state.properties[space.id] = { ownerId: player.id };
    this.addLog(`${player.name} اشترى ${province.name} مقابل ${province.price} دينار.`);
    this.persist();
    return true;
  }

  useGetOutOfJailCard(playerId) {
    const player = this.getPlayer(playerId);
    if (!player || player.getOutOfJailFree <= 0 || !player.inJail) return false;
    player.getOutOfJailFree -= 1;
    player.inJail = false;
    player.jailTurns = 0;
    this.addLog(`${player.name} استخدم بطاقة "اخرج من السجن مجاناً".`);
    this.persist();
    return true;
  }

  payJailFine(playerId) {
    const player = this.getPlayer(playerId);
    if (!player || !player.inJail) return false;
    if (player.money < JAIL_FINE) return false;
    player.money -= JAIL_FINE;
    player.inJail = false;
    player.jailTurns = 0;
    this.addLog(`${player.name} دفع ${JAIL_FINE} دينار للخروج من السجن.`);
    this.persist();
    return true;
  }

  // ---------- إنهاء الدور ----------

  endTurn(playerId) {
    const player = this.currentPlayer();
    if (!player || player.id !== playerId) return false;

    this.checkBankruptcy(player);

    if (this.state.allowExtraRoll && !player.bankrupt) {
      this.state.turnPhase = 'roll';
      this.state.allowExtraRoll = false;
      this.addLog(`${player.name} حصل على دور إضافي بسبب الدبل!`);
      this.persist();
      return true;
    }

    let next = this.state.currentPlayerIndex;
    do {
      next = (next + 1) % this.state.players.length;
    } while (this.state.players[next].bankrupt && next !== this.state.currentPlayerIndex);

    this.state.currentPlayerIndex = next;
    this.state.turnPhase = 'roll';
    this.state.pendingCard = null;
    this.persist();
    return true;
  }

  checkBankruptcy(player) {
    if (player.money < 0 && !player.bankrupt) {
      player.bankrupt = true;
      player.properties.forEach((pid) => delete this.state.properties[pid]);
      player.properties = [];
      this.addLog(`💔 ${player.name} أفلس وخرج من اللعبة!`);
      const activePlayers = this.state.players.filter((p) => !p.bankrupt);
      if (activePlayers.length === 1) {
        this.state.status = 'finished';
        this.addLog(`🏆 ${activePlayers[0].name} فاز باللعبة!`);
      }
    }
  }

  // ---------- الدردشة ----------

  sendChatMessage(playerName, text) {
    this.state.chat.push({ ts: Date.now(), playerName, text });
    if (this.state.chat.length > 200) this.state.chat.shift();
    this.persist();
  }
}
