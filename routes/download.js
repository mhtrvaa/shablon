// routes/download.js
const express = require("express");
const path = require("path");

module.exports = function (db) {
  const router = express.Router();
  const uploadsDir = path.join(__dirname, "..", "uploads");

  router.get("/yuklab-olish/:productId", (req, res) => {
    if (!req.user) {
      req.session.redirectAfterLogin = req.originalUrl;
      return res.redirect("/kirish");
    }

    const productId = Number(req.params.productId);
    const owned = db.findOne(
      "orders",
      (o) => o.user_id === req.user.id && o.product_id === productId && o.status === "paid"
    );

    if (!owned) {
      return res.status(403).render("errors/403");
    }

    const product = db.findById("products", productId);
    if (!product) return res.status(404).render("errors/404");

    const filePath = path.join(uploadsDir, product.file_path);
    res.download(filePath, product.file_path, (err) => {
      if (err && !res.headersSent) {
        res.status(500).render("errors/500");
      }
    });
  });

  return router;
};
