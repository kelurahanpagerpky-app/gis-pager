/**
 * =============================================================
 *  API CLIENT - Komunikasi dengan Google Apps Script Web App
 * =============================================================
 *  Catatan penting:
 *  Google Apps Script Web App tidak menangani permintaan
 *  "preflight" (OPTIONS) yang dipicu browser saat Content-Type
 *  diset ke "application/json". Karena itu, semua permintaan
 *  POST di sini dikirim dengan Content-Type "text/plain" agar
 *  dianggap "simple request" oleh browser dan tidak memicu
 *  preflight -> mencegah error CORS.
 * =============================================================
 */
const GisApi = (function () {
  function getUrl() {
    var url = (typeof APP_CONFIG !== "undefined" && APP_CONFIG.APPS_SCRIPT_URL) || "";
    if (!url || url.indexOf("TEMPEL_URL_WEB_APP") !== -1) {
      throw new Error("APPS_SCRIPT_URL belum dikonfigurasi. Buka config.js dan isi URL Web App Apps Script Anda.");
    }
    return url;
  }

  async function get(action) {
    var url = getUrl() + "?action=" + encodeURIComponent(action) + "&_=" + Date.now();
    var res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error("Gagal menghubungi server (HTTP " + res.status + ").");
    return res.json();
  }

  async function post(payload) {
    var res = await fetch(getUrl(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Gagal menghubungi server (HTTP " + res.status + ").");
    return res.json();
  }

  return {
    fetchServices: function () {
      return get("data");
    },
    login: function (username, password) {
      return post({ action: "login", username: username, password: password });
    },
    changePassword: function (token, newPassword) {
      return post({ action: "change_password", token: token, newPassword: newPassword });
    },
    addService: function (token, item) {
      return post({ action: "add_service", token: token, item: item });
    },
    updateService: function (token, id, item) {
      return post({ action: "update_service", token: token, id: id, item: item });
    },
    deleteService: function (token, id) {
      return post({ action: "delete_service", token: token, id: id });
    }
  };
})();
