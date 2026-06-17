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
  const [adminSubTab, setAdminSubTab] = useState("lms-approval"); // test: 솔루션 테스트 관리, lms-course: 영상 관리, lms-approval: 관리
  
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
    setAdminSubTab("lms-approval");
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
              <img src="/logo.png" alt="AIDA OASIS" style={{ height: "24px", objectFit: "contain" }} />
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
          <div style={{ display: 'flex', background: 'var(--canvas)', borderBottom: '1px solid var(--hairline)', padding: '0 24px', boxSizing: 'border-box', flexWrap: 'wrap' }}>
            <button
              onClick={() => setAdminSubTab("lms-approval")}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'none',
                borderBottom: adminSubTab === 'lms-approval' ? '2px solid var(--primary)' : 'none',
                color: adminSubTab === 'lms-approval' ? 'var(--ink)' : 'var(--body)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              🛡️ 관리
            </button>
            <button
              onClick={() => setAdminSubTab("lms-course")}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'none',
                borderBottom: adminSubTab === 'lms-course' ? '2px solid var(--primary)' : 'none',
                color: adminSubTab === 'lms-course' ? 'var(--ink)' : 'var(--body)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              📖 영상 관리
            </button>
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
              📊 솔루션 테스트 관리
            </button>
          </div>

          {/* 본문 뷰 출력 */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {adminSubTab === 'test' && (
              <MyComponent viewPath="/admin" />
            )}
            {adminSubTab === 'lms-course' && (
              <LmsManager viewPath="/admin" onNavigate={navigate} adminSubTabGroup="course" />
            )}
            {adminSubTab === 'lms-approval' && (
              <LmsManager viewPath="/admin" onNavigate={navigate} adminSubTabGroup="approval" />
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
      {/* ── 일반 사용자 GNB 헤더 (단일 행 프리미엄 다크 네이비 테마 적용) ── */}
      <div style={{
        background: '#0A192F',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '0 24px',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left Side: Logo & Main Navigation Menus */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <img src="/logo.png" alt="AIDA OASIS" style={{ height: "26px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {[
                { id: "course", label: "교육신청", path: "/course" },
                { id: "schedule", label: "연간교육계획", path: "/schedule" },
                { id: "notice", label: "공지사항", path: "/notice" },
                { id: "faq", label: "자주 묻는 질문 (FAQ)", path: "/faq" },
                { id: "classroom", label: "나의 강의실", path: "/classroom", secure: true }
              ].map((item) => {
                const isActive = path === item.path || (item.id === "course" && path.startsWith("/course"));
                return (
                  <span
                    key={item.id}
                    onClick={() => {
                      if (item.secure && !lmsUser) {
                        navigate('/');
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('aida:trigger_guest_alert'));
                        }, 50);
                      } else {
                        navigate(item.path);
                      }
                    }}
                    style={{
                      color: isActive ? '#38BDF8' : '#94A3B8',
                      fontSize: '14px',
                      fontWeight: isActive ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'color 0.15s ease',
                      padding: '6px 4px',
                      borderBottom: isActive ? '2px solid #38BDF8' : '2px solid transparent'
                    }}
                    onMouseOver={e => {
                      if (!isActive) e.currentTarget.style.color = '#F8FAFC';
                    }}
                    onMouseOut={e => {
                      if (!isActive) e.currentTarget.style.color = '#94A3B8';
                    }}
                  >
                    {item.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Right Side: Authentication Links & Prominent LMS Classroom Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!lmsUser ? (
              <>
                <span
                  onClick={() => {
                    navigate('/');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('aida:trigger_auth', { detail: "login" }));
                    }, 50);
                  }}
                  style={{ fontSize: '13px', color: '#94A3B8', cursor: 'pointer', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.color = '#F8FAFC'}
                  onMouseOut={e => e.currentTarget.style.color = '#94A3B8'}
                >
                  로그인
                </span>
                <span
                  onClick={() => {
                    navigate('/');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('aida:trigger_auth', { detail: "register" }));
                    }, 50);
                  }}
                  style={{ fontSize: '13px', color: '#94A3B8', cursor: 'pointer', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.color = '#F8FAFC'}
                  onMouseOut={e => e.currentTarget.style.color = '#94A3B8'}
                >
                  회원가입
                </span>
              </>
            ) : (
              <>
                {lmsUser.role === 'admin' && (
                  <button
                    onClick={() => navigate('/admin')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    ⚙️ 관리자 포탈
                  </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#E2E8F0' }}>👤 {lmsUser.name}님</span>
                  <button
                    onClick={handleAdminLogout}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent',
                      color: '#94A3B8',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.color = '#F8FAFC';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.color = '#94A3B8';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    로그아웃
                  </button>
                </div>
              </>
            )}

            <button
              onClick={() => {
                if (!lmsUser) {
                  navigate('/');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('aida:trigger_guest_alert'));
                  }, 50);
                } else {
                  navigate('/classroom');
                }
              }}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '24px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#1E293B';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#000000';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
            >
              🎓 LMS 강의실
            </button>
          </div>
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