إصلاح دخول الإدارة

إذا لم تفتح لوحة الإدارة بعد تسجيل الدخول:
1) افتح الرابط: admin.html?tenant=titan
2) تأكد أن UID حساب الإدارة موجود في Realtime Database في واحد من هذه المسارات:
   tenants/titan/admins/UID = true
   أو super_admins/UID = true
   أو user_tenants/UID/titan = admin
3) انسخ firebase-rules.json إلى Firebase Console > Realtime Database > Rules ثم Publish.
4) اعمل Ctrl + F5. لو الكاش قديم: DevTools > Application > Service Workers > Unregister.

تم تعديل admin.html بحيث لا يعمل signOut تلقائيًا عند فشل صلاحية الإدارة، ويعرض UID و tenant لتسهيل الإصلاح.
