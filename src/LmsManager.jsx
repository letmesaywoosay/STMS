// LmsManager.jsx
import { useState, useEffect, useRef } from "react";

const FB_API_KEY = "AIzaSyCarxTqSx__7AfzVNHzN-ilnk0gNN6PkTU";
const FB_PROJECT = "solutiontestsystem";
const FB_BASE    = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/app_data`;

// Firestore REST API 유틸리티
const fbGet = async (key) => {
  const res = await fetch(`${FB_BASE}/${key}?key=${FB_API_KEY}`);
  if(res.status===404) return null;
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const doc = await res.json();
  const raw = doc?.fields?.value?.stringValue;
  return raw ? JSON.parse(raw) : null;
};

const fbSet = async (key, value) => {
  const body = { fields:{ value:{ stringValue: JSON.stringify(value) } } };
  const res = await fetch(`${FB_BASE}/${key}?key=${FB_API_KEY}`,{
    method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)
  });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
};

// ── 공통 디자인 토큰 (기존 대시보드와 완벽 매칭) ──
const C = {
  bg:"#f8fafc",
  surface:"#ffffff",
  border:"#e2e8f0",
  border2:"#f1f5f9",
  blue:"#3b82f6",     blueMid:"#2563eb",  blueLight:"#eff6ff",
  text:"#0f172a",     subtle:"#334155",   muted:"#64748b",
  green:"#10b981",    red:"#ef4444",      amber:"#f59e0b",
  purple:"#8b5cf6",   teal:"#14b8a6",
};
const shadow = "0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)";
const shadowLg = "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)";
const uid = () => Math.random().toString(36).slice(2, 8);

// 공통 인풋 스타일
const inpStyle = (extra = {}) => ({
  width: "100%",
  background: "#ffffff",
  border: `1.5px solid ${C.border}`,
  borderRadius: "10px",
  padding: "11px 14px",
  fontSize: "14px",
  color: C.text,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
  ...extra
});

export default function LmsManager({ viewPath, onNavigate }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("intro"); // lms 서브 탭: intro, schedule, classroom, mypage, backoffice
  
  // 데이터베이스 데이터들
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [viewLogs, setViewLogs] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);

  // 상태값 로드 플래그
  const [dbLoading, setDbLoading] = useState(true);

  // 회원가입 및 로그인 뷰 제어
  const [authMode, setAuthMode] = useState(null); // 'login' | 'register' | 'findPw' | null
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authErr, setAuthErr] = useState("");
  
  // 비밀번호 찾기 마법사
  const [findEmail, setFindEmail] = useState("");
  const [findStep, setFindStep] = useState(1); // 1: 이메일입력, 2: 코드입력, 3: 비밀번호 변경
  const [tempCode, setTempCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // 회원가입 폼 필드
  const [regForm, setRegForm] = useState({
    email: "", password: "", name: "", userType: "company", company: "", division: "", team: "", jobType: ""
  });

  // 강의실 관련 상태
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Guest 알림 유도 팝업
  const [showGuestAlert, setShowGuestAlert] = useState(false);

  // 1. 초기 데이터 동기화
  useEffect(() => {
    const fetchDb = async () => {
      try {
        const [u, c, a, v, d, j] = await Promise.all([
          fbGet("aida:lms_users_v2").catch(() => []),
          fbGet("aida:lms_courses_v2").catch(() => []),
          fbGet("aida:lms_applications_v2").catch(() => []),
          fbGet("aida:lms_view_logs_v2").catch(() => []),
          fbGet("aida:deptData_v1").catch(() => []),
          fbGet("aida:jobTypes_v1").catch(() => [])
        ]);
        
        setUsers(u || []);
        setCourses(c || []);
        setApplications(a || []);
        setViewLogs(v || []);
        setDeptData(d || []);
        setJobTypes(j || []);

        // 세션 유지 복원
        const session = sessionStorage.getItem("aida:lms_login");
        if (session) {
          const parsed = JSON.parse(session);
          // 실제 DB에 최신 상태와 동기화
          const latest = (u || []).find(x => x.email === parsed.email);
          if (latest) {
            setCurrentUser(latest);
          } else {
            setCurrentUser(parsed);
          }
        }
      } catch (e) {
        console.error("LMS 데이터 로드 에러:", e);
      } finally {
        setDbLoading(false);
      }
    };
    fetchDb();
  }, []);

  // 라우트 경로 동기화
  useEffect(() => {
    if (viewPath === "/officer") {
      // 직책자는 나의 강의실 서브탭으로
      setActiveTab("classroom");
    } else if (viewPath === "/admin") {
      // 어드민은 백오피스 기본 탭으로
      setActiveTab("backoffice");
    } else if (viewPath === "/mypage") {
      setActiveTab("mypage");
    } else {
      setActiveTab("intro");
    }
  }, [viewPath]);

  // DB 갱신 헬퍼
  const saveUsers = async (newUsers) => {
    setUsers(newUsers);
    await fbSet("aida:lms_users_v2", newUsers);
  };
  const saveCourses = async (newCourses) => {
    setCourses(newCourses);
    await fbSet("aida:lms_courses_v2", newCourses);
  };
  const saveApplications = async (newApps) => {
    setApplications(newApps);
    await fbSet("aida:lms_applications_v2", newApps);
  };
  const saveViewLogs = async (newLogs) => {
    setViewLogs(newLogs);
    await fbSet("aida:lms_view_logs_v2", newLogs);
  };

  // 로그인 핸들러
  const handleLogin = () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthErr("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    const matched = users.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (!matched) {
      setAuthErr("등록되지 않은 이메일 주소입니다.");
      return;
    }
    if (matched.password !== loginPassword.trim()) {
      setAuthErr("비밀번호가 올바르지 않습니다.");
      return;
    }
    if (!matched.approved && matched.role !== "admin") {
      setAuthErr("⚠️ 관리자의 가입 승인 대기 중인 계정입니다.");
      return;
    }
    
    // 세션 유지 처리
    sessionStorage.setItem("aida:lms_login", JSON.stringify(matched));
    setCurrentUser(matched);
    setAuthMode(null);
    setAuthErr("");
    
    // 역할에 맞는 뷰로 이동
    if (matched.role === "admin") {
      setActiveTab("backoffice");
      onNavigate("/admin");
    } else {
      setActiveTab("classroom");
      onNavigate("/classroom");
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    sessionStorage.removeItem("aida:lms_login");
    setCurrentUser(null);
    setActiveTab("intro");
    onNavigate("/");
  };

  // 회원가입 핸들러
  const handleRegister = async () => {
    const { email, password, name, userType, company, division, team, jobType } = regForm;
    if (!email.trim() || !password.trim() || !name.trim() || !company || !division || !team || !jobType) {
      setAuthErr("모든 필수 입력 항목을 채워주세요.");
      return;
    }

    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setAuthErr("이미 사용 중인 이메일 주소입니다.");
      return;
    }

    const newUser = {
      id: uid(),
      email: email.trim(),
      password: password.trim(),
      name: name.trim(),
      userType, // 'company' | 'partner'
      company,
      division,
      team,
      jobType,
      role: email.trim().endsWith("@okestro.com") ? "admin" : "user", // @okestro.com 이메일은 자동 admin 부여
      approved: userType === "company", // 사내 임직원은 가입 즉시 자동 승인, 파트너사는 승인대기(false)
      registeredAt: new Date().toISOString()
    };

    const updated = [newUser, ...users];
    await saveUsers(updated);
    
    if (newUser.approved) {
      alert("회원가입이 완료되었습니다! 로그인해 주세요.");
    } else {
      alert("회원가입이 정상 접수되었습니다. 관리자 승인 완료 후 로그인이 가능합니다.");
    }
    
    setAuthMode("login");
    setAuthErr("");
  };

  // 비밀번호 찾기 로직
  const handleFindPassword = () => {
    if (findStep === 1) {
      const matched = users.find(u => u.email.toLowerCase() === findEmail.trim().toLowerCase());
      if (!matched) {
        setAuthErr("가입 정보가 없는 이메일입니다.");
        return;
      }
      // 가상 OTP 인증 코드 생성 및 콘솔 출력
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setTempCode(code);
      setAuthErr("");
      alert(`[가상 이메일 전송] ${findEmail}으로 비밀번호 재설정 코드를 발송했습니다.\n인증 코드: ${code}`);
      setFindStep(2);
    } else if (findStep === 2) {
      if (inputCode.trim() !== tempCode) {
        setAuthErr("인증 코드가 일어하지 않습니다.");
        return;
      }
      setAuthErr("");
      setFindStep(3);
    } else if (findStep === 3) {
      if (!newPassword.trim()) {
        setAuthErr("새로운 비밀번호를 입력해주세요.");
        return;
      }
      const updated = users.map(u => u.email.toLowerCase() === findEmail.trim().toLowerCase() ? { ...u, password: newPassword.trim() } : u);
      saveUsers(updated);
      alert("비밀번호가 성공적으로 변경되었습니다. 로그인 해 주세요.");
      setAuthMode("login");
      setFindStep(1);
      setFindEmail("");
      setNewPassword("");
      setAuthErr("");
    }
  };

  // Guest 제한 경고 가이드 팝업
  const checkAccess = (targetTab) => {
    if (!currentUser) {
      setShowGuestAlert(true);
    } else {
      setActiveTab(targetTab);
      onNavigate(targetTab === "classroom" ? "/classroom" : (targetTab === "backoffice" ? "/admin" : "/mypage"));
    }
  };

  if (dbLoading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ fontSize: "14px", color: C.muted }}>LMS 시스템 로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100%", padding: "24px", boxSizing: "border-box" }}>
      {/* ── LMS 서브 카테고리 네비게이션 ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", padding: "12px 24px", borderRadius: "16px", border: `1px solid ${C.border}`, boxShadow: shadow, marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <button onClick={() => { setActiveTab("intro"); onNavigate("/"); }} style={{ background: "none", border: "none", fontSize: "14px", fontWeight: activeTab === "intro" ? 800 : 500, color: activeTab === "intro" ? C.blueMid : C.muted, cursor: "pointer", padding: "8px 12px" }}>📖 교육 소개</button>
          <button onClick={() => { setActiveTab("schedule"); onNavigate("/"); }} style={{ background: "none", border: "none", fontSize: "14px", fontWeight: activeTab === "schedule" ? 800 : 500, color: activeTab === "schedule" ? C.blueMid : C.muted, cursor: "pointer", padding: "8px 12px" }}>📅 교육 일정표</button>
          <button onClick={() => checkAccess("classroom")} style={{ background: "none", border: "none", fontSize: "14px", fontWeight: activeTab === "classroom" ? 800 : 500, color: activeTab === "classroom" ? C.blueMid : C.muted, cursor: "pointer", padding: "8px 12px" }}>🎓 나의 강의실</button>
          {currentUser && (
            <button onClick={() => checkAccess("mypage")} style={{ background: "none", border: "none", fontSize: "14px", fontWeight: activeTab === "mypage" ? 800 : 500, color: activeTab === "mypage" ? C.blueMid : C.muted, cursor: "pointer", padding: "8px 12px" }}>👤 마이페이지</button>
          )}
          {currentUser?.role === "admin" && (
            <button onClick={() => checkAccess("backoffice")} style={{ background: "none", border: "none", fontSize: "14px", fontWeight: activeTab === "backoffice" ? 800 : 500, color: activeTab === "backoffice" ? C.blueMid : C.muted, cursor: "pointer", padding: "8px 12px" }}>⚙️ 백오피스 관리</button>
          )}
        </div>

        {/* 우측 로그인/로그아웃 뷰 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {currentUser ? (
            <>
              <span style={{ fontSize: "13px", color: C.subtle, fontWeight: 700 }}>
                {currentUser.name}님 ({currentUser.role === "admin" ? "관리자" : "수강생"})
              </span>
              <button onClick={handleLogout} style={{ padding: "6px 12px", border: `1.5px solid ${C.border}`, borderRadius: "8px", fontSize: "12px", color: C.muted, background: "#fff", cursor: "pointer", fontWeight: 700 }}>로그아웃</button>
            </>
          ) : (
            <>
              <button onClick={() => { setAuthMode("login"); setAuthErr(""); }} style={{ padding: "6px 12px", border: "none", borderRadius: "8px", fontSize: "12px", color: "#fff", background: C.blueMid, cursor: "pointer", fontWeight: 700 }}>로그인</button>
              <button onClick={() => { setAuthMode("register"); setAuthErr(""); }} style={{ padding: "6px 12px", border: `1.5px solid ${C.border}`, borderRadius: "8px", fontSize: "12px", color: C.subtle, background: "#fff", cursor: "pointer", fontWeight: 700 }}>회원가입</button>
            </>
          )}
        </div>
      </div>

      {/* ── 탭별 화면 출력 ── */}
      {activeTab === "intro" && <IntroView />}
      {activeTab === "schedule" && <ScheduleView />}
      {activeTab === "classroom" && currentUser && <ClassroomView courses={courses} applications={applications} viewLogs={viewLogs} currentUser={currentUser} saveApplications={saveApplications} selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse} saveViewLogs={saveViewLogs} />}
      {activeTab === "mypage" && currentUser && <MyPageView applications={applications} courses={courses} checkAccess={checkAccess} setSelectedCourse={setSelectedCourse} />}
      {activeTab === "backoffice" && currentUser?.role === "admin" && (
        <BackOfficeView users={users} saveUsers={saveUsers} courses={courses} saveCourses={saveCourses} applications={applications} saveApplications={saveApplications} viewLogs={viewLogs} deptData={deptData} jobTypes={jobTypes} />
      )}

      {/* ── 로그인/회원가입 모달 팝업 ── */}
      {authMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", padding: "36px", width: "100%", maxWidth: "440px", boxShadow: shadowLg, border: `1px solid ${C.border}`, position: "relative" }}>
            <button onClick={() => setAuthMode(null)} style={{ position: "absolute", top: "20px", right: "20px", border: "none", background: "none", fontSize: "20px", color: C.muted, cursor: "pointer" }}>✕</button>
            
            {authMode === "login" && (
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 900, color: C.text, marginBottom: "24px", textAlign: "center" }}>TUNE 로그인</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.subtle, marginBottom: "6px" }}>이메일 주소</label>
                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="example@okestro.com" style={inpStyle()} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.subtle, marginBottom: "6px" }}>비밀번호</label>
                    <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="비밀번호 입력" style={inpStyle()} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                  </div>
                  {authErr && <div style={{ fontSize: "12px", color: C.red, fontWeight: 600 }}>⚠️ {authErr}</div>}
                  <button onClick={handleLogin} style={{ width: "100%", padding: "13px", border: "none", borderRadius: "10px", background: C.blueMid, color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer", transition: "opacity 0.2s" }}>로그인</button>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                    <button onClick={() => { setAuthMode("findPw"); setFindStep(1); setAuthErr(""); }} style={{ background: "none", border: "none", fontSize: "12px", color: C.muted, cursor: "pointer" }}>비밀번호 찾기</button>
                    <button onClick={() => { setAuthMode("register"); setAuthErr(""); }} style={{ background: "none", border: "none", fontSize: "12px", color: C.blueMid, fontWeight: 700, cursor: "pointer" }}>신규 회원가입</button>
                  </div>
                </div>
              </div>
            )}

            {authMode === "register" && (
              <RegisterForm regForm={regForm} setRegForm={setRegForm} handleRegister={handleRegister} authErr={authErr} deptData={deptData} jobTypes={jobTypes} />
            )}

            {authMode === "findPw" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "20px", textAlign: "center" }}>비밀번호 재설정</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {findStep === 1 && (
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.subtle, marginBottom: "6px" }}>가입 이메일 주소</label>
                      <input type="email" value={findEmail} onChange={e => setFindEmail(e.target.value)} placeholder="example@okestro.com" style={inpStyle()} />
                    </div>
                  )}
                  {findStep === 2 && (
                    <div>
                      <div style={{ fontSize: "12px", color: C.muted, marginBottom: "8px" }}>인증 코드가 이메일로 전송되었습니다.</div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.subtle, marginBottom: "6px" }}>인증 번호 (6자리)</label>
                      <input type="text" value={inputCode} onChange={e => setInputCode(e.target.value)} placeholder="000000" style={inpStyle()} />
                    </div>
                  )}
                  {findStep === 3 && (
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.subtle, marginBottom: "6px" }}>새 비밀번호 설정</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="새 비밀번호 입력" style={inpStyle()} />
                    </div>
                  )}
                  {authErr && <div style={{ fontSize: "12px", color: C.red, fontWeight: 600 }}>⚠️ {authErr}</div>}
                  <button onClick={handleFindPassword} style={{ width: "100%", padding: "12px", border: "none", borderRadius: "10px", background: C.blueMid, color: "#fff", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>
                    {findStep === 1 ? "인증번호 발송" : (findStep === 2 ? "인증 완료" : "비밀번호 재설정")}
                  </button>
                  <button onClick={() => setAuthMode("login")} style={{ width: "100%", background: "none", border: `1.5px solid ${C.border}`, padding: "11px", borderRadius: "10px", color: C.subtle, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>로그인으로 가기</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Guest 제한 경고 유도 모달 ── */}
      {showGuestAlert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", padding: "36px", width: "100%", maxWidth: "360px", textAlign: "center", boxShadow: shadowLg, border: `1px solid ${C.border}` }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#fef3c7", color: C.amber, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 16px" }}>🔑</div>
            <h4 style={{ fontSize: "18px", fontWeight: 900, color: C.text, marginBottom: "8px" }}>로그인이 필요한 서비스입니다</h4>
            <p style={{ fontSize: "13px", color: C.muted, lineHeight: "1.6", marginBottom: "24px" }}>나의 강의실 수강 신청 및 수강 현황 관리는 회원 전용 서비스입니다.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setShowGuestAlert(false); setAuthMode("login"); }} style={{ flex: 1, padding: "12px", background: C.blueMid, color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>로그인</button>
              <button onClick={() => { setShowGuestAlert(false); setAuthMode("register"); }} style={{ flex: 1, padding: "12px", background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: "10px", fontSize: "13px", color: C.subtle, fontWeight: 700, cursor: "pointer" }}>회원가입</button>
            </div>
            <button onClick={() => setShowGuestAlert(false)} style={{ display: "block", width: "100%", marginTop: "12px", background: "none", border: "none", fontSize: "11px", color: C.muted, cursor: "pointer" }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── [SubView 1] 교육 소개 화면 ──
function IntroView() {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "16px", padding: "32px", boxShadow: shadow }}>
      <h2 style={{ fontSize: "22px", fontWeight: 900, color: C.text, marginBottom: "12px" }}>🎻 오케스트로 아카데미 - 통합 LMS 플랫폼 'Tune'</h2>
      <p style={{ fontSize: "14px", color: C.muted, lineHeight: "1.8", marginBottom: "24px" }}>
        'Tune' 플랫폼은 사내 임직원 및 파트너사 임직원의 기술 향상과 체계적인 IT 교육 관리를 위한 통합 플랫폼입니다.<br />
        솔루션 오버뷰부터 심화 과정까지 맞춤형 온디맨드(On-demand) 영상을 제공하며, 수강 후 OnTest와 연계된 최종 평가까지 단일 프로세스로 지원합니다.
      </p>
      
      <div style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", display: "grid", gap: "20px" }}>
        <div style={{ border: `1.5px solid ${C.border2}`, borderRadius: "14px", padding: "20px", background: C.bg }}>
          <span style={{ fontSize: "24px" }}>💡</span>
          <h4 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "10px 0 6px" }}>체계적인 학습 커리큘럼</h4>
          <p style={{ fontSize: "12px", color: C.muted, lineHeight: "1.6" }}>기본기 확립을 위한 기초 과정부터 솔루션 심화 강의까지 전문 기술 카테고리를 제공합니다.</p>
        </div>
        <div style={{ border: `1.5px solid ${C.border2}`, borderRadius: "14px", padding: "20px", background: C.bg }}>
          <span style={{ fontSize: "24px" }}>⏯️</span>
          <h4 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "10px 0 6px" }}>실시간 진도 보장 및 트래킹</h4>
          <p style={{ fontSize: "12px", color: C.muted, lineHeight: "1.6" }}>동영상 시청 진행도(80% 완료 컷라인)를 실시간 감지하여 자동 시청 완료 및 학습 수료를 인정합니다.</p>
        </div>
        <div style={{ border: `1.5px solid ${C.border2}`, borderRadius: "14px", padding: "20px", background: C.bg }}>
          <span style={{ fontSize: "24px" }}>📝</span>
          <h4 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "10px 0 6px" }}>OnTest 평가 연동</h4>
          <p style={{ fontSize: "12px", color: C.muted, lineHeight: "1.6" }}>비디오 시청 완료 수료를 거치면 즉시 솔루션 테스트를 응시하여 결과 기록이 통합 연계됩니다.</p>
        </div>
      </div>
    </div>
  );
}

// ── [SubView 2] 교육 일정표 ──
function ScheduleView() {
  const schedules = [
    { month: "6월", course: "클라우드 가상화 및 SDDC 기본", date: "2026-06-15", target: "사내 임직원" },
    { month: "7월", course: "오케스트로 주요 솔루션 아키텍처 오버뷰", date: "2026-07-10", target: "전체 임직원 및 파트너사" },
    { month: "8월", course: "솔루션의 이해 및 실무 장애 대처 (심화)", date: "2026-08-22", target: "사내 엔지니어 전용" }
  ];
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "16px", padding: "32px", boxShadow: shadow }}>
      <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "8px" }}>📅 2026 연간/월별 교육 일정 계획</h3>
      <p style={{ fontSize: "13px", color: C.muted, marginBottom: "20px" }}>오케스트로 기술 교육 센터에서 주관하는 연간 오프라인/온라인 정기 교육 정보입니다.</p>
      
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${C.border}`, background: C.bg }}>
            <th style={{ padding: "12px" }}>월별</th>
            <th style={{ padding: "12px" }}>개설 교육 과정명</th>
            <th style={{ padding: "12px" }}>진행 예정일</th>
            <th style={{ padding: "12px" }}>수강 권장 대상</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s, idx) => (
            <tr key={idx} style={{ borderBottom: `1px solid ${C.border2}` }}>
              <td style={{ padding: "12px", fontWeight: 700, color: C.blueMid }}>{s.month}</td>
              <td style={{ padding: "12px", fontWeight: 600, color: C.text }}>{s.course}</td>
              <td style={{ padding: "12px", color: C.subtle }}>{s.date}</td>
              <td style={{ padding: "12px", color: C.muted }}>{s.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── [SubView 3] 회원가입 폼 셀렉트 박스 연동 컴포넌트 ──
function RegisterForm({ regForm, setRegForm, handleRegister, authErr, deptData, jobTypes }) {
  // 계층형 드롭다운 데이터
  const companyOptions = deptData.map(c => c.company);
  const selectedCompObj = deptData.find(c => c.company === regForm.company);
  const divisionOptions = selectedCompObj ? selectedCompObj.divisions.map(d => d.name) : [];
  const selectedDivObj = selectedCompObj ? selectedCompObj.divisions.find(d => d.name === regForm.division) : null;
  const teamOptions = selectedDivObj ? selectedDivObj.teams.map(t => t.name) : [];

  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "20px", textAlign: "center" }}>TUNE 회원가입</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: C.subtle, marginBottom: "4px" }}>이름 *</label>
          <input type="text" value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} placeholder="홍길동" style={inpStyle({ padding: "8px 12px" })} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: C.subtle, marginBottom: "4px" }}>이메일 주소 *</label>
          <input type="email" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} placeholder="username@okestro.com" style={inpStyle({ padding: "8px 12px" })} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: C.subtle, marginBottom: "4px" }}>비밀번호 *</label>
          <input type="password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} placeholder="비밀번호 설정" style={inpStyle({ padding: "8px 12px" })} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: C.subtle, marginBottom: "4px" }}>임직원 구분 *</label>
          <select value={regForm.userType} onChange={e => setRegForm({ ...regForm, userType: e.target.value })} style={inpStyle({ padding: "8px 12px" })}>
            <option value="company">사내 임직원 (가입 즉시 자동 승인)</option>
            <option value="partner">파트너사 임직원 (어드민 가입 승인 대기)</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: C.subtle, marginBottom: "4px" }}>소속 회사 *</label>
          <select value={regForm.company} onChange={e => setRegForm({ ...regForm, company: e.target.value, division: "", team: "" })} style={inpStyle({ padding: "8px 12px" })}>
            <option value="">선택하세요</option>
            {companyOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: C.subtle, marginBottom: "4px" }}>소속 본부/부서 *</label>
          <select value={regForm.division} onChange={e => setRegForm({ ...regForm, division: e.target.value, team: "" })} style={inpStyle({ padding: "8px 12px" })} disabled={!regForm.company}>
            <option value="">선택하세요</option>
            {divisionOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: C.subtle, marginBottom: "4px" }}>소속 팀 *</label>
          <select value={regForm.team} onChange={e => setRegForm({ ...regForm, team: e.target.value })} style={inpStyle({ padding: "8px 12px" })} disabled={!regForm.division}>
            <option value="">선택하세요</option>
            {teamOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: C.subtle, marginBottom: "4px" }}>직군 *</label>
          <select value={regForm.jobType} onChange={e => setRegForm({ ...regForm, jobType: e.target.value })} style={inpStyle({ padding: "8px 12px" })}>
            <option value="">선택하세요</option>
            {jobTypes.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        {authErr && <div style={{ fontSize: "11px", color: C.red, fontWeight: 600 }}>⚠️ {authErr}</div>}
        <button onClick={handleRegister} style={{ width: "100%", padding: "12px", border: "none", borderRadius: "10px", background: C.blueMid, color: "#fff", fontSize: "13px", fontWeight: 800, cursor: "pointer", marginTop: "8px" }}>회원 등록하기</button>
      </div>
    </div>
  );
}

// ── [SubView 4] 나의 강의실 컴포넌트 (YouTube Iframe API 시청감지 통합) ──
function ClassroomView({ courses, applications, viewLogs, currentUser, saveApplications, selectedCourse, setSelectedCourse, saveViewLogs }) {
  // 사용자의 신청된 강좌 데이터 바인딩
  const myApps = applications.filter(a => a.email === currentUser.email);
  
  // 강의실 왼쪽 강좌 목록 구성
  const isApplied = (courseId) => myApps.find(a => a.courseId === courseId);

  // 수강 신청 요청 핸들러
  const handleApplyCourse = async (courseId) => {
    const newApp = {
      id: uid(),
      email: currentUser.email,
      courseId,
      status: "pending", // pending -> approved -> studying -> completed
      appliedAt: new Date().toISOString(),
      approvedAt: "",
      rejectReason: ""
    };
    await saveApplications([newApp, ...applications]);
    alert("수강 신청이 정상 접수되었습니다. 관리자 승인을 대기합니다.");
  };

  return (
    <div style={{ display: "flex", gap: "24px" }}>
      {/* 왼쪽 코스 리스트 */}
      <div style={{ width: "300px", flexShrink: 0, background: "#fff", border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", boxShadow: shadow }}>
        <h4 style={{ fontSize: "14px", fontWeight: 800, color: C.text, marginBottom: "16px" }}>📚 전체 학습 과정 목록</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {courses.length === 0 && <div style={{ fontSize: "12px", color: C.muted }}>개설된 강의가 없습니다.</div>}
          {courses.map(c => {
            const app = isApplied(c.id);
            const isCompleted = viewLogs.some(log => log.email === currentUser.email && log.courseId === c.id);
            return (
              <div key={c.id} style={{ border: `1px solid ${selectedCourse?.id === c.id ? C.blue : C.border2}`, background: selectedCourse?.id === c.id ? C.blueLight : C.bg, borderRadius: "10px", padding: "14px", cursor: "pointer", transition: "all 0.15s" }} onClick={() => setSelectedCourse(c)}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: C.text, marginBottom: "4px" }}>{c.title}</div>
                <div style={{ fontSize: "11px", color: C.muted, marginBottom: "8px" }}>{c.description.slice(0, 40)}...</div>
                
                <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
                  {isCompleted ? (
                    <span style={{ fontSize: "11px", color: C.green, fontWeight: 700 }}>✓ 수료 완료</span>
                  ) : app ? (
                    <span style={{
                      fontSize: "11px",
                      color: app.status === "approved" ? C.blueMid : (app.status === "rejected" ? C.red : C.amber),
                      fontWeight: 700
                    }}>
                      {app.status === "approved" ? "▶ 학습 가능" : (app.status === "rejected" ? "❌ 수강 반려" : "⌛ 승인 대기")}
                    </span>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleApplyCourse(c.id); }} style={{ padding: "4px 8px", background: "#fff", border: `1px solid ${C.blue}`, borderRadius: "6px", fontSize: "11px", color: C.blue, cursor: "pointer", fontWeight: 700 }}>수강 신청</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 오른쪽 영상 플레이어 및 상세 */}
      <div style={{ flex: 1, background: "#fff", border: `1px solid ${C.border}`, borderRadius: "16px", padding: "24px", boxShadow: shadow }}>
        {selectedCourse ? (
          <VideoPlayer course={selectedCourse} applications={applications} viewLogs={viewLogs} currentUser={currentUser} saveViewLogs={saveViewLogs} saveApplications={saveApplications} />
        ) : (
          <div style={{ height: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.muted }}>
            <span style={{ fontSize: "40px" }}>📺</span>
            <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "12px" }}>수강할 교육 과정을 선택해주세요.</div>
            <div style={{ fontSize: "11px", marginTop: "4px" }}>수강 승인이 완료된 과정만 시청 및 학습 인정이 가능합니다.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── [SubView 4-1] YouTube Player 시청 완료 제어 컴포넌트 ──
function VideoPlayer({ course, applications, viewLogs, currentUser, saveViewLogs, saveApplications }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 ~ 100 %
  const [btnActive, setBtnActive] = useState(false);

  const matchedApp = applications.find(a => a.email === currentUser.email && a.courseId === course.id);
  const isApproved = matchedApp?.status === "approved";
  const isAlreadyCompleted = viewLogs.some(log => log.email === currentUser.email && log.courseId === course.id);

  // YouTube 비디오 ID 추출 헬퍼
  const getYoutubeId = (url) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch {
      return null;
    }
  };

  const videoId = getYoutubeId(course.youtubeUrl);

  // 비디오 ID가 변경되면 플레이어 상태 초기화
  useEffect(() => {
    setBtnActive(false);
    setProgress(0);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // 이미 완료된 비디오라면 즉시 버튼 활성화
    if (isAlreadyCompleted) {
      setBtnActive(true);
      setProgress(100);
    }
  }, [course, isAlreadyCompleted]);

  // YouTube API 제어 및 재생시간 감지
  useEffect(() => {
    if (!videoId || !isApproved || isAlreadyCompleted) return;

    let player;

    const checkPlayProgress = () => {
      if (player && typeof player.getCurrentTime === "function" && typeof player.getDuration === "function") {
        const current = player.getCurrentTime();
        const duration = player.getDuration();
        if (duration > 0) {
          const ratio = (current / duration) * 100;
          setProgress(Math.min(ratio, 100));

          // 80% 수렴 시 버튼 활성화
          if (ratio >= 80) {
            setBtnActive(true);
          }
        }
      }
    };

    // YouTube Iframe API 전역 준비 완료 확인
    const initPlayer = () => {
      player = new window.YT.Player(`yt-player-${course.id}`, {
        videoId: videoId,
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              timerRef.current = setInterval(checkPlayProgress, 1000);
            } else {
              setIsPlaying(false);
              if (timerRef.current) clearInterval(timerRef.current);
            }
          }
        }
      });
      playerRef.current = player;
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // API가 아직 준비되지 않은 경우 콜백을 대기함
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (player && typeof player.destroy === "function") {
        try { player.destroy(); } catch {}
      }
    };
  }, [course.id, videoId, isApproved, isAlreadyCompleted]);

  // 수강 완료 및 학습 인정 핸들러
  const handleCompleteWatch = async () => {
    const newLog = {
      id: uid(),
      email: currentUser.email,
      courseId: course.id,
      completed: true,
      completedAt: new Date().toISOString()
    };
    
    // 1. 시청 완료 로그 저장
    const updatedLogs = [newLog, ...viewLogs];
    await saveViewLogs(updatedLogs);

    // 2. 수강 신청 마이페이지 상태도 '수료' 단계로 변경
    const updatedApps = applications.map(a => 
      a.email === currentUser.email && a.courseId === course.id ? { ...a, status: "completed" } : a
    );
    await saveApplications(updatedApps);

    alert("✓ 비디오 학습 인정 완료! 마이페이지에서 수료 내역 확인이 가능합니다.");
    setBtnActive(true);
    setProgress(100);
  };

  if (!isApproved && !isAlreadyCompleted) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <span style={{ fontSize: "40px" }}>🔒</span>
        <h4 style={{ fontSize: "16px", fontWeight: 800, marginTop: "12px", color: C.text }}>수강 승인이 필요합니다</h4>
        <p style={{ fontSize: "13px", color: C.muted, margin: "8px 0 20px" }}>
          이 비디오 과정은 관리자의 수강 승인이 완료된 후에 시청할 수 있습니다.<br />
          {matchedApp ? `(현재 진행 상태: ${matchedApp.status === "rejected" ? "❌ 반려됨" : "⌛ 승인 대기 중"})` : "좌측 목록에서 수강 신청을 눌러주세요."}
        </p>
        {matchedApp?.status === "rejected" && (
          <div style={{ background: "#fef2f2", border: `1.5px dashed #fee2e2`, color: C.red, padding: "12px", borderRadius: "10px", fontSize: "12px", maxWidth: "300px", margin: "0 auto" }}>
            <strong>반려 사유:</strong> {matchedApp.rejectReason || "입력된 반려 사유가 없습니다."}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 900, color: C.text, marginBottom: "4px" }}>{course.title}</h3>
      <p style={{ fontSize: "13px", color: C.muted, marginBottom: "16px" }}>{course.description}</p>

      {/* 비디오 임베드 컨테이너 */}
      <div ref={containerRef} style={{ width: "100%", height: "400px", borderRadius: "14px", overflow: "hidden", background: "#000", border: `1px solid ${C.border}`, position: "relative" }}>
        {isAlreadyCompleted ? (
          <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title={course.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
        ) : (
          <div id={`yt-player-${course.id}`} style={{ width: "100%", height: "100%" }}></div>
        )}
      </div>

      {/* 진도율 바 */}
      <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: C.muted, marginBottom: "6px" }}>
          <span>학습 진행도</span>
          <strong>{Math.floor(progress)}% (수료 기준: 80%)</strong>
        </div>
        <div style={{ width: "100%", height: "8px", background: C.border2, borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: progress >= 80 ? C.green : C.blueMid, transition: "width 0.2s ease" }}></div>
        </div>
      </div>

      {/* 완료 버튼 */}
      <button onClick={handleCompleteWatch} disabled={!btnActive || isAlreadyCompleted}
        style={{
          width: "100%",
          padding: "14px",
          marginTop: "20px",
          border: "none",
          borderRadius: "10px",
          cursor: (!btnActive || isAlreadyCompleted) ? "not-allowed" : "pointer",
          background: isAlreadyCompleted ? C.green : (btnActive ? C.blueMid : C.border),
          color: "#fff",
          fontSize: "14px",
          fontWeight: 800,
          transition: "all 0.2s"
        }}>
        {isAlreadyCompleted ? "✓ 교육 수료 완료" : (btnActive ? "학습 완료 및 수료 인정" : "비디오의 80% 이상을 시청해야 완료할 수 있습니다")}
      </button>
    </div>
  );
}

// ── [SubView 5] 마이페이지 (프로세스 트래커) ──
function MyPageView({ applications, courses, checkAccess, setSelectedCourse }) {
  const currentUser = JSON.parse(sessionStorage.getItem("aida:lms_login") || "null");
  const myApps = applications.filter(a => a.email === currentUser?.email);

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "16px", padding: "32px", boxShadow: shadow }}>
      <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "8px" }}>👤 나의 학습 마이페이지</h3>
      <p style={{ fontSize: "13px", color: C.muted, marginBottom: "24px" }}>수강 신청하신 강좌들의 상태 및 진도 이력을 관리합니다.</p>

      {myApps.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: C.muted, border: `1.5px dashed ${C.border2}`, borderRadius: "12px" }}>
          신청된 교육 과정이 존재하지 않습니다. 나의 강의실에서 원하는 강의를 신청하세요!
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {myApps.map(app => {
          const course = courses.find(c => c.id === app.courseId);
          if (!course) return null;

          // 프로세스 매핑: pending -> 신청 대기, approved -> 수강 확정, studying -> 학습 중, completed -> 수료/종료
          // 반려(rejected)인 경우 별도로 에러 표시
          const steps = ["pending", "approved", "studying", "completed"];
          const currentIdx = steps.indexOf(app.status);
          const isRejected = app.status === "rejected";

          return (
            <div key={app.id} style={{ border: `1px solid ${isRejected ? "#fecaca" : C.border}`, borderRadius: "14px", padding: "20px", background: isRejected ? "#fffafb" : "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: 0 }}>{course.title}</h4>
                  <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>신청 일시: {new Date(app.appliedAt).toLocaleString()}</div>
                </div>
                
                {app.status === "approved" && (
                  <button onClick={() => { setSelectedCourse(course); checkAccess("classroom"); }} style={{ padding: "6px 12px", background: C.blueMid, color: "#fff", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}>
                    강의실 입장 ➔
                  </button>
                )}
              </div>

              {/* 반려(rejected) 분기 뷰 */}
              {isRejected ? (
                <div style={{ background: "#fef2f2", border: `1px solid #fee2e2`, color: C.red, padding: "12px", borderRadius: "10px", fontSize: "12px" }}>
                  <strong>❌ 수강 신청 반려 안내</strong>
                  <div style={{ marginTop: "4px" }}>반려 사유: {app.rejectReason || "기입된 반려 사유가 없습니다."}</div>
                </div>
              ) : (
                /* 4단계 프로세스 트래커 */
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", position: "relative", marginTop: "12px", overflowX: "auto" }}>
                  {[
                    { label: "신청 대기", code: "pending" },
                    { label: "수강 확정", code: "approved" },
                    { label: "학습 중", code: "studying" },
                    { label: "수료/종료", code: "completed" }
                  ].map((step, sIdx) => {
                    const isActive = sIdx <= currentIdx;
                    const isCurrent = sIdx === currentIdx;
                    return (
                      <div key={step.code} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: "80px", position: "relative", zIndex: 2 }}>
                        {/* 원형 배지 */}
                        <div style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: isCurrent ? C.blueMid : (isActive ? C.blueLight : C.border2),
                          border: `2px solid ${isCurrent ? C.blueMid : (isActive ? C.blue : C.border)}`,
                          color: isCurrent ? "#fff" : (isActive ? C.blueMid : C.muted),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                          marginBottom: "6px",
                          transition: "all 0.2s"
                        }}>
                          {sIdx + 1}
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: isCurrent ? 800 : 500, color: isCurrent ? C.blueMid : (isActive ? C.subtle : C.muted) }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                  {/* 연결 가로선 */}
                  <div style={{ position: "absolute", top: "16px", left: "12.5%", right: "12.5%", height: "2px", background: C.border, zIndex: 1 }} />
                  <div style={{ position: "absolute", top: "16px", left: "12.5%", width: `${currentIdx * 25}%`, height: "2px", background: C.blue, zIndex: 1, transition: "width 0.3s ease" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── [SubView 6] 어드민 백오피스 통합 뷰 ──
function BackOfficeView({ users, saveUsers, courses, saveCourses, applications, saveApplications, viewLogs, deptData, jobTypes }) {
  const [backTab, setBackTab] = useState("apply"); // apply (수강신청), register (가입승인), create (과정개설)

  // 과정 개설 폼
  const [courseForm, setCourseForm] = useState({ title: "", description: "", youtubeUrl: "" });
  
  // 반려 모달 창 제어
  const [rejectModal, setRejectModal] = useState(null); // application 객체 또는 null
  const [rejectReasonText, setRejectReasonText] = useState("");

  // 수강 신청 승인 처리
  const handleApprove = async (appId) => {
    const updated = applications.map(a => a.id === appId ? { ...a, status: "approved", approvedAt: new Date().toISOString() } : a);
    await saveApplications(updated);
    alert("수강 신청을 최종 승인하였습니다. 수강생이 동영상을 학습할 수 있습니다.");
  };

  // 수강 신청 반려 처리
  const handleRejectSubmit = async () => {
    if (!rejectReasonText.trim()) {
      alert("반려 사유를 기입해주세요.");
      return;
    }
    const updated = applications.map(a => a.id === rejectModal.id ? { ...a, status: "rejected", rejectReason: rejectReasonText.trim() } : a);
    await saveApplications(updated);
    alert("해당 수강 신청을 반려 처리하였습니다.");
    setRejectModal(null);
    setRejectReasonText("");
  };

  // 회원 가입 승인 처리
  const handleRegisterApprove = async (userId) => {
    const updated = users.map(u => u.id === userId ? { ...u, approved: true } : u);
    await saveUsers(updated);
    alert("회원 가입을 승인하였습니다. 이제 로그인이 가능합니다.");
  };

  // 회원 가입 삭제/반려
  const handleRegisterDelete = async (userId) => {
    if (!window.confirm("가입 신청을 반려 및 삭제하시겠습니까?")) return;
    const updated = users.filter(u => u.id !== userId);
    await saveUsers(updated);
    alert("가입 요청이 정상 삭제되었습니다.");
  };

  // 교육 과정 개설
  const handleCreateCourse = async () => {
    const { title, description, youtubeUrl } = courseForm;
    if (!title.trim() || !description.trim() || !youtubeUrl.trim()) {
      alert("모든 교육 과정 필드를 채워주세요.");
      return;
    }

    const newCourse = {
      id: uid(),
      title: title.trim(),
      description: description.trim(),
      youtubeUrl: youtubeUrl.trim(),
      createdAt: new Date().toISOString()
    };

    await saveCourses([newCourse, ...courses]);
    alert("새로운 교육 과정이 정상 등록되었습니다!");
    setCourseForm({ title: "", description: "", youtubeUrl: "" });
  };

  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "16px", padding: "32px", boxShadow: shadow }}>
      <h3 style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "20px" }}>⚙️ LMS 백오피스 관리자 설정</h3>
      
      {/* 서브 탭 */}
      <div style={{ display: "flex", gap: "10px", borderBottom: `1.5px solid ${C.border}`, paddingBottom: "12px", marginBottom: "24px" }}>
        <button onClick={() => setBackTab("apply")} style={{ padding: "8px 16px", border: "none", background: backTab === "apply" ? C.blueLight : "none", color: backTab === "apply" ? C.blueMid : C.muted, fontWeight: 700, borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>📋 수강 승인 관리</button>
        <button onClick={() => setBackTab("register")} style={{ padding: "8px 16px", border: "none", background: backTab === "register" ? C.blueLight : "none", color: backTab === "register" ? C.blueMid : C.muted, fontWeight: 700, borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>👤 가입 승인 관리</button>
        <button onClick={() => setBackTab("create")} style={{ padding: "8px 16px", border: "none", background: backTab === "create" ? C.blueLight : "none", color: backTab === "create" ? C.blueMid : C.muted, fontWeight: 700, borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>➕ 교육 과정 개설</button>
      </div>

      {/* 수강 신청 승인 테이블 */}
      {backTab === "apply" && (
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 800, color: C.text, marginBottom: "12px" }}>신청 접수 목록</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                <th style={{ padding: "12px" }}>수강생 이메일</th>
                <th style={{ padding: "12px" }}>신청 교육 과정</th>
                <th style={{ padding: "12px" }}>신청 시간</th>
                <th style={{ padding: "12px" }}>진행 상태</th>
                <th style={{ padding: "12px", textAlign: "center" }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: C.muted }}>접수된 신청 정보가 없습니다.</td>
                </tr>
              )}
              {applications.map(app => {
                const course = courses.find(c => c.id === app.courseId);
                return (
                  <tr key={app.id} style={{ borderBottom: `1px solid ${C.border2}` }}>
                    <td style={{ padding: "12px" }}>{app.email}</td>
                    <td style={{ padding: "12px", fontWeight: 600 }}>{course?.title || "삭제된 과정"}</td>
                    <td style={{ padding: "12px", color: C.muted }}>{new Date(app.appliedAt).toLocaleString()}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: app.status === "approved" ? "#e6fffa" : (app.status === "rejected" ? "#fff5f5" : "#fffbeb"),
                        color: app.status === "approved" ? C.green : (app.status === "rejected" ? C.red : C.amber)
                      }}>
                        {app.status === "approved" ? "승인 완료" : (app.status === "rejected" ? "반려됨" : "대기 중")}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      {app.status === "pending" && (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button onClick={() => handleApprove(app.id)} style={{ padding: "4px 8px", background: C.blueMid, color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}>승인</button>
                          <button onClick={() => setRejectModal(app)} style={{ padding: "4px 8px", background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: "6px", fontSize: "11px", color: C.red, cursor: "pointer", fontWeight: 700 }}>반려</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 회원 가입 승인 테이블 */}
      {backTab === "register" && (
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 800, color: C.text, marginBottom: "12px" }}>파트너사 가입 대기 회원</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                <th style={{ padding: "12px" }}>이름</th>
                <th style={{ padding: "12px" }}>이메일</th>
                <th style={{ padding: "12px" }}>회사 / 소속</th>
                <th style={{ padding: "12px" }}>구분</th>
                <th style={{ padding: "12px" }}>가입 상태</th>
                <th style={{ padding: "12px", textAlign: "center" }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => !u.approved).length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: C.muted }}>가입 대기 중인 회원이 없습니다.</td>
                </tr>
              )}
              {users.filter(u => !u.approved).map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border2}` }}>
                  <td style={{ padding: "12px", fontWeight: 700 }}>{u.name}</td>
                  <td style={{ padding: "12px" }}>{u.email}</td>
                  <td style={{ padding: "12px" }}>{u.company} / {u.division} {u.team}</td>
                  <td style={{ padding: "12px" }}>{u.userType === "company" ? "사내 임직원" : "파트너사"}</td>
                  <td style={{ padding: "12px", color: C.amber, fontWeight: 700 }}>⌛ 승인대기</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                      <button onClick={() => handleRegisterApprove(u.id)} style={{ padding: "4px 8px", background: C.blueMid, color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}>가입 승인</button>
                      <button onClick={() => handleRegisterDelete(u.id)} style={{ padding: "4px 8px", background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: "6px", fontSize: "11px", color: C.red, cursor: "pointer", fontWeight: 700 }}>반려/삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 과정 개설 입력 폼 */}
      {backTab === "create" && (
        <div style={{ maxWidth: "500px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 800, color: C.text, marginBottom: "16px" }}>신규 온라인 교육 개설</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.subtle, marginBottom: "6px" }}>강좌 제목 *</label>
              <input type="text" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="오케스트로 주요 솔루션 아키텍처 오버뷰" style={inpStyle()} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.subtle, marginBottom: "6px" }}>과정 상세 설명 *</label>
              <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="비디오 강의의 전반적인 소개 및 평가 가이드라인에 대해 기입해주세요." style={{ ...inpStyle(), minHeight: "100px", resize: "vertical" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: C.subtle, marginBottom: "6px" }}>유튜브 주소 (일부 공개 링크) *</label>
              <input type="text" value={courseForm.youtubeUrl} onChange={e => setCourseForm({ ...courseForm, youtubeUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." style={inpStyle()} />
            </div>
            <button onClick={handleCreateCourse} style={{ padding: "12px", border: "none", borderRadius: "10px", background: C.blueMid, color: "#fff", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>새 교육 과정 등록</button>
          </div>
        </div>
      )}

      {/* ── 수강신청 반려 사유 입력 모달 ── */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "380px", boxShadow: shadowLg, border: `1px solid ${C.border}` }}>
            <h4 style={{ fontSize: "16px", fontWeight: 900, color: C.text, marginBottom: "8px" }}>수강 신청 반려 사유 기입</h4>
            <div style={{ fontSize: "11px", color: C.muted, marginBottom: "16px" }}>수강생이 확인 가능한 명확한 반려 사유를 작성해주세요.</div>
            <textarea value={rejectReasonText} onChange={e => setRejectReasonText(e.target.value)} placeholder="반려 사유 입력..." style={{ ...inpStyle(), minHeight: "80px", resize: "none", marginBottom: "20px" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleRejectSubmit} style={{ flex: 1, padding: "11px", background: C.red, color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>반려 확정</button>
              <button onClick={() => { setRejectModal(null); setRejectReasonText(""); }} style={{ flex: 1, padding: "11px", background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: "10px", fontSize: "13px", color: C.subtle, fontWeight: 700, cursor: "pointer" }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
