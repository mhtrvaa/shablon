// routes/checkout.js
const express = require("express");
const { buildClickPayUrl, handleClickRequest } = require("../lib/click");
const { handlePaymeRequest, checkAuth } = require("../lib/payme");

module.exports = function (db) {
  const router = express.Router();
  const isTestMode = () => String(process.env.TEST_MODE).toLowerCase() === "true";

  // ---- Checkout sahifasi ----
  router.get("/checkout/:productId", (req, res) => {
    if (!req.user) {
      req.session.redirectAfterLogin = req.originalUrl;
      return res.redirect("/kirish");
    }

    const product = db.findById("products", req.params.productId);
    if (!product) return res.status(404).render("errors/404");

    res.render("checkout", { product, testMode: isTestMode() });
  });

  // ---- Buyurtma yaratish va to'lov usulini tanlash ----
  router.post("/checkout/:productId/start", (req, res) => {
    if (!req.user) {
      req.session.redirectAfterLogin = `/checkout/${req.params.productId}`;
      return res.redirect("/kirish");
    }

    const product = db.findById("products", req.params.productId);
    if (!product) return res.status(404).render("errors/404");

    const { provider } = req.body; // 'click' | 'payme' | 'test'

    const order = db.insert("orders", {
      user_id: req.user.id,
      product_id: product.id,
      amount: product.price,
      status: "pending",
      provider: null,
      paid_at: null,
    });

    const returnUrl = `${req.protocol}://${req.get("host")}/kabinet`;

    if (provider === "click") {
      const url = buildClickPayUrl({ orderId: order.id, amount: product.price, returnUrl });
      return res.redirect(url);
    }

    if (provider === "payme") {
      // Payme checkout havolasi base64(m=MERCHANT_ID;ac.order_id=ORDER_ID;a=AMOUNT_TIYIN) shaklida bo'ladi
      const payload = `m=${process.env.PAYME_MERCHANT_ID};ac.order_id=${order.id};a=${
        product.price * 100
      }`;
      const encoded = Buffer.from(payload).toString("base64");
      return res.redirect(`https://checkout.paycom.uz/${encoded}`);
    }

    // Test rejimi — haqiqiy hisobsiz sinash uchun
    if (provider === "test" && isTestMode()) {
      return res.redirect(`/checkout/order/${order.id}/test-tasdiqlash`);
    }

    return res.status(400).send("Noto'g'ri to'lov usuli");
  });

  // ---- Test rejimi: to'lovni qo'lda tasdiqlash sahifasi ----
  router.get("/checkout/order/:orderId/test-tasdiqlash", (req, res) => {
    if (!isTestMode()) return res.status(403).send("Test rejimi o'chirilgan");
    if (!req.user) {
      req.session.redirectAfterLogin = req.originalUrl;
      return res.redirect("/kirish");
    }

    const order = db.findOne(
      "orders",
      (o) => o.id === Number(req.params.orderId) && o.user_id === req.user.id
    );
    if (!order) return res.status(404).render("errors/404");

    const product = db.findById("products", order.product_id);
    const orderView = Object.assign({}, order, { product_name: product ? product.name : "" });

    res.render("test-payment", { order: orderView });
  });

  router.post("/checkout/order/:orderId/test-tasdiqlash", (req, res) => {
    if (!isTestMode()) return res.status(403).send("Test rejimi o'chirilgan");
    if (!req.user) {
      req.session.redirectAfterLogin = `/checkout/order/${req.params.orderId}/test-tasdiqlash`;
      return res.redirect("/kirish");
    }

    const order = db.findOne(
      "orders",
      (o) => o.id === Number(req.params.orderId) && o.user_id === req.user.id
    );
    if (!order) return res.status(404).render("errors/404");

    db.updateById("orders", order.id, {
      status: "paid",
      provider: "test",
      paid_at: new Date().toISOString(),
    });

    res.redirect("/kabinet?success=1");
  });

  // ---- CLICK webhook ----
  router.post("/api/payments/click", express.urlencoded({ extended: true }), (req, res) => {
    const result = handleClickRequest(db, req.body);
    res.json(result);
  });

  // ---- PAYME webhook (JSON-RPC) ----
  router.post("/api/payments/payme", express.json(), (req, res) => {
    if (!checkAuth(req)) {
      return res.json({
        jsonrpc: "2.0",
        id: req.body.id,
        error: { code: -32504, message: "Ruxsat berilmagan" },
      });
    }
    const result = handlePaymeRequest(db, req.body);
    res.json(result);
  });

  return router;
};
