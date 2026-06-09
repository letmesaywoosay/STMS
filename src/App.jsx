/* eslint-disable */
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

  // ── [어드민 전용 뷰 렌더링 분기 - Expo 테마 적용] ──
  if (isAdminView) {
    if (lmsUser && lmsUser.role === 'admin') {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas-soft)', fontFamily: 'var(--sans)' }}>
          {/* 어드민 글로벌 헤더 (top-nav) */}
          <div style={{
            background: 'var(--canvas)',
            height: '64px',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            borderBottom: '1px solid var(--hairline)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <img src="/logo.png" alt="AIDA TUNE" style={{ height: "24px", objectFit: "contain" }} />
              <span style={{ fontSize: '13px', color: 'var(--body)', fontWeight: 500, borderLeft: '1px solid var(--hairline-strong)', paddingLeft: '12px' }}>관리자 포탈</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--body)', fontWeight: 500 }}>🛡️ {lmsUser.name} 관리자</span>
              <button 
                onClick={() => navigate('/')} 
                style={{ 
                  height: '36px',
                  padding: '0 14px', 
                  background: 'var(--primary)', 
                  border: 'none', 
                  borderRadius: 'var(--rounded-md)', 
                  color: 'var(--on-primary)', 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  cursor: 'pointer',
                  transition: 'background 0.15s' 
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-active)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
              >
                사용자 홈
              </button>
              <button 
                onClick={handleAdminLogout} 
                style={{ 
                  height: '36px',
                  padding: '0 14px', 
                  background: 'var(--canvas)', 
                  border: '1px solid var(--hairline-strong)', 
                  borderRadius: 'var(--rounded-md)', 
                  color: 'var(--ink)', 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  cursor: 'pointer' 
                }}
              >
                로그아웃
              </button>
            </div>
          </div>

          {/* 서브 네비게이션 탭 */}
          <div style={{ display: 'flex', background: 'var(--canvas)', borderBottom: '1px solid var(--hairline)', padding: '0 24px', boxSizing: 'border-box' }}>
            <button
              onClick={() => setAdminSubTab("test")}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'none',
                borderBottom: adminSubTab === 'test' ? '2px solid var(--primary)' : 'none',
                color: adminSubTab === 'test' ? 'var(--ink)' : 'var(--body)',
                fontSize: '14px',
                fontWeight: 600,
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
                borderBottom: adminSubTab === 'lms' ? '2px solid var(--primary)' : 'none',
                color: adminSubTab === 'lms' ? 'var(--ink)' : 'var(--body)',
                fontSize: '14px',
                fontWeight: 600,
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
              <MyComponent viewPath="/admin" />
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas)', fontFamily: 'var(--sans)' }}>
      {/* ── 일반 사용자 GNB 헤더 (Expo top-nav 스타일 적용) ── */}
      <div style={{
        background: 'var(--canvas)',
        borderBottom: '1px solid var(--hairline)',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo.png" alt="AIDA TUNE" style={{ height: "30px", objectFit: "contain" }} />
        </div>

        {/* GNB 일반 수강생 메뉴 및 관리자 퀵링크 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--rounded-md)',
              border: 'none',
              background: isLmsView ? 'var(--primary)' : 'transparent',
              color: isLmsView ? 'var(--on-primary)' : 'var(--body)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              if(!isLmsView) e.currentTarget.style.color = 'var(--ink)';
            }}
            onMouseOut={(e) => {
              if(!isLmsView) e.currentTarget.style.color = 'var(--body)';
            }}
          >
            🎓 LMS 강의실
          </button>

          {/* 관리자 계정 로그인되어 있을 시 관리자 포탈 이동 퀵링크 노출 */}
          {lmsUser && lmsUser.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--rounded-md)',
                border: '1px solid var(--hairline-strong)',
                background: 'var(--canvas)',
                color: 'var(--ink)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ⚙️ 관리자 포탈
            </button>
          )}

          {lmsUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', borderLeft: '1px solid var(--hairline)', paddingLeft: '16px' }}>
              <span style={{ fontSize: '13px', color: 'var(--body)' }}>👤 {lmsUser.name}</span>
              <button
                onClick={handleAdminLogout}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--rounded-sm)',
                  border: '1px solid var(--hairline-strong)',
                  background: 'var(--canvas)',
                  color: 'var(--body)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                로그아웃
              </button>
            </div>
          )}
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

// ── [어드민 전용 로그인 포탈 컴포넌트 - Expo 테마 적용] ──
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas-soft)', fontFamily: 'var(--sans)' }}>
      <div style={{ 
        background: 'var(--surface-card)', 
        borderRadius: 'var(--rounded-lg)', 
        padding: '40px', 
        width: '100%', 
        maxWidth: '400px', 
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)', 
        border: '1px solid var(--hairline)',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '32px' }}>🛡️</span>
          <h3 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--ink)', margin: '12px 0 6px 0', letterSpacing: '-0.5px' }}>TUNE 관리자 로그인</h3>
          <span style={{ fontSize: '13px', color: 'var(--body)' }}>오케스트로 아카데미 LMS 및 OnTest 통제 포탈</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>관리자 계정 ID / 이메일</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin 또는 admin@okestro.com"
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                border: '1px solid var(--hairline-strong)', 
                borderRadius: 'var(--rounded-md)', 
                fontSize: '14px', 
                boxSizing: 'border-box', 
                outline: 'none',
                background: 'var(--canvas)',
                color: 'var(--ink)'
              }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="비밀번호 입력"
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                border: '1px solid var(--hairline-strong)', 
                borderRadius: 'var(--rounded-md)', 
                fontSize: '14px', 
                boxSizing: 'border-box', 
                outline: 'none',
                background: 'var(--canvas)',
                color: 'var(--ink)'
              }}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
          </div>

          {err && <div style={{ fontSize: '13px', color: 'var(--semantic-error)', fontWeight: 500 }}>⚠️ {err}</div>}

          <button onClick={handleAdminLogin} disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: 'var(--primary)', 
              color: 'var(--on-primary)', 
              border: 'none', 
              borderRadius: 'var(--rounded-md)', 
              fontSize: '14px', 
              fontWeight: 500, 
              cursor: loading ? 'not-allowed' : 'pointer', 
              transition: 'background 0.15s' 
            }}
            onMouseOver={(e) => { if(!loading) e.currentTarget.style.background = 'var(--primary-active)'; }}
            onMouseOut={(e) => { if(!loading) e.currentTarget.style.background = 'var(--primary)'; }}
          >
            {loading ? "보안 인증 처리 중..." : "관리자 시스템 보안 로그인"}
          </button>
          
          <button onClick={onBackToHome} 
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: 'var(--canvas)', 
              border: '1px solid var(--hairline-strong)', 
              borderRadius: 'var(--rounded-md)', 
              color: 'var(--ink)', 
              fontSize: '14px', 
              fontWeight: 500, 
              cursor: 'pointer' 
            }}
          >
            사용자 홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;