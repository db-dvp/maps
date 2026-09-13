// ============================================================
// elium 프로젝트 사이트맵 — 접속 인증 게이트
// 이 파일은 index.html과 별개로 딱 한 번만 깃허브에 올려두면 됩니다.
// 나중에 index.html이 새 버전으로 바뀌어도 이 파일은 그대로 두시면
// "새로고침해도 로그인 유지, 탭 닫으면 다시 로그인" 동작이 계속 됩니다.
// (내부 열람용 — 실서버 인증이 아닌 클라이언트단 확인입니다)
// ============================================================
(function(){
  var AUTH_ID = "dbdvp";
  var AUTH_PW = "qnsdid1!";
  var SESSION_KEY = "elium_auth_ok";

  var gate = document.getElementById("authGate");
  var appRoot = document.getElementById("appRoot");
  var idInput = document.getElementById("authId");
  var pwInput = document.getElementById("authPw");
  var btn = document.getElementById("authBtn");
  var errEl = document.getElementById("authError");

  function unlock(){
    gate.style.display = "none";
    appRoot.style.display = "flex";
    if (typeof startApp === "function") startApp();
  }

  // 같은 탭에서 이미 인증했던 적이 있으면 (새로고침 포함) 바로 통과
  try {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      unlock();
      return;
    }
  } catch (e) {
    // sessionStorage를 못 쓰는 환경이면 그냥 매번 로그인 화면을 띄움
  }

  function tryLogin(){
    if (idInput.value === AUTH_ID && pwInput.value === AUTH_PW) {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) {}
      unlock();
    } else {
      errEl.textContent = "ID 또는 비밀번호가 올바르지 않습니다.";
      pwInput.value = "";
      pwInput.focus();
    }
  }

  btn.addEventListener("click", tryLogin);
  idInput.addEventListener("keydown", function(e){ if (e.key === "Enter") tryLogin(); });
  pwInput.addEventListener("keydown", function(e){ if (e.key === "Enter") tryLogin(); });
  idInput.focus();
})();
