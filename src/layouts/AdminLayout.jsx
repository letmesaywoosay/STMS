import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';

export default function AdminLayout({ lmsUser, onLogout }) {
  const navigate = useNavigate();

  // Protect route
  if (!lmsUser || lmsUser.role !== 'admin') {
    return null;
  }

  const activeTabStyle = {
    padding: '16px 20px',
    border: 'none',
    background: 'none',
    borderBottom: '2px solid var(--primary)',
    color: 'var(--ink)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    marginBottom: '-1px'
  };

  const inactiveTabStyle = {
    padding: '16px 20px',
    border: 'none',
    background: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--body)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    marginBottom: '-1px'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas-soft)', fontFamily: 'var(--sans)' }}>
      {/* 어드민 글로벌 헤더 (top-nav) */}
      <div style={{
        background: 'var(--canvas)',
        height: '64px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        borderBottom: '1px solid var(--hairline)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img src="/logo.png" alt="AIDA OASIS" style={{ height: "24px", objectFit: "contain" }} />
            <span style={{ fontSize: '13px', color: 'var(--body)', fontWeight: 500, borderLeft: '1px solid var(--hairline-strong)', paddingLeft: '12px' }}>관리자 포탈</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--body)', fontWeight: 500 }}>{lmsUser.name} 관리자</span>
            <Link 
              to="/" 
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
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                transition: 'background 0.15s' 
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-active)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
            >
              사용자 홈
            </Link>
            <button 
              onClick={onLogout} 
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
      </div>

      {/* 서브 네비게이션 탭 */}
      <div style={{ background: 'var(--canvas)', borderBottom: '1px solid var(--hairline)', padding: '0 24px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <NavLink
            to="/admin"
            end
            style={({ isActive }) => isActive ? activeTabStyle : inactiveTabStyle}
          >
            📊 대시보드
          </NavLink>
          <NavLink
            to="/admin/approval"
            style={({ isActive }) => isActive ? activeTabStyle : inactiveTabStyle}
          >
            🔑 가입/권한 관리
          </NavLink>
          <NavLink
            to="/admin/course"
            style={({ isActive }) => isActive ? activeTabStyle : inactiveTabStyle}
          >
            📹 영상 콘텐츠 관리
          </NavLink>
          <NavLink
            to="/admin/test"
            style={({ isActive }) => isActive ? activeTabStyle : inactiveTabStyle}
            onClick={() => {
              window.dispatchEvent(new CustomEvent("aida:reset_test_menu"));
            }}
          >
            📝 솔루션 테스트 관리
          </NavLink>
          <NavLink
            to="/admin/education"
            style={({ isActive }) => isActive ? activeTabStyle : inactiveTabStyle}
          >
            🎓 교육 과정 계획
          </NavLink>
          <NavLink
            to="/admin/attendance"
            style={({ isActive }) => isActive ? activeTabStyle : inactiveTabStyle}
          >
            ⏰ 실시간 출결 Roster
          </NavLink>
        </div>
      </div>

      {/* 본문 뷰 출력 */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
}
