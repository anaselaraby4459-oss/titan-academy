# Titan V16 Split Package

تم تقسيم ملفات المنصة إلى HTML + CSS + JavaScript لتقليل حجم صفحات HTML وتسهيل الصيانة.

## هيكل الملفات

- `index.html`
- `admin_secure_live_classroom_v15_customization_studio.html`
- `student_secure_live_classroom_v15_customization_studio.html`
- `parent_portal_v15_customization_studio.html`
- `assets/css/index.css`
- `assets/css/admin.css`
- `assets/css/student.css`
- `assets/css/parent.css`
- `assets/js/index.js`
- `assets/js/admin.js`
- `assets/js/student.js`
- `assets/js/parent.js`
- `manifest.webmanifest`
- `service-worker.js`
- `firebase_database_rules_saas_v16_features_pack.json`

## طريقة الرفع على GitHub Pages

ارفع كل محتويات هذا الفولدر إلى Root الريبو كما هي، مع الحفاظ على فولدر `assets`.

مهم: لا ترفع ملف قواعد Firebase كصفحة ويب. افتح Firebase Console > Realtime Database > Rules ثم الصق محتوى:

`firebase_database_rules_saas_v16_features_pack.json`

ثم اضغط Publish.

## ملاحظة مهمة

لا تغير أسماء الملفات الأساسية لأن `index.html` يوجه إلى نفس أسماء صفحات الطالب والإدارة وولي الأمر.
