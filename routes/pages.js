// routes/pages.js
const express = require("express");

module.exports = function (db) {
  const router = express.Router();

  function withCategory(product) {
    const cat = db.findById("categories", product.category_id);
    return Object.assign({}, product, {
      category_name: cat ? cat.name : "",
      category_slug: cat ? cat.slug : "",
    });
  }

  router.get("/", (req, res) => {
    const categories = db
      .findAll("categories")
      .sort((a, b) => a.sort_order - b.sort_order);

    const featured = db
      .findAll("products")
      .sort((a, b) => a.id - b.id)
      .slice(0, 4)
      .map(withCategory);

    res.render("home", { categories, featured });
  });

  router.get("/kategoriya/:slug", (req, res) => {
    const category = db.findOne("categories", (c) => c.slug === req.params.slug);
    if (!category) return res.status(404).render("errors/404");

    const products = db
      .findAll("products", (p) => p.category_id === category.id)
      .sort((a, b) => b.id - a.id);

    res.render("category", { category, products });
  });

  router.get("/mahsulot/:id", (req, res) => {
    const productRaw = db.findById("products", req.params.id);
    if (!productRaw) return res.status(404).render("errors/404");
    const product = withCategory(productRaw);

    let alreadyOwned = false;
    if (req.user) {
      const owned = db.findOne(
        "orders",
        (o) => o.user_id === req.user.id && o.product_id === product.id && o.status === "paid"
      );
      alreadyOwned = !!owned;
    }

    res.render("product", { product, alreadyOwned });
  });

  return router;
};
