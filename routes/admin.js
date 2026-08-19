// routes/admin.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const { requireAuth, requireAdmin } = require("../middleware/auth");

module.exports = function (db) {
  const router = express.Router();
  router.use(requireAuth, requireAdmin);

  const uploadsDir = path.join(__dirname, "..", "uploads");
  const previewDir = path.join(__dirname, "..", "public", "images", "products");

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, file.fieldname === "preview" ? previewDir : uploadsDir);
    },
    filename: (req, file, cb) => {
      const safeName = Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      cb(null, safeName);
    },
  });
  const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
  const uploadFields = upload.fields([{ name: "file", maxCount: 1 }, { name: "preview", maxCount: 1 }]);

  router.get("/admin/mahsulotlar", (req, res) => {
    const products = db
      .findAll("products")
      .map((p) => {
        const cat = db.findById("categories", p.category_id);
        return Object.assign({}, p, { category_name: cat ? cat.name : "" });
      })
      .sort((a, b) => b.id - a.id);

    res.render("admin/products", { products });
  });

  router.get("/admin/mahsulotlar/yangi", (req, res) => {
    const categories = db.findAll("categories").sort((a, b) => a.sort_order - b.sort_order);
    res.render("admin/new-product", { categories, error: null });
  });

  router.post("/admin/mahsulotlar/yangi", uploadFields, (req, res) => {
    const { category_id, name, description, price } = req.body;
    const categories = db.findAll("categories").sort((a, b) => a.sort_order - b.sort_order);
    const mainFile = req.files && req.files.file && req.files.file[0];
    const previewFile = req.files && req.files.preview && req.files.preview[0];

    if (!category_id || !name || !price || !mainFile) {
      return res.render("admin/new-product", {
        categories,
        error: "Barcha maydonlarni to'ldiring va faylni tanlang.",
      });
    }

    db.insert("products", {
      category_id: Number(category_id),
      name,
      description: description || "",
      price: Number(price),
      file_path: mainFile.filename,
      preview_image: previewFile ? `/images/products/${previewFile.filename}` : null,
    });

    res.redirect("/admin/mahsulotlar");
  });

  router.post("/admin/mahsulotlar/:id/ochirish", (req, res) => {
    const hasOrders = db.findOne("orders", (o) => o.product_id === Number(req.params.id));

    if (hasOrders) {
      // Bu mahsulotni allaqachon xarid qilishgan — ma'lumotlar bazasi bog'liqligini
      // buzmaslik uchun o'chirishga ruxsat bermaymiz.
      return res.status(400).send(
        "Bu mahsulotni o'chirib bo'lmaydi, chunki uni allaqachon xarid qilishgan. " +
        "Buning o'rniga narxini 0 qilib qo'yishingiz yoki kategoriyasini o'zgartirishingiz mumkin."
      );
    }

    db.deleteById("products", req.params.id);
    res.redirect("/admin/mahsulotlar");
  });

  return router;
};
