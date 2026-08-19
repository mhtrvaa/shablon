// lib/click.js
//
// Click Shop API v2 integratsiyasi.
// Hujjat: https://docs.click.uz (Click Merchant kabinetida to'liq hujjat mavjud)
//
// ESLATMA: Bu fayl Click'ning rasmiy hujjatlashtirilgan Prepare/Complete oqimiga
// asoslanib yozilgan, lekin haqiqiy CLICK_MERCHANT_ID / CLICK_SECRET_KEY bilan
// sinalmagan (bu qiymatlar sizning biznes hisobingizga tegishli). Click test/sandbox
// muhitini taqdim etadi — ishga tushirishdan oldin shu yerda sinab ko'ring.

const crypto = require("crypto");

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

const CLICK_ERROR = {
  SUCCESS: 0,
  SIGN_CHECK_FAILED: -1,
  TRANSACTION_NOT_FOUND: -6,
  ALREADY_PAID: -4,
  USER_NOT_FOUND: -5,
  ORDER_NOT_FOUND: -5,
};

/**
 * Click "Prepare" (action=0) va "Complete" (action=1) so'rovlarini qayta ishlaydi.
 * db — db/database.js dagi ma'lumotlar ombori, req.body — Click yuborgan maydonlar.
 */
function handleClickRequest(db, body) {
  const {
    click_trans_id,
    service_id,
    merchant_trans_id, // bizning order.id
    amount,
    action,
    sign_time,
    sign_string,
    error,
  } = body;

  const secret = process.env.CLICK_SECRET_KEY || "";

  // 1) Imzoni tekshirish
  const baseSign =
    action === "1" || action === 1
      ? `${click_trans_id}${service_id}${secret}${merchant_trans_id}${body.merchant_prepare_id}${amount}${action}${sign_time}`
      : `${click_trans_id}${service_id}${secret}${merchant_trans_id}${amount}${action}${sign_time}`;

  const expectedSign = md5(baseSign);

  if (expectedSign !== sign_string) {
    return {
      click_trans_id,
      merchant_trans_id,
      error: CLICK_ERROR.SIGN_CHECK_FAILED,
      error_note: "Imzo mos kelmadi",
    };
  }

  const order = db.findById("orders", Number(merchant_trans_id));

  if (!order) {
    return {
      click_trans_id,
      merchant_trans_id,
      error: CLICK_ERROR.ORDER_NOT_FOUND,
      error_note: "Buyurtma topilmadi",
    };
  }

  if (Number(error) < 0) {
    // Click tomonidan bekor qilingan
    db.updateById("orders", order.id, { status: "cancelled" });
    return {
      click_trans_id,
      merchant_trans_id,
      error: 0,
      error_note: "Bekor qilindi",
    };
  }

  if (String(action) === "0") {
    // ---- PREPARE ----
    db.insert("payments", {
      order_id: order.id,
      provider: "click",
      transaction_id: String(click_trans_id),
      status: "prepared",
      raw_payload: JSON.stringify(body),
    });

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_prepare_id: order.id,
      error: CLICK_ERROR.SUCCESS,
      error_note: "OK",
    };
  }

  if (String(action) === "1") {
    // ---- COMPLETE ----
    if (order.status === "paid") {
      return {
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: order.id,
        error: CLICK_ERROR.ALREADY_PAID,
        error_note: "Allaqachon to'langan",
      };
    }

    db.updateById("orders", order.id, {
      status: "paid",
      provider: "click",
      paid_at: new Date().toISOString(),
    });

    const payment = db.findOne(
      "payments",
      (p) => p.order_id === order.id && p.provider === "click"
    );
    if (payment) db.updateById("payments", payment.id, { status: "completed" });

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: order.id,
      error: CLICK_ERROR.SUCCESS,
      error_note: "To'lov qabul qilindi",
    };
  }

  return {
    click_trans_id,
    merchant_trans_id,
    error: -3,
    error_note: "Noma'lum amal (action)",
  };
}

/**
 * Foydalanuvchini Click to'lov sahifasiga yo'naltirish uchun URL yasaydi.
 */
function buildClickPayUrl({ orderId, amount, returnUrl }) {
  const merchantId = process.env.CLICK_MERCHANT_ID;
  const serviceId = process.env.CLICK_SERVICE_ID;
  const params = new URLSearchParams({
    service_id: serviceId,
    merchant_id: merchantId,
    amount: String(amount),
    transaction_param: String(orderId),
    return_url: returnUrl,
  });
  return `https://my.click.uz/services/pay?${params.toString()}`;
}

module.exports = { handleClickRequest, buildClickPayUrl };
