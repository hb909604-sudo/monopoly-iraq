// بيانات المحافظات العراقية المستخدمة في اللعبة
// كل محافظة تحتوي على: معرف فريد، اسم، سعر الشراء، الإيجار الأساسي،
// لون المجموعة، ورمز تعبيري مميز يمثلها

export const GROUPS = {
  red:   { name: 'مجموعة بغداد',   color: '#CE1126' },
  green: { name: 'مجموعة الجنوب',  color: '#0E7A3D' },
  black: { name: 'مجموعة الشمال',  color: '#1B1B1B' },
  blue:  { name: 'مجموعة كردستان', color: '#1868A8' },
  gold:  { name: 'مجموعة المراقد', color: '#C79A2E' },
  brown: { name: 'مجموعة الصحراء', color: '#8B5A2B' },
};

export const PROVINCES = [
  { id: 'baghdad',      name: 'بغداد',        price: 400, rent: 50, group: 'red',   icon: '🕌' },
  { id: 'babil',        name: 'بابل',         price: 200, rent: 24, group: 'red',   icon: '🏛️' },
  { id: 'wasit',        name: 'واسط',         price: 160, rent: 18, group: 'red',   icon: '🌾' },

  { id: 'basra',        name: 'البصرة',       price: 320, rent: 40, group: 'green', icon: '⚓' },
  { id: 'dhiqar',       name: 'ذي قار',       price: 140, rent: 16, group: 'green', icon: '🏺' },
  { id: 'maysan',       name: 'ميسان',        price: 140, rent: 16, group: 'green', icon: '🌿' },

  { id: 'nineveh',      name: 'نينوى',        price: 280, rent: 35, group: 'black', icon: '🏰' },
  { id: 'salahaddin',   name: 'صلاح الدين',   price: 200, rent: 24, group: 'black', icon: '🏇' },
  { id: 'dohuk',        name: 'دهوك',         price: 180, rent: 20, group: 'black', icon: '⛰️' },

  { id: 'erbil',        name: 'أربيل',        price: 300, rent: 38, group: 'blue',  icon: '🏯' },
  { id: 'kirkuk',       name: 'كركوك',        price: 220, rent: 26, group: 'blue',  icon: '🔥' },
  { id: 'sulaymaniyah', name: 'السليمانية',   price: 220, rent: 26, group: 'blue',  icon: '🗻' },

  { id: 'najaf',        name: 'النجف',        price: 260, rent: 32, group: 'gold',  icon: '🕋' },
  { id: 'karbala',      name: 'كربلاء',       price: 260, rent: 32, group: 'gold',  icon: '🕌' },
  { id: 'diyala',       name: 'ديالى',        price: 180, rent: 20, group: 'gold',  icon: '🍊' },

  { id: 'anbar',        name: 'الأنبار',      price: 180, rent: 20, group: 'brown', icon: '🏜️' },
  { id: 'muthanna',     name: 'المثنى',       price: 120, rent: 14, group: 'brown', icon: '🐫' },
  { id: 'qadisiyyah',   name: 'القادسية',     price: 140, rent: 16, group: 'brown', icon: '🌴' },
];

export function getProvince(id) {
  return PROVINCES.find((p) => p.id === id);
}
