import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';

export default function UserLayout({ lmsUser, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas)', fontFamily: 'var(--sans)' }}>
      {/* ── 일반 사용자 GNB 헤더 (단일 행 프리미엄 다크 네이비 테마) ── */}
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
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img src="/logo.png" alt="AIDA OASIS" style={{ height: "26px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* 오프라인 교육 (드롭다운) */}
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => {
                  const el = document.getElementById('dropdown-offline');
                  if (el) el.style.display = 'block';
                }}
                onMouseLeave={() => {
                  const el = document.getElementById('dropdown-offline');
                  if (el) el.style.display = 'none';
                }}
              >
                <span
                  style={{
                    color: (path === '/courses' || path === '/schedule') ? '#38BDF8' : '#94A3B8',
                    fontSize: '14px',
                    fontWeight: (path === '/courses' || path === '/schedule') ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'color 0.15s ease',
                    padding: '24px 4px',
                    display: 'inline-block'
                  }}
                  onMouseOver={e => {
                    if (!(path === '/courses' || path === '/schedule')) e.currentTarget.style.color = '#F8FAFC';
                  }}
                  onMouseOut={e => {
                    if (!(path === '/courses' || path === '/schedule')) e.currentTarget.style.color = '#94A3B8';
                  }}
                >
                  오프라인 교육 ▾
                </span>
                <div 
                  id="dropdown-offline"
                  style={{
                    display: 'none',
                    position: 'absolute',
                    top: '56px',
                    left: 0,
                    background: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    padding: '8px 0',
                    minWidth: '140px',
                    zIndex: 1000
                  }}
                >
                  <div 
                    onClick={() => navigate('/courses')}
                    style={{
                      padding: '10px 16px',
                      color: path === '/courses' ? '#38BDF8' : '#E2E8F0',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      fontWeight: path === '/courses' ? '600' : 'normal'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#1E293B'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    교육신청
                  </div>
                  <div 
                    onClick={() => navigate('/schedule')}
                    style={{
                      padding: '10px 16px',
                      color: path === '/schedule' ? '#38BDF8' : '#E2E8F0',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      fontWeight: path === '/schedule' ? '600' : 'normal'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#1E293B'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    연간교육계획
                  </div>
                </div>
              </div>

              {/* 온라인 교육 (드롭다운) */}
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => {
                  const el = document.getElementById('dropdown-online');
                  if (el) el.style.display = 'block';
                }}
                onMouseLeave={() => {
                  const el = document.getElementById('dropdown-online');
                  if (el) el.style.display = 'none';
                }}
              >
                <span
                  style={{
                    color: path === '/classroom' ? '#38BDF8' : '#94A3B8',
                    fontSize: '14px',
                    fontWeight: path === '/classroom' ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'color 0.15s ease',
                    padding: '24px 4px',
                    display: 'inline-block'
                  }}
                  onMouseOver={e => {
                    if (path !== '/classroom') e.currentTarget.style.color = '#F8FAFC';
                  }}
                  onMouseOut={e => {
                    if (path !== '/classroom') e.currentTarget.style.color = '#94A3B8';
                  }}
                >
                  온라인 교육 ▾
                </span>
                <div 
                  id="dropdown-online"
                  style={{
                    display: 'none',
                    position: 'absolute',
                    top: '56px',
                    left: 0,
                    background: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    padding: '8px 0',
                    minWidth: '140px',
                    zIndex: 1000
                  }}
                >
                  <div 
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
                      padding: '10px 16px',
                      color: path === '/classroom' ? '#38BDF8' : '#E2E8F0',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      fontWeight: path === '/classroom' ? '600' : 'normal'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#1E293B'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    온라인 강의
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Authentication Links & LMS Button */}
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
                  <Link
                    to="/admin"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
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
                  </Link>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '16px' }}>
                  <Link
                    to="/mypage"
                    style={{
                      fontSize: '13px',
                      color: path === '/mypage' ? '#38BDF8' : '#94A3B8',
                      cursor: 'pointer',
                      marginRight: '12px',
                      textDecoration: 'none',
                      fontWeight: path === '/mypage' ? '600' : '500',
                      transition: 'color 0.15s'
                    }}
                    onMouseOver={e => {
                      if (path !== '/mypage') e.currentTarget.style.color = '#F8FAFC';
                    }}
                    onMouseOut={e => {
                      if (path !== '/mypage') e.currentTarget.style.color = '#94A3B8';
                    }}
                  >
                    마이페이지
                  </Link>
                  <span style={{ fontSize: '13px', color: '#E2E8F0' }}>👤 {lmsUser.name}님</span>
                  <button
                    onClick={onLogout}
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
          </div>
        </div>
      </div>

      {/* Main content route slot */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
}
