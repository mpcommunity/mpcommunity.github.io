// انتخاب المان‌های اصلی
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// ایجاد یک شناسه یکتا برای کاربر جهت حفظ حافظه در سمت سرور
const userId = "user_" + Math.random().toString(36).substr(2, 9);

// تنظیمات کتابخانه Marked برای رندر بهتر متون حقوقی
marked.setOptions({
    breaks: true, // رفتن به خط بعد با یک اینتر
    gfm: true    // پشتیبانی از استایل‌های گیت‌هاب
});

// تابع اضافه کردن پیام به صفحه
function addMessage(text, side) {
    const div = document.createElement('div');
    div.classList.add('message', side, 'animate-in');
    
    if (side === 'bot') {
        // ایجاد محفظه متن برای رندر مارک‌داون (بولد کردن ** متن)
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content');
        contentDiv.innerHTML = marked.parse(text);
        div.appendChild(contentDiv);
        
        // ایجاد دکمه کپی
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = 'کپی <i class="fas fa-copy"></i>';
        copyBtn.onclick = () => copyToClipboard(text, copyBtn);
        div.appendChild(copyBtn);
    } else {
        div.innerText = text;
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight; // اسکرول خودکار به پایین
}

// تابع کپی در کلیپ‌بورد
async function copyToClipboard(text, btn) {
    try {
        await navigator.clipboard.writeText(text);
        const originalText = btn.innerHTML;
        btn.innerHTML = 'کپی شد! <i class="fas fa-check"></i>';
        btn.style.color = "#2ecc71";
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.color = "";
        }, 2000);
    } catch (err) {
        console.error('خطا در کپی:', err);
    }
}

// تابع اصلی ارسال پیام به بک‌انند (Groq/Flask)
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message || sendBtn.disabled) return;

    // ۱. نمایش پیام کاربر
    addMessage(message, 'user');
    userInput.value = '';
    
    // ۲. غیرفعال کردن دکمه و ورودی برای جلوگیری از اسپم
    sendBtn.disabled = true;
    userInput.disabled = true;

    // ۳. نمایش وضعیت در حال تایپ (Skeleton)
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot', 'animate-in');
    typingDiv.innerHTML = `<div class="content"><p>در حال بررسی منابع حقوقی...</p></div>`;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // ۴. ارسال درخواست به سرور پایتون
        const response = await fetch('http://127.0.0.1:5000/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                message: message
            })
        });

        const data = await response.json();

        // ۵. جایگزینی متن انتظار با پاسخ واقعی (با رندر مارک‌داون)
        typingDiv.innerHTML = `<div class="content">${marked.parse(data.reply)}</div>`;
        
        // اضافه کردن دکمه کپی به پیام جدید
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = 'کپی <i class="fas fa-copy"></i>';
        copyBtn.onclick = () => copyToClipboard(data.reply, copyBtn);
        typingDiv.appendChild(copyBtn);

    } catch (error) {
        console.error('Error:', error);
        typingDiv.innerHTML = `<div class="content"><p style="color: #e74c3c;">خطا در برقراری ارتباط با مشاور هوشمند. لطفا فیلترشکن خود را بررسی کنید یا دوباره تلاش کنید.</p></div>`;
    } finally {
        // ۶. فعال‌سازی مجدد رابط کاربری
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// گوش دادن به کلیک دکمه
sendBtn.addEventListener('click', handleSendMessage);

// گوش دادن به دکمه اینتر
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});