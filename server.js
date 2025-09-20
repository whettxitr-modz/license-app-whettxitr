const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const secret = "Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E";
const KEYS_FILE = "./keys.json";

// Load key dari file JSON
function loadKeys() {
  if (!fs.existsSync(KEYS_FILE)) return [];
  return JSON.parse(fs.readFileSync(KEYS_FILE));
}

// Simpan key ke file JSON
function saveKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

app.post("/public/connect", (req, res) => {
  const userKey = req.body.user_key;
  const deviceId = req.body.serial;
  let keys = loadKeys();
  let keyObj = keys.find(k => k.key === userKey);

  if (!keyObj) {
    return res.json({ status: false, reason: "Invalid Key" });
  }

  const now = Date.now();

  // Jika belum dipakai → aktifkan
  if (keyObj.status === "unused") {
    keyObj.device_id = deviceId;
    keyObj.activated_at = now;
    keyObj.expire_at = now + keyObj.duration * 24 * 60 * 60 * 1000;
    keyObj.status = "active";
    saveKeys(keys);
  }

  // Cek device lock
  if (keyObj.device_id !== deviceId) {
    return res.json({ status: false, reason: "Key already used on another device" });
  }

  // Cek expired
  if (now > keyObj.expire_at) {
    keyObj.status = "expired";
    saveKeys(keys);
    return res.json({ status: false, reason: "Key expired" });
  }

  // Generate token
  const authString = `PUBG-${userKey}-${deviceId}-${secret}`;
  const token = crypto.createHash("md5").update(authString).digest("hex");

  return res.json({
    status: true,
    data: {
      token: token,
      expire_at: keyObj.expire_at
    }
  });
});

app.listen(3000, () => console.log("Server jalan di port 3000"));
