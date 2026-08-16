const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const DATA_FILE = path.join(__dirname, 'data.json');

// تحميل أو إنشاء البيانات الأولية
function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            users: [
                { id: 1, username: 'admin', password: 'admin123', full_name: 'مدير النظام', role: 'مدير النظام' },
                { id: 2, username: 'user', password: 'user123', full_name: 'مراقب ميداني', role: 'مراقب ميداني' }
            ],
            reports: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return data;
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const districtCoords = {
    'الرمادي': [33.4202, 43.3033],
    'الفلوجة': [33.3536, 43.7781],
    'هيت': [33.6403, 42.8256],
    'حديثة': [34.1381, 42.3781],
    'القائم': [34.3828, 41.0772],
    'بغداد': [33.3152, 44.3661]
};

// مسار تسجيل الدخول
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
    let reports = dbData.reports;

    if (district && district !== 'الكل') {
        reports = reports.filter(r => r.district === district);
    }
    if (severity && severity !== 'الكل') {
        reports = reports.filter(r => r.severity === severity);
    }

    // ترتيب تنازلي حسب الأحدث
    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(reports);
});

// إضافة بلاغ جديد
app.post('/api/reports', (req, res) => {
    const { title, description, severity, district, lat, lng } = req.body;
    const dbData = loadData();
    
    let finalLat = lat;
    let finalLng = lng;

    if (!finalLat || !finalLng) {
        const coords = districtCoords[district] || [33.3152 + (Math.random() - 0.5) * 0.1, 43.3033 + (Math.random() - 0.5) * 0.1];
        finalLat = coords[0];
        finalLng = coords[1];
    }

    const newReport = {
        id: dbData.reports.length > 0 ? dbData.reports[dbData.reports.length - 1].id + 1 : 1,
        title,
        description,
        severity,
        district,
        lat: finalLat,
        lng: finalLng,
        created_at: new Date().toISOString()
    };

    dbData.reports.push(newReport);
    saveData(dbData);

    res.json({ success: true, ...newReport });
});

// تحليلات البيانات للرسوم البيانية
app.get('/api/analytics', (req, res) => {
    const dbData = loadData();
    const reports = dbData.reports;

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر يعمل على المنفذ: ${PORT} وبدون أخطاء قاعدة البيانات.`);
});