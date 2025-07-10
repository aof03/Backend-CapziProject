
# 🚖 Capzi – Ride-Hailing App (MVP)

Capzi เป็นแอปเรียกรถโดยสารที่เน้นความปลอดภัย ความเร็ว และประสบการณ์ใช้งานที่ใช้ง่าย  
เหมาะสำหรับใช้งานในพื้นที่เมืองหรือชานเมือง ด้วยระบบขนส่งที่ตอบโจทย์ยุคใหม่

---

## 🔧 เทคโนโลยีที่ใช้

- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **Map & Traffic**: Google Maps API
- **Notification**: In-App Notification
- **Payment**: รองรับเงินสด, Wallet, PromptPay (Mock)
- **Admin Panel**: Routes API สำหรับจัดการผู้ใช้ / ตรวจสอบ KYC

---

## 📱 ฟีเจอร์หลัก

- สมัคร/เข้าสู่ระบบ (Rider/Driver/Admin)
- เรียกรถ: กำหนดจุดรับ-ส่ง, เปิด/ปิด Priority Mode
- ส่วนลด/โค้ดโปรโมชั่น
- คนขับรับงาน / reroute / ติดตามรถติด
- ระบบ KYC ตรวจสอบคนขับ
- การชำระเงิน: เงินสด, Wallet, PromptPay (กำหนดตอนเรียกรถ)
- แชท 
- Admin ตรวจสอบผู้ใช้งาน, SOS, KYC
- ระบบ Rating & Review หลังจบงาน
- แจ้งเตือน: รถใกล้ถึง, ยืนยันจ่ายเงิน, SOS, ถึงที่หมาย

---

## 🚀 เริ่มต้นการใช้งาน

```bash
git clone https://github.com/your-org/capzi-backend.git
cd capzi-backend
npm install
cp .env.example .env
# กำหนดค่า MongoDB, JWT_SECRET, Google Maps API
npm run dev
```

---

## 📄 License: Exclusive License (สิทธิ์เฉพาะผู้ซื้อ)

โปรเจกต์นี้ไม่ได้เปิดแบบ Open Source ทั่วไป และอยู่ภายใต้ **ใบอนุญาตเฉพาะผู้ซื้อ (Exclusive License)**

### ✅ สิ่งที่อนุญาต:

- ใช้งาน ติดตั้ง ดัดแปลงโค้ดเพื่อใช้งานในธุรกิจของตนเอง
- ปรับปรุงต่อยอดเฉพาะภายในองค์กรได้

### ❌ สิ่งที่ห้ามทำ:

- ห้ามแจกจ่ายซอร์สโค้ดให้ผู้อื่น
- ห้ามขายต่อ หรือนำไปพัฒนาเพื่อขายเป็นแอปใหม่โดยไม่ได้รับอนุญาต
- ห้ามโพสต์บนเว็บไซต์สาธารณะ (เช่น GitHub แบบสาธารณะ)

### 🛡 ไม่มีการรับประกัน:

ซอฟต์แวร์จัดให้ "ตามสภาพ" โดยไม่มีการรับประกันความสมบูรณ์หรือปลอดภัยใด ๆ

หากต้องการโอนสิทธิ์หรือสอบถามเพิ่มเติม กรุณาติดต่อทีมพัฒนา

---

© 2025 Capzi Technologies – All Rights Reserved
