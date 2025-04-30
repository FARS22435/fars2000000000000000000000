// إعداد Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCAUQs04D6f1hl2tCBzGp9oYuoWKLmJtjI",
    authDomain: "nimble-artwork-452619-b5.firebaseapp.com",
    databaseURL: "https://nimble-artwork-452619-b5-default-rtdb.firebaseio.com",
    projectId: "nimble-artwork-452619-b5",
    storageBucket: "nimble-artwork-452619-b5.firebasestorage.app",
    messagingSenderId: "211952503774",
    appId: "1:211952503774:web:dbb27abd162a6b1435eb4f",
    measurementId: "G-SLY9NRNDVD"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

let currentUser = "";
let chatWith = "";

// حفظ اسم المستخدم
function saveUsername() {
    const name = document.getElementById("username").value.trim();
    if (name) {
        currentUser = name;
        alert("تم حفظ اسم المستخدم: " + name);
    } else {
        alert("الرجاء إدخال اسمك");
    }
}

// بدء الدردشة مع مستخدم آخر
function startChat() {
    const otherUser = document.getElementById("searchUser").value.trim();
    if (!currentUser) {
        alert("الرجاء حفظ اسم المستخدم أولاً");
        return;
    }

    if (otherUser) {
        chatWith = otherUser;
        document.getElementById("chatBox").classList.remove("hidden");
        document.getElementById("messageForm").classList.remove("hidden");
        document.getElementById("chatBox").innerHTML = ""; // تفريغ الرسائل القديمة
        listenForMessages();
    } else {
        alert("يرجى إدخال اسم المستخدم الذي تريد الدردشة معه");
    }
}

// إرسال الرسالة
function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (message && currentUser && chatWith) {
        const chatId = getChatId(currentUser, chatWith);
        const timestamp = Date.now();

        db.ref("chats/" + chatId).push({
            sender: currentUser,
            message,
            timestamp
        });

        messageInput.value = ""; // إفراغ حقل الرسالة بعد الإرسال
    }
}

// الاستماع للرسائل الجديدة
function listenForMessages() {
    const chatId = getChatId(currentUser, chatWith);
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = "";

    // إلغاء الاستماع السابق ثم الاستماع للرسائل الجديدة
    db.ref("chats/" + chatId).off();
    db.ref("chats/" + chatId).on("child_added", (snapshot) => {
        const data = snapshot.val();
        const msgHTML = `
            <div class="${data.sender === currentUser ? 'text-right' : 'text-left'} mb-2">
                <div class="inline-block px-3 py-1 rounded-full ${data.sender === currentUser ? 'bg-orange-500 text-white' : 'bg-gray-200 text-black'}">
                    ${data.sender}: ${data.message}
                </div>
            </div>
        `;
        chatBox.innerHTML += msgHTML;
        chatBox.scrollTop = chatBox.scrollHeight; // التمرير لأسفل بعد إضافة الرسالة

        // إظهار إشعار إذا كانت الرسالة من مستخدم آخر
        if (data.sender !== currentUser) {
            const notification = document.getElementById("notification");
            notification.textContent = `رسالة جديدة من ${data.sender}`;
            notification.style.display = 'block';
        }
    });
}

// رفع صورة أو فيديو
function uploadFile(event) {
    const file = event.target.files[0];
    if (file) {
        const storageRef = storage.ref("chats/" + currentUser + "/" + file.name);
        const uploadTask = storageRef.put(file);

        uploadTask.on("state_changed", (snapshot) => {
            // يمكنك إضافة شريط تقدم هنا إذا أردت
        }, (error) => {
            console.log("حدث خطأ أثناء رفع الملف: ", error);
        }, () => {
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                sendFileMessage(downloadURL);
            });
        });
    }
}

// إرسال رسالة تحتوي على رابط الملف
function sendFileMessage(fileURL) {
    if (currentUser && chatWith) {
        const chatId = getChatId(currentUser, chatWith);
        const timestamp = Date.now();

        db.ref("chats/" + chatId).push({
            sender: currentUser,
            fileURL,
            timestamp
        });
    }
}

// الحصول على معرف الدردشة
function getChatId(user1, user2) {
    return [user1, user2].sort().join("_");
}
