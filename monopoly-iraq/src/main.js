// نقطة الدخول الرئيسية لتطبيق "مونوبولي العراق"
// يدير التوجيه بين الشاشات (انضمام / انتظار / لعب) وربط الأحداث بمحرك اللعبة

import './style.css';
import { GameEngine } from './game/engine.js';
import { showModal, closeModal, showToast } from './game/ui.js';
import { renderBoardCells } from './game/boardView.js';
import { getProvince } from './data/provinces.js';
import { BOARD } from './data/board.js';
import {
  playDiceSound, playBuySound, playPaySound, playJailSound,
  toggleMusic, isMusicPlaying,
} from './game/sound.js';
import {
  formatMoney, qs, qsa, timeAgo, getRoomFromUrl, setRoomInUrl, buildShareUrl,
} from './utils/helpers.js';

const app = document.getElementById('app');

let engine = null;
let roomId = null;
let myPlayerId = null;
let isNewRoom = false;
let lastLogCount = 0;

init();

function init() {
  roomId = getRoomFromUrl();
  isNewRoom = !roomId;

  if (!roomId) {
    roomId = GameEngine.createNewRoom();
    setRoomInUrl(roomId);
  }

  engine = new GameEngine(roomId);

  if (!engine.exists()) {
    // رابط غرفة غير موجود على هذا المتصفح/الجهاز (لا يوجد خادم مركزي)
    renderRoomNotFound();
    return;
  }

  myPlayerId = sessionStorage.getItem(playerKey());
  engine.subscribe(onStateChange);
  render();
}

function playerKey() {
  return `monopolyIraq:myPlayer:${roomId}`;
}

function onStateChange(state) {
  render();
  handleTransientEvents(state);
}

function render() {
  const state = engine.state;
  if (!state) return renderRoomNotFound();

  const iAmSeated = myPlayerId && state.players.some((p) => p.id === myPlayerId);

  if (!iAmSeated) {
    renderJoinScreen(state);
  } else if (state.status === 'lobby') {
    renderLobby(state);
  } else {
    renderGame(state);
  }
}

/* =========================================================
   شاشة عدم وجود الغرفة
   ========================================================= */
function renderRoomNotFound() {
  app.innerHTML = `
    <div class="screen-center">
      <div class="landing-card">
        <div class="modal-icon">🏺</div>
        <h1 class="brand-title">لم يتم العثور على الغرفة</h1>
        <p class="hint-text">
          هذا الرابط يخص غرفة لعب محفوظة على متصفح جهاز آخر. بما أن اللعبة لا تستخدم
          خادماً مركزياً (Backend)، تعمل الغرف محلياً داخل نفس المتصفح الذي أُنشئت فيه.
        </p>
        <button class="btn btn-primary" id="btn-new-room">إنشاء غرفة جديدة</button>
      </div>
    </div>
  `;
  qs('#btn-new-room').onclick = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.location.href = url.toString();
  };
}

/* =========================================================
   شاشة الانضمام
   ========================================================= */
function renderJoinScreen(state) {
  const shareUrl = buildShareUrl(roomId);
  app.innerHTML = `
    <div class="screen-center">
      <div class="landing-card">
        <div class="flag-strip"><span></span><span></span><span></span></div>
        <div style="font-size:2.6rem;">🕌🌴</div>
        <h1 class="brand-title">مونوبولي العراق</h1>
        <p class="brand-sub">Monopoly Iraq — جولة عقارية عبر المحافظات</p>

        ${isNewRoom ? `
          <p class="hint-text">تم إنشاء غرفة جديدة! شارك الرابط التالي مع أصدقائك للانضمام:</p>
          <div class="share-box">
            <input type="text" readonly value="${shareUrl}" id="share-input" />
            <button class="btn btn-gold btn-sm" id="btn-copy">نسخ 📋</button>
          </div>
        ` : `
          <p class="hint-text">انضم إلى غرفة اللعب رقم <b>${roomId}</b></p>
        `}

        <label class="field-label">اسمك في اللعبة</label>
        <input type="text" id="name-input" placeholder="مثال: أبو علي" maxlength="16" autocomplete="off" />
        <button class="btn btn-primary" id="btn-join">دخول 🎮</button>

        ${state.players.length > 0 ? `
          <div class="ziggurat-divider"></div>
          <p class="hint-text">اللاعبون الحاليون: ${state.players.map((p) => p.name).join('، ')}</p>
        ` : ''}
      </div>
    </div>
  `;

  const copyBtn = qs('#btn-copy');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard?.writeText(shareUrl).then(() => showToast('تم نسخ رابط الغرفة ✅'));
    };
  }

  const nameInput = qs('#name-input');
  const joinBtn = qs('#btn-join');
  const doJoin = () => {
    const name = nameInput.value.trim();
    if (!name) { showToast('الرجاء إدخال اسمك أولاً'); return; }
    if (state.status !== 'lobby') { showToast('اللعبة بدأت بالفعل، لا يمكن الانضمام الآن'); return; }
    if (state.players.length >= 6) { showToast('الغرفة ممتلئة (6 لاعبين كحد أقصى)'); return; }
    const id = engine.addPlayer(name);
    if (id) {
      myPlayerId = id;
      sessionStorage.setItem(playerKey(), id);
      render();
    }
  };
  joinBtn.onclick = doJoin;
  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
  nameInput.focus();
}

/* =========================================================
   شاشة الانتظار (اللوبي)
   ========================================================= */
function renderLobby(state) {
  const me = state.players.find((p) => p.id === myPlayerId);
  const shareUrl = buildShareUrl(roomId);

  app.innerHTML = `
    <div class="lobby-wrap">
      <div class="lobby-header">
        <div class="flag-strip"><span></span><span></span><span></span></div>
        <h1 class="brand-title">غرفة الانتظار</h1>
        <p class="hint-text">رمز الغرفة: <b>${roomId}</b></p>
      </div>

      <div class="panel">
        <div class="share-box">
          <input type="text" readonly value="${shareUrl}" />
          <button class="btn btn-gold btn-sm" id="btn-copy">نسخ الرابط</button>
        </div>

        <div class="panel-title" style="margin-top:16px;">👥 اللاعبون (${state.players.length}/6)</div>
        <div class="player-chip-list">
          ${state.players.map((p) => `
            <div class="player-chip">
              <span class="avatar-dot" style="background:${p.color}">${p.name[0]}</span>
              ${p.name} ${p.isHost ? '<span class="host-badge">مضيف</span>' : ''}
            </div>
          `).join('')}
        </div>

        ${me?.isHost ? `
          <button class="btn btn-primary" id="btn-start" ${state.players.length < 2 ? 'disabled' : ''}>
            ${state.players.length < 2 ? 'بانتظار لاعب ثانٍ على الأقل...' : '🎲 ابدأ اللعبة'}
          </button>
        ` : `
          <p class="hint-text" style="text-align:center;margin-top:14px;">
            بانتظار أن يبدأ المضيف اللعبة...
          </p>
        `}
      </div>

      <div class="panel" style="margin-top:14px;">
        <div class="panel-title">💬 الدردشة</div>
        <div class="chat-messages scrollbar-styled" id="chat-messages" style="max-height:180px;">
          ${renderChatMessages(state)}
        </div>
        <div class="chat-input-row">
          <input type="text" id="chat-input" placeholder="اكتب رسالة..." maxlength="120" />
          <button class="btn btn-outline btn-sm" id="btn-send-chat">إرسال</button>
        </div>
      </div>
    </div>
  `;

  qs('#btn-copy').onclick = () => {
    navigator.clipboard?.writeText(shareUrl).then(() => showToast('تم نسخ الرابط ✅'));
  };
  const startBtn = qs('#btn-start');
  if (startBtn) startBtn.onclick = () => engine.startGame();

  bindChat(state);
  scrollToBottom('#chat-messages');
}

/* =========================================================
   شاشة اللعب
   ========================================================= */
function renderGame(state) {
  const me = state.players.find((p) => p.id === myPlayerId);
  const current = state.players[state.currentPlayerIndex];
  const isMyTurn = current && current.id === myPlayerId;

  app.innerHTML = `
    <div class="game-shell">
      <div class="topbar">
        <h1 class="brand-title">مونوبولي العراق</h1>
        <div class="topbar-controls">
          <button class="icon-btn ${isMusicPlaying() ? 'active' : ''}" id="btn-music" title="موسيقى">🎵</button>
          <button class="icon-btn" id="btn-share" title="مشاركة الرابط">🔗</button>
        </div>
      </div>

      <div class="board-wrap">
        <div class="board-grid" id="board-grid">
          ${renderBoardCells(state)}
          <div class="board-center">
            <div class="brand-title">مونوبولي<br/>العراق</div>
            <div class="dice-area">
              <div class="dice-row">
                <div class="die" id="die1">${state.lastDice[0]}</div>
                <div class="die" id="die2">${state.lastDice[1]}</div>
              </div>
              <div id="turn-indicator" style="font-weight:700;color:var(--river-dark);"></div>
              <div id="action-panel" class="action-panel"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar">
        <div class="panel players-panel">
          <div class="panel-title">👥 اللاعبون</div>
          <div id="players-list">${renderPlayersList(state)}</div>
          ${state.freeParkingPot ? `<p class="hint-text">💰 وعاء الموقف المجاني: ${formatMoney(state.freeParkingPot)}</p>` : ''}
        </div>

        <div class="panel log-panel">
          <div class="panel-title">📜 سجل الأحداث</div>
          <div class="log-list scrollbar-styled" id="log-list">${renderLog(state)}</div>
        </div>

        <div class="panel chat-panel">
          <div class="panel-title">💬 الدردشة</div>
          <div class="chat-messages scrollbar-styled" id="chat-messages">${renderChatMessages(state)}</div>
          <div class="chat-input-row">
            <input type="text" id="chat-input" placeholder="اكتب رسالة..." maxlength="120" />
            <button class="btn btn-outline btn-sm" id="btn-send-chat">إرسال</button>
          </div>
        </div>
      </div>
    </div>
  `;

  qs('#btn-music').onclick = () => {
    toggleMusic();
    qs('#btn-music').classList.toggle('active', isMusicPlaying());
  };
  qs('#btn-share').onclick = () => {
    navigator.clipboard?.writeText(buildShareUrl(roomId)).then(() => showToast('تم نسخ رابط الغرفة ✅'));
  };

  renderActionPanel(state, current, isMyTurn, me);
  bindChat(state);
  scrollToBottom('#chat-messages');
  scrollToBottom('#log-list');

  if (state.status === 'finished') {
    showGameOverModal(state);
  }
}

function renderPlayersList(state) {
  return state.players.map((p, i) => `
    <div class="player-row ${i === state.currentPlayerIndex ? 'active-turn' : ''} ${p.bankrupt ? 'bankrupt' : ''}">
      <span class="avatar-dot" style="background:${p.color}">${p.name[0]}</span>
      <span class="name">${p.name}${p.id === myPlayerId ? ' (أنت)' : ''}</span>
      ${p.inJail ? '<span class="jail-tag">🚔 سجن</span>' : ''}
      <span class="money">${formatMoney(p.money)}</span>
    </div>
  `).join('');
}

function renderLog(state) {
  if (!state.log.length) return '<div class="empty-state">لا توجد أحداث بعد</div>';
  return state.log.slice(0, 40).map((l) => `<div class="log-item">${l.text}</div>`).reverse().join('');
}

function renderChatMessages(state) {
  if (!state.chat.length) return '<div class="empty-state">لا توجد رسائل بعد، ابدأ الدردشة 👋</div>';
  return state.chat.slice(-50).map((m) => `
    <div class="chat-msg"><b>${m.playerName}:</b> ${escapeHtml(m.text)}
      <span style="opacity:0.5;font-size:0.7rem;"> · ${timeAgo(m.ts)}</span>
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function bindChat(state) {
  const input = qs('#chat-input');
  const btn = qs('#btn-send-chat');
  const me = state.players.find((p) => p.id === myPlayerId);
  const send = () => {
    const text = input.value.trim();
    if (!text || !me) return;
    engine.sendChatMessage(me.name, text);
    input.value = '';
  };
  btn.onclick = send;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
}

function scrollToBottom(sel) {
  const node = qs(sel);
  if (node) node.scrollTop = node.scrollHeight;
}

/* =========================================================
   لوحة إجراءات الدور (رمي النرد / شراء / سجن / إنهاء الدور)
   ========================================================= */
function renderActionPanel(state, current, isMyTurn, me) {
  const panel = qs('#action-panel');
  const turnIndicator = qs('#turn-indicator');
  if (!panel || !current) return;

  if (state.status === 'finished') {
    turnIndicator.textContent = '🏆 انتهت اللعبة';
    panel.innerHTML = '';
    return;
  }

  turnIndicator.textContent = isMyTurn ? 'دورك الآن!' : `دور: ${current.name}`;

  if (!isMyTurn) {
    panel.innerHTML = `<p class="hint-text">بانتظار ${current.name}...</p>`;
    return;
  }

  // في السجن وينتظر قرار
  if (current.inJail && state.turnPhase === 'roll') {
    panel.innerHTML = `
      <button class="btn btn-primary btn-sm" id="act-roll">🎲 حاول الهروب (رمي دبل)</button>
      ${current.getOutOfJailFree > 0 ? `<button class="btn btn-gold btn-sm" id="act-usecard">🎫 استخدم بطاقة خروج</button>` : ''}
      ${current.money >= 100 ? `<button class="btn btn-outline btn-sm" id="act-payfine">💵 ادفع 100 للخروج</button>` : ''}
    `;
    bindActionButtons(state);
    return;
  }

  if (state.turnPhase === 'roll') {
    panel.innerHTML = `<button class="btn btn-primary" id="act-roll">🎲 ارمِ النرد</button>`;
    bindActionButtons(state);
    return;
  }

  if (state.turnPhase === 'action') {
    const space = BOARD[current.position];
    let extra = '';
    if (space.type === 'province' && !state.properties[space.id]) {
      const province = getProvince(space.id);
      if (current.money >= province.price) {
        extra = `<button class="btn btn-gold btn-sm" id="act-buy">🏠 شراء ${province.name} (${formatMoney(province.price)})</button>`;
      }
    }
    panel.innerHTML = `${extra}<button class="btn btn-outline btn-sm" id="act-end">➡️ إنهاء الدور</button>`;
    bindActionButtons(state);
    return;
  }

  panel.innerHTML = `<button class="btn btn-outline btn-sm" id="act-end">➡️ إنهاء الدور</button>`;
  bindActionButtons(state);
}

function bindActionButtons(state) {
  const rollBtn = qs('#act-roll');
  if (rollBtn) rollBtn.onclick = () => doRoll();

  const buyBtn = qs('#act-buy');
  if (buyBtn) buyBtn.onclick = () => {
    if (engine.buyCurrentProperty(myPlayerId)) {
      playBuySound();
      showToast('تم الشراء! 🎉');
    }
  };

  const endBtn = qs('#act-end');
  if (endBtn) endBtn.onclick = () => engine.endTurn(myPlayerId);

  const cardBtn = qs('#act-usecard');
  if (cardBtn) cardBtn.onclick = () => engine.useGetOutOfJailCard(myPlayerId);

  const fineBtn = qs('#act-payfine');
  if (fineBtn) fineBtn.onclick = () => { engine.payJailFine(myPlayerId); playPaySound(); };
}

function doRoll() {
  const dice = [qs('#die1'), qs('#die2')];
  dice.forEach((d) => d?.classList.add('rolling'));
  playDiceSound();
  setTimeout(() => {
    const result = engine.rollDice(myPlayerId);
    if (result?.stayedInJail) playJailSound();
  }, 350);
}

/* =========================================================
   أحداث عابرة: بطاقات فرصة/مجتمع، فوز
   ========================================================= */
function handleTransientEvents(state) {
  if (state.log.length !== lastLogCount) {
    lastLogCount = state.log.length;
  }
  if (state.pendingCard) {
    showCardModal(state.pendingCard);
    state.pendingCard = null; // تُعرض مرة واحدة فقط محلياً
  }
}

function showCardModal(card) {
  const isChance = card.deckType === 'chance';
  showModal(`
    <div class="modal-box">
      <div class="modal-icon">${isChance ? '❓' : '📦'}</div>
      <h3>${isChance ? 'بطاقة فرصة' : 'بطاقة صندوق المجتمع'}</h3>
      <p>${card.text}</p>
      <div class="modal-actions">
        <button class="btn btn-primary" id="card-ok">حسناً</button>
      </div>
    </div>
  `);
  qs('#card-ok').onclick = () => closeModal();
  setTimeout(() => closeModal(), 4000);
}

function showGameOverModal(state) {
  if (document.getElementById('game-over-shown')) return;
  const winner = state.players.find((p) => !p.bankrupt);
  showModal(`
    <div class="modal-box" id="game-over-shown">
      <div class="modal-icon">🏆</div>
      <h3>انتهت اللعبة!</h3>
      <p>الفائز هو <b>${winner ? winner.name : '—'}</b> 🎉</p>
      <div class="modal-actions">
        <button class="btn btn-primary" id="go-new">غرفة جديدة</button>
      </div>
    </div>
  `);
  qs('#go-new').onclick = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.location.href = url.toString();
  };
}
