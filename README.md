# Blackjack Web Application

## Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose

เอกสารนี้อธิบายความต้องการของระบบ Blackjack Web App เพื่อใช้เป็นแนวทางในการพัฒนา ทดสอบ และตรวจสอบระบบ

### 1.2 Scope

ระบบเป็นเว็บแอปสำหรับเล่น Blackjack ระหว่างผู้เล่นกับ AI หรือผู้เล่นอื่น โดยมีระบบบัญชีผู้ใช้ เงินในเกม และสถิติ

### 1.3 Definitions

| คำ | ความหมาย |
|----|-----------|
| Coin | เงินที่หาได้ในเกม |
| Cash | เงินพรีเมียม (เติมเงิน) |
| Viewer | ผู้ชมที่ดูเกมและเดิมพันผลลัพธ์ได้ |
| Player | ผู้เล่น |
| Dealer | เจ้ามือ |

---

## 2. Overall Description

### 2.1 Product Perspective

ระบบทำงานบนเว็บเบราว์เซอร์ เชื่อมต่อฐานข้อมูลและ server backend

### 2.2 User Classes

| Class | สิทธิ์ |
|-------|--------|
| guest | ดูหน้าเว็บได้ แต่เล่นไม่ได้ |
| user | ผู้เล่นทั่วไป |
| admin | จัดการระบบ |

---

## 3. System Features

### Feature 1: User Registration

**Description:** ระบบสมัครสมาชิกผู้ใช้

| ID | Requirement |
|----|-------------|
| FR-1-01 | ผู้ใช้ต้องกรอก username / email / password |
| FR-1-02 | ระบบต้องตรวจสอบ username และ email ซ้ำ |
| FR-1-03 | ระบบต้องเข้ารหัส password ก่อนบันทึก และยืนยันอีเมล |

---

### Feature 2: Login System

**Description:** ระบบเข้าสู่ระบบผู้ใช้

| ID | Requirement |
|----|-------------|
| FR-2-01 | ผู้ใช้ต้อง login ด้วย email หรือ username และ password |
| FR-2-02 | ระบบต้องแจ้ง error หากข้อมูลไม่ถูกต้อง |

---

### Feature 3: Game Mode & Match System

**Description:** ระบบเลือกโหมดและเริ่มเกม

#### 3.1 Mode Selection

| ID | Requirement |
|----|-------------|
| FR-3-01 | ผู้เล่นต้องเลือกโหมดก่อนเริ่มเกม |
| FR-3-02 | ระบบต้องแสดงรายละเอียดแต่ละโหมด |
| FR-3-03 | ระบบต้องเริ่มเกมตามโหมดที่เลือก |

#### 3.2 Mode Types

**QuickPlay Mode** — เล่นสนุก ไม่ใช้เงินจริง

| ID | Requirement |
|----|-------------|
| FR-3-04 | ผู้เล่นต้องเลือก Player vs AI หรือ Player vs Player ได้ |
| FR-3-05 | ผู้เล่นใช้ Coin ตามการวางเดิมพัน |
| FR-3-06 | ผู้เล่นต้องได้รับ Coin ตามจำนวนที่ชนะ |

**Rank Mode** — โหมดแข่งขันจัดอันดับ

| ID | Requirement |
|----|-------------|
| FR-3-07 | ผู้เล่นต้องใช้ Cash เพื่อเข้าเล่น |
| FR-3-08 | ระบบต้องหัก Cash ก่อนเริ่มเกม |
| FR-3-09 | ผู้ชนะต้องได้รับ Cash เป็นรางวัล |
| FR-3-10 | ระบบต้องอัปเดตอันดับหลังจบเกม |

---

### Feature 4: Core Gameplay Engine

**Description:** กลไกการเล่น Blackjack หลัก

| ID | Requirement |
|----|-------------|
| FR-4-01 | ระบบต้องแจกไพ่ 2 ใบให้ผู้เล่นและ Dealer ตอนเริ่มเกม |
| FR-4-02 | ผู้เล่นต้องเลือก Hit หรือ Stand ได้ |
| FR-4-03 | ระบบต้องคำนวณคะแนนอัตโนมัติ |
| FR-4-04 | ระบบต้องตัดสินผลแพ้ชนะตามกติกา Blackjack |

---

### Feature 5: Spectator Mode & Side Betting

**Description:** ระบบดูโต๊ะและเดิมพันผลลัพธ์

| ID | Requirement |
|----|-------------|
| FR-5-01 | ผู้ใช้ต้องเข้าชมโต๊ะที่กำลังเล่นอยู่ได้ |
| FR-5-02 | ระบบต้องแสดงสถานะเกมปัจจุบันของโต๊ะ |
| FR-5-03 | Viewer ต้องสามารถเดิมพันผลลัพธ์ได้โดยไม่ต้องเข้าร่วมเล่น |
| FR-5-04 | Viewer ต้องเดิมพันฝั่ง Player ได้ในอัตรา 1:1 |
| FR-5-05 | Viewer ต้องเดิมพันฝั่ง Banker ได้ในอัตรา 0.9:1 |
| FR-5-06 | ระบบต้องคำนวณเงินรางวัลอัตโนมัติ |
| FR-5-07 | ระบบต้องเพิ่มเงินรางวัลให้ผู้เดิมพันที่ชนะ |
| FR-5-08 | ระบบต้องหักเงินเดิมพันก่อนเริ่มรอบ |
| FR-5-09 | Viewer ต้องไม่สามารถควบคุมเกมแทนผู้เล่น |
| FR-5-10 | Viewer ต้องไม่สามารถเดิมพันหลังเริ่มรอบ |
| FR-5-11 | ระบบต้องล็อกการเดิมพันเมื่อแจกไพ่ใบแรก |
| FR-5-12 | Viewer ต้องออกจากโต๊ะได้ตลอดเวลา |

---

### Feature 6: Currency System

**Description:** ระบบเงินในเกม

| ID | Requirement |
|----|-------------|
| FR-6-01 | ผู้เล่นต้องมี Coin balance |
| FR-6-02 | ผู้เล่นต้องมี Cash balance |
| FR-6-03 | ระบบต้องหักเงินเมื่อเดิมพัน |
| FR-6-04 | ระบบต้องเพิ่มเงินเมื่อชนะ |
| FR-6-05 | ระบบต้องแสดงยอดเงินล่าสุดแบบ realtime |

---

### Feature 7: AI Dealer Logic

**Description:** ระบบเจ้ามืออัตโนมัติ

| ID | Requirement |
|----|-------------|
| FR-7-01 | Dealer ต้องจั่วไพ่เมื่อแต้ม < 21 |
| FR-7-02 | Dealer ต้องหยุดจั่วเมื่อแต้ม ≥ 21 |

---

### Feature 8: Leaderboard System

**Description:** ระบบจัดอันดับผู้เล่น

| ID | Requirement |
|----|-------------|
| FR-8-01 | ระบบต้องแสดงอันดับผู้เล่น |
| FR-8-02 | ระบบต้องจัดอันดับตาม Rank score หรือ Cash |
| FR-8-03 | ระบบต้องอัปเดตอันดับแบบ realtime |

---

### Feature 9: Customization & Skin System

**Description:** ระบบสกินปรับแต่งหน้าตาเกม

#### 9.1 Skin Store

| ID | Requirement |
|----|-------------|
| FR-9-01 | ระบบต้องมีร้านค้า Skin |
| FR-9-02 | ระบบต้องแสดงรายการ Skin พร้อมราคา |
| FR-9-03 | ผู้เล่นต้องซื้อ Skin ด้วย Coin หรือ Cash ได้ |
| FR-9-04 | ระบบต้องหักเงินหลังซื้อสำเร็จ |
| FR-9-05 | ระบบต้องเพิ่ม Skin ลง Inventory ผู้เล่น |

#### 9.2 Skin Types

| ID | Requirement |
|----|-------------|
| FR-9-06 | ระบบต้องรองรับ Card Skin |
| FR-9-07 | ระบบต้องรองรับ Table Skin |
| FR-9-08 | ระบบต้องรองรับ Theme Skin |

#### 9.3 Skin Inventory & Equip

| ID | Requirement |
|----|-------------|
| FR-9-09 | ผู้เล่นต้องดู Skin ที่ครอบครองได้ |
| FR-9-10 | ผู้เล่นต้องเลือก Skin ใช้งานได้ |
| FR-9-11 | ระบบต้องใช้ Skin ที่เลือกอัตโนมัติเมื่อเริ่มเกม |
| FR-9-12 | ระบบต้องบันทึก Skin ล่าสุดที่ใช้งาน |

#### 9.4 Skin Rules

| ID | Requirement |
|----|-------------|
| FR-9-13 | ผู้เล่นต้องไม่สามารถใช้ Skin ที่ยังไม่ได้ซื้อ |
| FR-9-14 | Skin ต้องไม่มีผลต่อผลการแข่งขัน |
| FR-9-15 | Skin ต้องมีผลเฉพาะด้านภาพเท่านั้น |

---

## 4. External Interface Requirements

### 4.1 User Interface

| ID | หน้า | คำอธิบาย |
|----|------|-----------|
| UI-01 | Login Page | หน้าสำหรับเข้าสู่ระบบผู้ใช้ |
| UI-02 | Lobby Page | หน้าหลักหลัง login สำหรับเลือกโหมดและเมนูต่าง ๆ |
| UI-03 | Profile Page | หน้าข้อมูลผู้เล่น สถิติ และข้อมูลบัญชี |
| UI-04 | Mode Selection Page | หน้าสำหรับเลือกโหมดเกม |
| UI-05 | Matchmaking Page | หน้าค้นหาหรือจับคู่ผู้เล่น |
| UI-06 | Gameplay Page | หน้าหลักสำหรับเล่นเกม Blackjack |
| UI-07 | Table Settings Page | หน้าตั้งค่าโต๊ะสำหรับการสร้างห้อง เช่น จำนวนเดิมพันหรือกติกาโต๊ะ |
| UI-08 | Table Selection Page | หน้าสำหรับเลือกโต๊ะที่ต้องการเข้าเดิมพัน |
| UI-09 | Spectator Page | หน้าสำหรับดูเกมที่กำลังเล่นและเดิมพันแบบ Viewer |
| UI-10 | Result Overlay | หน้าต่างแสดงผลแพ้ชนะหลังจบรอบ |
| UI-11 | Payment Page | หน้าสำหรับเติม Cash หรือทำธุรกรรม |
| UI-12 | Skin Shop Page | หน้าร้านค้าสำหรับซื้อ Skin |
| UI-13 | Inventory Page | หน้าคลัง Item และ Skin ของผู้เล่น |

### 4.2 API Interface

#### 4.2.1 Authentication API

| ID | Method | Endpoint | Body | Auth | คำอธิบาย |
|----|--------|----------|------|------|----------|
| API-AUTH-01 | `POST` | `/auth/register` | `{username, email, password}` | None | สมัครสมาชิก ส่งอีเมลยืนยัน |
| API-AUTH-02 | `POST` | `/auth/verify` | `${token}` | None | ยืนยันอีเมลด้วย parameter token |
| API-AUTH-03 | `POST` | `/auth/login` | `{username, password}` | None | เข้าสู่ระบบ คืน access token และ refresh token |
| API-AUTH-04 | `POST` | `/auth/refresh` | `{refreshToken}` | None | รีเฟรช access token ด้วย refresh token |

#### 4.2.2 User Profile API

| ID | Method | Endpoint | Body | Auth | คำอธิบาย |
|----|--------|----------|------|------|----------|
| API-USER-01 | `GET` | `/user/me` | None | Bearer | ข้อมูลโปรไฟล์ผู้ใช้ |

| ID | Endpoint |
|----|----------|
| API-USER-02 | Get Stats |
| API-USER-03 | Update Profile |
| API-USER-04 | Transaction History |
| API-USER-05 | Game History |

#### 4.2.3 Lobby & Mode API

| ID | Endpoint |
|----|----------|
| API-LOBBY-01 | Get Game Modes |
| API-LOBBY-02 | Get Leaderboard |

#### 4.2.4 Matchmaking API

| ID | Endpoint |
|----|----------|
| API-MATCH-01 | Find Match |
| API-MATCH-02 | Cancel Match |
| API-MATCH-03 | Match Status |

#### 4.2.5 Payment API

| ID | Endpoint |
|----|----------|
| API-PAYMENT-01 | Purchase Cash |

#### 4.2.6 Skin System API

| ID | Endpoint |
|----|----------|
| API-SKIN-01 | List Skins |
| API-SKIN-02 | Buy Skin |
| API-SKIN-03 | Inventory |
| API-SKIN-04 | Equip Skin |

### 4.3 Socket.IO Events

#### 4.3.1 Table Socket Events

**Client → Server**

| Event | Payload | Ack | คำอธิบาย |
|-------|---------|-----|----------|
| `room:join` | `tableId: string` | `{ ok, message? }` | เข้าร่วมโต๊ะ |
| `room:leave` | `tableId: string` | `{ ok, message? }` | ออกจากโต๊ะ |
| `room:message` | `{ tableId, data }` | `{ ok, message? }` | ส่งข้อมูลไปยังผู้เล่นในโต๊ะ |

**Server → Client**

| Event | Payload | คำอธิบาย |
|-------|---------|----------|
| `room:state` | `{ tableId, members[] }` | สถานะห้องปัจจุบัน (broadcast ทุกคนในห้อง) |
| `room:player-joined` | `{ tableId, socketId }` | แจ้งเมื่อมีผู้เล่นเข้าร่วม |
| `room:player-left` | `{ tableId, socketId }` | แจ้งเมื่อมีผู้เล่นออก |
| `room:data` | `{ tableId, from, data }` | ข้อมูลที่ผู้เล่นส่งมา (relay) |
| `room:error` | `message: string` | แจ้ง error |

#### 4.3.2 Gameplay Socket Events (Socket.IO)

**Client → Server**

| Event | Payload | Ack | คำอธิบาย |
|-------|---------|-----|----------|
| `room:join` | `tableId: string` | `{ ok, message? }` | เข้าร่วมโต๊ะเกม |
| `room:message` | `{ tableId, data: { action } }` | `{ ok, message? }` | ส่ง action ของผู้เล่น เช่น Hit, Stand |

**Server → Client**

| Event | Payload | คำอธิบาย |
|-------|---------|----------|
| `room:state` | `{ tableId, members[] }` | สถานะห้อง |
| `room:data` | `{ tableId, from, data }` | อัปเดตสถานะเกม / ผลลัพธ์ |
| `room:error` | `message: string` | แจ้ง error |

#### 4.3.3 Spectator Socket Events (Socket.IO)

**Client → Server**

| Event | Payload | Ack | คำอธิบาย |
|-------|---------|-----|----------|
| `room:join` | `tableId: string` | `{ ok, message? }` | เข้าชมโต๊ะในฐานะ Viewer |
| `room:leave` | `tableId: string` | `{ ok, message? }` | ออกจากโต๊ะ |
| `room:message` | `{ tableId, data: { bet, side } }` | `{ ok, message? }` | ส่งข้อมูลการเดิมพันของ Viewer |

**Server → Client**

| Event | Payload | คำอธิบาย |
|-------|---------|----------|
| `room:state` | `{ tableId, members[] }` | สถานะห้อง |
| `room:player-joined` | `{ tableId, socketId }` | มี Viewer เข้าร่วม |
| `room:player-left` | `{ tableId, socketId }` | Viewer ออกจากห้อง |
| `room:data` | `{ tableId, from, data }` | อัปเดตสถานะเกม / ผลเดิมพัน |

---