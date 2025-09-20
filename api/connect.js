import crypto from "crypto";
import fs from "fs";

const secret = "Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E";
const KEYS_FILE = "./keys.json";

function loadKeys() {
  if (!fs.existsSync(KEYS_FILE)) return [];
  return JSON.parse(fs.readFileSync(KEYS_FILE));
}

function saveKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: false, reason: "Only POST allowed" });
  }

  const userKey = req.body.user_key;
  const deviceId = req.body.serial;
  let keys = loadKeys();
  let keyObj = keys.find(k => k.key === userKey);

  if (!keyObj) {
    return res.json({ status: false, reason: "Invalid Key" });
  }

  const now = Date.now();

  if (keyObj.status === "unused") {
    keyObj.device_id = deviceId;
    keyObj.activated_at = now;
    keyObj.expire_at = now + keyObj.duration * 24 * 60 * 60 * 1000;
    keyObj.status = "active";
    saveKeys(keys);
  }

  if (keyObj.device_id !== deviceId) {
    return res.json({ status: false, reason: "Key already used on another device" });
  }

  if (now > keyObj.expire_at) {
    keyObj.status = "expired";
    saveKeys(keys);
    return res.json({ status: false, reason: "Key expired" });
  }

  const authString = `PUBG-${userKey}-${deviceId}-${secret}`;
  const token = crypto.createHash("md5").update(authString).digest("hex");

  return res.json({
    status: true,
    data: {
      token: token,
      expire_at: keyObj.expire_at
    }
  });
}
