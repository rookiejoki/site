// Komponen Generator Data Dummy
const prefixes = ["Rookie", "Kirinmoe", "Slayer", "Nightcore", "FastHand", "Cyber", "Old", "Santai", "Pro", "King", "Lord", "Shadow", "Viper", "Savage"];
const suffixes = ["Player", "Carry", "ID", "Gamer", "User", "Makar", "Master", "Legend", "Esports", "Slayer", "God", "Boy", "Pro", "Noob"];
const heroes = ["Fanny", "Ling", "Hayabusa", "Lancelot", "Gusion", "Claude", "Chou", "Layla", "Miya", "Eudora", "Alucard", "Zilong", "Franco", "Tigreal"];
const squads = ["ONIC Esports", "RRQ Hoshi", "EVOS Legends", "Alter Ego", "Bigetron Alpha", "Geek Fam", "Tanpa Squad"];

// ARRAY ACHIEVEMENT TERBARU
const achievements = [
  "Mythic Immortal", "Mythic Glory", "Mythic Honor", "Mythic", "Grading", 
  "Legend I", "Legend II", "Legend III", "Legend IV", "Legend V", 
  "Epic I", "Epic II", "Epic III", "Epic IV", "Epic V", 
  "Grandmaster I", "Grandmaster II", "Grandmaster III", "Grandmaster IV", "Grandmaster V", 
  "Master I", "Master II", "Master III", "Master IV", 
  "Elite I", "Elite II", "Elite III", 
  "Warior I", "Warior II", "Warior III"
];

// State Data, Filter, & Admin Control
let allPlayers = [];
let filteredPlayers = [];
let visibleCount = 10;
const STEP = 10;
let currentCategory = "rank";
let searchQuery = "";
let editingPlayerId = null;

// KUNCI ADMIN (PIN RAHASIA)
let isAdmin = false;
const ADMIN_PIN = "050982";

// Inisialisasi Data dari LocalStorage atau Generator Dummy
function initData() {
  const savedData = localStorage.getItem("rookie_leaderboard_data");
  if (savedData) {
    allPlayers = JSON.parse(savedData);
  } else {
    allPlayers = generate1000Players();
    saveToLocalStorage();
  }
}

function saveToLocalStorage() {
  localStorage.setItem("rookie_leaderboard_data", JSON.stringify(allPlayers));
}

// 1. HELPER PENENTU DEVISI BERDASARKAN BINTANG & BINTANG MAKSIMUM TIER
function getDivision(stars, maxStars) {
  if (stars >= maxStars) return "I";
  if (stars >= Math.max(1, maxStars - 1)) return "II";
  if (stars >= Math.max(1, maxStars - 2)) return "III";
  if (stars >= Math.max(1, maxStars - 3)) return "IV";
  return "V";
}

// 2. PEMBATAS BINTANG STRICT BERDASARKAN TIER RANK
function clampStarsByRank(stars, rankName) {
  let safeStars = Math.max(0, parseInt(stars) || 0);

  if (rankName.startsWith("Warior") || rankName.startsWith("Warrior")) return Math.min(safeStars, 3);
  if (rankName.startsWith("Elite")) return Math.min(safeStars, 3);
  if (rankName.startsWith("Master")) return Math.min(safeStars, 4);
  if (rankName.startsWith("Grandmaster") || rankName.startsWith("Epic") || rankName.startsWith("Legend")) {
    return Math.min(safeStars, 5);
  }

  if (rankName === "Grading") return Math.min(safeStars, 15);
  if (rankName === "Mythic" || rankName === "Mythical") return Math.min(Math.max(safeStars, 1), 24);
  if (rankName.includes("Honor")) return Math.min(Math.max(safeStars, 25), 49);
  if (rankName.includes("Glory")) return Math.min(Math.max(safeStars, 50), 99);
  if (rankName.includes("Immortal")) return Math.max(safeStars, 100);

  return safeStars;
}

// 3. PENENTU ACHIEVEMENT AKURAT BERDASARKAN BINTANG & DROPDOWN
function getAchievementByStars(stars, selectedRank = "") {
  const safeStars = Math.max(0, parseInt(stars) || 0);

  if (selectedRank.startsWith("Mythic") || selectedRank.startsWith("Mythical")) {
    if (safeStars >= 100) return "Mythic Immortal";
    if (safeStars >= 50) return "Mythic Glory";
    if (safeStars >= 25) return "Mythic Honor";
    if (safeStars >= 1) return "Mythic";
    return "Grading";
  }

  if (selectedRank.startsWith("Legend")) return `Legend ${getDivision(safeStars, 5)}`;
  if (selectedRank.startsWith("Epic")) return `Epic ${getDivision(safeStars, 5)}`;
  if (selectedRank.startsWith("Grandmaster")) return `Grandmaster ${getDivision(safeStars, 5)}`;
  if (selectedRank.startsWith("Master")) return `Master ${getDivision(safeStars, 4)}`;
  if (selectedRank.startsWith("Elite")) return `Elite ${getDivision(safeStars, 3)}`;
  if (selectedRank.startsWith("Warior") || selectedRank.startsWith("Warrior")) return `Warior ${getDivision(safeStars, 3)}`;

  if (safeStars >= 100) return "Mythic Immortal";
  if (safeStars >= 50) return "Mythic Glory";
  if (safeStars >= 25) return "Mythic Honor";
  if (safeStars >= 1) return "Mythic";

  return selectedRank || "Grading";
}

// Logika Admin Login / Logout
function checkAdminStatus() {
  isAdmin = sessionStorage.getItem("rookie_is_admin") === "true";
  updateAdminUI();
}

function updateAdminUI() {
  const addBtn = document.getElementById("add-player-btn");
  const adminLoginBtn = document.getElementById("admin-login-btn");

  if (isAdmin) {
    if (addBtn) addBtn.classList.remove("hidden");
    if (adminLoginBtn) {
      adminLoginBtn.innerHTML = `<i data-lucide="unlock" class="w-4 h-4 text-emerald-600"></i>`;
      adminLoginBtn.title = "Keluar Mode Admin";
      adminLoginBtn.onclick = logoutAdmin;
    }
  } else {
    if (addBtn) addBtn.classList.add("hidden");
    if (adminLoginBtn) {
      adminLoginBtn.innerHTML = `<i data-lucide="lock" class="w-4 h-4 text-gray-600"></i>`;
      adminLoginBtn.title = "Akses Admin";
      adminLoginBtn.onclick = openAdminModal;
    }
  }
  if (window.lucide) lucide.createIcons();
}

function openAdminModal() {
  const modal = document.getElementById("admin-modal");
  if (modal) {
    modal.classList.remove("hidden");
    document.getElementById("admin-pin-input").value = "";
  }
}

function closeAdminModal() {
  const modal = document.getElementById("admin-modal");
  if (modal) modal.classList.add("hidden");
}

function checkAdminPin() {
  const pin = document.getElementById("admin-pin-input").value;
  if (pin === ADMIN_PIN) {
    isAdmin = true;
    sessionStorage.setItem("rookie_is_admin", "true");
    updateAdminUI();
    renderLeaderboard();
    closeAdminModal();
  } else {
    alert("Kode Token Salah!");
  }
}

function logoutAdmin() {
  isAdmin = false;
  sessionStorage.removeItem("rookie_is_admin");
  updateAdminUI();
  renderLeaderboard();
}

// Format Angka Ribuan/Jutaan
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num ? num.toString() : "0";
}

// Generator 1000 Data Dummy
function generate1000Players() {
  const players = [];
  let currentStars = 250;

  for (let i = 1; i <= 1000; i++) {
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    currentStars -= Math.floor(Math.random() * 2);
    if (currentStars < 0) currentStars = 0;

    const achievement = getAchievementByStars(currentStars);
    const clampedStars = clampStarsByRank(currentStars, achievement);

    players.push({
      id: Date.now() + i,
      rank: i,
      name: `${randomPrefix} ${randomSuffix}`,
      points: `${clampedStars} Stars`,
      hero: heroes[Math.floor(Math.random() * heroes.length)],
      winrate: `${(Math.max(30, 95 - (i * 0.05))).toFixed(1)}%`,
      achievement: achievement,
      koleksi: Math.floor(Math.random() * 400) + 10,
      charisma: Math.floor(Math.random() * 900000) + 10000,
      squad: squads[Math.floor(Math.random() * squads.length)],
      gift: Math.floor(Math.random() * 500000) + 5000,
      popularitas: Math.floor(Math.random() * 2000000) + 50000,
      follower: Math.floor(Math.random() * 100000) + 500,
      mentor: `Level ${Math.floor(Math.random() * 5) + 1}`
    });
  }
  return players;
}

// Penentu Format Nilai Kategori di Kanan
function getCategoryValueHTML(player) {
  switch (currentCategory) {
    case "achievement": return `<span class="text-xs font-bold text-amber-600 block">${player.achievement}</span><span class="text-[9px] text-gray-400">Karir</span>`;
    case "koleksi": return `<span class="text-xs font-bold text-purple-600 block">${player.koleksi} Skin</span><span class="text-[9px] text-gray-400">Koleksi</span>`;
    case "hero": return `<span class="text-xs font-bold text-emerald-600 block">${player.hero}</span><span class="text-[9px] text-gray-400">Main Hero</span>`;
    case "charisma": return `<span class="text-xs font-bold text-pink-600 block">💎 ${formatNumber(player.charisma)}</span><span class="text-[9px] text-gray-400">Charisma</span>`;
    case "squad": return `<span class="text-xs font-bold text-blue-600 block">${player.squad}</span><span class="text-[9px] text-gray-400">Squad</span>`;
    case "gift": return `<span class="text-xs font-bold text-red-500 block">🎁 ${formatNumber(player.gift)}</span><span class="text-[9px] text-gray-400">Gift</span>`;
    case "popularitas": return `<span class="text-xs font-bold text-indigo-600 block">🔥 ${formatNumber(player.popularitas)}</span><span class="text-[9px] text-gray-400">Popularitas</span>`;
    case "follower": return `<span class="text-xs font-bold text-teal-600 block">👥 ${formatNumber(player.follower)}</span><span class="text-[9px] text-gray-400">Followers</span>`;
    case "mentor": return `<span class="text-xs font-bold text-orange-600 block">👑 ${player.mentor}</span><span class="text-[9px] text-gray-400">Mentor</span>`;
    default: return `<span class="text-xs font-bold text-gray-700 block">${player.points}</span><span class="text-[9px] text-emerald-600 font-semibold">WR ${player.winrate}</span>`;
  }
}

// Template Item HTML
function createPlayerItemHTML(player) {
  let badgeColor = "bg-gray-100 text-gray-600";
  if (player.rank === 1) badgeColor = "bg-amber-400 text-white font-bold";
  if (player.rank === 2) badgeColor = "bg-gray-300 text-gray-800 font-bold";
  if (player.rank === 3) badgeColor = "bg-amber-600 text-white font-bold";

  const actionButtons = isAdmin ? `
    <div class="flex items-center gap-1 border-l pl-2 border-gray-100">
      <button onclick="openEditModal(${player.id})" class="p-1 hover:bg-amber-50 text-amber-600 rounded transition" title="Edit">
        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
      </button>
      <button onclick="deletePlayer(${player.id})" class="p-1 hover:bg-red-50 text-red-500 rounded transition" title="Hapus">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    </div>
  ` : '';

  return `
    <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-emerald-200 transition">
      <div class="flex items-center gap-3">
        <span class="w-7 h-6 rounded-full ${badgeColor} flex items-center justify-center text-[10px] shrink-0">
          ${player.rank}
        </span>
        <div>
          <h4 class="font-bold text-gray-800 text-xs">${player.name}</h4>
          <p class="text-[10px] text-gray-400">Hero: ${player.hero} • ${player.squad}</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <div class="text-right">
          ${getCategoryValueHTML(player)}
        </div>
        ${actionButtons}
      </div>
    </div>
  `;
}

// Filter, Sort, & Render
function applyFilterAndSearch() {
  filteredPlayers = allPlayers.filter(player => {
    const query = searchQuery.toLowerCase();
    return player.name.toLowerCase().includes(query) ||
           player.hero.toLowerCase().includes(query) ||
           player.squad.toLowerCase().includes(query);
  });

  if (currentCategory === "koleksi") filteredPlayers.sort((a, b) => b.koleksi - a.koleksi);
  else if (currentCategory === "charisma") filteredPlayers.sort((a, b) => b.charisma - a.charisma);
  else if (currentCategory === "gift") filteredPlayers.sort((a, b) => b.gift - a.gift);
  else if (currentCategory === "popularitas") filteredPlayers.sort((a, b) => b.popularitas - a.popularitas);
  else if (currentCategory === "follower") filteredPlayers.sort((a, b) => b.follower - a.follower);
  else if (currentCategory === "hero") filteredPlayers.sort((a, b) => a.hero.localeCompare(b.hero));
  else if (currentCategory === "squad") filteredPlayers.sort((a, b) => a.squad.localeCompare(b.squad));
  else if (currentCategory === "mentor") filteredPlayers.sort((a, b) => parseInt(b.mentor.replace(/\D/g, '') || 0) - parseInt(a.mentor.replace(/\D/g, '') || 0));
  else filteredPlayers.sort((a, b) => a.rank - b.rank);

  visibleCount = 10;
  renderLeaderboard();
}

function renderLeaderboard() {
  const container = document.getElementById("leaderboard-container");
  const loadMoreBtn = document.getElementById("load-more-btn");
  const loadMoreText = document.getElementById("load-more-text");

  if (!container) return;

  const visibleData = filteredPlayers.slice(0, visibleCount);

  if (visibleData.length === 0) {
    container.innerHTML = `<div class="text-center py-8 text-gray-400 text-xs">Pemain tidak ditemukan</div>`;
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    return;
  }

  container.innerHTML = visibleData.map(createPlayerItemHTML).join('');

  const remaining = filteredPlayers.length - visibleCount;
  if (loadMoreBtn && loadMoreText) {
    if (remaining > 0) {
      loadMoreBtn.style.display = "flex";
      loadMoreText.textContent = `Lihat Selengkapnya (+10 Dari ${remaining} Sisa Data)`;
    } else {
      loadMoreBtn.style.display = "none";
    }
  }

  if (window.lucide) lucide.createIcons();
}

// --- FUNGSI MANAGEMEN PLAYER (CRUD) ---
function reindexRanks() {
  allPlayers.forEach((p, index) => {
    p.rank = index + 1;
  });
}

function deletePlayer(id) {
  if (confirm("Apakah Anda yakin ingin menghapus player ini?")) {
    allPlayers = allPlayers.filter(p => p.id !== id);
    reindexRanks();
    saveToLocalStorage();
    applyFilterAndSearch();
  }
}

function openPlayerModal(isEdit = false, id = null) {
  const modal = document.getElementById("player-modal");
  const modalTitle = document.getElementById("modal-title");
  
  if (!modal) return;
  modal.classList.remove("hidden");

  if (isEdit && id) {
    editingPlayerId = id;
    modalTitle.textContent = "Edit Data Player";
    const player = allPlayers.find(p => p.id === id);
    if (player) {
      document.getElementById("input-name").value = player.name;
      document.getElementById("input-hero").value = player.hero;
      document.getElementById("input-squad").value = player.squad;
      
      const currentAchievement = player.achievement || "Mythic Immortal";
      let rawPoints = parseInt(player.points) || 0;
      rawPoints = clampStarsByRank(rawPoints, currentAchievement);

      document.getElementById("input-achievement").value = currentAchievement;
      document.getElementById("input-points").value = rawPoints;
      document.getElementById("input-winrate").value = player.winrate;
      document.getElementById("input-charisma").value = player.charisma || 0;
      document.getElementById("input-koleksi").value = player.koleksi || 0;
      document.getElementById("input-gift").value = player.gift || 0;
      document.getElementById("input-popularitas").value = player.popularitas || 0;
      document.getElementById("input-follower").value = player.follower || 0;
      document.getElementById("input-mentor").value = player.mentor || "Level 1";
    }
  } else {
    editingPlayerId = null;
    modalTitle.textContent = "Tambah Player Baru";
    document.getElementById("player-form").reset();
  }
}

function openEditModal(id) {
  openPlayerModal(true, id);
}

function closePlayerModal() {
  const modal = document.getElementById("player-modal");
  if (modal) modal.classList.add("hidden");
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById("input-name").value;
  const hero = document.getElementById("input-hero").value;
  const squad = document.getElementById("input-squad").value || "Tanpa Squad";
  
  let pointsVal = parseInt(document.getElementById("input-points").value) || 0;
  const winrate = document.getElementById("input-winrate").value || "50.0%";
  let achievement = document.getElementById("input-achievement").value;

  if (achievement) {
    pointsVal = clampStarsByRank(pointsVal, achievement);
    achievement = getAchievementByStars(pointsVal, achievement);
  } else {
    achievement = getAchievementByStars(pointsVal);
  }

  const charisma = Math.max(0, parseInt(document.getElementById("input-charisma").value) || 0);
  const koleksi = Math.max(0, parseInt(document.getElementById("input-koleksi").value) || 0);
  const gift = Math.max(0, parseInt(document.getElementById("input-gift").value) || 0);
  const popularitas = Math.max(0, parseInt(document.getElementById("input-popularitas").value) || 0);
  const follower = Math.max(0, parseInt(document.getElementById("input-follower").value) || 0);
  const mentor = document.getElementById("input-mentor").value || "Level 1";

  if (editingPlayerId) {
    const index = allPlayers.findIndex(p => p.id === editingPlayerId);
    if (index !== -1) {
      allPlayers[index] = { 
        ...allPlayers[index], 
        name, 
        hero, 
        squad,
        points: `${pointsVal} Stars`, 
        winrate: winrate.includes("%") ? winrate : `${winrate}%`,
        achievement,
        charisma,
        koleksi,
        gift,
        popularitas,
        follower,
        mentor
      };
    }
  } else {
    const newPlayer = {
      id: Date.now(),
      rank: 0,
      name,
      hero,
      squad,
      points: `${pointsVal} Stars`,
      winrate: winrate.includes("%") ? winrate : `${winrate}%`,
      achievement,
      koleksi,
      charisma,
      gift,
      popularitas,
      follower,
      mentor
    };

    allPlayers.push(newPlayer);
  }

  allPlayers.sort((a, b) => (parseInt(b.points) || 0) - (parseInt(a.points) || 0));

  reindexRanks();
  saveToLocalStorage();
  applyFilterAndSearch();
  closePlayerModal();
}

// Event Listeners & Sinkronisasi Real-time Modal
document.addEventListener("DOMContentLoaded", function () {
  initData();
  checkAdminStatus();
  filteredPlayers = [...allPlayers];
  renderLeaderboard();

  const pointsInput = document.getElementById("input-points");
  const achievementSelect = document.getElementById("input-achievement");

  if (pointsInput && achievementSelect) {
    pointsInput.addEventListener("input", function () {
      const currentStars = parseInt(this.value) || 0;
      const detectedRank = getAchievementByStars(currentStars, achievementSelect.value);
      if (detectedRank && achievementSelect.querySelector(`option[value="${detectedRank}"]`)) {
        achievementSelect.value = detectedRank;
      }
    });

    achievementSelect.addEventListener("change", function () {
      if (this.value) {
        pointsInput.value = clampStarsByRank(pointsInput.value, this.value);
      }
    });

    pointsInput.addEventListener("blur", function () {
      if (achievementSelect.value) {
        this.value = clampStarsByRank(this.value, achievementSelect.value);
      }
    });
  }

  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', function() {
      if (this.value < 0 || this.value.includes('-')) {
        this.value = Math.max(0, parseInt(this.value) || 0);
      }
    });
  });

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      searchQuery = e.target.value;
      applyFilterAndSearch();
    });
  }

  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterBtns.forEach((b) => {
        b.classList.remove("bg-emerald-600", "text-white", "border-emerald-600", "shadow-sm");
        b.classList.add("bg-white", "text-gray-600", "border-gray-200");
      });
      this.classList.remove("bg-white", "text-gray-600", "border-gray-200");
      this.classList.add("bg-emerald-600", "text-white", "border-emerald-600", "shadow-sm");

      currentCategory = this.getAttribute("data-category");
      applyFilterAndSearch();
    });
  });

  const loadMoreBtn = document.getElementById("load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", function () {
      if (visibleCount < filteredPlayers.length) {
        visibleCount += STEP;
        renderLeaderboard();
      }
    });
  }

  const playerForm = document.getElementById("player-form");
  if (playerForm) {
    playerForm.addEventListener("submit", handleFormSubmit);
  }
});