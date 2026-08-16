const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const DATA_FILE = path.join(__dirname, 'data.json');

// ذاكرة مؤقتة لضمان عمل السيرفر بنسبة 100% حتى لو فشل التخزين الملفي
let memoryDb = {
    users: [
        { id: 1, username: 'admin', password: 'admin123', full_name: 'مدير النظام', role: 'مدير النظام' },
        { id: 2, username: 'user', password: 'user123', full_name: 'مراقب ميداني', role: 'مراقب ميداني' }
    ],
    reports: []
};

// تحميل البيانات بأمان تامة
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            if (data && data.users) {
                return data;
            }
        }
    } catch (e) {
        console.error("خطأ في قراءة ملف البيانات، الاعتماد على الذاكرة المؤقتة:", e);
    }
    return memoryDb;
}

// حفظ البيانات بأمان
function saveData(data) {
    memoryDb = data; // تحديث الذاكرة أولاً
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("لا يمكن الكتابة على الملف، سيتم الحفظ في الذاكرة المؤقتة:", e);
    }
}

// تهيئة الملف عند البدء
try {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDb, null, 2));
    }
} catch (e) {
    console.log("تشغيل بوضع الذاكرة المؤقتة فقط.");
}

// التوجيه التلقائي لصفحة تسجيل الدخول
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// مسار تسجيل الدخول (مضمون 100%)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const dbData = loadData();
    const user = dbData.users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ success: true, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } });
    } else {
        res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
});

// جلب البلاغات مع التصفية
app.get('/api/reports', (req, res) => {
    const { district, severity } = req.query;
    const dbData = loadData();
    let reports = dbData.reports || [];

    if (district && district !== 'الكل') {
        reports = reports.filter(r => r.district === district);
    }
    if (severity && severity !== 'الكل') {
        reports = reports.filter(r => r.severity === severity);
    }

    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(reports);
});

// إضافة بلاغ جديد
app.post('/api/reports', (req, res) => {
    const { title, description, severity, district, lat, lng } = req.body;
    const dbData = loadData();
    
    const newReport = {
        id: dbData.reports.length > 0 ? dbData.reports[dbData.reports.length - 1].id + 1 : 1,
        title,
        description,
        severity,
        district,
        lat: lat || 33.3152,
        lng: lng || 44.3661,
        created_at: new Date().toISOString()
    };

    dbData.reports.push(newReport);
    saveData(dbData);

    res.json({ success: true, ...newReport });
});

// تحليلات البيانات
app.get('/api/analytics', (req, res) => {
    const dbData = loadData();
    const reports = dbData.reports || [];

    const severityMap = {};
    const districtMap = {};

    reports.forEach(r => {
        severityMap[r.severity] = (severityMap[r.severity] || 0) + 1;
        districtMap[r.district] = (districtMap[r.district] || 0) + 1;
    });

    const severityStats = Object.keys(severityMap).map(severity => ({ severity, count: severityMap[severity] }));
    const districtStats = Object.keys(districtMap).map(district => ({ district, count: districtMap[district] }));

    res.json({ severityStats, districtStats });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});