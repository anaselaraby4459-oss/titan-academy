# إصلاح دخول الإدارة

سبب المشكلة كان خطأ JavaScript داخل admin.html بسبب دمج CSS داخل string للطباعة. هذا كان يمنع تحميل سكربت الإدارة بالكامل، لذلك لا تظهر لوحة الإدارة حتى لو الحساب صحيح.

الرفع:
1. ارفع كل الملفات مكان القديمة.
2. انسخ firebase-rules.json إلى Firebase Console > Realtime Database > Rules ثم Publish.
3. افتح admin.html?tenant=titan.
4. اعمل Ctrl+F5.
5. لو المشكلة مستمرة: DevTools > Application > Service Workers > Unregister.

لو ظهر auth/unauthorized-domain: أضف الدومين الحالي في Firebase Authentication > Settings > Authorized domains.
