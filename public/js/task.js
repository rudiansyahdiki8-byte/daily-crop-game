// js/task.js
// TASK SYSTEM (Client Side)
// Mengirim request ke API Server untuk klaim tugas

const TaskSystem = {
    // Definisi Tugas (Harus sinkron dengan server secara ID)
    tasks: [
        { id: 'daily_login', label: 'Daily Login', reward: 100, icon: 'fa-calendar-check' },
        { id: 'visit_farm', label: 'Visit Farm', reward: 50, icon: 'fa-tractor' },
        { id: 'watch_ad', label: 'Watch Ad Reward', reward: 150, icon: 'fa-video' }
    ],

    init() {
        this.render();
    },

    render() {
        const container = document.getElementById('task-area');
        if(!container) return;

        let html = `
            <div class="p-4 pb-24">
                <div class="glass p-6 rounded-[2rem] border border-white/10 mb-6 relative overflow-hidden">
                    <h2 class="text-2xl font-black text-white italic uppercase tracking-wider">Daily Tasks</h2>
                    <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Complete & Earn</p>
                </div>
                <div class="flex flex-col gap-3">
        `;

        this.tasks.forEach(task => {
            // Cek status cooldown dari state
            const lastClaim = GameState.user.task_cooldowns?.[task.id] || 0;
            const now = Date.now();
            const isReady = (now - lastClaim) > (24 * 60 * 60 * 1000); // 24 Jam

            // Khusus Watch Ad, tidak pakai cooldown 24 jam (tergantung logic iklan)
            // Tapi untuk simplifikasi visual kita anggap ready dulu
            
            const btnState = isReady 
                ? `<button onclick="TaskSystem.claim('${task.id}')" class="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all">Claim</button>`
                : `<button disabled class="bg-white/5 text-gray-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase cursor-not-allowed">Done</button>`;

            html += `
                <div class="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <i class="fas ${task.icon} text-emerald-400"></i>
                        </div>
                        <div>
                            <h3 class="text-xs font-bold text-white uppercase">${task.label}</h3>
                            <p class="text-[9px] text-yellow-400 font-black">+${task.reward} PTS</p>
                        </div>
                    </div>
                    ${btnState}
                </div>
            `;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    },

    async claim(taskId) {
        if(window.UIEngine) UIEngine.showRewardPopup("PROCESSING", "Verifying task...", null, "WAIT");

        try {
            // Panggil API Server
            const response = await fetch('/api/task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: GameState.user.userId,
                    taskId: taskId
                })
            });

            const result = await response.json();

            if (result.success) {
                // Update State Lokal (Cooldown)
                if (!GameState.user.task_cooldowns) GameState.user.task_cooldowns = {};
                GameState.user.task_cooldowns[taskId] = Date.now();
                
                // Koin akan update otomatis via onSnapshot di state.js
                
                if(window.UIEngine) UIEngine.showRewardPopup("SUCCESS", `Reward Claimed: ${result.reward} PTS`, () => {
                    this.render(); // Re-render tombol jadi disabled
                }, "AWESOME");
            } else {
                if(window.UIEngine) UIEngine.showRewardPopup("FAILED", result.message, null, "OK");
            }

        } catch (error) {
            console.error("Task Error:", error);
            if(window.UIEngine) UIEngine.showRewardPopup("ERROR", "Connection Failed", null, "RETRY");
        }
    }
};

window.TaskSystem = TaskSystem;
