// LocalStorage Key
const STORAGE_KEY = "ROOKIE_TESTIMONI_DATA";

// Data Dasar Ulasan Spesifik MLBB / Joki
const NAMA_DEPAN = ["Rizky", "Bintang", "Andi", "Fikri", "Dimas", "Bagus", "Bayu", "Eko", "Gilang", "Hendra", "Irfan", "Joko", "Kevin", "Lutfi", "Mahendra", "Naufal", "Oki", "Pratama", "Rian", "Satria", "Taufik", "Wahyu", "Yudi", "Zaky", "Aldo", "Bima", "Candra", "Deni", "Fajar", "Ghanim"];
const KATALOG_TEMPLATES = [
  { rating: 5, pesan: "Gokil sihh!!! Winstreak terus, jadi ingin terus berlangganan buat joki di Rookie Joki." },
  { rating: 5, pesan: "Sekali lagi makasi banyak ya kakk, kakak dan temennya jago2, sory kalau berat gendong beban seperti diriku..." },
  { rating: 4, pesan: "Mantabbbbb!!! Rookie Joki... bisa request hero-hero yang underated juga disini!! Muantabb poolll..." },
  { rating: 5, pesan: "Fast Response, Jokinya cepat selesai dan bisa tembus MRO..." },
  { rating: 4, pesan: "Diajarin Makro & Mikro sedikit sama Penjokinya..." },
  { rating: 4, pesan: "Penjoki yang amanah & termurah disini, terima kasih..." },
  { rating: 5, pesan: "Gokil penjokinya, order jam 2 pagi tetep dilayanin sama miminnya fast respon parah!" },
  { rating: 5, pesan: "Bintang 5 buat penjoki Fanny-nya. Fast hand parah, WR langsung naik drastis!" },
  { rating: 5, pesan: "Proses kilat banget, pesen paket Mythic Immortal langsung tuntas tanpa minus." },
  { rating: 5, pesan: "Amanah banget, akun aman 100% gak ada yang berubah. Makasih banyak bro!" },
  { rating: 4, pesan: "Jokinya mantap cuma agak telat dikit pas jam makan siang. Tapi tetep winstreak!" },
  { rating: 5, pesan: "Recomended banget buat yang mau naikin MMR Hero Favorit!" }
];

// Inisialisasi Generator 1000 Data
function generate1000Testimonials() {
  const dataset = [
    { id: "1000", nama: "Customer-1045", rating: 5, pesan: "Gokil sihh!!! Winstreak terus, jadi ingin terus berlangganan buat joki di Rookie Joki.", tanggal: "25 hari lalu" },
    { id: "999", nama: "Customer-810", rating: 5, pesan: "Sekali lagi makasi banyak ya kakk, kakak dan temennya jago2, sory kalau berat gendong beban seperti diriku...", tanggal: "1 bulan lalu" },
    { id: "998", nama: "Customer-680", rating: 4, pesan: "Mantabbbbb!!! Rookie Joki... bisa request hero-hero yang underated juga disini!! Muantabb poolll...", tanggal: "1 bulan lalu" },
    { id: "997", nama: "Customer-48", rating: 5, pesan: "Fast Response, Jokinya cepat selesai dan bisa tembus MRO...", tanggal: "2 bulan lalu" },
    { id: "996", nama: "Customer-05", rating: 4, pesan: "Diajarin Makro & Mikro sedikit sama Penjokinya...", tanggal: "5 tahun lalu" },
    { id: "995", nama: "Customer-02", rating: 4, pesan: "Penjoki yang amanah & termurah disini, terima kasih...", tanggal: "6 tahun lalu" },
    { id: "994", nama: "Customer-01", rating: 5, pesan: "Gokil penjokinya...", tanggal: "6 tahun lalu" }
  ];

  for (let i = dataset.length + 1; i <= 1000; i++) {
    const randomNameIndex = Math.floor(Math.random() * NAMA_DEPAN.length);
    const useCustomerFormat = Math.random() > 0.4;
    const nama = useCustomerFormat ? `Customer-${1000 - i + 12}` : `${NAMA_DEPAN[randomNameIndex]}_${Math.floor(Math.random() * 99)}`;
    const template = KATALOG_TEMPLATES[Math.floor(Math.random() * KATALOG_TEMPLATES.length)];
    
    let tanggal = "";
    if (i < 50) tanggal = `${Math.floor(i / 2) + 1} hari lalu`;
    else if (i < 200) tanggal = `${Math.floor(i / 15)} minggu lalu`;
    else if (i < 600) tanggal = `${Math.floor(i / 50)} bulan lalu`;
    else tanggal = `${Math.floor(i / 200)} tahun lalu`;

    dataset.push({
      id: String(1000 - i + 1),
      nama: nama,
      rating: template.rating,
      pesan: template.pesan,
      tanggal: tanggal
    });
  }

  return dataset;
}

// Ambil data dari LocalStorage atau buat data baru jika belum ada
function getStoredTestimonials() {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      return JSON.parse(localData);
    } catch (e) {
      console.error("Gagal parse LocalStorage, membuat ulang dataset...", e);
    }
  }
  const freshData = generate1000Testimonials();
  saveTestimonialsToStorage(freshData);
  return freshData;
}

function saveTestimonialsToStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let daftarUlasanMaster = getStoredTestimonials();