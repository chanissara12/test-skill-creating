# แผนที่: Work Time Log

> หมายเหตุ: แผนที่นี้เขียน **ย้อนหลัง** หลังจากที่ spec เสร็จแล้ว เพราะตอนแรกข้ามขั้นนี้ไป การตัดสินใจทั้งหมดมาจากการ grill ในบทสนทนา ไม่ได้เกิดจากการไล่ ticket ทีละใบ

## Destination

Spec เดียวสำหรับแอปบันทึกเวลาทำงาน (กรอกว่าทำอะไร กดเริ่มจับเวลา กดหยุดแล้วบันทึกประวัติ แสดงเป็นไทม์ไลน์รายสัปดาห์) พร้อม tickets ที่ `implement` ลงมือต่อได้: [spec.md](../work-time-log/spec.md)

## Notes

- โดเมน: แอปใช้คนเดียว Angular (frontend) + .NET Core Web API (backend) + PostgreSQL
- ศัพท์เฉพาะอยู่ที่ [CONTEXT.md](../../CONTEXT.md) หน้าตาตาม [DESIGN.md](../../DESIGN.md)
- กฎ database-first: ผู้ใช้สร้าง DB เอง ผมร่างสคริปต์ให้รีวิวและรันเอง ห้ามรันสคริปต์/migration เอง
- ห้าม commit/push เองจนกว่าผู้ใช้สั่ง
- ใช้ tracker แบบ local-markdown: แผนที่นี้อยู่ใน `.scratch/work-time-log-plan/` ส่วน spec และ ticket สำหรับสร้างอยู่ใน `.scratch/work-time-log/`

## Decisions so far

- [ปลายทางและขอบเขต](issues/01-destination-and-scope.md): ปลายทางคือ spec + tickets, ใช้คนเดียวไม่มี auth, รันในเครื่องเท่านั้น
- [ฐานข้อมูลและการเก็บเวลา](issues/02-database-and-time-storage.md): PostgreSQL, เก็บ UTC, ไม่ใช้ unique filtered index (บังคับ "ทีละอัน" ที่ backend)
- [กฎของตัวจับเวลา](issues/03-timer-rules.md): จับทีละอัน, รอดการรีเฟรช, ไม่มีกลไกกันลืมหยุด
- [ข้อมูลของ Time Entry และศัพท์เฉพาะ](issues/04-time-entry-data-and-glossary.md): เก็บแค่ชื่อ (≤200) + เริ่ม + หยุด, ศัพท์ Time Entry / Running Timer / Week
- [พฤติกรรมของตารางเวลา](issues/05-timetable-behavior.md): ไทม์ไลน์รายสัปดาห์ อาทิตย์–เสาร์, 24 ชม., ตัดบล็อกตามวัน, ลบได้พร้อมยืนยัน, เดสก์ท็อปเท่านั้น
- [หน้าตาของหน้าจอ](issues/06-visual-design.md): แบบ C (แถวต่อวัน แกนแนวนอน) ตาม DESIGN.md
- [จุดทดสอบ (seam)](issues/07-test-seams.md): 2 seam คือ HTTP API ของ backend (xUnit) + ฟังก์ชันไทม์ไลน์ของ frontend (Jest)

## Not yet specified

(ไม่มีหมอกเหลือ: ทุกการตัดสินใจที่เกี่ยวกับปลายทางถูกปิดแล้ว)

## Out of scope

- ระบบล็อกอิน/หลายผู้ใช้ และการ deploy
- เลย์เอาต์มือถือ
- การแก้ไข Time Entry, ค้นหา, export, โปรเจกต์/แท็ก/หมายเหตุ
- กลไกกันลืมกดหยุด (เตือน/หยุดอัตโนมัติ/กรอกเวลาหยุดย้อนหลัง)
- มุมมองอื่นนอกจากตารางรายสัปดาห์ (เช่นรายวัน)
- Database constraint บังคับ Running Timer ตัวเดียว (ผู้ใช้ตัดสินใจไม่ใช้)
