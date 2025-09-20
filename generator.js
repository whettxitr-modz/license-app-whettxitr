const fs = require("fs");

// buat key random
function generateKey(prefix, count, duration) {
  const keys = [];
  for (let i = 0; i < count; i++) {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    keys.push({
      key: `${prefix}_${rand}`,
      duration: duration,
      status: "unused"
    });
  }
  return keys;
}

// bikin 100 key untuk 3/7/30 hari
const keys3d = generateKey("VIP3D", 100, 3);
const keys7d = generateKey("VIP7D", 100, 7);
const keys30d = generateKey("VIP30D", 100, 30);

const allKeys = [...keys3d, ...keys7d, ...keys30d];

// simpan ke keys.json
fs.writeFileSync("keys.json", JSON.stringify(allKeys, null, 2));
console.log("✅ 300 key berhasil dibuat di keys.json");
