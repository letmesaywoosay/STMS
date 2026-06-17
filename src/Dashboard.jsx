/* eslint-disable */
import { useState, useEffect } from 'react';

// API 설정 (App.jsx 동기화)
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

export default function Dashboard({ onTabChange }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    users: [],
    registrations: [],
    courses: [],
    eduCourses: [],
    applicants: [],
    subjects: [],
    schedules: [],
    historyLogs: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [u, r, c, ec, a, s, sch, h] = await Promise.all([
        fbGet("aida:lms_users_v2").catch(() => []),
        fbGet("aida:edu_registrations_v1").catch(() => []),
        fbGet("aida:lms_courses_v2").catch(() => []),
        fbGet("aida:edu_courses_v1").catch(() => []),
        fbGet("aida:applicants_v2").catch(() => []),
        fbGet("aida:subjects_v1").catch(() => []),
        fbGet("aida:lms_schedules_v1").catch(() => []),
        fbGet("aida:lms_history_logs_v1").catch(() => [])
      ]);

      setData({
        users: u || [],
        registrations: r || [],
        courses: c || [],
        eduCourses: ec || [],
        applicants: a || [],
        subjects: s || [],
        schedules: sch || [],
        historyLogs: h || []
      });
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("데이터를 불러오는 중 오류가 발생했습니다: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box", fontFamily: "var(--sans)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid var(--hairline-strong)",
            borderTop: "3px solid var(--primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <span style={{ fontSize: "14px", color: "var(--body)" }}>통합 대시보드 데이터를 실시간 분석 중입니다...</span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box", fontFamily: "var(--sans)" }}>
        <div style={{ padding: "24px", background: "rgba(235, 142, 144, 0.1)", border: "1px solid var(--semantic-error)", borderRadius: "var(--rounded-lg)", textAlign: "center" }}>
          <p style={{ color: "var(--semantic-error)", fontWeight: 500, margin: "0 0 16px 0" }}>{error}</p>
          <button onClick={loadData} style={{
            padding: "8px 16px",
            background: "var(--primary)",
            color: "var(--on-primary)",
            border: "none",
            borderRadius: "var(--rounded-md)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500
          }}>다시 시도</button>
        </div>
      </div>
    );
  }

  // 1. 관리 통계 가공
  const totalUsers = data.users.length;
  const approvedUsers = data.users.filter(u => u.approved).length;
  const pendingUsers = data.users.filter(u => !u.approved).length;
  
  const totalRegistrations = data.registrations.length;
  const pendingRegistrations = data.registrations.filter(r => r.status === '대기중' || !r.status).length;

  // 2. 영상 관리 통계 가공
  const totalVideos = data.courses.length;
  const activeCourses = data.eduCourses.length;

  // 3. 솔루션 테스트 통계 가공
  const totalApplicants = data.applicants.length;
  const passCount = data.applicants.filter(a => a.finalStatus === '합격').length;
  const passRate = totalApplicants > 0 ? Math.round((passCount / totalApplicants) * 100) : 0;
  const totalSubjects = data.subjects.length;

  // 4. 직무 분포 가공
  const jobCounts = {};
  data.applicants.forEach(a => {
    const job = a.jobType || "기타";
    jobCounts[job] = (jobCounts[job] || 0) + 1;
  });
  const sortedJobs = Object.entries(jobCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 5. 인기 교육과정 가공
  const courseCounts = {};
  data.registrations.forEach(r => {
    const cName = r.courseName || "알 수 없는 과정";
    courseCounts[cName] = (courseCounts[cName] || 0) + 1;
  });
  const popularCourses = Object.entries(courseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // 최근 로그 5개
  const recentLogs = [...data.historyLogs]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const formatLogText = (log) => {
    if (log.type === 'role_changed') {
      return `${log.details?.name || '사용자'}(${log.details?.email})의 권한이 ${log.details?.role || 'user'}(으)로 변경되었습니다.`;
    }
    if (log.type === 'approved' || log.type === 'user_approved') {
      return `${log.details?.name || '사용자'}(${log.details?.email})의 가입이 승인되었습니다.`;
    }
    if (log.type === 'deleted' || log.type === 'user_deleted') {
      return `${log.details?.name || '사용자'}(${log.details?.email})의 계정이 삭제되었습니다.`;
    }
    if (log.type === 'reg_approved') {
      return `${log.details?.fullName || '수강생'}(${log.details?.email})의 [${log.details?.courseName || ''}] 수강 신청이 승인되었습니다.`;
    }
    if (log.type === 'reg_rejected') {
      return `${log.details?.fullName || '수강생'}(${log.details?.email})의 [${log.details?.courseName || ''}] 수강 신청이 반려되었습니다.`;
    }
    return log.message || `${log.type} 처리 기록`;
  };

  const shadow = "0 4px 12px rgba(0, 0, 0, 0.04)";

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box", fontFamily: "var(--sans)" }}>
      {/* 타이틀 헤더 */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "28px", fontWeight: 600, color: "var(--ink)", margin: "0 0 6px 0", letterSpacing: "-0.84px" }}>📊 AIDA OASIS 통합 관제 센터</h3>
        <p style={{ fontSize: "14px", color: "var(--body)", margin: 0 }}>관리자 포탈의 주요 영역별 통계 및 실시간 메트릭을 요약합니다.</p>
      </div>

      {/* 3대 영역 요약 카드 (3열) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        
        {/* 카드 1: 관리 영역 */}
        <div style={{
          background: "var(--surface-card)",
          border: "1px solid var(--hairline-strong)",
          borderLeft: "5px solid var(--primary)",
          borderRadius: "var(--rounded-lg)",
          padding: "24px",
          boxShadow: shadow,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>🛡️ 관리</span>
              <span style={{ fontSize: "11px", background: "var(--canvas-soft)", padding: "4px 8px", borderRadius: "12px", color: "var(--body)" }}>기본 설정</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "var(--body)" }}>총 가입 회원</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                  {totalUsers}명 <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--muted)" }}>(대기: {pendingUsers}명)</span>
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "var(--body)" }}>교육 신청 대기</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                  {pendingRegistrations}건 <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--muted)" }}>(총: {totalRegistrations}건)</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onTabChange("lms-approval")}
            style={{
              marginTop: "24px",
              width: "100%",
              padding: "10px",
              background: "var(--canvas-soft)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--rounded-md)",
              color: "var(--ink)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center"
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = "var(--primary)";
              e.currentTarget.style.color = "var(--on-primary)";
              e.currentTarget.style.borderColor = "var(--primary)";
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = "var(--canvas-soft)";
              e.currentTarget.style.color = "var(--ink)";
              e.currentTarget.style.borderColor = "var(--hairline-strong)";
            }}
          >
            승인 및 회원 관리 이동 ➔
          </button>
        </div>

        {/* 카드 2: 영상 관리 영역 */}
        <div style={{
          background: "var(--surface-card)",
          border: "1px solid var(--hairline-strong)",
          borderLeft: "5px solid #14b8a6",
          borderRadius: "var(--rounded-lg)",
          padding: "24px",
          boxShadow: shadow,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>📖 영상 관리</span>
              <span style={{ fontSize: "11px", background: "rgba(20, 184, 166, 0.1)", padding: "4px 8px", borderRadius: "12px", color: "#14b8a6" }}>LMS 강의실</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "var(--body)" }}>업로드 강의 영상</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{totalVideos}개</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "var(--body)" }}>개설 활성 교육과정</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{activeCourses}개</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onTabChange("lms-course")}
            style={{
              marginTop: "24px",
              width: "100%",
              padding: "10px",
              background: "var(--canvas-soft)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--rounded-md)",
              color: "var(--ink)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center"
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = "#14b8a6";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "#14b8a6";
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = "var(--canvas-soft)";
              e.currentTarget.style.color = "var(--ink)";
              e.currentTarget.style.borderColor = "var(--hairline-strong)";
            }}
          >
            강의 영상 관리 이동 ➔
          </button>
        </div>

        {/* 카드 3: 솔루션 테스트 영역 */}
        <div style={{
          background: "var(--surface-card)",
          border: "1px solid var(--hairline-strong)",
          borderLeft: "5px solid #8145b5",
          borderRadius: "var(--rounded-lg)",
          padding: "24px",
          boxShadow: shadow,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>📊 솔루션 테스트 관리</span>
              <span style={{ fontSize: "11px", background: "rgba(129, 69, 181, 0.1)", padding: "4px 8px", borderRadius: "12px", color: "#8145b5" }}>OnTest</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "var(--body)" }}>총 테스트 응시자</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                  {totalApplicants}명 <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--muted)" }}>(과목수: {totalSubjects}개)</span>
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: "var(--body)" }}>최종 합격자 (합격률)</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#8145b5" }}>
                  {passCount}명 <span style={{ fontSize: "12px", fontWeight: 700 }}>({passRate}%)</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onTabChange("test")}
            style={{
              marginTop: "24px",
              width: "100%",
              padding: "10px",
              background: "var(--canvas-soft)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--rounded-md)",
              color: "var(--ink)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center"
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = "#8145b5";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "#8145b5";
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = "var(--canvas-soft)";
              e.currentTarget.style.color = "var(--ink)";
              e.currentTarget.style.borderColor = "var(--hairline-strong)";
            }}
          >
            OnTest 테스트 관리 이동 ➔
          </button>
        </div>

      </div>

      {/* 세부 분석 차트 및 실시간 타임라인 로그 영역 (2열 레이아웃) */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "24px", alignItems: "start" }}>
        
        {/* 좌측 분석 차트 */}
        <div style={{
          background: "var(--surface-card)",
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--rounded-lg)",
          padding: "28px",
          boxShadow: shadow
        }}>
          <h4 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", margin: "0 0 20px 0", letterSpacing: "-0.5px" }}>📈 데이터 시각화 및 주요 분포</h4>
          
          {/* 하위 위젯 1: 합격률 진행 바 */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>솔루션 테스트 합격 분포</span>
              <span style={{ fontSize: "13px", color: "var(--body)" }}>합격률 {passRate}% (전체 {totalApplicants}명 중 {passCount}명 합격)</span>
            </div>
            <div style={{ height: "16px", background: "var(--canvas-soft)", borderRadius: "8px", overflow: "hidden", display: "flex", border: "1px solid var(--hairline)" }}>
              <div style={{ width: `${passRate}%`, background: "var(--primary)", height: "100%", transition: "width 0.5s ease" }} />
              <div style={{ width: `${100 - passRate}%`, background: "#e2e8f0", height: "100%" }} />
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)" }} />
                <span style={{ fontSize: "11px", color: "var(--body)" }}>합격 ({passCount}명)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e2e8f0" }} />
                <span style={{ fontSize: "11px", color: "var(--body)" }}>불합격/대기 ({totalApplicants - passCount}명)</span>
              </div>
            </div>
          </div>

          {/* 하위 위젯 2: 직무 유형 분포 */}
          <div style={{ marginBottom: "28px", borderTop: "1px solid var(--hairline)", paddingTop: "24px" }}>
            <h5 style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>👤 직무 유형별 응시자 분포 (Top 5)</h5>
            {sortedJobs.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>데이터가 없습니다.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sortedJobs.map(([job, count]) => {
                  const percent = Math.round((count / totalApplicants) * 100);
                  return (
                    <div key={job}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{job}</span>
                        <span style={{ color: "var(--body)" }}>{count}명 ({percent}%)</span>
                      </div>
                      <div style={{ height: "8px", background: "var(--canvas-soft)", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--hairline-soft)" }}>
                        <div style={{ width: `${percent}%`, background: "#8145b5", height: "100%", borderRadius: "4px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 하위 위젯 3: 인기 강좌 리스트 */}
          <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: "24px" }}>
            <h5 style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>🔥 신청 과목 인기 순위 (Top 3)</h5>
            {popularCourses.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>신청 이력이 없습니다.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {popularCourses.map(([cName, count], idx) => (
                  <div key={cName} style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--canvas-soft)", padding: "12px 16px", borderRadius: "var(--rounded-md)", border: "1px solid var(--hairline)" }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: idx === 0 ? "var(--primary)" : (idx === 1 ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)"),
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>{idx + 1}</div>
                    <div style={{ flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{cName}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--body)", fontWeight: 500, flexShrink: 0 }}>총 {count}건 신청</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 우측 실시간 활동 로그 */}
        <div style={{
          background: "var(--surface-card)",
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--rounded-lg)",
          padding: "28px",
          boxShadow: shadow
        }}>
          <h4 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", margin: "0 0 20px 0", letterSpacing: "-0.5px" }}>🕒 실시간 처리 이력</h4>
          
          {recentLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)", fontSize: "13px" }}>최근 승인 또는 변경 처리 기록이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative" }}>
              {/* 타임라인 수직 라인 */}
              <div style={{ position: "absolute", top: "8px", bottom: "8px", left: "11px", width: "1.5px", background: "var(--hairline-strong)", zIndex: 1 }} />
              
              {recentLogs.map(log => {
                let badgeColor = "var(--muted)";
                let badgeBg = "var(--canvas-soft)";
                if (log.type === 'approved' || log.type === 'user_approved' || log.type === 'reg_approved') {
                  badgeColor = "var(--semantic-success)";
                  badgeBg = "rgba(22, 163, 74, 0.1)";
                } else if (log.type === 'reg_rejected' || log.type === 'deleted' || log.type === 'user_deleted') {
                  badgeColor = "var(--semantic-error)";
                  badgeBg = "rgba(235, 142, 144, 0.1)";
                } else if (log.type === 'role_changed') {
                  badgeColor = "var(--primary)";
                  badgeBg = "rgba(0, 0, 0, 0.08)";
                }

                return (
                  <div key={log.id} style={{ display: "flex", gap: "16px", zIndex: 2, position: "relative" }}>
                    {/* 타임라인 마커 */}
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--surface-card)",
                      border: `2px solid ${badgeColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: badgeColor }} />
                    </div>
                    
                    {/* 로그 세부 콘텐츠 */}
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: badgeColor,
                          background: badgeBg,
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>
                          {log.type === 'role_changed' ? '권한 변경' :
                           log.type.includes('approved') ? '승인 완료' :
                           log.type.includes('rejected') ? '반려 처리' : '계정 삭제'}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {new Date(log.timestamp).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p style={{ fontSize: "13px", color: "var(--ink)", margin: 0, lineHeight: 1.4, fontWeight: 500 }}>
                        {formatLogText(log)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
