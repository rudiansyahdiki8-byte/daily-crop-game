import { GameConfig } from './gameConfig.js';

export default function handler(req, res) {
    // Izinkan akses dari mana saja
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Kirim data Config ke frontend
    res.status(200).json(GameConfig);
}
