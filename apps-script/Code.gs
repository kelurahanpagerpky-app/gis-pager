/*
 * =============================================================
 *  GIS TERPADU KELURAHAN PAGER & KECAMATAN RAKUMPIT
 *  Backend Google Apps Script (Database: Google Spreadsheet)
 * =============================================================
 *  Sheet yang dipakai (dibuat otomatis saat pertama kali dipanggil):
 *   1. "GIS_Pager_Data"  -> data titik layanan (ditampilkan di peta)
 *   2. "Admin_Accounts"  -> akun admin (username, password ter-hash)
 *
 *  Cara deploy:
 *   1. Buka Google Spreadsheet baru -> Extensions > Apps Script
 *   2. Hapus isi default, tempel seluruh isi file ini
 *   3. Klik Deploy > New deployment > Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   4. Salin URL Web App, tempel ke config.js (APPS_SCRIPT_URL)
 * =============================================================
 */

const DATA_SHEET_NAME  = "GIS_Pager_Data";
const ADMIN_SHEET_NAME = "Admin_Accounts";
const TOKEN_TTL_SECONDS = 6 * 60 * 60; // sesi admin berlaku 6 jam

const DATA_HEADERS  = ["id", "name", "category", "village", "lat", "lng", "desc", "contact", "updatedAt"];
const ADMIN_HEADERS = ["username", "passwordHash", "role", "createdAt"];

// Akun default yang otomatis dibuat saat sheet Admin pertama kali dibuat.
// SEGERA GANTI PASSWORD INI setelah login pertama kali!
const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "pager2026";

/* ==================== ENTRY POINTS ==================== */

function doGet(e) {
  try {
    var action = (e.parameter.action || "data").toLowerCase();

    if (action === "data") {
      return jsonOutput({ status: "success", data: getAllServices_() });
    }

    return jsonOutput({ status: "error", message: "Aksi GET tidak dikenali." });
  } catch (err) {
    return jsonOutput({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return jsonOutput({ status: "error", message: "Tidak ada data yang dikirim." });
    }

    var body = JSON.parse(e.postData.contents);
    var action = (body.action || "").toLowerCase();

    switch (action) {
      case "login":
        return jsonOutput(handleLogin_(body));
      case "change_password":
        return jsonOutput(withAuth_(body, function (username) {
          return handleChangePassword_(username, body);
        }));
      case "add_service":
        return jsonOutput(withAuth_(body, function () {
          return handleAddService_(body.item);
        }));
      case "update_service":
        return jsonOutput(withAuth_(body, function () {
          return handleUpdateService_(body.id, body.item);
        }));
      case "delete_service":
        return jsonOutput(withAuth_(body, function () {
          return handleDeleteService_(body.id);
        }));
      case "sync_all": // kompatibel dengan versi lama (impor massal)
        return jsonOutput(withAuth_(body, function () {
          return handleSyncAll_(body.items);
        }));
      default:
        return jsonOutput({ status: "error", message: "Aksi POST tidak dikenali." });
    }
  } catch (err) {
    return jsonOutput({ status: "error", message: err.toString() });
  }
}

/* ==================== AUTH ==================== */

function handleLogin_(body) {
  var username = String(body.username || "").trim();
  var password = String(body.password || "");

  if (!username || !password) {
    return { status: "error", message: "Username dan password wajib diisi." };
  }

  var sheet = getOrCreateAdminSheet_();
  var rows = sheet.getDataRange().getValues();
  var hash = hashPassword_(password);

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase() === username.toLowerCase()) {
      if (rows[i][1] === hash) {
        var token = Utilities.getUuid();
        CacheService.getScriptCache().put("session_" + token, username, TOKEN_TTL_SECONDS);
        return { status: "success", token: token, username: username, expiresIn: TOKEN_TTL_SECONDS };
      }
      return { status: "error", message: "Username atau password salah." };
    }
  }

  return { status: "error", message: "Username atau password salah." };
}

/**
 * Membungkus setiap aksi yang butuh login. Mengecek token di cache,
 * lalu menjalankan fn(username) jika valid.
 */
function withAuth_(body, fn) {
  var token = body.token;
  if (!token) {
    return { status: "error", message: "Sesi tidak ditemukan. Silakan login kembali.", authError: true };
  }
  var username = CacheService.getScriptCache().get("session_" + token);
  if (!username) {
    return { status: "error", message: "Sesi telah berakhir. Silakan login kembali.", authError: true };
  }
  return fn(username);
}

function handleChangePassword_(username, body) {
  var newPassword = String(body.newPassword || "");
  if (newPassword.length < 6) {
    return { status: "error", message: "Password baru minimal 6 karakter." };
  }
  var sheet = getOrCreateAdminSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase() === username.toLowerCase()) {
      sheet.getRange(i + 1, 2).setValue(hashPassword_(newPassword));
      return { status: "success", message: "Password berhasil diperbarui." };
    }
  }
  return { status: "error", message: "Akun tidak ditemukan." };
}

function hashPassword_(password) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return digest.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

/* ==================== DATA LAYANAN (CRUD) ==================== */

function getAllServices_() {
  var sheet = getOrCreateDataSheet_();
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var data = [];

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0]) continue; // lewati baris kosong
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    data.push(obj);
  }
  return data;
}

function handleAddService_(item) {
  if (!item || !item.name) {
    return { status: "error", message: "Data layanan tidak valid." };
  }
  var sheet = getOrCreateDataSheet_();
  var id = Utilities.getUuid();
  sheet.appendRow([
    id,
    item.name || "",
    item.category || "",
    item.village || "",
    parseFloat(item.lat) || 0,
    parseFloat(item.lng) || 0,
    item.desc || "",
    item.contact || "",
    new Date()
  ]);
  return { status: "success", message: "Titik layanan berhasil ditambahkan.", id: id };
}

function handleUpdateService_(id, item) {
  if (!id) return { status: "error", message: "ID data tidak ditemukan." };
  var sheet = getOrCreateDataSheet_();
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      sheet.getRange(i + 1, 1, 1, DATA_HEADERS.length).setValues([[
        id,
        item.name || "",
        item.category || "",
        item.village || "",
        parseFloat(item.lat) || 0,
        parseFloat(item.lng) || 0,
        item.desc || "",
        item.contact || "",
        new Date()
      ]]);
      return { status: "success", message: "Data berhasil diperbarui." };
    }
  }
  return { status: "error", message: "Data dengan ID tersebut tidak ditemukan." };
}

function handleDeleteService_(id) {
  if (!id) return { status: "error", message: "ID data tidak ditemukan." };
  var sheet = getOrCreateDataSheet_();
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Data berhasil dihapus." };
    }
  }
  return { status: "error", message: "Data dengan ID tersebut tidak ditemukan." };
}

function handleSyncAll_(items) {
  if (!Array.isArray(items)) {
    return { status: "error", message: "Format data sinkronisasi tidak valid." };
  }
  var sheet = getOrCreateDataSheet_();
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  items.forEach(function (item) {
    sheet.appendRow([
      item.id || Utilities.getUuid(),
      item.name || "",
      item.category || "",
      item.village || "",
      parseFloat(item.lat) || 0,
      parseFloat(item.lng) || 0,
      item.desc || "",
      item.contact || "",
      new Date()
    ]);
  });
  return { status: "success", message: "Data berhasil disinkronkan ke Spreadsheet." };
}

/* ==================== HELPER SHEET ==================== */

function getOrCreateDataSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DATA_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(DATA_SHEET_NAME);
    sheet.appendRow(DATA_HEADERS);
    sheet.getRange(1, 1, 1, DATA_HEADERS.length).setBackground("#2563eb").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateAdminSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ADMIN_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(ADMIN_SHEET_NAME);
    sheet.appendRow(ADMIN_HEADERS);
    sheet.getRange(1, 1, 1, ADMIN_HEADERS.length).setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);

    // Buat akun admin default (WAJIB diganti setelah login pertama)
    sheet.appendRow([
      DEFAULT_ADMIN_USERNAME,
      hashPassword_(DEFAULT_ADMIN_PASSWORD),
      "superadmin",
      new Date()
    ]);
  }
  return sheet;
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

