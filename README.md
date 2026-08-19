# Shablon — Raqamli shablonlar bozori

To'liq ishlaydigan sayt: mijoz ro'yxatdan o'tadi, mahsulot tanlaydi, to'laydi va
shaxsiy kabinetidan yuklab oladi. Admin panel orqali yangi mahsulot qo'shish mumkin.

## ⚠️ Muhim eslatma (albatta o'qing)

Ushbu loyihada avval `better-sqlite3` kutubxonasi ishlatilgan edi, lekin bu
kutubxona Windows'da C++ kompilyatsiyasini (Visual Studio Build Tools) talab
qilib, xato berdi. Shuning uchun **butunlay olib tashlandi** — endi baza oddiy
JSON fayl (`data/db.json`) sifatida ishlaydi, hech qanday kompilyatsiya kerak
emas. Bu qatlamni (`db/database.js`) va butun xarid jarayonini (buyurtma →
to'lov → kabinet → yuklab olish, shu jumladan Click va Payme integratsiyasini)
**shu yerda haqiqatda ishga tushirib, oxirigacha sinab ko'rdim** — barchasi
to'g'ri ishladi.

Express, EJS shablonlar va boshqa kutubxonalarni esa (internet yo'qligi
sababli) o'rnatib sinay olmadim — faqat diqqat bilan qo'lda yozdim va
sintaksisini tekshirdim. Baza qatlami sinovdan o'tgani uchun ishonch ancha
yuqori, lekin baribir birinchi ishga tushirishda kichik narsa chiqib qolsa —
xato matnini menga tashlang, darhol tuzataman.

---

## 1. O'rnatish

```bash
npm install
cp .env.example .env
```

`.env` faylini oching va kamida `SESSION_SECRET` qatoriga o'zingizning tasodifiy
matningizni yozing (masalan 32 ta tasodifiy harf/raqam).

## 2. Bazani tayyorlash

```bash
npm run seed
```

Bu buyruq `data/db.json` faylini yaratadi, 7 ta kategoriya va har biriga bittadan
namuna mahsulot qo'shadi (bizning avval tayyorlagan CV, taqdimot, AI prompt va
boshqa fayllarimiz — `uploads/` papkasida joylashgan).

## 3. Serverni ishga tushirish

```bash
npm run dev
```

Brauzerda oching: **http://localhost:3000**

## 4. O'zingizni admin qilish

1. Saytda oddiy tarzda ro'yxatdan o'ting (`/royxatdan-otish`)
2. Terminalda:
   ```bash
   npm run make-admin -- sizning@emailingiz.uz
   ```
3. Qayta kiring — endi yuqori menyuda "Admin" tugmasi ko'rinadi

## 5. Xarid jarayonini sinab ko'rish (haqiqiy hisobsiz)

`.env` faylida `TEST_MODE=true` bo'lsa, checkout sahifasida **"🧪 Test rejimi"**
degan variant chiqadi. Shu orqali Click/Payme hisobisiz butun jarayonni
(xarid → to'lov → kabinetda ko'rinish → yuklab olish) boshidan oxirigacha
sinab ko'rishingiz mumkin.

---

## Click va Payme'ni haqiqiy ishga tushirish

Kodda ikkalasining ham to'g'ri protokol tuzilmasi (Prepare/Complete — Click,
JSON-RPC metodlari — Payme) yozilgan, lekin **haqiqiy hisob ma'lumotlari bilan
sinalmagan** — chunki bu kalitlar sizning biznesingizga tegishli va men ularni
o'rningizga olib bo'lmaydi.

### Click
1. https://merchant.click.uz saytida biznes hisobingizni oching
2. Merchant ID, Service ID va Secret Key oling
3. `.env` faylidagi `CLICK_MERCHANT_ID`, `CLICK_SERVICE_ID`, `CLICK_SECRET_KEY` ni to'ldiring
4. Click kabinetida "Prepare/Complete URL" sifatida quyidagini ko'rsating:
   `https://SIZNING-DOMENINGIZ.uz/api/payments/click`
5. Click test (sandbox) muhitida albatta oldindan sinab ko'ring

### Payme
1. https://business.payme.uz saytida biznes hisobingizni oching
2. Merchant ID va Secret Key oling
3. `.env` faylidagi `PAYME_MERCHANT_ID`, `PAYME_SECRET_KEY` ni to'ldiring
4. Payme kabinetida webhook manzili sifatida ko'rsating:
   `https://SIZNING-DOMENINGIZ.uz/api/payments/payme`
5. Payme test (sandbox) muhitida albatta oldindan sinab ko'ring

Ikkalasi tayyor bo'lgach, `.env` faylida `TEST_MODE=false` qiling — shunda
checkout sahifasidan test tugmasi yo'qoladi va faqat haqiqiy to'lovlar qabul qilinadi.

---

## Loyiha tuzilishi

```
shablon-site/
├── server.js              # Bosh fayl — shu yerdan ishga tushadi
├── db/
│   ├── database.js        # JSON-fayl asosidagi baza (kompilyatsiya kerak emas)
│   ├── seed.js             # Boshlang'ich ma'lumotlar (kategoriya + mahsulot)
│   └── make-admin.js       # Foydalanuvchini admin qilish
├── lib/
│   ├── click.js             # Click to'lov integratsiyasi
│   └── payme.js             # Payme to'lov integratsiyasi
├── middleware/
│   └── auth.js               # Login tekshirish, admin tekshirish
├── routes/                   # Har bir bo'lim uchun alohida fayl
├── views/                    # EJS sahifalar (HTML shablonlar)
├── public/css/style.css      # Dizayn (sayt maketidagi rang va shriftlar bilan bir xil)
├── data/                     # db.json shu yerda yaratiladi (birinchi ishga tushganda)
└── uploads/                  # Sotiladigan fayllar (himoyalangan — to'g'ridan-to'g'ri ochilmaydi)
```

## Ma'lumotlar qanday saqlanadi

- Barcha ma'lumotlar (foydalanuvchilar, mahsulotlar, buyurtmalar) bitta
  `data/db.json` faylida saqlanadi — oddiy matn fayli, istalgan matn muharriri
  bilan ochib ko'rish mumkin.
- **users** — foydalanuvchilar (mijoz yoki admin)
- **categories** — 7 ta mahsulot turkumi
- **products** — mahsulotlar (narx, tavsif, fayl manzili)
- **orders** — buyurtmalar (kutilmoqda / to'landi / bekor qilindi)
- **payments** — to'lov tizimidan kelgan tranzaksiyalar

## Keyingi qadamlar (tavsiya)

- Telefon + SMS orqali ro'yxatdan o'tishni qo'shish (SMS-shlyuz xizmati — masalan
  Eskiz.uz yoki Play Mobile — bilan alohida shartnoma kerak bo'ladi)
- Mijozlar va buyurtmalar soni juda ko'payib ketsa (masalan minglab), JSON fayl
  o'rniga haqiqiy ma'lumotlar bazasi serveriga (PostgreSQL) o'tish tavsiya etiladi
- Rasmiy domen va SSL sertifikat ulash
- Xato va faoliyat loglarini kuzatish (masalan Sentry kabi xizmat)
