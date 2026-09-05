# PROJECT_MAP — لعبة الألغاز "العاز"

## [PROJECT_SCALE]
multi-file — وفق سياق النشر التقني الثابت (Capacitor / iOS عبر GitHub Actions، بدون Mac محلي).

## [TECH_STACK]
- **الرون-تايم**: HTML5 / CSS3 / Vanilla JavaScript (بدون build tooling ثقيل)
- **Native wrapper**: Capacitor 8.5.0 ([core], [ios], [cli])
- **البناء**: GitHub Actions على macOS runner → xcodebuild مع `CODE_SIGNING_ALLOWED=NO` → `App-unsigned.ipa`
- **التخزين**: localStorage (تقدم اللاعب)
- **الصور**: ملفات محلية داخل `www/assets/images/` (أعلام/معالم/مدن) — تعمل بلا إنترنت

## [SYSTEM_FLOW]
1. المستخدم يفتح التطبيق → شاشة ترحيب (تصميم أنيق + اختيار اللغة عربي/إنجليزي)
2. اختيار اللغة → شاشة المستويات (شبكة 50 مرحلة، المفتوحة فقط قابلة للنقر)
3. دخول مستوى → لوحة ألغاز "حروف مبعثرة" مع سؤال + تلميح بالصورة
4. المستخدم يرتب الحروف لتكوين الجواب الصحيح
5. تحقق: نجاح → أنيميشن + فتح المستوى التالي وحفظ التقدم | فشل → إنقاص المحاولات/تلميح
6. إكمال المراحل → رسالة إنجاز

## [ARCHITECTURE]
```
F:\BARONN/
├── www/
│   ├── index.html          ← نقطة الدخول
│   ├── css/style.css       ← التصميم والأنيميشن
│   ├── js/
│   │   ├── main.js         ← منطق اللعبة والتحكم
│   │   ├── levels.js       ← بيانات الـ 50 مستوى (عربي/إنجليزي)
│   │   └── i18n.js         ← ترجمة الواجهة
│   ├── assets/images/      ← الصور المحلية
│   └── icons/              ← أيقونات التطبيق
├── package.json            ← Capacitor (للبناء في Actions فقط)
├── capacitor.config.json
├── .github/workflows/build-ipa.yml
└── PROJECT_MAP.md
```
- **Shared/Core**: منطق مشترك حقيقي فقط (ترتيب الحروف، حفظ التقدم) — لا تفتيت مفرط.
- ملاحظة: رغم التصنيف multi-file، الكود داخل `www/` يبقى ويب بسيط متوافق مع Capacitor مباشرة.

## [MILESTONES]
| # | الوصف | الحالة | معيار النجاح |
|---|-------|--------|--------------|
| M1 | البنية Multi-file + Capacitor + GitHub Actions build-ipa | ✅ مكتمل | workflow يحوّل www/ إلى ipa غير موقَّع |
| M2 | تحميل الصور (50 × لغتين) محلياً | ✅ مكتمل | 50 علم دولة محلي في assets/images/ (PNG صالح، بلا إنترنت) |
| M3 | بيانات 50 مستوى ثنائية اللغة | ✅ مكتمل | levels.js: 50 مستوى - 25 عاصمة/15 علم/10 مدن، كل بصورة فريدة، عربي+إنجليزي، بلا placeholders |
| M4 | واجهة اللعبة HTML/CSS + أنيميشن | ✅ مكتمل | index.html (3 شاشات) + style.css (أنيميشن سلس) + i18n.js (ثنائية اللغة) — الأقواس متوازنة، كل الـ IDs متسقة |
| M5 | منطق اللعب + ثنائية اللغة + حفظ التقدم | ✅ مكتمل | main.js: حروف مبعثرة، تحقق، تلميحات/خلط/مسح، محاولات، قصاصات، حفظ في localStorage — الأقواس متوازنة وكل المراجع موجودة |

## [ORPHANS & PENDING]
- PENDING: إصلاح بناء xcodebuild في Actions — Capacitor 8 يولّد `App.xcodeproj` (SPM) بدل `App.xcworkspace`؛ عدّلت بالبديل. بانتظار push وإعادة المحاولة.
