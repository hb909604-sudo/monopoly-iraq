// طبقة التخزين: تحفظ حالة كل غرفة لعب داخل LocalStorage
// وتستخدم حدث "storage" لمزامنة التبويبات المفتوحة على نفس المتصفح
// (لا يوجد Backend، لذا المزامنة الحقيقية تعمل بين تبويبات/نوافذ نفس الجهاز فقط)

const PREFIX = 'monopolyIraq:room:';
const ROOMS_INDEX_KEY = 'monopolyIraq:rooms';

export function roomKey(roomId) {
  return `${PREFIX}${roomId}`;
}

export function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function saveRoom(roomId, state) {
  state.updatedAt = Date.now();
  localStorage.setItem(roomKey(roomId), JSON.stringify(state));
  registerRoom(roomId);
}

export function loadRoom(roomId) {
  const raw = localStorage.getItem(roomKey(roomId));
  return raw ? JSON.parse(raw) : null;
}

export function deleteRoom(roomId) {
  localStorage.removeItem(roomKey(roomId));
  const rooms = listRooms().filter((r) => r !== roomId);
  localStorage.setItem(ROOMS_INDEX_KEY, JSON.stringify(rooms));
}

function registerRoom(roomId) {
  const rooms = listRooms();
  if (!rooms.includes(roomId)) {
    rooms.push(roomId);
    localStorage.setItem(ROOMS_INDEX_KEY, JSON.stringify(rooms));
  }
}

export function listRooms() {
  const raw = localStorage.getItem(ROOMS_INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

// يستدعي callback في أي وقت تتغيّر فيه حالة الغرفة المحددة
// (سواء من هذا التبويب أو من تبويب آخر لنفس المتصفح)
export function onRoomChange(roomId, callback) {
  const handler = (e) => {
    if (e.key === roomKey(roomId)) {
      const state = e.newValue ? JSON.parse(e.newValue) : null;
      callback(state);
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
