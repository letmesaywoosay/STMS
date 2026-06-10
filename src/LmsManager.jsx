/* eslint-disable */
// LmsManager.jsx
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

const FB_API_KEY = "AIzaSyCarxTqSx__7AfzVNHzN-ilnk0gNN6PkTU";
const FB_PROJECT = "solutiontestsystem";
const FB_BASE    = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/app_data`;

// Firestore REST API 유틸리티
const fbGet = async (key) => {
  const res = await fetch(`${FB_BASE}/${key}?key=${FB_API_KEY}`);
  if(res.status===404) return null;
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const doc = await res.json();
  const raw = doc?.fields?.value?.stringValue;
  return raw ? JSON.parse(raw) : null;
};

const fbSet = async (key, value) => {
  const body = { fields:{ value:{ stringValue: JSON.stringify(value) } } };
  const res = await fetch(`${FB_BASE}/${key}?key=${FB_API_KEY}`,{
    method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)
  });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
};

// ── Expo-inspired 디자인 토큰 ──
const C = {
  bg: "var(--canvas)",               // #ffffff
  bgLight: "var(--canvas-soft)",      // #fafafa
  surface: "var(--surface-card)",    // #ffffff
  border: "var(--hairline)",          // #f0f0f3
  borderLight: "var(--hairline-soft)",// #f5f5f7
  borderStrong: "var(--hairline-strong)", // #dcdee0
  blue: "var(--text-link)",          // #0d74ce
  blueMid: "var(--primary)",         // #000000
  blueLight: "var(--gradient-sky-light)", // #cfe7ff
  text: "var(--ink)",                // #171717
  textDark: "var(--ink)",            // #171717
  subtle: "var(--body)",             // #60646c
  muted: "var(--muted)",             // #999999
  green: "var(--semantic-success)",  // #16a34a
  red: "var(--semantic-error)",      // #eb8e90
  amber: "var(--accent-warning)",    // #ab6400
  purple: "var(--accent-preview)",   // #8145b5
  teal: "#14b8a6",
};

const shadow = "0 4px 12px rgba(0, 0, 0, 0.04)";
const shadowLg = "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)";
const uid = () => Math.random().toString(36).slice(2, 8);

const inpStyle = (extra = {}) => ({
  width: "100%",
  background: "var(--canvas)",
  border: `1px solid var(--hairline-strong)`,
  borderRadius: "var(--rounded-md)",
  padding: "12px 16px",
  fontSize: "14px",
  color: "var(--ink)",
  outline: "none",
  fontFamily: "var(--sans)",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
  ...extra
});

export default function LmsManager({ viewPath, onNavigate }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("intro"); // intro, schedule, classroom, mypage, backoffice
  
  // DB 데이터들
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [viewLogs, setViewLogs] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  // 교육신청 추가 데이터
  const [eduCourses, setEduCourses] = useState([]);
  const [eduRegistrations, setEduRegistrations] = useState([]);
  const [eduInfoBlocks, setEduInfoBlocks] = useState({
    registration: "• 교육 신청은 과정 시작 3일 전까지 가능합니다.\n• 신청 완료 후 수강생의 이메일로 안내장이 자동 발송됩니다.",
    coupon: "• 오케스트로 아카데미 제휴 쿠폰 또는 프로모션 쿠폰을 적용하실 수 있습니다.\n• 쿠폰 코드 입력 시 영문/숫자 대소문자를 구분하며 7자리 숫자로만 적용됩니다.",
    cancellation: "• 교육 취소는 과정 시작 1일 전까지 마이페이지에서 신청 가능합니다.\n• 무단 불참 시 향후 6개월간 교육 참여가 제한될 수 있습니다."
  });
  const [eduEmailRecipients, setEduEmailRecipients] = useState(["academy@okestro.com"]);
  const [eduConfig, setEduConfig] = useState({ googleSheetsScriptUrl: "" });

  // 페이지 꾸미기 & 연간 교육 일정 상태 & 공지사항 & FAQ 상태
  const [pageConfig, setPageConfig] = useState({
    heroTitle: "AIDA TUNE",
    heroSubtitle: "AI 서비스 기획, AI 에이전트 개발, 데이터 엔지니어링 프로젝트 관리 등\n실무 중심의 특화 강의와 실시간 평가 테스트를 하나의 플랫폼에서 신속하게 학습하고 진단하세요.",
    heroBadge: "🚀 AIDA TUNE 훈련센터 공식 파트너",
    heroBgPreset: "sky"
  });
  const [schedules, setSchedules] = useState([]);
  const [notices, setNotices] = useState([]);
  const [faqs, setFaqs] = useState([]);

  // 인증 제어
  const [authMode, setAuthMode] = useState(null); // 'login' | 'register' | 'findPw'
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authErr, setAuthErr] = useState("");
  
  // 비밀번호 찾기
  const [findEmail, setFindEmail] = useState("");
  const [findStep, setFindStep] = useState(1);
  const [tempCode, setTempCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // 회원가입 폼
  const [regForm, setRegForm] = useState({
    email: "", password: "", name: "", userType: "company", company: "", division: "", team: "", jobType: ""
  });

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showGuestAlert, setShowGuestAlert] = useState(false);

  // 1. 초기 데이터 로드
  useEffect(() => {
    const fetchDb = async () => {
      try {
        const [u, c, a, v, d, j, p, s, n, f, ec, er, eib, eer, eco] = await Promise.all([
          fbGet("aida:lms_users_v2").catch(() => []),
          fbGet("aida:lms_courses_v2").catch(() => []),
          fbGet("aida:lms_applications_v2").catch(() => []),
          fbGet("aida:lms_view_logs_v2").catch(() => []),
          fbGet("aida:deptData_v1").catch(() => []),
          fbGet("aida:jobTypes_v1").catch(() => []),
          fbGet("aida:lms_page_config_v1").catch(() => null),
          fbGet("aida:lms_schedules_v1").catch(() => []),
          fbGet("aida:lms_notices_v1").catch(() => []),
          fbGet("aida:lms_faqs_v1").catch(() => []),
          fbGet("aida:edu_courses_v1").catch(() => []),
          fbGet("aida:edu_registrations_v1").catch(() => []),
          fbGet("aida:edu_info_blocks_v1").catch(() => null),
          fbGet("aida:edu_email_recipients_v1").catch(() => []),
          fbGet("aida:edu_config_v1").catch(() => null)
        ]);
        
        setUsers(u || []);
        setCourses(c || []);
        setApplications(a || []);
        setViewLogs(v || []);
        setDeptData(d || []);
        setJobTypes(j || []);

        if (p) {
          setPageConfig(p);
        }

        const defaultMockSchedules = [
          { id: "s-1", course: "AI Agent 설계 및 구축", date: "2026-06-15", target: "사내 임직원 및 교육생", description: "LangChain 및 주요 프레임워크 실습" },
          { id: "s-2", course: "생성형 AI를 활용한 서비스 기획 실무", date: "2026-07-10", target: "전체 임직원 및 파트너사", description: "LLM 기반의 서비스 컨셉 구상 노하우" },
          { id: "s-3", course: "Prompt Engineering 실무 (심화)", date: "2026-08-22", target: "사내 엔지니어 전용", description: "LLM 성능을 백퍼센트 끌어올리는 기술" }
        ];
        setSchedules(s && s.length > 0 ? s : defaultMockSchedules);

        const defaultMockNotices = [
          { id: "n-1", title: "오케스트로 아카데미 개소 및 AIDA TUNE 서비스 런칭 안내", content: "안녕하세요. 오케스트로 아카데미팀입니다. 실무 중심의 특화 강의와 실시간 평가 테스트를 지원하는 AIDA TUNE 서비스가 공식 오픈되었습니다.\n임직원 여러분의 많은 참여 바랍니다.", date: "2026-06-01", author: "관리자", hits: 45 },
          { id: "n-2", title: "[필독] 수강신청 승인 절차 및 수료 기준 안내", content: "각 강좌는 신청 후 관리자의 승인을 거쳐 수강이 확정됩니다. 비디오 학습 진행률이 80% 이상 도달해야 수료가 인정되며 마이페이지에서 이력 확인이 가능합니다.", date: "2026-06-05", author: "관리자", hits: 28 },
          { id: "n-3", title: "6월 정기 생성형 AI 실무 교육 일정 안내", content: "6월에 예정된 생성형 AI 실무 및 프롬프트 엔지니어링 심화 교육 일정이 연간교육계획 메뉴에 등록되었으니 확인하시어 수강신청 바랍니다.", date: "2026-06-09", author: "관리자", hits: 12 }
        ];
        setNotices(n && n.length > 0 ? n : defaultMockNotices);

        const defaultMockFaqs = [
          { id: "f-1", category: "학습/수강", question: "수강 승인은 얼마나 걸리나요?", answer: "수강 신청 접수 후 통상 1~2 영업일 이내에 아카데미 관리자가 확인하여 승인 처리를 완료합니다. 승인이 완료되면 강의실에 입장할 수 있습니다." },
          { id: "f-2", category: "수료 기준", question: "비디오 시청 도중 창을 닫으면 학습이 저장되나요?", answer: "네, 플레이어의 실시간 재생률이 실시간으로 동기화되어 이전 수강 상태부터 이어서 학습하실 수 있습니다. 단, 80% 이상 시청하셔야 최종 수료 신청 버튼이 활성화됩니다." },
          { id: "f-3", category: "기타", question: "수강 확인서나 수료증 발급이 가능한가요?", answer: "마이페이지의 수료 완료 이력을 바탕으로 아카데미 운영진 측으로 문의(academy@okestro.com)해 주시면 증명 서류 발급을 도와드립니다." }
        ];
        setFaqs(f && f.length > 0 ? f : defaultMockFaqs);

        // 교육신청용 데이터 로드 및 시딩
        const defaultMockEduCourses = [
          {
            id: "OK-CCP1",
            target: "Customer",
            name: "생성형 AI 서비스 기획 실전 과정",
            dateStart: "2026-06-20",
            dateEnd: "2026-06-21",
            time: "13:00-18:00",
            location: "여의도 파크원타워2 43층 대회의실",
            status: "Available",
            overview: "본 과정은 생성형 AI 기술의 핵심 개념을 학습하고, 실제 비즈니스 모델 발굴과 서비스 상세 설계서(PRD) 및 프롬프트 엔지니어링 실습을 통합적으로 진행하는 실무형 교육 과정입니다.",
            recommendedAudience: ["생성형 AI 기반 서비스를 기획하고자 하는 PM/기획자", "LLM 스펙 분석 및 AI 에이전트 도입을 고민 중인 비즈니스 결정권자"],
            objectives: ["LLM 작동 메커니즘 및 주요 API 기능 명세서 이해", "비즈니스 개념 구체화 및 와이어프레임 설계 실습"],
            teachingMethod: ["이론 강의 (40%) 및 템플릿 기반 실습 워크숍 (60%)", "현업 기획자의 1:1 맞춤 피드백 및 토의"],
            curriculum: ["1일차: 생성형 AI 개념 및 LLM 모델 비교, API 특성 파악", "2일차: 프롬프트 작성 실습 및 서비스 기획안 구체화 및 발표"],
            prerequisites: ["기본적인 IT 상식 및 서비스 개발 프로세스에 대한 전반적 이해", "실습을 위한 개인 노트북 지참"],
            notices: ["본 교육 과정은 현장 실습 중심이며, 주차 지원이 불가하오니 대중교통 이용을 권장합니다.", "식사는 제공되지 않으며 다과와 음료가 구비되어 있습니다."]
          },
          {
            id: "OK-PTE2",
            target: "Partner",
            name: "AIDA TUNE 솔루션 파트너 기술 심화 교육",
            dateStart: "2026-07-05",
            dateEnd: null,
            time: "10:00-17:00",
            location: "여의도 파크원타워2 43층 파트너룸",
            status: "Separate Notice",
            overview: "AIDA TUNE 솔루션 공식 파트너사의 엔지니어 및 기술 지원 인력을 대상으로 하는 제품 아키텍처 교육 및 트러블슈팅 가이드 교육입니다.",
            recommendedAudience: ["AIDA TUNE 도입 및 기술 지원을 담당하는 협력사 엔지니어", "파트너사 기술 영업 총괄 담당자"],
            objectives: ["AIDA TUNE 백엔드 구조 및 데이터베이스 설계 원칙 학습", "평가 모듈 커스터마이징 및 배포 트러블슈팅 실전 훈련"],
            teachingMethod: ["아키텍처 프레젠테이션 (30%) 및 실 서버 CLI 명령어 실습 (70%)", "시나리오별 에러 대응 워크숍"],
            curriculum: ["1일차 오전: AIDA TUNE 시스템 구성도 및 연동 API 규격 학습", "1일차 오후: VM 배포 실습 및 로깅 시스템 추적 분석"],
            prerequisites: ["Linux CLI 명령어 숙련자", "기본적인 DB 쿼리(SQL/NoSQL) 및 네트워킹 기본 지식 필수"],
            notices: ["파트너사 대상의 비공개 기술 교육으로 사전 승인된 인원만 참석 가능합니다.", "별도 신청을 받지 않으며, 참석을 원하는 파트너사는 고객 성공 매니저에게 별도 문의하시기 바랍니다."]
          },
          {
            id: "OK-EAI3",
            target: "Other",
            name: "오픈소스 LLM 파인튜닝 실무 초급",
            dateStart: "2026-08-12",
            dateEnd: "2026-08-13",
            time: "09:00-18:00",
            location: "온라인 Zoom 라이브",
            status: "Upcoming",
            overview: "Hugging Face 라이브러리를 사용해 사전 학습된 오픈소스 LLM(Llama, Mistral 등)을 우리 기업의 로컬 도메인 데이터로 파인튜닝(LoRA, QLoRA)하는 입문 과정입니다.",
            recommendedAudience: ["로컬 AI 모델 구축을 희망하는 주니어 AI 엔지니어 및 개발자", "파인튜닝 프로세스와 데이터 정제 실습을 배우고 싶은 연구원"],
            objectives: ["LoRA 및 QLoRA 등 파라미터 효율적 미세조정(PEFT) 개념 완벽 이해", "자신만의 데이터셋으로 모델 파인튜닝을 수행하고 평가 지표 산출"],
            teachingMethod: ["온라인 실시간 코딩 실습 (Google Colab 사용)", "실시간 Q&A 세션 및 멘토링 지원"],
            curriculum: ["1일차: 데이터 수집 및 정제 기법, PEFT와 Quantization 이론", "2일차: Colab 환경에서 파인튜닝 수행 및 훈련 추이 추적(W&B 연동)"],
            prerequisites: ["Python 중급 이상 숙련도 (PyTorch 기본 문법 지식 필요)", "Google Colab Pro 이상의 환경 권장 (V100/A100 GPU 사용)"],
            notices: ["본 교육은 100% 온라인 실시간 Zoom 강의로 진행됩니다.", "강의 접속 정보 및 실습 코드는 등록자 이메일로 시작 1일 전에 송부됩니다."]
          }
        ];

        setEduCourses(ec && ec.length > 0 ? ec : defaultMockEduCourses);
        setEduRegistrations(er || []);

        const defaultMockInfoBlocks = {
          registration: "• 교육 신청은 과정 시작 3일 전까지 가능합니다.\n• 신청 완료 후 수강생의 이메일로 안내장이 자동 발송됩니다.",
          coupon: "• 오케스트로 아카데미 제휴 쿠폰 또는 프로모션 쿠폰을 적용하실 수 있습니다.\n• 쿠폰 코드 입력 시 영문/숫자 대소문자를 구분하며 7자리 숫자로만 적용됩니다.",
          cancellation: "• 교육 취소는 과정 시작 1일 전까지 마이페이지에서 신청 가능합니다.\n• 무단 불참 시 향후 6개월간 교육 참여가 제한될 수 있습니다."
        };
        setEduInfoBlocks(eib ? eib : defaultMockInfoBlocks);
        setEduEmailRecipients(eer && eer.length > 0 ? eer : ["academy@okestro.com"]);
        setEduConfig(eco ? eco : { googleSheetsScriptUrl: "" });

        const session = sessionStorage.getItem("aida:lms_login");
        if (session) {
          const parsed = JSON.parse(session);
          const latest = (u || []).find(x => x.email === parsed.email);
          if (latest) setCurrentUser(latest);
          else setCurrentUser(parsed);
        }
      } catch (e) {
        console.error("LMS 데이터 로드 에러:", e);
      } finally {
        setDbLoading(false);
      }
    };
    fetchDb();
  }, []);

  // 라우팅 탭 동기화
  useEffect(() => {
    if (viewPath === "/mypage") {
      setActiveTab("mypage");
    } else if (viewPath === "/classroom") {
      setActiveTab("classroom");
    } else if (viewPath === "/schedule") {
      setActiveTab("schedule");
    } else if (viewPath === "/notice") {
      setActiveTab("notice");
    } else if (viewPath === "/faq") {
      setActiveTab("faq");
    } else if (viewPath === "/admin") {
      setActiveTab("backoffice");
    } else if (viewPath === "/course") {
      setActiveTab("course");
    } else if (viewPath.startsWith("/course/detail/")) {
      setActiveTab("course-detail");
    } else if (viewPath.startsWith("/course/register/")) {
      setActiveTab("course-register");
    } else {
      setActiveTab("intro");
    }
  }, [viewPath]);

  const saveUsers = async (newUsers) => {
    setUsers(newUsers);
    await fbSet("aida:lms_users_v2", newUsers);
  };
  const saveCourses = async (newCourses) => {
    setCourses(newCourses);
    await fbSet("aida:lms_courses_v2", newCourses);
  };
  const saveApplications = async (newApps) => {
    setApplications(newApps);
    await fbSet("aida:lms_applications_v2", newApps);
  };
  const saveViewLogs = async (newLogs) => {
    setViewLogs(newLogs);
    await fbSet("aida:lms_view_logs_v2", newLogs);
  };
  const savePageConfig = async (newConfig) => {
    setPageConfig(newConfig);
    await fbSet("aida:lms_page_config_v1", newConfig);
  };
  const saveSchedules = async (newSchedules) => {
    setSchedules(newSchedules);
    await fbSet("aida:lms_schedules_v1", newSchedules);
  };
  const saveNotices = async (newNotices) => {
    setNotices(newNotices);
    await fbSet("aida:lms_notices_v1", newNotices);
  };
  const saveFaqs = async (newFaqs) => {
    setFaqs(newFaqs);
    await fbSet("aida:lms_faqs_v1", newFaqs);
  };
  const saveEduCourses = async (newEduCourses) => {
    setEduCourses(newEduCourses);
    await fbSet("aida:edu_courses_v1", newEduCourses);
  };
  const saveEduRegistrations = async (newEduRegistrations) => {
    setEduRegistrations(newEduRegistrations);
    await fbSet("aida:edu_registrations_v1", newEduRegistrations);
  };
  const saveEduInfoBlocks = async (newInfoBlocks) => {
    setEduInfoBlocks(newInfoBlocks);
    await fbSet("aida:edu_info_blocks_v1", newInfoBlocks);
  };
  const saveEduEmailRecipients = async (newRecipients) => {
    setEduEmailRecipients(newRecipients);
    await fbSet("aida:edu_email_recipients_v1", newRecipients);
  };
  const saveEduConfig = async (newConfig) => {
    setEduConfig(newConfig);
    await fbSet("aida:edu_config_v1", newConfig);
  };

  const handleLogin = () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthErr("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    const matched = users.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (!matched) {
      setAuthErr("등록되지 않은 이메일 주소입니다.");
      return;
    }
    if (matched.password !== loginPassword.trim()) {
      setAuthErr("비밀번호가 올바르지 않습니다.");
      return;
    }
    if (!matched.approved && matched.role !== "admin") {
      setAuthErr("⚠️ 관리자의 가입 승인 대기 중인 계정입니다.");
      return;
    }
    
    sessionStorage.setItem("aida:lms_login", JSON.stringify(matched));
    setCurrentUser(matched);
    setAuthMode(null);
    setAuthErr("");
    
    // GNB 동기화 발생
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleLogout = () => {
    sessionStorage.removeItem("aida:lms_login");
    setCurrentUser(null);
    setActiveTab("intro");
    onNavigate("/");
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleRegister = async () => {
    const { email, password, name, userType, company, division, team, jobType } = regForm;
    if (!email.trim() || !password.trim() || !name.trim() || !company || !division || !team || !jobType) {
      setAuthErr("모든 필수 입력 항목을 채워주세요.");
      return;
    }

    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setAuthErr("이미 사용 중인 이메일 주소입니다.");
      return;
    }

    const newUser = {
      id: uid(),
      email: email.trim(),
      password: password.trim(),
      name: name.trim(),
      userType,
      company,
      division,
      team,
      jobType,
      role: email.trim().endsWith("@okestro.com") ? "admin" : "user",
      approved: userType === "company",
      registeredAt: new Date().toISOString()
    };

    const updated = [newUser, ...users];
    await saveUsers(updated);
    
    if (newUser.approved) {
      alert("회원가입이 완료되었습니다! 로그인해 주세요.");
    } else {
      alert("회원가입이 정상 접수되었습니다. 관리자 승인 완료 후 로그인이 가능합니다.");
    }
    
    setAuthMode("login");
    setAuthErr("");
  };

  const handleFindPassword = () => {
    if (findStep === 1) {
      const matched = users.find(u => u.email.toLowerCase() === findEmail.trim().toLowerCase());
      if (!matched) {
        setAuthErr("가입 정보가 없는 이메일입니다.");
        return;
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setTempCode(code);
      setAuthErr("");
      alert(`[가상 이메일 전송] ${findEmail}으로 비밀번호 재설정 코드를 발송했습니다.\n인증 코드: ${code}`);
      setFindStep(2);
    } else if (findStep === 2) {
      if (inputCode.trim() !== tempCode) {
        setAuthErr("인증 코드가 일치하지 않습니다.");
        return;
      }
      setAuthErr("");
      setFindStep(3);
    } else if (findStep === 3) {
      if (!newPassword.trim()) {
        setAuthErr("새로운 비밀번호를 입력해주세요.");
        return;
      }
      const updated = users.map(u => u.email.toLowerCase() === findEmail.trim().toLowerCase() ? { ...u, password: newPassword.trim() } : u);
      saveUsers(updated);
      alert("비밀번호가 성공적으로 변경되었습니다. 로그인 해 주세요.");
      setAuthMode("login");
      setFindStep(1);
      setFindEmail("");
      setNewPassword("");
      setAuthErr("");
    }
  };

  const checkAccess = (targetTab) => {
    if (!currentUser) {
      setShowGuestAlert(true);
    } else {
      setActiveTab(targetTab);
      onNavigate(targetTab === "classroom" ? "/classroom" : (targetTab === "mypage" ? "/mypage" : "/"));
    }
  };

  if (dbLoading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas)" }}>
        <div style={{ fontSize: "14px", color: "var(--body)", fontWeight: 500 }}>AIDA TUNE 시스템 로딩 중...</div>
      </div>
    );
  }

  if (viewPath === "/admin") {
    return (
      <div style={{ padding: "24px", background: "var(--canvas-soft)", minHeight: "100vh" }}>
        <BackOfficeView 
          users={users} 
          saveUsers={saveUsers} 
          courses={courses} 
          saveCourses={saveCourses} 
          applications={applications} 
          saveApplications={saveApplications} 
          viewLogs={viewLogs} 
          deptData={deptData} 
          jobTypes={jobTypes}
          pageConfig={pageConfig}
          savePageConfig={savePageConfig}
          schedules={schedules}
          saveSchedules={saveSchedules}
          notices={notices}
          saveNotices={saveNotices}
          faqs={faqs}
          saveFaqs={saveFaqs}
          eduCourses={eduCourses}
          saveEduCourses={saveEduCourses}
          eduRegistrations={eduRegistrations}
          saveEduRegistrations={saveEduRegistrations}
          eduInfoBlocks={eduInfoBlocks}
          saveEduInfoBlocks={saveEduInfoBlocks}
          eduEmailRecipients={eduEmailRecipients}
          saveEduEmailRecipients={saveEduEmailRecipients}
          eduConfig={eduConfig}
          saveEduConfig={saveEduConfig}
        />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
      {/* ── GNB 서브 네비게이션 헤더 (Expo top-nav 가이드 적용) ── */}
      <div style={{
        background: "var(--canvas)",
        borderBottom: `1px solid var(--hairline)`,
        padding: "0 24px",
        height: "50px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        position: "sticky",
        top: "64px",
        zIndex: 99
      }}>
        {/* 서브 네비게이션 목록 */}
        <div style={{ display: "flex", gap: "20px" }}>
          {[
            { id: "intro", label: "AIDA TUNE 소개", path: "/" },
            { id: "course", label: "교육신청", path: "/course" },
            { id: "schedule", label: "연간교육계획", path: "/schedule" },
            { id: "notice", label: "공지사항", path: "/notice" },
            { id: "faq", label: "자주 묻는 질문 (FAQ)", path: "/faq" },
            { id: "classroom", label: "나의 강의실", path: "/classroom", secure: true },
            { id: "mypage", label: "마이페이지", path: "/mypage", secure: true, hideGuest: true }
          ].map((tab) => {
            if (tab.hideGuest && !currentUser) return null;
            const isActive = activeTab === tab.id || (tab.id === "course" && ["course", "course-detail", "course-register"].includes(activeTab));
            return (
              <button
                key={tab.id}
                onClick={() => tab.secure ? checkAccess(tab.id) : (setActiveTab(tab.id), onNavigate(tab.path))}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--ink)" : "var(--body)",
                  cursor: "pointer",
                  padding: "6px 0",
                  borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                  transition: "color 0.15s ease",
                  fontFamily: "var(--sans)"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 유틸 로그인 인터페이스 */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {currentUser ? (
            <>
              <span style={{ fontSize: "13px", color: "var(--body)" }}>
                <strong style={{ color: "var(--ink)" }}>{currentUser.name}</strong>님 학습 중
              </span>
              <button 
                onClick={handleLogout} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "var(--body)", 
                  fontSize: "13px", 
                  cursor: "pointer", 
                  fontWeight: 600,
                  fontFamily: "var(--sans)"
                }}
                onMouseOver={(e) => e.currentTarget.style.color = "var(--ink)"}
                onMouseOut={(e) => e.currentTarget.style.color = "var(--body)"}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => { setAuthMode("login"); setAuthErr(""); }} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "var(--ink)", 
                  fontSize: "13px", 
                  cursor: "pointer", 
                  fontWeight: 600,
                  fontFamily: "var(--sans)"
                }}
              >
                로그인
              </button>
              <button 
                onClick={() => { setAuthMode("register"); setAuthErr(""); }} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "var(--body)", 
                  fontSize: "13px", 
                  cursor: "pointer", 
                  fontWeight: 600,
                  fontFamily: "var(--sans)"
                }}
                onMouseOver={(e) => e.currentTarget.style.color = "var(--ink)"}
                onMouseOut={(e) => e.currentTarget.style.color = "var(--body)"}
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── 본문 화면 출력 ── */}
      <div style={{ flex: 1 }}>
        {activeTab === "intro" && <IntroView courses={courses} checkAccess={checkAccess} setSelectedCourse={setSelectedCourse} applications={applications} currentUser={currentUser} pageConfig={pageConfig} notices={notices} faqs={faqs} saveNotices={saveNotices} setActiveTab={setActiveTab} />}
        {activeTab === "course" && <CourseListPage eduCourses={eduCourses} infoBlocks={eduInfoBlocks} onNavigate={onNavigate} />}
        {activeTab === "course-detail" && <CourseDetailPage eduCourses={eduCourses} viewPath={viewPath} onNavigate={onNavigate} />}
        {activeTab === "course-register" && <CourseRegistrationPage eduCourses={eduCourses} viewPath={viewPath} currentUser={currentUser} users={users} saveUsers={saveUsers} eduRegistrations={eduRegistrations} saveEduRegistrations={saveEduRegistrations} emailRecipients={eduEmailRecipients} eduConfig={eduConfig} onNavigate={onNavigate} />}
        {activeTab === "schedule" && <ScheduleView schedules={schedules} />}
        {activeTab === "notice" && <NoticeView notices={notices} saveNotices={saveNotices} />}
        {activeTab === "faq" && <FaqView faqs={faqs} />}
        {activeTab === "classroom" && currentUser && <ClassroomView courses={courses} applications={applications} viewLogs={viewLogs} currentUser={currentUser} saveApplications={saveApplications} selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse} saveViewLogs={saveViewLogs} />}
        {activeTab === "mypage" && currentUser && <MyPageView applications={applications} courses={courses} checkAccess={checkAccess} setSelectedCourse={setSelectedCourse} />}
      </div>

      {/* ── Expo 스타일 미니멀 에디토리얼 푸터 ── */}
      <div style={{
        background: "var(--canvas)",
        borderTop: "1px solid var(--hairline)",
        padding: "48px 24px",
        boxSizing: "border-box",
        marginTop: "auto"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "600px" }}>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>🎻 AIDA TUNE 아카데미</div>
            <div style={{ fontSize: "13px", color: "var(--body)", lineHeight: "1.6" }}>
              회사명 : 오케스트로(주) &nbsp;|&nbsp; 서울특별시 영등포구 여의대포 108, 43층 (여의도동, 파크원타워2)<br />
              Email : academy@okestro.com &nbsp;|&nbsp; 대표자 : 김민준 &nbsp;|&nbsp; 사업자등록번호 : 783-85-00169
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
              COPYRIGHT© 2026 ALL RIGHT RESERVED.
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "var(--body)", cursor: "pointer" }}>AIDA TUNE 소개</span>
            <span style={{ fontSize: "13px", color: "var(--body)", cursor: "pointer" }}>이용약관</span>
            <span style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 600, cursor: "pointer" }}>개인정보처리방침</span>
            <span style={{ fontSize: "13px", color: "var(--body)", cursor: "pointer" }}>찾아오시는길</span>
          </div>
        </div>
      </div>

      {/* 로그인/회원가입 모달 (Expo 라이트 카드 테마) */}
      {authMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.4)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ 
            background: "var(--surface-card)", 
            borderRadius: "var(--rounded-lg)", 
            padding: "36px", 
            width: "100%", 
            maxWidth: "440px", 
            boxShadow: shadowLg, 
            border: "1px solid var(--hairline)",
            position: "relative",
            boxSizing: "border-box"
          }}>
            <button onClick={() => setAuthMode(null)} style={{ position: "absolute", top: "20px", right: "20px", border: "none", background: "none", fontSize: "20px", color: "var(--muted)", cursor: "pointer" }}>✕</button>
            {authMode === "login" && (
              <div>
                <h3 style={{ fontSize: "22px", fontWeight: 600, color: "var(--ink)", marginBottom: "24px", textAlign: "center", letterSpacing: "-0.5px" }}>TUNE 로그인</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>이메일 주소</label>
                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="example@okestro.com" style={inpStyle()} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>비밀번호</label>
                    <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="비밀번호 입력" style={inpStyle()} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                  </div>
                  {authErr && <div style={{ fontSize: "13px", color: "var(--semantic-error)", fontWeight: 500 }}>⚠️ {authErr}</div>}
                  <button onClick={handleLogin} style={{ width: "100%", padding: "12px", border: "none", borderRadius: "var(--rounded-md)", background: "var(--primary)", color: "var(--on-primary)", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "var(--primary-active)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "var(--primary)"}>
                    로그인
                  </button>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
                    <button onClick={() => { setAuthMode("findPw"); setFindStep(1); setAuthErr(""); }} style={{ background: "none", border: "none", fontSize: "13px", color: "var(--body)", cursor: "pointer" }}>비밀번호 찾기</button>
                    <button onClick={() => { setAuthMode("register"); setAuthErr(""); }} style={{ background: "none", border: "none", fontSize: "13px", color: "var(--text-link)", fontWeight: 600, cursor: "pointer" }}>신규 회원가입</button>
                  </div>
                </div>
              </div>
            )}
            {authMode === "register" && (
              <RegisterForm regForm={regForm} setRegForm={setRegForm} handleRegister={handleRegister} authErr={authErr} deptData={deptData} jobTypes={jobTypes} />
            )}
            {authMode === "findPw" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", marginBottom: "20px", textAlign: "center" }}>비밀번호 재설정</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {findStep === 1 && (
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>가입 이메일 주소</label>
                      <input type="email" value={findEmail} onChange={e => setFindEmail(e.target.value)} placeholder="example@okestro.com" style={inpStyle()} />
                    </div>
                  )}
                  {findStep === 2 && (
                    <div>
                      <div style={{ fontSize: "13px", color: "var(--body)", marginBottom: "8px" }}>인증 코드가 이메일로 전송되었습니다.</div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>인증 번호 (6자리)</label>
                      <input type="text" value={inputCode} onChange={e => setInputCode(e.target.value)} placeholder="000000" style={inpStyle()} />
                    </div>
                  )}
                  {findStep === 3 && (
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>새 비밀번호 설정</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="새 비밀번호 입력" style={inpStyle()} />
                    </div>
                  )}
                  {authErr && <div style={{ fontSize: "13px", color: "var(--semantic-error)", fontWeight: 500 }}>⚠️ {authErr}</div>}
                  <button onClick={handleFindPassword} style={{ width: "100%", padding: "12px", border: "none", borderRadius: "var(--rounded-md)", background: "var(--primary)", color: "var(--on-primary)", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
                    {findStep === 1 ? "인증번호 발송" : (findStep === 2 ? "인증 완료" : "비밀번호 재설정")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest Alert 모달 (Expo 라이트 카드 테마) */}
      {showGuestAlert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.4)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ 
            background: "var(--surface-card)", 
            borderRadius: "var(--rounded-lg)", 
            padding: "36px", 
            width: "100%", 
            maxWidth: "360px", 
            textAlign: "center",
            border: "1px solid var(--hairline)"
          }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#fef3c7", color: "var(--accent-warning)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 16px" }}>🔑</div>
            <h4 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}>로그인이 필요한 서비스입니다</h4>
            <p style={{ fontSize: "13px", color: "var(--body)", lineHeight: "1.6", marginBottom: "24px" }}>나의 강의실 수강 신청 및 학습 영상 시청은 로그인 후 가능합니다.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setShowGuestAlert(false); setAuthMode("login"); }} style={{ flex: 1, padding: "12px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>로그인</button>
              <button onClick={() => { setShowGuestAlert(false); setAuthMode("register"); }} style={{ flex: 1, padding: "12px", background: "var(--canvas)", border: `1px solid var(--hairline-strong)`, borderRadius: "var(--rounded-md)", fontSize: "13px", color: "var(--ink)", fontWeight: 500, cursor: "pointer" }}>회원가입</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getBgFromPreset = (preset) => {
  if (preset === "slate") return "linear-gradient(to bottom, #eceef2, #d5d9e2, var(--canvas))";
  if (preset === "rose") return "linear-gradient(to bottom, #fff1f2, #ffe4e6, var(--canvas))";
  if (preset === "gold") return "linear-gradient(to bottom, #fefce8, #fef9c3, var(--canvas))";
  return "linear-gradient(to bottom, var(--gradient-sky-light), var(--gradient-sky-mid), var(--canvas))";
};

// ── [IntroView] Expo Hero & Device-Mockup 적용 메인 화면 ──
function IntroView({ courses, checkAccess, setSelectedCourse, applications, currentUser, pageConfig, notices, faqs, saveNotices, setActiveTab }) {
  const [selectedNotice, setSelectedNotice] = useState(null);

  const defaultMockCourses = [
    { id: "mock-1", title: "AI Agent 설계 및 구축", description: "LangChain 및 주요 프레임워크를 활용해 업무 자동화용 AI 에이전트를 빌드하고 프로덕션 수준으로 구현하는 실무 과정", duration: "2일, 16시간", image: "🤖" },
    { id: "mock-2", title: "생성형 AI를 활용한 서비스 기획 실무", description: "대규모 언어모델(LLM) 기반의 서비스 컨셉 구상부터 시나리오 작성, API 스펙 파악까지 통합 아우르는 기획 노하우 과정", duration: "1일, 8시간", image: "💡" },
    { id: "mock-3", title: "Prompt Engineering 실무", description: "LLM의 성능을 백퍼센트 끌어올리는 구조적 질문 프롬프트 작성 규칙 및 피드백 루프 조율을 체득하는 실전 테크닉 과정", duration: "1일, 8시간", image: "✍️" }
  ];

  const displayCourses = courses.length > 0 ? courses.slice(0, 3) : defaultMockCourses;

  const displayNotices = notices ? notices.slice(0, 4) : [];
  const displayFaqs = faqs ? faqs.slice(0, 4) : [];

  const handleNoticeClick = async (n) => {
    setSelectedNotice(n);
    if (saveNotices && notices) {
      const updated = notices.map(item => 
        item.id === n.id ? { ...item, hits: (item.hits || 0) + 1 } : item
      );
      await saveNotices(updated);
    }
  };

  const handleCourseCardClick = (c) => {
    if (courses.length > 0) {
      setSelectedCourse(c);
      checkAccess("classroom");
    } else {
      alert(`[${c.title}] 수강을 원하실 경우 '나의 강의실'로 입장하셔서 수강 신청을 클릭해주세요!`);
      checkAccess("classroom");
    }
  };

  return (
    <div>
      {/* ── Expo-inspired Hero Band (하늘색 그라데이션 및 디바이스 목업 크롬 내장) ── */}
      <div style={{
        background: getBgFromPreset(pageConfig?.heroBgPreset),
        padding: "96px 24px",
        boxSizing: "border-box",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", zIndex: 5 }}>
          <div style={{ 
            background: "var(--surface-card)", 
            border: "1px solid var(--hairline-strong)", 
            borderRadius: "var(--rounded-pill)", 
            display: "inline-block", 
            padding: "6px 12px", 
            fontSize: "11px", 
            color: "var(--ink)", 
            fontWeight: 600, 
            textTransform: "uppercase",
            letterSpacing: "0.88px",
            marginBottom: "24px" 
          }}>
            {pageConfig?.heroBadge || "🚀 AIDA TUNE 훈련센터 공식 파트너"}
          </div>
          <h1 style={{ 
            fontSize: "64px", 
            fontWeight: 600, 
            color: "var(--ink)", 
            lineHeight: "1.05", 
            margin: "0 0 24px 0", 
            letterSpacing: "-1.92px" 
          }}>
            {pageConfig?.heroTitle || "AIDA TUNE"}
          </h1>
          <p style={{ 
            fontSize: "16px", 
            color: "var(--body)", 
            lineHeight: "1.5", 
            margin: "0 0 32px 0", 
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
            whiteSpace: "pre-line"
          }}>
            {pageConfig?.heroSubtitle || "AI 서비스 기획, AI 에이전트 개발, 데이터 엔지니어링 프로젝트 관리 등\n실무 중심의 특화 강의와 실시간 평가 테스트를 하나의 플랫폼에서 신속하게 학습하고 진단하세요."}
          </p>
          <button onClick={() => checkAccess("classroom")}
            style={{
              height: "40px",
              padding: "0 24px",
              background: "var(--primary)",
              color: "var(--on-primary)",
              border: "none",
              borderRadius: "var(--rounded-md)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s"
            }}
            onMouseOver={e => e.currentTarget.style.background = "var(--primary-active)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--primary)"}>
            교육 신청하기 ➔
          </button>
        </div>

        {/* ── Expo signature: MacBook + iPhone composite device mockup ── */}
        <div style={{ marginTop: "64px", position: "relative", width: "100%", maxWidth: "760px", height: "420px", display: "flex", justifyContent: "center", zIndex: 10 }}>
          {/* MacBook Mockup */}
          <div style={{
            width: "640px",
            height: "380px",
            background: "var(--surface-card)",
            borderRadius: "var(--rounded-xl)",
            border: "1px solid var(--hairline-strong)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.06)",
            padding: "8px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            position: "relative"
          }}>
            {/* macOS Browser Header */}
            <div style={{ height: "24px", display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid var(--hairline)", padding: "0 8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff5f56" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27c93f" }} />
              <div style={{ flexGrow: 1, textAlign: "center", fontSize: "10px", color: "var(--muted)", fontFamily: "var(--sans)" }}>aida-tune.okestro.academy</div>
            </div>
            
            {/* Mock EAS / LMS Dashboard Content */}
            <div style={{ flexGrow: 1, background: "var(--canvas-soft)", display: "flex", overflow: "hidden" }}>
              {/* Sidebar mockup */}
              <div style={{ width: "80px", borderRight: "1px solid var(--hairline)", background: "var(--canvas)", padding: "12px 6px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ height: "12px", background: "var(--hairline-strong)", borderRadius: "3px" }} />
                <div style={{ height: "12px", background: "var(--hairline)", borderRadius: "3px" }} />
                <div style={{ height: "12px", background: "var(--hairline)", borderRadius: "3px" }} />
                <div style={{ height: "12px", background: "var(--hairline)", borderRadius: "3px" }} />
              </div>
              {/* Main content mockup */}
              <div style={{ flexGrow: 1, padding: "16px", boxSizing: "border-box", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>🎻 AIDA TUNE Dashboard</div>
                <div style={{ height: "4px", width: "40px", background: "var(--primary)" }} />
                <div style={{ gridTemplateColumns: "1fr 1fr", display: "grid", gap: "8px" }}>
                  <div style={{ background: "var(--canvas)", border: "1px solid var(--hairline)", borderRadius: "6px", padding: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "9px", color: "var(--muted)" }}>수강 완료 강좌</span>
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>3 / 5</span>
                  </div>
                  <div style={{ background: "var(--canvas)", border: "1px solid var(--hairline)", borderRadius: "6px", padding: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "9px", color: "var(--muted)" }}>테스트 평점</span>
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>92점</span>
                  </div>
                </div>
                {/* Graph chart mockup */}
                <div style={{ flexGrow: 1, background: "var(--canvas)", border: "1px solid var(--hairline)", borderRadius: "6px", padding: "8px", display: "flex", flexDirection: "column", justifyStyle: "space-between" }}>
                  <span style={{ fontSize: "9px", color: "var(--muted)", marginBottom: "8px" }}>학습 누적 시청 기록</span>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", flexGrow: 1, height: "80px", paddingBottom: "4px" }}>
                    <div style={{ flexGrow: 1, height: "40px", background: "var(--hairline-strong)", borderRadius: "3px" }} />
                    <div style={{ flexGrow: 1, height: "70px", background: "var(--primary)", borderRadius: "3px" }} />
                    <div style={{ flexGrow: 1, height: "30px", background: "var(--hairline-strong)", borderRadius: "3px" }} />
                    <div style={{ flexGrow: 1, height: "90px", background: "var(--primary)", borderRadius: "3px" }} />
                    <div style={{ flexGrow: 1, height: "55px", background: "var(--hairline-strong)", borderRadius: "3px" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* iPhone Mockup Overlay */}
          <div style={{
            position: "absolute",
            right: "40px",
            bottom: "10px",
            width: "180px",
            height: "330px",
            background: "var(--surface-card)",
            borderRadius: "24px",
            border: "4px solid var(--ink)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            padding: "6px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            zIndex: 15
          }}>
            {/* iOS Status Bar */}
            <div style={{ height: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 6px", fontSize: "8px", color: "var(--ink)", fontWeight: 600 }}>
              <span>9:41</span>
              {/* Notch */}
              <div style={{ width: "50px", height: "10px", background: "var(--ink)", borderRadius: "0 0 6px 6px", position: "absolute", left: "65px", top: "4px" }} />
              <span>5G</span>
            </div>
            
            {/* iPhone Mobile Content */}
            <div style={{ flexGrow: 1, background: "var(--canvas-soft)", borderRadius: "16px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden", textAlign: "left" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--ink)" }}>🎨 Mobile Learning</div>
              {/* Mobile video player screen */}
              <div style={{ height: "80px", background: "#000", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px" }}>▶</div>
              <div style={{ fontSize: "8px", color: "var(--body)" }}>1차시: 클라우드 가상화 아키텍처 개론</div>
              {/* Mobile Chatbot mockup */}
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "4px", justifyContent: "flex-end" }}>
                <div style={{ alignSelf: "flex-end", background: "var(--primary)", color: "#fff", padding: "4px 8px", borderRadius: "8px 8px 0 8px", fontSize: "7px", maxWidth: "80%" }}>
                  QCOW2 가 무엇인가요?
                </div>
                <div style={{ alignSelf: "flex-start", background: "var(--surface-card)", border: "1px solid var(--hairline)", color: "var(--ink)", padding: "4px 8px", borderRadius: "8px 8px 8px 0", fontSize: "7px", maxWidth: "85%" }}>
                  QCOW2는 QEMU Copy On Write 2의 약칭으로, 콘트라베이스 하이퍼바이저에서 사용하는 디스크 포맷입니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 인기 과정 & 이달의 교육 과정 (96px 리듬 패딩) ── */}
      <div style={{ padding: "96px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
          <div>
            <h2 style={{ fontSize: "36px", fontWeight: 600, color: "var(--ink)", margin: 0, letterSpacing: "-1.08px" }}>🔥 실시간 인기 클래스</h2>
            <span style={{ fontSize: "14px", color: "var(--body)" }}>수강생들이 가장 선호하는 핵심 커리큘럼입니다.</span>
          </div>
          <button onClick={() => checkAccess("classroom")} style={{ background: "none", border: "none", color: "var(--text-link)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>전체 과정 보기 ➔</button>
        </div>

        <div style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", display: "grid", gap: "24px" }}>
          {displayCourses.map(c => (
            <div key={c.id} onClick={() => handleCourseCardClick(c)}
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--hairline-strong)",
                borderRadius: "var(--rounded-lg)",
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxSizing: "border-box"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = shadow;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}>
              <div style={{ width: "45px", height: "45px", borderRadius: "var(--rounded-md)", background: "var(--canvas-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", marginBottom: "16px" }}>
                {c.image || "🎓"}
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", margin: "0 0 8px 0" }}>{c.title}</h3>
              <p style={{ fontSize: "14px", color: "var(--body)", lineHeight: "1.5", margin: "0 0 16px 0", height: "48px", overflow: "hidden" }}>{c.description}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--hairline)", paddingTop: "12px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-link)", fontWeight: 600 }}>{c.duration || "동영상강의"}</span>
                <span style={{ fontSize: "13px", color: "var(--body)" }}>무료 신청 가능</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 공지사항 & FAQ (96px 리듬 패딩) ── */}
      <div style={{ borderTop: "1px solid var(--hairline)", padding: "96px 24px", boxSizing: "border-box", background: "var(--canvas-soft)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", display: "grid", gap: "48px" }}>
          {/* 공지사항 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "28px", fontWeight: 600, color: "var(--ink)", margin: 0, letterSpacing: "-0.84px" }}>📢 공지사항</h3>
              <span
                onClick={() => setActiveTab("notice")}
                style={{ fontSize: "14px", color: "var(--text-link)", cursor: "pointer", fontWeight: 500 }}
              >더보기 →</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {displayNotices.map(n => (
                <div key={n.id} onClick={() => setSelectedNotice(n)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "var(--surface-card)", borderRadius: "var(--rounded-lg)", border: "1px solid var(--hairline)", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = shadow}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <span style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "12px", flex: 1 }}>{n.title}</span>
                  <span style={{ fontSize: "13px", color: "var(--body)", flexShrink: 0 }}>{n.date}</span>
                </div>
              ))}
              {displayNotices.length === 0 && (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--body)", fontSize: "14px", background: "var(--surface-card)", borderRadius: "var(--rounded-lg)", border: "1px solid var(--hairline)" }}>등록된 공지사항이 없습니다.</div>
              )}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "28px", fontWeight: 600, color: "var(--ink)", margin: 0, letterSpacing: "-0.84px" }}>❓ FAQ</h3>
              <span
                onClick={() => setActiveTab("faq")}
                style={{ fontSize: "14px", color: "var(--text-link)", cursor: "pointer", fontWeight: 500 }}
              >더보기 →</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {displayFaqs.map((f, idx) => (
                <div key={f.id || idx} style={{ padding: "16px", background: "var(--surface-card)", borderRadius: "var(--rounded-lg)", border: "1px solid var(--hairline)" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>Q. {f.question || f.q}</div>
                  <div style={{ fontSize: "13px", color: "var(--body)", lineHeight: "1.5" }}>{f.answer || f.a}</div>
                </div>
              ))}
              {displayFaqs.length === 0 && (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--body)", fontSize: "14px", background: "var(--surface-card)", borderRadius: "var(--rounded-lg)", border: "1px solid var(--hairline)" }}>등록된 FAQ가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 하단 고객지원 센터 (Expo Surface Dark 활용 반전 카드) ── */}
      <div style={{ borderTop: "1px solid var(--hairline)", background: "var(--canvas)", padding: "96px 24px", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h3 style={{ fontSize: "28px", fontWeight: 600, color: "var(--ink)", marginBottom: "32px", letterSpacing: "-0.84px" }}>고객지원 센터</h3>
          <div style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", display: "grid", gap: "24px" }}>
            <a href="http://pf.kakao.com/_xhbxaxkxj/chat" target="_blank" style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--surface-dark)", border: "1px solid var(--primary-active)", borderRadius: "var(--rounded-lg)", padding: "24px", color: "var(--on-dark)", transition: "transform 0.15s", minHeight: "120px" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--accent-link-bright)", marginBottom: "8px" }}>💬 카카오톡 채널</div>
                <div style={{ fontSize: "13px", color: "var(--on-dark-soft)", lineHeight: "1.5" }}>오케스트로 아카데미 채널 추가하고 실시간 메신저 문의하기</div>
              </div>
            </a>
            <div style={{ background: "var(--surface-dark)", border: "1px solid var(--primary-active)", borderRadius: "var(--rounded-lg)", padding: "24px", color: "var(--on-dark)", minHeight: "120px" }}>
              <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--accent-link-bright)", marginBottom: "8px" }}>📞 오케스트로 아카데미 문의</div>
              <div style={{ fontSize: "13px", color: "var(--on-dark-soft)", lineHeight: "1.5" }}>Email : academy@okestro.com</div>
            </div>
            <a href="https://map.naver.com/v5/search/서울특별시 영등포구 여의대로 108 파크원타워2" target="_blank" style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--surface-dark)", border: "1px solid var(--primary-active)", borderRadius: "var(--rounded-lg)", padding: "24px", color: "var(--on-dark)", transition: "transform 0.15s", minHeight: "120px" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--accent-link-bright)", marginBottom: "8px" }}>📍 교육장 오시는 길</div>
                <div style={{ fontSize: "13px", color: "var(--on-dark-soft)", lineHeight: "1.5" }}>서울특별시 영등포구 여의대포 108, 43층 (여의도동, 파크원타워2)</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* ── 공지사항 팝업 상세 모달 (Expo 라이트 카드 테마) ── */}
      {selectedNotice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface-card)", borderRadius: "var(--rounded-lg)", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: shadowLg, border: "1px solid var(--hairline)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline)", paddingBottom: "12px", marginBottom: "16px" }}>
              <strong style={{ fontSize: "13px", color: "var(--text-link)" }}>📢 공지사항</strong>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>작성일: {selectedNotice.date}</span>
            </div>
            <h4 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", margin: "0 0 12px 0" }}>{selectedNotice.title}</h4>
            <p style={{ fontSize: "14px", color: "var(--body)", lineHeight: "1.7", margin: "0 0 24px 0", whiteSpace: "pre-line" }}>{selectedNotice.content}</p>
            <button onClick={() => setSelectedNotice(null)} style={{ width: "100%", padding: "12px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── [ScheduleView] 연간 교육 일정 계획 ──
function ScheduleView({ schedules }) {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // 0-indexed: 5 = June
  const [detailSchedule, setDetailSchedule] = useState(null);

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const rows = [];
  let row = [];
  cells.forEach((cell) => {
    row.push(cell);
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  });
  if (row.length > 0) {
    while (row.length < 7) {
      row.push(null);
    }
    rows.push(row);
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div style={{ padding: "96px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "32px", boxShadow: shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h3 style={{ fontSize: "28px", fontWeight: 600, color: "var(--ink)", margin: "0 0 8px 0", letterSpacing: "-0.84px" }}>📅 연간 교육 일정 계획</h3>
            <p style={{ fontSize: "14px", color: "var(--body)", margin: 0 }}>오케스트로 기술 교육 센터에서 주관하는 연간 교육 일정표입니다.</p>
          </div>
          
          {/* 달력 컨트롤러 */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", padding: "8px 16px", borderRadius: "var(--rounded-md)" }}>
            <button onClick={handlePrevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--ink)", fontWeight: 600 }}>&lt;</button>
            <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", minWidth: "100px", textAlign: "center" }}>{currentYear}년 {currentMonth + 1}월</span>
            <button onClick={handleNextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--ink)", fontWeight: 600 }}>&gt;</button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--hairline-strong)", paddingBottom: "10px", textAlign: "center", fontWeight: 600, fontSize: "13px", color: "var(--body)" }}>
          <div style={{ color: "var(--red)" }}>일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div style={{ color: "var(--text-link)" }}>토</div>
        </div>

        {/* 달력 그리드 */}
        <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--hairline-strong)", borderTop: "none", borderRadius: "0 0 var(--rounded-lg) var(--rounded-lg)", overflow: "hidden" }}>
          {rows.map((r, rIdx) => (
            <div key={rIdx} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: rIdx === rows.length - 1 ? "none" : "1px solid var(--hairline)", minHeight: "120px" }}>
              {r.map((day, dIdx) => {
                const dayStr = day ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : "";
                const daySchedules = day ? schedules.filter(s => s.date === dayStr) : [];
                return (
                  <div key={dIdx} style={{ 
                    padding: "8px", 
                    background: day ? "var(--surface-card)" : "var(--canvas-soft)", 
                    borderRight: dIdx === 6 ? "none" : "1px solid var(--hairline)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    boxSizing: "border-box"
                  }}>
                    {day && (
                      <div style={{ 
                        fontSize: "12px", 
                        fontWeight: 600, 
                        color: dIdx === 0 ? "var(--red)" : (dIdx === 6 ? "var(--text-link)" : "var(--ink)"),
                        marginBottom: "6px"
                      }}>
                        {day}
                      </div>
                    )}
                    {daySchedules.map((s) => (
                      <div key={s.id} onClick={() => setDetailSchedule(s)}
                        style={{
                          background: "var(--gradient-sky-light)",
                          border: "1px solid var(--text-link)",
                          borderRadius: "var(--rounded-sm)",
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--text-link)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          transition: "all 0.15s"
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = "#b3d7ff"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "var(--gradient-sky-light)"; }}
                        title={s.course}>
                        🎓 {s.course}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 일정 상세 레이어 팝업 */}
      {detailSchedule && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.4)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface-card)", borderRadius: "var(--rounded-lg)", padding: "28px", width: "100%", maxWidth: "440px", boxShadow: shadowLg, border: "1px solid var(--hairline)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline)", paddingBottom: "12px", marginBottom: "16px" }}>
              <strong style={{ fontSize: "13px", color: "var(--text-link)" }}>📅 교육 일정 상세</strong>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>{detailSchedule.date}</span>
            </div>
            <h4 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", margin: "0 0 12px 0" }}>{detailSchedule.course}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, display: "block" }}>수강 권장 대상</span>
                <span style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 500 }}>{detailSchedule.target}</span>
              </div>
              {detailSchedule.description && (
                <div>
                  <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, display: "block" }}>교육 개요 및 내용</span>
                  <p style={{ fontSize: "13px", color: "var(--body)", lineHeight: "1.6", margin: "4px 0 0 0", whiteSpace: "pre-line" }}>{detailSchedule.description}</p>
                </div>
              )}
            </div>
            <button onClick={() => setDetailSchedule(null)} style={{ width: "100%", padding: "12px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── [RegisterForm] 회원가입 컴포넌트 ──
function RegisterForm({ regForm, setRegForm, handleRegister, authErr, deptData, jobTypes }) {
  const companyOptions = deptData.map(c => c.company);
  const selectedCompObj = deptData.find(c => c.company === regForm.company);
  const divisionOptions = selectedCompObj ? selectedCompObj.divisions.map(d => d.name) : [];
  const selectedDivObj = selectedCompObj ? selectedCompObj.divisions.find(d => d.name === regForm.division) : null;
  const teamOptions = selectedDivObj ? selectedDivObj.teams.map(t => t.name) : [];

  return (
    <div>
      <h3 style={{ fontSize: "22px", fontWeight: 600, color: "var(--ink)", marginBottom: "20px", textAlign: "center", letterSpacing: "-0.5px" }}>TUNE 회원가입</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>이름 *</label>
          <input type="text" value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} placeholder="홍길동" style={inpStyle({ padding: "8px 12px" })} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>이메일 주소 *</label>
          <input type="email" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} placeholder="username@okestro.com" style={inpStyle({ padding: "8px 12px" })} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>비밀번호 *</label>
          <input type="password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} placeholder="비밀번호 설정" style={inpStyle({ padding: "8px 12px" })} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>임직원 구분 *</label>
          <select value={regForm.userType} onChange={e => setRegForm({ ...regForm, userType: e.target.value })} style={inpStyle({ padding: "8px 12px" })}>
            <option value="company">사내 임직원 (가입 즉시 자동 승인)</option>
            <option value="partner">파트너사 임직원 (어드민 가입 승인 대기)</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>소속 회사 *</label>
          <select value={regForm.company} onChange={e => setRegForm({ ...regForm, company: e.target.value, division: "", team: "" })} style={inpStyle({ padding: "8px 12px" })}>
            <option value="">선택하세요</option>
            {companyOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>소속 본부/부서 *</label>
          <select value={regForm.division} onChange={e => setRegForm({ ...regForm, division: e.target.value, team: "" })} style={inpStyle({ padding: "8px 12px" })} disabled={!regForm.company}>
            <option value="">선택하세요</option>
            {divisionOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>소속 팀 *</label>
          <select value={regForm.team} onChange={e => setRegForm({ ...regForm, team: e.target.value })} style={inpStyle({ padding: "8px 12px" })} disabled={!regForm.division}>
            <option value="">선택하세요</option>
            {teamOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>직군 *</label>
          <select value={regForm.jobType} onChange={e => setRegForm({ ...regForm, jobType: e.target.value })} style={inpStyle({ padding: "8px 12px" })}>
            <option value="">선택하세요</option>
            {jobTypes.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
      </div>
      {authErr && <div style={{ fontSize: "13px", color: "var(--semantic-error)", fontWeight: 500, margin: "8px 0" }}>⚠️ {authErr}</div>}
      <button onClick={handleRegister}
        style={{ 
          width: '100%', 
          padding: '12px', 
          marginTop: '16px',
          background: 'var(--primary)', 
          color: 'var(--on-primary)', 
          border: 'none', 
          borderRadius: 'var(--rounded-md)', 
          fontSize: '14px', 
          fontWeight: 500, 
          cursor: 'pointer',
          transition: 'background 0.15s' 
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "var(--primary-active)"}
        onMouseOut={(e) => e.currentTarget.style.background = "var(--primary)"}
      >
        가입 신청 완료
      </button>
    </div>
  );
}

// ── [ClassroomView] 나의 강의실 ──
function ClassroomView({ courses, applications, viewLogs, currentUser, saveApplications, selectedCourse, setSelectedCourse, saveViewLogs }) {
  const myApps = applications.filter(a => a.email === currentUser.email);

  const handleApplyCourse = async (courseId) => {
    if (applications.some(a => a.email === currentUser.email && a.courseId === courseId)) {
      alert("이미 신청한 과정입니다.");
      return;
    }
    const newApp = {
      id: uid(),
      email: currentUser.email,
      courseId,
      status: currentUser.userType === "company" ? "approved" : "pending",
      appliedAt: new Date().toISOString()
    };
    const updated = [newApp, ...applications];
    await saveApplications(updated);
    
    if (newApp.status === "approved") {
      alert("수강 확정되었습니다! 학습창에서 즉시 동영상 재생이 가능합니다.");
    } else {
      alert("수강 신청되었습니다. 관리자 승인 완료 후 동영상 학습이 가능합니다.");
    }
    // GNB 동기화 발생
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box", display: "flex", gap: "24px", flexWrap: "wrap" }}>
      {/* 좌측 강좌 리스트 */}
      <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0 }}>
        <div style={{ padding: "20px", background: "var(--surface-card)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", boxShadow: shadow }}>
          <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>📚 개설 교육 과정</h4>
          <span style={{ fontSize: "12px", color: "var(--body)" }}>수강 가능하거나 신청 완료된 강좌 목록입니다.</span>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {courses.map(c => {
            const matchedApp = myApps.find(a => a.courseId === c.id);
            const isSelected = selectedCourse?.id === c.id;
            return (
              <div key={c.id} onClick={() => setSelectedCourse(c)}
                style={{
                  padding: "16px",
                  background: isSelected ? "var(--canvas-soft)" : "var(--surface-card)",
                  border: `1px solid ${isSelected ? "var(--primary)" : "var(--hairline-strong)"}`,
                  borderRadius: "var(--rounded-lg)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxSizing: "border-box"
                }}>
                <h5 style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: "0 0 6px 0" }}>{c.title}</h5>
                <p style={{ fontSize: "12px", color: "var(--body)", lineHeight: "1.4", margin: "0 0 12px 0", height: "34px", overflow: "hidden" }}>{c.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>수강 상태</span>
                  {matchedApp ? (
                    <span style={{ fontSize: "11px", fontWeight: 600, color: matchedApp.status === "completed" ? "var(--green)" : (matchedApp.status === "approved" ? "var(--text-link)" : "var(--amber)") }}>
                      {matchedApp.status === "completed" ? "✓ 완료" : (matchedApp.status === "approved" ? "▶ 학습중" : "⌛ 대기")}
                    </span>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleApplyCourse(c.id); }} 
                      style={{ 
                        padding: "4px 8px", 
                        background: "var(--canvas)", 
                        border: `1px solid var(--hairline-strong)`, 
                        borderRadius: "var(--rounded-sm)", 
                        fontSize: "11px", 
                        color: "var(--ink)", 
                        cursor: "pointer", 
                        fontWeight: 600 
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--hairline-strong)"}
                    >
                      수강 신청
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 우측 비디오 학습 공간 */}
      <div style={{ flex: 1, background: "var(--surface-card)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "24px", boxShadow: shadow, minWidth: "400px" }}>
        {selectedCourse ? (
          <VideoPlayer course={selectedCourse} applications={applications} viewLogs={viewLogs} currentUser={currentUser} saveViewLogs={saveViewLogs} saveApplications={saveApplications} />
        ) : (
          <div style={{ height: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--body)" }}>
            <span style={{ fontSize: "40px" }}>📺</span>
            <div style={{ fontSize: "15px", fontWeight: 600, marginTop: "12px", color: "var(--ink)" }}>수강할 교육 과정을 선택해주세요.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── [VideoPlayer] 영상 플레이어 ──
function VideoPlayer({ course, applications, viewLogs, currentUser, saveViewLogs, saveApplications }) {
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [btnActive, setBtnActive] = useState(false);

  const matchedApp = applications.find(a => a.email === currentUser.email && a.courseId === course.id);
  const isApproved = matchedApp?.status === "approved";
  const isAlreadyCompleted = viewLogs.some(log => log.email === currentUser.email && log.courseId === course.id);

  const getYoutubeId = (url) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch { return null; }
  };
  const videoId = getYoutubeId(course.youtubeUrl);

  useEffect(() => {
    setBtnActive(false);
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (isAlreadyCompleted) {
      setBtnActive(true);
      setProgress(100);
    }
  }, [course, isAlreadyCompleted]);

  useEffect(() => {
    if (!videoId || !isApproved || isAlreadyCompleted) return;
    let player;
    const checkPlayProgress = () => {
      if (player && typeof player.getCurrentTime === "function" && typeof player.getDuration === "function") {
        const current = player.getCurrentTime();
        const duration = player.getDuration();
        if (duration > 0) {
          const ratio = (current / duration) * 100;
          setProgress(Math.min(ratio, 100));
          if (ratio >= 80) setBtnActive(true);
        }
      }
    };
    const initPlayer = () => {
      player = new window.YT.Player(`yt-player-${course.id}`, {
        videoId: videoId,
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              timerRef.current = setInterval(checkPlayProgress, 1000);
            } else {
              if (timerRef.current) clearInterval(timerRef.current);
            }
          }
        }
      });
      playerRef.current = player;
    };
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (player && typeof player.destroy === "function") {
        try { player.destroy(); } catch {}
      }
    };
  }, [course.id, videoId, isApproved, isAlreadyCompleted]);

  const handleCompleteWatch = async () => {
    const newLog = {
      id: uid(),
      email: currentUser.email,
      courseId: course.id,
      completed: true,
      completedAt: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...viewLogs];
    await saveViewLogs(updatedLogs);

    const updatedApps = applications.map(a => 
      a.email === currentUser.email && a.courseId === course.id ? { ...a, status: "completed" } : a
    );
    await saveApplications(updatedApps);
    alert("✓ 비디오 학습 인정 완료! 마이페이지에서 수료 내역 확인이 가능합니다.");
    setBtnActive(true);
    setProgress(100);
  };

  if (!isApproved && !isAlreadyCompleted) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <span style={{ fontSize: "40px" }}>🔒</span>
        <h4 style={{ fontSize: "16px", fontWeight: 600, marginTop: "12px", color: "var(--ink)" }}>수강 승인이 필요합니다</h4>
        <p style={{ fontSize: "13px", color: "var(--body)", margin: "8px 0 20px" }}>
          {matchedApp ? `(현재 진행 상태: ${matchedApp.status === "rejected" ? "❌ 반려됨" : "⌛ 승인 대기 중"})` : "좌측 목록에서 수강 신청을 눌러주세요."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: "22px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>{course.title}</h3>
      <p style={{ fontSize: "14px", color: "var(--body)", marginBottom: "16px" }}>{course.description}</p>
      <div style={{ width: "100%", height: "400px", borderRadius: "var(--rounded-lg)", overflow: "hidden", background: "#000", border: `1px solid var(--hairline-strong)` }}>
        {isAlreadyCompleted ? (
          <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title={course.title} frameBorder="0" allowFullScreen></iframe>
        ) : (
          <div id={`yt-player-${course.id}`} style={{ width: "100%", height: "100%" }}></div>
        )}
      </div>
      <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--body)", marginBottom: "6px" }}>
          <span>학습 진행도</span>
          <strong>{Math.floor(progress)}% (수료 기준: 80%)</strong>
        </div>
        <div style={{ width: "100%", height: "8px", background: "var(--canvas-soft)", borderRadius: "var(--rounded-sm)", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: progress >= 80 ? "var(--green)" : "var(--text-link)" }}></div>
        </div>
      </div>
      <button onClick={handleCompleteWatch} disabled={!btnActive || isAlreadyCompleted}
        style={{ 
          width: "100%", 
          padding: "14px", 
          marginTop: "20px", 
          border: "none", 
          borderRadius: "var(--rounded-md)", 
          cursor: (!btnActive || isAlreadyCompleted) ? "not-allowed" : "pointer", 
          background: isAlreadyCompleted ? "var(--green)" : (btnActive ? "var(--primary)" : "var(--surface-strong)"), 
          color: isAlreadyCompleted ? "#fff" : (btnActive ? "var(--on-primary)" : "var(--body)"), 
          fontSize: "14px", 
          fontWeight: 600 
        }}>
        {isAlreadyCompleted ? "✓ 교육 수료 완료" : (btnActive ? "학습 완료 및 수료 인정" : "비디오의 80% 이상을 시청해야 완료할 수 있습니다")}
      </button>
    </div>
  );
}

// ── [NoticeView] 공지사항 게시판 ──
function NoticeView({ notices, saveNotices }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNoticeClick = async (n) => {
    setSelectedNotice(n);
    const updated = notices.map(item => 
      item.id === n.id ? { ...item, hits: (item.hits || 0) + 1 } : item
    );
    await saveNotices(updated);
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "32px", boxShadow: shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 style={{ fontSize: "28px", fontWeight: 600, color: "var(--ink)", margin: "0 0 8px 0", letterSpacing: "-0.84px" }}>📢 공지사항 게시판</h3>
            <p style={{ fontSize: "14px", color: "var(--body)", margin: 0 }}>오케스트로 아카데미의 최신 공지 및 새 소식을 전해드립니다.</p>
          </div>
          <div style={{ position: "relative", width: "240px" }}>
            <input 
              type="text" 
              placeholder="제목, 내용 검색..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={inpStyle({ padding: "8px 12px", fontSize: "13px" })} 
            />
          </div>
        </div>

        {selectedNotice ? (
          <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline-strong)", paddingBottom: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "var(--body)" }}>작성자: {selectedNotice.author} | 작성일: {selectedNotice.date} | 조회수: {selectedNotice.hits + 1}</span>
              <button 
                onClick={() => setSelectedNotice(null)} 
                style={{ padding: "4px 10px", background: "none", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-md)", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}
              >
                목록으로 돌아가기
              </button>
            </div>
            <h4 style={{ fontSize: "20px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>{selectedNotice.title}</h4>
            <div style={{ fontSize: "14px", color: "var(--ink)", lineHeight: "1.6", whiteSpace: "pre-line" }}>
              {selectedNotice.content}
            </div>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "var(--canvas-soft)", borderBottom: "1.5px solid var(--hairline-strong)", textAlign: "left" }}>
                  <th style={{ padding: "12px", width: "80px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>번호</th>
                  <th style={{ padding: "12px", color: "var(--ink)", fontWeight: 600 }}>제목</th>
                  <th style={{ padding: "12px", width: "120px", color: "var(--ink)", fontWeight: 600 }}>작성자</th>
                  <th style={{ padding: "12px", width: "120px", color: "var(--ink)", fontWeight: 600 }}>작성일</th>
                  <th style={{ padding: "12px", width: "100px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>조회수</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotices.map((n, idx) => (
                  <tr key={n.id} onClick={() => handleNoticeClick(n)} style={{ borderBottom: "1px solid var(--hairline)", cursor: "pointer" }} onMouseOver={e => e.currentTarget.style.background = "var(--canvas-soft)"} onMouseOut={e => e.currentTarget.style.background = "none"}>
                    <td style={{ padding: "12px", textAlign: "center", color: "var(--body)" }}>{filteredNotices.length - idx}</td>
                    <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{n.title}</td>
                    <td style={{ padding: "12px", color: "var(--body)" }}>{n.author}</td>
                    <td style={{ padding: "12px", color: "var(--body)" }}>{n.date}</td>
                    <td style={{ padding: "12px", textAlign: "center", color: "var(--body)" }}>{n.hits || 0}</td>
                  </tr>
                ))}
                {filteredNotices.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>검색 결과가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── [FaqView] FAQ 게시판 ──
function FaqView({ faqs }) {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openFaqId, setOpenFaqId] = useState(null);

  const categories = ["전체", "학습/수강", "수료 기준", "기타"];

  const filteredFaqs = activeCategory === "전체" 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory);

  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "32px", boxShadow: shadow }}>
        <h3 style={{ fontSize: "28px", fontWeight: 600, color: "var(--ink)", margin: "0 0 8px 0", letterSpacing: "-0.84px" }}>❓ 자주 묻는 질문 (FAQ)</h3>
        <p style={{ fontSize: "14px", color: "var(--body)", marginBottom: "24px" }}>아카데미 수강생분들이 자주 묻는 질문과 답변을 모아두었습니다.</p>

        {/* 카테고리 필터링 탭 */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1.5px solid var(--hairline-strong)", paddingBottom: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenFaqId(null); }}
              style={{
                padding: "8px 16px",
                border: "none",
                background: activeCategory === cat ? "var(--primary)" : "none",
                color: activeCategory === cat ? "var(--on-primary)" : "var(--body)",
                fontWeight: 600,
                borderRadius: "var(--rounded-md)",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 아코디언 FAQ 목록 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredFaqs.map(faq => {
            const isOpen = openFaqId === faq.id;
            return (
              <div 
                key={faq.id} 
                style={{ 
                  border: "1px solid var(--hairline-strong)", 
                  borderRadius: "var(--rounded-md)", 
                  overflow: "hidden", 
                  background: isOpen ? "var(--canvas-soft)" : "var(--canvas)",
                  transition: "background 0.15s"
                }}
              >
                {/* 질문 헤더 */}
                <div 
                  onClick={() => toggleFaq(faq.id)} 
                  style={{ 
                    padding: "16px 20px", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    cursor: "pointer", 
                    userSelect: "none" 
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-link)", background: "rgba(13, 116, 206, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>{faq.category}</span>
                    <strong style={{ fontSize: "15px", color: "var(--ink)", fontWeight: 600 }}>Q. {faq.question}</strong>
                  </div>
                  <span style={{ fontSize: "16px", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", color: "var(--body)" }}>
                    ▼
                  </span>
                </div>

                {/* 답변 바디 */}
                {isOpen && (
                  <div 
                    style={{ 
                      padding: "16px 20px", 
                      borderTop: "1px solid var(--hairline-strong)", 
                      background: "var(--canvas)", 
                      fontSize: "14px", 
                      color: "var(--body)", 
                      lineHeight: "1.6",
                      whiteSpace: "pre-line"
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
          {filteredFaqs.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", border: "1px dashed var(--hairline-strong)", borderRadius: "var(--rounded-lg)" }}>
              등록된 질문이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── [MyPageView] 마이페이지 트래커 ──
function MyPageView({ applications, courses, checkAccess, setSelectedCourse }) {
  const currentUser = JSON.parse(sessionStorage.getItem("aida:lms_login") || "null");
  const myApps = applications.filter(a => a.email === currentUser?.email);

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "32px", boxShadow: shadow }}>
        <h3 style={{ fontSize: "28px", fontWeight: 600, color: "var(--ink)", marginBottom: "8px", letterSpacing: "-0.84px" }}>👤 나의 학습 마이페이지</h3>
        <p style={{ fontSize: "14px", color: "var(--body)", marginBottom: "24px" }}>수강 신청하신 강좌들의 상태 및 진도 이력을 관리합니다.</p>
        
        {myApps.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--body)", border: `1.5px dashed var(--hairline-strong)`, borderRadius: "var(--rounded-lg)" }}>
            신청된 과정이 없습니다.
          </div>
        )}
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {myApps.map(app => {
            const course = courses.find(c => c.id === app.courseId);
            if (!course) return null;
            const steps = ["pending", "approved", "studying", "completed"];
            const currentIdx = steps.indexOf(app.status);
            const isRejected = app.status === "rejected";
            return (
              <div key={app.id} style={{ border: `1px solid ${isRejected ? "var(--red)" : "var(--hairline-strong)"}`, borderRadius: "var(--rounded-lg)", padding: "20px", background: "var(--canvas-soft)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>{course.title}</h4>
                    <div style={{ fontSize: "12px", color: "var(--body)", marginTop: "2px" }}>신청: {new Date(app.appliedAt).toLocaleString()}</div>
                  </div>
                  {app.status === "approved" && (
                    <button onClick={() => { setSelectedCourse(course); checkAccess("classroom"); }} style={{ padding: "6px 12px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}>강의실 입장 ➔</button>
                  )}
                </div>
                {isRejected ? (
                  <div style={{ background: "rgba(235, 142, 144, 0.1)", border: "1px solid var(--red)", color: "var(--red)", padding: "12px", borderRadius: "var(--rounded-md)", fontSize: "13px" }}>
                    ❌ 반려됨 (사유: {app.rejectReason})
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", position: "relative", marginTop: "12px" }}>
                    {[
                      { label: "신청 대기", code: "pending" },
                      { label: "수강 확정", code: "approved" },
                      { label: "학습 중", code: "studying" },
                      { label: "수료/종료", code: "completed" }
                    ].map((step, sIdx) => {
                      const isActive = sIdx <= currentIdx;
                      const isCurrent = sIdx === currentIdx;
                      return (
                        <div key={step.code} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
                          <div style={{ 
                            width: "32px", 
                            height: "32px", 
                            borderRadius: "50%", 
                            background: isCurrent ? "var(--primary)" : (isActive ? "var(--surface-strong)" : "var(--canvas)"), 
                            border: `2px solid ${isActive ? "var(--primary)" : "var(--hairline-strong)"}`, 
                            color: isCurrent ? "#fff" : (isActive ? "var(--ink)" : "var(--body)"), 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            fontSize: "12px", 
                            fontWeight: 700, 
                            marginBottom: "6px" 
                          }}>{sIdx + 1}</div>
                          <span style={{ fontSize: "12px", color: isCurrent ? "var(--primary)" : (isActive ? "var(--ink)" : "var(--body)") }}>{step.label}</span>
                        </div>
                      );
                    })}
                    <div style={{ position: "absolute", top: "16px", left: "12.5%", right: "12.5%", height: "2px", background: "var(--hairline-strong)", zIndex: 1 }} />
                    <div style={{ position: "absolute", top: "16px", left: "12.5%", width: `${currentIdx * 25}%`, height: "2px", background: "var(--primary)", zIndex: 1 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BackOfficeView({ 
  users, saveUsers, 
  courses, saveCourses, 
  applications, saveApplications, 
  viewLogs, deptData, jobTypes,
  pageConfig, savePageConfig,
  schedules, saveSchedules,
  notices, saveNotices,
  faqs, saveFaqs,
  eduCourses = [], saveEduCourses,
  eduRegistrations = [], saveEduRegistrations,
  eduInfoBlocks, saveEduInfoBlocks,
  eduEmailRecipients = [], saveEduEmailRecipients,
  eduConfig, saveEduConfig
}) {
  const [backTab, setBackTab] = useState("apply");
  const [courseForm, setCourseForm] = useState({ title: "", description: "", youtubeUrl: "" });
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReasonText, setRejectReasonText] = useState("");

  // 신청 교육 CRUD 폼 상태
  const [eduCourseForm, setEduCourseForm] = useState({
    id: "",
    target: "Customer",
    abbr: "AI",
    seq: "1",
    name: "",
    dateStart: "",
    dateEnd: "",
    time: "13:00-18:00",
    location: "여의도 파크원타워2 43층 대회의실",
    status: "Available",
    overview: "",
    recommendedAudience: "",
    objectives: "",
    teachingMethod: "",
    curriculum: "",
    prerequisites: "",
    notices: ""
  });
  const [editingEduCourseId, setEditingEduCourseId] = useState(null);
  const [showEduCourseFormModal, setShowEduCourseFormModal] = useState(false);

  // 신청 운영/연동 설정 상태
  const [adminInfoBlocks, setAdminInfoBlocks] = useState({
    registration: eduInfoBlocks?.registration || "",
    coupon: eduInfoBlocks?.coupon || "",
    cancellation: eduInfoBlocks?.cancellation || ""
  });
  const [adminEmailRecipients, setAdminEmailRecipients] = useState(
    eduEmailRecipients ? eduEmailRecipients.join(", ") : ""
  );
  const [adminGasUrl, setAdminGasUrl] = useState(eduConfig?.googleSheetsScriptUrl || "");

  // 동기화 useEffect들
  useEffect(() => {
    if (eduInfoBlocks) {
      setAdminInfoBlocks({
        registration: eduInfoBlocks.registration || "",
        coupon: eduInfoBlocks.coupon || "",
        cancellation: eduInfoBlocks.cancellation || ""
      });
    }
  }, [eduInfoBlocks]);

  useEffect(() => {
    if (eduEmailRecipients) {
      setAdminEmailRecipients(eduEmailRecipients.join(", "));
    }
  }, [eduEmailRecipients]);

  useEffect(() => {
    if (eduConfig) {
      setAdminGasUrl(eduConfig.googleSheetsScriptUrl || "");
    }
  }, [eduConfig]);

  // 코드 생성 도우미
  const genCode = (tgt, abbr, seq) => {
    const tChar = tgt === "Customer" ? "C" : (tgt === "Partner" ? "P" : "E");
    const aStr = (abbr || "XX").slice(0, 2).toUpperCase();
    const sStr = seq || "1";
    return `OK-${tChar}${aStr}${sStr}`;
  };

  const handleSaveEduCourse = async () => {
    const {
      id, target, abbr, seq, name, dateStart, dateEnd, time, location, status, overview,
      recommendedAudience, objectives, teachingMethod, curriculum, prerequisites, notices
    } = eduCourseForm;

    if (!name.trim() || !dateStart || !time.trim() || !location.trim() || !overview.trim()) {
      alert("필수 입력 항목을 모두 작성해주세요.");
      return;
    }

    const courseCode = editingEduCourseId ? id : genCode(target, abbr, seq);

    const parseBullets = (text) => {
      return text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    };

    const newCourse = {
      id: courseCode,
      target,
      name: name.trim(),
      dateStart,
      dateEnd: dateEnd ? dateEnd : null,
      time: time.trim(),
      location: location.trim(),
      status: target === "Partner" ? "Separate Notice" : status,
      overview: overview.trim(),
      recommendedAudience: parseBullets(recommendedAudience),
      objectives: parseBullets(objectives),
      teachingMethod: parseBullets(teachingMethod),
      curriculum: parseBullets(curriculum),
      prerequisites: parseBullets(prerequisites),
      notices: parseBullets(notices),
      createdAt: new Date().toISOString()
    };

    let updated;
    if (editingEduCourseId) {
      updated = eduCourses.map(c => c.id === editingEduCourseId ? newCourse : c);
      alert("교육과정이 수정되었습니다.");
    } else {
      if (eduCourses.some(c => c.id === courseCode)) {
        alert("이미 동일한 과정 코드가 등록되어 있습니다. 고유 식별 번호를 확인해주세요.");
        return;
      }
      updated = [newCourse, ...eduCourses];
      alert("교육과정이 개설되었습니다.");
    }

    await saveEduCourses(updated);
    setShowEduCourseFormModal(false);
    setEditingEduCourseId(null);
    setEduCourseForm({
      id: "", target: "Customer", abbr: "AI", seq: "1", name: "", dateStart: "", dateEnd: "",
      time: "13:00-18:00", location: "여의도 파크원타워2 43층 대회의실", status: "Available",
      overview: "", recommendedAudience: "", objectives: "", teachingMethod: "", curriculum: "",
      prerequisites: "", notices: ""
    });
  };

  const handleEditEduCourse = (c) => {
    const joinBullets = (arr) => arr ? arr.join("\n") : "";
    
    let parsedAbbr = "AI";
    let parsedSeq = "1";
    if (c.id && c.id.startsWith("OK-")) {
      const remainder = c.id.slice(4); 
      parsedAbbr = remainder.slice(0, 2);
      parsedSeq = remainder.slice(2);
    }

    setEduCourseForm({
      id: c.id,
      target: c.target,
      abbr: parsedAbbr,
      seq: parsedSeq,
      name: c.name,
      dateStart: c.dateStart,
      dateEnd: c.dateEnd || "",
      time: c.time,
      location: c.location,
      status: c.status,
      overview: c.overview,
      recommendedAudience: joinBullets(c.recommendedAudience),
      objectives: joinBullets(c.objectives),
      teachingMethod: joinBullets(c.teachingMethod),
      curriculum: joinBullets(c.curriculum),
      prerequisites: joinBullets(c.prerequisites),
      notices: joinBullets(c.notices)
    });
    setEditingEduCourseId(c.id);
    setShowEduCourseFormModal(true);
  };

  const handleDeleteEduCourse = async (id) => {
    if (!window.confirm("이 교육과정을 삭제하시겠습니까? 관련 수강신청 정보는 보존되지만 과정이 조회되지 않게 됩니다.")) return;
    const updated = eduCourses.filter(c => c.id !== id);
    await saveEduCourses(updated);
    alert("삭제되었습니다.");
  };

  const handleSaveSettings = async () => {
    try {
      const emailList = adminEmailRecipients
        .split(",")
        .map(email => email.trim())
        .filter(email => email.length > 0 && email.includes("@"));

      await saveEduInfoBlocks(adminInfoBlocks);
      await saveEduEmailRecipients(emailList);
      await saveEduConfig({ googleSheetsScriptUrl: adminGasUrl.trim() });
      
      alert("교육신청 운영 및 연동 설정이 정상적으로 저장되었습니다.");
    } catch (err) {
      alert("설정 저장에 실패했습니다: " + err.message);
    }
  };

  // 신규 등록용 스케줄 폼 상태
  const [scheduleForm, setScheduleForm] = useState({ course: "", date: "", target: "", description: "" });
  const [adminYear, setAdminYear] = useState(2026);
  const [adminMonth, setAdminMonth] = useState(5); // 5 = June

  // 페이지 꾸미기 상태
  const [customTitle, setCustomTitle] = useState(pageConfig?.heroTitle || "AIDA TUNE");
  const [customSubtitle, setCustomSubtitle] = useState(pageConfig?.heroSubtitle || "");
  const [customBadge, setCustomBadge] = useState(pageConfig?.heroBadge || "");
  const [customBgPreset, setCustomBgPreset] = useState(pageConfig?.heroBgPreset || "sky");

  // 공지사항 관리 폼 상태 및 핸들러
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "" });
  const [editingNoticeId, setEditingNoticeId] = useState(null);

  const handleSaveNotice = async () => {
    const { title, content } = noticeForm;
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }
    if (editingNoticeId) {
      const updated = notices.map(n => 
        n.id === editingNoticeId ? { ...n, title: title.trim(), content: content.trim() } : n
      );
      await saveNotices(updated);
      alert("공지사항이 수정되었습니다.");
      setEditingNoticeId(null);
    } else {
      const newNotice = {
        id: uid(),
        title: title.trim(),
        content: content.trim(),
        date: new Date().toISOString().slice(0, 10),
        author: "관리자",
        hits: 0
      };
      await saveNotices([newNotice, ...notices]);
      alert("공지사항이 등록되었습니다.");
    }
    setNoticeForm({ title: "", content: "" });
  };

  const handleEditNotice = (n) => {
    setNoticeForm({ title: n.title, content: n.content });
    setEditingNoticeId(n.id);
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm("이 공지사항을 삭제하시겠습니까?")) return;
    const updated = notices.filter(n => n.id !== id);
    await saveNotices(updated);
    alert("공지사항이 삭제되었습니다.");
    if (editingNoticeId === id) {
      setEditingNoticeId(null);
      setNoticeForm({ title: "", content: "" });
    }
  };

  // FAQ 관리 폼 상태 및 핸들러
  const [faqForm, setFaqForm] = useState({ category: "학습/수강", question: "", answer: "" });
  const [editingFaqId, setEditingFaqId] = useState(null);

  const handleSaveFaq = async () => {
    const { category, question, answer } = faqForm;
    if (!question.trim() || !answer.trim()) {
      alert("질문과 답변을 입력해주세요.");
      return;
    }
    if (editingFaqId) {
      const updated = faqs.map(f => 
        f.id === editingFaqId ? { ...f, category, question: question.trim(), answer: answer.trim() } : f
      );
      await saveFaqs(updated);
      alert("FAQ가 수정되었습니다.");
      setEditingFaqId(null);
    } else {
      const newFaq = {
        id: uid(),
        category,
        question: question.trim(),
        answer: answer.trim()
      };
      await saveFaqs([newFaq, ...faqs]);
      alert("FAQ가 등록되었습니다.");
    }
    setFaqForm({ category: "학습/수강", question: "", answer: "" });
  };

  const handleEditFaq = (f) => {
    setFaqForm({ category: f.category, question: f.question, answer: f.answer });
    setEditingFaqId(f.id);
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm("이 FAQ를 삭제하시겠습니까?")) return;
    const updated = faqs.filter(f => f.id !== id);
    await saveFaqs(updated);
    alert("FAQ가 삭제되었습니다.");
    if (editingFaqId === id) {
      setEditingFaqId(null);
      setFaqForm({ category: "학습/수강", question: "", answer: "" });
    }
  };

  useEffect(() => {
    if (pageConfig) {
      setCustomTitle(pageConfig.heroTitle || "AIDA TUNE");
      setCustomSubtitle(pageConfig.heroSubtitle || "");
      setCustomBadge(pageConfig.heroBadge || "");
      setCustomBgPreset(pageConfig.heroBgPreset || "sky");
    }
  }, [pageConfig]);

  const handleApprove = async (appId) => {
    const updated = applications.map(a => a.id === appId ? { ...a, status: "approved", approvedAt: new Date().toISOString() } : a);
    await saveApplications(updated);
    alert("수강 신청을 승인했습니다.");
  };

  const handleRejectSubmit = async () => {
    if (!rejectReasonText.trim()) return;
    const updated = applications.map(a => a.id === rejectModal.id ? { ...a, status: "rejected", rejectReason: rejectReasonText.trim() } : a);
    await saveApplications(updated);
    alert("반려 처리되었습니다.");
    setRejectModal(null);
    setRejectReasonText("");
  };

  const handleRegisterApprove = async (userId) => {
    const updated = users.map(u => u.id === userId ? { ...u, approved: true } : u);
    await saveUsers(updated);
    alert("가입 승인했습니다.");
  };

  const handleRegisterDelete = async (userId) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    const updated = users.filter(u => u.id !== userId);
    await saveUsers(updated);
    alert("삭제되었습니다.");
  };

  const handleCreateCourse = async () => {
    const { title, description, youtubeUrl } = courseForm;
    if (!title.trim() || !description.trim() || !youtubeUrl.trim()) return;
    const newCourse = { id: uid(), title: title.trim(), description: description.trim(), youtubeUrl: youtubeUrl.trim(), createdAt: new Date().toISOString() };
    await saveCourses([newCourse, ...courses]);
    alert("강좌 개설되었습니다.");
    setCourseForm({ title: "", description: "", youtubeUrl: "" });
  };

  // 일정 등록 및 삭제 핸들러
  const handleCreateSchedule = async () => {
    const { course, date, target, description } = scheduleForm;
    if (!course.trim() || !date || !target.trim()) {
      alert("교육일자, 교육 과정명, 권장 대상을 모두 기입해주세요.");
      return;
    }
    const newSchedule = {
      id: uid(),
      course: course.trim(),
      date,
      target: target.trim(),
      description: description.trim()
    };
    const updated = [newSchedule, ...schedules];
    await saveSchedules(updated);
    alert("교육 일정을 등록하였습니다.");
    setScheduleForm({ course: "", date: "", target: "", description: "" });
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("이 교육 일정을 삭제하시겠습니까?")) return;
    const updated = schedules.filter(s => s.id !== id);
    await saveSchedules(updated);
    alert("삭제되었습니다.");
  };

  // 페이지 꾸미기 저장 핸들러
  const handleSavePageConfig = async () => {
    const newConfig = {
      heroTitle: customTitle.trim(),
      heroSubtitle: customSubtitle.trim(),
      heroBadge: customBadge.trim(),
      heroBgPreset: customBgPreset
    };
    await savePageConfig(newConfig);
    alert("소개 페이지 커스텀 설정이 저장되었습니다.");
  };

  // 미니 달력 그리드 계산기
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(adminYear, adminMonth);
  const firstDay = getFirstDayOfMonth(adminYear, adminMonth);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const rows = [];
  let row = [];
  cells.forEach((cell) => {
    row.push(cell);
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  });
  if (row.length > 0) {
    while (row.length < 7) row.push(null);
    rows.push(row);
  }

  const handlePrevMonth = () => {
    if (adminMonth === 0) {
      setAdminMonth(11);
      setAdminYear(adminYear - 1);
    } else {
      setAdminMonth(adminMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (adminMonth === 11) {
      setAdminMonth(0);
      setAdminYear(adminYear + 1);
    } else {
      setAdminMonth(adminMonth + 1);
    }
  };

  return (
    <div style={{ background: "var(--canvas)", borderRadius: "var(--rounded-lg)", padding: "32px", border: `1px solid var(--hairline-strong)`, boxShadow: shadow }}>
      {/* 어드민 탭 헤더 */}
      <div style={{ display: "flex", gap: "10px", borderBottom: `1.5px solid var(--hairline-strong)`, paddingBottom: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <button onClick={() => setBackTab("apply")} style={{ padding: "8px 16px", border: "none", background: backTab === "apply" ? "var(--primary)" : "none", color: backTab === "apply" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>수강 신청 승인</button>
        <button onClick={() => setBackTab("register")} style={{ padding: "8px 16px", border: "none", background: backTab === "register" ? "var(--primary)" : "none", color: backTab === "register" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>가입 승인</button>
        <button onClick={() => setBackTab("create")} style={{ padding: "8px 16px", border: "none", background: backTab === "create" ? "var(--primary)" : "none", color: backTab === "create" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>교육 개설</button>
        <button onClick={() => setBackTab("schedule")} style={{ padding: "8px 16px", border: "none", background: backTab === "schedule" ? "var(--primary)" : "none", color: backTab === "schedule" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>일정 관리</button>
        <button onClick={() => setBackTab("notice")} style={{ padding: "8px 16px", border: "none", background: backTab === "notice" ? "var(--primary)" : "none", color: backTab === "notice" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>공지사항 관리</button>
        <button onClick={() => setBackTab("faq")} style={{ padding: "8px 16px", border: "none", background: backTab === "faq" ? "var(--primary)" : "none", color: backTab === "faq" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>FAQ 관리</button>
        <button onClick={() => setBackTab("educourse")} style={{ padding: "8px 16px", border: "none", background: backTab === "educourse" ? "var(--primary)" : "none", color: backTab === "educourse" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>신청 과정 관리</button>
        <button onClick={() => setBackTab("decorator")} style={{ padding: "8px 16px", border: "none", background: backTab === "decorator" ? "var(--primary)" : "none", color: backTab === "decorator" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>페이지 꾸미기</button>
      </div>

      {backTab === "apply" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "var(--canvas-soft)", borderBottom: "2px solid var(--hairline-strong)", textAlign: "left" }}>
              <th style={{ padding: "12px", color: "var(--ink)", fontWeight: 600 }}>이메일</th>
              <th style={{ padding: "12px", color: "var(--ink)", fontWeight: 600 }}>과정명</th>
              <th style={{ padding: "12px", color: "var(--ink)", fontWeight: 600 }}>진행</th>
              <th style={{ padding: "12px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                <td style={{ padding: "12px" }}>{app.email}</td>
                <td style={{ padding: "12px" }}>{courses.find(c => c.id === app.courseId)?.title}</td>
                <td style={{ padding: "12px" }}>{app.status}</td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  {app.status === "pending" && (
                    <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                      <button onClick={() => handleApprove(app.id)} style={{ padding: "6px 12px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "12px", cursor: "pointer" }}>승인</button>
                      <button onClick={() => setRejectModal(app)} style={{ padding: "6px 12px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--red)", borderRadius: "var(--rounded-md)", fontSize: "12px", cursor: "pointer" }}>반려</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {backTab === "register" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "var(--canvas-soft)", borderBottom: "2px solid var(--hairline-strong)", textAlign: "left" }}>
              <th style={{ padding: "12px", color: "var(--ink)", fontWeight: 600 }}>이름</th>
              <th style={{ padding: "12px", color: "var(--ink)", fontWeight: 600 }}>이메일</th>
              <th style={{ padding: "12px", color: "var(--ink)", fontWeight: 600 }}>소속</th>
              <th style={{ padding: "12px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => !u.approved).map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                <td style={{ padding: "12px" }}>{u.name}</td>
                <td style={{ padding: "12px" }}>{u.email}</td>
                <td style={{ padding: "12px" }}>{u.company} / {u.division}</td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                    <button onClick={() => handleRegisterApprove(u.id)} style={{ padding: "6px 12px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "12px", cursor: "pointer" }}>승인</button>
                    <button onClick={() => handleRegisterDelete(u.id)} style={{ padding: "6px 12px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--red)", borderRadius: "var(--rounded-md)", fontSize: "12px", cursor: "pointer" }}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {backTab === "create" && (
        <div style={{ maxWidth: "480px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>제목</label>
            <input type="text" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} style={inpStyle()} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>설명</label>
            <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} style={{ ...inpStyle(), minHeight: "80px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>유튜브 링크</label>
            <input type="text" value={courseForm.youtubeUrl} onChange={e => setCourseForm({ ...courseForm, youtubeUrl: e.target.value })} style={inpStyle()} />
          </div>
          <button onClick={handleCreateCourse} 
            style={{ 
              padding: "12px", 
              background: "var(--primary)", 
              color: "var(--on-primary)", 
              border: "none", 
              borderRadius: "var(--rounded-md)", 
              cursor: "pointer", 
              fontWeight: 500,
              fontSize: "14px"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--primary-active)"}
            onMouseOut={(e) => e.currentTarget.style.background = "var(--primary)"}
          >
            강의 과정 등록
          </button>
        </div>
      )}

      {/* 일정 관리 탭 UI [NEW] */}
      {backTab === "schedule" && (
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          {/* 일정 등록 폼 및 리스트 */}
          <div style={{ flex: 1, minWidth: "360px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>📅 교육 일정 등록</h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--canvas-soft)", border: "1px solid var(--hairline)", padding: "20px", borderRadius: "var(--rounded-lg)" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>교육 일자 *</label>
                <input type="date" value={scheduleForm.date} onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })} style={inpStyle({ padding: "8px 12px" })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>교육 과정명 *</label>
                <input type="text" value={scheduleForm.course} onChange={e => setScheduleForm({ ...scheduleForm, course: e.target.value })} placeholder="예) AI Agent 설계 및 구축 실전" style={inpStyle({ padding: "8px 12px" })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>수강 권장 대상 *</label>
                <input type="text" value={scheduleForm.target} onChange={e => setScheduleForm({ ...scheduleForm, target: e.target.value })} placeholder="예) 사내 엔지니어 및 기획생" style={inpStyle({ padding: "8px 12px" })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>상세 설명</label>
                <textarea value={scheduleForm.description} onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })} placeholder="교육 내용 개요 기입" style={inpStyle({ padding: "8px 12px", minHeight: "60px", resize: "none" })} />
              </div>
              <button onClick={handleCreateSchedule} style={{ width: "100%", padding: "10px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>등록 완료</button>
            </div>

            {/* 일정 목록 테이블 */}
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: "16px 0 0 0" }}>📋 등록된 일정 리스트</h4>
            <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--canvas-soft)", borderBottom: "1px solid var(--hairline-strong)", textAlign: "left" }}>
                    <th style={{ padding: "10px", color: "var(--ink)", fontWeight: 600 }}>날짜</th>
                    <th style={{ padding: "10px", color: "var(--ink)", fontWeight: 600 }}>과정명</th>
                    <th style={{ padding: "10px", color: "var(--ink)", fontWeight: 600 }}>대상</th>
                    <th style={{ padding: "10px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(s => (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                      <td style={{ padding: "10px", color: "var(--ink)" }}>{s.date}</td>
                      <td style={{ padding: "10px", fontWeight: 600, color: "var(--ink)" }}>{s.course}</td>
                      <td style={{ padding: "10px", color: "var(--body)" }}>{s.target}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <button onClick={() => handleDeleteSchedule(s.id)} style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--red)", borderRadius: "var(--rounded-sm)", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>삭제</button>
                      </td>
                    </tr>
                  ))}
                  {schedules.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>등록된 교육 일정이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 어드민 미니 달력 미리보기 */}
          <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>📅 달력 미리보기</h4>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button onClick={handlePrevMonth} style={{ padding: "2px 6px", background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>&lt;</button>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>{adminYear}. {adminMonth + 1}</span>
                <button onClick={handleNextMonth} style={{ padding: "2px 6px", background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>&gt;</button>
              </div>
            </div>

            <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", overflow: "hidden", background: "var(--surface-card)" }}>
              {/* 요일 헤더 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--hairline-strong)", padding: "6px 0", textAlign: "center", fontWeight: 600, fontSize: "11px", color: "var(--body)" }}>
                <div style={{ color: "var(--red)" }}>일</div>
                <div>월</div>
                <div>화</div>
                <div>수</div>
                <div>목</div>
                <div>금</div>
                <div style={{ color: "var(--text-link)" }}>토</div>
              </div>
              {/* 날짜 그리드 */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {rows.map((r, rIdx) => (
                  <div key={rIdx} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: rIdx === rows.length - 1 ? "none" : "1px solid var(--hairline)", minHeight: "45px" }}>
                    {r.map((day, dIdx) => {
                      const dayStr = day ? `${adminYear}-${String(adminMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : "";
                      const hasEvent = day && schedules.some(s => s.date === dayStr);
                      return (
                        <div key={dIdx} style={{ 
                          padding: "4px", 
                          background: day ? "var(--surface-card)" : "var(--canvas-soft)", 
                          borderRight: dIdx === 6 ? "none" : "1px solid var(--hairline)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "space-between",
                          boxSizing: "border-box",
                          position: "relative"
                        }}>
                          {day && (
                            <span style={{ 
                              fontSize: "11px", 
                              fontWeight: 600, 
                              color: dIdx === 0 ? "var(--red)" : (dIdx === 6 ? "var(--text-link)" : "var(--ink)")
                            }}>
                              {day}
                            </span>
                          )}
                          {hasEvent && (
                            <div style={{ 
                              width: "6px", 
                              height: "6px", 
                              background: "var(--text-link)", 
                              borderRadius: "50%", 
                              marginBottom: "4px" 
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 공지사항 관리 탭 UI [NEW] */}
      {backTab === "notice" && (
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          {/* 등록/수정 폼 */}
          <div style={{ flex: 1, minWidth: "360px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>📢 {editingNoticeId ? "공지사항 수정" : "공지사항 등록"}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--canvas-soft)", border: "1px solid var(--hairline)", padding: "20px", borderRadius: "var(--rounded-lg)" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>제목 *</label>
                <input type="text" value={noticeForm.title} onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })} placeholder="공지사항 제목" style={inpStyle({ padding: "8px 12px" })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>내용 *</label>
                <textarea value={noticeForm.content} onChange={e => setNoticeForm({ ...noticeForm, content: e.target.value })} placeholder="공지사항 상세 내용" style={inpStyle({ padding: "8px 12px", minHeight: "150px", resize: "vertical" })} />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleSaveNotice} style={{ flex: 1, padding: "10px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  {editingNoticeId ? "수정 완료" : "등록 완료"}
                </button>
                {editingNoticeId && (
                  <button onClick={() => { setEditingNoticeId(null); setNoticeForm({ title: "", content: "" }); }} style={{ padding: "10px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--ink)", borderRadius: "var(--rounded-md)", fontSize: "13px", cursor: "pointer" }}>
                    취소
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 목록 조회 */}
          <div style={{ flex: 1.5, minWidth: "400px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>📋 등록된 공지사항 목록</h4>
            <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--canvas-soft)", borderBottom: "1px solid var(--hairline-strong)", textAlign: "left" }}>
                    <th style={{ padding: "10px", color: "var(--ink)", fontWeight: 600 }}>제목</th>
                    <th style={{ padding: "10px", width: "90px", color: "var(--ink)", fontWeight: 600 }}>작성일</th>
                    <th style={{ padding: "10px", width: "70px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>조회수</th>
                    <th style={{ padding: "10px", width: "110px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map(n => (
                    <tr key={n.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                      <td style={{ padding: "10px", fontWeight: 600, color: "var(--ink)" }}>{n.title}</td>
                      <td style={{ padding: "10px", color: "var(--body)" }}>{n.date}</td>
                      <td style={{ padding: "10px", textAlign: "center", color: "var(--body)" }}>{n.hits || 0}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                          <button onClick={() => handleEditNotice(n)} style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--ink)", borderRadius: "var(--rounded-sm)", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>수정</button>
                          <button onClick={() => handleDeleteNotice(n.id)} style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--red)", borderRadius: "var(--rounded-sm)", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {notices.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>등록된 공지사항이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FAQ 관리 탭 UI [NEW] */}
      {backTab === "faq" && (
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          {/* 등록/수정 폼 */}
          <div style={{ flex: 1, minWidth: "360px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>❓ {editingFaqId ? "FAQ 수정" : "FAQ 등록"}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--canvas-soft)", border: "1px solid var(--hairline)", padding: "20px", borderRadius: "var(--rounded-lg)" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>카테고리 분류 *</label>
                <select value={faqForm.category} onChange={e => setFaqForm({ ...faqForm, category: e.target.value })} style={inpStyle({ padding: "8px 12px" })}>
                  <option value="학습/수강">학습/수강</option>
                  <option value="수료 기준">수료 기준</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>질문 (Question) *</label>
                <input type="text" value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} placeholder="자주 묻는 질문 입력" style={inpStyle({ padding: "8px 12px" })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>답변 (Answer) *</label>
                <textarea value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} placeholder="FAQ 상세 답변 입력" style={inpStyle({ padding: "8px 12px", minHeight: "120px", resize: "vertical" })} />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleSaveFaq} style={{ flex: 1, padding: "10px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  {editingFaqId ? "수정 완료" : "등록 완료"}
                </button>
                {editingFaqId && (
                  <button onClick={() => { setEditingFaqId(null); setFaqForm({ category: "학습/수강", question: "", answer: "" }); }} style={{ padding: "10px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--ink)", borderRadius: "var(--rounded-md)", fontSize: "13px", cursor: "pointer" }}>
                    취소
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 목록 조회 */}
          <div style={{ flex: 1.5, minWidth: "400px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>📋 등록된 FAQ 목록</h4>
            <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--canvas-soft)", borderBottom: "1px solid var(--hairline-strong)", textAlign: "left" }}>
                    <th style={{ padding: "10px", width: "90px", color: "var(--ink)", fontWeight: 600 }}>분류</th>
                    <th style={{ padding: "10px", color: "var(--ink)", fontWeight: 600 }}>질문</th>
                    <th style={{ padding: "10px", width: "110px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map(f => (
                    <tr key={f.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                      <td style={{ padding: "10px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-link)", background: "rgba(13, 116, 206, 0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                          {f.category}
                        </span>
                      </td>
                      <td style={{ padding: "10px", fontWeight: 600, color: "var(--ink)" }}>{f.question}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                          <button onClick={() => handleEditFaq(f)} style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--ink)", borderRadius: "var(--rounded-sm)", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>수정</button>
                          <button onClick={() => handleDeleteFaq(f.id)} style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--red)", borderRadius: "var(--rounded-sm)", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {faqs.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>등록된 FAQ가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 페이지 꾸미기 탭 UI [NEW] */}
      {backTab === "decorator" && (
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          {/* 입력 폼 */}
          <div style={{ flex: 1, minWidth: "360px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>🎨 소개 페이지 문구 및 배너 테마 설정</h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>상단 배지 텍스트</label>
                <input type="text" value={customBadge} onChange={e => setCustomBadge(e.target.value)} placeholder="🚀 AIDA TUNE 훈련센터 공식 파트너" style={inpStyle({ padding: "8px 12px" })} />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>메인 히어로 타이틀</label>
                <input type="text" value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="AIDA TUNE" style={inpStyle({ padding: "8px 12px" })} />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>소개글 본문 (새 줄 개행 가능)</label>
                <textarea value={customSubtitle} onChange={e => setCustomSubtitle(e.target.value)} placeholder="소개글 본문 기입" style={inpStyle({ padding: "8px 12px", minHeight: "100px", resize: "vertical" })} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}>배너 배경 그라데이션 프리셋</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { id: "sky", name: "Sky Wash (스카이블루)", previewBg: "linear-gradient(135deg, #cfe7ff, #a8c8e8)" },
                    { id: "slate", name: "Cool Slate (스틸블루)", previewBg: "linear-gradient(135deg, #eceef2, #d5d9e2)" },
                    { id: "rose", name: "Sweet Rose (파스텔로즈)", previewBg: "linear-gradient(135deg, #fff1f2, #ffe4e6)" },
                    { id: "gold", name: "Warm Gold (샌드골드)", previewBg: "linear-gradient(135deg, #fefce8, #fef9c3)" }
                  ].map(preset => (
                    <button key={preset.id} onClick={() => setCustomBgPreset(preset.id)}
                      style={{
                        flex: 1,
                        minWidth: "130px",
                        padding: "10px",
                        background: "var(--surface-card)",
                        border: `2px solid ${customBgPreset === preset.id ? "var(--primary)" : "var(--hairline-strong)"}`,
                        borderRadius: "var(--rounded-md)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: preset.previewBg, border: "1px solid var(--hairline)" }} />
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink)" }}>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSavePageConfig} style={{ padding: "12px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginTop: "8px" }}>설정 저장하기</button>
            </div>
          </div>

          {/* 페이지 라이브 프리뷰 */}
          <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>👀 실시간 화면 미리보기</h4>
            
            <div style={{ 
              border: "1px solid var(--hairline-strong)", 
              borderRadius: "var(--rounded-lg)", 
              overflow: "hidden", 
              boxShadow: shadow,
              background: "var(--canvas)"
            }}>
              {/* Preview Hero Band */}
              <div style={{ 
                background: getBgFromPreset(customBgPreset), 
                padding: "24px 16px", 
                textAlign: "center" 
              }}>
                <div style={{ 
                  background: "var(--surface-card)", 
                  border: "1px solid var(--hairline-strong)", 
                  borderRadius: "var(--rounded-pill)", 
                  display: "inline-block", 
                  padding: "4px 8px", 
                  fontSize: "9px", 
                  color: "var(--ink)", 
                  fontWeight: 600, 
                  marginBottom: "8px" 
                }}>
                  {customBadge || "🚀 AIDA TUNE 훈련센터 공식 파트너"}
                </div>
                
                <h5 style={{ 
                  fontSize: "20px", 
                  fontWeight: 600, 
                  color: "var(--ink)", 
                  margin: "0 0 8px 0" 
                }}>
                  {customTitle || "AIDA TUNE"}
                </h5>
                
                <p style={{ 
                  fontSize: "11px", 
                  color: "var(--body)", 
                  lineHeight: "1.4", 
                  margin: 0,
                  maxHeight: "80px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "pre-line"
                }}>
                  {customSubtitle || "AI 서비스 기획, AI 에이전트 개발, 데이터 엔지니어링 프로젝트 관리 등..."}
                </p>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {backTab === "educourse" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* 상단 액션 바 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>📋 수강신청 교육과정 목록</h3>
            <button
              onClick={() => {
                setEditingEduCourseId(null);
                setEduCourseForm({
                  id: "", target: "Customer", abbr: "AI", seq: "1", name: "", dateStart: "", dateEnd: "",
                  time: "13:00-18:00", location: "여의도 파크원타워2 43층 대회의실", status: "Available",
                  overview: "", recommendedAudience: "", objectives: "", teachingMethod: "", curriculum: "",
                  prerequisites: "", notices: ""
                });
                setShowEduCourseFormModal(true);
              }}
              style={{
                padding: "10px 20px",
                background: "var(--primary)",
                color: "var(--on-primary)",
                border: "none",
                borderRadius: "var(--rounded-md)",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              ➕ 신규 과정 개설
            </button>
          </div>

          {/* 과정 목록 테이블 */}
          <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", overflow: "hidden", background: "var(--surface-card)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "var(--canvas-soft)", borderBottom: "1px solid var(--hairline-strong)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>코드</th>
                  <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>대상</th>
                  <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>과정명</th>
                  <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>일정</th>
                  <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>상태</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {eduCourses.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{c.id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "var(--rounded-pill)",
                        background: c.target === "Customer" ? "#eff6ff" : (c.target === "Partner" ? "#fef2f2" : "#f0fdf4"),
                        color: c.target === "Customer" ? "#1d4ed8" : (c.target === "Partner" ? "#b91c1c" : "#15803d")
                      }}>
                        {c.target === "Customer" ? "Customer" : (c.target === "Partner" ? "Partner" : "Other")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink)" }}>{c.name}</td>
                    <td style={{ padding: "12px 16px", color: "var(--body)" }}>
                      {c.dateStart} {c.dateEnd ? `~ ${c.dateEnd}` : "(1일)"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: c.target === "Partner" || c.status === "Separate Notice" ? "var(--body)" : (c.status === "Available" ? "var(--green)" : "var(--red)")
                      }}>
                        {c.target === "Partner" ? "Separate Notice" : c.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button onClick={() => handleEditEduCourse(c)} style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--ink)", borderRadius: "var(--rounded-sm)", cursor: "pointer", fontSize: "11px" }}>수정</button>
                        <button onClick={() => handleDeleteEduCourse(c.id)} style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--red)", borderRadius: "var(--rounded-sm)", cursor: "pointer", fontSize: "11px" }}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {eduCourses.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>등록된 교육과정이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 하단 통합 설정 영역 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", borderTop: "1px solid var(--hairline-strong)", paddingTop: "32px" }}>
            {/* 왼쪽: 안내 문구 에디터 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>✍️ 하단 안내 문구 설정</h4>
              
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--body)", marginBottom: "4px" }}>신청 안내 가이드라인</label>
                <textarea
                  value={adminInfoBlocks.registration}
                  onChange={e => setAdminInfoBlocks({ ...adminInfoBlocks, registration: e.target.value })}
                  style={{ ...inpStyle(), minHeight: "100px", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--body)", marginBottom: "4px" }}>쿠폰 정책 안내</label>
                <textarea
                  value={adminInfoBlocks.coupon}
                  onChange={e => setAdminInfoBlocks({ ...adminInfoBlocks, coupon: e.target.value })}
                  style={{ ...inpStyle(), minHeight: "100px", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--body)", marginBottom: "4px" }}>취소 및 중도포기 규정 안내</label>
                <textarea
                  value={adminInfoBlocks.cancellation}
                  onChange={e => setAdminInfoBlocks({ ...adminInfoBlocks, cancellation: e.target.value })}
                  style={{ ...inpStyle(), minHeight: "100px", fontSize: "13px" }}
                />
              </div>
            </div>

            {/* 오른쪽: 이메일 수신 리스트 및 구글 연동 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>⚙️ 알림 수신 및 자동화 연동</h4>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--body)", marginBottom: "4px" }}>알림 수신 관리자 이메일 목록 (쉼표구분)</label>
                <input
                  type="text"
                  value={adminEmailRecipients}
                  onChange={e => setAdminEmailRecipients(e.target.value)}
                  placeholder="academy@okestro.com, admin@okestro.com"
                  style={inpStyle()}
                />
                <span style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginTop: "4px" }}>
                  * 수강신청 발생 시 즉시 본 이메일들로 알림 메일이 전송됩니다.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--body)", marginBottom: "4px" }}>구글 앱스 스크립트 웹 앱 URL</label>
                <input
                  type="text"
                  value={adminGasUrl}
                  onChange={e => setAdminGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  style={inpStyle()}
                />
              </div>

              {/* GAS 소스코드 복사용 박스 */}
              <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline)", borderRadius: "var(--rounded-md)", padding: "16px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "8px" }}>💡 구글 앱스 스크립트(GAS) 소스코드 가이드</span>
                <span style={{ fontSize: "11px", color: "var(--body)", lineHeight: "1.5", display: "block" }}>
                  구글 스프레드시트 ➔ 확장 프로그램 ➔ Apps Script에서 아래 코드를 붙여넣고 <strong>웹 앱(모든 사용자 액세스 권한)</strong>으로 배포한 뒤 URL을 등록해주세요.
                </span>
                <pre style={{
                  background: "var(--canvas)",
                  border: "1px solid var(--hairline-strong)",
                  borderRadius: "4px",
                  padding: "10px",
                  fontSize: "10px",
                  maxHeight: "120px",
                  overflowY: "auto",
                  margin: "8px 0 0 0",
                  fontFamily: "monospace"
                }}>
{`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    sheet.appendRow([
      data.courseName,
      data.schedule,
      data.time,
      data.coupon,
      data.fullName,
      data.email,
      data.phone,
      data.company,
      data.department || "",
      data.position || "",
      data.attendees,
      data.comments || "",
      new Date().toLocaleString()
    ]);
    var recipients = data.recipients;
    if (recipients && recipients.length > 0) {
      var subject = "[AIDA TUNE] 신규 교육 과정 수강 신청: " + data.courseName;
      var body = "신규 수강 신청 접수 내역:\\n\\n" +
                 "- 과정명: " + data.courseName + "\\n" +
                 "- 신청자: " + data.fullName + "\\n" +
                 "- 이메일: " + data.email + "\\n" +
                 "- 인원: " + data.attendees + "명\\n" +
                 "- 쿠폰: " + data.coupon + "\\n";
      MailApp.sendEmail({ to: recipients.join(","), subject: subject, body: body });
    }
    return ContentService.createTextOutput(JSON.stringify({status:"success"})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status:"error",message:err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
`}
                </pre>
              </div>

              <button
                onClick={handleSaveSettings}
                style={{
                  padding: "12px",
                  background: "var(--primary)",
                  color: "var(--on-primary)",
                  border: "none",
                  borderRadius: "var(--rounded-md)",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: "8px"
                }}
              >
                💾 운영 및 연동 설정 저장
              </button>
            </div>
          </div>

          {/* 등록 및 수정 모달 다이얼로그 */}
          {showEduCourseFormModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 20000, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                background: "var(--surface-card)",
                borderRadius: "var(--rounded-lg)",
                padding: "24px",
                width: "90%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: shadowLg,
                border: "1px solid var(--hairline)"
              }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", margin: "0 0 20px 0" }}>
                  {editingEduCourseId ? "과정 상세 정보 수정" : "신규 수강과정 등록"}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* 코드 조합 도우미 (신규 등록 시에만 노출) */}
                  {!editingEduCourseId ? (
                    <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline)", padding: "12px", borderRadius: "var(--rounded-md)" }}>
                      <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--body)", marginBottom: "6px" }}>🔑 과정 코드 자동생성기</span>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <select
                          value={eduCourseForm.target}
                          onChange={e => setEduCourseForm({ ...eduCourseForm, target: e.target.value })}
                          style={inpStyle({ padding: "6px 10px", width: "120px" })}
                        >
                          <option value="Customer">Customer (C)</option>
                          <option value="Partner">Partner (P)</option>
                          <option value="Other">Other (E)</option>
                        </select>
                        <input
                          type="text"
                          maxLength="2"
                          value={eduCourseForm.abbr}
                          onChange={e => setEduCourseForm({ ...eduCourseForm, abbr: e.target.value.toUpperCase() })}
                          placeholder="과목코드(2글자)"
                          style={inpStyle({ padding: "6px 10px", width: "120px" })}
                        />
                        <input
                          type="number"
                          min="1"
                          value={eduCourseForm.seq}
                          onChange={e => setEduCourseForm({ ...eduCourseForm, seq: e.target.value })}
                          placeholder="순번"
                          style={inpStyle({ padding: "6px 10px", width: "60px" })}
                        />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-link)", marginLeft: "auto" }}>
                          예정 코드: {genCode(eduCourseForm.target, eduCourseForm.abbr, eduCourseForm.seq)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>과정 코드 (수정불가)</label>
                      <input type="text" value={eduCourseForm.id} disabled style={inpStyle({ background: "var(--canvas-soft)", cursor: "not-allowed" })} />
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>과정 대상 타겟</label>
                    <select
                      value={eduCourseForm.target}
                      onChange={e => setEduCourseForm({ ...eduCourseForm, target: e.target.value })}
                      style={inpStyle()}
                    >
                      <option value="Customer">Customer (고객)</option>
                      <option value="Partner">Partner (파트너)</option>
                      <option value="Other">Other (기타)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>교육 과정명 *</label>
                    <input
                      type="text"
                      value={eduCourseForm.name}
                      onChange={e => setEduCourseForm({ ...eduCourseForm, name: e.target.value })}
                      placeholder="생성형 AI 서비스 기획 실전 과정"
                      style={inpStyle()}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>시작 일자 *</label>
                      <input
                        type="date"
                        value={eduCourseForm.dateStart}
                        onChange={e => setEduCourseForm({ ...eduCourseForm, dateStart: e.target.value })}
                        style={inpStyle()}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>종료 일자 (단요일정이면 공란)</label>
                      <input
                        type="date"
                        value={eduCourseForm.dateEnd}
                        onChange={e => setEduCourseForm({ ...eduCourseForm, dateEnd: e.target.value })}
                        style={inpStyle()}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>교육 시간 *</label>
                      <input
                        type="text"
                        value={eduCourseForm.time}
                        onChange={e => setEduCourseForm({ ...eduCourseForm, time: e.target.value })}
                        placeholder="13:00-18:00"
                        style={inpStyle()}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>상태 (Partner 타겟인 경우 자동 별도문의) *</label>
                      <select
                        disabled={eduCourseForm.target === "Partner"}
                        value={eduCourseForm.target === "Partner" ? "Separate Notice" : eduCourseForm.status}
                        onChange={e => setEduCourseForm({ ...eduCourseForm, status: e.target.value })}
                        style={inpStyle({ background: eduCourseForm.target === "Partner" ? "var(--canvas-soft)" : "var(--canvas)" })}
                      >
                        <option value="Available">Available (신청가능)</option>
                        <option value="Closed">Closed (마감)</option>
                        <option value="Upcoming">Upcoming (접수대기)</option>
                        <option value="Separate Notice">Separate Notice (별도문의)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>교육 장소 *</label>
                    <input
                      type="text"
                      value={eduCourseForm.location}
                      onChange={e => setEduCourseForm({ ...eduCourseForm, location: e.target.value })}
                      placeholder="여의도 파크원타워2 43층 대회의실"
                      style={inpStyle()}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>과정 개요 (Plain Text) *</label>
                    <textarea
                      value={eduCourseForm.overview}
                      onChange={e => setEduCourseForm({ ...eduCourseForm, overview: e.target.value })}
                      placeholder="과정에 대한 간략한 단락 텍스트 개요를 입력해주세요."
                      style={{ ...inpStyle(), minHeight: "60px" }}
                    />
                  </div>

                  {/* 불릿 리스트 편집 영역 */}
                  {[
                    { label: "🎯 추천 대상 (줄바꿈으로 구분)", key: "recommendedAudience" },
                    { label: "💡 학습 목표 (줄바꿈으로 구분)", key: "objectives" },
                    { label: "🏫 교육 진행 방식 (줄바꿈으로 구분)", key: "teachingMethod" },
                    { label: "📋 교육 커리큘럼 (줄바꿈으로 구분)", key: "curriculum" },
                    { label: "🔌 사전 필요 지식 (줄바꿈으로 구분)", key: "prerequisites" },
                    { label: "📌 교육 유의 사항 (줄바꿈으로 구분)", key: "notices" }
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>{field.label}</label>
                      <textarea
                        value={eduCourseForm[field.key]}
                        onChange={e => setEduCourseForm({ ...eduCourseForm, [field.key]: e.target.value })}
                        placeholder="한 줄에 하나의 항목씩 적어주세요."
                        style={{ ...inpStyle(), minHeight: "60px", fontSize: "13px" }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "24px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setShowEduCourseFormModal(false)}
                    style={{
                      padding: "10px 20px",
                      border: "1px solid var(--hairline-strong)",
                      borderRadius: "var(--rounded-md)",
                      background: "var(--canvas)",
                      color: "var(--ink)",
                      cursor: "pointer"
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveEduCourse}
                    style={{
                      padding: "10px 24px",
                      border: "none",
                      borderRadius: "var(--rounded-md)",
                      background: "var(--primary)",
                      color: "var(--on-primary)",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface-card)", borderRadius: "var(--rounded-lg)", padding: "24px", width: "320px", border: "1px solid var(--hairline)" }}>
            <h4 style={{ fontSize: "15px", margin: "0 0 12px 0", color: "var(--ink)", fontWeight: 600 }}>반려 사유 입력</h4>
            <textarea value={rejectReasonText} onChange={e => setRejectReasonText(e.target.value)} placeholder="반려 사유" style={{ ...inpStyle(), minHeight: "80px", resize: "none" }} />
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button onClick={handleRejectSubmit} style={{ flex: 1, padding: "10px", background: "var(--red)", color: "#fff", border: "none", borderRadius: "var(--rounded-md)", cursor: "pointer", fontSize: "13px" }}>반려</button>
              <button onClick={() => setRejectModal(null)} style={{ flex: 1, padding: "10px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--ink)", borderRadius: "var(--rounded-md)", cursor: "pointer", fontSize: "13px" }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── [CourseListPage] 교육 목록 페이지 ──
function CourseListPage({ eduCourses, infoBlocks, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter logic
  const filtered = eduCourses.filter(c => {
    // Search filter
    if (activeQuery && !c.name.toLowerCase().includes(activeQuery.toLowerCase())) {
      return false;
    }
    // Target Partner defaults to Separate Notice
    const effectiveStatus = c.target === "Partner" ? "Separate Notice" : c.status;
    if (selectedStatus !== "All" && effectiveStatus !== selectedStatus) {
      return false;
    }
    // Month filter
    if (selectedMonth !== null) {
      const sMonth = new Date(c.dateStart).getMonth() + 1;
      const eMonth = c.dateEnd ? new Date(c.dateEnd).getMonth() + 1 : sMonth;
      if (selectedMonth < sMonth || selectedMonth > eMonth) {
        return false;
      }
    }
    return true;
  });

  // Reset all filters
  const handleReset = () => {
    setSearchQuery("");
    setActiveQuery("");
    setSelectedStatus("All");
    setSelectedMonth(null);
    setCurrentPage(1);
  };

  // Pagination
  const pageSize = 10;
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatSchedule = (start, end) => {
    if (!start) return "-";
    const s = start.replace(/-/g, ".");
    if (!end) return s;
    const e = end.replace(/-/g, ".");
    return `${s} - ${e}`;
  };

  const getStatusLabelAndStyle = (status, target) => {
    const isPartner = target === "Partner";
    const activeStatus = isPartner ? "Separate Notice" : status;

    switch (activeStatus) {
      case "Available":
        return { label: "신청가능", bg: "var(--text-link)", color: "var(--on-primary)", cursor: "pointer", enabled: true };
      case "Closed":
        return { label: "마감", bg: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed", enabled: false };
      case "Upcoming":
        return { label: "접수대기", bg: "#f3f4f6", color: "#6b7280", cursor: "not-allowed", enabled: false };
      case "Separate Notice":
      default:
        return { label: "별도문의", bg: "#f3f4f6", color: "#374151", cursor: "not-allowed", enabled: false };
    }
  };

  // Status labels dictionary for filter dropdown
  const statusOptions = [
    { value: "All", label: "전체 상태" },
    { value: "Available", label: "신청가능" },
    { value: "Closed", label: "마감" },
    { value: "Upcoming", label: "접수대기" },
    { value: "Separate Notice", label: "별도문의" }
  ];

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      <h2 style={{ fontSize: "28px", fontWeight: 600, color: "var(--ink)", marginBottom: "8px", letterSpacing: "-0.5px" }}>🎓 교육과정 신청</h2>
      <p style={{ fontSize: "14px", color: "var(--body)", marginBottom: "32px" }}>오케스트로 아카데미의 다양한 오프라인 및 실시간 라이브 교육과정을 확인하고 간편하게 수강 신청을 해보세요.</p>

      {/* 필터 및 검색 영역 */}
      <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
          {/* 검색창 */}
          <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
            <input
              type="text"
              placeholder="교육 과정명 검색 (Enter 키 입력)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setActiveQuery(searchQuery);
                  setCurrentPage(1);
                }
              }}
              style={inpStyle({ paddingRight: "40px" })}
            />
            <span style={{ position: "absolute", right: "14px", top: "14px", color: "var(--body)" }}>🔍</span>
          </div>

          {/* 상태 필터 */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            style={inpStyle({ width: "160px" })}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* 리셋 버튼 */}
          <button
            onClick={handleReset}
            title="필터 초기화"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--rounded-md)",
              border: "1px solid var(--hairline-strong)",
              background: "var(--canvas)",
              color: "var(--ink)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              transition: "all 0.15s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--canvas-soft)"}
            onMouseOut={(e) => e.currentTarget.style.background = "var(--canvas)"}
          >
            ↺
          </button>
        </div>

        {/* 12개월 월별 그리드 필터 */}
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--body)", marginBottom: "8px" }}>📅 월별 교육 일정 필터</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "6px" }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
              const isSelected = selectedMonth === month;
              return (
                <button
                  key={month}
                  onClick={() => {
                    setSelectedMonth(selectedMonth === month ? null : month);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "10px 0",
                    borderRadius: "var(--rounded-md)",
                    border: `1px solid ${isSelected ? "var(--primary)" : "var(--hairline-strong)"}`,
                    background: isSelected ? "var(--primary)" : "var(--canvas)",
                    color: isSelected ? "var(--on-primary)" : "var(--ink)",
                    fontSize: "13px",
                    fontWeight: isSelected ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "center"
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = "var(--hairline-strong)";
                  }}
                >
                  {month}월
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 테이블 그리드 */}
      <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", overflow: "hidden", background: "var(--surface-card)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "var(--canvas-soft)", borderBottom: "2px solid var(--hairline-strong)", textAlign: "left" }}>
              <th style={{ padding: "16px 20px", width: "120px", color: "var(--ink)", fontWeight: 600 }}>과정 코드</th>
              <th style={{ padding: "16px 20px", width: "120px", color: "var(--ink)", fontWeight: 600 }}>대상</th>
              <th style={{ padding: "16px 20px", color: "var(--ink)", fontWeight: 600 }}>교육 과정명</th>
              <th style={{ padding: "16px 20px", width: "200px", color: "var(--ink)", fontWeight: 600 }}>교육 일정</th>
              <th style={{ padding: "16px 20px", width: "120px", color: "var(--ink)", fontWeight: 600 }}>시간</th>
              <th style={{ padding: "16px 20px", width: "130px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>신청/상태</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(c => {
              const statusCfg = getStatusLabelAndStyle(c.status, c.target);
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--hairline)", transition: "background 0.15s" }}>
                  <td style={{ padding: "16px 20px", color: "var(--body)", fontFamily: "monospace" }}>{c.id}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "var(--rounded-pill)",
                      background: c.target === "Customer" ? "#eff6ff" : (c.target === "Partner" ? "#fef2f2" : "#f0fdf4"),
                      color: c.target === "Customer" ? "#1d4ed8" : (c.target === "Partner" ? "#b91c1c" : "#15803d")
                    }}>
                      {c.target === "Customer" ? "고객" : (c.target === "Partner" ? "파트너" : "기타")}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span
                      onClick={() => onNavigate(`/course/detail/${c.id}`)}
                      style={{ fontWeight: 600, color: "var(--ink)", cursor: "pointer", textDecoration: "none" }}
                      onMouseOver={(e) => e.currentTarget.style.color = "var(--text-link)"}
                      onMouseOut={(e) => e.currentTarget.style.color = "var(--ink)"}
                    >
                      {c.name}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", color: "var(--body)" }}>{formatSchedule(c.dateStart, c.dateEnd)}</td>
                  <td style={{ padding: "16px 20px", color: "var(--body)" }}>{c.time}</td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <button
                      disabled={!statusCfg.enabled}
                      onClick={() => statusCfg.enabled && onNavigate(`/course/register/${c.id}`)}
                      style={{
                        padding: "8px 16px",
                        border: "none",
                        borderRadius: "var(--rounded-md)",
                        background: statusCfg.bg,
                        color: statusCfg.color,
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: statusCfg.cursor,
                        transition: "all 0.15s ease",
                        width: "90px"
                      }}
                      onMouseOver={(e) => {
                        if (statusCfg.enabled) {
                          e.currentTarget.style.filter = "brightness(0.9)";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (statusCfg.enabled) {
                          e.currentTarget.style.filter = "none";
                        }
                      }}
                    >
                      {statusCfg.label}
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>검색 및 필터 조건에 부합하는 교육과정이 존재하지 않습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "24px" }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--rounded-md)",
              background: "var(--canvas)",
              color: currentPage === 1 ? "var(--muted)" : "var(--ink)",
              cursor: currentPage === 1 ? "not-allowed" : "pointer"
            }}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              style={{
                width: "36px",
                height: "36px",
                border: "none",
                borderRadius: "var(--rounded-md)",
                background: currentPage === p ? "var(--primary)" : "transparent",
                color: currentPage === p ? "var(--on-primary)" : "var(--ink)",
                fontWeight: currentPage === p ? 600 : 500,
                cursor: "pointer"
              }}
            >
              {p}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--rounded-md)",
              background: "var(--canvas)",
              color: currentPage === totalPages ? "var(--muted)" : "var(--ink)",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer"
            }}
          >
            다음
          </button>
        </div>
      )}

      {/* 하단 안내 블록 */}
      <div style={{ marginTop: "56px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* 신청 안내 */}
        <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline)", borderRadius: "var(--rounded-lg)", padding: "24px" }}>
          <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📝</span> 신청 안내
          </h4>
          <div style={{ fontSize: "13px", color: "var(--body)", lineHeight: "1.7", whiteSpace: "pre-line" }}>
            {infoBlocks?.registration}
          </div>
        </div>

        {/* 쿠폰 정책 */}
        <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline)", borderRadius: "var(--rounded-lg)", padding: "24px" }}>
          <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🎟️</span> 쿠폰 정책
          </h4>
          <div style={{ fontSize: "13px", color: "var(--body)", lineHeight: "1.7", whiteSpace: "pre-line" }}>
            {infoBlocks?.coupon}
          </div>
        </div>

        {/* 취소 규정 */}
        <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline)", borderRadius: "var(--rounded-lg)", padding: "24px" }}>
          <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚠️</span> 취소/중도포기 안내
          </h4>
          <div style={{ fontSize: "13px", color: "var(--body)", lineHeight: "1.7", whiteSpace: "pre-line" }}>
            {infoBlocks?.cancellation}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── [CourseDetailPage] 상세 조회 페이지 ──
function CourseDetailPage({ eduCourses, viewPath, onNavigate }) {
  const courseId = viewPath.replace("/course/detail/", "");
  const course = eduCourses.find(c => c.id === courseId);

  if (!course) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: "12px" }}>해당 교육과정을 찾을 수 없습니다.</h3>
        <button onClick={() => onNavigate("/course")} style={{ padding: "10px 20px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", cursor: "pointer" }}>교육과정 목록으로</button>
      </div>
    );
  }

  const formatScheduleDetail = (start, end) => {
    if (!start) return "-";
    const s = start.replace(/-/g, ".");
    if (!end || end === start) return s;
    const e = end.replace(/-/g, ".");
    return `${s} - ${e}`;
  };

  const isAvailable = course.target !== "Partner" && course.status === "Available";

  return (
    <div style={{ padding: "40px 24px", maxWidth: "900px", margin: "0 auto", boxSizing: "border-box" }}>
      {/* 상단 브레드크럼 */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "var(--body)", marginBottom: "20px" }}>
        <span onClick={() => onNavigate("/course")} style={{ cursor: "pointer" }} onMouseOver={e => e.currentTarget.style.color = "var(--text-link)"} onMouseOut={e => e.currentTarget.style.color = "var(--body)"}>교육신청</span>
        <span>&gt;</span>
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>과정 상세 정보</span>
      </div>

      {/* 헤더 메타 영역 */}
      <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "32px", marginBottom: "32px" }}>
        <span style={{
          fontSize: "12px",
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: "var(--rounded-pill)",
          background: course.target === "Customer" ? "#eff6ff" : (course.target === "Partner" ? "#fef2f2" : "#f0fdf4"),
          color: course.target === "Customer" ? "#1d4ed8" : (course.target === "Partner" ? "#b91c1c" : "#15803d"),
          display: "inline-block",
          marginBottom: "16px"
        }}>
          {course.target === "Customer" ? "고객 대상 교육" : (course.target === "Partner" ? "파트너 대상 기술 교육" : "기타 교육 과정")}
        </span>
        <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--ink)", margin: "0 0 24px 0", letterSpacing: "-0.5px" }}>{course.name}</h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", borderTop: "1px solid var(--hairline-strong)", paddingTop: "20px" }}>
          <div>
            <span style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>📅 교육 일정</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{formatScheduleDetail(course.dateStart, course.dateEnd)}</span>
          </div>
          <div>
            <span style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>⏰ 교육 시간</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{course.time}</span>
          </div>
          <div>
            <span style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>📍 교육 장소</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{course.location}</span>
          </div>
        </div>
      </div>

      {/* 과정 개요 (단락 텍스트) */}
      <div style={{ marginBottom: "40px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", marginBottom: "12px" }}>과정 소개</h3>
        <p style={{ fontSize: "15px", color: "var(--ink)", lineHeight: "1.7", margin: 0 }}>{course.overview}</p>
      </div>

      {/* 상세 불릿 항목 영역 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "56px" }}>
        {[
          { title: "🎯 수강 추천 대상", data: course.recommendedAudience },
          { title: "💡 과정 학습 목표", data: course.objectives },
          { title: "🏫 교육 진행 방식", data: course.teachingMethod },
          { title: "📋 교육 커리큘럼", data: course.curriculum },
          { title: "🔌 사전 필요 지식 (선수과목)", data: course.prerequisites },
          { title: "📌 교육 유의 사항", data: course.notices }
        ].map((sec, idx) => {
          if (!sec.data || sec.data.length === 0) return null;
          return (
            <div key={idx} style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: "24px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", marginBottom: "12px" }}>{sec.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {sec.data.map((bullet, bIdx) => (
                  <li key={bIdx} style={{ fontSize: "14px", color: "var(--body)", lineHeight: "1.6" }}>{bullet}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* 하단 제어 바 */}
      <div style={{ display: "flex", gap: "12px", borderTop: "1px solid var(--hairline-strong)", paddingTop: "24px", justifyContent: "flex-end" }}>
        <button
          onClick={() => onNavigate("/course")}
          style={{
            padding: "12px 24px",
            border: "1px solid var(--hairline-strong)",
            background: "var(--canvas)",
            color: "var(--ink)",
            borderRadius: "var(--rounded-md)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s"
          }}
          onMouseOver={e => e.currentTarget.style.background = "var(--canvas-soft)"}
          onMouseOut={e => e.currentTarget.style.background = "var(--canvas)"}
        >
          목록으로
        </button>
        <button
          disabled={!isAvailable}
          onClick={() => isAvailable && onNavigate(`/course/register/${course.id}`)}
          style={{
            padding: "12px 32px",
            border: "none",
            background: isAvailable ? "var(--primary)" : "#e5e7eb",
            color: isAvailable ? "var(--on-primary)" : "#9ca3af",
            borderRadius: "var(--rounded-md)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: isAvailable ? "pointer" : "not-allowed",
            transition: "all 0.15s"
          }}
          onMouseOver={e => {
            if (isAvailable) e.currentTarget.style.filter = "brightness(0.9)";
          }}
          onMouseOut={e => {
            if (isAvailable) e.currentTarget.style.filter = "none";
          }}
        >
          수강 신청하기
        </button>
      </div>
    </div>
  );
}

// ── [CourseRegistrationPage] 신청서 작성 페이지 ──
function CourseRegistrationPage({
  eduCourses,
  viewPath,
  currentUser,
  users,
  saveUsers,
  eduRegistrations,
  saveEduRegistrations,
  emailRecipients,
  eduConfig,
  onNavigate
}) {
  const courseId = viewPath.replace("/course/register/", "");
  const course = eduCourses.find(c => c.id === courseId);

  if (!course) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: "12px" }}>해당 교육과정을 찾을 수 없습니다.</h3>
        <button onClick={() => onNavigate("/course")} style={{ padding: "10px 20px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", cursor: "pointer" }}>교육과정 목록으로</button>
      </div>
    );
  }

  const formatScheduleDetail = (start, end) => {
    if (!start) return "-";
    const s = start.replace(/-/g, ".");
    if (!end || end === start) return s;
    const e = end.replace(/-/g, ".");
    return `${s} - ${e}`;
  };

  // Form states
  const [coupon, setCoupon] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [comments, setComments] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [marketingAgree, setMarketingAgree] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Prefill if currentUser is available
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setCompany(currentUser.company || "");
      setDepartment(currentUser.division || currentUser.team || "");
      setPosition(currentUser.jobType || "");
    }
  }, [currentUser]);

  const validateForm = () => {
    const newErrors = {};

    // Missing Required Fields
    if (!coupon.trim()) newErrors.coupon = "*이 필드는 필수입니다.";
    if (!fullName.trim()) newErrors.fullName = "*이 필드는 필수입니다.";
    if (!email.trim()) newErrors.email = "*이 필드는 필수입니다.";
    if (!phone.trim()) newErrors.phone = "*이 필드는 필수입니다.";
    if (!company.trim()) newErrors.company = "*이 필드는 필수입니다.";

    // Invalid Coupon Number
    if (coupon.trim() && !/^\d{7}$/.test(coupon.trim())) {
      newErrors.coupon = "*쿠폰 번호는 7자리 숫자여야 합니다.";
    }

    // Invalid Name
    if (fullName.trim() && fullName.trim().length <= 1) {
      newErrors.fullName = "*이름을 정확히 입력해주세요 (최소 2자).";
    }

    // Invalid Email
    if (email.trim()) {
      if (!email.includes("@") || /\s/.test(email)) {
        newErrors.email = "*올바른 이메일 형식이 아닙니다.";
      }
    }

    // Invalid Phone Number
    if (phone.trim()) {
      if (/[^\d\s\-\+]/.test(phone) || phone.replace(/[^\d]/g, "").length < 8) {
        newErrors.phone = "*올바른 연락처 형식을 입력해주세요.";
      }
    }

    // Attendee Cap Exceeded
    if (Number(attendees) > 3) {
      newErrors.attendees = "*최대 3명까지만 동반 신청 가능합니다.";
    }
    if (Number(attendees) < 1) {
      newErrors.attendees = "*최소 1명 이상 신청하셔야 합니다.";
    }

    // Privacy Policy Unchecked
    if (!privacyAgree) {
      newErrors.privacy = "*개인정보 수집 및 이용에 동의해주셔야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const regId = "reg-" + uid();
      const scheduleText = formatScheduleDetail(course.dateStart, course.dateEnd);

      const newRegistration = {
        id: regId,
        courseId: course.id,
        courseName: course.name,
        schedule: scheduleText,
        time: course.time,
        coupon: coupon.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
        department: department.trim(),
        position: position.trim(),
        comments: comments.trim(),
        attendees: Number(attendees),
        marketingConsent: marketingAgree,
        registeredAt: new Date().toISOString()
      };

      // 1. Save Registration
      const updated = [newRegistration, ...eduRegistrations];
      await saveEduRegistrations(updated);

      // 2. Append to user profile
      const matchedUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (matchedUser) {
        const userRegistrations = matchedUser.registrations || [];
        const updatedUsers = users.map(u =>
          u.id === matchedUser.id
            ? { ...u, registrations: [...userRegistrations, { courseId: course.id, courseName: course.name, schedule: scheduleText, time: course.time, registeredAt: new Date().toISOString() }] }
            : u
        );
        await saveUsers(updatedUsers);
      }

      // 3. Trigger GAS Automation Pipeline
      const gasUrl = eduConfig?.googleSheetsScriptUrl;
      if (gasUrl && gasUrl.trim()) {
        const payload = {
          courseName: course.name,
          schedule: scheduleText,
          time: course.time,
          coupon: coupon.trim(),
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          department: department.trim(),
          position: position.trim(),
          comments: comments.trim(),
          attendees: Number(attendees),
          recipients: emailRecipients,
          registeredAt: new Date().toLocaleString()
        };

        await fetch(gasUrl.trim(), {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }).catch(err => {
          console.error("구글 시트 연동 전송 실패:", err);
        });
      }

      alert("수강 신청이 정상적으로 완료되었습니다!");
      onNavigate("/course");
    } catch (err) {
      alert("수강 신청 중 에러가 발생했습니다: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--ink)",
    marginBottom: "6px"
  };

  const errTextStyle = {
    fontSize: "12px",
    color: "var(--semantic-error)",
    marginTop: "4px",
    fontWeight: 500
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: "680px", margin: "0 auto", boxSizing: "border-box" }}>
      {/* 상단 브레드크럼 */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "var(--body)", marginBottom: "20px" }}>
        <span onClick={() => onNavigate("/course")} style={{ cursor: "pointer" }} onMouseOver={e => e.currentTarget.style.color = "var(--text-link)"} onMouseOut={e => e.currentTarget.style.color = "var(--body)"}>교육신청</span>
        <span>&gt;</span>
        <span onClick={() => onNavigate(`/course/detail/${course.id}`)} style={{ cursor: "pointer" }} onMouseOver={e => e.currentTarget.style.color = "var(--text-link)"} onMouseOut={e => e.currentTarget.style.color = "var(--body)"}>과정 상세</span>
        <span>&gt;</span>
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>수강 신청서 작성</span>
      </div>

      <h2 style={{ fontSize: "24px", fontWeight: 600, color: "var(--ink)", marginBottom: "24px", letterSpacing: "-0.5px" }}>📝 교육 수강 신청서</h2>

      {/* 선택 교육 요약 */}
      <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "24px", marginBottom: "32px" }}>
        <h4 style={{ fontSize: "13px", color: "var(--body)", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>선택한 교육과정 정보</h4>
        <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", marginBottom: "16px" }}>{course.name}</div>
        <div style={{ display: "flex", gap: "24px", fontSize: "14px", color: "var(--body)" }}>
          <div>📅 {formatScheduleDetail(course.dateStart, course.dateEnd)}</div>
          <div>⏰ {course.time}</div>
        </div>
      </div>

      {/* 입력 폼 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>
        {/* 쿠폰 번호 */}
        <div>
          <label style={labelStyle}>쿠폰 번호 *</label>
          <input
            type="text"
            value={coupon}
            onChange={e => setCoupon(e.target.value)}
            placeholder="7자리 숫자를 입력하세요"
            style={inpStyle({ borderColor: errors.coupon ? "var(--semantic-error)" : "var(--hairline-strong)" })}
          />
          {errors.coupon && <div style={errTextStyle}>{errors.coupon}</div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* 성함 */}
          <div>
            <label style={labelStyle}>성함 *</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="홍길동"
              style={inpStyle({ borderColor: errors.fullName ? "var(--semantic-error)" : "var(--hairline-strong)" })}
            />
            {errors.fullName && <div style={errTextStyle}>{errors.fullName}</div>}
          </div>

          {/* 이메일 주소 */}
          <div>
            <label style={labelStyle}>이메일 주소 *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@domain.com"
              style={inpStyle({ borderColor: errors.email ? "var(--semantic-error)" : "var(--hairline-strong)" })}
            />
            {errors.email && <div style={errTextStyle}>{errors.email}</div>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* 연락처 */}
          <div>
            <label style={labelStyle}>연락처 *</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              style={inpStyle({ borderColor: errors.phone ? "var(--semantic-error)" : "var(--hairline-strong)" })}
            />
            {errors.phone && <div style={errTextStyle}>{errors.phone}</div>}
          </div>

          {/* 회사명 */}
          <div>
            <label style={labelStyle}>회사명 *</label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="오케스트로"
              style={inpStyle({ borderColor: errors.company ? "var(--semantic-error)" : "var(--hairline-strong)" })}
            />
            {errors.company && <div style={errTextStyle}>{errors.company}</div>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* 부서 */}
          <div>
            <label style={labelStyle}>부서 (선택)</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="아카데미팀"
              style={inpStyle()}
            />
          </div>

          {/* 직책 */}
          <div>
            <label style={labelStyle}>직급/직책 (선택)</label>
            <input
              type="text"
              value={position}
              onChange={e => setPosition(e.target.value)}
              placeholder="선임연구원"
              style={inpStyle()}
            />
          </div>
        </div>

        {/* 동반참석 인원 */}
        <div>
          <label style={labelStyle}>동반 참석 인원 * (본인 포함 최대 3명)</label>
          <input
            type="number"
            min="1"
            max="3"
            value={attendees}
            onChange={e => setAttendees(e.target.value)}
            style={inpStyle({ borderColor: errors.attendees ? "var(--semantic-error)" : "var(--hairline-strong)" })}
          />
          {errors.attendees && <div style={errTextStyle}>{errors.attendees}</div>}
        </div>

        {/* 추가 요청 사항 */}
        <div>
          <label style={labelStyle}>추가 요청 사항 (선택)</label>
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="기타 요청사항이나 문의사항을 적어주세요."
            style={inpStyle({ minHeight: "80px", resize: "vertical" })}
          />
        </div>
      </div>

      {/* 약관 및 동의 체크박스 */}
      <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "36px" }}>
        {/* 필수 약관 */}
        <div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "var(--ink)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={privacyAgree}
              onChange={e => setPrivacyAgree(e.target.checked)}
              style={{ marginTop: "4px" }}
            />
            <span style={{ lineHeight: "1.4" }}>
              (필수) 개인정보 수집 및 이용약관 동의
              <a href="https://stms.vercel.app/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ marginLeft: "8px", color: "var(--text-link)", textDecoration: "none", fontSize: "12px" }}>
                약관 보기 ↗
              </a>
            </span>
          </label>
          {errors.privacy && <div style={errTextStyle}>{errors.privacy}</div>}
        </div>

        {/* 선택 마케팅 수신동의 */}
        <div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "var(--ink)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={marketingAgree}
              onChange={e => setMarketingAgree(e.target.checked)}
              style={{ marginTop: "4px" }}
            />
            <span style={{ lineHeight: "1.4" }}>(선택) 마케팅 정보 및 이벤트 알림 수신 동의</span>
          </label>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <button
          disabled={loading}
          onClick={() => onNavigate(`/course/detail/${course.id}`)}
          style={{
            padding: "12px 24px",
            border: "1px solid var(--hairline-strong)",
            background: "var(--canvas)",
            color: "var(--ink)",
            borderRadius: "var(--rounded-md)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer"
          }}
        >
          취소
        </button>
        <button
          disabled={loading}
          onClick={handleSubmit}
          style={{
            padding: "12px 36px",
            border: "none",
            background: "var(--primary)",
            color: "var(--on-primary)",
            borderRadius: "var(--rounded-md)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "신청서 제출 중..." : "신청 완료"}
        </button>
      </div>
    </div>
  );
}
