// تخطيط اللوحة: 28 مربعاً حول اللوحة (7 على كل ضلع)
// كل مربع إما محافظة أو مربع خاص

export const PASS_START_BONUS = 200;
export const JAIL_FINE = 100;

// ترتيب المربعات بحيث تقع المربعات الخاصة (السجن، الموقف المجاني، اذهب للسجن)
// على زوايا اللوحة تماماً كما في مونوبولي الأصلية (شبكة 8×8، الزوايا كل 7 مربعات)
export const BOARD = [
  { type: 'start' },                                    // 0  - زاوية
  { type: 'province', id: 'baghdad' },                   // 1
  { type: 'community' },                                 // 2
  { type: 'province', id: 'babil' },                     // 3
  { type: 'province', id: 'wasit' },                     // 4
  { type: 'tax', name: 'ضريبة الكمارك', amount: 75 },     // 5
  { type: 'province', id: 'basra' },                     // 6
  { type: 'jail' },                                      // 7  - زاوية
  { type: 'province', id: 'dhiqar' },                    // 8
  { type: 'chance' },                                    // 9
  { type: 'province', id: 'maysan' },                    // 10
  { type: 'province', id: 'anbar' },                     // 11
  { type: 'province', id: 'muthanna' },                  // 12
  { type: 'province', id: 'qadisiyyah' },                // 13
  { type: 'free_parking' },                              // 14 - زاوية
  { type: 'province', id: 'nineveh' },                   // 15
  { type: 'community' },                                 // 16
  { type: 'province', id: 'salahaddin' },                // 17
  { type: 'province', id: 'dohuk' },                     // 18
  { type: 'province', id: 'diyala' },                    // 19
  { type: 'province', id: 'karbala' },                   // 20
  { type: 'goto_jail' },                                 // 21 - زاوية
  { type: 'chance' },                                    // 22
  { type: 'province', id: 'najaf' },                     // 23
  { type: 'province', id: 'erbil' },                     // 24
  { type: 'tax', name: 'ضريبة الدخل', amount: 100 },      // 25
  { type: 'province', id: 'kirkuk' },                    // 26
  { type: 'province', id: 'sulaymaniyah' },               // 27
];

export const BOARD_SIZE = BOARD.length; // 28
