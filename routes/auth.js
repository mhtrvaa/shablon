// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");

module.exports = function (db) {
  const router = express.Router();

  router.get("/royxatdan-otish", (req, res) => {
    res.render("register", { error: null, name: "", email: "" });
  });

  router.post("/royxatdan-otish", async (req, res) => {
    const { name, email, password, password2 } = req.body;

    if (!name || !email || !password) {
      return res.render("register", { error: "Barcha maydonlarni to'ldiring.", name, email });
    }
    if (password.length < 6) {
      return res.render("register", {
        error: "Parol kamida 6 belgidan iborat bo'lishi kerak.",
        name,
        email,
      });
    }
    if (password !== password2) {
      return res.render("register", { error: "Parollar mos kelmadi.", name, email });
    }

    const existing = db.findOne("users", (u) => u.email === email.toLowerCase());
    if (existing) {
      return res.render("register", {
        error: "Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan.",
        name,
        email,
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = db.insert("users", {
      name,
      email: email.toLowerCase(),
      password_hash: hash,
      role: "customer",
    });

    req.session.userId = user.id;
    res.redirect(safeRedirect(req, user));
  });

  router.get("/kirish", (req, res) => {
    res.render("login", { error: null, email: "" });
  });

  router.post("/kirish", async (req, res) => {
    const { email, password } = req.body;
    const user = db.findOne("users", (u) => u.email === (email || "").toLowerCase());

    if (!user) {
      return res.render("login", { error: "Email yoki parol noto'g'ri.", email });
    }

    const ok = await bcrypt.compare(password || "", user.password_hash);
    if (!ok) {
      return res.render("login", { error: "Email yoki parol noto'g'ri.", email });
    }

    req.session.userId = user.id;
    res.redirect(safeRedirect(req, user));
  });

  // Kirish/ro'yxatdan o'tishdan keyin qayerga yo'naltirish kerakligini aniqlaydi.
  // Agar saqlangan manzil /admin bilan boshlansa-yu, foydalanuvchi admin bo'lmasa,
  // 403 xatosi o'rniga oddiygina kabinetga yuboriladi.
  function safeRedirect(req, user) {
    const target = req.session.redirectAfterLogin;
    delete req.session.redirectAfterLogin;
    if (target && target.startsWith("/admin") && user.role !== "admin") {
      return "/kabinet";
    }
    return target || "/kabinet";
  }

  router.post("/chiqish", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
  });

  return router;
};
