import React, { useState, useEffect } from 'react';
import MyComponent from './ApplicantManager';
import QuestionBank from './QuestionBank';
import LmsManager from './LmsManager';

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [lmsUser, setLmsUser] = useState(null);
  const [showAdminAlert, setShowAdminAlert] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // LMS 로그인 세션 주기적인 체크/구독
  useEffect(() => {
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
    checkSession();
    window.addEventListener('popstate', checkSession);
    return () => window.removeEventListener('popstate', checkSession);
  }, []);

  const navigate = (to) => {
    window.history.pushState(null, '', to);
    setPath(to);
  };

  const isQuestionView = path === '/questions';
  const isTestView = path === '/test' || path === '/officer';
  const isLmsView = !isQuestionView && !isTestView;

  // 솔루션 테스트 탭 클릭 핸들러
  const handleTestTabClick = () => {
    if (lmsUser?.role === 'admin' || path === '/officer') {
      navigate('/test');
    } else {
      setShowAdminAlert(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      {/* ── 상단 글로벌 GNB 헤더 ── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span style={{ fontSize: '20px' }}>🎻</span>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.2px' }}>
            OKESTRO ACADEMY <span style={{ color: '#8b5cf6', fontWeight: 900 }}>TUNE</span>
          </span>
        </div>

        {/* 대메뉴 탭 구성 */}
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: isLmsView ? '#ffffff' : 'transparent',
              boxShadow: isLmsView ? '0 1px 3px 0 rgba(0, 0, 0, 0.08)' : 'none',
              color: isLmsView ? '#8b5cf6' : '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🎓 LMS 강의실
          </button>
          <button
            onClick={() => navigate('/questions')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: isQuestionView ? '#ffffff' : 'transparent',
              boxShadow: isQuestionView ? '0 1px 3px 0 rgba(0, 0, 0, 0.08)' : 'none',
              color: isQuestionView ? '#8b5cf6' : '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📋 AIDA 문제은행 (NotebookLM)
          </button>
          <button
            onClick={handleTestTabClick}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: isTestView ? '#ffffff' : 'transparent',
              boxShadow: isTestView ? '0 1px 3px 0 rgba(0, 0, 0, 0.08)' : 'none',
              color: isTestView ? '#8b5cf6' : '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📊 솔루션 테스트 (OnTest)
          </button>
        </div>
      </div>

      {/* ── 본문 화면 출력 분기 ── */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {isLmsView && <LmsManager viewPath={path} onNavigate={navigate} />}
        {isQuestionView && <QuestionBank />}
        {isTestView && <MyComponent />}
      </div>

      {/* 어드민 전용 팝업 경고창 */}
      {showAdminAlert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '340px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>⚠️</div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>관리자 권한이 필요합니다</h4>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>솔루션 테스트(OnTest) 관리자 대시보드는 최고관리자 혹은 교육 관리자 계정으로 로그인한 경우에만 접근할 수 있습니다.</p>
            <button onClick={() => { setShowAdminAlert(false); navigate('/'); }} style={{ width: '100%', padding: '10px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;