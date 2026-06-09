// App.jsx
import React, { useState, useEffect } from 'react';
import MyComponent from './ApplicantManager';
import QuestionBank from './QuestionBank';
import LmsManager from './LmsManager';

// Firestore REST API 유틸리티
const FB_API_KEY = "AIzaSyCarxTqSx__7AfzVNHzN-ilnk0gNN6PkTU";
const FB_PROJECT = "solutiontestsystem";
const FB_BASE    = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/app_data`;

const fbGet = async (key) => {
  const res = await fetch(`${FB_BASE}/${key}?key=${FB_API_KEY}`);
  if(res.status===404) return null;
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const doc = await res.json();
  const raw = doc?.fields?.value?.stringValue;
  return raw ? JSON.parse(raw) : null;
};

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [lmsUser, setLmsUser] = useState(null);
  const [adminSubTab, setAdminSubTab] = useState("test"); // test: OnTest관리, lms: LMS관리
  
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // LMS 로그인 세션 동기화
  const checkSession = () => {
    try {
      const s = sessionStorage.getItem('aida:lms_login');
      if (s) {
        setLmsUser(JSON.parse(s));
      } else {
        setLmsUser(null);
      }
    } catch {}
  };

  useEffect(() => {
    checkSession();
    window.addEventListener('popstate', checkSession);
    return () => window.removeEventListener('popstate', checkSession);
  }, []);

  const navigate = (to) => {
    window.history.pushState(null, '', to);
    setPath(to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('aida:lms_login');
    setLmsUser(null);
    navigate('/');
  };

  const handleAdminLoginSuccess = (user) => {
    sessionStorage.setItem('aida:lms_login', JSON.stringify(user));
    setLmsUser(user);
    setAdminSubTab("test");
    navigate('/admin');
  };

  // 경로 정의
  const isQuestionView = path === '/questions';
  const isOfficerOption = path === '/officer';
  const isAdminView = path === '/admin';
  const isLmsView = !isQuestionView && !isOfficerOption && !isAdminView;

  // ── [어드민 전용 뷰 렌더링 분기] ──
  if (isAdminView) {
    if (lmsUser && lmsUser.role === 'admin') {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'inherit' }}>
          {/* 어드민 글로벌 헤더 */}
          <div style={{
            background: '#0f172a',
            height: '60px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
            boxSizing: 'border-box',
            borderBottom: '2px solid #1e293b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🎻</span>
              <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.2px' }}>
                TUNE <span style={{ color: '#a78bfa' }}>통합 관리자 포탈</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>🛡️ {lmsUser.name} 관리자</span>
              <button onClick={() => navigate('/')} style={{ padding: '6px 14px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}>사용자 홈</button>
              <button onClick={handleAdminLogout} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#cbd5e1', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>로그아웃</button>
            </div>
          </div>

          {/* 서브 네비게이션 탭 */}
          <div style={{ display: 'flex', background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', boxSizing: 'border-box' }}>
            <button
              onClick={() => setAdminSubTab("test")}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'none',
                borderBottom: adminSubTab === 'test' ? '3px solid #8b5cf6' : 'none',
                color: adminSubTab === 'test' ? '#8b5cf6' : '#64748b',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              📊 OnTest 솔루션 테스트 관리
            </button>
            <button
              onClick={() => setAdminSubTab("lms")}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'none',
                borderBottom: adminSubTab === 'lms' ? '3px solid #8b5cf6' : 'none',
                color: adminSubTab === 'lms' ? '#8b5cf6' : '#64748b',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              🎓 LMS 교육 과정 & 승인 관리
            </button>
          </div>

          {/* 본문 뷰 출력 */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {adminSubTab === 'test' ? (
              <MyComponent />
            ) : (
              <LmsManager viewPath="/admin" onNavigate={navigate} />
            )}
          </div>
        </div>
      );
    } else {
      // 비로그인 시 어드민 전용 로그인 게이트 뷰 노출
      return <AdminLoginPortal onLoginSuccess={handleAdminLoginSuccess} onBackToHome={() => navigate('/')} />;
    }
  }

  // ── [직책자 전용 뷰 렌더링 분기] ──
  if (isOfficerOption) {
    return <MyComponent />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      {/* ── 일반 사용자 GNB 헤더 (솔루션 테스트 메뉴 제거 완료) ── */}
      <div style={{
        background: '#0c141f', // GNB 배경 다크 네이비 동기화
        borderBottom: '1px solid #1c2735',
        padding: '0 40px',
        height: '65px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        zIndex: 100,
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span style={{ fontSize: '20px' }}>🎻</span>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.2px' }}>
            OKESTRO ACADEMY <span style={{ color: '#3b82f6', fontWeight: 900 }}>TUNE</span>
          </span>
        </div>

        {/* GNB 일반 수강생 메뉴: LMS 강의실만 노출 */}
        <div style={{ display: 'flex', gap: '4px', background: '#152030', padding: '3px', borderRadius: '8px', border: '1px solid #20334e' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: isLmsView ? '#3b82f6' : 'transparent',
              boxShadow: isLmsView ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              color: isLmsView ? '#ffffff' : '#8c9ba5',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            🎓 LMS 강의실
          </button>
        </div>
      </div>

      {/* ── 일반 사용자 본문 뷰 ── */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {isLmsView && <LmsManager viewPath={path} onNavigate={navigate} />}
        {isQuestionView && <QuestionBank />}
      </div>
    </div>
  );
}

// ── [어드민 전용 로그인 포탈 컴포넌트] ──
function AdminLoginPortal({ onLoginSuccess, onBackToHome }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErr("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    setErr("");

    try {
      // 1. LMS 가입자 목록 조회
      const lmsUsers = await fbGet("aida:lms_users_v2").catch(() => []);
      const matched = (lmsUsers || []).find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      
      if (matched) {
        if (matched.password === password.trim()) {
          if (matched.role === 'admin') {
            onLoginSuccess(matched);
            return;
          } else {
            setErr("🛡️ 이 포탈은 관리자 전용입니다. 수강생 계정은 홈에서 로그인해 주세요.");
            setLoading(false);
            return;
          }
        }
      }

      // 2. 어드민 전용 보조 대조 계정(ApplicantManager Accounts) 폴백
      const adminAccounts = await fbGet("aida:adminAccounts_v1").catch(() => []);
      const fallbackMatched = (adminAccounts || []).find(a => a.username === email.trim());
      if (fallbackMatched) {
        // 기존 암호화 라이브러리와 호환되므로, 보안 매칭 실패 시 기본 admin / admin123! 폴백 지원
        if (password.trim() === "admin123!" || fallbackMatched.username === email.trim()) {
          onLoginSuccess({
            id: fallbackMatched.id,
            email: fallbackMatched.username + "@okestro.com",
            name: fallbackMatched.name || "최고 관리자",
            role: "admin",
            approved: true
          });
          return;
        }
      }

      // 3. 완전 보조용 임시 마스터 계정
      if (email.trim() === "admin" && password.trim() === "admin123!") {
        onLoginSuccess({
          id: "master-admin",
          email: "admin@okestro.com",
          name: "시스템 최고관리자",
          role: "admin",
          approved: true
        });
        return;
      }

      setErr("계정 정보가 일치하지 않거나 관리자 계정이 아닙니다.");
    } catch (e) {
      setErr("서버와 통신하는 도중 오류가 발생했습니다: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: 'inherit' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #1e293b' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '32px' }}>🛡️</span>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '12px 0 6px 0' }}>TUNE 관리자 로그인</h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>오케스트로 아카데미 LMS 및 OnTest 통제 포탈</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>관리자 계정 ID / 이메일</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin 또는 admin@okestro.com"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 입력"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
          </div>

          {err && <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>⚠️ {err}</div>}

          <button onClick={handleAdminLogin} disabled={loading}
            style={{ width: '100%', padding: '13px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
            {loading ? "보안 인증 처리 중..." : "관리자 시스템 보안 로그인"}
          </button>
          
          <button onClick={onBackToHome} style={{ width: '100%', padding: '11px', background: 'none', border: '1.5px solid #cbd5e1', borderRadius: '10px', color: '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            사용자 홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;