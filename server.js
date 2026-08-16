const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// إعداد قاعدة البيانات (ملف محلي باسم chat.db)
const db = new sqlite3.Database('./chat.db');
db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, text TEXT, time TEXT)");

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>منصة التماسك - الأنبار</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            body { background: #0f172a; color: white; font-family: sans-serif; padding: 20px; }
            .container { display: grid; grid-template-columns: 1fr 350px; gap: 20px; }
            .chat-box { height: 400px; background: #1e293b; padding: 15px; border-radius: 8px; overflow-y: auto; border: 1px solid #334155; }
            .msg { margin-bottom: 10px; border-bottom: 1px solid #334155; padding-bottom: 5px; }
            .msg b { color: #38bdf8; }
            input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: none; box-sizing: border-box; }
            button { width: 100%; padding: 10px; margin-top: 10px; background: #0284c7; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h2>🦅 منصة التماسك المجتمعي - مع الأرشفة</h2>
        <div class="container">
            <div class="main-panel"><h3>لوحة التحكم</h3></div>
            <div class="chat-panel">
                <h3>📡 غرفة التراسل (مؤرشفة)</h3>
                <div id="chatMessages" class="chat-box"></div>
                <input type="text" id="username" placeholder="اسمك / صفتك...">
                <input type="text" id="chatInput" placeholder="اكتب رسالة...">
                <button onclick="send()">إرسال</button>
            </div>
        </div>

        <script>
            const socket = io();
            const box = document.getElementById('chatMessages');

            function send() {
                const user = document.getElementById('username').value || 'ميداني';
                const text = document.getElementById('chatInput').value;
                if(!text) return;
                socket.emit('chat_message', { sender: user, text: text, time: new Date().toLocaleTimeString('ar-IQ') });
                document.getElementById('chatInput').value = '';
            }

            // استقبال رسالة جديدة
            socket.on('chat_message', (data) => {
                box.innerHTML += '<div class="msg"><b>'+data.sender+' ('+data.time+'):</b><br>'+data.text+'</div>';
                box.scrollTop = box.scrollHeight;
            });

            // تحميل الرسائل القديمة عند فتح الصفحة
            socket.on('load_messages', (messages) => {
                messages.forEach(msg => {
                    box.innerHTML += '<div class="msg"><b>'+msg.sender+' ('+msg.time+'):</b><br>'+msg.text+'</div>';
                });
                box.scrollTop = box.scrollHeight;
            });
        </script>
    </body>
    </html>
    `);
});

// منطق التراسل مع الحفظ
io.on('connection', (socket) => {
    // تحميل الرسائل من قاعدة البيانات عند الاتصال
    db.all("SELECT * FROM messages ORDER BY id DESC LIMIT 20", [], (err, rows) => {
        socket.emit('load_messages', rows.reverse());
    });

    socket.on('chat_message', (data) => {
        db.run("INSERT INTO messages (sender, text, time) VALUES (?, ?, ?)", [data.sender, data.text, data.time]);
        io.emit('chat_message', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('✅ الخادم يعمل مع الأرشفة على المنفذ ' + PORT);
});