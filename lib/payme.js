// lib/payme.js
//
// Payme Subscribe API (Merchant API) integratsiyasi — JSON-RPC 2.0 protokoli.
// Hujjat: https://developer.help.paycom.uz
//
// ESLATMA: Bu fayl Payme'ning rasmiy hujjatlashtirilgan JSON-RPC metodlariga
// asoslanib yozilgan, lekin haqiqiy PAYME_MERCHANT_ID / PAYME_SECRET_KEY bilan
// sinalmagan. Payme test/sandbox muhitini taqdim etadi — ishga tushirishdan
// oldin shu yerda sinab ko'ring.

const PAYME_ERROR = {
  INVALID_AMOUNT: -31001,
  ORDER_NOT_FOUND: -31050,
  UNABLE_TO_PERFORM: -31008,
  TRANSACTION_NOT_FOUND: -31003,
  UNABLE_TO_CANCEL: -31007,
  ALREADY_DONE: -31060,
};

function checkAuth(req) {
  const header = req.headers["authorization"] || "";
  const expected =
    "Basic " +
    Buffer.from(`Paycom:${process.env.PAYME_SECRET_KEY || ""}`).toString("base64");
  return header === expected;
}

/**
 * Payme JSON-RPC so'rovini qayta ishlaydi.
 * db — db/database.js dagi ma'lumotlar ombori, body — { method, params, id }
 */
function handlePaymeRequest(db, body) {
  const { method, params, id } = body;

  const respond = (result) => ({ jsonrpc: "2.0", id, result });
  const respondError = (code, message) => ({
    jsonrpc: "2.0",
    id,
    error: { code, message },
  });

  switch (method) {
    case "CheckPerformTransaction": {
      const orderId = params.account && params.account.order_id;
      const order = db.findById("orders", Number(orderId));
      if (!order) return respondError(PAYME_ERROR.ORDER_NOT_FOUND, "Buyurtma topilmadi");
      if (order.amount * 100 !== params.amount) {
        return respondError(PAYME_ERROR.INVALID_AMOUNT, "Summasi mos kelmadi");
      }
      return respond({ allow: true });
    }

    case "CreateTransaction": {
      const orderId = params.account && params.account.order_id;
      const order = db.findById("orders", Number(orderId));
      if (!order) return respondError(PAYME_ERROR.ORDER_NOT_FOUND, "Buyurtma topilmadi");

      const existing = db.findOne(
        "payments",
        (p) => p.order_id === order.id && p.provider === "payme"
      );

      if (existing) {
        return respond({
          create_time: Date.parse(existing.created_at),
          transaction: String(existing.id),
          state: 1,
        });
      }

      const payment = db.insert("payments", {
        order_id: order.id,
        provider: "payme",
        transaction_id: params.id,
        status: "pending",
        raw_payload: JSON.stringify(params),
      });

      return respond({
        create_time: Date.now(),
        transaction: String(payment.id),
        state: 1,
      });
    }

    case "PerformTransaction": {
      const payment = db.findOne(
        "payments",
        (p) => p.transaction_id === paymentIdFromParams(params) && p.provider === "payme"
      );
      if (!payment) return respondError(PAYME_ERROR.TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi");

      if (payment.status === "completed") {
        return respond({
          transaction: String(payment.id),
          perform_time: Date.now(),
          state: 2,
        });
      }

      db.updateById("payments", payment.id, { status: "completed" });
      db.updateById("orders", payment.order_id, {
        status: "paid",
        provider: "payme",
        paid_at: new Date().toISOString(),
      });

      return respond({
        transaction: String(payment.id),
        perform_time: Date.now(),
        state: 2,
      });
    }

    case "CancelTransaction": {
      const payment = db.findOne(
        "payments",
        (p) => p.transaction_id === paymentIdFromParams(params) && p.provider === "payme"
      );
      if (!payment) return respondError(PAYME_ERROR.TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi");

      db.updateById("payments", payment.id, { status: "cancelled" });
      db.updateById("orders", payment.order_id, { status: "cancelled" });

      return respond({
        transaction: String(payment.id),
        cancel_time: Date.now(),
        state: -1,
      });
    }

    case "CheckTransaction": {
      const payment = db.findOne(
        "payments",
        (p) => p.transaction_id === paymentIdFromParams(params) && p.provider === "payme"
      );
      if (!payment) return respondError(PAYME_ERROR.TRANSACTION_NOT_FOUND, "Tranzaksiya topilmadi");

      return respond({
        create_time: Date.parse(payment.created_at),
        perform_time: payment.status === "completed" ? Date.parse(payment.created_at) : 0,
        cancel_time: payment.status === "cancelled" ? Date.parse(payment.created_at) : 0,
        transaction: String(payment.id),
        state:
          payment.status === "completed" ? 2 : payment.status === "cancelled" ? -1 : 1,
      });
    }

    default:
      return respondError(-32601, "Metod topilmadi: " + method);
  }
}

function paymentIdFromParams(params) {
  return params.id;
}

module.exports = { handlePaymeRequest, checkAuth };
