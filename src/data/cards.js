// بطاقات فرصة وصندوق المجتمع بطابع عراقي
// effect.kind: 'receive' | 'pay' | 'goto' | 'gotoJailFree' | 'move' | 'jail' | 'collectFromAll' | 'payAll'

export const CHANCE_CARDS = [
  { text: 'ربحت مسابقة المقام العراقي! اجمع 100', effect: { kind: 'receive', amount: 100 } },
  { text: 'غرامة تجاوز سرعة على جسر الجمهورية، ادفع 50', effect: { kind: 'pay', amount: 50 } },
  { text: 'تقدم إلى بغداد مباشرة', effect: { kind: 'goto', id: 'baghdad' } },
  { text: 'رحلة عمل إلى البصرة، انتقل إلى هناك', effect: { kind: 'goto', id: 'basra' } },
  { text: 'بطاقة "اخرج من السجن مجاناً" - احتفظ بها', effect: { kind: 'gotoJailFree' } },
  { text: 'تم القبض عليك بدون تذكرة مسبقة، اذهب إلى السجن', effect: { kind: 'jail' } },
  { text: 'ورثت بستان نخيل في الديوانية، اجمع 150', effect: { kind: 'receive', amount: 150 } },
  { text: 'ادفع رسوم صيانة الطرق: 40', effect: { kind: 'pay', amount: 40 } },
  { text: 'فزت بجائزة أفضل مطعم مسگوف، اجمع 75', effect: { kind: 'receive', amount: 75 } },
  { text: 'تراجع 3 مربعات إلى الخلف', effect: { kind: 'move', steps: -3 } },
];

export const COMMUNITY_CARDS = [
  { text: 'عيدية العيد! اجمع 100 من كل لاعب', effect: { kind: 'collectFromAll', amount: 100 } },
  { text: 'فاتورة كهرباء متأخرة، ادفع 60', effect: { kind: 'pay', amount: 60 } },
  { text: 'بعت محصول التمور بسعر ممتاز، اجمع 120', effect: { kind: 'receive', amount: 120 } },
  { text: 'ساهمت في إعمار مدرستك، ادفع 50 لكل لاعب', effect: { kind: 'payAll', amount: 50 } },
  { text: 'فزت بجائزة "أجمل بيت عراقي تراثي"، اجمع 200', effect: { kind: 'receive', amount: 200 } },
  { text: 'خطأ في التحويل البنكي لصالحك، اجمع 50', effect: { kind: 'receive', amount: 50 } },
  { text: 'مصاريف علاج، ادفع 100', effect: { kind: 'pay', amount: 100 } },
  { text: 'بطاقة "اخرج من السجن مجاناً" - احتفظ بها', effect: { kind: 'gotoJailFree' } },
  { text: 'رحلة حج إلى كربلاء، انتقل إليها', effect: { kind: 'goto', id: 'karbala' } },
  { text: 'استلمت راتبك التقاعدي، اجمع 100', effect: { kind: 'receive', amount: 100 } },
];
