const express = require('express');
const path = require('path');

const app = express();

// استقبال وقراءة البيانات بصيغة JSON و Form Data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تقديم جميع الملفات الثابتة (HTML, CSS, JS) من المجلد الرئيسي
app.use(express.static(__dirname));

// التوجيه للصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// مسار معالجة تسجيل الدخول (API)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // يمكنك تعديل اسم المستخدم وكلمة المرور حسب الحاجة
    if (username === 'admin' && password === 'admin') {
        return res.json({ success: true, redirectUrl: '/dashboard.html' });
    }

    return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
});

// قراءة المنفذ الديناميكي الخاص بـ Railway تلقائياً
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running successfully on port ${PORT}`);
});
