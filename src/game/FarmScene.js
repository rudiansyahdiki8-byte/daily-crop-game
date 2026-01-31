import Phaser from 'phaser';

// CONFIG
const GRID_COLS = 2;
const GRID_ROWS = 2;
const SLOT_SIZE = 140; // Ukuran visual slot
const GAP = 20;

export default class FarmScene extends Phaser.Scene {
    constructor() {
        super('FarmScene');
        this.userData = null;
        this.page = 0;
        this.handlers = {}; // { onSlotClick: fn }
    }

    // Terima data dari React
    init(data) {
        this.handlers = data.handlers || {};
        this.updateData(data.user, data.page);
    }

    preload() {
        // --- LOAD ASSETS ---
        // Pastikan file ini ada di public/assets/
        this.load.image('soil_dry', '/assets/soil_dry.png');
        this.load.image('soil_wet', '/assets/soil_wet.png'); // Opsional
        this.load.image('soil_locked', '/assets/soil_locked.png');

        this.load.image('stage_sprout', '/assets/stage_sprout.png');
        this.load.image('stage_growing', '/assets/stage_growing.png');
        this.load.image('stage_ready', '/assets/stage_growing.png'); // Bisa beda image

        // Icons
        // Kita pakai FontAwesome di React, tapi di Phaser butuh gambar.
        // Sementara kita pakai Text Emoji atau Placeholder Graphics jika icon image belum ada.
        // Idealnya: load icon png dari public/assets/icons/
    }

    create() {
        // Container untuk Grid agar mudah ditengahin
        this.gridContainer = this.add.container(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2
        );

        // Initial Render
        this.renderGrid();

        // Event Listener resize (bila perlu, tapi Canvas biasanya fixed size atau scaled)
        this.scale.on('resize', this.resize, this);
    }

    updateData(user, page) {
        this.userData = user;
        this.page = page;
        if (this.scene.isActive()) {
            this.renderGrid();
        }
    }

    renderGrid() {
        if (!this.gridContainer) return;
        this.gridContainer.removeAll(true); // Clear old sprites

        const startSlot = (this.page * 4) + 1;
        const slots = [0, 1, 2, 3].map(i => startSlot + i);

        // Hitung Posisi Grid
        // 2x2 Grid center aligned
        // 0 1
        // 2 3
        const totalW = (GRID_COLS * SLOT_SIZE) + ((GRID_COLS - 1) * GAP);
        const startX = -(totalW / 2) + (SLOT_SIZE / 2);
        const startY = startX; // Square grid

        slots.forEach((slotNum, i) => {
            const row = Math.floor(i / GRID_COLS);
            const col = i % GRID_COLS;
            const x = startX + (col * (SLOT_SIZE + GAP));
            const y = startY + (row * (SLOT_SIZE + GAP));

            this.createSlot(x, y, slotNum);
        });
    }

    createSlot(x, y, slotNum) {
        const slotId = `slot${slotNum}`;
        const status = this.getSlotStatus(slotNum);
        const slotData = this.userData?.farm?.[slotId];

        // 1. BACKGROUND (SOIL)
        let bgKey = 'soil_locked';
        if (status === 'ACTIVE' || status === 'LOCKED_SHOP') bgKey = 'soil_dry';

        const bg = this.add.sprite(x, y, bgKey)
            .setDisplaySize(SLOT_SIZE, SLOT_SIZE)
            .setInteractive();

        // Efek Hover/Click
        bg.on('pointerdown', () => {
            this.handlers.onSlotClick?.(slotId);
            // Kasi Feedback visual
            this.tweens.add({
                targets: [bg, cropSprite, overlayContainer],
                scaleX: bg.scaleX * 0.9,
                scaleY: bg.scaleY * 0.9,
                duration: 50,
                yoyo: true
            });
        });

        // Color Tinting untuk status disabled
        if (status === 'DISABLED') bg.setTint(0x888888);

        this.gridContainer.add(bg);

        let cropSprite = null;
        let overlayContainer = this.add.container(x, y);

        // 2. CONTENT
        if (status === 'ACTIVE') {
            // Slot Number
            const txtNum = this.add.text(-SLOT_SIZE / 2 + 10, -SLOT_SIZE / 2 + 10, `#${slotNum}`, {
                fontSize: '14px', fontFamily: 'Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 3
            }).setOrigin(0);
            overlayContainer.add(txtNum);

            if (slotData) {
                // Ada tanaman
                const now = Date.now();
                const isReady = now >= slotData.harvestAt;
                let cropKey = 'stage_sprout';

                // Logic Stage Visual
                if (isReady) cropKey = 'stage_ready';
                else {
                    // Hitung persen tumbuh
                    // (Ini logic sederhana, visual bisa diperbagus)
                    cropKey = 'stage_growing';
                }

                cropSprite = this.add.sprite(x, y, cropKey);
                // Scale crop agar fit di tanah, anchor bottom
                cropSprite.setOrigin(0.5, 1); // Titik pivot di bawah tengah
                cropSprite.y = y + (SLOT_SIZE / 2) - 10; // Tempel di bawah tanah
                cropSprite.setDisplaySize(SLOT_SIZE * 0.8, SLOT_SIZE * 0.8);

                this.gridContainer.add(cropSprite);

                // BUBBLE HARVEST
                if (isReady) {
                    // Efek Bounce
                    this.tweens.add({
                        targets: cropSprite,
                        scaleY: cropSprite.scaleY * 1.1,
                        duration: 500,
                        yoyo: true,
                        repeat: -1
                    });

                    const harvestText = this.add.text(0, -20, 'HARVEST!', {
                        fontSize: '16px', fontWeight: 'bold', backgroundColor: '#00E676', color: '#000',
                        padding: { x: 5, y: 2 }
                    }).setOrigin(0.5);
                    overlayContainer.add(harvestText);
                } else {
                    // Progress Text (Timer)
                    const timeLeft = Math.max(0, Math.ceil((slotData.harvestAt - now) / 1000));
                    const timeStr = timeLeft > 60 ? `${Math.ceil(timeLeft / 60)}m` : `${timeLeft}s`;

                    const timeTxt = this.add.text(0, 0, timeStr, {
                        fontSize: '14px', color: '#fff', stroke: '#000', strokeThickness: 3
                    }).setOrigin(0.5);
                    overlayContainer.add(timeTxt);
                }

            } else {
                // Kosong -> Tampilkan label Plant
                const plantTxt = this.add.text(0, 0, 'PLANT', {
                    fontSize: '12px', color: '#aaa', stroke: '#000', strokeThickness: 2
                }).setOrigin(0.5);
                overlayContainer.add(plantTxt);
            }

        } else if (status === 'LOCKED_SHOP') {
            const cartTxt = this.add.text(0, 0, '🛒 BUY', {
                fontSize: '16px', color: '#FFD700', stroke: '#000', strokeThickness: 4
            }).setOrigin(0.5);
            overlayContainer.add(cartTxt);
        } else {
            // Locked Plan
            const lockTxt = this.add.text(0, 0, '🔒 LOCKED', {
                fontSize: '14px', color: '#555', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5);
            overlayContainer.add(lockTxt);
        }

        this.gridContainer.add(overlayContainer);
    }

    getSlotStatus(slotNum) {
        if (!this.userData) return 'DISABLED';
        const userSlots = this.userData.slots || [1];
        const PLANS = { FREE: 1, MORTGAGE: 4, TENANT: 7, OWNER: 10 }; // Hardcode Logic sederhana atau import
        // Kita perlu import PLANS dari constants sebenarnya, tapi untuk mempersingkat kita passing atau hardcode visual logic
        // Agar aman, kita bisa pass PLAN LIMIT via userData

        // Logic Duplikasi dari FarmGrid.jsx
        // ... (Simplifikasi untuk demo)
        if (userSlots.includes(slotNum)) return 'ACTIVE';

        // Cek Extra Slot logic... Agak kompleks kalau import constant di sini tanpa setup bundler yang bener
        // Kita asumsikan logic status sudah benar di react, atau kita kirim visualStatus array dari React?
        // -> LEBIH BAIK: React mengirim Array `slotsStatus: [{'id':'slot1', status:'ACTIVE', data:{...}}]`
        //    Supaya logic game tidak bocor ke Phaser. Phaser cuma render.
        // TAPI: Request user "Migrasi ke Phaser".
        // OK, kita pakai prop "slotStatus" yang dikirim React biar clean.

        return this.userData.slotStatus?.[slotNum] || 'DISABLED';
    }
}
