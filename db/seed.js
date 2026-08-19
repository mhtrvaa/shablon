// db/seed.js
// Boshlang'ich ma'lumotlarni (7 kategoriya + har biriga bitta namuna mahsulot) bazaga yozadi.
// Ishga tushirish: npm run seed
// Fayl allaqachon to'ldirilgan bo'lsa, qayta yozib yubormaydi (xavfsiz qayta ishga tushirish).

const db = require("./database");

const categories = [
  { slug: "canva", name: "Canva shablonlari", sort_order: 1 },
  { slug: "prezentatsiya", name: "Prezentatsiya shablonlari", sort_order: 2 },
  { slug: "cv-resume", name: "CV / Resume shablonlari", sort_order: 3 },
  { slug: "instagram", name: "Instagram post shablonlari", sort_order: 4 },
  { slug: "ai-prompt", name: "AI prompt paketlari", sort_order: 5 },
  { slug: "oquv", name: "O'quv materiallari", sort_order: 6 },
  { slug: "vebsite", name: "Vebsite shablonlari", sort_order: 7 },
];

const products = [
  {
    slug: "canva",
    name: "Aksiya flyeri + tadbir banneri",
    description: "Ijtimoiy tarmoq va reklama uchun tayyor Canva dizayn maketi. Rasm ko'rinishida keladi — Canva'ga qo'lda ko'chirib olishingiz mumkin.",
    price: 25000,
    file: "canva-dizayn-maketi.zip",
    preview: "/images/products/canva.jpg",
  },
  {
    slug: "prezentatsiya",
    name: "Biznes Pitch Deck — Teal",
    description: "8 slaydli, to'liq tahrirlanadigan professional taqdimot shabloni (.pptx).",
    price: 39000,
    file: "prezentatsiya-teal.pptx",
    preview: "/images/products/prezentatsiya.jpg",
  },
  {
    slug: "cv-resume",
    name: "Navy Sidebar CV",
    description: "Zamonaviy ikki ustunli rezyume shabloni, to'liq tahrirlanadigan Word fayli (.docx).",
    price: 29000,
    file: "cv-shablon-navy.docx",
    preview: "/images/products/cv-resume.jpg",
  },
  {
    slug: "instagram",
    name: "Post & Storiy To'plami",
    description: "4 dona tayyor Instagram post dizayni (1080x1080), izchil rang tizimida.",
    price: 19000,
    file: "instagram-post-toplami.zip",
    preview: "/images/products/instagram.jpg",
  },
  {
    slug: "ai-prompt",
    name: "Marketing Prompt Paketi",
    description: "Marketing uchun 30 ta tayyor va sinovdan o'tgan AI prompt, 5 ta kategoriyaga bo'lingan (.docx).",
    price: 15000,
    file: "ai-prompt-marketing.docx",
    preview: "/images/products/ai-prompt.jpg",
  },
  {
    slug: "oquv",
    name: "Ijtimoiy Tarmoqda Kontent Yaratish",
    description: "Amaliy qo'llanma: kontent turlari, reja tuzish, dizayn asoslari va yakuniy checklist (.docx).",
    price: 19000,
    file: "oquv-kontent-qollanma.docx",
    preview: "/images/products/oquv.jpg",
  },
  {
    slug: "vebsite",
    name: "Orbita — Agentlik Landing Sahifasi",
    description: "To'liq tayyor, mobil-moslashuvchan agentlik/biznes landing sahifa shabloni (.html).",
    price: 149000,
    file: "vebsite-shablon-orbita.html",
    preview: "/images/products/vebsite.jpg",
  },
];

function seed() {
  for (const c of categories) {
    const exists = db.findOne("categories", (r) => r.slug === c.slug);
    if (!exists) db.insert("categories", c);
  }

  let added = 0;
  let updated = 0;

  for (const p of products) {
    const cat = db.findOne("categories", (r) => r.slug === p.slug);
    if (!cat) continue;

    const existingProduct = db.findOne(
      "products",
      (r) => r.category_id === cat.id && r.name === p.name
    );

    if (!existingProduct) {
      db.insert("products", {
        category_id: cat.id,
        name: p.name,
        description: p.description,
        price: p.price,
        file_path: p.file,
        preview_image: p.preview,
      });
      added += 1;
    } else if (!existingProduct.preview_image && p.preview) {
      // Eski yozuvda namuna rasm yo'q edi — bazani butunlay o'chirmasdan to'ldiramiz.
      db.updateById("products", existingProduct.id, { preview_image: p.preview });
      updated += 1;
    }
  }

  if (added > 0) console.log(`${added} ta yangi mahsulot qo'shildi.`);
  if (updated > 0) console.log(`${updated} ta mavjud mahsulotga namuna rasm to'ldirildi.`);
  if (added === 0 && updated === 0) console.log("Hammasi allaqachon yangilangan, o'zgarish kerak emas.");

  console.log("Baza tayyor: kategoriyalar va mahsulotlar yuklandi.");
}

module.exports = seed;

// Terminaldan to'g'ridan-to'g'ri ishga tushirilganda (npm run seed) darhol bajaradi.
// server.js tomonidan require qilinganda esa avtomatik ishlamaydi — u alohida chaqiradi.
if (require.main === module) {
  seed();
}
