// api/_utils/auth.js
import crypto from 'crypto';

export function verifyTelegramWebAppData(telegramInitData) {
  if (!telegramInitData) return null;

  const urlParams = new URLSearchParams(telegramInitData);
  const hash = urlParams.get('hash');
  
  // Hash tidak ikut dalam proses validasi data, jadi dihapus dulu
  urlParams.delete('hash');

  // Urutkan parameter secara alfabetis
  const paramsToCheck = [];
  for (const [key, value] of urlParams.entries()) {
    paramsToCheck.push(`${key}=${value}`);
  }
  paramsToCheck.sort();

  const dataCheckString = paramsToCheck.join('\n');

  // Buat Secret Key dari BOT TOKEN
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  // Hitung Hash dari data yang diterima
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Bandingkan Hash
  if (calculatedHash === hash) {
    // Valid! Kembalikan data user (JSON)
    const userStr = urlParams.get('user');
    return userStr ? JSON.parse(userStr) : null;
  } else {
    return null; // Palsu
  }
}