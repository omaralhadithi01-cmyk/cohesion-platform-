const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
    try {
        const { username, password } = req.body || {};

        // اسم المستخدم وكلمة المرور الرسمية للنظام
        const MY_USERNAME = 'Omar';
        const MY_PASSWORD = '12345678';

        if (username === MY_USERNAME && password === MY_PASSWORD) {
            return res.json({ success: true, redirectUrl: '/dashboard.html' });
        }

        return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running successfully on port ${PORT}`);
});
