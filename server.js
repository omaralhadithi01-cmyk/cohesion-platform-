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
    try {
        const { username, password } = req.body || {};

        // بيانات الدخول الخاصة بك
        const MY_USERNAME = 'Omar';
        const MY_PASSWORD = '1234@@5678'; // ضع كلمة المرور التي اخترتها هنا

        if (username === MY_USERNAME && password === MY_PASSWORD) {
            return res.json({ success: true, redirectUrl: '/dashboard.html' });
        }

        return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
});

// قراءة المنفذ الديناميكي الخاص بـ Railway تلقائياً
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running successfully on port ${PORT}`);
});
