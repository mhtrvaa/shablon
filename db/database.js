// db/database.js
//
// Oddiy, hech qanday tashqi kompilyatsiya (C++/Visual Studio) TALAB QILMAYDIGAN
// baza qatlami. Ma'lumotlar oddiy JSON fayl (data/db.json) da saqlanadi.
// Faqat Node.js'ning o'zidagi "fs" moduli ishlatiladi — shuning uchun
// `npm install` paytida hech qanday native-kompilyatsiya xatosi chiqmaydi.
//
// Diqqat: bu kichik/o'rta hajmdagi loyihalar uchun yetarli. Katta yuklama
// kutilsa, kelajakda PostgreSQL kabi haqiqiy serverga o'tish tavsiya etiladi
// (README.md'da yozilgan).

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function defaultData() {
  return {
    users: [],
    categories: [],
    products: [],
    orders: [],
    payments: [],
    _seq: { users: 0, categories: 0, products: 0, orders: 0, payments: 0 },
  };
}

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData(), null, 2), "utf-8");
  }
}

ensureFile();
let data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));

function persist() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function nextId(table) {
  data._seq[table] = (data._seq[table] || 0) + 1;
  return data._seq[table];
}

// Yangi qator qo'shadi va uni qaytaradi.
function insert(table, row) {
  const record = Object.assign(
    { id: nextId(table) },
    row,
    { created_at: row.created_at || new Date().toISOString() }
  );
  data[table].push(record);
  persist();
  return record;
}

function findById(table, id) {
  const numId = Number(id);
  return data[table].find((r) => r.id === numId) || null;
}

function findOne(table, predicate) {
  return data[table].find(predicate) || null;
}

function findAll(table, predicate) {
  return predicate ? data[table].filter(predicate) : data[table].slice();
}

function updateById(table, id, patch) {
  const row = findById(table, id);
  if (!row) return null;
  Object.assign(row, patch);
  persist();
  return row;
}

function countAll(table, predicate) {
  return findAll(table, predicate).length;
}

function deleteById(table, id) {
  const numId = Number(id);
  const idx = data[table].findIndex((r) => r.id === numId);
  if (idx === -1) return false;
  data[table].splice(idx, 1);
  persist();
  return true;
}

module.exports = {
  data,
  insert,
  findById,
  findOne,
  findAll,
  updateById,
  countAll,
  deleteById,
  persist,
};

