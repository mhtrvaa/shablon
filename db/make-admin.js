// db/make-admin.js
// Oddiy foydalanuvchini admin qilib belgilaydi.
// Ishlatish: avval saytda oddiy tarzda ro'yxatdan o'ting, keyin terminalda:
//   npm run make-admin -- sizning@emailingiz.uz

const db = require("./database");

const email = process.argv[2];

if (!email) {
  console.log("Foydalanish: npm run make-admin -- email@example.com");
  process.exit(1);
}

const user = db.findOne("users", (u) => u.email === email.toLowerCase());

if (!user) {
  console.log(`"${email}" bilan ro'yxatdan o'tgan foydalanuvchi topilmadi. Avval saytda ro'yxatdan o'ting.`);
  process.exit(1);
}

db.updateById("users", user.id, { role: "admin" });
console.log(`"${user.name}" (${user.email}) endi admin.`);
