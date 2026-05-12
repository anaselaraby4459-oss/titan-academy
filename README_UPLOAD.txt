# Titan Academy - Organized Smart Automation Package

هذه النسخة تضيف تنظيمًا ذكيًا بدون حذف المميزات الموجودة.

## الملفات

- `index.html` الصفحة الرئيسية
- `admin.html` لوحة الإدارة
- `student.html` لوحة الطالب
- `parent.html` لوحة ولي الأمر
- `manifest.webmanifest`
- `service-worker.js`
- `firebase-rules.json`

## المميزات الجديدة

- مركز الإدارة الذكي داخل لوحة الإدارة.
- ملف طالب 360° يجمع البيانات والفواتير والدرجات والنشاط والشهادات والملاحظات.
- مساعد إداري يعطي توصيات تلقائية للطلاب المتأخرين أو أصحاب المديونيات أو الدرجات الضعيفة.
- مهام للفريق مع أولوية ومسؤول وتاريخ.
- ملاحظات داخلية على الطالب لا تظهر للطالب.
- قوالب رسائل WhatsApp جاهزة.
- إدارة الجلسات بشكل آمن بدون فصل مفاجئ.
- تنبيه اتصال Offline / Online.
- دعم خاص بين الطالب/ولي الأمر والإدارة.
- خطة متابعة ذكية للطالب.

## طريقة الرفع

ارفع الملفات كما هي على GitHub Pages.

ثم افتح Firebase Console → Realtime Database → Rules، وانسخ محتوى `firebase-rules.json` واضغط Publish.

بعد الرفع اعمل Ctrl + F5. لو ظهرت نسخة قديمة: DevTools → Application → Service Workers → Unregister.
