
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import FarmScene from '../game/FarmScene';
import { getSlotStatus } from '../utils/gameHelpers';

const PhaserGame = ({ user, activePage, currentUserId, onSlotClick, width = window.innerWidth, height = 400 }) => {
    const gameRef = useRef(null);
    const sceneRef = useRef(null);

    // --- LOGIC HELPER STATUS SLOT (Pindahan dari FarmGrid) ---
    // Kita hitung di sini dan kirim 'Matang' ke Phaser
    const getComputedSlotData = () => {
        if (!user) return {};

        const startSlot = (activePage * 4) + 1;
        const slots = [0, 1, 2, 3].map(i => startSlot + i);
        const slotStatusMap = {};

        slots.forEach(slotNum => {
            // Use Shared Utility
            slotStatusMap[slotNum] = getSlotStatus(slotNum, user);
        });

        return slotStatusMap;
    };

    useEffect(() => {
        // INIT DISINI
        if (gameRef.current) return;

        const config = {
            type: Phaser.AUTO,
            width: width,
            height: height,
            parent: 'phaser-container',
            transparent: true, // Agar background CSS tembus (misal soil pattern)
            scene: [FarmScene],
            scale: {
                mode: Phaser.Scale.RESIZE, // Responsif
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            physics: {
                default: 'arcade',
                arcade: { debug: false }
            }
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;

        // Tangkap Referensi Scene setelah start
        game.events.on('ready', () => {
            // Scene biasanya belum siap instan, tapi kita bisa pakai scene.start
        });

    }, []);

    // UPDATE DATA KE SCENE
    useEffect(() => {
        const game = gameRef.current;
        if (game) {
            // Kirim Data Baru ke Active Scene
            const scene = game.scene.getScene('FarmScene');
            if (scene) {
                const slotMap = getComputedSlotData();
                // Inject slotStatus ke userData copy agar dibaca Phaser
                const dataToSend = {
                    user: { ...user, slotStatus: slotMap },
                    page: activePage,
                    handlers: {
                        onSlotClick: onSlotClick
                    }
                };
                scene.updateData(dataToSend.user, dataToSend.page);
            }
        }
    }, [user, activePage, onSlotClick]);

    return (
        <div id="phaser-container" style={{ width: '100%', height: height, overflow: 'hidden', borderRadius: 20 }}>
            {/* Phaser Canvas will be injected here */}
        </div>
    );
};

export default PhaserGame;
