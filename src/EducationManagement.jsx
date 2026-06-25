import React, { useState, useEffect, useRef } from 'react';
import { fbGet, fbSet } from './firebaseStore';

// Preset default options
const defaultCourseNames = [
  "고객 대상 CONTRABASS 소개 및 기능 교육",
  "사내 임직원 대상 OpenStack 신규 기능 핵심 과정",
  "파트너 기술 엔지니어 대상 AIDA 솔루션 아키텍트 교육"
];

// Seed initial education list
const initialEducations = [
  {
    id: 1,
    course_name: "고객 대상 CONTRABASS 소개 및 기능 교육",
    status: "FINISHED",
    instructor: "김윤형",
    target_aud: "고객사",
    onsite_customer: "한국아이티",
    start_date: "2026-04-14",
    end_date: "2026-04-14",
    time_range: "10:00~18:00",
    total_hours: 8,
    job_type: "시스템 엔지니어",
    location: "아카데미 교육장",
    topic: "CONTRABASS 소개 및 기능 교육",
    method: "이론+실습",
    product_version: "CONTRABASS 3.0.4",
    content: "CONTRABASS 플랫폼 활용법 및 운영 시나리오",
    attendee_count: 2, // will be auto-synced based on S001, S002, S003
    prep_hours: 2,
    run_hours: 6,
    sat_instructor: 4.50,
    sat_course: 4.20,
    sat_overall: 4.25,
    log_url: "https://link-to-log.com/1"
  },
  {
    id: 2,
    course_name: "사내 임직원 대상 OpenStack 신규 기능 핵심 과정",
    status: "BEFORE",
    instructor: "이지안",
    target_aud: "임직원",
    onsite_customer: "",
    start_date: "2026-07-10",
    end_date: "2026-07-12",
    time_range: "13:00~18:00",
    total_hours: 15,
    job_type: "클라우드 개발자",
    location: "여의도 파크원 43층 대회의실",
    topic: "OpenStack Antelope 신규 기능 분석",
    method: "실습",
    product_version: "OpenStack Antelope",
    content: "Antelope 버전 릴리즈 노트 분석 및 사내 프라이빗 클라우드 적용 검토",
    attendee_count: 0,
    prep_hours: 0,
    run_hours: 0,
    sat_instructor: 0,
    sat_course: 0,
    sat_overall: 0,
    log_url: ""
  },
  {
    id: 3,
    course_name: "파트너 기술 엔지니어 대상 AIDA 솔루션 아키텍트 교육",
    status: "PROGRESS",
    instructor: "최우성",
    target_aud: "파트너사",
    onsite_customer: "",
    start_date: "2026-06-23",
    end_date: "2026-06-25",
    time_range: "09:30~17:30",
    total_hours: 24,
    job_type: "기술 지원 아키텍트",
    location: "비대면 실시간 (Zoom)",
    topic: "AIDA 제품군 설계 및 연동 아키텍처",
    method: "이론+실습",
    product_version: "AIDA OASIS v2.1",
    content: "AIDA OASIS 솔루션의 고가용성 구조 설계 및 장애 상황 트러블슈팅 세션",
    attendee_count: 0,
    prep_hours: 0,
    run_hours: 0,
    sat_instructor: 0,
    sat_course: 0,
    sat_overall: 0,
    log_url: ""
  }
];

// Seed initial student list associated with courses
const initialStudents = [
  { id: 'S001', courseId: 1, name: '홍길동', company: '삼성디스플레이', status: 'ATTENDED', checked_at: '2026-06-24 09:45:12', ip_address: '192.168.1.102', device_info: 'Mobile Safari / iOS' },
  { id: 'S002', courseId: 1, name: '이순신', company: 'SK하이닉스', status: 'ATTENDED', checked_at: '2026-06-24 09:52:30', ip_address: '192.168.1.57', device_info: 'Chrome Mobile / Android' },
  { id: 'S003', courseId: 1, name: '강감찬', company: '오케스트로 파트너A', status: 'ABSENT', checked_at: '-', ip_address: '-', device_info: '-' },
  
  { id: 'S004', courseId: 2, name: '김유신', company: '오케스트로', status: 'ABSENT', checked_at: '-', ip_address: '-', device_info: '-' },
  { id: 'S005', courseId: 2, name: '을지문덕', company: '네이버 클라우드', status: 'ABSENT', checked_at: '-', ip_address: '-', device_info: '-' },
  
  { id: 'S006', courseId: 3, name: '장보고', company: '오케스트로 파트너B', status: 'LATE', checked_at: '2026-06-24 10:15:00', ip_address: '172.16.2.34', device_info: 'Samsung Internet / Android' },
  { id: 'S007', courseId: 3, name: '대조영', company: '오케스트로', status: 'ATTENDED', checked_at: '2026-06-24 09:32:11', ip_address: '172.16.2.19', device_info: 'Chrome / macOS' }
];

// Helper to calculate status based on start/end dates
const calculateStatus = (startDate, endDate) => {
  if (!startDate) return "BEFORE";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = endDate ? new Date(endDate) : start;
  end.setHours(23, 59, 59, 999);
  
  if (today.getTime() < start.getTime()) {
    return "BEFORE";
  } else if (today.getTime() >= start.getTime() && today.getTime() <= end.getTime()) {
    return "PROGRESS";
  } else {
    return "FINISHED";
  }
};

export default function EducationManagement({ defaultMenu = 'EDU' }) {
  const [currentMenu, setCurrentMenu] = useState(defaultMenu); // 'EDU' (교육과정) 또는 'ATT' (출석정보)

  useEffect(() => {
    setCurrentMenu(defaultMenu);
  }, [defaultMenu]);
  
  const [lmsCourses, setLmsCourses] = useState([]);

  // States loaded from localStorage / initial seeds
  const [educations, setEducations] = useState(() => {
    try {
      const saved = localStorage.getItem('aida:academy_educations');
      const rawList = saved ? JSON.parse(saved) : initialEducations;
      return rawList.map(item => ({
        ...item,
        status: calculateStatus(item.start_date, item.end_date)
      }));
    } catch {
      return initialEducations;
    }
  });

  const [students, setStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('aida:academy_students');
      return saved ? JSON.parse(saved) : initialStudents;
    } catch {
      return initialStudents;
    }
  });

  const [instructors, setInstructors] = useState(() => {
    try {
      const saved = localStorage.getItem('aida:academy_instructors');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter(name => name !== "이지안");
      }
      return ["김윤형", "최우성"];
    } catch {
      return ["김윤형", "최우성"];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aida:academy_instructors', JSON.stringify(instructors));
    } catch (e) {
      console.error("Failed to save instructors", e);
    }
  }, [instructors]);

  const handleAddInstructor = () => {
    const name = prompt("새로운 담당강사 이름을 입력해 주세요:");
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (instructors.includes(trimmed)) {
        alert("이미 존재하는 강사 이름입니다.");
        return;
      }
      setInstructors(prev => [...prev, trimmed]);
      setSelectedEdu(prev => ({ ...prev, instructor: trimmed }));
      alert(`"${trimmed}" 강사가 추가되었습니다.`);
    }
  };

  // Main UI states
  const [filter, setFilter] = useState('ALL'); // ALL, BEFORE, PROGRESS, FINISHED
  const [selectedEdu, setSelectedEdu] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [courseSelectVal, setCourseSelectVal] = useState("");

  // Attendance tab states
  const [selectedCourseId, setSelectedCourseId] = useState(1);

  // Secure QR OTP timer states
  const [otpToken, setOtpToken] = useState("AIDA-OTP-7A9F2E");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  // Local storage synchronization
  useEffect(() => {
    try {
      localStorage.setItem('aida:academy_educations', JSON.stringify(educations));
    } catch (e) {
      console.error("Failed to save educations", e);
    }
  }, [educations]);

  useEffect(() => {
    try {
      localStorage.setItem('aida:academy_students', JSON.stringify(students));
    } catch (e) {
      console.error("Failed to save students", e);
    }
  }, [students]);

  // Real-time synchronization effect
  useEffect(() => {
    const syncData = async () => {
      try {
        const remoteLms = await fbGet("aida:edu_courses_v1").catch(() => []);
        if (remoteLms && remoteLms.length > 0) {
          setLmsCourses(remoteLms);
        }

        const remoteAcademyEdus = await fbGet("aida:academy_educations_v1").catch(() => []);
        const savedLocalStr = localStorage.getItem('aida:academy_educations');
        const localEdus = savedLocalStr ? JSON.parse(savedLocalStr) : initialEducations;
        
        const sourceCourses = (remoteLms && remoteLms.length > 0) ? remoteLms : localEdus.map(e => ({
          id: e.id,
          name: e.course_name,
          target: e.target_aud === "고객사" ? "Customer" : (e.target_aud === "파트너사" ? "Partner" : "Other"),
          dateStart: e.start_date,
          dateEnd: e.end_date,
          time: e.time_range,
          location: e.location,
          curriculum: e.content
        }));

        const backofficeDetails = (remoteAcademyEdus && remoteAcademyEdus.length > 0) ? remoteAcademyEdus : localEdus;

        const reconciled = sourceCourses.map(course => {
          const detail = backofficeDetails.find(d => d.id === course.id || d.course_name === course.name);
          const targetAudMap = {
            Customer: "고객사",
            Partner: "파트너사",
            Other: "임직원"
          };

          return {
            id: course.id,
            course_name: course.name,
            status: calculateStatus(course.dateStart, course.dateEnd || course.dateStart),
            instructor: detail ? detail.instructor : "김윤형",
            target_aud: targetAudMap[course.target] || "고객사",
            onsite_customer: detail ? detail.onsite_customer : "",
            start_date: course.dateStart,
            end_date: course.dateEnd || course.dateStart,
            time_range: course.time || "13:00~18:00",
            total_hours: detail ? detail.total_hours : 8,
            job_type: detail ? detail.job_type : "IT 직무",
            location: course.location || "아카데미 교육장",
            topic: course.name,
            method: course.teachingMethod || "이론+실습",
            product_version: course.name.split(" ")[0] || "CONTRABASS",
            content: course.curriculum || "",
            attendee_count: detail ? detail.attendee_count : 0,
            prep_hours: detail ? detail.prep_hours : 0,
            run_hours: detail ? detail.run_hours : 0,
            sat_instructor: detail ? detail.sat_instructor : 0.0,
            sat_course: detail ? detail.sat_course : 0.0,
            sat_overall: detail ? detail.sat_overall : 0.0,
            log_url: detail ? detail.log_url : ""
          };
        });

        setEducations(reconciled);
        localStorage.setItem('aida:academy_educations', JSON.stringify(reconciled));

        // Auto-focus progress (today's) course for attendance tab
        const activeToday = reconciled.find(e => e.status === 'PROGRESS');
        if (activeToday) {
          setSelectedCourseId(activeToday.id);
        } else if (reconciled.length > 0 && !reconciled.some(e => e.id === selectedCourseId)) {
          setSelectedCourseId(reconciled[0].id);
        }
      } catch (e) {
        console.error("Reconciliation error", e);
      }
    };

    syncData();
  }, [students]);

  // Sync attendee_count dynamically on mount or on student changes
  useEffect(() => {
    setEducations(prevEdu => 
      prevEdu.map(edu => {
        const attendedCount = students.filter(s => s.courseId === edu.id && (s.status === 'ATTENDED' || s.status === 'LATE')).length;
        if (edu.attendee_count !== attendedCount) {
          return { ...edu, attendee_count: attendedCount };
        }
        return edu;
      })
    );
  }, [students]);

  // Timer for security QR code (OTP)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Generate new mock OTP token on expire
          const randomHex = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
          setOtpToken(`AIDA-OTP-${randomHex}`);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeLeft = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredData = educations.filter(edu => {
    if (filter === 'ALL') return true;
    return edu.status === filter;
  });

  // Attendance statistics for dashboard
  const attendanceStats = (() => {
    const courseStudents = students.filter(s => s.courseId === Number(selectedCourseId));
    const attended = courseStudents.filter(s => s.status === 'ATTENDED').length;
    const late = courseStudents.filter(s => s.status === 'LATE').length;
    const absent = courseStudents.filter(s => s.status === 'ABSENT').length;
    return { total: courseStudents.length, attended, late, absent };
  })();

  const handleOpenModal = (edu, isNewFlag = false) => {
    setIsNew(isNewFlag);
    let initialObj;
    if (isNewFlag) {
      const todayStr = new Date().toISOString().slice(0, 10);
      initialObj = {
        id: Date.now(),
        course_name: "",
        status: calculateStatus(todayStr, todayStr),
        instructor: "",
        target_aud: "고객사",
        onsite_customer: "",
        start_date: todayStr,
        end_date: todayStr,
        time_range: "13:00~18:00",
        total_hours: 8,
        job_type: "IT 직무",
        location: "아카데미 교육장",
        topic: "",
        method: "이론+실습",
        product_version: "",
        content: "",
        attendee_count: 0,
        prep_hours: 0,
        run_hours: 0,
        sat_instructor: 0.0,
        sat_course: 0.0,
        sat_overall: 0.0,
        log_url: ""
      };
    } else {
      initialObj = { ...edu };
    }
    
    setSelectedEdu(initialObj);
    
    if (!initialObj.course_name) {
      setCourseSelectVal("");
    } else if (defaultCourseNames.includes(initialObj.course_name)) {
      setCourseSelectVal(initialObj.course_name);
    } else {
      setCourseSelectVal("custom");
    }

    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedEdu(prev => {
      const next = { ...prev, [name]: value };
      if (name === "start_date" || name === "end_date") {
        next.status = calculateStatus(next.start_date, next.end_date);
      }
      if (next.status !== "FINISHED") {
        next.attendee_count = 0;
        next.prep_hours = 0;
        next.run_hours = 0;
        next.sat_instructor = 0.0;
        next.sat_course = 0.0;
        next.sat_overall = 0.0;
        next.log_url = "";
      }
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedEdu.course_name.trim()) {
      alert("교육 과정명을 입력해 주세요.");
      return;
    }
    if (!selectedEdu.instructor.trim()) {
      alert("담당강사를 입력해 주세요.");
      return;
    }

    let updatedEdus = [];
    if (isNew) {
      updatedEdus = [selectedEdu, ...educations];
      setEducations(updatedEdus);
      
      // Auto-populate 3 mock students for new course
      const newCourseId = selectedEdu.id;
      const newMockStudents = [
        { id: `S${Date.now()}1`, courseId: newCourseId, name: '강석기', company: '오케스트로 임직원', status: 'ABSENT', checked_at: '-', ip_address: '-', device_info: '-' },
        { id: `S${Date.now()}2`, courseId: newCourseId, name: '윤하늘', company: '클라우드 파트너스', status: 'ABSENT', checked_at: '-', ip_address: '-', device_info: '-' },
        { id: `S${Date.now()}3`, courseId: newCourseId, name: '임수진', company: '한국오라클', status: 'ABSENT', checked_at: '-', ip_address: '-', device_info: '-' }
      ];
      setStudents(prev => [...prev, ...newMockStudents]);
    } else {
      updatedEdus = educations.map(item => item.id === selectedEdu.id ? selectedEdu : item);
      setEducations(updatedEdus);
    }

    // Save to Firestore databases
    try {
      await fbSet("aida:academy_educations_v1", updatedEdus);

      const lmsTargetMap = {
        "고객사": "Customer",
        "파트너사": "Partner",
        "임직원": "Other"
      };

      const newLmsCourses = updatedEdus.map(edu => ({
        id: edu.id,
        name: edu.course_name,
        target: lmsTargetMap[edu.target_aud] || "Customer",
        dateStart: edu.start_date,
        dateEnd: edu.end_date,
        time: edu.time_range,
        location: edu.location,
        status: "Available",
        curriculum: edu.content,
        teachingMethod: edu.method || "이론+실습"
      }));

      await fbSet("aida:edu_courses_v1", newLmsCourses);
    } catch (err) {
      console.error("Firestore save error", err);
    }

    setIsModalOpen(false);
    alert(isNew ? "새 교육 과정이 등록되었습니다." : "변경사항이 성공적으로 반영되었습니다.");
  };

  const handleDelete = async (id) => {
    if (window.confirm("이 교육 과정 데이터를 삭제하시겠습니까? (연동된 출석 명단도 삭제됩니다.)")) {
      const updatedEdus = educations.filter(item => item.id !== id);
      setEducations(updatedEdus);
      setStudents(prev => prev.filter(item => item.courseId !== id));

      try {
        await fbSet("aida:academy_educations_v1", updatedEdus);

        const lmsTargetMap = {
          "고객사": "Customer",
          "파트너사": "Partner",
          "임직원": "Other"
        };

        const newLmsCourses = updatedEdus.map(edu => ({
          id: edu.id,
          name: edu.course_name,
          target: lmsTargetMap[edu.target_aud] || "Customer",
          dateStart: edu.start_date,
          dateEnd: edu.end_date,
          time: edu.time_range,
          location: edu.location,
          status: "Available",
          curriculum: edu.content,
          teachingMethod: edu.method || "이론+실습"
        }));

        await fbSet("aida:edu_courses_v1", newLmsCourses);
      } catch (err) {
        console.error("Firestore delete error", err);
      }

      if (selectedEdu && selectedEdu.id === id) {
        setIsModalOpen(false);
      }
      alert("삭제되었습니다.");
    }
  };

  // Toggle student status manually
  const handleToggleStudentStatus = (studentId, nextStatus) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          status: nextStatus,
          checked_at: nextStatus === 'ABSENT' ? '-' : nowStr,
          ip_address: nextStatus === 'ABSENT' ? '-' : '192.168.1.25',
          device_info: nextStatus === 'ABSENT' ? '-' : 'Chrome / Windows (Admin force)'
        };
      }
      return s;
    }));
  };

  // Inline Style helpers
  const inpStyle = (extra = {}) => ({
    width: "100%",
    padding: "10px 14px",
    border: "1px solid var(--hairline-strong)",
    borderRadius: "var(--rounded-md)",
    fontSize: "14px",
    color: "var(--ink)",
    background: "var(--canvas)",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "var(--sans)",
    ...extra
  });

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--body)",
    marginBottom: "5px"
  };

  const shadow = "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)";
  const shadowLg = "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)";

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box", fontFamily: "var(--sans)" }}>
      
      {/* 주 메뉴 탭 전환 구조 */}
      <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid var(--hairline-strong)", marginBottom: "32px", paddingBottom: "12px" }}>
        <button 
          onClick={() => setCurrentMenu('EDU')} 
          style={{
            fontSize: "18px",
            fontWeight: 700,
            background: "none",
            border: "none",
            padding: "8px 16px",
            color: currentMenu === 'EDU' ? "var(--primary)" : "var(--body)",
            borderBottom: currentMenu === 'EDU' ? "3px solid var(--primary)" : "3px solid transparent",
            cursor: "pointer",
            marginBottom: "-15px"
          }}
        >
          📂 교육 과정 관리 (Parent)
        </button>
        <button 
          onClick={() => setCurrentMenu('ATT')} 
          style={{
            fontSize: "18px",
            fontWeight: 700,
            background: "none",
            border: "none",
            padding: "8px 16px",
            color: currentMenu === 'ATT' ? "var(--primary)" : "var(--body)",
            borderBottom: currentMenu === 'ATT' ? "3px solid var(--primary)" : "3px solid transparent",
            cursor: "pointer",
            marginBottom: "-15px"
          }}
        >
          ⏰ 실시간 출결 관리 (Child)
        </button>
      </div>

      {/* ───────────────── [1. 교육 과정 관리 메뉴] ───────────────── */}
      {currentMenu === 'EDU' && (
        <div>
          {/* Title Header Banner */}
          <div style={{ 
            background: "var(--surface-card)", 
            border: "1px solid var(--hairline-strong)", 
            borderRadius: "var(--rounded-lg)", 
            padding: "24px", 
            boxShadow: shadow,
            marginBottom: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: 600, color: "var(--ink)", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>🎓 아카데미 교육 과정 관리</h2>
              <span style={{ fontSize: "14px", color: "var(--body)" }}>AIDA OASIS 교육 과정의 비포(계획) & 애프터(실적) 데이터를 통합 관리합니다.</span>
            </div>
            <button 
              onClick={() => handleOpenModal(null, true)}
              style={{
                padding: "10px 20px",
                background: "var(--primary)",
                color: "var(--on-primary)",
                border: "none",
                borderRadius: "var(--rounded-md)",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s"
              }}
              onMouseOver={e => e.currentTarget.style.background = "var(--primary-active)"}
              onMouseOut={e => e.currentTarget.style.background = "var(--primary)"}
            >
              ➕ 신규 교육과정 개설
            </button>
          </div>

          {/* Filter Tabs Menu */}
          <div style={{ display: "flex", borderBottom: "2px solid var(--hairline-strong)", marginBottom: "20px", gap: "8px" }}>
            {[
              { key: 'ALL', label: '전체보기' },
              { key: 'BEFORE', label: '교육 대기 (BEFORE)' },
              { key: 'PROGRESS', label: '교육 중 (PROGRESS)' },
              { key: 'FINISHED', label: '교육 종료 (FINISHED)' }
            ].map(tab => {
              const isActive = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    padding: "12px 20px",
                    background: "none",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: isActive ? "var(--primary)" : "var(--body)",
                    borderBottom: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                    cursor: "pointer",
                    marginBottom: "-2px"
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Table list */}
          <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", overflow: "hidden", background: "var(--surface-card)", boxShadow: shadow }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "var(--canvas-soft)", borderBottom: "1.5px solid var(--hairline-strong)", textAlign: "left" }}>
                  <th style={{ padding: "16px 20px", width: "110px", color: "var(--ink)", fontWeight: 600 }}>상태</th>
                  <th style={{ padding: "16px 20px", color: "var(--ink)", fontWeight: 600 }}>교육 과정명</th>
                  <th style={{ padding: "16px 20px", width: "120px", color: "var(--ink)", fontWeight: 600 }}>강사</th>
                  <th style={{ padding: "16px 20px", width: "180px", color: "var(--ink)", fontWeight: 600 }}>일정</th>
                  <th style={{ padding: "16px 20px", width: "160px", color: "var(--ink)", fontWeight: 600 }}>교육 대상</th>
                  <th style={{ padding: "16px 20px", width: "90px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>교육일지</th>
                  <th style={{ padding: "16px 20px", width: "100px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>참석인원</th>
                  <th style={{ padding: "16px 20px", width: "110px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>만족도 (전체)</th>
                  <th style={{ padding: "16px 20px", width: "140px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>교육 과정 데이터가 존재하지 않습니다.</td>
                  </tr>
                ) : (
                  filteredData.map(edu => {
                    const statusLabel = edu.status === "FINISHED" ? "교육 종료" : (edu.status === "PROGRESS" ? "교육 중" : "교육 대기");
                    const statusBg = edu.status === "FINISHED" 
                      ? "rgba(16, 185, 129, 0.1)" 
                      : (edu.status === "PROGRESS" ? "rgba(59, 130, 246, 0.1)" : "rgba(245, 158, 11, 0.1)");
                    const statusColor = edu.status === "FINISHED" 
                      ? "#10B981" 
                      : (edu.status === "PROGRESS" ? "#3B82F6" : "#D97706");
                    return (
                      <tr key={edu.id} style={{ borderBottom: "1px solid var(--hairline)", transition: "background 0.15s" }}>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "var(--rounded-pill)",
                            background: statusBg,
                            color: statusColor
                          }}>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", fontWeight: 600, color: "var(--ink)" }}>{edu.course_name}</td>
                        <td style={{ padding: "16px 20px", color: "var(--body)" }}>{edu.instructor}</td>
                        <td style={{ padding: "16px 20px", color: "var(--body)" }}>
                          {edu.start_date} {edu.end_date && edu.end_date !== edu.start_date ? `~ ${edu.end_date}` : ""}
                        </td>
                        <td style={{ padding: "16px 20px", color: "var(--body)" }}>
                          {edu.target_aud} {edu.onsite_customer ? `(${edu.onsite_customer})` : ""}
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                          {edu.log_url ? (
                            <a 
                              href={edu.log_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{
                                color: "var(--primary)",
                                textDecoration: "underline",
                                fontWeight: 600,
                                fontSize: "13px"
                              }}
                            >
                              🔗 일지
                            </a>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: 600 }}>
                          <span 
                            onClick={() => {
                              setSelectedCourseId(edu.id);
                              setCurrentMenu('ATT');
                            }}
                            style={{ color: "var(--primary)", cursor: "pointer", textDecoration: "underline" }}
                            title="출석부로 이동하여 출결관리"
                          >
                            {edu.attendee_count} 명
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: 700, color: "var(--primary)" }}>
                          {edu.status === "FINISHED" && edu.sat_overall > 0 ? `${edu.sat_overall} / 5` : "-"}
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                            <button 
                              onClick={() => handleOpenModal(edu, false)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--primary)",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: "13px"
                              }}
                            >
                              조회/수정
                            </button>
                            <button 
                              onClick={() => handleDelete(edu.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--red)",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: "13px"
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────── [2. 실시간 출결 관리 메뉴] ───────────────── */}
      {currentMenu === 'ATT' && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "24px", alignItems: "start" }}>
            
            {/* Left Box: Attendance List & Select Course */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ background: "var(--surface-card)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "20px", boxShadow: shadow }}>
                <label style={labelStyle}>교육 과정 선택</label>
                <select
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(Number(e.target.value))}
                  style={inpStyle({ background: "var(--canvas)", cursor: "pointer", fontWeight: 600, fontSize: "15px" })}
                >
                  {educations.map(edu => (
                    <option key={edu.id} value={edu.id}>{edu.course_name}</option>
                  ))}
                </select>
              </div>

              {/* Attendance Statistics Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                {[
                  { label: "총 명단", value: `${attendanceStats.total}명`, color: "var(--ink)", bg: "var(--canvas-soft)" },
                  { label: "출석", value: `${attendanceStats.attended}명`, color: "var(--green)", bg: "rgba(16, 185, 129, 0.05)" },
                  { label: "지각", value: `${attendanceStats.late}명`, color: "var(--primary)", bg: "rgba(59, 130, 246, 0.05)" },
                  { label: "결석", value: `${attendanceStats.absent}명`, color: "var(--red)", bg: "rgba(239, 68, 68, 0.05)" }
                ].map((card, idx) => (
                  <div key={idx} style={{ background: card.bg, padding: "16px", borderRadius: "8px", border: "1px solid var(--hairline-strong)", textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "var(--body)", fontWeight: 600, marginBottom: "4px" }}>{card.label}</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: card.color }}>{card.value}</div>
                  </div>
                ))}
              </div>

              {/* Live Student List Table */}
              <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", overflow: "hidden", background: "var(--surface-card)", boxShadow: shadow }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--hairline-strong)", background: "var(--canvas-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>📋 출결 관리 명단</h4>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>* 상태 클릭 시 즉시 변경 & 인원수 동기화</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ background: "var(--canvas-soft)", borderBottom: "1px solid var(--hairline-strong)", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>수강생 ID</th>
                      <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>이름</th>
                      <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>소속사</th>
                      <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>체크인 시간</th>
                      <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>IP/기기 정보</th>
                      <th style={{ padding: "12px 16px", width: "180px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>수동 출결제어</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter(s => s.courseId === Number(selectedCourseId)).length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>등록된 수강생이 없습니다.</td>
                      </tr>
                    ) : (
                      students.filter(s => s.courseId === Number(selectedCourseId)).map(s => {
                        const statusColors = {
                          ATTENDED: { label: "출석", bg: "rgba(16, 185, 129, 0.1)", text: "#10B981" },
                          LATE: { label: "지각", bg: "rgba(59, 130, 246, 0.1)", text: "#3B82F6" },
                          ABSENT: { label: "결석", bg: "rgba(239, 68, 68, 0.1)", text: "#EF4444" }
                        };
                        const colorSet = statusColors[s.status] || { label: "미결", bg: "#f3f4f6", text: "#374151" };
                        return (
                          <tr key={s.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                            <td style={{ padding: "12px 16px", fontWeight: "bold" }}>{s.id}</td>
                            <td style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>{s.name}</td>
                            <td style={{ padding: "12px 16px", color: "var(--body)" }}>{s.company}</td>
                            <td style={{ padding: "12px 16px", color: "var(--body)" }}>{s.checked_at}</td>
                            <td style={{ padding: "12px 16px", color: "var(--muted)", fontSize: "11px", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={`${s.ip_address || '-'} / ${s.device_info || '-'}`}>
                              {s.ip_address !== "-" ? `${s.ip_address} (${s.device_info?.split(" ")[0]})` : "-"}
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                {["ATTENDED", "LATE", "ABSENT"].map(st => {
                                  const labelText = st === "ATTENDED" ? "출석" : (st === "LATE" ? "지각" : "결석");
                                  const isActive = s.status === st;
                                  const btnBg = st === "ATTENDED" ? "var(--green)" : (st === "LATE" ? "var(--primary)" : "var(--red)");
                                  return (
                                    <button
                                      key={st}
                                      onClick={() => handleToggleStudentStatus(s.id, st)}
                                      style={{
                                        padding: "4px 8px",
                                        background: isActive ? btnBg : "var(--canvas)",
                                        border: `1px solid ${isActive ? "transparent" : "var(--hairline-strong)"}`,
                                        color: isActive ? "white" : "var(--ink)",
                                        borderRadius: "4px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                      }}
                                    >
                                      {labelText}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Box: Secure QR Generator */}
            <div style={{ background: "var(--surface-card)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "24px", boxShadow: shadow, textAlign: "center" }}>
              <h4 style={{ margin: "0 0 8px 0", fontWeight: 700, fontSize: "16px", color: "var(--ink)" }}>🛡️ 아카데미 수강생 출석 체크 QR</h4>
              <p style={{ fontSize: "12.5px", color: "var(--body)", margin: "0 0 20px 0" }}>수강생이 모바일로 스캔하여 즉시 출석할 수 있는 영구 QR 코드입니다.</p>
              
              {/* Real QR Code Render Box */}
              <div style={{ 
                margin: "0 auto 20px auto", 
                width: "200px", 
                height: "200px", 
                background: "white", 
                border: "2px solid var(--hairline-strong)", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                padding: "16px",
                boxSizing: "border-box"
              }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=168x168&data=${encodeURIComponent(`${window.location.origin}/attendance/checkin`)}`}
                  alt="AIDA OASIS Attendance Check-in QR" 
                  style={{ width: "168px", height: "168px", objectFit: "contain" }}
                />
              </div>

              {/* Attendance page URL info */}
              <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline)", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                <span style={{ fontSize: "11px", color: "var(--body)", display: "block", marginBottom: "4px" }}>출석 체크 모바일 페이지 링크</span>
                <a 
                  href={`${window.location.origin}/attendance/checkin`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary)", textDecoration: "underline", wordBreak: "break-all" }}
                >
                  {window.location.origin}/attendance/checkin
                </a>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/attendance/checkin`);
                  alert("출석 체크 페이지 링크가 클립보드에 복사되었습니다!");
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--canvas)",
                  border: "1px solid var(--hairline-strong)",
                  color: "var(--ink)",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                📋 출석 링크 주소 복사
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail/CRUD Modal dialog */}
      {isModalOpen && selectedEdu && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{
            background: "var(--surface-card)",
            borderRadius: "var(--rounded-lg)",
            border: "1px solid var(--hairline-strong)",
            padding: "24px",
            width: "100%",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: shadowLg,
            boxSizing: "border-box"
          }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline-strong)", paddingBottom: "12px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                {isNew ? "➕ 신규 교육 과정 개설" : "📝 교육 과정 상세정보 설정"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--body)", fontSize: "20px", cursor: "pointer", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Part 1: Before Education */}
              <div>
                <h4 style={{ 
                  fontSize: "13px", 
                  fontWeight: 700, 
                  color: "var(--primary)", 
                  background: "rgba(13, 116, 206, 0.08)", 
                  padding: "6px 12px", 
                  borderRadius: "6px",
                  display: "inline-block",
                  marginBottom: "12px",
                  marginTop: 0
                }}>
                  1. 교육 전 작성 항목 (과정 계획 및 기본 정보)
                </h4>
                
                <div style={{ 
                  background: "var(--canvas-soft)", 
                  border: "1px solid var(--hairline-strong)", 
                  borderRadius: "8px", 
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>교육 과정명 *</label>
                      <select
                        value={courseSelectVal}
                        onChange={e => {
                          const val = e.target.value;
                          setCourseSelectVal(val);
                          if (val !== "custom") {
                            const matched = lmsCourses.find(c => c.name === val);
                            setSelectedEdu(prev => {
                              const targetAudMap = {
                                Customer: "고객사",
                                Partner: "파트너사",
                                Other: "임직원"
                              };
                              return {
                                ...prev,
                                course_name: val,
                                target_aud: matched ? (targetAudMap[matched.target] || "고객사") : prev.target_aud,
                                start_date: matched ? matched.dateStart : prev.start_date,
                                end_date: matched ? (matched.dateEnd || matched.dateStart) : prev.end_date,
                                time_range: matched ? (matched.time || "13:00~18:00") : prev.time_range,
                                location: matched ? (matched.location || "아카데미 교육장") : prev.location,
                                content: matched ? (matched.curriculum || "") : prev.content
                              };
                            });
                          } else {
                            setSelectedEdu(prev => ({ ...prev, course_name: "" }));
                          }
                        }}
                        style={inpStyle({ background: "var(--canvas)", cursor: "pointer", marginBottom: courseSelectVal === "custom" ? "8px" : "0" })}
                      >
                        <option value="" disabled>-- 교육 과정명 선택 --</option>
                        {lmsCourses.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                        <option value="custom">직접 입력...</option>
                      </select>
                      
                      {courseSelectVal === "custom" && (
                        <input 
                          type="text" 
                          name="course_name" 
                          placeholder="교육 과정명을 직접 입력하세요"
                          value={selectedEdu.course_name} 
                          onChange={handleInputChange} 
                          style={inpStyle()} 
                          required 
                        />
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>교육 상태 (날짜 기준 자동 계산) *</label>
                      <input 
                        type="text" 
                        value={selectedEdu.status === "FINISHED" ? "교육 종료 (FINISHED)" : (selectedEdu.status === "PROGRESS" ? "교육 중 (PROGRESS)" : "교육 대기 (BEFORE)")} 
                        style={inpStyle({ background: "var(--canvas-soft)", fontWeight: 700, color: "var(--primary)", border: "1px solid var(--hairline-strong)" })}
                        disabled
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>담당강사 *</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <select 
                          name="instructor" 
                          value={selectedEdu.instructor} 
                          onChange={handleInputChange} 
                          style={inpStyle({ background: "var(--canvas)", cursor: "pointer", flex: 1 })}
                          required 
                        >
                          <option value="" disabled>-- 강사 선택 --</option>
                          {instructors.map(inst => (
                            <option key={inst} value={inst}>{inst}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddInstructor}
                          style={{
                            padding: "0 12px",
                            background: "var(--canvas)",
                            border: "1px solid var(--hairline-strong)",
                            borderRadius: "var(--rounded-md)",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          추가하기
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>교육 대상 *</label>
                      <select 
                        name="target_aud" 
                        value={selectedEdu.target_aud} 
                        onChange={handleInputChange} 
                        style={inpStyle({ background: "var(--canvas)", cursor: "pointer" })}
                      >
                        <option value="고객사">고객사</option>
                        <option value="파트너사">파트너사</option>
                        <option value="임직원">임직원</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>온사이트 고객사명 (선택)</label>
                      <input 
                        type="text" 
                        name="onsite_customer" 
                        value={selectedEdu.onsite_customer} 
                        onChange={handleInputChange} 
                        placeholder="예) 한국아이티"
                        style={inpStyle()} 
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>교육 시작일정 *</label>
                      <input 
                        type="date" 
                        name="start_date" 
                        value={selectedEdu.start_date} 
                        onChange={handleInputChange} 
                        style={inpStyle()} 
                        required 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>교육 종료일정 *</label>
                      <input 
                        type="date" 
                        name="end_date" 
                        value={selectedEdu.end_date} 
                        onChange={handleInputChange} 
                        style={inpStyle()} 
                        required 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>교육 시간대 *</label>
                      <input 
                        type="text" 
                        name="time_range" 
                        value={selectedEdu.time_range} 
                        onChange={handleInputChange} 
                        placeholder="예) 10:00~18:00"
                        style={inpStyle()} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>총 교육시간 (시간) *</label>
                      <input 
                        type="number" 
                        name="total_hours" 
                        value={selectedEdu.total_hours} 
                        onChange={handleInputChange} 
                        style={inpStyle()} 
                        required 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>대상 직무 *</label>
                      <input 
                        type="text" 
                        name="job_type" 
                        value={selectedEdu.job_type} 
                        onChange={handleInputChange} 
                        placeholder="예) 시스템 엔지니어"
                        style={inpStyle()} 
                        required 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>장소 *</label>
                      <input 
                        type="text" 
                        name="location" 
                        value={selectedEdu.location} 
                        onChange={handleInputChange} 
                        placeholder="예) 아카데미 교육장"
                        style={inpStyle()} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>주제 *</label>
                      <input 
                        type="text" 
                        name="topic" 
                        value={selectedEdu.topic} 
                        onChange={handleInputChange} 
                        placeholder="교육 주제"
                        style={inpStyle()} 
                        required 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>방식 *</label>
                      <select 
                        name="method" 
                        value={selectedEdu.method} 
                        onChange={handleInputChange} 
                        style={inpStyle({ background: "var(--canvas)", cursor: "pointer" })}
                      >
                        <option value="이론">이론</option>
                        <option value="실습">실습</option>
                        <option value="이론+실습">이론+실습</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>제품 버전 *</label>
                      <input 
                        type="text" 
                        name="product_version" 
                        value={selectedEdu.product_version} 
                        onChange={handleInputChange} 
                        placeholder="예) CONTRABASS v3"
                        style={inpStyle()} 
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>세부 내용</label>
                    <textarea 
                      name="content" 
                      value={selectedEdu.content} 
                      onChange={handleInputChange} 
                      placeholder="강의 세부 설명 및 커리큘럼 계획 기입"
                      style={inpStyle({ minHeight: "80px", resize: "vertical" })} 
                    />
                  </div>
                </div>
              </div>

              {/* Part 2: After Education */}
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ 
                    fontSize: "13px", 
                    fontWeight: 700, 
                    color: "var(--green)", 
                    background: "rgba(16, 185, 129, 0.08)", 
                    padding: "6px 12px", 
                    borderRadius: "6px",
                    margin: 0
                  }}>
                    2. 교육 후 작성 항목 (실적 및 피드백 지표)
                  </h4>
                  {selectedEdu.status !== 'FINISHED' && (
                    <span style={{ fontSize: "11px", color: "var(--amber)", fontWeight: 600, background: "rgba(245, 158, 11, 0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                      ⚠️ 교육종료 상태에서만 입력 활성화
                    </span>
                  )}
                </div>
                
                <div style={{ 
                  background: selectedEdu.status === 'FINISHED' ? "rgba(16, 185, 129, 0.02)" : "var(--canvas-soft)", 
                  border: `1px solid ${selectedEdu.status === 'FINISHED' ? "rgba(16, 185, 129, 0.25)" : "var(--hairline-strong)"}`, 
                  opacity: selectedEdu.status === 'FINISHED' ? 1 : 0.6,
                  borderRadius: "8px", 
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  transition: "all 0.2s"
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>실제 참석 인원 (명 - 실시간 출결로 자동 카운트됨)</label>
                      <input 
                        type="number" 
                        name="attendee_count" 
                        value={selectedEdu.attendee_count} 
                        onChange={handleInputChange} 
                        disabled
                        style={inpStyle({ background: "var(--canvas-soft)", fontWeight: 700, color: "var(--green)" })} 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>교육 준비 시간 (Hr)</label>
                      <input 
                        type="number" 
                        name="prep_hours" 
                        value={selectedEdu.prep_hours} 
                        onChange={handleInputChange} 
                        disabled={selectedEdu.status !== 'FINISHED'} 
                        placeholder={selectedEdu.status !== 'FINISHED' ? "잠김" : "시간"}
                        style={inpStyle({ background: selectedEdu.status !== 'FINISHED' ? "var(--canvas-soft)" : "var(--canvas)" })} 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>실제 교육 실행 시간 (Hr)</label>
                      <input 
                        type="number" 
                        name="run_hours" 
                        value={selectedEdu.run_hours} 
                        onChange={handleInputChange} 
                        disabled={selectedEdu.status !== 'FINISHED'} 
                        placeholder={selectedEdu.status !== 'FINISHED' ? "잠김" : "시간"}
                        style={inpStyle({ background: selectedEdu.status !== 'FINISHED' ? "var(--canvas-soft)" : "var(--canvas)" })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>강사 만족도 점수 (5점 만점)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="5"
                        name="sat_instructor" 
                        value={selectedEdu.sat_instructor || ''} 
                        onChange={handleInputChange} 
                        disabled={selectedEdu.status !== 'FINISHED'} 
                        placeholder={selectedEdu.status !== 'FINISHED' ? "잠김" : "0.00~5.00"}
                        style={inpStyle({ background: selectedEdu.status !== 'FINISHED' ? "var(--canvas-soft)" : "var(--canvas)" })} 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>교육 만족도 점수 (5점 만점)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="5"
                        name="sat_course" 
                        value={selectedEdu.sat_course || ''} 
                        onChange={handleInputChange} 
                        disabled={selectedEdu.status !== 'FINISHED'} 
                        placeholder={selectedEdu.status !== 'FINISHED' ? "잠김" : "0.00~5.00"}
                        style={inpStyle({ background: selectedEdu.status !== 'FINISHED' ? "var(--canvas-soft)" : "var(--canvas)" })} 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>전체 만족도 점수 (5점 만점)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="5"
                        name="sat_overall" 
                        value={selectedEdu.sat_overall || ''} 
                        onChange={handleInputChange} 
                        disabled={selectedEdu.status !== 'FINISHED'} 
                        placeholder={selectedEdu.status !== 'FINISHED' ? "잠김" : "0.00~5.00"}
                        style={inpStyle({ background: selectedEdu.status !== 'FINISHED' ? "var(--canvas-soft)" : "var(--canvas)" })} 
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>교육일지 URL 링크</label>
                    <input 
                      type="url" 
                      name="log_url" 
                      value={selectedEdu.log_url || ''} 
                      onChange={handleInputChange} 
                      disabled={selectedEdu.status !== 'FINISHED'} 
                      placeholder={selectedEdu.status !== 'FINISHED' ? "잠김" : "https://example.com/log"}
                      style={inpStyle({ background: selectedEdu.status !== 'FINISHED' ? "var(--canvas-soft)" : "var(--canvas)" })} 
                    />
                    {selectedEdu.status === 'FINISHED' && selectedEdu.log_url && (
                      <div style={{ marginTop: "6px" }}>
                        <a 
                          href={selectedEdu.log_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ fontSize: "12px", color: "var(--primary)", textDecoration: "underline", fontWeight: 600 }}
                        >
                          🔗 입력한 링크 바로가기 ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--hairline-strong)", paddingTop: "20px" }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  style={{
                    padding: "10px 20px",
                    background: "var(--canvas)",
                    border: "1px solid var(--hairline-strong)",
                    color: "var(--ink)",
                    borderRadius: "var(--rounded-md)",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  style={{
                    padding: "10px 24px",
                    background: "var(--primary)",
                    color: "var(--on-primary)",
                    border: "none",
                    borderRadius: "var(--rounded-md)",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                  onMouseOver={e => e.currentTarget.style.background = "var(--primary-active)"}
                  onMouseOut={e => e.currentTarget.style.background = "var(--primary)"}
                >
                  저장
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
