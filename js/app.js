// app.js
const App = {
  init() {
    const tg = window.Telegram.WebApp;
    tg.ready();

    if (!tg.initDataUnsafe?.user) {
      document.getElementById("app").innerHTML =
        "<h3>Please open this app via Telegram</h3>";
      return;
    }

    fetch("ui/ui.html")
      .then(res => res.text())
      .then(html => {
        document.getElementById("app").innerHTML = html;

        // 🔑 INIT SETELAH UI ADA
        GameState.init(tg.initDataUnsafe.user);
        Farm.init();
        Market.init();

        console.log("UI + Game Loaded");
      });
  }
};

document.addEventListener("DOMContentLoaded", App.init);

