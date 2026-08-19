// middleware/auth.js
// Sahifalarni himoyalash uchun oddiy middleware funksiyalari.

function attachUser(db) {
  return (req, res, next) => {
    res.locals.user = null;
    if (req.session && req.session.userId) {
      const user = db.findById("users", req.session.userId);
      if (user) {
        const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
        req.user = safeUser;
        res.locals.user = safeUser;
      }
    }
    next();
  };
}

function requireAuth(req, res, next) {
  if (!req.user) {
    req.session.redirectAfterLogin = req.originalUrl;
    return res.redirect("/kirish");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).render("errors/403");
  }
  next();
}

module.exports = { attachUser, requireAuth, requireAdmin };
