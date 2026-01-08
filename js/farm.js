// farm.js

const Farm = {
  duration: 300, // 5 minutes
  remaining: 300,

  start() {
    this.remaining = this.duration;
    console.log("Farm started");
  },

  harvest() {
    State.coins += 50;
    console.log("Harvested +50 coins");
    this.start();
  }
};
