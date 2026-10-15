(() => {
  const STORAGE_KEY = "aquastudent.daily.v1";
  const DEFAULT_TARGET = 2000;
  const MAX_DATE_MILLISECONDS = 8_640_000_000_000_000;
  const numberFormat = new Intl.NumberFormat("id-ID");
  const isValidReminderInterval = (minutes) => Number.isSafeInteger(minutes)
    && minutes > 0
    && minutes <= Math.floor((MAX_DATE_MILLISECONDS - Date.now()) / 60_000);
  let reminderAudioContext = null;
  const elements = {
    todayLabel: document.querySelector("#todayLabel"),
    totalAmount: document.querySelector("#totalAmount"),
    targetLabel: document.querySelector("#targetLabel"),
    targetInput: document.querySelector("#targetInput"),
    progressPercent: document.querySelector("#progressPercent"),
    progressTrack: document.querySelector("#progressTrack"),
    progressFill: document.querySelector("#progressFill"),
    remainingAmount: document.querySelector("#remainingAmount"),
    progressMessage: document.querySelector("#progressMessage"),
    historyList: document.querySelector("#historyList"),
    emptyHistory: document.querySelector("#emptyHistory"),
    entryCount: document.querySelector("#entryCount"),
    historyActions: document.querySelector("#historyActions"),
    resetButton: document.querySelector("#resetButton"),
    customAddForm: document.querySelector("#customAddForm"),
    customAmount: document.querySelector("#customAmount"),
    reminderInterval: document.querySelector("#reminderInterval"),
    reminderToggle: document.querySelector("#reminderToggle"),
    reminderBadge: document.querySelector("#reminderBadge"),
    reminderFeedback: document.querySelector("#reminderFeedback")
  };

  const todayKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const createState = () => ({
    date: todayKey(),
    target: DEFAULT_TARGET,
    entries: [],
    reminder: { enabled: false, intervalMinutes: 60, nextAt: null }
  });

  const loadState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || typeof saved !== "object") return createState();
      const state = createState();
      state.date = typeof saved.date === "string" ? saved.date : todayKey();
      state.target = Number.isFinite(Number(saved.target)) ? Math.min(10000, Math.max(250, Number(saved.target))) : DEFAULT_TARGET;
      state.entries = Array.isArray(saved.entries)
        ? saved.entries.filter((entry) => Number.isFinite(entry.amount) && entry.amount > 0 && typeof entry.time === "string")
        : [];
      if (saved.reminder && typeof saved.reminder === "object") {
        state.reminder.enabled = saved.reminder.enabled === true;
        state.reminder.intervalMinutes = isValidReminderInterval(saved.reminder.intervalMinutes)
          ? saved.reminder.intervalMinutes
          : 60;
        state.reminder.nextAt = Number.isFinite(saved.reminder.nextAt) ? saved.reminder.nextAt : null;
      }
      return state;
    } catch {
      return createState();
    }
  };

  let state = loadState();
  if (state.date !== todayKey()) {
    state.date = todayKey();
    state.entries = [];
    state.reminder.nextAt = state.reminder.enabled
      ? Date.now() + state.reminder.intervalMinutes * 60_000
      : null;
  }

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      elements.reminderFeedback.textContent = "Penyimpanan browser tidak tersedia. Progres mungkin tidak tersimpan.";
    }
  };

  const getTotal = () => state.entries.reduce((total, entry) => total + entry.amount, 0);

  const setTodayLabel = () => {
    elements.todayLabel.textContent = new Intl.DateTimeFormat("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }).format(new Date());
  };

  const renderProgress = () => {
    const total = getTotal();
    const percentage = Math.round((total / state.target) * 100);
    const remaining = Math.max(0, state.target - total);
    elements.totalAmount.textContent = numberFormat.format(total);
    elements.targetLabel.textContent = `${numberFormat.format(state.target)} ml`;
    elements.targetInput.value = state.target;
    elements.progressPercent.textContent = `${percentage}%`;
    elements.progressFill.style.width = `${Math.min(100, percentage)}%`;
    elements.progressTrack.setAttribute("aria-valuenow", String(Math.min(100, percentage)));
    elements.remainingAmount.textContent = numberFormat.format(remaining);
    elements.progressMessage.textContent = total >= state.target
      ? "Target harian tercapai. Kerja bagus!"
      : total === 0
        ? "Ayo mulai dengan satu gelas."
        : "Bagus, lanjutkan sedikit demi sedikit.";
  };

  const renderHistory = () => {
    const entries = [...state.entries].sort((first, second) => new Date(second.time) - new Date(first.time));
    elements.historyList.replaceChildren();
    elements.emptyHistory.hidden = entries.length > 0;
    elements.historyActions.hidden = entries.length === 0;
    elements.entryCount.textContent = `${entries.length} ${entries.length === 1 ? "catatan" : "catatan"}`;

    for (const entry of entries) {
      const item = document.createElement("li");
      item.className = "history-item";
      const icon = document.createElement("span");
      icon.className = "history-item-icon";
      icon.innerHTML = '<i class="bi bi-droplet" aria-hidden="true"></i>';
      const detail = document.createElement("span");
      detail.className = "history-detail";
      const amount = document.createElement("span");
      amount.className = "history-amount";
      amount.textContent = `+${numberFormat.format(entry.amount)} ml`;
      const time = document.createElement("span");
      time.className = "history-time";
      time.textContent = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(entry.time));
      detail.append(amount, time);
      const remove = document.createElement("button");
      remove.className = "remove-entry";
      remove.type = "button";
      remove.dataset.entryId = entry.id;
      remove.setAttribute("aria-label", `Hapus catatan ${numberFormat.format(entry.amount)} mililiter`);
      remove.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
      item.append(icon, detail, remove);
      elements.historyList.append(item);
    }
  };

  const isNotificationSupported = () => "Notification" in window;
  const resumeReminderAudio = () => {
    if (!window.AudioContext) {
      throw new Error("Browser ini belum mendukung suara pengingat.");
    }
    if (!reminderAudioContext) reminderAudioContext = new window.AudioContext();
    return reminderAudioContext.resume();
  };
  const playReminderSound = () => {
    if (!reminderAudioContext || reminderAudioContext.state !== "running") return false;
    const startAt = reminderAudioContext.currentTime;
    const oscillator = reminderAudioContext.createOscillator();
    const volume = reminderAudioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, startAt);
    oscillator.frequency.setValueAtTime(660, startAt + 0.14);
    volume.gain.setValueAtTime(0.0001, startAt);
    volume.gain.exponentialRampToValueAtTime(0.12, startAt + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.32);
    oscillator.connect(volume);
    volume.connect(reminderAudioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.33);
    return true;
  };
  const isSecureReminderContext = () => {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    return window.isSecureContext || protocol === "https:" || host === "localhost" || host === "127.0.0.1";
  };

  const renderReminder = () => {
    const enabled = state.reminder.enabled;
    elements.reminderBadge.textContent = enabled ? "AKTIF" : "NONAKTIF";
    elements.reminderBadge.classList.toggle("active", enabled);
    elements.reminderToggle.classList.toggle("is-active", enabled);
    elements.reminderToggle.innerHTML = enabled
      ? '<i class="bi bi-bell-slash" aria-hidden="true"></i> Matikan pengingat'
      : '<i class="bi bi-bell-fill" aria-hidden="true"></i> Aktifkan pengingat';
    elements.reminderInterval.value = String(state.reminder.intervalMinutes);
    if (enabled && state.reminder.nextAt) {
      const minutes = Math.max(1, Math.ceil((state.reminder.nextAt - Date.now()) / 60_000));
      const soundHint = reminderAudioContext?.state === "running"
        ? ""
        : " Klik halaman untuk mengaktifkan suara.";
      elements.reminderFeedback.textContent = `Pengingat berikutnya sekitar ${minutes} menit lagi. Biarkan halaman ini tetap terbuka.${soundHint}`;
    } else if (!enabled && !elements.reminderFeedback.textContent.startsWith("Notifikasi")) {
      elements.reminderFeedback.textContent = "Notifikasi hanya muncul saat halaman ini terbuka.";
    }
  };

  const render = () => {
    renderProgress();
    renderHistory();
    renderReminder();
  };

  const addWater = (amount) => {
    if (!Number.isFinite(amount) || amount < 1 || amount > 5000) return;
    state.entries.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, amount: Math.round(amount), time: new Date().toISOString() });
    saveState();
    render();
  };

  document.querySelectorAll(".quick-add").forEach((button) => {
    button.addEventListener("click", () => addWater(Number(button.dataset.amount)));
  });

  document.addEventListener("click", () => {
    if (!state.reminder.enabled || reminderAudioContext?.state === "running") return;
    try {
      resumeReminderAudio().then(() => {
        renderReminder();
      }, () => {
        elements.reminderFeedback.textContent = "Suara pengingat belum bisa diaktifkan oleh browser ini.";
      });
    } catch (error) {
      elements.reminderFeedback.textContent = error.message;
    }
  });

  elements.customAddForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const amount = Number(elements.customAmount.value);
    if (amount < 1 || amount > 5000) {
      elements.customAmount.setCustomValidity("Masukkan jumlah antara 1 dan 5.000 ml.");
      elements.customAmount.reportValidity();
      return;
    }
    elements.customAmount.setCustomValidity("");
    addWater(amount);
    elements.customAddForm.reset();
  });
  elements.customAmount.addEventListener("input", () => elements.customAmount.setCustomValidity(""));

  elements.targetInput.addEventListener("change", () => {
    const target = Number(elements.targetInput.value);
    if (!Number.isFinite(target) || target < 250 || target > 10000) {
      elements.targetInput.value = state.target;
      return;
    }
    state.target = Math.round(target);
    saveState();
    renderProgress();
  });

  elements.historyList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-entry-id]");
    if (!button) return;
    state.entries = state.entries.filter((entry) => entry.id !== button.dataset.entryId);
    saveState();
    render();
  });

  elements.resetButton.addEventListener("click", () => {
    if (!window.confirm("Hapus semua catatan minum hari ini?")) return;
    state.entries = [];
    saveState();
    render();
  });

  elements.reminderInterval.addEventListener("change", () => {
    const intervalMinutes = elements.reminderInterval.valueAsNumber;
    if (!elements.reminderInterval.checkValidity()) {
      elements.reminderInterval.reportValidity();
      elements.reminderInterval.value = String(state.reminder.intervalMinutes);
      return;
    }
    if (!isValidReminderInterval(intervalMinutes)) {
      elements.reminderInterval.setCustomValidity("Masukkan interval menit yang lebih kecil.");
      elements.reminderInterval.reportValidity();
      elements.reminderInterval.setCustomValidity("");
      elements.reminderInterval.value = String(state.reminder.intervalMinutes);
      return;
    }
    state.reminder.intervalMinutes = intervalMinutes;
    if (state.reminder.enabled) state.reminder.nextAt = Date.now() + state.reminder.intervalMinutes * 60_000;
    saveState();
    renderReminder();
  });

  elements.reminderToggle.addEventListener("click", async () => {
    if (state.reminder.enabled) {
      state.reminder.enabled = false;
      state.reminder.nextAt = null;
      elements.reminderFeedback.textContent = "Pengingat sudah dimatikan.";
      saveState();
      renderReminder();
      return;
    }

    if (!isNotificationSupported()) {
      elements.reminderFeedback.textContent = "Browser ini belum mendukung notifikasi. Coba Chrome, Edge, atau Firefox terbaru.";
      return;
    }

    if (window.location.protocol === "file:") {
      elements.reminderFeedback.textContent = "Pengingat notifikasi tidak bisa berjalan saat halaman dibuka dari file://. Buka project lewat localhost atau HTTPS, lalu izinkan notifikasi di browser.";
      return;
    }

    if (!isSecureReminderContext()) {
      elements.reminderFeedback.textContent = "Pengingat notifikasi hanya bisa bekerja saat halaman dibuka lewat localhost/https. Jalankan project dengan server lokal seperti: python -m http.server 8000";
      return;
    }

    let audioReady;
    try {
      audioReady = resumeReminderAudio().then(() => true, () => false);
    } catch (error) {
      elements.reminderFeedback.textContent = error.message;
      return;
    }

    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission !== "granted") {
      elements.reminderFeedback.textContent = permission === "denied"
        ? "Izin notifikasi diblokir. Ubah izin situs dari pengaturan browser untuk mengaktifkannya."
        : "Izin notifikasi belum diberikan.";
      return;
    }
    if (!await audioReady) {
      elements.reminderFeedback.textContent = "Suara pengingat belum bisa diaktifkan oleh browser ini. Izinkan audio situs, lalu coba lagi.";
      return;
    }
    state.reminder.enabled = true;
    state.reminder.nextAt = Date.now() + state.reminder.intervalMinutes * 60_000;
    elements.reminderFeedback.textContent = "Siap! Pengingat dengan suara berjalan selama halaman ini terbuka.";
    saveState();
    renderReminder();
  });

  const checkReminder = () => {
    if (state.date !== todayKey()) {
      state.date = todayKey();
      state.entries = [];
      state.reminder.nextAt = state.reminder.enabled
        ? Date.now() + state.reminder.intervalMinutes * 60_000
        : null;
      setTodayLabel();
      saveState();
      render();
    }
    if (!state.reminder.enabled || !state.reminder.nextAt || Date.now() < state.reminder.nextAt) return;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Waktunya minum air", { body: "Istirahat sebentar dan minum segelas air, ya." });
    }
    const soundPlayed = playReminderSound();
    state.reminder.nextAt = Date.now() + state.reminder.intervalMinutes * 60_000;
    saveState();
    renderReminder();
    if (!soundPlayed) {
      elements.reminderFeedback.textContent = "Notifikasi muncul, tetapi suara belum aktif. Klik halaman untuk mengaktifkannya.";
    }
  };

  setTodayLabel();
  render();
  saveState();
  window.setInterval(checkReminder, 15_000);
})();
