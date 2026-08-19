// routes/dashboard.js
const express = require("express");
const { requireAuth } = require("../middleware/auth");

module.exports = function (db) {
  const router = express.Router();

  router.get("/kabinet", requireAuth, (req, res) => {
    const orders = db
      .findAll("orders", (o) => o.user_id === req.user.id && o.status === "paid")
      .map((o) => {
        const product = db.findById("products", o.product_id);
        return Object.assign({}, o, {
          product_name: product ? product.name : "",
          product_price: product ? product.price : 0,
        });
      })
      .sort((a, b) => new Date(b.paid_at || 0) - new Date(a.paid_at || 0));

    res.render("dashboard", { orders, success: req.query.success === "1" });
  });

  return router;
};
