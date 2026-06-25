import React, { useState, useEffect } from 'react';
import { fbGet, fbSet } from './firebaseStore';

// Preset default options for educations & students
const defaultCourseNames = [
  "고객 대상 CONTRABASS 소개 및 기능 교육",
  "사내 임직원 대상 OpenStack 신규 기능 핵심 과정",
  "파트너 기술 엔지니어 대상 AIDA 솔루션 아키텍트 교육"
];

export default function MobileCheckin({ onBack }) {
  const [educations, setEducations] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentCompany, setStudentCompany] = useState("");
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [checkedStudent, setCheckedStudent] = useState(null);

  // Load educations from Firestore on mount
  useEffect(() => {
    const loadEducations = async () => {
      try {
        let eduList = await fbGet("aida:academy_educations_v1").catch(() => null);
        if (!eduList || eduList.length === 0) {
          const savedEdu = localStorage.getItem('aida:academy_educations');
          eduList = savedEdu ? JSON.parse(savedEdu) : [];
        }
        
        if (eduList.length > 0) {
          setEducations(eduList);
          // Default select the first active/progress course
          const activeCourse = eduList.find(c => c.status === 'PROGRESS') || eduList[0];
          if (activeCourse) {
            setSelectedCourseId(activeCourse.id);
          }
        }
      } catch (e) {
        console.error("Failed to load educations", e);
      }
    };
    loadEducations();
  }, []);

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert("출석할 교육 과정을 선택해 주세요.");
      return;
    }
    if (!studentName.trim()) {
      alert("이름을 입력해 주세요.");
      return;
    }

    try {
      // Fetch latest students list from Firestore
      let roster = await fbGet("aida:academy_students_v1").catch(() => null);
      if (!roster || roster.length === 0) {
        const savedStudents = localStorage.getItem('aida:academy_students');
        roster = savedStudents ? JSON.parse(savedStudents) : [];
      }

      const targetCourseId = selectedCourseId;
      
      // Look up student by name in the roster for this course
      const existingIdx = roster.findIndex(s => String(s.courseId) === String(targetCourseId) && s.name.trim() === studentName.trim());
      
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      let updatedStudent;

      if (existingIdx !== -1) {
        // Update pre-registered student status to ATTENDED
        roster[existingIdx] = {
          ...roster[existingIdx],
          status: 'ATTENDED',
          checked_at: nowStr,
          ip_address: '192.168.1.18', // Simulated IP
          device_info: 'Mobile Browser (QR OTP Scan)'
        };
        updatedStudent = roster[existingIdx];
      } else {
        // Walk-in student registration
        updatedStudent = {
          id: `S_MOB_${Date.now()}`,
          courseId: targetCourseId,
          name: studentName.trim(),
          company: studentCompany.trim() || '일반 참석자',
          status: 'ATTENDED',
          checked_at: nowStr,
          ip_address: '192.168.1.18',
          device_info: 'Mobile Browser (QR OTP Scan)'
        };
        roster.push(updatedStudent);
      }

      // Save to localStorage & Firestore
      localStorage.setItem('aida:academy_students', JSON.stringify(roster));
      await fbSet("aida:academy_students_v1", roster);
      
      // Trigger attendee count recalculation inside parent education list
      let eduList = await fbGet("aida:academy_educations_v1").catch(() => null);
      if (!eduList || eduList.length === 0) {
        const savedEdu = localStorage.getItem('aida:academy_educations');
        eduList = savedEdu ? JSON.parse(savedEdu) : [];
      }

      if (eduList.length > 0) {
        const updatedEduList = eduList.map(edu => {
          if (String(edu.id) === String(targetCourseId)) {
            const count = roster.filter(s => String(s.courseId) === String(targetCourseId) && (s.status === 'ATTENDED' || s.status === 'LATE')).length;
            return { ...edu, attendee_count: count };
          }
          return edu;
        });
        localStorage.setItem('aida:academy_educations', JSON.stringify(updatedEduList));
        await fbSet("aida:academy_educations_v1", updatedEduList);
      }

      setCheckedStudent(updatedStudent);
      setCheckinSuccess(true);
    } catch (err) {
      console.error(err);
      alert("출석 체크 중 오류가 발생했습니다.");
    }
  };

  // Styling
  const containerStyle = {
    maxWidth: "480px",
    margin: "0 auto",
    padding: "32px 16px",
    boxSizing: "border-box",
    fontFamily: "var(--sans)",
    background: "var(--canvas)",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  };

  const cardStyle = {
    background: "var(--surface-card)",
    border: "1px solid var(--hairline-strong)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)"
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--body)",
    marginBottom: "6px"
  };

  const inpStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid var(--hairline-strong)",
    borderRadius: "8px",
    fontSize: "14px",
    color: "var(--ink)",
    background: "var(--canvas-soft)",
    boxSizing: "border-box",
    outline: "none",
    marginBottom: "16px"
  };

  const btnStyle = {
    width: "100%",
    padding: "14px",
    background: "var(--primary)",
    color: "var(--on-primary)",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(13, 116, 206, 0.2)"
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        
        {/* Header Logo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <span style={{ fontSize: "36px" }}>⚡</span>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)", margin: "8px 0 4px 0" }}>AIDA OASIS</h2>
          <span style={{ fontSize: "13px", color: "var(--body)" }}>오케스트로 아카데미 모바일 출석부</span>
        </div>

        {!checkinSuccess ? (
          <form onSubmit={handleCheckin}>
            
            {/* Select Course */}
            <div>
              <label style={labelStyle}>출석 체크할 교육 과정 *</label>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                style={{ ...inpStyle, background: "var(--canvas)" }}
                required
              >
                <option value="" disabled>-- 과정 선택 --</option>
                {educations.map(edu => (
                  <option key={edu.id} value={edu.id}>
                    [{edu.status === 'PROGRESS' ? "진행중" : "대기"}] {edu.course_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Name */}
            <div>
              <label style={labelStyle}>본인 성명 *</label>
              <input
                type="text"
                placeholder="홍길동"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                style={inpStyle}
                required
              />
            </div>

            {/* Student Company */}
            <div>
              <label style={labelStyle}>소속 회사명 (선택)</label>
              <input
                type="text"
                placeholder="오케스트로"
                value={studentCompany}
                onChange={e => setStudentCompany(e.target.value)}
                style={inpStyle}
              />
            </div>

            {/* Submit Button */}
            <button type="submit" style={btnStyle}>
              출석체크 완료하기
            </button>
            
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.1)",
              color: "var(--green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              margin: "0 auto 16px auto"
            }}>
              ✓
            </div>
            
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0" }}>출석 완료!</h3>
            <p style={{ fontSize: "14px", color: "var(--body)", lineHeight: "1.5", margin: "0 0 24px 0" }}>
              <strong>{checkedStudent?.name}</strong>님의 출석 정보가 정상적으로 등록되었습니다.
            </p>

            <div style={{ background: "var(--canvas-soft)", padding: "16px", borderRadius: "8px", border: "1px solid var(--hairline)", textAlign: "left", marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>• 완료 시간: {checkedStudent?.checked_at}</div>
              <div style={{ fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>• 소속: {checkedStudent?.company}</div>
              <div style={{ fontSize: "12px", color: "var(--body)" }}>• IP 주소: {checkedStudent?.ip_address}</div>
            </div>

            <button 
              onClick={() => {
                setCheckinSuccess(false);
                setStudentName("");
                setStudentCompany("");
              }}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--canvas)",
                border: "1px solid var(--hairline-strong)",
                color: "var(--ink)",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: "8px"
              }}
            >
              추가 출석체크 하기
            </button>

            {onBack && (
              <button 
                onClick={onBack}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "none",
                  border: "none",
                  color: "var(--body)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                메인 홈으로 가기
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
