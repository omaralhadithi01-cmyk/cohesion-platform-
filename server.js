const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

let db;

const districtCoords = {
    'الرمادي': [33.4202, 43.3033],
    'الفلوجة': [33.3536, 43.7781],
    'هيت': [33.6403, 42.8256],
    'حديثة': [34.1381, 42.3781],
    'القائم': [34.3828, 41.0772],
    'بغداد': [33.3152, 44.3661]
};

(async () => {
    try {
        db = await open({
            filename: path.join(__dirname, 'database.db'),
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                severity TEXT NOT NULL,
                district TEXT NOT NULL,
                lat REAL,
                lng REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL
            )
        `);

        const userCount = await db.get('SELECT COUNT(*) as count FROM users');
        if (userCount.count === 0) {
            await db.run(`
                INSERT INTO users (username, password, full_name, role) VALUES 
                ('admin', 'admin123', 'مدير النظام', 'مدير النظام'),
                ('user', 'user123', 'مراقب ميداني', 'مراقب ميداني')
            `);
        }

        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح.');
    } catch (dbError) {
        console.error('❌ خطأ في تهيئة قاعدة البيانات:', dbError.message);
    }
})();

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get('SELECT id, username, full_name, role FROM users WHERE username = ? AND password = ?', [username, password]);
        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/reports', async (req, res) => {
    const { district, severity } = req.query;
    let query = 'SELECT * FROM reports WHERE 1=1';
    const params = [];

    if (district && district !== 'الكل') {
        query += ' AND district = ?';
        params.push(district);
    }
    if (severity && severity !== 'الكل') {
        query += ' AND severity = ?';
        params.push(severity);
    }

    query += ' ORDER BY created_at DESC';

    try {
        const reports = await db.all(query, params);
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reports', async (req, res) => {
    const { title, description, severity, district, lat, lng } = req.body;
    
    let finalLat = lat;
    let finalLng = lng;

    if (!finalLat || !finalLng) {
        const coords = districtCoords[district] || [33.3152 + (Math.random() - 0.5) * 0.1, 43.3033 + (Math.random() - 0.5) * 0.1];
        finalLat = coords[0];
        finalLng = coords[1];
    }

    try {
        const result = await db.run(
            `INSERT INTO reports (title, description, severity, district, lat, lng) VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description, severity, district, finalLat, finalLng]
        );
        res.json({ success: true, id: result.lastID, title, description, severity, district, lat: finalLat, lng: finalLng });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/analytics', async (req, res) => {
    try {
        const severityStats = await db.all(`SELECT severity, COUNT(*) as count FROM reports GROUP BY severity`);
        const districtStats = await db.all(`SELECT district, COUNT(*) as count FROM reports GROUP BY district`);
        res.json({ severityStats, districtStats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر يعمل على المنفذ: ${PORT}`);
});