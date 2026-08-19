// server.js
// Loyihaning bosh fayli — shu yerdan ishga tushiriladi (npm start yoki npm run dev).

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const db = require("./db/database");
const seed = require("./db/seed");
const { attachUser } = require("./middleware/auth");

// Bazani avtomatik tayyorlaydi (kategoriyalar + namuna mahsulotlar).
// Bo'sh bo'lsa to'ldiradi, allaqachon to'liq bo'lsa hech narsa qilmaydi —
// shuning uchun har safar serverni ishga tushirishda xavfsiz chaqiriladi
// (masalan Render kabi hostingda terminal ochib alohida buyruq berish shart emas).
seed();

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-uchun-vaqtinchalik-kalit",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 kun
  })
);

app.use(attachUser(db));

// ---- Marshrutlar (routes) ----
// Har bir marshrut fayli o'ziga kerakli himoyani (requireAuth/requireAdmin) o'zi ichida qo'llaydi.
app.use(require("./routes/pages")(db));
app.use(require("./routes/auth")(db));
app.use(require("./routes/checkout")(db));
app.use(require("./routes/dashboard")(db));
app.use(require("./routes/download")(db));
app.use(require("./routes/admin")(db));

// ---- 404 ----
app.use((req, res) => {
  res.status(404).render("errors/404");
});

// ---- Umumiy xatolik ushlagich ----
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("errors/500");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Assetly server ishga tushdi: http://localhost:${PORT}`);
});
