
import './App.css';
import { useEffect } from 'react';
import $ from 'jquery';


function App() {
  useEffect(() => {
    const canvas = document.getElementById('floorPlan');
    const ctx = canvas.getContext('2d');
    let rooms = [];
    let editingMode = false;
    let resize = false;
    let selectedRoom = null;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    // 例: offsetXとoffsetYを使用する
    console.log(offsetX, offsetY);


    function drawRoom(room) {
        ctx.fillStyle = room.color;
        ctx.strokeStyle = room.color;
        ctx.lineWidth = 2;

        ctx.save();
        ctx.translate(room.x + (room.width || 0) / 2, room.y + (room.height || 0) / 2);
        ctx.rotate(room.rotation || 0);
        ctx.translate(-(room.x + (room.width || 0) / 2), -(room.y + (room.height || 0) / 2));

        if (room.type === 'square') {
            ctx.fillRect(room.x, room.y, room.width, room.height);
        } else if (room.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(room.x, room.y);
            ctx.lineTo(room.endX, room.endY);
            ctx.stroke();
        } else if (room.type === 'text') {
            ctx.font = '20px Arial';
            ctx.fillText(room.text, room.x, room.y);
        } else if (room.type === 'Vertical_text') { // 縦書きテキストの描画
            ctx.font = '20px Arial';
            for (let i = 0; i < room.text.length; i++) {
                ctx.fillText(room.text[i], room.x, room.y + i * 22); // 縦方向に文字を配置
            }
        }
        ctx.restore();
    }

    function redrawRooms() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rooms.forEach(drawRoom);
    }

    function selectRoom(x, y) {
        for (let room of rooms) {
            if (room.type === 'square' && x >= room.x && x <= room.x + room.width && y >= room.y && y <= room.y + room.height) {
                return room;
            }  else if (room.type === 'line' && x >= room.x && x <= room.endX && y >= room.y - 5 && y <= room.y + 5) {
                return room;
            } else if (room.type === 'Vertical_text' && x >= room.x && x <= room.x + 20 && y >= room.y && y <= room.y + 22 * room.text.length) {
                return room;
            } else if (room.type === 'text' && x >= room.x && x <= room.x + ctx.measureText(room.text).width && y >= room.y - 20 && y <= room.y) {
                return room;
            }
        }
        return null;
    }

    canvas.addEventListener('click', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (editingMode) {
            selectedRoom = selectRoom(x, y);
            if (selectedRoom) {
                document.getElementById('roomColor').value = selectedRoom.color;
                document.getElementById('textInput').value = selectedRoom.text || '';
            }
        }else if(resize){
            selectedRoom = selectRoom(x, y); 
            if (selectedRoom) {
                document.getElementById('roomColor').value = selectedRoom.color;
                document.getElementById('textInput').value = selectedRoom.text || '';
            }
        }
        else {
            const color = document.getElementById('roomColor').value;
            const shape = document.getElementById('shape').value;
            const text = document.getElementById('textInput').value;

            if (shape === 'square') {
                const width = 100, height = 50;
                ctx.fillRect(x, y, width, height);
                rooms.push({ type: 'square', x, y, width, height, color });
            } else if (shape === 'line') {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 100, y);
                ctx.stroke();
                rooms.push({ type: 'line', x, y, endX: x + 100, endY: y, color });
            } else if (shape === 'text') {
                ctx.font = '20px Arial';
                ctx.fillText(text, x, y);
                rooms.push({ type: 'text', x, y, text, color });
            } else if (shape === 'Vertical_text') {
                rooms.push({ type: 'Vertical_text', x, y, text, color });
                for (let i = 0; i < text.length; i++) {
                    ctx.fillText(text[i], x, y + i * 22);
                }
            }
            redrawRooms();
        }
    });

    document.getElementById('editbutton').addEventListener('click', function() {
        editingMode = !editingMode;
        if (editingMode) {
            resize = false;
            canvas.style.backgroundColor = 'rgba(255, 255, 0, 0.1)';
        } else {
            canvas.style.backgroundColor = 'white';
            selectedRoom = null;
        }
    });

    document.getElementById('resizebutton').addEventListener('click', function() {
        resize = !resize;
        if (resize) {
            editingMode = false;
            canvas.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        } else {
            canvas.style.backgroundColor = 'white';
            selectedRoom = null;
        }
    });

    canvas.addEventListener('mousedown', function(event) {
        if (selectedRoom) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            offsetX = x - selectedRoom.x;
            offsetY = y - selectedRoom.y;
            isDragging = true;
        }
        if (true) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            selectedRoom = selectRoom(x, y);
            isDragging = selectedRoom !== null;
        }
    });

    canvas.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (isDragging && selectedRoom && editingMode) {  
            const offsetX = x - selectedRoom.x;
            const offsetY = y - selectedRoom.y;
            selectedRoom.x += offsetX;
            selectedRoom.y += offsetY;
            selectedRoom.endX += offsetX;
            selectedRoom.endY += offsetY;
        }else if(isDragging && selectedRoom && resize){
            if (selectedRoom.type === 'line') {
                // ラインのリサイズ処理
                selectedRoom.endX = Math.max(x, selectedRoom.x + 10); // 終点を始点の右側に設定
                selectedRoom.endY = y; // 縦の位置を更新
            } else {
                // 他の図形のリサイズ処理
                selectedRoom.width = Math.max(x - selectedRoom.x, 10);  // 幅を10以上に制限
                selectedRoom.height = Math.max(y - selectedRoom.y, 10); // 高さを10以上に制限
            }

        }
        redrawRooms();
    });

    canvas.addEventListener('mouseup', function(event) {
        isDragging = false;
        
    });

    document.getElementById('sizeup').addEventListener('click', function() {
        if (selectedRoom) {
            selectedRoom.width += 2;
            selectedRoom.height += 2;
            redrawRooms();
        }
    });

    document.getElementById('sizedown').addEventListener('click', function() {
        if (selectedRoom) {
            selectedRoom.width = Math.max(10, selectedRoom.width - 2);
            selectedRoom.height = Math.max(10, selectedRoom.height - 2);
            redrawRooms();
        }
    });

    document.getElementById('rotate').addEventListener('click', function() {
        if (selectedRoom) {
            selectedRoom.rotation = (selectedRoom.rotation || 0) + Math.PI / 4;
            redrawRooms();
        }
    });

    document.getElementById('deleteRoom').addEventListener('click', function() {
        if (selectedRoom) {
            rooms = rooms.filter(room => room !== selectedRoom);
            selectedRoom = null;
            redrawRooms();
        }
    });

    document.getElementById('generateQR').addEventListener('click', function() {
        const url = `http://localhost:8000/view_matsumoto.html?rooms=${encodeURIComponent(JSON.stringify(rooms))}`;
        $('#generatedLink').html(`<a href="${url}" target="_blank">${url}</a>`);
        $('#editdata').val(JSON.stringify(rooms));
        alert('QRコードが生成されました');
    });

    document.getElementById('applyEditData').addEventListener('click', function() {
        const inputData = document.getElementById('roomdata').value;
        rooms = JSON.parse(inputData);
        redrawRooms();
    });

    document.getElementById('copyButton').addEventListener('click', function() {
        const textarea = document.getElementById('editdata');
        textarea.select();
        document.execCommand('copy');
    });

    document.getElementById('clearButton').addEventListener('click', function() {
        document.getElementById("roomdata").value = '';
    });

    document.getElementById('pasteButton').addEventListener('click', function() {
        navigator.clipboard.readText().then(function(text) {
            document.getElementById("roomdata").value = text;
        }).catch(function(err) {
            console.error('ペーストに失敗しました', err);
        });
    });



    document.addEventListener('keydown', function(event) {

        const inputBox = document.getElementById('textInput');
        if (document.activeElement === inputBox) {
            return; // テキストボックスがフォーカスされている場合、何もしない
        }
        if (event.key === 'r') { // rキーが押されたとき
            if (selectedRoom) {
                selectedRoom.rotation = (selectedRoom.rotation || 0) + Math.PI / 4;
                redrawRooms();
            }   
        }
        if (event.key === ' ') { // スペースキーが押されたとき
            editingMode = !editingMode;
            if (editingMode) {
                resize = false;
                canvas.style.backgroundColor = 'rgba(255, 255, 0, 0.1)';
            } else {
                canvas.style.backgroundColor = 'white';
                selectedRoom = null;
            }
            event.preventDefault(); // スペースキーによるスクロールを防ぐ
        }
        if (event.key === 'q') { // qキーが押されたとき
            if (selectedRoom) {
                rooms = rooms.filter(room => room !== selectedRoom);
                selectedRoom = null;
                redrawRooms();
            }
        }
        if (event.key === 'e') { // qキーが押されたとき
            resize = !resize;
            if (resize) {
                editingMode = false;
                canvas.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            } else {
                canvas.style.backgroundColor = 'white';
                selectedRoom = null;
            }
        }
        
    });
  }, []);
}

export default App;
