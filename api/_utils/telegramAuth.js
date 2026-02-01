import crypto from 'crypto';

export const verifyTelegramWebAppData = (initData) => {
  if (!initData) return null;

  // Pastikan TELEGRAM_BOT_TOKEN sudah diset di Environment Variables Vercel
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN missing in ENV!");
    return null; 
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => `${key}=${val}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash === hash) {
      const userStr = urlParams.get('user');
      return JSON.parse(userStr);
    } else {
      console.warn("Invalid Telegram Hash (Potensi Hacker)!");
      return null;
    }
  } catch (error) {
    return null;
  }
};
