const express = require('express');
const path = require('path');

const app = express();

// إعدادات استقبال البيانات وقراءتها بصيغة JSON و Form-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// مشاركة كافة الملفات الثابتة (HTML, CSS, JS, الصور) الموجودة في مجلد المشروع
app.use(express.static(__dirname));

// التوجيه التلقائي للمسار الرئيسي إلى صفحة تسجيل الدخول login.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// قراءة المنفذ المخصص من منصة الاستضافة تلقائياً أو الاستماع على المنفذ 3000 محلياً
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running successfully on port ${PORT}`);
});
