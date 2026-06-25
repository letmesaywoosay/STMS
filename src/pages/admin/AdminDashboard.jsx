import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    beforeCourses: 0,
    progressCourses: 0,
    finishedCourses: 0,
    avgSat: 0
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aida:academy_educations');
      if (saved) {
        const educations = JSON.parse(saved);
        const total = educations.length;
        const before = educations.filter(e => e.status === 'BEFORE').length;
        const progress = educations.filter(e => e.status === 'PROGRESS').length;
        const finished = educations.filter(e => e.status === 'FINISHED').length;
        
        // Calculate average overall satisfaction
        const finishedWithSat = educations.filter(e => e.status === 'FINISHED' && e.sat_overall > 0);
        const sumSat = finishedWithSat.reduce((acc, curr) => acc + Number(curr.sat_overall), 0);
        const avg = finishedWithSat.length > 0 ? (sumSat / finishedWithSat.length).toFixed(2) : '0.00';

        setStats({
          totalCourses: total,
          beforeCourses: before,
          progressCourses: progress,
          finishedCourses: finished,
          avgSat: avg
        });
      }
    } catch (e) {
      console.error("Failed to load dashboard statistics", e);
    }
  }, []);

  const cardStyle = {
    background: 'var(--surface-card)',
    border: '1px solid var(--hairline-strong)',
    borderRadius: 'var(--rounded-lg)',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box", fontFamily: "var(--sans)" }}>
      
      {/* Welcome Banner */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--hairline-strong)',
        borderRadius: 'var(--rounded-lg)',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
          🛡️ AIDA OASIS 관리자 시스템
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--body)', margin: 0, lineHeight: 1.6 }}>
          오케스트로 아카데미 LMS 및 솔루션 테스트 포탈의 백오피스 통합 대시보드입니다. 교육 개설 계획(Before), 실시간 출결 Roster(Progress) 및 교육 만족도 지표 수집(After)을 포함하여 교육 전반의 생애주기를 통제하고 모니터링할 수 있습니다.
        </p>
      </div>

      {/* Statistics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={cardStyle}>
          <span style={{ fontSize: '13px', color: 'var(--body)', fontWeight: 600 }}>전체 개설 과정</span>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ink)' }}>{stats.totalCourses}개</span>
        </div>
        <div style={cardStyle}>
          <span style={{ fontSize: '13px', color: 'var(--body)', fontWeight: 600 }}>대기중인 교육 (BEFORE)</span>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--amber)' }}>{stats.beforeCourses}개</span>
        </div>
        <div style={cardStyle}>
          <span style={{ fontSize: '13px', color: 'var(--body)', fontWeight: 600 }}>진행중인 교육 (PROGRESS)</span>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>{stats.progressCourses}개</span>
        </div>
        <div style={cardStyle}>
          <span style={{ fontSize: '13px', color: 'var(--body)', fontWeight: 600 }}>종료된 교육 (FINISHED)</span>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--green)' }}>{stats.finishedCourses}개</span>
        </div>
        <div style={cardStyle}>
          <span style={{ fontSize: '13px', color: 'var(--body)', fontWeight: 600 }}>평균 교육 만족도 지표</span>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary-active)' }}>{stats.avgSat} / 5.00</span>
        </div>
      </div>

      {/* System Status / Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        <div style={{ ...cardStyle, flexGrow: 1 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>📢 핵심 관리자 기능 바로가기</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--canvas-soft)', borderRadius: '8px', border: '1px solid var(--hairline)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--ink)' }}>교육 과정 개설 및 실적 관리</strong>
                <span style={{ fontSize: '12.5px', color: 'var(--body)' }}>신규 기수 교육 일정을 개설하고, 수동 만족도 점수 및 피드백을 업데이트합니다.</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--canvas-soft)', borderRadius: '8px', border: '1px solid var(--hairline)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--ink)' }}>실시간 QR 출결 통계 및 명단 확인</strong>
                <span style={{ fontSize: '12.5px', color: 'var(--body)' }}>생성된 모바일 출석 링크를 공유하고, 당일 입실한 수강생 Roster 통계를 관리합니다.</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--canvas-soft)', borderRadius: '8px', border: '1px solid var(--hairline)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--ink)' }}>동영상 콘텐츠 및 가입 승인</strong>
                <span style={{ fontSize: '12.5px', color: 'var(--body)' }}>LMS 온라인 강의 영상을 등록하고, 수강생 계정 승인 및 OnTest 테스트 결과를 관리합니다.</span>
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>⚙️ 플랫폼 상태</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px', color: 'var(--body)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Vite Bundler</span>
              <strong style={{ color: 'var(--green)' }}>정상 (v8.0)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>React DOM Framework</span>
              <strong style={{ color: 'var(--ink)' }}>v19.0.x</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Router Library</span>
              <strong style={{ color: 'var(--primary)' }}>react-router-dom v6</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>데이터베이스 통신</span>
              <strong style={{ color: 'var(--green)' }}>LocalStorage + REST REST API</strong>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
