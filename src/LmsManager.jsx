/* eslint-disable */
// LmsManager.jsx
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import RegisterModal from "./RegisterModal";

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

const getAbsoluteUrl = (url) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.toLowerCase().startsWith("http://") || trimmed.toLowerCase().startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.toLowerCase().includes("youtube.com") || trimmed.toLowerCase().includes("youtu.be")) {
    return "https://" + trimmed;
  }
  return "https://www.youtube.com/watch?v=" + trimmed;
};

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

export default function LmsManager({ viewPath, onNavigate, adminSubTabGroup = "approval" }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("intro"); // intro, schedule, classroom, mypage, backoffice
  
  // DB 데이터들
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [viewLogs, setViewLogs] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
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
    heroTitle: "AIDA OASIS",
    heroSubtitle: "AI 서비스 기획, AI 에이전트 개발, 데이터 엔지니어링 프로젝트 관리 등\n실무 중심의 특화 강의와 실시간 평가 테스트를 하나의 플랫폼에서 신속하게 학습하고 진단하세요.",
    heroBadge: "🚀 AIDA OASIS 공식 파트너",
    heroBgPreset: "sky"
  });
  const [schedules, setSchedules] = useState([]);
  const [notices, setNotices] = useState([]);
  const [faqs, setFaqs] = useState([]);

  // LMS 신규 공유 DB 테이블 상태
  const [lmsProgress, setLmsProgress] = useState([]);
  const [lmsQAs, setLmsQAs] = useState([]);
  const [lmsNotes, setLmsNotes] = useState([]);

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
    email: "", password: "", name: ""
  });


  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showGuestAlert, setShowGuestAlert] = useState(false);

  // 1. 초기 데이터 로드
  useEffect(() => {
    const fetchDb = async () => {
      try {
        const [u, c, a, v, d, j, p, s, n, f, ec, er, eib, eer, eco, prog, qa, notes, hLogs] = await Promise.all([
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
          fbGet("aida:edu_config_v1").catch(() => null),
          fbGet("aida:lms_progress_v2").catch(() => []),
          fbGet("aida:lms_qa_v2").catch(() => []),
          fbGet("aida:lms_notes_v2").catch(() => []),
          fbGet("aida:lms_history_logs_v1").catch(() => [])
        ]);
        
        setUsers(u || []);
        setApplications(a || []);
        setViewLogs(v || []);
        setDeptData(d || []);
        setJobTypes(j || []);

        // 시딩 처리 로그 가상 데이터
        const defaultMockHistoryLogs = [
          {
            id: "hlog-1",
            type: "course_approved",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            adminEmail: "academy@okestro.com",
            details: {
              email: "woosay@naver.com",
              courseTitle: "AWS VPC 네트워킹 기본 개념 및 실습",
              status: "approved"
            }
          },
          {
            id: "hlog-2",
            type: "signup_approved",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            adminEmail: "academy@okestro.com",
            details: {
              name: "최우성",
              email: "ws.choi@okestro.com",
              company: "오케스트로",
              division: "아카데미팀"
            }
          },
          {
            id: "hlog-3",
            type: "course_rejected",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            adminEmail: "academy@okestro.com",
            details: {
              email: "guest.user@gmail.com",
              courseTitle: "LangChain을 활용한 LLM 에이전트 개발 기초",
              status: "rejected",
              rejectReason: "소속 정보 불일치 및 재직증명 확인 필요"
            }
          }
        ];
        let finalHistoryLogs = hLogs || [];
        if (!hLogs || hLogs.length === 0) {
          finalHistoryLogs = defaultMockHistoryLogs;
          await fbSet("aida:lms_history_logs_v1", defaultMockHistoryLogs);
        }
        setHistoryLogs(finalHistoryLogs);

        // LMS 동영상 강의 시드 데이터 및 로드
        const defaultMockLmsCourses = [
          {
            id: "lms-c1",
            courseName: "Cloud Infrastructure",
            title: "AWS VPC 네트워킹 기본 개념 및 실습",
            youtubeUrl: "https://www.youtube.com/watch?v=g38U-Xp_kHY",
            description: "VPC, Subnet, Route Table, Internet Gateway 등 가상 네트워크 환경을 구성하는 필수 요소의 원리와 트래픽 흐름을 실습을 통해 학습합니다.",
            createdAt: new Date().toISOString()
          },
          {
            id: "lms-c2",
            courseName: "Cloud Infrastructure",
            title: "Docker 컨테이너 기초 및 이미지 빌드 가이드",
            youtubeUrl: "https://www.youtube.com/watch?v=hP57lhIA590",
            description: "도커 컨테이너의 기본 작동 원리를 학습하고, Dockerfile을 사용하여 실무용 웹 서비스 이미지를 직접 빌드하고 배포해 봅니다.",
            createdAt: new Date().toISOString()
          },
          {
            id: "lms-c3",
            courseName: "Artificial Intelligence",
            title: "LangChain을 활용한 LLM 에이전트 개발 기초",
            youtubeUrl: "https://www.youtube.com/watch?v=aywZtUXxmEE",
            description: "대규모 언어 모델(LLM)과 LangChain 프레임워크를 결합하여 사용자 의도에 따라 외부 도구를 실행하는 지능형 AI 에이전트를 구축합니다.",
            createdAt: new Date().toISOString()
          }
        ];

        let finalCourses = c || [];
        if (!c || c.length === 0) {
          finalCourses = defaultMockLmsCourses;
          await fbSet("aida:lms_courses_v2", defaultMockLmsCourses);
        }
        setCourses(finalCourses);

        // Q&A 시딩
        const defaultMockQAs = [
          {
            id: "qa-1",
            lectureId: "lms-c1",
            authorName: "김민재",
            authorEmail: "minjae@okestro.com",
            content: "VPC 서브넷 대역을 설정할 때 /24 권장 이유가 무엇인가요?",
            createdAt: "2026-06-10T09:00:00.000Z",
            answer: "VPC의 크기와 향후 확장성을 고려했을 때 /24(256개 IP)가 관리하기 가장 쉽고 적당한 크기이기 때문입니다. 필요 시 서브넷을 더 쪼개어 가용 영역별로 분산할 수도 있습니다."
          },
          {
            id: "qa-2",
            lectureId: "lms-c3",
            authorName: "이소연",
            authorEmail: "soyeon@okestro.com",
            content: "LangChain Agent에서 custom tool을 정의할 때 return 타입 제약이 있나요?",
            createdAt: "2026-06-11T10:00:00.000Z",
            answer: "기본적으로 LLM이 텍스트로 결과를 인지해야 하므로 String 타입의 값을 반환하는 것이 표준입니다. JSON 형식을 반환해야 하는 경우 JSON string으로 직렬화하여 반환하시는 것을 권장합니다."
          }
        ];
        
        let finalQAs = qa || [];
        if (!qa || qa.length === 0) {
          finalQAs = defaultMockQAs;
          await fbSet("aida:lms_qa_v2", defaultMockQAs);
        }
        setLmsQAs(finalQAs);
        
        setLmsProgress(prog || []);
        setLmsNotes(notes || []);

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
          { id: "n-1", title: "오케스트로 아카데미 개소 및 AIDA OASIS 서비스 런칭 안내", content: "안녕하세요. 오케스트로 아카데미팀입니다. 실무 중심의 특화 강의와 실시간 평가 테스트를 지원하는 AIDA OASIS 서비스가 공식 오픈되었습니다.\n임직원 여러분의 많은 참여 바랍니다.", date: "2026-06-01", author: "관리자", hits: 45 },
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
            name: "AIDA OASIS 솔루션 파트너 기술 심화 교육",
            dateStart: "2026-07-05",
            dateEnd: null,
            time: "10:00-17:00",
            location: "여의도 파크원타워2 43층 파트너룸",
            status: "Separate Notice",
            overview: "AIDA OASIS 솔루션 공식 파트너사의 엔지니어 및 기술 지원 인력을 대상으로 하는 제품 아키텍처 교육 및 트러블슈팅 가이드 교육입니다.",
            recommendedAudience: ["AIDA OASIS 도입 및 기술 지원을 담당하는 협력사 엔지니어", "파트너사 기술 영업 총괄 담당자"],
            objectives: ["AIDA OASIS 백엔드 구조 및 데이터베이스 설계 원칙 학습", "평가 모듈 커스터마이징 및 배포 트러블슈팅 실전 훈련"],
            teachingMethod: ["아키텍처 프레젠테이션 (30%) 및 실 서버 CLI 명령어 실습 (70%)", "시나리오별 에러 대응 워크숍"],
            curriculum: ["1일차 오전: AIDA OASIS 시스템 구성도 및 연동 API 규격 학습", "1일차 오후: VM 배포 실습 및 로깅 시스템 추적 분석"],
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

  // GNB 세션 동적 동기화 및 커스텀 이벤트 처리
  useEffect(() => {
    const syncSession = () => {
      const session = sessionStorage.getItem("aida:lms_login");
      if (session) {
        setCurrentUser(JSON.parse(session));
      } else {
        setCurrentUser(null);
      }
    };
    window.addEventListener("popstate", syncSession);
    
    const handleTriggerAuth = (e) => {
      if (e.detail) {
        setAuthMode(e.detail);
        setAuthErr("");
      }
    };
    const handleTriggerGuestAlert = () => {
      setShowGuestAlert(true);
    };

    window.addEventListener('aida:trigger_auth', handleTriggerAuth);
    window.addEventListener('aida:trigger_guest_alert', handleTriggerGuestAlert);

    return () => {
      window.removeEventListener("popstate", syncSession);
      window.removeEventListener('aida:trigger_auth', handleTriggerAuth);
      window.removeEventListener('aida:trigger_guest_alert', handleTriggerGuestAlert);
    };
  }, []);

  // 라우팅 탭 동기화 및 보안 가드
  useEffect(() => {
    if (dbLoading) return; // Wait until initial data load & session recovery completes!

    if ((viewPath === "/mypage" || viewPath === "/classroom") && !currentUser) {
      setShowGuestAlert(true);
      onNavigate("/");
      setActiveTab("intro");
      return;
    }

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
  }, [viewPath, currentUser, dbLoading]);

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
  const saveHistoryLogs = async (newLogs) => {
    setHistoryLogs(newLogs);
    await fbSet("aida:lms_history_logs_v1", newLogs);
  };
  const saveLmsProgress = async (newProgress) => {
    setLmsProgress(newProgress);
    await fbSet("aida:lms_progress_v2", newProgress);
  };
  const saveLmsQAs = async (newQAs) => {
    setLmsQAs(newQAs);
    await fbSet("aida:lms_qa_v2", newQAs);
  };
  const saveLmsNotes = async (newNotes) => {
    setLmsNotes(newNotes);
    await fbSet("aida:lms_notes_v2", newNotes);
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

  // RegisterModal의 onRegister prop 형식에 맞는 핸들러
  // payload: { userId, password, passwordConfirm, jobType, companyName, division, team, memberType }
  const handleRegister = async (payload) => {
    const { userId, password, jobType, companyName, division, team, memberType } = payload;

    // 아이디 중복 체크
    if (users.some(u => (u.userId || u.email || '').toLowerCase() === userId.trim().toLowerCase())) {
      throw new Error("이미 사용 중인 아이디입니다.");
    }

    // 파트너사는 관리자 승인 필요, 내부 임직원은 즉시 승인
    const userType = memberType === 'partner' ? 'partner' : 'company';
    const role = memberType === 'employee' ? "admin" : "user";
    const approved = memberType === 'employee';

    const newUser = {
      id: uid(),
      userId: userId.trim(),        // 로그인 아이디
      email: userId.trim(),         // 기존 호환성 유지
      password: password.trim(),
      name: userId.trim(),          // 이름: 아이디로 임시 설정
      userType,
      company: companyName || "",
      division: division || "",
      team: team || "",
      jobType: jobType || "",
      role,
      approved,
      registeredAt: new Date().toISOString()
    };

    const updated = [newUser, ...users];
    await saveUsers(updated);
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
        <div style={{ fontSize: "14px", color: "var(--body)", fontWeight: 500 }}>AIDA OASIS 시스템 로딩 중...</div>
      </div>
    );
  }

  if (viewPath === "/admin") {
    return (
      <div style={{ padding: "24px", background: "var(--canvas-soft)", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <BackOfficeView 
            adminSubTabGroup={adminSubTabGroup}
            currentUser={currentUser}
            historyLogs={historyLogs}
            saveHistoryLogs={saveHistoryLogs}
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
      </div>
    );
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
      {/* 본문 콘텐츠 영역 */}

      {/* ── 본문 화면 출력 ── */}
      <div style={{ flex: 1 }}>
        {activeTab === "intro" && <IntroView courses={courses} eduCourses={eduCourses} checkAccess={checkAccess} setSelectedCourse={setSelectedCourse} applications={applications} currentUser={currentUser} pageConfig={pageConfig} notices={notices} faqs={faqs} saveNotices={saveNotices} setActiveTab={setActiveTab} onNavigate={onNavigate} />}
        {activeTab === "course" && <CourseListPage eduCourses={eduCourses} infoBlocks={eduInfoBlocks} onNavigate={onNavigate} />}
        {activeTab === "course-detail" && <CourseDetailPage eduCourses={eduCourses} viewPath={viewPath} onNavigate={onNavigate} />}
        {activeTab === "course-register" && <CourseRegistrationPage eduCourses={eduCourses} viewPath={viewPath} currentUser={currentUser} users={users} saveUsers={saveUsers} eduRegistrations={eduRegistrations} saveEduRegistrations={saveEduRegistrations} emailRecipients={eduEmailRecipients} eduConfig={eduConfig} onNavigate={onNavigate} />}
        {activeTab === "schedule" && <ScheduleView schedules={schedules} />}
        {activeTab === "notice" && <NoticeView notices={notices} saveNotices={saveNotices} />}
        {activeTab === "faq" && <FaqView faqs={faqs} />}
        {activeTab === "classroom" && currentUser && (
          <ClassroomView 
            courses={courses} 
            currentUser={currentUser} 
            lmsProgress={lmsProgress} 
            saveLmsProgress={saveLmsProgress} 
            lmsQAs={lmsQAs} 
            saveLmsQAs={saveLmsQAs} 
            lmsNotes={lmsNotes} 
            saveLmsNotes={saveLmsNotes} 
          />
        )}
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
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>AIDA OASIS</div>
            <div style={{ fontSize: "13px", color: "var(--body)", lineHeight: "1.6" }}>
              회사명 : 오케스트로(주) &nbsp;|&nbsp; 서울특별시 영등포구 여의대포 108, 43층 (여의도동, 파크원타워2)<br />
              Email : academy@okestro.com &nbsp;|&nbsp; 대표자 : 김민준 &nbsp;|&nbsp; 사업자등록번호 : 783-85-00169
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
              COPYRIGHT© 2026 ALL RIGHT RESERVED.
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "var(--body)", cursor: "pointer" }}>AIDA OASIS 소개</span>
            <span style={{ fontSize: "13px", color: "var(--body)", cursor: "pointer" }}>이용약관</span>
            <span style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 600, cursor: "pointer" }}>개인정보처리방침</span>
            <span style={{ fontSize: "13px", color: "var(--body)", cursor: "pointer" }}>찾아오시는길</span>
          </div>
        </div>
      </div>

      {/* 로그인/비밀번호찾기 모달 (Expo 라이트 카드 테마) */}
      {authMode && authMode !== "register" && (
        <div onClick={e => e.target === e.currentTarget && setAuthMode(null)} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.4)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                <h3 style={{ fontSize: "22px", fontWeight: 600, color: "var(--ink)", marginBottom: "24px", textAlign: "center", letterSpacing: "-0.5px" }}>로그인</h3>
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
            {/* register 모드는 별도 RegisterModal로 처리 (아래 조건부 렌더링 참고) */}
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

      {/* ────────────────────────────────────────────────────────────────
          단계별 진입형 회원가입 모달 – RegisterModal (TSX 컴포넌트)
          authMode === "register" 일 때만 렌더링
      ──────────────────────────────────────────────────────────────── */}
      {authMode === "register" && (
        <RegisterModal
          onClose={() => setAuthMode(null)}
          onRegister={handleRegister}
        />
      )}

      {/* Guest Alert 모달 (Expo 라이트 카드 테마) */}
      {showGuestAlert && (
        <div onClick={e => e.target === e.currentTarget && setShowGuestAlert(false)} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.4)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ 
            background: "var(--surface-card)", 
            borderRadius: "var(--rounded-lg)", 
            padding: "36px", 
            width: "100%", 
            maxWidth: "360px", 
            textAlign: "center",
            border: "1px solid var(--hairline)",
            position: "relative"
          }}>
            <button 
              onClick={() => setShowGuestAlert(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "18px",
                color: "var(--muted)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1
              }}
              onMouseOver={e => e.currentTarget.style.color = "var(--ink)"}
              onMouseOut={e => e.currentTarget.style.color = "var(--muted)"}
            >
              ✕
            </button>
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
function IntroView({ courses, eduCourses = [], checkAccess, setSelectedCourse, applications, currentUser, pageConfig, notices, faqs, saveNotices, setActiveTab, onNavigate }) {
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = pageConfig?.banners || [
    {
      id: "default_1",
      fgImage: pageConfig?.heroBannerImage || "",
      fit: pageConfig?.heroBannerFit || "contain"
    }
  ];

  const autoSlideEnabled = pageConfig?.bannersAutoSlide !== false;
  const slideInterval = pageConfig?.bannersSlideInterval || 5000;

  useEffect(() => {
    if (!autoSlideEnabled || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, slideInterval);
    return () => clearInterval(timer);
  }, [currentSlide, banners.length, autoSlideEnabled, slideInterval]);

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const defaultMockCourses = [
    { id: "mock-1", title: "AI Agent 설계 및 구축", description: "LangChain 및 주요 프레임워크를 활용해 업무 자동화용 AI 에이전트를 빌드하고 프로덕션 수준으로 구현하는 실무 과정", duration: "2일, 16시간", image: "🤖" },
    { id: "mock-2", title: "생성형 AI를 활용한 서비스 기획 실무", description: "대규모 언어모델(LLM) 기반의 서비스 컨셉 구상부터 시나리오 작성, API 스펙 파악까지 통합 아우르는 기획 노하우 과정", duration: "1일, 8시간", image: "💡" },
    { id: "mock-3", title: "Prompt Engineering 실무", description: "LLM의 성능을 백퍼센트 끌어올리는 구조적 질문 프롬프트 작성 규칙 및 피드백 루프 조율을 체득하는 실전 테크닉 과정", duration: "1일, 8시간", image: "✍️" },
    { id: "mock-4", title: "Kubernetes 인프라 구축 실무", description: "컨테이너 오케스트레이션을 위한 쿠버네티스 클러스터 빌드 및 배포 실무 테크닉 과정", duration: "2일, 16시간", image: "🐳" }
  ];

  // 현시각부터 30일 후까지의 모든 교육과정을 불러와서 카드로 보여주기 (개수 제한 없음)
  const getDisplayCourses = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // dateStart가 있는 코스 중, 현재 년도와 현재 월에 해당하는 코스 필터링
    const monthlyCourses = eduCourses.filter(c => {
      if (!c.dateStart) return false;
      const startDate = new Date(c.dateStart);
      return startDate.getFullYear() === currentYear && startDate.getMonth() === currentMonth;
    });

    let result = [...monthlyCourses];
    
    // 만약 현재 월에 해당하는 코스가 하나도 없다면 defaultMockCourses를 폴백으로 사용
    if (result.length === 0) {
      result = defaultMockCourses;
    }
    
    // 최대 4개만 노출하도록 제한
    result = result.slice(0, 4);
    
    // 컴포넌트 데이터 규격에 맞게 맵핑 (name -> title 등 호환 처리)
    return result.map(c => ({
      id: c.id,
      title: c.name || c.title || "",
      description: c.overview || c.description || "",
      duration: c.time ? `${c.dateStart || ""} (${c.time})` : (c.duration || "별도 공지"),
      image: c.image || (c.target === "Partner" ? "🤝" : c.target === "Customer" ? "👤" : "🎓"),
      bgImage: c.bgImage || "", // bgImage 필드 매핑 추가
      rawCourse: c // 원래 데이터를 보관하여 클릭 이벤트 등 처리 시 유용하도록 함
    }));
  };

  const displayCourses = getDisplayCourses();

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
    // edu_courses에서 직접 상세 보기를 원하므로, 클릭 시 해당 교육과정의 상세 정보 페이지로 바로 라우팅 이동
    const targetCourse = c.rawCourse || c;
    if (targetCourse && targetCourse.id) {
      setActiveTab("course-detail"); // 탭 상태 즉시 동기화
      onNavigate(`/course/detail/${targetCourse.id}`);
    } else {
      setActiveTab("course"); // 탭 상태 즉시 동기화
      onNavigate("/course");
    }
  };

  return (
    <div>
      {/* ── Expo-inspired Hero Band (하늘색 그라데이션 및 디바이스 목업 크롬 제거, 1920px 기준 Full-width 및 여백 최적화) ── */}
      <div style={{
        width: "100%",
        height: "550px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid var(--hairline-strong)",
        background: "#000",
        backgroundImage: pageConfig?.heroBgImage 
          ? `url(${pageConfig.heroBgImage})` 
          : "linear-gradient(135deg, #cfe7ff, #a8c8e8)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover"
      }}>
        {/* Slides */}
        {banners.map((slide, idx) => (
          <div 
            key={slide.id || idx}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: idx === currentSlide ? 1 : 0,
              zIndex: idx === currentSlide ? 2 : 1,
              transition: "opacity 0.8s ease-in-out",
              pointerEvents: idx === currentSlide ? "auto" : "none"
            }}
          >
            {slide.fgImage && (
              <img 
                src={slide.fgImage} 
                alt="Top Banner Layer" 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: slide.fit || "contain", 
                  pointerEvents: "none" 
                }} 
              />
            )}
          </div>
        ))}

        {/* Left & Right Manual Slide Buttons */}
        {banners.length > 1 && (
          <>
            <button 
              onClick={handlePrevSlide}
              style={{
                position: "absolute",
                top: "50%",
                left: "24px",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.4)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
            >
              ‹
            </button>
            <button 
              onClick={handleNextSlide}
              style={{
                position: "absolute",
                top: "50%",
                right: "24px",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.4)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Carousel Indicators (Dots) */}
        {banners.length > 1 && (
          <div style={{
            position: "absolute",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            gap: "8px"
          }}>
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(idx);
                }}
                style={{
                  width: idx === currentSlide ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  border: "none",
                  background: idx === currentSlide ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  padding: 0
                }}
              />
            ))}
          </div>
        )}
      </div>


      {/* ── 인기 과정 & 이달의 교육 과정 (96px 리듬 패딩) ── */}
      <div style={{ padding: "96px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
          <div>
            <h2 style={{ fontSize: "36px", fontWeight: 600, color: "var(--ink)", margin: 0, letterSpacing: "-1.08px" }}>🔥 Coming Soon Class</h2>
            <span style={{ fontSize: "14px", color: "var(--body)" }}>여기서 바로 신청하세요.</span>
          </div>
          <button onClick={() => setActiveTab("course")} style={{ background: "none", border: "none", color: "var(--text-link)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>전체 과정 보기 ➔</button>
        </div>

        <div style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", display: "grid", gap: "24px" }}>
          {displayCourses.map((c, idx) => {
            // 그라데이션 및 색상 풀을 두어 다채롭고 아름다운 썸네일 이미지 제공
            const gradients = [
              "linear-gradient(135deg, #0A192F, #1E293B)",
              "linear-gradient(135deg, #0284C7, #0369A1)",
              "linear-gradient(135deg, #0F766E, #115E59)",
              "linear-gradient(135deg, #4338CA, #3730A3)"
            ];
            const currentGradient = gradients[idx % gradients.length];

            return (
              <div key={c.id} onClick={() => handleCourseCardClick(c)}
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--hairline-strong)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                  e.currentTarget.style.borderColor = "var(--primary-active)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)";
                  e.currentTarget.style.borderColor = "var(--hairline-strong)";
                }}>
                {/* 상단 썸네일 이미지/그라데이션 영역 */}
                <div style={{
                  height: "180px", // 16:9 비율 근사치로 기존 140px에서 약 130%인 180px로 변경
                  background: c.bgImage ? `url(${c.bgImage}) center/cover no-repeat` : currentGradient,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "16px",
                  boxSizing: "border-box",
                  position: "relative"
                }}>
                  {/* 상단 뱃지 */}
                  <div style={{
                    alignSelf: "flex-start",
                    background: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(4px)",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {c.rawCourse?.target || c.target || "AIDA EDUCATION"}
                  </div>
                  
                  {/* 썸네일 내 대형 아이콘/데코 (지정 이미지가 없을 때만 표출) */}
                  {!c.bgImage && (
                    <div style={{
                      position: "absolute",
                      right: "16px",
                      bottom: "16px",
                      fontSize: "40px",
                      opacity: 0.85
                    }}>
                      {c.image || "🎓"}
                    </div>
                  )}
                </div>

                {/* 하단 정보 텍스트 영역 */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                  <div>
                    {/* 과정 명 */}
                    <h3 style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--ink)",
                      margin: "0 0 8px 0",
                      lineHeight: "1.4",
                      height: "44px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical"
                    }}>
                      {c.title}
                    </h3>

                    {/* 설명 */}
                    <p style={{
                      fontSize: "13px",
                      color: "var(--body)",
                      lineHeight: "1.5",
                      margin: "0 0 16px 0",
                      height: "38px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical"
                    }}>
                      {c.description}
                    </p>
                  </div>

                  <div>
                    {/* 구분선 */}
                    <div style={{ borderTop: "1px solid var(--hairline)", margin: "8px 0" }} />

                    {/* 기간 및 가격/무료 정보 행 */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-link)", fontWeight: 600 }}>
                        ⏳ {c.duration || "별도 공지"}
                      </span>
                      <span style={{
                        fontSize: "12px",
                        color: "#0284C7",
                        fontWeight: 700,
                        background: "#E0F2FE",
                        padding: "2px 8px",
                        borderRadius: "4px"
                      }}>
                        무료
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
                  <div style={{ fontSize: "13px", color: "var(--body)", lineHeight: "1.5" }}>{renderHtmlOrText(f.answer || f.a)}</div>
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
        <div onClick={e => e.target === e.currentTarget && setSelectedNotice(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface-card)", borderRadius: "var(--rounded-lg)", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: shadowLg, border: "1px solid var(--hairline)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline)", paddingBottom: "12px", marginBottom: "16px" }}>
              <strong style={{ fontSize: "13px", color: "var(--text-link)" }}>📢 공지사항</strong>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>작성일: {selectedNotice.date}</span>
            </div>
            <h4 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", margin: "0 0 12px 0" }}>{selectedNotice.title}</h4>
            <div style={{ fontSize: "14px", color: "var(--body)", lineHeight: "1.7", margin: "0 0 24px 0" }}>
              {renderHtmlOrText(selectedNotice.content)}
            </div>
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
        <div onClick={e => e.target === e.currentTarget && setDetailSchedule(null)} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.4)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface-card)", borderRadius: "var(--rounded-lg)", padding: "28px", width: "100%", maxWidth: "440px", boxShadow: shadowLg, border: "1px solid var(--hairline)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline)", paddingBottom: "12px", marginBottom: "16px" }}>
              <strong style={{ fontSize: "13px", color: "var(--text-link)" }}>📅 교육 일정 상세</strong>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>{detailSchedule.date}</span>
            </div>
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

function ClassroomView({ 
  courses, 
  currentUser, 
  lmsProgress, 
  saveLmsProgress, 
  lmsQAs, 
  saveLmsQAs, 
  lmsNotes, 
  saveLmsNotes 
}) {
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [activeBottomTab, setActiveBottomTab] = useState("qa");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [notesText, setNotesText] = useState("");
  const [adminAnswerTexts, setAdminAnswerTexts] = useState({});

  useEffect(() => {
    if (selectedLecture) {
      const myNote = lmsNotes.find(n => n.email === currentUser.email && n.lectureId === selectedLecture.id);
      setNotesText(myNote?.content || "");
    }
  }, [selectedLecture, lmsNotes, currentUser]);

  const getYoutubeId = (url) => {
    if (!url) return null;
    try {
      const cleanedUrl = url.trim();
      const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
      const match = cleanedUrl.match(regExp);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const getLectureProgress = (lectureId) => {
    const item = lmsProgress.find(p => p.email === currentUser.email && p.lectureId === lectureId);
    return item?.progress || 0;
  };

  const getLectureStatus = (lectureId) => {
    const item = lmsProgress.find(p => p.email === currentUser.email && p.lectureId === lectureId);
    return item?.status || "before";
  };

  const updateProgressState = async (lectureId, newPct) => {
    const status = newPct === 100 ? "completed" : (newPct > 0 ? "learning" : "before");
    const existingIdx = lmsProgress.findIndex(p => p.email === currentUser.email && p.lectureId === lectureId);
    let updated;
    if (existingIdx > -1) {
      updated = [...lmsProgress];
      updated[existingIdx] = {
        ...updated[existingIdx],
        progress: newPct,
        status,
        updatedAt: new Date().toISOString()
      };
    } else {
      updated = [
        ...lmsProgress,
        {
          email: currentUser.email,
          lectureId,
          progress: newPct,
          status,
          updatedAt: new Date().toISOString()
        }
      ];
    }
    await saveLmsProgress(updated);
  };

  const handleSliderChange = (e) => {
    if (!selectedLecture) return;
    const val = parseInt(e.target.value);
    updateProgressState(selectedLecture.id, val);
  };

  const handleToggleComplete = async () => {
    if (!selectedLecture) return;
    const currentPct = getLectureProgress(selectedLecture.id);
    const nextPct = currentPct === 100 ? 0 : 100;
    await updateProgressState(selectedLecture.id, nextPct);
  };

  const handleAddQuestion = async () => {
    if (!selectedLecture || !newQuestionText.trim()) return;
    const newQA = {
      id: uid(),
      lectureId: selectedLecture.id,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      content: newQuestionText.trim(),
      createdAt: new Date().toISOString(),
      answer: ""
    };
    await saveLmsQAs([newQA, ...lmsQAs]);
    setNewQuestionText("");
    alert("질문이 성공적으로 등록되었습니다.");
  };

  const handleSaveAnswer = async (qaId, answerText) => {
    const updated = lmsQAs.map(q => q.id === qaId ? { ...q, answer: answerText.trim() } : q);
    await saveLmsQAs(updated);
    alert("관리자 답변이 저장되었습니다.");
  };

  const handleSaveNote = async () => {
    if (!selectedLecture) return;
    const existingIdx = lmsNotes.findIndex(n => n.email === currentUser.email && n.lectureId === selectedLecture.id);
    let updated;
    if (existingIdx > -1) {
      updated = [...lmsNotes];
      updated[existingIdx] = {
        ...updated[existingIdx],
        content: notesText,
        updatedAt: new Date().toISOString()
      };
    } else {
      updated = [
        ...lmsNotes,
        {
          email: currentUser.email,
          lectureId: selectedLecture.id,
          content: notesText,
          updatedAt: new Date().toISOString()
        }
      ];
    }
    await saveLmsNotes(updated);
    alert("강의 노트가 저장되었습니다.");
  };

  const activeProgress = selectedLecture ? getLectureProgress(selectedLecture.id) : 0;
  const isCompleted = activeProgress === 100;

  const currentVideoId = selectedLecture ? getYoutubeId(selectedLecture.youtubeUrl) : null;

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ 
        background: "var(--surface-card)", 
        border: "1px solid var(--hairline-strong)", 
        borderRadius: "var(--rounded-lg)", 
        padding: "24px", 
        boxShadow: shadow,
        marginBottom: "32px"
      }}>
        <h4 style={{ fontSize: "24px", fontWeight: 600, color: "var(--ink)", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>🎬 온라인 강의</h4>
        <span style={{ fontSize: "14px", color: "var(--body)" }}>업로드된 온라인 교육 동영상을 자유롭게 시청하고 진도를 관리할 수 있습니다.</span>
      </div>

      {selectedLecture ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button 
              onClick={() => setSelectedLecture(null)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: "var(--canvas)",
                border: "1px solid var(--hairline-strong)",
                borderRadius: "var(--rounded-md)",
                color: "var(--ink)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseOver={e => e.currentTarget.style.background = "var(--canvas-soft)"}
              onMouseOut={e => e.currentTarget.style.background = "var(--canvas)"}
            >
              ⬅ 강의 목록으로 돌아가기
            </button>
          </div>

          <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "500px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ 
                background: "var(--surface-card)", 
                border: "1px solid var(--hairline-strong)", 
                borderRadius: "var(--rounded-lg)", 
                padding: "24px", 
                boxShadow: shadow 
              }}>
                <div style={{ 
                  width: "100%", 
                  aspectRatio: "16/9", 
                  borderRadius: "var(--rounded-lg)", 
                  overflow: "hidden", 
                  background: "#000", 
                  border: "1px solid var(--hairline-strong)",
                  marginBottom: "20px"
                }}>
                  {currentVideoId ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${currentVideoId}`}
                      title={selectedLecture.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "#fff",
                      padding: "24px",
                      textAlign: "center",
                      background: "var(--primary-active)",
                      boxSizing: "border-box"
                    }}>
                      <span style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</span>
                      <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "var(--on-primary)" }}>재생할 수 없는 동영상입니다</div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "16px", maxWidth: "340px", lineHeight: "1.4" }}>
                        유튜브 주소가 올바르지 않거나 동영상 설정에서 외부 퍼가기(Embedding)가 차단되었을 수 있습니다. 아래 버튼으로 유튜브에서 직접 감상해 주세요.
                      </div>
                      <a
                        href={getAbsoluteUrl(selectedLecture?.youtubeUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "8px 16px",
                          background: "var(--surface-card)",
                          color: "var(--text-link)",
                          border: "none",
                          borderRadius: "var(--rounded-md)",
                          fontSize: "13px",
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "all 0.2s"
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = "var(--primary)";
                          e.currentTarget.style.color = "var(--on-primary)";
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = "var(--surface-card)";
                          e.currentTarget.style.color = "var(--text-link)";
                        }}
                      >
                        📺 YouTube에서 직접 보기
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Q&A / Notes Bottom Tab 카드 */}
              <div style={{ 
                background: "var(--surface-card)", 
                border: "1px solid var(--hairline-strong)", 
                borderRadius: "var(--rounded-lg)", 
                padding: "24px", 
                boxShadow: shadow 
              }}>
                {/* 탭 헤더 */}
                <div style={{ display: "flex", gap: "12px", borderBottom: "1.5px solid var(--hairline-strong)", paddingBottom: "10px", marginBottom: "20px" }}>
                  <button
                    onClick={() => setActiveBottomTab("qa")}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: activeBottomTab === "qa" ? "var(--primary)" : "var(--body)",
                      cursor: "pointer",
                      padding: "6px 12px",
                      borderBottom: activeBottomTab === "qa" ? "2.5px solid var(--primary)" : "2.5px solid transparent",
                      transition: "all 0.15s"
                    }}
                  >
                  질문하기 (Q&A)
                </button>
                <button
                  onClick={() => setActiveBottomTab("notes")}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: activeBottomTab === "notes" ? "var(--primary)" : "var(--body)",
                    cursor: "pointer",
                    padding: "6px 12px",
                    borderBottom: activeBottomTab === "notes" ? "2.5px solid var(--primary)" : "2.5px solid transparent",
                    transition: "all 0.15s"
                  }}
                >
                  강의 노트 (My Notes)
                </button>
              </div>

              {/* 탭 내용 분기 */}
              {activeBottomTab === "qa" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* 질문 작성 폼 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <textarea
                      placeholder="강의 내용에 대해 궁금한 점을 질문해 보세요. 관리자 또는 튜터가 신속히 답변해 드립니다."
                      value={newQuestionText}
                      onChange={e => setNewQuestionText(e.target.value)}
                      style={{ ...inpStyle(), minHeight: "80px", resize: "vertical" }}
                    />
                    <button 
                      onClick={handleAddQuestion}
                      style={{
                        alignSelf: "flex-end",
                        padding: "8px 16px",
                        background: "var(--primary)",
                        color: "var(--on-primary)",
                        border: "none",
                        borderRadius: "var(--rounded-md)",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      질문 등록하기
                    </button>
                  </div>

                  {/* 질문 목록 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <h5 style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>💬 질문 목록 ({lmsQAs.filter(q => q.lectureId === selectedLecture.id).length}개)</h5>
                    {lmsQAs.filter(q => q.lectureId === selectedLecture.id).length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px", color: "var(--body)", fontSize: "13px", background: "var(--canvas-soft)", borderRadius: "var(--rounded-lg)" }}>
                        등록된 질문이 없습니다. 첫 질문을 남겨보세요!
                      </div>
                    ) : (
                      lmsQAs.filter(q => q.lectureId === selectedLecture.id).map(qa => (
                        <div key={qa.id} style={{ border: "1px solid var(--hairline)", borderRadius: "var(--rounded-lg)", padding: "16px", background: "var(--canvas-soft)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--body)", marginBottom: "8px" }}>
                            <strong>👤 {qa.authorName} ({qa.authorEmail})</strong>
                            <span>{new Date(qa.createdAt).toLocaleString()}</span>
                          </div>
                          <p style={{ fontSize: "14px", color: "var(--ink)", margin: "0 0 12px 0", whiteSpace: "pre-line" }}>
                            {qa.content}
                          </p>

                          {/* 답변 블록 */}
                          {qa.answer ? (
                            <div style={{ background: "#F0FDFA", border: "1px solid #14B8A6", borderRadius: "var(--rounded-md)", padding: "12px", fontSize: "13px" }}>
                              <div style={{ color: "#0D9488", fontWeight: 700, marginBottom: "4px" }}>✍️ 관리자 답변</div>
                              <p style={{ margin: 0, color: "var(--ink)", whiteSpace: "pre-line" }}>{qa.answer}</p>
                            </div>
                          ) : (
                            <div style={{ fontSize: "12px", color: "var(--body)" }}>⌛ 답변 대기 중</div>
                          )}

                          {/* 관리자 전용 답변 입력창 */}
                          {currentUser.role === "admin" && (
                            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed var(--hairline)" }}>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>
                                🛡️ 답변 작성/수정 (관리자 전용)
                              </label>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                  type="text"
                                  placeholder="답변 내용을 작성해 주세요."
                                  value={adminAnswerTexts[qa.id] !== undefined ? adminAnswerTexts[qa.id] : (qa.answer || "")}
                                  onChange={e => setAdminAnswerTexts({ ...adminAnswerTexts, [qa.id]: e.target.value })}
                                  style={{ ...inpStyle(), flexGrow: 1, padding: "6px 12px" }}
                                />
                                <button
                                  onClick={() => handleSaveAnswer(qa.id, adminAnswerTexts[qa.id] || "")}
                                  style={{ padding: "6px 12px", background: "#14B8A6", color: "#fff", border: "none", borderRadius: "var(--rounded-md)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                >
                                  답변 저장
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeBottomTab === "notes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <span style={{ fontSize: "12px", color: "var(--body)" }}>
                    💡 작성하신 노트는 본인의 수강생 계정에 개인 보관되어 다음 학습 시 언제든지 이어서 확인하고 편집하실 수 있습니다.
                  </span>
                  <textarea
                    placeholder="여기에 필기를 작성해 주세요. 핵심 코드 스니펫이나 요약 글 등을 적을 수 있습니다."
                    value={notesText}
                    onChange={e => setNotesText(e.target.value)}
                    style={{ ...inpStyle(), minHeight: "150px", resize: "vertical", fontFamily: "monospace", fontSize: "13px" }}
                  />
                  <button 
                    onClick={handleSaveNote}
                    style={{
                      alignSelf: "flex-end",
                      padding: "10px 20px",
                      background: "var(--primary)",
                      color: "var(--on-primary)",
                      border: "none",
                      borderRadius: "var(--rounded-md)",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    강의 노트 저장하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      ) : (
        <>
          {courses.length === 0 ? (
            <div style={{ height: "450px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--body)", background: "var(--surface-card)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", boxShadow: shadow }}>
              <span style={{ fontSize: "48px" }}>📺</span>
              <div style={{ fontSize: "16px", fontWeight: 600, marginTop: "12px", color: "var(--ink)" }}>등록된 강의가 없습니다.</div>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px"
            }}>
              {courses.map(course => {
                const progress = getLectureProgress(course.id);
                const isComp = progress === 100;
                const videoId = getYoutubeId(course.youtubeUrl);
                const thumbUrl = videoId
                  ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                  : null;
                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedLecture(course)}
                    style={{
                      background: "var(--surface-card)",
                      border: "1px solid var(--hairline-strong)",
                      borderRadius: "var(--rounded-lg)",
                      boxShadow: shadow,
                      cursor: "pointer",
                      overflow: "hidden",
                      transition: "transform 0.18s, box-shadow 0.18s",
                      display: "flex",
                      flexDirection: "column"
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.15)";
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = shadow;
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: "100%",
                      aspectRatio: "16/9",
                      background: thumbUrl ? "#000" : "linear-gradient(135deg, var(--primary) 0%, #6C47FF 100%)",
                      overflow: "hidden",
                      position: "relative",
                      flexShrink: 0
                    }}>
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={course.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                          <span style={{ fontSize: "40px" }}>🎬</span>
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="play-overlay" style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(15, 23, 42, 0.4)",
                        backdropFilter: "blur(2px)",
                        opacity: 0,
                        transition: "opacity 0.25s ease"
                      }}
                        onMouseOver={e => e.currentTarget.style.opacity = "1"}
                        onMouseOut={e => e.currentTarget.style.opacity = "0"}
                      >
                        <div style={{
                          width: "54px",
                          height: "54px",
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.95)",
                          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25), inset 0 2px 2px rgba(255, 255, 255, 0.5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "transform 0.2s ease, background-color 0.2s ease",
                          cursor: "pointer"
                        }}
                          onMouseOver={e => {
                            e.currentTarget.style.transform = "scale(1.08)";
                            e.currentTarget.style.backgroundColor = "#ffffff";
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
                          }}
                        >
                          <div style={{
                            width: 0,
                            height: 0,
                            borderStyle: "solid",
                            borderWidth: "10px 0 10px 16px",
                            borderColor: "transparent transparent transparent #0A192F",
                            marginLeft: "4px"
                          }} />
                        </div>
                      </div>
                      {/* Completion badge */}
                      {isComp && (
                        <div style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "#10B981",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "999px"
                        }}>✅ 완료</div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px", flexGrow: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", lineHeight: "1.4", wordBreak: "keep-all" }}>
                        {course.title}
                      </div>
                      {course.description && (
                        <div style={{
                          fontSize: "12px",
                          color: "var(--body)",
                          lineHeight: "1.5",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}>
                          {course.description}
                        </div>
                      )}

                      {/* Progress bar */}
                      <div style={{ marginTop: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", color: "var(--body)", fontWeight: 500 }}>학습 진도</span>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: isComp ? "#10B981" : "var(--primary)" }}>{progress}%</span>
                        </div>
                        <div style={{ height: "6px", background: "var(--canvas-soft)", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${progress}%`,
                            background: isComp ? "#10B981" : "var(--primary)",
                            borderRadius: "999px",
                            transition: "width 0.4s ease"
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
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
            <div style={{ fontSize: "14px", color: "var(--ink)", lineHeight: "1.6" }}>
              {renderHtmlOrText(selectedNotice.content)}
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
                      lineHeight: "1.6"
                    }}
                  >
                    {renderHtmlOrText(faq.answer)}
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
  adminSubTabGroup = "approval",
  currentUser,
  historyLogs = [],
  saveHistoryLogs,
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
  const [selectedCourseNameOption, setSelectedCourseNameOption] = useState("");
  const [customCourseName, setCustomCourseName] = useState("");
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [applyFilterStatus, setApplyFilterStatus] = useState("pending");
  const [registerFilterTab, setRegisterFilterTab] = useState("pending");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberFilterRole, setMemberFilterRole] = useState("all");
  const [memberFilterStatus, setMemberFilterStatus] = useState("all");
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [selectedCredsUser, setSelectedCredsUser] = useState(null);

  // adminSubTabGroup 변경 시 backTab 자동 싱크
  useEffect(() => {
    if (adminSubTabGroup === "course") {
      setBackTab("create");
    } else if (adminSubTabGroup === "approval") {
      if (backTab === "create") {
        setBackTab("apply");
      }
    }
  }, [adminSubTabGroup]);

  // 신청 교육 CRUD 폼 상태
  const [eduCourseForm, setEduCourseForm] = useState({
    id: "",
    target: "Customer",
    name: "",
    bgImage: "", // 배너/썸네일 이미지 URL 필드 추가
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
  const handleSaveEduCourse = async () => {
    const {
      id, target, name, bgImage, dateStart, dateEnd, time, location, status, overview,
      recommendedAudience, objectives, teachingMethod, curriculum, prerequisites, notices
    } = eduCourseForm;

    if (!name.trim() || !dateStart || !time.trim() || !location.trim() || !overview.trim()) {
      alert("필수 입력 항목을 모두 작성해주세요.");
      return;
    }

    const parseBullets = (text) => {
      if (Array.isArray(text)) return text;
      if (!text) return [];
      return text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    };

    const courseCode = editingEduCourseId ? id : `COURSE-${Date.now()}`;

    // teachingMethod는 클릭 세그먼트 버튼에서 받아온 단일 텍스트이므로 단일 원소 배열로 저장
    const methodParsed = typeof teachingMethod === "string" 
      ? [teachingMethod.trim()] 
      : teachingMethod;

    const newCourse = {
      id: courseCode,
      target,
      name: name.trim(),
      bgImage: bgImage ? bgImage.trim() : "",
      dateStart,
      dateEnd: dateEnd ? dateEnd : null,
      time: time.trim(),
      location: location.trim(),
      status: target === "Partner" ? "Separate Notice" : status,
      overview: overview.trim(),
      recommendedAudience: parseBullets(recommendedAudience),
      objectives: parseBullets(objectives),
      teachingMethod: methodParsed,
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
      updated = [newCourse, ...eduCourses];
      alert("교육과정이 개설되었습니다.");
    }

    await saveEduCourses(updated);
    setShowEduCourseFormModal(false);
    setEditingEduCourseId(null);
    setEduCourseForm({
      id: "", target: "Customer", name: "", bgImage: "", dateStart: "", dateEnd: "",
      time: "13:00-18:00", location: "여의도 파크원타워2 43층 대회의실", status: "Available",
      overview: "", recommendedAudience: "", objectives: "", teachingMethod: "", curriculum: "",
      prerequisites: "", notices: ""
    });
  };

  const handleEditEduCourse = (c) => {
    const joinBullets = (arr) => arr ? arr.join("\n") : "";

    setEduCourseForm({
      id: c.id,
      target: c.target,
      name: c.name,
      bgImage: c.bgImage || "",
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
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [adminYear, setAdminYear] = useState(2026);
  const [adminMonth, setAdminMonth] = useState(5); // 5 = June
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // 페이지 꾸미기 상태
  const [bannersList, setBannersList] = useState([]);
  const [bannersAutoSlide, setBannersAutoSlide] = useState(true);
  const [bannersSlideInterval, setBannersSlideInterval] = useState(5000);
  const [previewSlide, setPreviewSlide] = useState(0);
  const [bannersBgImage, setBannersBgImage] = useState("");

  useEffect(() => {
    if (!bannersAutoSlide || bannersList.length <= 1) return;
    const timer = setInterval(() => {
      setPreviewSlide((prev) => (prev + 1) % bannersList.length);
    }, bannersSlideInterval);
    return () => clearInterval(timer);
  }, [previewSlide, bannersList.length, bannersAutoSlide, bannersSlideInterval]);

  useEffect(() => {
    if (previewSlide >= bannersList.length && bannersList.length > 0) {
      setPreviewSlide(bannersList.length - 1);
    }
  }, [bannersList.length, previewSlide]);

  const handleUpdateBannerField = (id, field, value) => {
    setBannersList(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleAddBanner = () => {
    if (bannersList.length >= 5) {
      alert("배너는 최대 5장까지만 등록 가능합니다.");
      return;
    }
    setBannersList(prev => [
      ...prev,
      {
        id: uid(),
        fgImage: "",
        fit: "contain"
      }
    ]);
  };

  const handleDeleteBanner = (id) => {
    if (bannersList.length <= 1) {
      alert("최소 1장의 배너는 유지되어야 합니다.");
      return;
    }
    setBannersList(prev => prev.filter(b => b.id !== id));
  };

  const handleBannerImageUpload = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.includes("png")) {
      alert("PNG 형식의 이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxW = 1920;

        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let compressedBase64 = canvas.toDataURL("image/png");
        let sizeInKb = Math.round((compressedBase64.length * 3) / 4 / 1024);
        
        // If PNG is too large, fallback to jpeg compression to fit Firestore limits
        if (sizeInKb > 1024) {
          compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
          sizeInKb = Math.round((compressedBase64.length * 3) / 4 / 1024);
        }

        if (sizeInKb > 1024) {
          compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          sizeInKb = Math.round((compressedBase64.length * 3) / 4 / 1024);
        }

        if (sizeInKb > 1024) {
          alert(`이미지 용량이 너무 큽니다 (${sizeInKb}KB). 더 작은 해상도의 이미지로 업로드해주세요.`);
          return;
        }

        handleUpdateBannerField(id, "fgImage", compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUnifiedBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxW = 1920;

        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let compressedBase64 = file.type.includes("png") 
          ? canvas.toDataURL("image/png") 
          : canvas.toDataURL("image/jpeg", 0.85);

        let sizeInKb = Math.round((compressedBase64.length * 3) / 4 / 1024);
        
        if (sizeInKb > 1024) {
          compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
          sizeInKb = Math.round((compressedBase64.length * 3) / 4 / 1024);
        }

        if (sizeInKb > 1024) {
          compressedBase64 = canvas.toDataURL("image/jpeg", 0.70);
          sizeInKb = Math.round((compressedBase64.length * 3) / 4 / 1024);
        }

        if (sizeInKb > 1024) {
          alert(`이미지 용량이 너무 큽니다 (${sizeInKb}KB). 더 작은 해상도의 이미지로 업로드해주세요.`);
          return;
        }

        setBannersBgImage(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

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
      const savedBanners = pageConfig.banners || [
        {
          id: "banner_default_1",
          bgImage: pageConfig.heroBgImage || "",
          fgImage: pageConfig.heroBannerImage || "",
          fit: pageConfig.heroBannerFit || "contain"
        }
      ];
      setBannersList(savedBanners);
      setBannersAutoSlide(pageConfig.bannersAutoSlide !== false);
      setBannersSlideInterval(pageConfig.bannersSlideInterval || 5000);
      setBannersBgImage(pageConfig.heroBgImage || savedBanners[0]?.bgImage || "");
    }
  }, [pageConfig]);

  const handleApprove = async (appId) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    const courseTitle = courses.find(c => c.id === app.courseId)?.title || "알 수 없는 과정";
    const updated = applications.map(a => a.id === appId ? { ...a, status: "approved", approvedAt: new Date().toISOString() } : a);
    await saveApplications(updated);
    
    // Add to history log
    const newLog = {
      id: uid(),
      type: "course_approved",
      timestamp: new Date().toISOString(),
      adminEmail: currentUser?.email || "admin@okestro.com",
      details: {
        email: app.email,
        courseTitle: courseTitle,
        status: "approved"
      }
    };
    await saveHistoryLogs([newLog, ...historyLogs]);
    
    alert("수강 신청을 승인했습니다.");
  };

  const handleRejectSubmit = async () => {
    if (!rejectReasonText.trim()) return;
    const app = rejectModal;
    const courseTitle = courses.find(c => c.id === app.id || c.id === app.courseId)?.title || "알 수 없는 과정";
    const updated = applications.map(a => a.id === app.id ? { ...a, status: "rejected", rejectReason: rejectReasonText.trim() } : a);
    await saveApplications(updated);
    
    // Add to history log
    const newLog = {
      id: uid(),
      type: "course_rejected",
      timestamp: new Date().toISOString(),
      adminEmail: currentUser?.email || "admin@okestro.com",
      details: {
        email: app.email,
        courseTitle: courseTitle,
        status: "rejected",
        rejectReason: rejectReasonText.trim()
      }
    };
    await saveHistoryLogs([newLog, ...historyLogs]);
    
    alert("반려 처리되었습니다.");
    setRejectModal(null);
    setRejectReasonText("");
  };

  const handleRegisterApprove = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const updated = users.map(u => u.id === userId ? { ...u, approved: true } : u);
    await saveUsers(updated);
    
    // Add to history log
    const newLog = {
      id: uid(),
      type: "signup_approved",
      timestamp: new Date().toISOString(),
      adminEmail: currentUser?.email || "admin@okestro.com",
      details: {
        name: user.name,
        email: user.email,
        company: user.company,
        division: user.division
      }
    };
    await saveHistoryLogs([newLog, ...historyLogs]);
    
    alert("가입 승인했습니다.");
  };

  const handleRegisterDelete = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (!window.confirm(`${user.name}님의 가입 신청을 정말 반려/삭제하시겠습니까?`)) return;
    const updated = users.filter(u => u.id !== userId);
    await saveUsers(updated);
    
    // Add to history log
    const newLog = {
      id: uid(),
      type: "signup_deleted",
      timestamp: new Date().toISOString(),
      adminEmail: currentUser?.email || "admin@okestro.com",
      details: {
        name: user.name,
        email: user.email,
        company: user.company,
        division: user.division
      }
    };
    await saveHistoryLogs([newLog, ...historyLogs]);
    
    alert("삭제되었습니다.");
  };

  const handleToggleMemberApproval = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newApproved = !user.approved;
    const updated = users.map(u => u.id === userId ? { ...u, approved: newApproved } : u);
    await saveUsers(updated);

    const logType = newApproved ? "signup_approved" : "signup_revoked";
    const newLog = {
      id: uid(),
      type: logType,
      timestamp: new Date().toISOString(),
      adminEmail: currentUser?.email || "admin@okestro.com",
      details: {
        name: user.name,
        email: user.email,
        company: user.company || "",
        division: user.division || ""
      }
    };
    await saveHistoryLogs([newLog, ...historyLogs]);
    alert(newApproved ? "가입을 승인했습니다." : "가입 승인을 취소했습니다.");
  };

  const handleToggleMemberRole = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newRole = user.role === "admin" ? "user" : "admin";
    const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    await saveUsers(updated);
    
    const newLog = {
      id: uid(),
      type: "role_changed",
      timestamp: new Date().toISOString(),
      adminEmail: currentUser?.email || "admin@okestro.com",
      details: {
        name: user.name,
        email: user.email,
        role: newRole,
        company: user.company || "",
        division: user.division || ""
      }
    };
    await saveHistoryLogs([newLog, ...historyLogs]);
    alert(`권한을 ${newRole === "admin" ? "관리자" : "일반회원"}로 변경했습니다.`);
  };

  const handleDeleteMember = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (!window.confirm(`${user.name} 회원을 정말 삭제하시겠습니까?`)) return;
    const updated = users.filter(u => u.id !== userId);
    await saveUsers(updated);

    const newLog = {
      id: uid(),
      type: "signup_deleted",
      timestamp: new Date().toISOString(),
      adminEmail: currentUser?.email || "admin@okestro.com",
      details: {
        name: user.name,
        email: user.email,
        company: user.company || "",
        division: user.division || ""
      }
    };
    await saveHistoryLogs([newLog, ...historyLogs]);
    alert("삭제되었습니다.");
  };


  const uniqueCourseNames = Array.from(new Set(courses.map(c => c.courseName).filter(Boolean)));

  const handleEditCourse = (c) => {
    setEditingCourseId(c.id);
    const hasPreset = ["Cloud Infrastructure", "Artificial Intelligence"].includes(c.courseName) || uniqueCourseNames.includes(c.courseName);
    if (hasPreset && c.courseName) {
      setSelectedCourseNameOption(c.courseName);
      setCustomCourseName("");
    } else {
      setSelectedCourseNameOption("custom");
      setCustomCourseName(c.courseName || "");
    }
    setCourseForm({
      title: c.title || "",
      youtubeUrl: c.youtubeUrl || "",
      description: c.description || ""
    });
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("이 강의 영상을 정말 삭제하시겠습니까?")) return;
    const updated = courses.filter(c => c.id !== courseId);
    await saveCourses(updated);
    alert("삭제되었습니다.");
  };

  const handleSaveCourse = async () => {
    const finalCourseName = selectedCourseNameOption === "custom" ? customCourseName.trim() : selectedCourseNameOption;
    const { title, description, youtubeUrl } = courseForm;
    if (!finalCourseName) {
      alert("교육 과정명을 선택하거나 입력해주세요.");
      return;
    }
    if (!title.trim() || !description.trim() || !youtubeUrl.trim()) {
      alert("모든 필수 입력 항목을 채워주세요.");
      return;
    }
    
    if (editingCourseId) {
      const updated = courses.map(c => c.id === editingCourseId ? {
        ...c,
        courseName: finalCourseName,
        title: title.trim(),
        description: description.trim(),
        youtubeUrl: youtubeUrl.trim(),
        updatedAt: new Date().toISOString()
      } : c);
      await saveCourses(updated);
      alert("강의 영상이 수정되었습니다.");
      setEditingCourseId(null);
    } else {
      const newCourse = {
        id: uid(),
        courseName: finalCourseName,
        title: title.trim(),
        description: description.trim(),
        youtubeUrl: youtubeUrl.trim(),
        createdAt: new Date().toISOString()
      };
      await saveCourses([newCourse, ...courses]);
      alert("강의 영상이 등록되었습니다.");
    }
    
    // Reset Form
    setCourseForm({ title: "", description: "", youtubeUrl: "" });
    setSelectedCourseNameOption("");
    setCustomCourseName("");
  };

  // 일정 등록 및 삭제 핸들러
  const handleCreateSchedule = async () => {
    const { course, date, target, description } = scheduleForm;
    if (!course.trim() || !date || !target.trim()) {
      alert("교육일자, 교육 과정명, 권장 대상을 모두 기입해주세요.");
      return;
    }
    if (editingScheduleId) {
      const updated = schedules.map(s => 
        s.id === editingScheduleId 
          ? { ...s, course: course.trim(), date, target: target.trim(), description: description.trim() } 
          : s
      );
      await saveSchedules(updated);
      alert("교육 일정을 수정하였습니다.");
      setEditingScheduleId(null);
    } else {
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
    }
    setScheduleForm({ course: "", date: selectedCalendarDate || "", target: "", description: "" });
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("이 교육 일정을 삭제하시겠습니까?")) return;
    const updated = schedules.filter(s => s.id !== id);
    await saveSchedules(updated);
    alert("삭제되었습니다.");
    if (editingScheduleId === id) {
      setEditingScheduleId(null);
    }
    setScheduleForm({ course: "", date: selectedCalendarDate || "", target: "", description: "" });
  };

  const handleEditSchedule = (s) => {
    setScheduleForm({
      course: s.course,
      date: s.date,
      target: s.target,
      description: s.description || ""
    });
    setEditingScheduleId(s.id);
  };

  // 페이지 꾸미기 저장 핸들러
  const handleSavePageConfig = async () => {
    // Clear bgImage from individual banners to save Firestore storage
    const cleanedBanners = bannersList.map(banner => {
      const { bgImage, ...rest } = banner;
      return rest;
    });

    const newConfig = {
      heroBgImage: bannersBgImage,
      heroBannerImage: bannersList[0]?.fgImage || "",
      heroBannerFit: bannersList[0]?.fit || "contain",
      banners: cleanedBanners,
      bannersAutoSlide,
      bannersSlideInterval
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
      {adminSubTabGroup === "approval" && (
        <div style={{ display: "flex", gap: "10px", borderBottom: `1.5px solid var(--hairline-strong)`, paddingBottom: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <button onClick={() => setBackTab("apply")} style={{ padding: "8px 16px", border: "none", background: backTab === "apply" ? "var(--primary)" : "none", color: backTab === "apply" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>수강 신청 승인</button>
          <button onClick={() => setBackTab("register")} style={{ padding: "8px 16px", border: "none", background: backTab === "register" ? "var(--primary)" : "none", color: backTab === "register" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>가입 승인</button>
          <button onClick={() => setBackTab("member")} style={{ padding: "8px 16px", border: "none", background: backTab === "member" ? "var(--primary)" : "none", color: backTab === "member" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>가입자 관리</button>
          <button onClick={() => setBackTab("schedule")} style={{ padding: "8px 16px", border: "none", background: backTab === "schedule" ? "var(--primary)" : "none", color: backTab === "schedule" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>일정 관리</button>
          <button onClick={() => setBackTab("notice")} style={{ padding: "8px 16px", border: "none", background: backTab === "notice" ? "var(--primary)" : "none", color: backTab === "notice" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>공지사항 관리</button>
          <button onClick={() => setBackTab("faq")} style={{ padding: "8px 16px", border: "none", background: backTab === "faq" ? "var(--primary)" : "none", color: backTab === "faq" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>FAQ 관리</button>
          <button onClick={() => setBackTab("educourse")} style={{ padding: "8px 16px", border: "none", background: backTab === "educourse" ? "var(--primary)" : "none", color: backTab === "educourse" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>신청 과정 관리</button>
          <button onClick={() => setBackTab("decorator")} style={{ padding: "8px 16px", border: "none", background: backTab === "decorator" ? "var(--primary)" : "none", color: backTab === "decorator" ? "var(--on-primary)" : "var(--body)", fontWeight: 600, borderRadius: "var(--rounded-md)", cursor: "pointer" }}>페이지 꾸미기</button>
        </div>
      )}

      {backTab === "apply" && (
        <div style={{ display: "flex", gap: "24px", flexDirection: "row", alignItems: "stretch", flexWrap: "wrap", marginBottom: "24px" }}>
          {/* Left Panel: 수강 신청 목록 */}
          <div style={{ flex: "1 1 58%", minWidth: "320px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--canvas)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "20px", boxShadow: shadow }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
                  📋 수강 신청 및 대기 내역
                </h4>
                
                {/* Status Filter Tabs */}
                <div style={{ display: "flex", background: "var(--canvas-soft)", padding: "2px", borderRadius: "var(--rounded-md)", border: "1px solid var(--hairline)" }}>
                  {[
                    { val: "all", label: "전체" },
                    { val: "pending", label: "대기중" },
                    { val: "approved", label: "승인완료" },
                    { val: "rejected", label: "반려됨" }
                  ].map(tab => (
                    <button
                      key={tab.val}
                      onClick={() => setApplyFilterStatus(tab.val)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        border: "none",
                        borderRadius: "var(--rounded-sm)",
                        background: applyFilterStatus === tab.val ? "var(--canvas)" : "transparent",
                        color: applyFilterStatus === tab.val ? "var(--ink)" : "var(--body)",
                        boxShadow: applyFilterStatus === tab.val ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "var(--canvas-soft)", borderBottom: "1.5px solid var(--hairline-strong)", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>이메일</th>
                      <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>과정명</th>
                      <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>상태</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredApps = applications.filter(app => {
                        if (applyFilterStatus === "all") return true;
                        return app.status === applyFilterStatus;
                      });

                      if (filteredApps.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
                              해당 내역이 없습니다.
                            </td>
                          </tr>
                        );
                      }

                      return filteredApps.map(app => (
                        <tr key={app.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                          <td style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 500 }}>{app.email}</td>
                          <td style={{ padding: "10px 12px", color: "var(--body)" }}>
                            {courses.find(c => c.id === app.courseId)?.title || "삭제된 과정"}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {app.status === "pending" && (
                              <span style={{ display: "inline-block", padding: "4px 8px", fontSize: "11px", fontWeight: 600, background: "rgba(245, 158, 11, 0.1)", color: "var(--accent-warning)", borderRadius: "var(--rounded-pill)" }}>
                                대기중
                              </span>
                            )}
                            {app.status === "approved" && (
                              <span style={{ display: "inline-block", padding: "4px 8px", fontSize: "11px", fontWeight: 600, background: "rgba(22, 163, 74, 0.1)", color: "var(--semantic-success)", borderRadius: "var(--rounded-pill)" }}>
                                승인완료
                              </span>
                            )}
                            {app.status === "rejected" && (
                              <span 
                                title={`반려 사유: ${app.rejectReason || "없음"}`}
                                style={{ display: "inline-block", padding: "4px 8px", fontSize: "11px", fontWeight: 600, background: "rgba(239, 68, 68, 0.1)", color: "var(--red)", borderRadius: "var(--rounded-pill)", cursor: "help" }}
                              >
                                반려됨
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            {app.status === "pending" ? (
                              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                <button 
                                  onClick={() => handleApprove(app.id)} 
                                  style={{ padding: "5px 10px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s" }}
                                  onMouseOver={e => e.currentTarget.style.opacity = 0.8}
                                  onMouseOut={e => e.currentTarget.style.opacity = 1}
                                >
                                  승인
                                </button>
                                <button 
                                  onClick={() => setRejectModal(app)} 
                                  style={{ padding: "5px 10px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--red)", borderRadius: "var(--rounded-md)", fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
                                  onMouseOver={e => e.currentTarget.style.background = "var(--canvas-soft)"}
                                  onMouseOut={e => e.currentTarget.style.background = "var(--canvas)"}
                                >
                                  반려
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: "var(--muted)", fontSize: "12px" }}>-</span>
                            )}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel: 처리 로그 */}
          <div style={{ flex: "1 1 38%", minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--canvas)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "20px", boxShadow: shadow, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
                  📜 수강 승인 처리 로그
                </h4>
                <button
                  onClick={async () => {
                    if (window.confirm("수강 신청 로그를 모두 비우시겠습니까?")) {
                      const signupLogs = historyLogs.filter(l => l.type === "signup_approved" || l.type === "signup_deleted");
                      await saveHistoryLogs(signupLogs);
                    }
                  }}
                  style={{ background: "none", border: "none", color: "var(--body)", fontSize: "11px", textDecoration: "underline", cursor: "pointer" }}
                >
                  로그 지우기
                </button>
              </div>

              {/* Timeline list */}
              <div style={{ maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
                {(() => {
                  const courseLogs = historyLogs.filter(l => l.type === "course_approved" || l.type === "course_rejected");
                  if (courseLogs.length === 0) {
                    return (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                        기록된 이력이 없습니다.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", borderLeft: "1.5px dashed var(--hairline-strong)", paddingLeft: "16px", marginLeft: "8px" }}>
                      {courseLogs.map(log => {
                        const isApprove = log.type === "course_approved";
                        return (
                          <div key={log.id} style={{ position: "relative", fontSize: "12px" }}>
                            {/* timeline marker */}
                            <div style={{
                              position: "absolute",
                              left: "-23px",
                              top: "4px",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              background: isApprove ? "var(--semantic-success)" : "var(--red)",
                              border: "3px solid var(--canvas)"
                            }} />

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                              <span style={{ fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                                {isApprove ? "✓ 수강 승인 완료" : "✗ 수강 반려 완료"}
                                <span style={{ fontSize: "10px", padding: "1px 4px", background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", borderRadius: "3px", fontWeight: "normal", color: "var(--body)" }}>
                                  {log.adminEmail?.split("@")[0] || "admin"}
                                </span>
                              </span>
                              <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                                {new Date(log.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            <div style={{ background: "var(--canvas-soft)", borderRadius: "var(--rounded-md)", padding: "8px 12px", border: "1px solid var(--hairline)" }}>
                              <div style={{ color: "var(--ink)", fontWeight: 500, marginBottom: "2px" }}>
                                {log.details.email}
                              </div>
                              <div style={{ color: "var(--body)", fontSize: "11px" }}>
                                {log.details.courseTitle}
                              </div>
                              {!isApprove && log.details.rejectReason && (
                                <div style={{ color: "var(--red)", fontSize: "11px", marginTop: "4px", borderTop: "1px dashed var(--hairline-strong)", paddingTop: "4px" }}>
                                  반려 사유: {log.details.rejectReason}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {backTab === "register" && (
        <div style={{ display: "flex", gap: "24px", flexDirection: "row", alignItems: "stretch", flexWrap: "wrap", marginBottom: "24px" }}>
          {/* Left Panel: 가입 신청 / 회원 목록 */}
          <div style={{ flex: "1 1 58%", minWidth: "320px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--canvas)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "20px", boxShadow: shadow }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
                  📋 가입 승인 대기 및 회원 목록
                </h4>
                
                {/* Filter Tab bar */}
                <div style={{ display: "flex", background: "var(--canvas-soft)", padding: "2px", borderRadius: "var(--rounded-md)", border: "1px solid var(--hairline)" }}>
                  {[
                    { val: "pending", label: "승인 대기" },
                    { val: "approved", label: "가입 회원" }
                  ].map(tab => (
                    <button
                      key={tab.val}
                      onClick={() => setRegisterFilterTab(tab.val)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        border: "none",
                        borderRadius: "var(--rounded-sm)",
                        background: registerFilterTab === tab.val ? "var(--canvas)" : "transparent",
                        color: registerFilterTab === tab.val ? "var(--ink)" : "var(--body)",
                        boxShadow: registerFilterTab === tab.val ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                {registerFilterTab === "pending" ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "var(--canvas-soft)", borderBottom: "1.5px solid var(--hairline-strong)", textAlign: "left" }}>
                        <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>이름</th>
                        <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>이메일</th>
                        <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>소속</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const pendingUsers = users.filter(u => !u.approved);
                        if (pendingUsers.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
                                가입 대기 중인 사용자가 없습니다.
                              </td>
                            </tr>
                          );
                        }

                        return pendingUsers.map(u => (
                          <tr key={u.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                            <td style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>{u.name}</td>
                            <td style={{ padding: "10px 12px", color: "var(--body)" }}>{u.email}</td>
                            <td style={{ padding: "10px 12px", color: "var(--body)" }}>{u.company} / {u.division}</td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                <button 
                                  onClick={() => handleRegisterApprove(u.id)} 
                                  style={{ padding: "5px 10px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s" }}
                                  onMouseOver={e => e.currentTarget.style.opacity = 0.8}
                                  onMouseOut={e => e.currentTarget.style.opacity = 1}
                                >
                                  승인
                                </button>
                                <button 
                                  onClick={() => handleRegisterDelete(u.id)} 
                                  style={{ padding: "5px 10px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--red)", borderRadius: "var(--rounded-md)", fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
                                  onMouseOver={e => e.currentTarget.style.background = "var(--canvas-soft)"}
                                  onMouseOut={e => e.currentTarget.style.background = "var(--canvas)"}
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "var(--canvas-soft)", borderBottom: "1.5px solid var(--hairline-strong)", textAlign: "left" }}>
                        <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>이름</th>
                        <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>이메일</th>
                        <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>소속</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const approvedUsers = users.filter(u => u.approved);
                        if (approvedUsers.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
                                가입된 사용자가 없습니다.
                              </td>
                            </tr>
                          );
                        }

                        return approvedUsers.map(u => (
                          <tr key={u.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                            <td style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>{u.name}</td>
                            <td style={{ padding: "10px 12px", color: "var(--body)" }}>{u.email}</td>
                            <td style={{ padding: "10px 12px", color: "var(--body)" }}>{u.company} / {u.division}</td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <span style={{ display: "inline-block", padding: "4px 8px", fontSize: "11px", fontWeight: 600, background: "rgba(22, 163, 74, 0.1)", color: "var(--semantic-success)", borderRadius: "var(--rounded-pill)" }}>
                                가입완료
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: 가입 처리 로그 */}
          <div style={{ flex: "1 1 38%", minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--canvas)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "20px", boxShadow: shadow, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
                  📜 가입 승인 처리 로그
                </h4>
                <button
                  onClick={async () => {
                    if (window.confirm("가입 승인 로그를 모두 비우시겠습니까?")) {
                      const courseLogs = historyLogs.filter(l => l.type === "course_approved" || l.type === "course_rejected");
                      await saveHistoryLogs(courseLogs);
                    }
                  }}
                  style={{ background: "none", border: "none", color: "var(--body)", fontSize: "11px", textDecoration: "underline", cursor: "pointer" }}
                >
                  로그 지우기
                </button>
              </div>

              {/* Timeline list */}
              <div style={{ maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
                {(() => {
                  const signupLogs = historyLogs.filter(l => l.type === "signup_approved" || l.type === "signup_deleted" || l.type === "signup_revoked" || l.type === "role_changed");
                  if (signupLogs.length === 0) {
                    return (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                        기록된 이력이 없습니다.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", borderLeft: "1.5px dashed var(--hairline-strong)", paddingLeft: "16px", marginLeft: "8px" }}>
                      {signupLogs.map(log => {
                        let isApprove = log.type === "signup_approved";
                        let markerBg = "var(--red)";
                        let logLabel = "";
                        
                        if (log.type === "signup_approved") {
                          logLabel = "✓ 가입 승인 완료";
                          markerBg = "var(--semantic-success)";
                        } else if (log.type === "signup_deleted") {
                          logLabel = "✗ 신청 삭제 완료";
                          markerBg = "var(--red)";
                        } else if (log.type === "signup_revoked") {
                          logLabel = "✗ 가입 승인 취소";
                          markerBg = "var(--orange, #f97316)";
                        } else if (log.type === "role_changed") {
                          logLabel = `⚙ 권한 변경 (${log.details?.role === "admin" ? "관리자" : "일반"})`;
                          markerBg = "#9333ea";
                        }

                        return (
                          <div key={log.id} style={{ position: "relative", fontSize: "12px" }}>
                            {/* timeline marker */}
                            <div style={{
                              position: "absolute",
                              left: "-23px",
                              top: "4px",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              background: markerBg,
                              border: "3px solid var(--canvas)"
                            }} />

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                              <span style={{ fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                                {logLabel}
                                <span style={{ fontSize: "10px", padding: "1px 4px", background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", borderRadius: "3px", fontWeight: "normal", color: "var(--body)" }}>
                                  {log.adminEmail?.split("@")[0] || "admin"}
                                </span>
                              </span>
                              <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                                {new Date(log.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            <div style={{ background: "var(--canvas-soft)", borderRadius: "var(--rounded-md)", padding: "8px 12px", border: "1px solid var(--hairline)" }}>
                              <div style={{ color: "var(--ink)", fontWeight: 500, marginBottom: "2px" }}>
                                {log.details?.name} ({log.details?.email})
                              </div>
                              {log.details?.company && (
                                <div style={{ color: "var(--body)", fontSize: "11px" }}>
                                  소속: {log.details.company} / {log.details.division}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {backTab === "member" && (
        <div style={{ display: "flex", gap: "24px", flexDirection: "row", alignItems: "stretch", flexWrap: "wrap", marginBottom: "24px" }}>
          {/* Left Panel: 가입자 목록 및 검색/필터 */}
          <div style={{ flex: "1 1 58%", minWidth: "320px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--canvas)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "20px", boxShadow: shadow }}>
              
              {/* Header and Filters */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
                    👥 전체 가입자 관리 ({users.filter(u => {
                      const query = memberSearchQuery.trim().toLowerCase();
                      const matchesQuery = !query || 
                        (u.name && u.name.toLowerCase().includes(query)) || 
                        (u.email && u.email.toLowerCase().includes(query));
                      
                      const matchesRole = memberFilterRole === "all" || u.role === memberFilterRole;
                      
                      let matchesStatus = true;
                      if (memberFilterStatus === "approved") {
                        matchesStatus = u.approved;
                      } else if (memberFilterStatus === "pending") {
                        matchesStatus = !u.approved;
                      }
                      
                      return matchesQuery && matchesRole && matchesStatus;
                    }).length}명)
                  </h4>
                </div>
                
                {/* Search & Filters Row */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="이름 또는 이메일 검색..."
                    value={memberSearchQuery}
                    onChange={e => setMemberSearchQuery(e.target.value)}
                    style={inpStyle({ padding: "6px 12px", fontSize: "13px", flex: "1 1 200px" })}
                  />
                  
                  {/* Status Filter */}
                  <select
                    value={memberFilterStatus}
                    onChange={e => setMemberFilterStatus(e.target.value)}
                    style={inpStyle({ padding: "6px 12px", fontSize: "13px", width: "120px" })}
                  >
                    <option value="all">가입상태: 전체</option>
                    <option value="approved">승인 완료</option>
                    <option value="pending">승인 대기</option>
                  </select>

                  {/* Role Filter */}
                  <select
                    value={memberFilterRole}
                    onChange={e => setMemberFilterRole(e.target.value)}
                    style={inpStyle({ padding: "6px 12px", fontSize: "13px", width: "120px" })}
                  >
                    <option value="all">권한: 전체</option>
                    <option value="admin">관리자</option>
                    <option value="user">일반회원</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "var(--canvas-soft)", borderBottom: "1.5px solid var(--hairline-strong)", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>이름</th>
                      <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>이메일</th>
                      <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>구분</th>
                      <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>상태</th>
                      <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>권한</th>
                      <th style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>가입일</th>
                      <th style={{ padding: "10px 12px", textAlign: "center", color: "var(--ink)", fontWeight: 600 }}>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredMembers = users.filter(u => {
                        const query = memberSearchQuery.trim().toLowerCase();
                        const matchesQuery = !query || 
                          (u.name && u.name.toLowerCase().includes(query)) || 
                          (u.email && u.email.toLowerCase().includes(query));
                        
                        const matchesRole = memberFilterRole === "all" || u.role === memberFilterRole;
                        
                        let matchesStatus = true;
                        if (memberFilterStatus === "approved") {
                          matchesStatus = u.approved;
                        } else if (memberFilterStatus === "pending") {
                          matchesStatus = !u.approved;
                        }
                        
                        return matchesQuery && matchesRole && matchesStatus;
                      });

                      if (filteredMembers.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
                              검색 조건에 맞는 가입자가 없습니다.
                            </td>
                          </tr>
                        );
                      }

                      return filteredMembers.map(u => {
                        const isOkestro = u.email?.toLowerCase().endsWith("@okestro.com");
                        return (
                          <tr key={u.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                            <td style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>{u.name}</td>
                            <td style={{ padding: "10px 12px", color: "var(--body)" }}>{u.email}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: isOkestro ? "rgba(37, 99, 235, 0.1)" : "rgba(249, 115, 22, 0.1)",
                                color: isOkestro ? "var(--primary)" : "var(--orange, #f97316)"
                              }}>
                                {isOkestro ? "사내 임직원" : "파트너사"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: u.approved ? "var(--semantic-success)" : "var(--orange, #f97316)"
                              }}>
                                {u.approved ? "● 승인 완료" : "○ 승인 대기"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: u.role === "admin" ? "rgba(147, 51, 234, 0.1)" : "rgba(107, 114, 128, 0.1)",
                                color: u.role === "admin" ? "#9333ea" : "#6b7280"
                              }}>
                                {u.role === "admin" ? "관리자" : "일반"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px", color: "var(--muted)" }}>
                              {u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : "-"}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                <button 
                                  onClick={() => handleToggleMemberApproval(u.id)} 
                                  style={{ padding: "4px 8px", background: u.approved ? "var(--canvas)" : "var(--primary)", border: u.approved ? "1px solid var(--hairline-strong)" : "none", color: u.approved ? "var(--ink)" : "var(--on-primary)", borderRadius: "var(--rounded-md)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                                >
                                  {u.approved ? "승인 취소" : "승인"}
                                </button>
                                <button 
                                  onClick={() => handleToggleMemberRole(u.id)} 
                                  style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--ink)", borderRadius: "var(--rounded-md)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                                >
                                  권한 변경
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedCredsUser(u);
                                    setShowCredsModal(true);
                                  }} 
                                  style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--ink)", borderRadius: "var(--rounded-md)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                                >
                                  정보 보기
                                </button>
                                <button 
                                  onClick={() => handleDeleteMember(u.id)} 
                                  style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--red)", borderRadius: "var(--rounded-md)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel: 가입자 관리 처리 로그 */}
          <div style={{ flex: "1 1 38%", minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--canvas)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", padding: "20px", boxShadow: shadow, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
                  📜 가입자 관리 처리 로그
                </h4>
                <button
                  onClick={async () => {
                    if (window.confirm("가입자 관리 로그를 모두 비우시겠습니까?")) {
                      const otherLogs = historyLogs.filter(l => l.type !== "signup_approved" && l.type !== "signup_deleted" && l.type !== "signup_revoked" && l.type !== "role_changed");
                      await saveHistoryLogs(otherLogs);
                    }
                  }}
                  style={{ background: "none", border: "none", color: "var(--body)", fontSize: "11px", textDecoration: "underline", cursor: "pointer" }}
                >
                  로그 지우기
                </button>
              </div>

              {/* Timeline list */}
              <div style={{ maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
                {(() => {
                  const signupLogs = historyLogs.filter(l => l.type === "signup_approved" || l.type === "signup_deleted" || l.type === "signup_revoked" || l.type === "role_changed");
                  if (signupLogs.length === 0) {
                    return (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                        기록된 이력이 없습니다.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", borderLeft: "1.5px dashed var(--hairline-strong)", paddingLeft: "16px", marginLeft: "8px" }}>
                      {signupLogs.map(log => {
                        let isApprove = log.type === "signup_approved";
                        let isRoleChange = log.type === "role_changed";
                        let isRevoke = log.type === "signup_revoked";
                        
                        let logLabel = "";
                        let markerBg = "var(--red)";
                        if (log.type === "signup_approved") {
                          logLabel = "✓ 가입 승인 완료";
                          markerBg = "var(--semantic-success)";
                        } else if (log.type === "signup_deleted") {
                          logLabel = "✗ 회원 계정 삭제";
                          markerBg = "var(--red)";
                        } else if (log.type === "signup_revoked") {
                          logLabel = "✗ 가입 승인 취소";
                          markerBg = "var(--orange, #f97316)";
                        } else if (log.type === "role_changed") {
                          logLabel = `⚙ 권한 변경 (${log.details?.role === "admin" ? "관리자" : "일반"})`;
                          markerBg = "#9333ea";
                        }

                        return (
                          <div key={log.id} style={{ position: "relative", fontSize: "12px" }}>
                            {/* timeline marker */}
                            <div style={{
                              position: "absolute",
                              left: "-23px",
                              top: "4px",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              background: markerBg,
                              border: "3px solid var(--canvas)"
                            }} />

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                              <span style={{ fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                                {logLabel}
                                <span style={{ fontSize: "10px", padding: "1px 4px", background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", borderRadius: "3px", fontWeight: "normal", color: "var(--body)" }}>
                                  {log.adminEmail?.split("@")[0] || "admin"}
                                </span>
                              </span>
                              <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                                {new Date(log.timestamp).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            <div style={{ background: "var(--canvas-soft)", borderRadius: "var(--rounded-md)", padding: "8px 12px", border: "1px solid var(--hairline)" }}>
                              <div style={{ color: "var(--ink)", fontWeight: 500, marginBottom: "2px" }}>
                                {log.details?.name} ({log.details?.email})
                              </div>
                              {log.details?.company && (
                                <div style={{ color: "var(--body)", fontSize: "11px" }}>
                                  소속: {log.details.company} / {log.details.division}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 가입 계정 정보(ID/PW) 보기 모달 */}
      {showCredsModal && selectedCredsUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 20000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            background: "var(--surface-card)",
            borderRadius: "var(--rounded-lg)",
            padding: "24px",
            width: "360px",
            boxShadow: shadowLg,
            border: "1px solid var(--hairline-strong)",
            position: "relative"
          }}>
            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              🔑 계정 정보 확인
            </h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--body)", marginBottom: "4px" }}>회원 이름</label>
                <div style={{ padding: "8px 12px", background: "var(--canvas-soft)", border: "1px solid var(--hairline)", borderRadius: "var(--rounded-md)", fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>
                  {selectedCredsUser.name}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--body)", marginBottom: "4px" }}>ID (이메일)</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={selectedCredsUser.email} 
                    style={inpStyle({ background: "var(--canvas-soft)", flex: 1, fontSize: "12px", padding: "6px 10px" })} 
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCredsUser.email);
                      alert("이메일 주소가 클립보드에 복사되었습니다.");
                    }}
                    style={{ padding: "6px 10px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-md)", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
                  >
                    복사
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--body)", marginBottom: "4px" }}>PW (비밀번호)</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={selectedCredsUser.password || "비밀번호 없음"} 
                    style={inpStyle({ background: "var(--canvas-soft)", flex: 1, fontSize: "12px", padding: "6px 10px", fontFamily: "monospace" })} 
                  />
                  {selectedCredsUser.password && (
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCredsUser.password);
                        alert("비밀번호가 클립보드에 복사되었습니다.");
                      }}
                      style={{ padding: "6px 10px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-md)", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
                    >
                      복사
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => {
                  setShowCredsModal(false);
                  setSelectedCredsUser(null);
                }}
                style={{ padding: "8px 16px", background: "var(--primary)", border: "none", color: "var(--on-primary)", borderRadius: "var(--rounded-md)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {backTab === "create" && (
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          {/* Left Form */}
          <div style={{ flex: 1, minWidth: "360px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
              📺 {editingCourseId ? "강의 영상 수정" : "신규 강의 영상 등록"}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--canvas-soft)", border: "1px solid var(--hairline)", padding: "20px", borderRadius: "var(--rounded-lg)" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>교육 과정명 *</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <select 
                    value={selectedCourseNameOption} 
                    onChange={e => setSelectedCourseNameOption(e.target.value)} 
                    style={inpStyle()}
                  >
                    <option value="">-- 교육 과정 선택 --</option>
                    {["Cloud Infrastructure", "Artificial Intelligence"].map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    {uniqueCourseNames.filter(name => !["Cloud Infrastructure", "Artificial Intelligence"].includes(name)).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value="custom">+ 직접 입력 (Create New)</option>
                  </select>
                  {selectedCourseNameOption === "custom" && (
                    <input 
                      type="text" 
                      placeholder="교육 과정명을 직접 입력하세요" 
                      value={customCourseName} 
                      onChange={e => setCustomCourseName(e.target.value)} 
                      style={inpStyle()} 
                    />
                  )}
                </div>
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>강의 제목 *</label>
                <input 
                  type="text" 
                  value={courseForm.title} 
                  onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} 
                  style={inpStyle()} 
                  placeholder="예: AWS VPC 네트워킹 기본 개념 및 실습"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>유튜브 링크 *</label>
                <input 
                  type="text" 
                  value={courseForm.youtubeUrl} 
                  onChange={e => setCourseForm({ ...courseForm, youtubeUrl: e.target.value })} 
                  style={inpStyle()} 
                  placeholder="예: https://www.youtube.com/watch?v=g38U-Xp_kHY"
                />
                <span style={{ display: "block", fontSize: "11px", color: "var(--accent-warning)", marginTop: "6px", lineHeight: "1.4" }}>
                  ⚠️ YouTube 동영상 상세 설정에서 <strong>'퍼가기 허용(Embedding)'</strong>이 활성화되어 있어야 강의실에서 정상 재생됩니다. 저작권 제한 음원이나 비공개 영상은 임베드 플레이어에서 오류가 발생할 수 있습니다.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>강의 설명 *</label>
                <textarea 
                  value={courseForm.description} 
                  onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} 
                  style={{ ...inpStyle(), minHeight: "100px", resize: "vertical" }} 
                  placeholder="강의 세부 설명 또는 핵심 학습 내용에 대해 작성해 주세요."
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button onClick={handleSaveCourse} 
                  style={{ 
                    flex: 1,
                    padding: "12px", 
                    background: "var(--primary)", 
                    color: "var(--on-primary)", 
                    border: "none", 
                    borderRadius: "var(--rounded-md)", 
                    cursor: "pointer", 
                    fontWeight: 600,
                    fontSize: "14px"
                  }}
                >
                  {editingCourseId ? "수정하기" : "등록하기"}
                </button>
                {editingCourseId && (
                  <button onClick={() => {
                    setEditingCourseId(null);
                    setCourseForm({ title: "", description: "", youtubeUrl: "" });
                    setSelectedCourseNameOption("");
                    setCustomCourseName("");
                  }} 
                    style={{ 
                      padding: "12px 18px", 
                      background: "var(--canvas)", 
                      color: "var(--ink)", 
                      border: "1px solid var(--hairline-strong)", 
                      borderRadius: "var(--rounded-md)", 
                      cursor: "pointer", 
                      fontWeight: 500,
                      fontSize: "14px"
                    }}
                  >
                    취소
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right List Table */}
          <div style={{ flex: 1.5, minWidth: "500px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
              📋 등록된 강의 영상 목록 ({courses.length}개)
            </h4>
            <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline)", borderRadius: "var(--rounded-lg)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--surface-card)", borderBottom: "1.5px solid var(--hairline-strong)", textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600, width: "50px" }}>No</th>
                    <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600, width: "120px" }}>교육 과정명</th>
                    <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600 }}>강의 제목</th>
                    <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600, width: "100px" }}>유튜브 링크</th>
                    <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600, width: "100px" }}>등록일</th>
                    <th style={{ padding: "12px 16px", color: "var(--ink)", fontWeight: 600, width: "100px", textAlign: "center" }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "var(--body)" }}>
                        등록된 강의 동영상이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    courses.map((c, index) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid var(--hairline)", background: editingCourseId === c.id ? "#f0f7ff" : "transparent" }}>
                        <td style={{ padding: "12px 16px", color: "var(--body)" }}>{courses.length - index}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink)" }}>{c.courseName || "기타 과정"}</td>
                        <td style={{ padding: "12px 16px", color: "var(--ink)" }}>{c.title}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <a href={getAbsoluteUrl(c.youtubeUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-link)", textDecoration: "none" }} title={c.youtubeUrl}>
                            📺 이동
                          </a>
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--body)", fontSize: "11px" }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button onClick={() => handleEditCourse(c)} style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-sm)", fontSize: "11px", color: "var(--ink)", cursor: "pointer" }}>
                              수정
                            </button>
                            <button onClick={() => handleDeleteCourse(c.id)} style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid #fecaca", borderRadius: "var(--rounded-sm)", fontSize: "11px", color: "#ef4444", cursor: "pointer" }}>
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 일정 관리 탭 UI [NEW] */}
      {backTab === "schedule" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h4 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>📅 교육 일정 관리</h4>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button 
                onClick={handlePrevMonth} 
                style={{ padding: "6px 12px", background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "background 0.2s" }}
                onMouseEnter={e => e.target.style.background = "var(--hairline)"}
                onMouseLeave={e => e.target.style.background = "var(--canvas-soft)"}
              >
                &lt;
              </button>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", minWidth: "100px", textAlign: "center" }}>
                {adminYear}년 {adminMonth + 1}월
              </span>
              <button 
                onClick={handleNextMonth} 
                style={{ padding: "6px 12px", background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "background 0.2s" }}
                onMouseEnter={e => e.target.style.background = "var(--hairline)"}
                onMouseLeave={e => e.target.style.background = "var(--canvas-soft)"}
              >
                &gt;
              </button>
            </div>
          </div>

          <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-lg)", overflow: "hidden", background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}>
            {/* 요일 헤더 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--hairline-strong)", padding: "10px 0", textAlign: "center", fontWeight: 700, fontSize: "12px", color: "var(--body)", background: "var(--canvas-soft)" }}>
              <div style={{ color: "var(--red)" }}>일요일</div>
              <div>월요일</div>
              <div>화요일</div>
              <div>수요일</div>
              <div>목요일</div>
              <div>금요일</div>
              <div style={{ color: "var(--text-link)" }}>토요일</div>
            </div>
            {/* 날짜 그리드 */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {rows.map((r, rIdx) => (
                <div key={rIdx} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: rIdx === rows.length - 1 ? "none" : "1px solid var(--hairline)", minHeight: "110px" }}>
                  {r.map((day, dIdx) => {
                    const dayStr = day ? `${adminYear}-${String(adminMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : "";
                    const dayEvents = day ? schedules.filter(s => s.date === dayStr) : [];
                    return (
                      <div 
                        key={dIdx} 
                        onClick={() => {
                          if (day) {
                            setSelectedCalendarDate(dayStr);
                            setScheduleForm({ course: "", date: dayStr, target: "", description: "" });
                            setEditingScheduleId(null);
                          }
                        }}
                        style={{ 
                          padding: "8px", 
                          background: day ? "var(--surface-card)" : "var(--canvas-soft)", 
                          borderRight: dIdx === 6 ? "none" : "1px solid var(--hairline)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          justifyContent: "flex-start",
                          boxSizing: "border-box",
                          cursor: day ? "pointer" : "default",
                          transition: "background 0.2s",
                          minHeight: "110px",
                          position: "relative"
                        }}
                        onMouseEnter={e => { if (day) e.currentTarget.style.background = "var(--canvas-soft)"; }}
                        onMouseLeave={e => { if (day) e.currentTarget.style.background = "var(--surface-card)"; }}
                      >
                        {day && (
                          <div style={{ 
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "6px"
                          }}>
                            <span style={{ 
                              fontSize: "12px", 
                              fontWeight: 700, 
                              color: dIdx === 0 ? "var(--red)" : (dIdx === 6 ? "var(--text-link)" : "var(--ink)")
                            }}>
                              {day}
                            </span>
                            {dayEvents.length > 0 && (
                              <span style={{ fontSize: "10px", padding: "1px 5px", background: "var(--primary)", color: "var(--on-primary)", borderRadius: "10px", fontWeight: 600 }}>
                                {dayEvents.length}
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", overflowY: "hidden" }}>
                          {dayEvents.slice(0, 3).map(s => (
                            <div 
                              key={s.id} 
                              style={{ 
                                fontSize: "11px", 
                                background: "rgba(37, 99, 235, 0.06)", 
                                color: "var(--primary)", 
                                border: "1px solid rgba(37, 99, 235, 0.15)",
                                borderRadius: "var(--rounded-sm)", 
                                padding: "2px 4px", 
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                fontWeight: 500
                              }}
                              title={s.course}
                            >
                              {s.course}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div style={{ fontSize: "10px", color: "var(--muted)", paddingLeft: "4px", fontWeight: 500 }}>
                              외 {dayEvents.length - 3}개 더보기...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 일정 관리 팝업 모달 */}
          {selectedCalendarDate && (
            <div onClick={e => e.target === e.currentTarget && setSelectedCalendarDate(null)} style={{ 
              position: "fixed", 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: "rgba(0,0,0,0.45)", 
              zIndex: 1000, 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center",
              backdropFilter: "blur(3px)"
            }}>
              <div style={{ 
                background: "var(--surface-card)", 
                border: "1px solid var(--hairline-strong)", 
                borderRadius: "var(--rounded-lg)", 
                boxShadow: "var(--shadow-lg)", 
                width: "550px", 
                maxWidth: "90%", 
                maxHeight: "85vh", 
                overflowY: "auto", 
                display: "flex", 
                flexDirection: "column", 
                gap: "24px", 
                padding: "24px", 
                position: "relative" 
              }}>
                {/* 모달 헤더 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline-strong)", paddingBottom: "12px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                    📅 {selectedCalendarDate} 교육 일정 관리
                  </h4>
                  <button 
                    onClick={() => {
                      setSelectedCalendarDate(null);
                      setEditingScheduleId(null);
                      setScheduleForm({ course: "", date: "", target: "", description: "" });
                    }}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: "var(--body)", 
                      fontSize: "18px", 
                      fontWeight: 600, 
                      cursor: "pointer" 
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* 등록된 일정 목록 */}
                <div>
                  <h5 style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: "0 0 10px 0" }}>📋 등록된 일정</h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {schedules.filter(s => s.date === selectedCalendarDate).map(s => (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "var(--canvas-soft)", border: "1px solid var(--hairline)", padding: "12px", borderRadius: "var(--rounded-md)" }}>
                        <div style={{ flex: 1, marginRight: "12px" }}>
                          <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--ink)" }}>{s.course}</div>
                          <div style={{ fontSize: "12px", color: "var(--body)", marginTop: "4px" }}>🎯 대상: {s.target}</div>
                          {s.description && <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", whiteSpace: "pre-wrap" }}>📝 {s.description}</div>}
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          <button 
                            onClick={() => handleEditSchedule(s)} 
                            style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--primary)", borderRadius: "var(--rounded-sm)", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => handleDeleteSchedule(s.id)} 
                            style={{ padding: "4px 8px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--red)", borderRadius: "var(--rounded-sm)", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                    {schedules.filter(s => s.date === selectedCalendarDate).length === 0 && (
                      <div style={{ textAlign: "center", padding: "16px", color: "var(--muted)", fontSize: "12px" }}>
                        등록된 교육 일정이 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                {/* 일정 등록 / 수정 폼 */}
                <div style={{ borderTop: "1px solid var(--hairline-strong)", paddingTop: "16px" }}>
                  <h5 style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: "0 0 12px 0" }}>
                    {editingScheduleId ? "✏️ 일정 수정" : "➕ 새 일정 추가"}
                  </h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>교육 과정명 *</label>
                      <input 
                        type="text" 
                        value={scheduleForm.course} 
                        onChange={e => setScheduleForm({ ...scheduleForm, course: e.target.value })} 
                        placeholder="예) AI Agent 설계 및 구축 실전" 
                        style={inpStyle({ padding: "8px 12px" })} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>수강 권장 대상 *</label>
                      <input 
                        type="text" 
                        value={scheduleForm.target} 
                        onChange={e => setScheduleForm({ ...scheduleForm, target: e.target.value })} 
                        placeholder="예) 사내 엔지니어 및 기획자" 
                        style={inpStyle({ padding: "8px 12px" })} 
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>상세 설명</label>
                      <textarea 
                        value={scheduleForm.description} 
                        onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })} 
                        placeholder="교육 내용 개요 기입" 
                        style={inpStyle({ padding: "8px 12px", minHeight: "60px", resize: "none" })} 
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button 
                        onClick={handleCreateSchedule} 
                        style={{ flex: 1, padding: "10px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                      >
                        {editingScheduleId ? "수정 완료" : "등록 완료"}
                      </button>
                      {editingScheduleId && (
                        <button 
                          onClick={() => {
                            setEditingScheduleId(null);
                            setScheduleForm({ course: "", date: selectedCalendarDate, target: "", description: "" });
                          }} 
                          style={{ padding: "10px 14px", background: "var(--canvas)", border: "1px solid var(--hairline-strong)", color: "var(--body)", borderRadius: "var(--rounded-md)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                <HtmlEditor 
                  value={noticeForm.content} 
                  onChange={html => setNoticeForm({ ...noticeForm, content: html })} 
                  placeholder="공지사항 상세 내용을 작성하세요." 
                  minHeight="220px" 
                />
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
                <HtmlEditor 
                  value={faqForm.answer} 
                  onChange={html => setFaqForm({ ...faqForm, answer: html })} 
                  placeholder="FAQ 상세 답변을 작성하세요." 
                  minHeight="180px" 
                />
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
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>🎨 상단 배너 캐러셀 및 레이어 설정</h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* 1. 캐러셀 슬라이드 동작 설정 */}
              <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", padding: "16px", borderRadius: "var(--rounded-lg)", display: "flex", flexDirection: "column", gap: "12px" }}>
                <h5 style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>⚙️ 캐러셀 슬라이드 설정</h5>
                <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--ink)", cursor: "pointer", fontWeight: 600 }}>
                    <input 
                      type="radio" 
                      name="autoSlide" 
                      checked={bannersAutoSlide} 
                      onChange={() => setBannersAutoSlide(true)} 
                    />
                    자동 슬라이드 재생 (Auto Slide)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--ink)", cursor: "pointer", fontWeight: 600 }}>
                    <input 
                      type="radio" 
                      name="autoSlide" 
                      checked={!bannersAutoSlide} 
                      onChange={() => setBannersAutoSlide(false)} 
                    />
                    수동 슬라이드 재생 전용 (Manual)
                  </label>
                </div>
                
                {bannersAutoSlide && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid var(--hairline)", paddingTop: "12px" }}>
                    <span style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 600 }}>슬라이드 전환 간격:</span>
                    <select 
                      value={bannersSlideInterval} 
                      onChange={e => setBannersSlideInterval(Number(e.target.value))}
                      style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "var(--rounded-xs)", border: "1px solid var(--hairline-strong)", background: "var(--canvas)" }}
                    >
                      <option value={3000}>3초 (3000ms)</option>
                      <option value={5000}>5초 (5000ms)</option>
                      <option value={7000}>7초 (7000ms)</option>
                      <option value={10000}>10초 (10000ms)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 2. 통합 배너 배경 이미지 설정 */}
              <div style={{ background: "var(--canvas-soft)", border: "1px solid var(--hairline-strong)", padding: "16px", borderRadius: "var(--rounded-lg)", display: "flex", flexDirection: "column", gap: "12px" }}>
                <h5 style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>🏞️ 통합 배너 배경 이미지 설정</h5>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--ink)", marginBottom: "2px" }}>
                  배너 공통 배경 이미지 등록 (배경 레이어)
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleUnifiedBgUpload} 
                  style={{ fontSize: "12px", color: "var(--body)" }} 
                />
                {bannersBgImage && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                    <div style={{ width: "120px", height: "45px", borderRadius: "var(--rounded-xs)", border: "1px solid var(--hairline-strong)", overflow: "hidden", background: "var(--canvas-soft)" }}>
                      <img src={bannersBgImage} alt="BG Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setBannersBgImage("")}
                      style={{ padding: "4px 8px", background: "none", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "var(--rounded-sm)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                    >
                      배경 제거
                    </button>
                  </div>
                )}
              </div>

              {/* 3. 배너 목록 및 편집 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>📋 배너 목록 ({bannersList.length}/5)</h5>
                  {bannersList.length < 5 && (
                    <button 
                      type="button"
                      onClick={handleAddBanner}
                      style={{ padding: "6px 12px", background: "var(--primary)", color: "var(--on-primary)", border: "none", borderRadius: "var(--rounded-md)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                    >
                      ➕ 새 배너 추가
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {bannersList.map((banner, index) => (
                    <div 
                      key={banner.id} 
                      style={{ 
                        background: "var(--surface-card)", 
                        border: "1px solid var(--hairline-strong)", 
                        borderRadius: "var(--rounded-lg)", 
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline)", paddingBottom: "10px" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--ink)" }}>✨ 배너 #{index + 1}</span>
                        {bannersList.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleDeleteBanner(banner.id)}
                            style={{ padding: "4px 8px", background: "none", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "var(--rounded-sm)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                          >
                            제거
                          </button>
                        )}
                      </div>

                      {/* 1. 상단 레이어 (전경 PNG) */}
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>🖼️ 상단 배너 이미지 등록 (PNG - 전경 레이어)</label>
                        <input 
                          type="file" 
                          accept="image/png" 
                          onChange={(e) => handleBannerImageUpload(banner.id, e)} 
                          style={{ fontSize: "12px", color: "var(--body)" }} 
                        />
                        {banner.fgImage && (
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                            <div style={{ width: "80px", height: "30px", borderRadius: "var(--rounded-xs)", border: "1px solid var(--hairline-strong)", overflow: "hidden", background: "var(--canvas-soft)" }}>
                              <img src={banner.fgImage} alt="FG Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleUpdateBannerField(banner.id, "fgImage", "")}
                              style={{ padding: "3px 6px", background: "none", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "var(--rounded-sm)", fontSize: "11px", cursor: "pointer" }}
                            >
                              전경 제거
                            </button>
                            
                            <span style={{ fontSize: "12px", color: "var(--ink)", marginLeft: "auto" }}>맞춤:</span>
                            <select 
                              value={banner.fit || "contain"} 
                              onChange={e => handleUpdateBannerField(banner.id, "fit", e.target.value)}
                              style={{ padding: "2px 6px", fontSize: "11px", borderRadius: "var(--rounded-xs)", border: "1px solid var(--hairline-strong)", background: "var(--canvas)" }}
                            >
                              <option value="contain">Contain</option>
                              <option value="cover">Cover</option>
                              <option value="100% 100%">Fill</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
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
              background: "#000",
              position: "relative"
            }}>
              {/* Preview Hero Band */}
              <div style={{ 
                backgroundImage: bannersBgImage 
                  ? `url(${bannersBgImage})` 
                  : "linear-gradient(135deg, #cfe7ff, #a8c8e8)",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "cover",
                padding: "0", 
                height: "180px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden"
              }}>
                {bannersList[previewSlide]?.fgImage && (
                  <img 
                    src={bannersList[previewSlide].fgImage} 
                    alt="Preview Top Layer" 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: bannersList[previewSlide].fit || "contain", 
                      pointerEvents: "none" 
                    }} 
                  />
                )}
              </div>

              {/* Preview Controls (Indicators) */}
              {bannersList.length > 1 && (
                <div style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  display: "flex",
                  gap: "4px"
                }}>
                  {bannersList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPreviewSlide(idx)}
                      style={{
                        width: idx === previewSlide ? "12px" : "6px",
                        height: "6px",
                        borderRadius: "3px",
                        border: "none",
                        background: idx === previewSlide ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        padding: 0
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            {bannersList.length > 1 && (
              <span style={{ fontSize: "11px", color: "var(--body)", textAlign: "center" }}>
                현재 미리보기: 슬라이드 {previewSlide + 1} / {bannersList.length}
              </span>
            )}
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
      var subject = "[AIDA OASIS] 신규 교육 과정 수강 신청: " + data.courseName;
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

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "4px" }}>과정 썸네일 / 배너 이미지 *</label>
                    
                    {/* 드래그 앤 드랍 영역 */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = "var(--primary)";
                        e.currentTarget.style.background = "var(--canvas-soft)";
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = "var(--hairline-strong)";
                        e.currentTarget.style.background = "transparent";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = "var(--hairline-strong)";
                        e.currentTarget.style.background = "transparent";
                        
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith("image/")) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setEduCourseForm({ ...eduCourseForm, bgImage: event.target.result });
                          };
                          reader.readAsDataURL(file);
                        } else {
                          alert("이미지 파일만 등록할 수 있습니다.");
                        }
                      }}
                      onClick={() => {
                        document.getElementById("edu-thumbnail-input").click();
                      }}
                      style={{
                        border: "2px dashed var(--hairline-strong)",
                        borderRadius: "8px",
                        padding: "20px",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        position: "relative",
                        minHeight: "100px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}
                    >
                      <input
                        id="edu-thumbnail-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setEduCourseForm({ ...eduCourseForm, bgImage: event.target.result });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ display: "none" }}
                      />

                      {eduCourseForm.bgImage ? (
                        <div style={{ position: "relative", width: "100%", maxHeight: "150px", overflow: "hidden", borderRadius: "6px" }}>
                          <img
                            src={eduCourseForm.bgImage}
                            alt="Preview"
                            style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "6px" }}
                          />
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setEduCourseForm({ ...eduCourseForm, bgImage: "" });
                            }}
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              background: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              borderRadius: "50%",
                              width: "24px",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer"
                            }}
                          >
                            ✕
                          </div>
                        </div>
                      ) : (
                        <>
                          <span style={{ fontSize: "24px" }}>📁</span>
                          <span style={{ fontSize: "13px", color: "var(--body)" }}>
                            이미지 파일을 드래그하여 놓거나 <strong>클릭하여 업로드</strong>하세요.
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--body-muted)" }}>
                            (권장 비율: 16:9, 미등록 시 기본 그라데이션 자동 적용)
                          </span>
                        </>
                      )}
                    </div>
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

                  {/* 교육 진행 방식 선택 (이론 / 실습 / 이론+실습 클릭식) */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--body)", marginBottom: "8px", fontWeight: 600 }}>🏫 교육 진행 방식 *</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      {["이론", "실습", "이론+실습"].map(method => {
                        const isSelected = eduCourseForm.teachingMethod.trim() === method;
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setEduCourseForm({ ...eduCourseForm, teachingMethod: method })}
                            style={{
                              flex: 1,
                              padding: "10px 12px",
                              borderRadius: "var(--rounded-md)",
                              border: `1px solid ${isSelected ? "var(--primary)" : "var(--hairline-strong)"}`,
                              background: isSelected ? "var(--primary)" : "var(--canvas)",
                              color: isSelected ? "var(--on-primary)" : "var(--ink)",
                              fontWeight: 600,
                              fontSize: "13px",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              textAlign: "center"
                            }}
                          >
                            {method}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 불릿 리스트 편집 영역 */}
                  {[
                    { label: "🎯 추천 대상 (줄바꿈으로 구분)", key: "recommendedAudience" },
                    { label: "💡 학습 목표 (줄바꿈으로 구분)", key: "objectives" },
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
  
  // 모의 데이터용 리스트 선언
  const defaultMockCourses = [
    { id: "mock-1", name: "AI Agent 설계 및 구축", overview: "LangChain 및 주요 프레임워크를 활용해 업무 자동화용 AI 에이전트를 빌드하고 프로덕션 수준으로 구현하는 실무 과정", target: "Customer", status: "Available", dateStart: "2026-06-25", time: "10:00-17:00", place: "여의도 파크원타워2 43층 대회의실", method: "오프라인 강의 및 실습", fee: "무료", requirements: "파이썬 기초 문법 이해 및 REST API 사용 유경험자" },
    { id: "mock-2", name: "생성형 AI를 활용한 서비스 기획 실무", overview: "대규모 언어모델(LLM) 기반의 서비스 컨셉 구상부터 시나리오 작성, API 스펙 파악까지 통합 아우르는 기획 노하우 과정", target: "Customer", status: "Available", dateStart: "2026-06-20", time: "13:00-18:00", place: "여의도 파크원타워2 43층 대회의실", method: "이론 및 그룹 토의", fee: "무료" },
    { id: "mock-3", name: "Prompt Engineering 실무", overview: "LLM의 성능을 백퍼센트 끌어올리는 구조적 질문 프롬프트 작성 규칙 및 피드백 루프 조율을 체득하는 실전 테크닉 과정", target: "Customer", status: "Available", dateStart: "2026-06-18", time: "09:00-18:00", place: "비대면 실시간 (Zoom)", method: "온라인 실시간 실습", fee: "무료" },
    { id: "mock-4", name: "Kubernetes 인프라 구축 실무", overview: "컨테이너 오케스트레이션을 위한 쿠버네티스 클러스터 빌드 및 배포 실무 테크닉 과정", target: "Partner", status: "Available", dateStart: "2026-06-24", time: "10:00-18:00", place: "여의도 파크원타워2 43층 대회의실", method: "오프라인 실습", fee: "무료" }
  ];

  let course = eduCourses.find(c => c.id === courseId);
  if (!course) {
    course = defaultMockCourses.find(m => m.id === courseId);
  }

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
      <div style={{ 
        background: "var(--surface-card)", 
        border: "1px solid var(--hairline-strong)", 
        borderRadius: "var(--rounded-lg)", 
        overflow: "hidden",
        marginBottom: "32px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
      }}>
        {/* 상단 배너 이미지 영역 */}
        {course.bgImage && (
          <div style={{
            width: "100%",
            height: "506px", // 900px 너비 기준 16:9 비율 (900 * 9 / 16 = 506.25px)
            background: `url(${course.bgImage}) center/cover no-repeat`,
            borderBottom: "1px solid var(--hairline-strong)"
          }} />
        )}
        <div style={{ padding: "32px" }}>
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
  
  // 모의 데이터용 리스트 선언
  const defaultMockCourses = [
    { id: "mock-1", name: "AI Agent 설계 및 구축", overview: "LangChain 및 주요 프레임워크를 활용해 업무 자동화용 AI 에이전트를 빌드하고 프로덕션 수준으로 구현하는 실무 과정", target: "Customer", status: "Available", dateStart: "2026-06-25", time: "10:00-17:00", place: "여의도 파크원타워2 43층 대회의실", method: "오프라인 강의 및 실습", fee: "무료", requirements: "파이썬 기초 문법 이해 및 REST API 사용 유경험자" },
    { id: "mock-2", name: "생성형 AI를 활용한 서비스 기획 실무", overview: "대규모 언어모델(LLM) 기반의 서비스 컨셉 구상부터 시나리오 작성, API 스펙 파악까지 통합 아우르는 기획 노하우 과정", target: "Customer", status: "Available", dateStart: "2026-06-20", time: "13:00-18:00", place: "여의도 파크원타워2 43층 대회의실", method: "이론 및 그룹 토의", fee: "무료" },
    { id: "mock-3", name: "Prompt Engineering 실무", overview: "LLM의 성능을 백퍼센트 끌어올리는 구조적 질문 프롬프트 작성 규칙 및 피드백 루프 조율을 체득하는 실전 테크닉 과정", target: "Customer", status: "Available", dateStart: "2026-06-18", time: "09:00-18:00", place: "비대면 실시간 (Zoom)", method: "온라인 실시간 실습", fee: "무료" },
    { id: "mock-4", name: "Kubernetes 인프라 구축 실무", overview: "컨테이너 오케스트레이션을 위한 쿠버네티스 클러스터 빌드 및 배포 실무 테크닉 과정", target: "Partner", status: "Available", dateStart: "2026-06-24", time: "10:00-18:00", place: "여의도 파크원타워2 43층 대회의실", method: "오프라인 실습", fee: "무료" }
  ];

  let course = eduCourses.find(c => c.id === courseId);
  if (!course) {
    course = defaultMockCourses.find(m => m.id === courseId);
  }

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
    if (!fullName.trim()) newErrors.fullName = "*이 필드는 필수입니다.";
    if (!email.trim()) newErrors.email = "*이 필드는 필수입니다.";
    if (!phone.trim()) newErrors.phone = "*이 필드는 필수입니다.";
    if (!company.trim()) newErrors.company = "*이 필드는 필수입니다.";

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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* 성함 */}
          <div>
            <label style={labelStyle}>성함 *</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="예) 홍길동"
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
              placeholder="예) example@domain.com"
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
              placeholder="예) 010-0000-0000"
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
              placeholder="예) 오케스트로"
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
              placeholder="예) 아카데미팀"
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
              placeholder="예) 선임연구원"
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
            placeholder="예) 1"
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
            placeholder="예) 주차 공간이 필요합니다. 또는 기타 요청사항을 작성해 주세요."
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

// ── HTML Editor & Renderer Helpers ──
function HtmlEditor({ value, onChange, placeholder, minHeight = "180px" }) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleEditorChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command, arg = null) => {
    document.execCommand(command, false, arg);
    handleEditorChange();
  };

  const handleColorChange = (e) => {
    executeCommand("foreColor", e.target.value);
  };

  const handleBgColorChange = (e) => {
    executeCommand("backColor", e.target.value);
  };

  const btnStyle = {
    background: "none",
    border: "1px solid var(--hairline-strong)",
    borderRadius: "var(--rounded-sm)",
    padding: "4px 8px",
    fontSize: "12px",
    cursor: "pointer",
    color: "var(--ink)",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    transition: "background 0.1s"
  };

  return (
    <div style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--rounded-md)", overflow: "hidden", background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", background: "var(--canvas-soft)", borderBottom: "1px solid var(--hairline-strong)", padding: "8px 12px", alignItems: "center" }}>
        <button type="button" onClick={() => executeCommand("bold")} style={btnStyle} title="굵게"><b>B</b></button>
        <button type="button" onClick={() => executeCommand("italic")} style={btnStyle} title="기울임"><i>I</i></button>
        <button type="button" onClick={() => executeCommand("underline")} style={btnStyle} title="밑줄"><u>U</u></button>
        <button type="button" onClick={() => executeCommand("strikeThrough")} style={btnStyle} title="취소선"><s>S</s></button>
        
        <div style={{ width: "1px", height: "18px", background: "var(--hairline-strong)", margin: "0 4px" }} />
        
        <button type="button" onClick={() => executeCommand("formatBlock", "<h2>")} style={btnStyle} title="제목 2">H2</button>
        <button type="button" onClick={() => executeCommand("formatBlock", "<h3>")} style={btnStyle} title="제목 3">H3</button>
        <button type="button" onClick={() => executeCommand("formatBlock", "<p>")} style={btnStyle} title="본문">P</button>
        
        <div style={{ width: "1px", height: "18px", background: "var(--hairline-strong)", margin: "0 4px" }} />

        <button type="button" onClick={() => executeCommand("insertUnorderedList")} style={btnStyle} title="글머리 기호">• List</button>
        <button type="button" onClick={() => executeCommand("insertOrderedList")} style={btnStyle} title="번호 매기기">1. List</button>
        
        <div style={{ width: "1px", height: "18px", background: "var(--hairline-strong)", margin: "0 4px" }} />

        {/* Text color picker */}
        <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "11px", color: "var(--ink)", fontWeight: 600 }} title="글자 색상">
          🎨 색상
          <input type="color" onChange={handleColorChange} style={{ width: "20px", height: "20px", padding: 0, border: "1px solid var(--hairline-strong)", borderRadius: "2px", background: "none", cursor: "pointer" }} />
        </label>
        
        {/* Background color picker */}
        <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "11px", color: "var(--ink)", fontWeight: 600, marginLeft: "6px" }} title="배경 색상">
          🖌️ 배경
          <input type="color" onChange={handleBgColorChange} style={{ width: "20px", height: "20px", padding: 0, border: "1px solid var(--hairline-strong)", borderRadius: "2px", background: "none", cursor: "pointer" }} defaultValue="#ffffff" />
        </label>
        
        <div style={{ width: "1px", height: "18px", background: "var(--hairline-strong)", margin: "0 4px" }} />

        <button type="button" onClick={() => {
          const url = prompt("링크 주소를 입력하세요 (예: https://example.com):");
          if (url) executeCommand("createLink", url);
        }} style={btnStyle} title="링크 삽입">🔗 링크</button>
        
        <button type="button" onClick={() => {
          const url = prompt("이미지 주소(URL)를 입력하세요:");
          if (url) executeCommand("insertImage", url);
        }} style={btnStyle} title="이미지 삽입">🖼️ 이미지</button>

        <button type="button" onClick={() => executeCommand("removeFormat")} style={btnStyle} title="서식 지우기">🧹 지우기</button>
        
        <div style={{ flex: 1 }} />
        
        {/* HTML Mode Toggle */}
        <button 
          type="button" 
          onClick={() => setIsHtmlMode(!isHtmlMode)} 
          style={{ 
            ...btnStyle, 
            background: isHtmlMode ? "var(--primary)" : "none", 
            color: isHtmlMode ? "var(--on-primary)" : "var(--ink)",
            fontWeight: 600,
            border: isHtmlMode ? "none" : "1px solid var(--hairline-strong)"
          }}
        >
          {isHtmlMode ? "✨ 에디터" : "💻 HTML 코드"}
        </button>
      </div>

      {/* Editor Body */}
      {isHtmlMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            height: minHeight,
            minHeight: minHeight,
            border: "none",
            outline: "none",
            padding: "12px",
            fontSize: "13px",
            fontFamily: "var(--mono)",
            color: "var(--ink)",
            background: "var(--canvas-soft)",
            resize: "vertical",
            boxSizing: "border-box"
          }}
          placeholder="HTML 코드를 직접 입력하세요."
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorChange}
          style={{
            width: "100%",
            height: minHeight,
            minHeight: minHeight,
            border: "none",
            outline: "none",
            padding: "12px",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "var(--ink)",
            background: "var(--canvas)",
            overflowY: "auto",
            boxSizing: "border-box"
          }}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function renderHtmlOrText(text) {
  if (!text) return "";
  const hasHtml = /<[a-z][\s\S]*>/i.test(text);
  if (hasHtml) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }
  return <span style={{ whiteSpace: "pre-line" }}>{text}</span>;
}


function RegisterForm({ regForm, setRegForm, handleRegister, authErr }) {
  return (
    <div>
      <h3 style={{ fontSize: "22px", fontWeight: 600, color: "var(--ink)", marginBottom: "24px", textAlign: "center", letterSpacing: "-0.5px" }}>회원가입</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>이름 <span style={{ color: "var(--semantic-error)" }}>*</span></label>
          <input
            type="text"
            value={regForm.name}
            onChange={e => setRegForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="홍길동"
            style={{
              width: "100%", padding: "12px 16px", border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--rounded-md)", fontSize: "14px", boxSizing: "border-box",
              outline: "none", background: "var(--canvas)", color: "var(--ink)"
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>이메일 주소 <span style={{ color: "var(--semantic-error)" }}>*</span></label>
          <input
            type="email"
            value={regForm.email}
            onChange={e => setRegForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="example@okestro.com"
            style={{
              width: "100%", padding: "12px 16px", border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--rounded-md)", fontSize: "14px", boxSizing: "border-box",
              outline: "none", background: "var(--canvas)", color: "var(--ink)"
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "6px" }}>비밀번호 <span style={{ color: "var(--semantic-error)" }}>*</span></label>
          <input
            type="password"
            value={regForm.password}
            onChange={e => setRegForm(prev => ({ ...prev, password: e.target.value }))}
            placeholder="비밀번호 입력 (6자 이상)"
            style={{
              width: "100%", padding: "12px 16px", border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--rounded-md)", fontSize: "14px", boxSizing: "border-box",
              outline: "none", background: "var(--canvas)", color: "var(--ink)"
            }}
          />
        </div>
        <div style={{ fontSize: "12px", color: "var(--body)", background: "var(--canvas-soft)", borderRadius: "var(--rounded-md)", padding: "10px 12px", lineHeight: "1.6" }}>
          ℹ️ <strong>@okestro.com</strong> 이메일로 가입 시 즉시 승인됩니다.<br />
          외부 이메일은 관리자 승인 후 로그인이 가능합니다.
        </div>
        {authErr && <div style={{ fontSize: "13px", color: "var(--semantic-error)", fontWeight: 500 }}>⚠️ {authErr}</div>}
        <button
          onClick={handleRegister}
          style={{
            width: "100%", padding: "12px", border: "none",
            borderRadius: "var(--rounded-md)", background: "var(--primary)",
            color: "var(--on-primary)", fontSize: "14px", fontWeight: 500, cursor: "pointer"
          }}
          onMouseOver={e => e.currentTarget.style.background = "var(--primary-active)"}
          onMouseOut={e => e.currentTarget.style.background = "var(--primary)"}
        >
          가입 신청
        </button>
      </div>
    </div>
  );
}
