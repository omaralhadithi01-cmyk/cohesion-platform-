const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// إضافة هذا السطر لجعل التراسل يعمل بشكل متوافق مع Railway
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>منصة التماسك - الأنبار</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            body { background: #0f172a; color: white; font-family: sans-serif; padding: 10px; }
            .chat-box { height: 300px; background: #1e293b; padding: 10px; border-radius: 8px; overflow-y: auto; border: 1px solid #334155; }
            .msg { margin-bottom: 8px; border-bottom: 1px solid #334155; font-size: 14px; }
            input { width: 100%; padding: 8px; margin: 5px 0; border-radius: 4px; border: none; box-sizing: border-box; }
            button { width: 100%; padding: 10px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h3>📡 التراسل الفوري</h3>
        <div id="chatBox" class="chat-box"></div>
        <input type="text" id="username" placeholder="الاسم/الصفة">
        <input type="text" id="chatInput" placeholder="اكتب رسالة...">
        <button onclick="send()">إرسال</button>
        <script>
            const socket = io();
            function send() {
                const user = document.getElementById('username').value || 'ميداني';
                const text = document.getElementById('chatInput').value;
                if(!text) return;
                socket.emit('chat_message', { sender: user, text: text });
                document.getElementById('chatInput').value = '';
            }
            socket.on('chat_message', (data) => {
                const box = document.getElementById('chatBox');
                box.innerHTML += '<div class="msg"><b>'+data.sender+':</b> '+data.text+'</div>';
                box.scrollTop = box.scrollHeight;
            });
        </script>
    </body>
    </html>
    `);
});

io.on('connection', (socket) => {
    socket.on('chat_message', (data) => {
        io.emit('chat_message', data);
    });
});

server.listen(port, () => {
    console.log('✅ الخادم يعمل بنجاح على المنفذ ' + port);
});