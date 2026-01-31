import axios from 'axios';

// Ganti URL ini jika sudah deploy, untuk local pakai localhost
const API_BASE_URL = '/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Auth Service ---
// --- Auth Service ---
export const loginUser = async (telegramId, username) => {
  // Ambil Data Mentah (String panjang terenkripsi)
  const initDataRaw = window.Telegram?.WebApp?.initData;

  const response = await api.post('/auth/login', { 
    initData: initDataRaw, // Kunci Utama
    
    // Cadangan untuk Dev Mode di Localhost
    telegramId: telegramId, 
    username: username 
  });
  return response.data.data;
};

// --- Farm Service ---
export const startFarming = async (userId, slotId) => {
  const response = await api.post('/farm/start', { userId, slotId });
  return response.data.data;
};

export const harvestCrop = async (userId, slotId) => {
  const response = await api.post('/farm/harvest', { userId, slotId });
  return response.data.data;
};

// --- Market Service ---
// [PERBAIKAN UTAMA ADA DI SINI]
export const sellAllItems = async (userId, useAdBooster = false, itemName = null, qty = null) => {
  const response = await api.post('/market/sell', { 
    userId, 
    useAdBooster,
    itemName, // <-- Skrg data Nama Item dikirim
    qty       // <-- Skrg data Jumlah dikirim
  });
  return response.data.data;
};

export const buyItem = async (userId, itemId) => {
  const response = await api.post('/market/buy', { userId, itemId });
  return response.data.data;
};

// --- Finance Service ---
export const upgradePlan = async (userId, planId) => {
  const response = await api.post('/user/upgrade', { userId, planId }); 
  return response.data.data;
};

export const requestWithdraw = async (userId, amount, address, method) => {
  const response = await api.post('/finance/withdraw', { 
    userId, amount, address, method 
  });
  return response.data.data;
};

// --- Game Service ---
export const spinWheel = async (userId, mode, step = null) => {
  const response = await api.post('/game/spin', { userId, mode, step });
  return response.data.data;
};

export const claimDailyTask = async (userId, taskId) => {
  const response = await api.post('/game/task', { userId, taskId });
  return response.data.data;
};

export const bindUpline = async (userId, uplineId) => {
  const response = await api.post('/user/bind', { userId, uplineId });
  return response.data.data;
};

export const requestDeposit = async (userId, amount, txHash, method) => {
  const response = await api.post('/finance/deposit', { userId, amount, txHash, method });
  return response.data.data;
};

export const useItem = async (userId, itemId) => {
  const response = await api.post('/game/use-item', { userId, itemId });
  return response.data.data;
};
