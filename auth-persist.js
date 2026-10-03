// ============================================================
// elium 프로젝트 사이트맵 — 접속 인증 게이트 (v2)
// 비밀번호는 파일에 글자 그대로 두지 않고, 암호화한 값(PBKDF2-SHA256)만 비교합니다.
// 로그인은 같은 브라우저의 모든 탭에서 12시간 유지됩니다.
// (내부 열람용 화면 잠금입니다. 데이터 자체의 보호는 Supabase 로그인으로 따로 처리 예정)
// ============================================================
(function(){
  var AUTH_HASH = "9c4b68a4656bfd90f2af7bc29d4d45538f2460ee4334dc62dc2d52d20d63470d";
  var SALT = "elium-site-gate-v1";
  var ITER = 200000;
  var KEEP_MS = 12 * 60 * 60 * 1000;
  var KEY = "elium_auth_until";

  var gate = document.getElementById("authGate");
  var appRoot = document.getElementById("appRoot");
  var idInput = document.getElementById("authId");
  var pwInput = document.getElementById("authPw");
  var btn = document.getElementById("authBtn");
  var errEl = document.getElementById("authError");

  function unlock(){
    // 3D 화면(3d/ 폴더)이 이 탭의 로그인 여부를 확인하는 표시(같은 탭 안에서만 유효)도 같이 남긴다.
    try { sessionStorage.setItem("elium_auth_ok", "1"); } catch (e) {}
    gate.style.display = "none";
    appRoot.style.display = "flex";
    if (typeof startApp === "function") startApp();
  }

  try {
    var until = parseInt(localStorage.getItem(KEY) || "0", 10);
    if (until > Date.now()) { unlock(); return; }
    localStorage.removeItem(KEY);
  } catch (e) {}

  function hashOf(id, pw){
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(id + "\n" + pw), "PBKDF2", false, ["deriveBits"])
      .then(function(key){
        return crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(SALT), iterations: ITER, hash: "SHA-256" }, key, 256);
      })
      .then(function(bits){
        return Array.from(new Uint8Array(bits)).map(function(b){ return b.toString(16).padStart(2, "0"); }).join("");
      });
  }

  function tryLogin(){
    if (!window.crypto || !crypto.subtle) { errEl.textContent = "이 브라우저에서는 로그인을 확인할 수 없습니다(https 주소로 접속해 주세요)."; return; }
    hashOf(idInput.value, pwInput.value).then(function(h){
      if (h === AUTH_HASH) {
        try { localStorage.setItem(KEY, String(Date.now() + KEEP_MS)); } catch (e) {}
        unlock();
      } else {
        errEl.textContent = "ID 또는 비밀번호가 올바르지 않습니다.";
        pwInput.value = "";
        pwInput.focus();
      }
    });
  }

  btn.addEventListener("click", tryLogin);
  idInput.addEventListener("keydown", function(e){ if (e.key === "Enter") tryLogin(); });
  pwInput.addEventListener("keydown", function(e){ if (e.key === "Enter") tryLogin(); });
  idInput.focus();
})();
