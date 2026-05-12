Titan Academy Live Server Legacy Fix

المشكلة كانت بسبب فتح ملفات قديمة باسماء طويلة مثل:
student_secure_live_classroom_v15_customization_studio_fix1.html
هذه الملفات القديمة تحتوي JavaScript مكسور على Live Server.

الحل في هذه الحزمة:
- الملفات المنظمة الاساسية: index.html, admin.html, student.html, parent.html
- الملفات القديمة موجودة كتحويل آمن فقط، لكي لا تفتح النسخ المكسورة.

طريقة الاستخدام:
1) احذف كل ملفات HTML القديمة من مجلد المشروع أو استبدلها بالملفات الموجودة هنا.
2) انسخ كل محتويات هذه الحزمة مكانها.
3) افتح:
   http://127.0.0.1:5500/student.html?tenant=titan
   http://127.0.0.1:5500/admin.html?tenant=titan
   http://127.0.0.1:5500/parent.html?tenant=titan
4) لو فتحت رابط قديم سيتم تحويلك تلقائيا للملف الجديد.
5) من DevTools > Application > Service Workers اضغط Unregister ثم Ctrl+F5.
