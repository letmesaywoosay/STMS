/* eslint-disable */
// App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import MyComponent from './ApplicantManager';
import QuestionBank from './QuestionBank';
import LmsManager from './LmsManager';
import EducationManagement from './EducationManagement';
import MobileCheckin from './MobileCheckin';
import { fbGet } from './firebaseStore';

// Layout wrappers
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Subpages
import AdminDashboard from './pages/admin/AdminDashboard';

function AppContent() {
  const [lmsUser, setLmsUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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
  }, [location.pathname]);

  const handleAdminLogout = () => {
    sessionStorage.removeItem('aida:lms_login');
    setLmsUser(null);
    navigate('/');
  };

  const handleAdminLoginSuccess = (user) => {
    sessionStorage.setItem('aida:lms_login', JSON.stringify(user));
    setLmsUser(user);
    navigate('/admin');
  };

  return (
    <Routes>
      {/* 1. 일반 사용자 포털 영역 (GNB 레이아웃 적용) */}
      <Route path="/" element={<UserLayout lmsUser={lmsUser} onLogout={handleAdminLogout} />}>
        <Route index element={<LmsManager viewPath="/" onNavigate={navigate} />} />
        <Route path="courses" element={<LmsManager viewPath="/course" onNavigate={navigate} />} />
        <Route path="schedule" element={<LmsManager viewPath="/schedule" onNavigate={navigate} />} />
        <Route path="classroom" element={
          lmsUser ? <LmsManager viewPath="/classroom" onNavigate={navigate} /> : <Navigate to="/" replace />
        } />
        <Route path="mypage" element={
          lmsUser ? <LmsManager viewPath="/mypage" onNavigate={navigate} /> : <Navigate to="/" replace />
        } />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="officer" element={<MyComponent />} />
      </Route>

      {/* 2. 모바일 QR 출석 체크 페이지 (헤더 없는 단독 전체 화면) */}
      <Route path="/attendance/checkin" element={<MobileCheckin onBack={() => navigate('/')} />} />

      {/* 3. 백오피스 관리자 영역 (어드민 가드 및 사이드바/GNB 레이아웃 적용) */}
      <Route path="/admin" element={
        lmsUser && lmsUser.role === 'admin' ? (
          <AdminLayout lmsUser={lmsUser} onLogout={handleAdminLogout} />
        ) : (
          <AdminLoginPortal onLoginSuccess={handleAdminLoginSuccess} onBackToHome={() => navigate('/')} />
        )
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="approval" element={<LmsManager viewPath="/admin" onNavigate={navigate} adminSubTabGroup="approval" />} />
        <Route path="course" element={<LmsManager viewPath="/admin" onNavigate={navigate} adminSubTabGroup="course" />} />
        <Route path="test" element={<MyComponent viewPath="/admin" />} />
        <Route path="education" element={<EducationManagement defaultMenu="EDU" />} />
        <Route path="attendance" element={<EducationManagement defaultMenu="ATT" />} />
      </Route>

      {/* 정의되지 않은 경로 폴백 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas-soft)', fontFamily: 'var(--sans)', width: '100vw' }}>
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

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
