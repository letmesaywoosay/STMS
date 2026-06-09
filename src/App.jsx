import React, { useState, useEffect } from 'react';
import MyComponent from './ApplicantManager';
import QuestionBank from './QuestionBank';

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to) => {
    window.history.pushState(null, '', to);
    setPath(to);
  };

  const isApplicantView = path.startsWith('/applicant') || path.startsWith('/officer') || path.startsWith('/admin');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── 상단 글로벌 네비게이션 헤더 ── */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)',
        zIndex: 100,
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🎻</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.2px' }}>
            OKESTRO ACADEMY <span style={{ color: '#4f46e5', fontWeight: 800 }}>AIDA</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: !isApplicantView ? '#ffffff' : 'transparent',
              boxShadow: !isApplicantView ? '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)' : 'none',
              color: !isApplicantView ? '#2563eb' : '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: 'none'
            }}
          >
            📋 AIDA 문제은행 (NotebookLM)
          </button>
          <button
            onClick={() => {
              let target = '/admin';
              try {
                const s = sessionStorage.getItem('aida:login');
                if (s) {
                  const u = JSON.parse(s);
                  if (u?.type === 'officer') {
                    target = '/officer';
                  }
                }
              } catch {}
              navigate(target);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: isApplicantView ? '#ffffff' : 'transparent',
              boxShadow: isApplicantView ? '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)' : 'none',
              color: isApplicantView ? '#2563eb' : '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: 'none'
            }}
          >
            👥 AIDA 지원자 평가 관리
          </button>
        </div>
      </div>

      {/* ── 本문 화면 출력 ── */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {!isApplicantView ? <QuestionBank /> : <MyComponent />}
      </div>
    </div>
  );
}

export default App;