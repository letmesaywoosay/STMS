import { useState, useRef, useEffect } from "react";
import * as XLSX from 'xlsx';

const C = {
  bg:"#f0f4f8", surface:"#ffffff",
  border:"#e2e8f0", border2:"#cbd5e1",
  blue:"#1d4ed8", blueMid:"#2563eb", blueLight:"#3b82f6",
  text:"#0f172a", subtle:"#334155", muted:"#94a3b8",
  green:"#059669", red:"#dc2626", amber:"#d97706", purple:"#7c3aed", teal:"#0d9488",
};
const uid = () => Math.random().toString(36).slice(2, 8);
const SOLUTION_OPTIONS  = ["CONTRABASS","VIOLA","TROMBONE","OKESTRO CMP"];
const COURSE_CATEGORIES = ["CONTRABASS","VIOLA","TROMBONE","OKESTRO CMP","공통","기반기술"];
const COURSE_TARGETS    = ["파트너사","고객사","신규 입사자","재직자","전체"];
const KOR_MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const KOR_DAYS   = ["일","월","화","수","목","금","토"];

// 응시자 관리 상수
const COMPANY_OPTIONS     = ["오케스트로","오케스트로클라우드","오케스트로AGI","기타"];
const PASS_STATUS_OPTIONS = ["합격","불합격","미응시","-"];
const FINAL_STATUS_OPTIONS= ["합격","불합격","진행중","해당없음","퇴사"];

const PASS_STATUS_COLORS = {
  "합격":   {bg:"#f0fdf4",border:"#bbf7d0",text:"#059669"},
  "불합격": {bg:"#fef2f2",border:"#fecaca",text:"#dc2626"},
  "미응시": {bg:"#fffbeb",border:"#fde68a",text:"#d97706"},
  "-":      {bg:"#f8fafc",border:"#e2e8f0",text:"#94a3b8"},
  "":       {bg:"#eff6ff",border:"#bfdbfe",text:"#3b82f6"},
};
const FINAL_STATUS_COLORS = {
  "합격":   {bg:"#f0fdf4",border:"#bbf7d0",text:"#059669"},
  "불합격": {bg:"#fef2f2",border:"#fecaca",text:"#dc2626"},
  "진행중": {bg:"#eff6ff",border:"#bfdbfe",text:"#3b82f6"},
  "해당없음":{bg:"#f8fafc",border:"#e2e8f0",text:"#94a3b8"},
  "퇴사":   {bg:"#fdf4ff",border:"#e9d5ff",text:"#7c3aed"},
  "":       {bg:"#eff6ff",border:"#bfdbfe",text:"#93c5fd"},
};

const TARGET_COLORS = {
  "파트너사":    {bg:"#eff6ff",border:"#bfdbfe",text:"#1d4ed8"},
  "고객사":      {bg:"#f0fdf4",border:"#bbf7d0",text:"#059669"},
  "신규 입사자": {bg:"#fdf4ff",border:"#e9d5ff",text:"#7c3aed"},
  "재직자":      {bg:"#fff7ed",border:"#fed7aa",text:"#c2410c"},
  "전체":        {bg:"#f8fafc",border:"#cbd5e1",text:"#334155"},
};
const CAT_COLORS = {
  "OKESTRO CMP": {bg:"#eff6ff",border:"#bfdbfe",text:"#1e40af",dot:"#3b82f6"},
  "CONTRABASS":  {bg:"#fff7ed",border:"#fed7aa",text:"#c2410c",dot:"#f97316"},
  "VIOLA":       {bg:"#f0fdf4",border:"#bbf7d0",text:"#15803d",dot:"#4ade80"},
  "TROMBONE":    {bg:"#f0fdfa",border:"#99f6e4",text:"#0f766e",dot:"#2dd4bf"},
  "공통":         {bg:"#f8fafc",border:"#e2e8f0",text:"#475569",dot:"#94a3b8"},
  "기반기술":    {bg:"#fefce8",border:"#fde68a",text:"#92400e",dot:"#f59e0b"},
};
const TYPE_META = {
  pdf: {label:"PDF", color:"#dc2626",bg:"#fee2e2",icon:"📄"},
  url: {label:"URL", color:"#7c3aed",bg:"#ede9fe",icon:"🔗"},
};

const INIT_NOTES = "";
const INIT_TABLE = [];
const INIT_QA = [];
const INIT_COURSES = [];
const INIT_APPLICANTS = [
  {id:uid(),joinYearMonth:"2026년 3월",name:"서혁준",company:"오케스트로",division:"클라우드기술본부",team:"클라우드PS팀",divisionHeadName:"박기술",divisionHeadEmail:"kt.park@okestro.com",teamLeaderName:"이클라우드",teamLeaderEmail:"cloud.lee@okestro.com",email:"hj.seo@okestro.com",score1:"92",pass1:"합격",date1:"2026-03-18",score2:"",pass2:"",date2:"",score3:"",pass3:"",date3:"",finalStatus:"합격",reason:"",academyNote:"영남이공대",hrNote:""},
  {id:uid(),joinYearMonth:"2026년 3월",name:"김예원",company:"오케스트로",division:"경영전략본부",team:"경영지원실 인사팀",divisionHeadName:"최경영",divisionHeadEmail:"mg.choi@okestro.com",teamLeaderName:"정인사",teamLeaderEmail:"hr.jung@okestro.com",email:"yw.kim@okestro.com",score1:"54",pass1:"불합격",date1:"2026-03-18",score2:"62",pass2:"불합격",date2:"2026-04-15",score3:"",pass3:"",date3:"",finalStatus:"불합격",reason:"경영전략본부로 재응시 의무 없음",academyNote:"",hrNote:""},
  {id:uid(),joinYearMonth:"2026년 3월",name:"윤석우",company:"오케스트로",division:"경영전략본부",team:"경영지원실 총무구매팀",divisionHeadName:"최경영",divisionHeadEmail:"mg.choi@okestro.com",teamLeaderName:"강총무",teamLeaderEmail:"gm.kang@okestro.com",email:"sw.yoon2@okestro.com",score1:"88",pass1:"합격",date1:"2026-03-18",score2:"",pass2:"",date2:"",score3:"",pass3:"",date3:"",finalStatus:"합격",reason:"",academyNote:"",hrNote:""},
  {id:uid(),joinYearMonth:"2026년 4월",name:"원경진",company:"오케스트로",division:"사업수행1본부",team:"사업수행1팀",divisionHeadName:"김사업",divisionHeadEmail:"biz1.kim@okestro.com",teamLeaderName:"오수행",teamLeaderEmail:"exec.oh@okestro.com",email:"kj.won@okestro.com",score1:"95",pass1:"합격",date1:"2026-04-22",score2:"",pass2:"",date2:"",score3:"",pass3:"",date3:"",finalStatus:"합격",reason:"",academyNote:"",hrNote:""},
  {id:uid(),joinYearMonth:"2026년 4월",name:"정인수",company:"오케스트로클라우드",division:"영업본부",team:"클라우드공공영업팀",divisionHeadName:"한영업",divisionHeadEmail:"sales.han@okestro.com",teamLeaderName:"유공공",teamLeaderEmail:"pub.yoo@okestro.com",email:"is.jeong@okestro.com",score1:"80",pass1:"합격",date1:"2026-04-22",score2:"",pass2:"",date2:"",score3:"",pass3:"",date3:"",finalStatus:"합격",reason:"",academyNote:"",hrNote:""},
  {id:uid(),joinYearMonth:"2026년 4월",name:"이병관",company:"오케스트로 클라우드",division:"영업본부",team:"사업수행관리실 / 제안전략팀",divisionHeadName:"한영업",divisionHeadEmail:"sales.han@okestro.com",teamLeaderName:"신전략",teamLeaderEmail:"strat.shin@okestro.com",email:"bk.lee@okestro.com",score1:"58",pass1:"불합격",date1:"2026-04-22",score2:"75",pass2:"합격",date2:"2026-05-13",score3:"",pass3:"",date3:"",finalStatus:"합격",reason:"2차 재응시 합격",academyNote:"",hrNote:""},
  {id:uid(),joinYearMonth:"2026년 4월",name:"장중수2",company:"오케스트로클라우드",division:"OKC영업본부",team:"클라우드공공영업팀",divisionHeadName:"",divisionHeadEmail:"",teamLeaderName:"",teamLeaderEmail:"",email:"js.jang2@okestro.com",score1:"",pass1:"미응시",date1:"2026-04-22",score2:"",pass2:"미응시",date2:"2026-05-13",score3:"",pass3:"",date3:"",finalStatus:"진행중",reason:"",academyNote:"",hrNote:""},
  {id:uid(),joinYearMonth:"2026년 5월",name:"신규입사자A",company:"오케스트로",division:"솔루션개발본부",team:"IaaS개발실",divisionHeadName:"",divisionHeadEmail:"",teamLeaderName:"",teamLeaderEmail:"",email:"new.a@okestro.com",score1:"",pass1:"",date1:"",score2:"",pass2:"",date2:"",score3:"",pass3:"",date3:"",finalStatus:"진행중",reason:"",academyNote:"",hrNote:""},
];

const EMPTY_COURSE   = {category:"CONTRABASS",courseName:"",content:"",target:[],instructor:"",hours:""};
const EMPTY_SCHEDULE = {date:"",title:"",category:"공통",startTime:"10:00",endTime:"18:00",location:"아카데미 교육장 01",note:""};
const EMPTY_APPLICANT= {joinYearMonth:"",name:"",company:"오케스트로",division:"",team:"",divisionHeadName:"",divisionHeadEmail:"",teamLeaderName:"",teamLeaderEmail:"",email:"",score1:"",pass1:"",date1:"",score2:"",pass2:"",date2:"",score3:"",pass3:"",date3:"",finalStatus:"진행중",reason:"",academyNote:"",hrNote:""};
const LOCATION_OPTIONS = ["아카데미 교육장 01","아카데미 교육장 02","그 외(메모 참조)"];

const toDateStr = (y,m,d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const fmtTime     = d => d instanceof Date ? d.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}) : "";
const fmtDateTime = d => { const dt=d instanceof Date?d:new Date(d); return {date:dt.toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit"}),time:dt.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}; };
const fmtSize = b => !b?"":b>1048576?`${(b/1048576).toFixed(1)}MB`:`${(b/1024).toFixed(0)}KB`;
const fileToBase64 = f => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(',')[1]); r.onerror=()=>rej(new Error('failed')); r.readAsDataURL(f); });

const buildPrompt = (notes,ld=[],td=[],qa=[],courses=[],schedules=[]) => {
  let p=`당신은 오케스트로 아카데미(AIDA)의 AI 교육 지식 관리 어시스턴트입니다.\n`;
  if(notes.trim()) p+=`\n═══ 운영 지침 ═══\n${notes}\n`;
  if(schedules.length){
    p+=`\n═══ 교육 일정 ═══\n`;
    const sorted=[...schedules].sort((a,b)=>a.date.localeCompare(b.date));
    sorted.forEach((s,i)=>{
      const dow=["일","월","화","수","목","금","토"][new Date(s.date).getDay()];
      p+=`[${i+1}] id:${s.id} | ${s.date}(${dow}) [${s.category}] ${s.title}`;
      if(s.startTime||s.endTime) p+=` | 시간: ${s.startTime||""}${s.endTime?`~${s.endTime}`:""}`;
      if(s.location) p+=` | 장소: ${s.location}`;
      if(s.note) p+=` | 메모: ${s.note}`;
      p+=`\n`;
    });
  }
  if(courses.length){p+=`\n═══ 교육 과정 목록 ═══\n`;courses.forEach((c,i)=>{const tgt=Array.isArray(c.target)?c.target.join(", "):c.target;p+=`[${i+1}] [${c.category}] ${c.courseName} | 대상:${tgt} | 강사:${c.instructor} | ${c.hours}시간\n     내용:${c.content}\n`;});}
  if(td.length){p+=`\n═══ 기술 데이터 관리 ═══\n`;td.forEach((r,i)=>{p+=`[${i+1}] 솔루션:${r.solution} 키워드:${r.keyword} 설명:${r.desc}\n`;});}
  const fqa=qa.filter(r=>r.q||r.a);
  if(fqa.length){p+=`\n═══ 교육운영 Q&A ═══\n`;fqa.forEach((r,i)=>{p+=`Q${i+1}. ${r.q}\nA${i+1}. ${r.a}\n`;});}
  const ready=ld.filter(d=>d.status==='ready'&&d.content);
  if(ready.length){p+=`\n═══ 업로드 학습 자료 ═══\n`;ready.forEach((d,i)=>{p+=`[${i+1}] ${d.name}\n${d.content.slice(0,4000)}\n`;});}
  p+=`\n일정 관련 질문에 답변할 때는 답변 끝에 반드시 <SCHEDULES>일정id1,일정id2</SCHEDULES> 형태로 관련 일정의 id를 포함하세요. 일정과 무관한 질문에는 이 태그를 쓰지 마세요.\n`;
  p+=`\n[답변 원칙]\n1. 위에 제공된 등록 데이터를 최우선 답변 근거로 사용하세요.\n2. 등록 데이터에 충분한 정보가 있다면, 반드시 해당 데이터만을 기반으로 답변하세요.\n3. 등록 데이터에 정보가 없거나 부족한 경우에 한해, LLM 일반 지식으로 보완할 수 있습니다.\n4. 교육과정 관련 질문에 답변할 때는 답변 끝에 반드시 <COURSES>정확한과정명1,정확한과정명2</COURSES> 형태로 포함하세요.\n답변은 한국어로 친절하고 간결하게 작성하세요.`;
  return p;
};

const LogoIcon = ({size=16,color="#fff"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke={color} strokeWidth="2.2" strokeLinejoin="round"/>
    <path d="M2 17l10 5 10-5" stroke={color} strokeWidth="2.2" strokeLinejoin="round"/>
    <path d="M2 12l10 5 10-5" stroke={color} strokeWidth="2.2" strokeLinejoin="round"/>
  </svg>
);

const shadow   = "0 1px 6px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.05)";
const shadowLg = "0 4px 24px rgba(0,0,0,0.09),0 1px 4px rgba(0,0,0,0.05)";

function TableSection({title,icon,accent,badge,badgeLabel,desc,onAdd,addLabel,qaFileRef,onImport,children,footer}) {
  return (
    <div style={{background:"#fff",borderRadius:"16px",border:`1.5px solid ${accent}33`,overflow:"hidden",boxShadow:shadowLg,marginBottom:"28px"}}>
      <div style={{padding:"16px 24px",background:`linear-gradient(135deg,${accent}0d,${accent}06)`,borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"10px"}}>
        <div>
          <div style={{fontWeight:800,fontSize:"16px",color:"#0f172a",display:"flex",alignItems:"center",gap:"10px"}}>
            {icon} {title}
            {badge>0&&<span style={{padding:"3px 10px",borderRadius:"20px",fontSize:"11px",background:`${accent}14`,color:accent,fontWeight:700}}>{badge}{badgeLabel}</span>}
          </div>
          <div style={{fontSize:"12px",color:"#94a3b8",marginTop:"4px"}}>{desc}</div>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          {qaFileRef&&onImport&&(<><input ref={qaFileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>{if(e.target.files[0])onImport(e.target.files[0]);e.target.value='';}}/>
            <button onClick={()=>qaFileRef.current?.click()} style={{padding:"9px 16px",borderRadius:"9px",border:`1.5px solid ${accent}55`,cursor:"pointer",background:`${accent}10`,color:accent,fontSize:"13px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}} onMouseEnter={e=>e.currentTarget.style.background=`${accent}20`} onMouseLeave={e=>e.currentTarget.style.background=`${accent}10`}>📊 엑셀로 추가</button></>)}
          <button onClick={onAdd} style={{padding:"9px 18px",borderRadius:"9px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${accent}dd,${accent})`,color:"#fff",fontSize:"13px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>{addLabel}</button>
        </div>
      </div>
      {children}{footer}
    </div>
  );
}

export default function App() {
  const today = new Date();

  const [tab,setTab]                         = useState("chat");
  const [stab,setStab]                       = useState("curriculum");
  const [ltab,setLtab]                       = useState("tech");
  const [notes,setNotes]                     = useState(INIT_NOTES);
  const [tableData,setTableData]             = useState(INIT_TABLE);
  const [qaData,setQaData]                   = useState(INIT_QA);
  const [courses,setCourses]                 = useState(INIT_COURSES);
  const [schedules,setSchedules]             = useState([]);
  const [applicants,setApplicants]           = useState(INIT_APPLICANTS);
  const [applicantModal,setApplicantModal]   = useState(null);
  const [applicantFilter,setApplicantFilter] = useState("전체");
  const [applicantSearch,setApplicantSearch] = useState("");
  const [calYear,setCalYear]                 = useState(today.getFullYear());
  const [calMonth,setCalMonth]               = useState(today.getMonth());
  const [scheduleModal,setScheduleModal]     = useState(null);
  const [courseFilter,setCourseFilter]       = useState("전체");
  const [courseModal,setCourseModal]         = useState(null);
  const [catLogos,setCatLogos]               = useState({});
  const [logoTarget,setLogoTarget]           = useState(null);
  const [ld,setLd]                           = useState([]);
  const [logs,setLogs]                       = useState([]);
  const [urlInput,setUrlInput]               = useState("");
  const [isDrag,setIsDrag]                   = useState(false);
  const [messages,setMessages]               = useState([]);
  const [input,setInput]                     = useState("");
  const [isLoading,setIsLoading]             = useState(false);
  const [loaded,setLoaded]                   = useState(false);
  const [saveLabel,setSaveLabel]             = useState("");
  const [tooltip,setTooltip]                 = useState(null);
  const [selectedIds,setSelectedIds]         = useState([]);
  const [appViewMode,setAppViewMode]         = useState("list");
  const [sortConfig,setSortConfig]           = useState({key:null,dir:"asc"});
  const [aiMailModal,setAiMailModal]         = useState(null);
  const [deleteConfirm,setDeleteConfirm]     = useState(null); // {msg, action}

  const bottomRef          = useRef(null);
  const inputRef           = useRef(null);
  const txaRef             = useRef(null);
  const fileRef            = useRef(null);
  const qaFileRef          = useRef(null);
  const appFileRef         = useRef(null);
  const catLogoRef         = useRef(null);
  const mouseDownTargetRef = useRef(null);

  const makeBackdropHandlers = (closeFn) => ({
    onMouseDown: e => { mouseDownTargetRef.current = e.target; },
    onClick:     e => { if(e.target===e.currentTarget && mouseDownTargetRef.current===e.currentTarget) closeFn(); },
  });

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,isLoading]);

  useEffect(()=>{
    (async()=>{
      const sg=async k=>{try{return await window.storage.get(k);}catch{return null;}};
      try {
        const [n,l,td,qa,cs,cl,lg,sc,ap]=await Promise.all([sg('aida:notes'),sg('aida:learning'),sg('aida:tabledata'),sg('aida:qa'),sg('aida:courses'),sg('aida:catlogos'),sg('aida:logs'),sg('aida:schedules'),sg('aida:applicants_v2')]);
        if(n)  setNotes(n.value);
        if(l)  setLd(JSON.parse(l.value).filter(d=>d.status!=='processing'));
        if(td) setTableData(JSON.parse(td.value));
        if(qa) setQaData(JSON.parse(qa.value));
        if(cs) setCourses(JSON.parse(cs.value).map(c=>({...c,target:Array.isArray(c.target)?c.target:[c.target].filter(Boolean)})));
        if(cl) setCatLogos(JSON.parse(cl.value));
        if(lg) setLogs(JSON.parse(lg.value).map(l=>({...l,timestamp:new Date(l.timestamp)})));
        if(sc) setSchedules(JSON.parse(sc.value));
        if(ap) setApplicants(JSON.parse(ap.value));
      } catch(e){console.error(e);}
      finally{setLoaded(true);}
    })();
  },[]);

  const flash=()=>{setSaveLabel("저장됨");setTimeout(()=>setSaveLabel(""),2000);};

  // 비밀번호 확인 후 삭제 실행 (커스텀 모달 방식 - window.prompt 미사용)
  const confirmDelete=(msg,action)=>{
    setDeleteConfirm({msg,action});
  };
  useEffect(()=>{if(!loaded)return;window.storage?.set('aida:notes',notes,true).then(flash).catch(()=>{});},[notes,loaded]);
  useEffect(()=>{if(!loaded)return;window.storage?.set('aida:tabledata',JSON.stringify(tableData),true).then(flash).catch(()=>{});},[tableData,loaded]);
  useEffect(()=>{if(!loaded)return;window.storage?.set('aida:qa',JSON.stringify(qaData),true).then(flash).catch(()=>{});},[qaData,loaded]);
  useEffect(()=>{if(!loaded)return;window.storage?.set('aida:courses',JSON.stringify(courses),true).then(flash).catch(()=>{});},[courses,loaded]);
  useEffect(()=>{if(!loaded)return;window.storage?.set('aida:catlogos',JSON.stringify(catLogos),true).then(flash).catch(()=>{});},[catLogos,loaded]);
  useEffect(()=>{if(!loaded)return;window.storage?.set('aida:learning',JSON.stringify(ld.filter(d=>d.status!=='processing')),true).catch(()=>{});},[ld,loaded]);
  useEffect(()=>{if(!loaded)return;window.storage?.set('aida:logs',JSON.stringify(logs),true).catch(()=>{});},[logs,loaded]);
  useEffect(()=>{if(!loaded)return;window.storage?.set('aida:schedules',JSON.stringify(schedules),true).then(flash).catch(()=>{});},[schedules,loaded]);
  useEffect(()=>{if(!loaded)return;window.storage?.set('aida:applicants_v2',JSON.stringify(applicants),true).then(flash).catch(()=>{});},[applicants,loaded]);

  // Calendar
  const prevMonth=()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);};
  const nextMonth=()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);};
  const goToday=()=>{setCalYear(today.getFullYear());setCalMonth(today.getMonth());};
  const buildCalGrid=()=>{const firstDow=new Date(calYear,calMonth,1).getDay();const daysInMonth=new Date(calYear,calMonth+1,0).getDate();const cells=[];for(let i=0;i<firstDow;i++)cells.push(null);for(let d=1;d<=daysInMonth;d++)cells.push(d);while(cells.length%7!==0)cells.push(null);return{cells,firstDow};};

  // Schedule CRUD
  const saveSchedule=data=>{if(!data.title.trim())return;if(scheduleModal.mode==='add')setSchedules(p=>[...p,{...data,id:uid()}]);else setSchedules(p=>p.map(s=>s.id===data.id?data:s));setScheduleModal(null);};
  const deleteSchedule=id=>{confirmDelete("이 일정을 삭제하시겠습니까?",()=>{setSchedules(p=>p.filter(s=>s.id!==id));setScheduleModal(null);});};

  // Applicant CRUD
  const saveApplicant=data=>{
    if(!data.name.trim())return;
    if(applicantModal.mode==='add') setApplicants(p=>[...p,{...data,id:uid()}]);
    else setApplicants(p=>p.map(a=>a.id===data.id?data:a));
    setApplicantModal(null);
  };
  const deleteApplicant=id=>{confirmDelete("이 응시자를 삭제하시겠습니까?",()=>{setApplicants(p=>p.filter(a=>a.id!==id));setApplicantModal(null);});};

  const importApplicantExcel=async file=>{
    try{
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
      const newRows=rows.map(row=>{
        const k=Object.keys(row);
        const g=(patterns)=>{ const key=k.find(k=>patterns.some(p=>new RegExp(p,'i').test(k))); return key?String(row[key]||"").trim():""; };
        return {
          id:uid(),
          joinYearMonth:      g(['입사년월','입사','joinYear']),
          name:               g(['이름','name','성명']),
          company:            g(['구분','회사','company']),
          division:           g(['소속본부','본부','division']),
          team:               g(['소속팀','팀','team']),
          divisionHeadName:   g(['본부장 이름','본부장이름','headName']),
          divisionHeadEmail:  g(['본부장 이메일','본부장이메일','headEmail']),
          teamLeaderName:     g(['팀장 이름','팀장이름','leaderName']),
          teamLeaderEmail:    g(['팀장 이메일','팀장이메일','leaderEmail']),
          email:              g(['이메일','email','mail']),
          score1:             g(['1차 점수','1차점수','score1']),
          pass1:              g(['1차 합격여부','1차합격','pass1']),
          date1:              g(['1차 응시일','1차응시일','date1']),
          score2:             g(['2차 점수','2차점수','score2']),
          pass2:              g(['2차 합격여부','2차합격','pass2']),
          date2:              g(['2차 응시일','2차응시일','date2']),
          score3:             g(['3차 점수','3차점수','score3']),
          pass3:              g(['3차 합격여부','3차합격','pass3']),
          date3:              g(['3차 응시일','3차응시일','date3']),
          finalStatus:        g(['최종 상태','최종상태','final','finalStatus'])||"진행중",
          reason:             g(['사유','비고','reason','note']),
          academyNote:        g(['아카데미 공유','아카데미공유','academy','academyNote']),
          hrNote:             g(['인사팀 공유','인사팀공유','hr','hrNote']),
        };
      }).filter(r=>r.name);
      if(!newRows.length){alert("유효한 데이터를 찾을 수 없습니다.");return;}
      const unique=newRows.filter(r=>!applicants.some(a=>a.email&&a.email===r.email));
      const dupes=newRows.length-unique.length;
      if(!unique.length){alert("모두 중복된 데이터입니다.");return;}
      if(dupes>0) alert(`중복 ${dupes}건 제외, ${unique.length}건 추가합니다.`);
      setApplicants(p=>[...p,...unique]);
    }catch(e){alert(`파일 읽기 오류: ${e.message}`);}
  };

  // Logo
  const handleLogoUpload=(file,cat)=>{const r=new FileReader();r.onload=e=>setCatLogos(p=>({...p,[cat]:e.target.result}));r.readAsDataURL(file);};

  // Course CRUD
  const saveCourse=data=>{if(courseModal.mode==='add')setCourses(p=>[...p,{...data,id:uid()}]);else setCourses(p=>p.map(c=>c.id===data.id?data:c));setCourseModal(null);};
  const deleteCourse=id=>{confirmDelete("이 교육과정을 삭제하시겠습니까?",()=>setCourses(p=>p.filter(c=>c.id!==id)));};
  const toggleTarget=t=>setCourseModal(p=>{const cur=Array.isArray(p.data.target)?p.data.target:[];const next=cur.includes(t)?cur.filter(x=>x!==t):[...cur,t];return{...p,data:{...p.data,target:next}};});

  // Knowledge CRUD
  const addRow=()=>setTableData(p=>[...p,{id:uid(),solution:"",keyword:"",desc:""}]);
  const updateRow=(id,f,v)=>setTableData(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const deleteRow=id=>{confirmDelete("이 행을 삭제하시겠습니까?",()=>setTableData(p=>p.filter(r=>r.id!==id)));};
  const addQA=()=>setQaData(p=>[...p,{id:uid(),q:"",a:""}]);
  const updateQA=(id,f,v)=>setQaData(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const deleteQA=id=>{confirmDelete("이 Q&A를 삭제하시겠습니까?",()=>setQaData(p=>p.filter(r=>r.id!==id)));};
  const importQAExcel=async file=>{
    try{
      const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
      const newRows=rows.map(row=>{const keys=Object.keys(row);const qKey=keys.find(k=>/질문|question|^q$/i.test(k))||keys[0];const aKey=keys.find(k=>/답변|answer|^a$/i.test(k))||keys[1];return{id:uid(),q:String(row[qKey]||"").trim(),a:String(row[aKey]||"").trim()};}).filter(r=>r.q||r.a);
      if(!newRows.length){alert("유효한 데이터를 찾을 수 없습니다.");return;}
      const unique=newRows.filter(r=>!qaData.some(e=>e.q.trim()===r.q.trim()&&e.a.trim()===r.a.trim()));
      if(!unique.length){alert("모두 중복된 데이터입니다.");return;}
      setQaData(p=>[...p,...unique]);
    }catch(e){alert(`파일 읽기 오류: ${e.message}`);}
  };

  // Learning Data
  const setLDItem=(id,patch)=>setLd(p=>p.map(d=>d.id===id?{...d,...patch}:d));
  const processPDF=async file=>{
    const nid=uid();setLd(p=>[...p,{id:nid,type:'pdf',name:file.name,size:file.size,content:"",status:'processing',uploadedAt:new Date()}]);
    try{const b64=await fileToBase64(file);const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:"이 PDF의 전체 내용을 텍스트로 추출해주세요."}]}]})});const data=await res.json();const text=data.content?.map(c=>c.text||"").join("")||"";setLDItem(nid,{status:text?'ready':'error',content:text||`[추출 실패: ${file.name}]`});}catch(e){setLDItem(nid,{status:'error',content:`오류: ${e.message}`});}
  };
  const processURL=async urlStr=>{
    if(!urlStr.trim())return;const nid=uid();setLd(p=>[...p,{id:nid,type:'url',name:urlStr,content:"",status:'processing',uploadedAt:new Date()}]);setUrlInput("");
    try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:`다음 URL의 내용을 검색·수집하여 핵심 정보를 상세히 정리해주세요:\n${urlStr}`}]})});const data=await res.json();const text=data.content?.filter(c=>c.type==="text").map(c=>c.text||"").join("")||`URL 참조: ${urlStr}`;setLDItem(nid,{status:'ready',content:`[URL: ${urlStr}]\n\n${text}`});}catch{setLDItem(nid,{status:'ready',content:`[URL 참조: ${urlStr}]`});}
  };
  const handleFiles=files=>Array.from(files).forEach(f=>{if(f.name.endsWith('.pdf')||f.type==='application/pdf')processPDF(f);});
  const deleteLD=id=>{confirmDelete("이 학습 자료를 삭제하시겠습니까?",()=>setLd(p=>p.filter(d=>d.id!==id)));};
  const ldReady=ld.filter(d=>d.status==='ready').length;
  const ldProc=ld.filter(d=>d.status==='processing').length;
  const filledRows=tableData.filter(r=>r.solution||r.keyword||r.desc).length;
  const filledQA=qaData.filter(r=>r.q||r.a).length;

  // Chatbot
  const sendMsg=async()=>{
    const text=input.trim();if(!text||isLoading)return;
    const userMsg={role:"user",content:text,time:new Date()};const newMsgs=[...messages,userMsg];
    setMessages(newMsgs);setInput("");if(txaRef.current)txaRef.current.style.height="auto";setIsLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:buildPrompt(notes,ld,tableData,qaData,courses,schedules),messages:newMsgs.map(m=>({role:m.role,content:m.content}))})});
      const data=await res.json();const rawReply=data.content?.map(c=>c.text||"").join("")||"응답을 받을 수 없습니다.";
      const tagMatch=rawReply.match(/<COURSES>([\s\S]*?)<\/COURSES>/);
      const schedTagMatch=rawReply.match(/<SCHEDULES>([\s\S]*?)<\/SCHEDULES>/);
      const cleanReply=rawReply.replace(/<COURSES>[\s\S]*?<\/COURSES>/g,'').replace(/<SCHEDULES>[\s\S]*?<\/SCHEDULES>/g,'').trim();
      let courseCards=[];if(tagMatch){const names=tagMatch[1].split(',').map(s=>s.trim()).filter(Boolean);courseCards=courses.filter(c=>names.some(n=>c.courseName===n||c.courseName.includes(n)||n.includes(c.courseName)));}
      let scheduleCards=[];if(schedTagMatch){const ids=schedTagMatch[1].split(',').map(s=>s.trim()).filter(Boolean);scheduleCards=schedules.filter(s=>ids.includes(s.id));}
      setMessages(p=>[...p,{role:"assistant",content:cleanReply,time:new Date(),courseCards,scheduleCards}]);
      setLogs(p=>[...p,{id:uid(),timestamp:new Date(),userMessage:text,aiResponse:cleanReply,courseNames:courseCards.map(c=>c.courseName)}]);
    }catch{setMessages(p=>[...p,{role:"assistant",content:"오류가 발생했습니다.",time:new Date()}]);}
    finally{setIsLoading(false);inputRef.current?.focus();}
  };
  const handleKey=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}};
  const QUICK_QS=[];
  const cellTA=(color=C.subtle)=>({width:"100%",background:"transparent",border:"none",outline:"none",color,fontFamily:"inherit",fontSize:"13px",padding:"8px 12px",borderRadius:"6px",resize:"none",lineHeight:1.65,transition:"background 0.15s",boxSizing:"border-box",minHeight:"56px"});

  const renderFileList=items=>(
    <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:"8px",maxHeight:"400px",overflowY:"auto"}}>
      {items.map(d=>{const meta=TYPE_META[d.type];return(
        <div key={d.id} style={{background:C.bg,borderRadius:"10px",border:`1.5px solid ${d.status==='ready'?meta.color+'33':d.status==='error'?C.red+'33':C.border}`,padding:"11px 14px",display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"9px",background:meta.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px",flexShrink:0}}>{meta.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"2px"}}>
              <span style={{fontWeight:700,fontSize:"13px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"320px",color:C.text}}>{d.name}</span>
              <span style={{fontSize:"10px",padding:"2px 7px",borderRadius:"10px",background:meta.bg,color:meta.color,fontWeight:700}}>{meta.label}</span>
            </div>
            <div style={{display:"flex",gap:"10px",fontSize:"11px",color:C.muted}}>
              {d.size&&<span>{fmtSize(d.size)}</span>}<span>{fmtTime(d.uploadedAt)} 업로드</span>
              {d.status==='ready'&&<span style={{color:C.green,fontWeight:700}}>✓ 학습 완료 · {(d.content||"").length.toLocaleString()}자</span>}
              {d.status==='processing'&&<span style={{color:C.amber,fontWeight:700}}>⟳ 분석 중...</span>}
              {d.status==='error'&&<span style={{color:C.red,fontWeight:700}}>✕ 처리 실패</span>}
            </div>
          </div>
          <button onClick={()=>deleteLD(d.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:"15px",padding:"5px 8px",borderRadius:"7px"}} onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.background="#fee2e2";}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.background="none";}}>🗑</button>
        </div>
      );})}
    </div>
  );

  const renderCalendar=()=>{
    const{cells,firstDow}=buildCalGrid();
    const monthScheds=schedules.filter(s=>{const d=new Date(s.date);return d.getFullYear()===calYear&&d.getMonth()===calMonth;});
    const isToday=d=>d&&today.getFullYear()===calYear&&today.getMonth()===calMonth&&today.getDate()===d;
    const getDow=d=>d?(firstDow+d-1)%7:0;
    return(
      <div>
        <div style={{background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,padding:"16px 20px",marginBottom:"16px",boxShadow:shadow,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <button onClick={prevMonth} style={{width:"32px",height:"32px",borderRadius:"8px",border:`1px solid ${C.border}`,background:C.bg,cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>e.currentTarget.style.background=`${C.blue}10`} onMouseLeave={e=>e.currentTarget.style.background=C.bg}>◀</button>
            <div style={{fontWeight:900,fontSize:"18px",color:C.text,minWidth:"130px",textAlign:"center"}}>{calYear}년 {KOR_MONTHS[calMonth]}</div>
            <button onClick={nextMonth} style={{width:"32px",height:"32px",borderRadius:"8px",border:`1px solid ${C.border}`,background:C.bg,cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>e.currentTarget.style.background=`${C.blue}10`} onMouseLeave={e=>e.currentTarget.style.background=C.bg}>▶</button>
            <button onClick={goToday} style={{padding:"6px 14px",borderRadius:"8px",border:`1px solid ${C.border}`,background:C.bg,cursor:"pointer",fontSize:"12px",fontWeight:600,color:C.subtle,fontFamily:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background=`${C.blue}10`} onMouseLeave={e=>e.currentTarget.style.background=C.bg}>오늘</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <span style={{fontSize:"12px",color:C.muted}}>이번 달 일정 <b style={{color:C.blue}}>{monthScheds.length}</b>건</span>
            <button onClick={()=>setScheduleModal({mode:'add',data:{...EMPTY_SCHEDULE,date:toDateStr(calYear,calMonth,today.getDate())}})} style={{padding:"9px 18px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${C.blueMid},${C.blue})`,color:"#fff",fontSize:"13px",fontWeight:700,fontFamily:"inherit",boxShadow:`0 2px 10px ${C.blue}44`}}>＋ 일정 추가</button>
          </div>
        </div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
          {COURSE_CATEGORIES.map(cat=>{const cc=CAT_COLORS[cat];return(<span key={cat} style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"11px",color:cc.text,background:cc.bg,padding:"3px 10px",borderRadius:"20px",border:`1px solid ${cc.border}`}}><span style={{width:"7px",height:"7px",borderRadius:"50%",background:cc.dot,display:"inline-block"}}></span>{cat}</span>);})}
        </div>
        <div style={{background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:shadowLg}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:`1.5px solid ${C.border}`,background:C.bg}}>
            {KOR_DAYS.map((d,i)=>(<div key={d} style={{padding:"10px 0",textAlign:"center",fontSize:"12px",fontWeight:700,color:i===0?C.red:i===6?C.blue:C.subtle}}>{d}</div>))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
            {cells.map((day,idx)=>{
              if(!day) return (<div key={`e${idx}`} style={{minHeight:"100px",background:"#f8fafc",borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}/>);
              const dateStr=toDateStr(calYear,calMonth,day);
              const dayScheds=monthScheds.filter(s=>s.date===dateStr).sort((a,b)=>a.startTime.localeCompare(b.startTime));
              const dow=getDow(day);const isTd=isToday(day);
              return(
                <div key={day} onClick={()=>setScheduleModal({mode:'add',data:{...EMPTY_SCHEDULE,date:dateStr}})}
                  style={{minHeight:"100px",borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:"6px",cursor:"pointer",transition:"background 0.15s",background:isTd?`${C.blue}05`:"transparent"}}
                  onMouseEnter={e=>e.currentTarget.style.background=isTd?`${C.blue}08`:`${C.blue}03`} onMouseLeave={e=>e.currentTarget.style.background=isTd?`${C.blue}05`:"transparent"}>
                  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"4px"}}>
                    <span style={{width:"24px",height:"24px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:isTd?800:500,color:isTd?"#fff":dow===0?C.red:dow===6?C.blue:C.text,background:isTd?C.blue:"transparent"}}>{day}</span>
                  </div>
                  {dayScheds.slice(0,3).map(s=>{const cc=CAT_COLORS[s.category]||CAT_COLORS["공통"];return(
                    <div key={s.id} onClick={e=>{e.stopPropagation();setScheduleModal({mode:'edit',data:{...s}});}}
                      style={{background:cc.bg,color:cc.text,border:`1px solid ${cc.border}`,borderRadius:"5px",padding:"2px 6px",marginBottom:"2px",fontSize:"10px",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.opacity="0.75"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                      {s.startTime&&<span style={{marginRight:"3px",opacity:0.7}}>{s.startTime}</span>}{s.title}
                    </div>
                  );})}
                  {dayScheds.length>3&&<div style={{fontSize:"10px",color:C.muted,textAlign:"center",marginTop:"2px"}}>+{dayScheds.length-3}건 더</div>}
                </div>
              );
            })}
          </div>
        </div>
        {monthScheds.length>0&&(
          <div style={{marginTop:"20px",background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:shadow}}>
            <div style={{padding:"12px 20px",background:C.bg,borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:"13px",color:C.text}}>📋 {calYear}년 {KOR_MONTHS[calMonth]} 일정 목록</div>
            <div style={{maxHeight:"300px",overflowY:"auto"}}>
              {[...monthScheds].sort((a,b)=>a.date.localeCompare(b.date)||(a.startTime||"").localeCompare(b.startTime||"")).map(s=>{
                const cc=CAT_COLORS[s.category]||CAT_COLORS["공통"];const dayNum=parseInt(s.date.split('-')[2]);const dow=new Date(s.date).getDay();
                return(
                  <div key={s.id} onClick={()=>setScheduleModal({mode:'edit',data:{...s}})}
                    style={{display:"flex",alignItems:"flex-start",gap:"14px",padding:"12px 20px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",transition:"background 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=`${C.blue}04`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{width:"40px",textAlign:"center",flexShrink:0}}>
                      <div style={{fontSize:"18px",fontWeight:900,color:dow===0?C.red:dow===6?C.blue:C.text,lineHeight:1}}>{dayNum}</div>
                      <div style={{fontSize:"10px",color:C.muted}}>{KOR_DAYS[dow]}</div>
                    </div>
                    <div style={{width:"3px",alignSelf:"stretch",borderRadius:"3px",background:cc.dot,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px",flexWrap:"wrap"}}>
                        <span style={{fontWeight:700,fontSize:"13px",color:C.text}}>{s.title}</span>
                        <span style={{fontSize:"10px",padding:"2px 7px",borderRadius:"8px",background:cc.bg,color:cc.text,border:`1px solid ${cc.border}`,fontWeight:700}}>{s.category}</span>
                      </div>
                      <div style={{display:"flex",gap:"12px",fontSize:"11px",color:C.muted,flexWrap:"wrap"}}>
                        {(s.startTime||s.endTime)&&<span>🕐 {s.startTime}{s.endTime&&` ~ ${s.endTime}`}</span>}
                        {s.location&&<span>📍 {s.location}</span>}
                        {s.note&&<span>📝 {s.note}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── 일괄등록 양식 다운로드
  const downloadApplicantTemplate=()=>{
    const headers=[
      "입사년월","이름","구분(회사)","소속본부","소속팀",
      "본부장 이름","본부장 이메일","팀장 이름","팀장 이메일","이메일",
      "1차 응시일","1차 점수","1차 합격여부",
      "2차 응시일","2차 점수","2차 합격여부",
      "3차 응시일","3차 점수","3차 합격여부",
      "최종 상태","사유/비고","아카데미 공유사항","인사팀 공유사항"
    ];
    const example=[
      "2026년 5월","홍길동","오케스트로","솔루션개발본부","IaaS개발실",
      "김본부장","head@okestro.com","이팀장","leader@okestro.com","hong@okestro.com",
      "2026-05-13","85","합격",
      "","","",
      "","","",
      "합격","","",""
    ];
    const notes=[
      ["📋 온보딩 대상자 일괄등록 양식 — 작성 안내"],
      [""],
      ["※ 구분(회사): 오케스트로 / 오케스트로클라우드 / 오케스트로AGI / 기타"],
      ["※ 합격여부: 합격 / 불합격 / 미응시 / -"],
      ["※ 최종 상태: 합격 / 불합격 / 진행중 / 해당없음 / 퇴사"],
      ["※ 응시일 형식: YYYY-MM-DD  (예: 2026-05-13)"],
      ["※ 점수: 0~100 숫자만 입력  (60점 이상 합격)"],
      [""],
      ["※ 2행의 예시 데이터는 삭제 후 3행부터 실제 데이터를 입력하세요."],
      ["※ 비어있는 칸은 그대로 두어도 됩니다."],
    ];
    const colWidths=[
      {wch:14},{wch:10},{wch:16},{wch:18},{wch:20},
      {wch:12},{wch:24},{wch:12},{wch:24},{wch:28},
      {wch:14},{wch:10},{wch:12},
      {wch:14},{wch:10},{wch:12},
      {wch:14},{wch:10},{wch:12},
      {wch:12},{wch:24},{wch:20},{wch:20}
    ];

    const wb=XLSX.utils.book_new();

    // 시트1: 입력 양식
    const ws=XLSX.utils.aoa_to_sheet([headers,example]);
    ws['!cols']=colWidths;
    ws['!rows']=[{hpt:22},{hpt:18}];
    XLSX.utils.book_append_sheet(wb,ws,"입력양식");

    // 시트2: 작성 안내
    const guideWs=XLSX.utils.aoa_to_sheet(notes);
    guideWs['!cols']=[{wch:60}];
    XLSX.utils.book_append_sheet(wb,guideWs,"작성안내");

    XLSX.writeFile(wb,"온보딩_대상자_일괄등록_양식.xlsx");
  };

  // ────────────────────────────────────────────────────────────
  // 응시자 관리 렌더
  // ────────────────────────────────────────────────────────────
  const renderApplicants=()=>{
    const getLatest=a=>{
      if(a.pass3||a.score3) return{score:a.score3,pass:a.pass3,nth:"3차",date:a.date3||""};
      if(a.pass2||a.score2) return{score:a.score2,pass:a.pass2,nth:"2차",date:a.date2||""};
      if(a.pass1||a.score1) return{score:a.score1,pass:a.pass1,nth:"1차",date:a.date1||""};
      return{score:a.testScore||"",pass:a.passStatus||"",nth:"",date:""};
    };
    const cntPass=v=>applicants.filter(a=>getLatest(a).pass===v).length;
    const cntPending=applicants.filter(a=>!getLatest(a).pass).length;
    const tested=cntPass("합격")+cntPass("불합격");
    const passRate=tested>0?Math.round(cntPass("합격")/tested*100):null;

    const filtered=applicants.filter(a=>{
      const lp=getLatest(a).pass;
      const matchStatus=applicantFilter==="전체"?true:applicantFilter==="진행중"?!lp:lp===applicantFilter;
      const q=applicantSearch.toLowerCase();
      const matchSearch=!q||(a.name||"").toLowerCase().includes(q)||(a.company||"").toLowerCase().includes(q)||(a.division||"").toLowerCase().includes(q)||(a.team||"").toLowerCase().includes(q)||(a.email||"").toLowerCase().includes(q)||(a.joinYearMonth||"").includes(q);
      return matchStatus&&matchSearch;
    });

    // 정렬
    const handleSort=key=>{
      setSortConfig(p=>p.key===key?{key,dir:p.dir==="asc"?"desc":"asc"}:{key,dir:"asc"});
    };
    const sorted=[...filtered].sort((a,b)=>{
      if(!sortConfig.key) return 0;
      let va,vb;
      if(sortConfig.key==="testResult"){
        va=parseFloat(getLatest(a).score)||((getLatest(a).pass==="미응시")?-1:-2);
        vb=parseFloat(getLatest(b).score)||((getLatest(b).pass==="미응시")?-1:-2);
        return sortConfig.dir==="asc"?va-vb:vb-va;
      }
      va=(a[sortConfig.key]||"").toLowerCase();
      vb=(b[sortConfig.key]||"").toLowerCase();
      if(va<vb) return sortConfig.dir==="asc"?-1:1;
      if(va>vb) return sortConfig.dir==="asc"?1:-1;
      return 0;
    });

    // 선택 헬퍼 (sorted 기준)
    const allSelected=sorted.length>0&&sorted.every(a=>selectedIds.includes(a.id));
    const toggleSelect=id=>setSelectedIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
    const toggleAll=()=>allSelected?setSelectedIds(p=>p.filter(id=>!sorted.some(a=>a.id===id))):setSelectedIds(p=>[...new Set([...p,...sorted.map(a=>a.id)])]);
    const selItems=applicants.filter(a=>selectedIds.includes(a.id));
    const selPassCnt=v=>selItems.filter(a=>getLatest(a).pass===v).length;
    const selTested=selPassCnt("합격")+selPassCnt("불합격");
    const selPassRate=selTested>0?Math.round(selPassCnt("합격")/selTested*100):null;

    const STAT_ITEMS=[
      {label:"전체",   value:applicants.length, color:C.blue,      bg:`${C.blue}0d`},
      {label:"합격",   value:cntPass("합격"),    color:C.green,     bg:"#f0fdf4"},
      {label:"불합격", value:cntPass("불합격"),  color:C.red,       bg:"#fef2f2"},
      {label:"미응시", value:cntPass("미응시"),  color:C.amber,     bg:"#fffbeb"},
      {label:"진행중", value:cntPending,         color:C.blueLight, bg:"#eff6ff"},
    ];

    // 월별 뷰 데이터 구성
    const monthlyData=()=>{
      const groups={};
      applicants.forEach(a=>{
        [{nth:"1차",date:a.date1,score:a.score1,pass:a.pass1},
         {nth:"2차",date:a.date2,score:a.score2,pass:a.pass2},
         {nth:"3차",date:a.date3,score:a.score3,pass:a.pass3}]
        .filter(t=>t.date||t.pass)
        .forEach(t=>{
          const ym=t.date?t.date.slice(0,7):"날짜 미지정";
          if(!groups[ym]) groups[ym]=[];
          groups[ym].push({...a,_nth:t.nth,_date:t.date,_score:t.score,_pass:t.pass});
        });
      });
      return Object.entries(groups).sort(([a],[b])=>a.localeCompare(b));
    };

    const fmtYM=ym=>{
      if(ym==="날짜 미지정") return ym;
      const [y,m]=ym.split("-");
      return `${y}년 ${parseInt(m)}월`;
    };

    if(appViewMode==="monthly") return(
      <div>
        {/* 월별 뷰 헤더 */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}>
          <div>
            <h3 style={{fontSize:"16px",fontWeight:800,color:C.text,marginBottom:"2px"}}>📅 월별 응시 현황</h3>
            <p style={{fontSize:"12px",color:C.muted}}>응시일 기준으로 각 월에 누가 몇 차시에 응시했는지 확인합니다.</p>
          </div>
          <button onClick={()=>setAppViewMode("list")} style={{padding:"8px 18px",borderRadius:"9px",border:`1.5px solid ${C.border}`,cursor:"pointer",background:C.surface,color:C.subtle,fontSize:"13px",fontWeight:600,fontFamily:"inherit"}}>≡ 목록 보기</button>
        </div>
        {monthlyData().length===0?(
          <div style={{textAlign:"center",padding:"60px",background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,color:C.muted,boxShadow:shadow}}>
            <div style={{fontSize:"36px",marginBottom:"10px"}}>📅</div>
            <div style={{fontWeight:600,color:C.subtle}}>응시일이 입력된 데이터가 없습니다</div>
            <div style={{fontSize:"12px",marginTop:"4px"}}>수정 화면에서 각 차시의 응시일을 입력해주세요.</div>
          </div>
        ):monthlyData().map(([ym,items])=>{
          const mPass=items.filter(i=>i._pass==="합격").length;
          const mFail=items.filter(i=>i._pass==="불합격").length;
          const mAbsent=items.filter(i=>i._pass==="미응시").length;
          const mTested=mPass+mFail;
          const mRate=mTested>0?Math.round(mPass/mTested*100):null;
          return(
            <div key={ym} style={{marginBottom:"20px",background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:shadowLg}}>
              <div style={{padding:"14px 20px",background:`linear-gradient(135deg,${C.blue}0a,${C.blueLight}06)`,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"10px"}}>
                <div style={{fontWeight:800,fontSize:"15px",color:C.text}}>{fmtYM(ym)} <span style={{fontSize:"12px",fontWeight:500,color:C.muted}}>· {items.length}명 응시</span></div>
                <div style={{display:"flex",gap:"12px",fontSize:"12px",flexWrap:"wrap"}}>
                  {mPass>0&&<span style={{color:C.green,fontWeight:700}}>✅ 합격 {mPass}명</span>}
                  {mFail>0&&<span style={{color:C.red,fontWeight:700}}>❌ 불합격 {mFail}명</span>}
                  {mAbsent>0&&<span style={{color:C.amber,fontWeight:700}}>⏭ 미응시 {mAbsent}명</span>}
                  {mRate!==null&&<span style={{color:mRate>=60?C.green:C.red,fontWeight:800,background:mRate>=60?"#f0fdf4":"#fef2f2",padding:"2px 10px",borderRadius:"20px",border:`1px solid ${mRate>=60?"#bbf7d0":"#fecaca"}`}}>합격률 {mRate}%</span>}
                </div>
              </div>
              <table style={{borderCollapse:"collapse",width:"100%",fontSize:"12px"}}>
                <thead>
                  <tr style={{background:C.bg,borderBottom:`1px solid ${C.border}`}}>
                    {["이름","소속(회사 / 본부)","이메일","응시일","회차","점수","결과"].map((h,i)=>(
                      <th key={i} style={{padding:"9px 14px",textAlign:"left",fontSize:"11px",fontWeight:700,color:C.muted,whiteSpace:"nowrap",borderRight:i<6?`1px solid ${C.border}`:"none"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...items].sort((a,b)=>(a._date||"").localeCompare(b._date||"")).map((item,idx)=>{
                    const pc=PASS_STATUS_COLORS[item._pass]||PASS_STATUS_COLORS[""];
                    const sNum=parseFloat(item._score);
                    const sColor=isNaN(sNum)?"":sNum>=60?C.green:C.red;
                    return(
                      <tr key={item.id+item._nth} style={{borderBottom:idx<items.length-1?`1px solid ${C.border}`:"none",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=`${C.blue}04`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{padding:"10px 14px",fontWeight:700,color:C.text,whiteSpace:"nowrap",borderRight:`1px solid ${C.border}`}}>{item.name}</td>
                        <td style={{padding:"10px 14px",borderRight:`1px solid ${C.border}`}}>
                          <div style={{fontSize:"12px",color:C.blue,fontWeight:600}}>{item.company}</div>
                          <div style={{fontSize:"11px",color:C.muted,marginTop:"1px"}}>{item.division}{item.team?` · ${item.team}`:""}</div>
                        </td>
                        <td style={{padding:"10px 14px",color:C.muted,fontSize:"11px",borderRight:`1px solid ${C.border}`}}>{item.email||"—"}</td>
                        <td style={{padding:"10px 14px",color:C.subtle,whiteSpace:"nowrap",borderRight:`1px solid ${C.border}`}}>{item._date||"—"}</td>
                        <td style={{padding:"10px 14px",textAlign:"center",borderRight:`1px solid ${C.border}`}}>
                          <span style={{fontSize:"11px",padding:"2px 9px",borderRadius:"20px",background:`${C.blue}10`,color:C.blue,fontWeight:700}}>{item._nth}</span>
                        </td>
                        <td style={{padding:"10px 14px",textAlign:"center",borderRight:`1px solid ${C.border}`}}>
                          {item._score?<span style={{fontWeight:800,color:sColor}}>{item._score}<span style={{fontSize:"10px",fontWeight:500}}>점</span></span>:<span style={{color:C.muted}}>—</span>}
                        </td>
                        <td style={{padding:"10px 14px",textAlign:"center"}}>
                          {item._pass?<span style={{fontSize:"11px",padding:"3px 10px",borderRadius:"20px",background:pc.bg,color:pc.text,border:`1px solid ${pc.border}`,fontWeight:700}}>{item._pass}</span>:<span style={{color:C.muted,fontSize:"11px"}}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );

    // ── 목록 뷰 ──
    return(
      <div>
        {/* 통계 카드 */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:"10px",marginBottom:"14px"}}>
          {STAT_ITEMS.map(s=>(
            <div key={s.label} style={{background:s.bg,borderRadius:"12px",padding:"12px 14px",border:`1px solid ${s.color}22`,boxShadow:shadow,cursor:"pointer",transition:"transform 0.15s"}}
              onClick={()=>setApplicantFilter(s.label)}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
              <div style={{fontSize:"10px",color:s.color,fontWeight:700,marginBottom:"3px"}}>{s.label}</div>
              <div style={{fontSize:"22px",fontWeight:900,color:s.color}}>{s.value}<span style={{fontSize:"11px",fontWeight:500,marginLeft:"2px"}}>명</span></div>
            </div>
          ))}
          {passRate!==null&&(
            <div style={{background:`linear-gradient(135deg,${C.blue}0d,${C.green}0a)`,borderRadius:"12px",padding:"12px 14px",border:`1px solid ${C.blue}22`,boxShadow:shadow}}>
              <div style={{fontSize:"10px",color:C.blue,fontWeight:700,marginBottom:"3px"}}>합격률</div>
              <div style={{fontSize:"22px",fontWeight:900,color:passRate>=60?C.green:C.red}}>{passRate}<span style={{fontSize:"11px",fontWeight:500}}>%</span></div>
            </div>
          )}
        </div>

        {/* 선택 통계 바 */}
        {selectedIds.length>0&&(
          <div style={{marginBottom:"12px",padding:"10px 16px",background:`linear-gradient(135deg,${C.blue}0e,${C.purple}08)`,borderRadius:"12px",border:`1.5px solid ${C.blue}33`,display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap",boxShadow:shadow}}>
            <span style={{fontSize:"12px",fontWeight:800,color:C.blue}}>✓ {selectedIds.length}명 선택됨</span>
            <div style={{display:"flex",gap:"10px",fontSize:"12px",flexWrap:"wrap"}}>
              <span style={{color:C.green,fontWeight:700}}>합격 {selPassCnt("합격")}명</span>
              <span style={{color:C.red,fontWeight:700}}>불합격 {selPassCnt("불합격")}명</span>
              <span style={{color:C.amber,fontWeight:700}}>미응시 {selPassCnt("미응시")}명</span>
              {selPassRate!==null&&<span style={{color:selPassRate>=60?C.green:C.red,fontWeight:800,background:selPassRate>=60?"#f0fdf4":"#fef2f2",padding:"1px 9px",borderRadius:"20px",border:`1px solid ${selPassRate>=60?"#bbf7d0":"#fecaca"}`}}>합격률 {selPassRate}%</span>}
            </div>
            <button onClick={()=>setSelectedIds([])} style={{marginLeft:"auto",background:"none",border:`1px solid ${C.border}`,borderRadius:"7px",padding:"3px 10px",color:C.muted,fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>선택 해제</button>
          </div>
        )}

        {/* 필터 + 검색 + 버튼 */}
        <div style={{display:"flex",gap:"8px",marginBottom:"14px",flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",gap:"3px",background:C.surface,borderRadius:"10px",padding:"3px",border:`1px solid ${C.border}`}}>
            {["전체","합격","불합격","미응시","진행중"].map(s=>{
              const sc=PASS_STATUS_COLORS[s==="진행중"?"":s]||{bg:`${C.blue}10`,text:C.blue};
              const active=applicantFilter===s;
              return(<button key={s} onClick={()=>setApplicantFilter(s)} style={{padding:"5px 12px",borderRadius:"7px",border:"none",cursor:"pointer",background:active?sc.bg:"transparent",color:active?sc.text:C.muted,fontSize:"12px",fontWeight:active?700:400,fontFamily:"inherit",transition:"all 0.15s"}}>{s}</button>);
            })}
          </div>
          <input value={applicantSearch} onChange={e=>setApplicantSearch(e.target.value)} placeholder="이름·소속·이메일·입사년월 검색..." style={{flex:1,minWidth:"180px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:"9px",padding:"7px 12px",color:C.text,fontSize:"13px",outline:"none",fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
          <button onClick={()=>setAppViewMode("monthly")} style={{padding:"7px 14px",borderRadius:"9px",border:`1.5px solid ${C.blue}44`,cursor:"pointer",background:`${C.blue}08`,color:C.blue,fontSize:"12px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>📅 월별 보기</button>
          <button onClick={()=>{
            const yms=new Set();
            applicants.forEach(a=>{[a.date1,a.date2,a.date3].filter(Boolean).forEach(d=>yms.add(d.slice(0,7)));});
            const list=[...yms].sort().reverse();
            setAiMailModal({step:1,yearMonth:list[0]||"",availableYMs:list,groups:{},emails:[],isGenerating:false});
          }} style={{padding:"7px 14px",borderRadius:"9px",border:`1.5px solid ${C.purple}55`,cursor:"pointer",background:`linear-gradient(135deg,${C.purple}10,${C.blue}08)`,color:C.purple,fontSize:"12px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>🤖 AI 자동분류</button>
          <input ref={appFileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>{if(e.target.files[0])importApplicantExcel(e.target.files[0]);e.target.value='';}}/>
          <button onClick={downloadApplicantTemplate} style={{padding:"7px 14px",borderRadius:"9px",border:`1.5px solid ${C.teal}44`,cursor:"pointer",background:`${C.teal}06`,color:C.teal,fontSize:"12px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>⬇️ 양식 다운로드</button>
          <button onClick={()=>appFileRef.current?.click()} style={{padding:"7px 14px",borderRadius:"9px",border:`1.5px solid ${C.teal}55`,cursor:"pointer",background:`${C.teal}10`,color:C.teal,fontSize:"12px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>📊 일괄등록</button>
          <button onClick={()=>setApplicantModal({mode:'add',data:{...EMPTY_APPLICANT}})} style={{padding:"7px 16px",borderRadius:"9px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${C.purple}dd,${C.purple})`,color:"#fff",fontSize:"12px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>＋ 추가</button>
        </div>

        {/* 테이블 (가로스크롤 없음) */}
        <div style={{background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:shadowLg}}>
          <table style={{borderCollapse:"collapse",width:"100%",fontSize:"12px",tableLayout:"fixed"}}>
            <colgroup>
              <col style={{width:"36px"}}/>
              <col style={{width:"82px"}}/>
              <col style={{width:"68px"}}/>
              <col style={{width:"100px"}}/>
              <col style={{width:"108px"}}/>
              <col style={{width:"96px"}}/>
              <col style={{width:"148px"}}/>
              <col style={{width:"108px"}}/>
              <col style={{width:"88px"}}/>
              <col style={{width:"72px"}}/>
              <col style={{width:"54px"}}/>
            </colgroup>
            <thead>
              <tr style={{background:C.bg,borderBottom:`1.5px solid ${C.border}`}}>
                <th style={{padding:"10px 0",textAlign:"center",borderRight:`1px solid ${C.border}`}}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{cursor:"pointer",width:"14px",height:"14px",accentColor:C.blue}}/>
                </th>
                {[
                  {label:"입사년월",  key:"joinYearMonth"},
                  {label:"이름",      key:"name"},
                  {label:"구분(회사)",key:"company"},
                  {label:"소속본부",  key:"division"},
                  {label:"소속팀",    key:"team"},
                  {label:"이메일",    key:"email"},
                  {label:"테스트 결과",key:"testResult", bg:`${C.green}06`},
                  {label:"최종 상태", key:"finalStatus", bg:`${C.purple}06`},
                  {label:"메모",      key:null},
                  {label:"",          key:null},
                ].map(({label,key,bg},i)=>{
                  const isActive=sortConfig.key===key;
                  const arrow=!key?"":(isActive?(sortConfig.dir==="asc"?"↑":"↓"):"↕");
                  return(
                    <th key={i} onClick={key?()=>handleSort(key):undefined}
                      style={{padding:"10px 10px",textAlign:"left",fontWeight:700,fontSize:"11px",
                        color:isActive?C.blue:C.muted,
                        whiteSpace:"nowrap",overflow:"hidden",
                        borderRight:i<9?`1px solid ${C.border}`:"none",
                        background:isActive?`${C.blue}08`:(bg||"transparent"),
                        cursor:key?"pointer":"default",
                        userSelect:"none",
                        transition:"background 0.15s, color 0.15s",
                      }}
                      onMouseEnter={key?e=>{if(!isActive)e.currentTarget.style.background=`${C.blue}05`;}:undefined}
                      onMouseLeave={key?e=>{if(!isActive)e.currentTarget.style.background=bg||"transparent";}:undefined}
                    >
                      <span style={{display:"flex",alignItems:"center",gap:"4px"}}>
                        {label}
                        {key&&<span style={{fontSize:"10px",color:isActive?C.blue:C.border2,fontWeight:400,lineHeight:1}}>{arrow}</span>}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.length===0?(
                <tr><td colSpan={11} style={{padding:"60px",textAlign:"center",color:C.muted}}>
                  <div style={{fontSize:"32px",marginBottom:"8px"}}>👥</div>
                  <div style={{fontWeight:600,color:C.subtle}}>등록된 응시자가 없습니다</div>
                </td></tr>
              ):sorted.map((a,idx)=>{
                const lat=getLatest(a);
                const pc=PASS_STATUS_COLORS[lat.pass]||PASS_STATUS_COLORS[""];
                const fc=FINAL_STATUS_COLORS[a.finalStatus]||FINAL_STATUS_COLORS[""];
                const sNum=parseFloat(lat.score);
                const sColor=isNaN(sNum)?"":sNum>=60?C.green:C.red;
                const tryCnt=[a.pass1,a.pass2,a.pass3].filter(p=>p).length;
                const isSel=selectedIds.includes(a.id);
                return(
                  <tr key={a.id} style={{borderBottom:idx<sorted.length-1?`1px solid ${C.border}`:"none",background:isSel?`${C.blue}06`:"transparent",transition:"background 0.15s"}}
                    onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=`${C.blue}04`;}}
                    onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}>
                    <td style={{padding:"8px 0",textAlign:"center",borderRight:`1px solid ${C.border}`}}>
                      <input type="checkbox" checked={isSel} onChange={()=>toggleSelect(a.id)} style={{cursor:"pointer",width:"14px",height:"14px",accentColor:C.blue}}/>
                    </td>
                    <td style={{padding:"8px 10px",color:C.subtle,fontSize:"11px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderRight:`1px solid ${C.border}`}}>{a.joinYearMonth||"—"}</td>
                    <td style={{padding:"8px 10px",fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderRight:`1px solid ${C.border}`}}>{a.name}</td>
                    <td style={{padding:"8px 10px",borderRight:`1px solid ${C.border}`,overflow:"hidden"}}>
                      <span style={{fontSize:"11px",padding:"2px 7px",borderRadius:"6px",background:`${C.blue}10`,color:C.blue,fontWeight:600,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.company||"—"}</span>
                    </td>
                    <td style={{padding:"8px 10px",color:C.subtle,fontSize:"11px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderRight:`1px solid ${C.border}`}}>{a.division||"—"}</td>
                    <td style={{padding:"8px 10px",color:C.muted,fontSize:"11px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderRight:`1px solid ${C.border}`}}>{a.team||"—"}</td>
                    <td style={{padding:"8px 10px",color:C.muted,fontSize:"11px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderRight:`1px solid ${C.border}`}}>{a.email||"—"}</td>
                    {/* 테스트 결과 */}
                    <td style={{padding:"8px 10px",borderRight:`1px solid ${C.border}`,background:`${C.green}04`}}>
                      {lat.pass||lat.score?(
                        <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
                            {lat.pass&&<span style={{fontSize:"10px",padding:"2px 8px",borderRadius:"20px",background:pc.bg,color:pc.text,border:`1px solid ${pc.border}`,fontWeight:700,whiteSpace:"nowrap"}}>{lat.pass}</span>}
                            {lat.score&&<span style={{fontWeight:800,fontSize:"12px",color:sColor}}>{lat.score}<span style={{fontSize:"9px",fontWeight:500}}>점</span></span>}
                          </div>
                          <div style={{fontSize:"10px",color:C.muted}}>{lat.nth&&`${lat.nth} 응시`}{tryCnt>1?` (총 ${tryCnt}회)`:""}{lat.date?` · ${lat.date.slice(5).replace("-","/")}`:""}</div>
                        </div>
                      ):<span style={{fontSize:"11px",color:C.muted}}>미진행</span>}
                    </td>
                    {/* 최종 상태 */}
                    <td style={{padding:"8px 10px",borderRight:`1px solid ${C.border}`,background:`${C.purple}04`,textAlign:"center"}}>
                      {a.finalStatus?<span style={{fontSize:"10px",padding:"2px 8px",borderRadius:"20px",background:fc.bg,color:fc.text,border:`1px solid ${fc.border}`,fontWeight:700,whiteSpace:"nowrap"}}>{a.finalStatus}</span>:<span style={{color:C.muted,fontSize:"11px"}}>—</span>}
                    </td>
                    {/* 메모 아이콘 3개 */}
                    <td style={{padding:"8px 6px",borderRight:`1px solid ${C.border}`,textAlign:"center"}}>
                      <div style={{display:"flex",gap:"3px",justifyContent:"center"}}>
                        {[{icon:"📝",label:"사유/비고",val:a.reason},{icon:"🏫",label:"아카데미 공유",val:a.academyNote},{icon:"👥",label:"인사팀 공유",val:a.hrNote}].map(({icon,label,val})=>(
                          <span key={label} style={{fontSize:"13px",opacity:val?1:0.2,cursor:val?"pointer":"default",filter:val?"none":"grayscale(1)",transition:"opacity 0.15s"}}
                            onMouseEnter={val?e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({label,content:val,x:r.left,y:r.bottom+6});}:undefined}
                            onMouseLeave={val?()=>setTooltip(null):undefined}
                            title={val?"":"내용 없음"}
                          >{icon}</span>
                        ))}
                      </div>
                    </td>
                    {/* 액션 */}
                    <td style={{padding:"8px 6px",textAlign:"center"}}>
                      <div style={{display:"flex",gap:"3px",justifyContent:"center"}}>
                        <button onClick={()=>setApplicantModal({mode:'edit',data:{...a}})} title="수정" style={{width:"26px",height:"26px",background:`${C.blue}10`,border:`1px solid ${C.blue}22`,borderRadius:"6px",cursor:"pointer",color:C.blue,fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>e.currentTarget.style.background=`${C.blue}22`} onMouseLeave={e=>e.currentTarget.style.background=`${C.blue}10`}>✏️</button>
                        <button onClick={()=>deleteApplicant(a.id)} title="삭제" style={{width:"26px",height:"26px",background:"#fee2e2",border:"1px solid #dc262222",borderRadius:"6px",cursor:"pointer",color:C.red,fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>e.currentTarget.style.background="#fecaca"} onMouseLeave={e=>e.currentTarget.style.background="#fee2e2"}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{padding:"8px 16px",borderTop:`1px solid ${C.border}`,background:C.bg,fontSize:"11px",color:C.muted,display:"flex",gap:"14px",flexWrap:"wrap",alignItems:"center"}}>
            <span>전체 <b style={{color:C.blue}}>{applicants.length}</b>명 · 검색결과 <b style={{color:C.purple}}>{sorted.length}</b>명{sortConfig.key&&<span style={{color:C.blue,marginLeft:"6px"}}>· {["입사년월","이름","구분(회사)","소속본부","소속팀","이메일","테스트 결과","최종 상태"][["joinYearMonth","name","company","division","team","email","testResult","finalStatus"].indexOf(sortConfig.key)]} {sortConfig.dir==="asc"?"↑":"↓"} 정렬 중</span>}</span>
            {passRate!==null&&<span>합격률 <b style={{color:passRate>=60?C.green:C.red}}>{passRate}%</b> ({cntPass("합격")}/{tested}명)</span>}
            {applicants.length>0&&<button onClick={()=>confirmDelete("응시자 전체를 초기화하시겠습니까?",()=>setApplicants([]))} style={{marginLeft:"auto",background:"none",border:`1px solid ${C.border}`,borderRadius:"7px",padding:"3px 10px",color:C.muted,fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>전체 초기화</button>}
          </div>
        </div>
      </div>
    );
  };

  const backdropStyle = {position:"fixed",inset:0,background:"rgba(15,23,42,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(6px)",padding:"20px"};
  const inp=(ex={})=>({width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:"9px",padding:"9px 12px",color:C.text,fontSize:"13px",outline:"none",fontFamily:"inherit",boxSizing:"border-box",...ex});

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Malgun Gothic','Segoe UI',sans-serif"}}>
      <style>{`
        @keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.3}40%{transform:translateY(-7px);opacity:1}}
        @keyframes tooltipIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f1f5f9}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}::-webkit-scrollbar-thumb:hover{background:#94a3b8}
        input::placeholder,textarea::placeholder{color:#94a3b8}select option{background:#fff;color:#0f172a}
      `}</style>

      {/* 헤더 */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 8px rgba(0,0,0,0.07)"}}>
        <div style={{maxWidth:"1400px",margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:"62px",flexWrap:"wrap",gap:"8px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"7px 12px",background:"#000",borderRadius:"9px",border:"1px solid #222"}}>
              <span style={{color:"#fff",fontWeight:900,fontSize:"15px",letterSpacing:"0.06em",fontFamily:"'Arial Black','Impact','Segoe UI',sans-serif",lineHeight:1}}>OKESTRO<sup style={{fontSize:"9px",verticalAlign:"super",letterSpacing:0}}>®</sup></span>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:"14px",color:C.text}}>OKESTRO AIDA-Tutor</div>
              <div style={{fontSize:"10px",color:C.muted}}>AIDA(Okestro AI Driven Academy)</div>
            </div>
          </div>
          <div style={{display:"flex",gap:"3px",background:C.bg,borderRadius:"11px",padding:"4px",border:`1px solid ${C.border}`,alignItems:"center"}}>
            {saveLabel&&<span style={{fontSize:"11px",color:C.green,fontWeight:700,padding:"0 10px"}}>☁️ {saveLabel}</span>}
            <button onClick={()=>setTab("chat")} style={{padding:"7px 18px",borderRadius:"8px",border:"none",cursor:"pointer",background:tab==="chat"?`linear-gradient(135deg,${C.blueMid},${C.blue})`:"transparent",color:tab==="chat"?"#fff":C.subtle,fontSize:"13px",fontWeight:tab==="chat"?700:500,transition:"all 0.2s"}}>💬 AI 챗봇</button>
            <button onClick={()=>setTab("settings")} style={{padding:"7px 18px",borderRadius:"8px",border:"none",cursor:"pointer",background:tab==="settings"?`linear-gradient(135deg,${C.blueMid},${C.blue})`:"transparent",color:tab==="settings"?"#fff":C.subtle,fontSize:"13px",fontWeight:tab==="settings"?700:500,transition:"all 0.2s"}}>⚙️ 설정</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:"1400px",margin:"0 auto",padding:"24px 20px"}}>

        {/* ── AI 챗봇 탭 ── */}
        {tab==="chat"&&(
          <div>
            <div style={{marginBottom:"16px"}}>
              <h2 style={{fontSize:"20px",fontWeight:800,marginBottom:"4px",color:C.text}}>AI 교육 시뮬레이터</h2>
              <p style={{color:C.muted,fontSize:"13px"}}>교육과정, 지식 테이블, Q&A, 학습 자료를 종합하여 추론 기반으로 답변합니다.</p>
            </div>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px"}}>
              {QUICK_QS.map(q=>(<button key={q} onClick={()=>{setInput(q);inputRef.current?.focus();}} style={{padding:"6px 13px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:"20px",color:C.blue,fontSize:"12px",cursor:"pointer",fontFamily:"inherit",fontWeight:500,boxShadow:shadow}}>{q}</button>))}
            </div>
            <div style={{background:C.surface,borderRadius:"18px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:shadowLg}}>
              <div style={{padding:"12px 18px",background:C.bg,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:"10px"}}>
                <div style={{width:"34px",height:"34px",borderRadius:"50%",background:`linear-gradient(135deg,${C.blue},${C.blueLight})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><LogoIcon size={14}/></div>
                <div>
                  <div style={{fontWeight:700,fontSize:"13px",color:C.text}}>오케스트로 AI 어시스턴트</div>
                  <div style={{fontSize:"10px",color:C.green,display:"flex",alignItems:"center",gap:"4px"}}>
                    <span style={{width:"5px",height:"5px",borderRadius:"50%",background:C.green,display:"inline-block"}}></span>
                    온라인 · 교육과정 {courses.length}개 · 기술데이터 {filledRows}건 · Q&A {filledQA}건 · 자료 {ldReady}건
                  </div>
                </div>
              </div>
              <div style={{height:"420px",overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:"16px",background:"#fafbfd"}}>
                {messages.length===0&&(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:"12px",color:C.muted}}>
                    <div style={{fontSize:"40px"}}>🎓</div>
                    <div style={{fontSize:"14px",fontWeight:600,color:C.subtle}}>설정 탭에서 교육 데이터를 입력하고 질문해보세요</div>
                    <div style={{fontSize:"12px"}}>교육과정 · 기술 데이터 · Q&A · PDF · URL 학습 지원</div>
                  </div>
                )}
                {messages.map((m,i)=>{
                  const isUser=m.role==="user";
                  const hasCourses=!isUser&&m.courseCards&&m.courseCards.length>0;
                  const hasSchedules=!isUser&&m.scheduleCards&&m.scheduleCards.length>0;
                  return(
                    <div key={i} style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                      <div style={{display:"flex",flexDirection:isUser?"row-reverse":"row",gap:"8px",alignItems:"flex-end"}}>
                        {!isUser&&<div style={{width:"30px",height:"30px",borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${C.blue},${C.blueLight})`,display:"flex",alignItems:"center",justifyContent:"center"}}><LogoIcon size={12}/></div>}
                        <div style={{maxWidth:"74%",display:"flex",flexDirection:"column",alignItems:isUser?"flex-end":"flex-start",gap:"3px"}}>
                          {m.content&&<div style={{padding:"11px 15px",borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px",background:isUser?`linear-gradient(135deg,${C.blueMid},${C.blue})`:C.surface,border:!isUser?`1px solid ${C.border}`:"none",fontSize:"13px",lineHeight:1.75,color:isUser?"#fff":C.text,whiteSpace:"pre-wrap",wordBreak:"break-word",boxShadow:shadow}}>{m.content}</div>}
                          {!hasCourses&&!hasSchedules&&<div style={{fontSize:"10px",color:C.muted}}>{fmtTime(m.time)}</div>}
                        </div>
                      </div>
                      {hasCourses&&(<div style={{marginLeft:"38px"}}>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:"10px",marginBottom:"4px"}}>
                          {m.courseCards.map(course=>{const cc=CAT_COLORS[course.category]||CAT_COLORS["공통"];const targets=Array.isArray(course.target)?course.target:[course.target].filter(Boolean);return(
                            <div key={course.id} style={{background:C.surface,borderRadius:"12px",border:`1px solid ${cc.border}`,overflow:"hidden",boxShadow:shadow}}>
                              <div style={{height:"3px",background:`linear-gradient(90deg,${cc.dot},${cc.dot}88)`}}/>
                              <div style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px",flexWrap:"wrap"}}>
                                  <span style={{fontSize:"10px",padding:"2px 7px",borderRadius:"8px",background:cc.bg,color:cc.text,fontWeight:700,border:`1px solid ${cc.border}`}}>{course.category}</span>
                                  {targets.map(t=>{const tc=TARGET_COLORS[t]||TARGET_COLORS["전체"];return (<span key={t} style={{fontSize:"9px",fontWeight:700,color:tc.text,background:tc.bg,padding:"2px 6px",borderRadius:"7px",border:`1px solid ${tc.border}`}}>{t}</span>);})}
                                </div>
                                <div style={{fontWeight:800,fontSize:"13px",color:C.text,marginBottom:"5px"}}>{course.courseName}</div>
                                <div style={{fontSize:"11px",color:C.subtle,lineHeight:1.6,marginBottom:"8px"}}>{course.content}</div>
                                <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"8px",display:"flex",gap:"12px",fontSize:"11px",color:C.muted}}><span>👨‍🏫 {course.instructor||"미정"}</span><span>⏱ {course.hours||"—"}시간</span></div>
                              </div>
                            </div>
                          );})}
                        </div>
                        <div style={{fontSize:"10px",color:C.muted}}>{fmtTime(m.time)}</div>
                      </div>)}
                      {hasSchedules&&(
                        <div style={{marginLeft:"38px",marginTop:"8px"}}>
                          <div style={{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"4px"}}>
                            {[...m.scheduleCards].sort((a,b)=>a.date.localeCompare(b.date)||(a.startTime||"").localeCompare(b.startTime||"")).map(s=>{
                              const cc=CAT_COLORS[s.category]||CAT_COLORS["공통"];
                              const dt=new Date(s.date);const dow=KOR_DAYS[dt.getDay()];
                              return(
                                <div key={s.id} style={{display:"flex",alignItems:"flex-start",gap:"8px",fontSize:"12px",color:C.text}}>
                                  <span style={{color:cc.dot,fontSize:"14px",lineHeight:"1.5",flexShrink:0}}>•</span>
                                  <div>
                                    <span style={{fontWeight:700}}>{dt.getMonth()+1}/{dt.getDate()}({dow})</span>
                                    <span style={{margin:"0 5px",color:C.muted}}>|</span>
                                    <span>{s.title}</span>
                                    {s.startTime&&<span style={{color:C.muted,marginLeft:"5px"}}>🕐 {s.startTime}{s.endTime&&`~${s.endTime}`}</span>}
                                    {s.location&&<span style={{color:C.muted,marginLeft:"5px"}}>📍 {s.location}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{fontSize:"10px",color:C.muted,marginTop:"4px"}}>{fmtTime(m.time)}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isLoading&&(<div style={{display:"flex",gap:"8px",alignItems:"flex-end"}}>
                  <div style={{width:"30px",height:"30px",borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${C.blue},${C.blueLight})`,display:"flex",alignItems:"center",justifyContent:"center"}}><LogoIcon size={12}/></div>
                  <div style={{padding:"12px 16px",borderRadius:"18px 18px 18px 4px",background:C.surface,border:`1px solid ${C.border}`,display:"flex",gap:"5px",alignItems:"center",boxShadow:shadow}}>
                    {[0,1,2].map(j=><div key={j} style={{width:"6px",height:"6px",borderRadius:"50%",background:C.blueLight,animation:"bounce 1.2s infinite",animationDelay:`${j*0.2}s`}}/>)}
                  </div>
                </div>)}
                <div ref={bottomRef}/>
              </div>
              <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,background:C.surface}}>
                <div style={{display:"flex",gap:"8px",alignItems:"flex-end",background:C.bg,borderRadius:"12px",border:`1.5px solid ${C.border}`,padding:"8px 12px"}} onFocusCapture={e=>e.currentTarget.style.borderColor=C.blueLight} onBlurCapture={e=>e.currentTarget.style.borderColor=C.border}>
                  <textarea ref={el=>{inputRef.current=el;txaRef.current=el;}} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="질문을 입력하세요... (Enter 전송 / Shift+Enter 줄바꿈)" rows={1}
                    style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.text,fontSize:"13px",resize:"none",lineHeight:1.6,maxHeight:"100px",overflowY:"auto",fontFamily:"inherit"}}
                    onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,100)+"px";}}/>
                  <button onClick={sendMsg} disabled={isLoading||!input.trim()} style={{width:"36px",height:"36px",borderRadius:"9px",border:"none",flexShrink:0,background:isLoading||!input.trim()?C.border:`linear-gradient(135deg,${C.blueMid},${C.blueLight})`,color:"#fff",fontSize:"16px",cursor:isLoading||!input.trim()?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>↑</button>
                </div>
                <div style={{fontSize:"11px",color:C.muted,textAlign:"center",marginTop:"6px"}}>교육과정과 학습 데이터가 AI 답변에 즉시 반영됩니다</div>
              </div>
            </div>
          </div>
        )}

        {/* ── 설정 탭 ── */}
        {tab==="settings"&&(
          <div>
            <div style={{marginBottom:"20px"}}>
              <h2 style={{fontSize:"20px",fontWeight:800,marginBottom:"4px",color:C.text}}>교육 운영 데이터 관리</h2>
              <p style={{color:C.muted,fontSize:"13px"}}>교육과정, 학습 데이터를 관리하세요. 모든 변경 사항은 AI 챗봇에 즉시 반영됩니다.</p>
            </div>
            <div style={{display:"flex",gap:"4px",marginBottom:"24px",background:C.surface,borderRadius:"12px",padding:"4px",border:`1px solid ${C.border}`,width:"fit-content",boxShadow:shadow,flexWrap:"wrap"}}>
              {[["curriculum","🎓","커리큘럼 관리"],["schedule","📅","교육일정 관리"],["learning","🧠","학습 데이터"],["applicant","👥","응시자 관리"],["log","📋","로그"]].map(([id,icon,lbl])=>(
                <button key={id} onClick={()=>setStab(id)} style={{position:"relative",padding:"8px 16px",borderRadius:"9px",border:"none",cursor:"pointer",background:stab===id?`linear-gradient(135deg,${C.blueMid},${C.blue})`:"transparent",color:stab===id?"#fff":C.subtle,fontSize:"13px",fontWeight:stab===id?700:500,transition:"all 0.2s",whiteSpace:"nowrap"}}>
                  {icon} {lbl}
                  {id==="log"&&logs.length>0&&stab!=="log"&&<span style={{position:"absolute",top:"3px",right:"3px",minWidth:"15px",height:"15px",borderRadius:"8px",background:C.blueLight,color:"#fff",fontSize:"9px",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>{logs.length}</span>}
                  {id==="schedule"&&schedules.length>0&&stab!=="schedule"&&<span style={{position:"absolute",top:"3px",right:"3px",minWidth:"15px",height:"15px",borderRadius:"8px",background:C.green,color:"#fff",fontSize:"9px",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>{schedules.length}</span>}
                  {id==="applicant"&&applicants.length>0&&stab!=="applicant"&&<span style={{position:"absolute",top:"3px",right:"3px",minWidth:"15px",height:"15px",borderRadius:"8px",background:C.purple,color:"#fff",fontSize:"9px",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>{applicants.length}</span>}
                </button>
              ))}
            </div>

            {stab==="curriculum"&&(
              <div>
                <div style={{background:`linear-gradient(135deg,${C.blue}0f,${C.blueLight}08)`,borderRadius:"16px",border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:"20px",boxShadow:shadow}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"12px"}}>
                    <div><div style={{fontWeight:900,fontSize:"17px",color:C.text,marginBottom:"4px"}}>🎓 오케스트로 아카데미 교육과정</div><div style={{fontSize:"12px",color:C.muted}}>총 <b style={{color:C.blue}}>{courses.length}</b>개 과정</div></div>
                    <button onClick={()=>setCourseModal({mode:'add',data:{...EMPTY_COURSE}})} style={{padding:"10px 20px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${C.blueMid},${C.blue})`,color:"#fff",fontSize:"13px",fontWeight:700,fontFamily:"inherit"}}>＋ 교육과정 추가</button>
                  </div>
                  <div style={{display:"flex",gap:"6px",marginTop:"16px",flexWrap:"wrap"}}>
                    {["전체",...COURSE_CATEGORIES].map(cat=>{const cc=CAT_COLORS[cat]||{bg:`${C.blue}10`,border:`${C.blue}30`,text:C.blue,dot:C.blue};const active=courseFilter===cat;const cnt=cat==="전체"?courses.length:courses.filter(c=>c.category===cat).length;
                      return(<button key={cat} onClick={()=>setCourseFilter(cat)} style={{padding:"5px 14px",borderRadius:"20px",border:`1.5px solid ${active?cc.dot:C.border}`,background:active?cc.bg:"transparent",color:active?cc.text:C.muted,fontSize:"12px",fontWeight:active?700:400,cursor:"pointer",fontFamily:"inherit"}}>{cat} ({cnt})</button>);
                    })}
                  </div>
                </div>
                {courses.length===0&&(<div style={{textAlign:"center",padding:"60px 20px",background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,color:C.muted,boxShadow:shadow}}><div style={{fontSize:"40px",marginBottom:"12px"}}>🎓</div><div style={{fontSize:"14px",fontWeight:600,color:C.subtle,marginBottom:"6px"}}>등록된 교육과정이 없습니다</div><div style={{fontSize:"12px"}}>상단 버튼을 눌러 교육과정을 추가해보세요</div></div>)}
                {COURSE_CATEGORIES.filter(cat=>courseFilter==="전체"||courseFilter===cat).map(cat=>{
                  const catCourses=courses.filter(c=>c.category===cat);if(!catCourses.length)return null;const cc=CAT_COLORS[cat];
                  return(<div key={cat} style={{marginBottom:"24px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"5px 14px",borderRadius:"20px",background:cc.bg,border:`1.5px solid ${cc.border}`}}>
                        <span style={{width:"8px",height:"8px",borderRadius:"50%",background:cc.dot,display:"inline-block"}}></span>
                        <span style={{fontWeight:800,fontSize:"13px",color:cc.text}}>{cat}</span>
                        <span style={{fontSize:"11px",color:cc.text,opacity:0.7}}>{catCourses.length}개</span>
                      </div>
                      <input ref={catLogoRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])handleLogoUpload(e.target.files[0],logoTarget);e.target.value='';}}/>
                      {catLogos[cat]?<div style={{display:"flex",alignItems:"center",gap:"6px"}}><img src={catLogos[cat]} alt={cat} style={{width:"24px",height:"24px",borderRadius:"6px",objectFit:"cover"}}/><button onClick={()=>setCatLogos(p=>{const n={...p};delete n[cat];return n;})} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:"5px",padding:"2px 6px",cursor:"pointer",color:C.muted,fontSize:"10px",fontFamily:"inherit"}}>✕</button></div>
                      :<button onClick={()=>{setLogoTarget(cat);setTimeout(()=>catLogoRef.current?.click(),50);}} style={{padding:"3px 10px",borderRadius:"7px",border:`1px dashed ${cc.border}`,background:"transparent",color:cc.text,fontSize:"11px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:0.7}}>🖼 로고</button>}
                      <div style={{flex:1,height:"1px",background:C.border}}></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"12px"}}>
                      {catCourses.map(course=>{const targets=Array.isArray(course.target)?course.target:[course.target].filter(Boolean);return(
                        <div key={course.id} style={{background:C.surface,borderRadius:"14px",border:`1px solid ${cc.border}`,overflow:"hidden",boxShadow:shadow,transition:"box-shadow 0.2s,transform 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow=shadowLg;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.boxShadow=shadow;e.currentTarget.style.transform="translateY(0)";}}>
                          <div style={{height:"3px",background:`linear-gradient(90deg,${cc.dot},${cc.dot}88)`}}></div>
                          <div style={{padding:"14px 16px"}}>
                            <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:"8px"}}>{targets.map(t=>{const tc=TARGET_COLORS[t]||TARGET_COLORS["전체"];return (<span key={t} style={{fontSize:"10px",fontWeight:700,color:tc.text,background:tc.bg,padding:"2px 7px",borderRadius:"8px",border:`1px solid ${tc.border}`}}>{t}</span>);})}</div>
                            <div style={{fontWeight:800,fontSize:"14px",color:C.text,marginBottom:"6px"}}>{course.courseName}</div>
                            <div style={{fontSize:"12px",color:C.subtle,lineHeight:1.6,marginBottom:"10px"}}>{course.content}</div>
                            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <div style={{fontSize:"11px",color:C.muted,display:"flex",gap:"10px"}}><span>👨‍🏫 {course.instructor||"미정"}</span><span>⏱ {course.hours||"—"}h</span></div>
                              <div style={{display:"flex",gap:"4px"}}>
                                <button onClick={()=>setCourseModal({mode:'edit',data:{...course,target:Array.isArray(course.target)?course.target:[course.target].filter(Boolean)}})} style={{background:`${C.blue}10`,border:`1px solid ${C.blue}22`,borderRadius:"7px",padding:"4px 10px",cursor:"pointer",color:C.blue,fontSize:"11px",fontWeight:700,fontFamily:"inherit"}}>수정</button>
                                <button onClick={()=>deleteCourse(course.id)} style={{background:"#fee2e2",border:"1px solid #dc262222",borderRadius:"7px",padding:"4px 10px",cursor:"pointer",color:C.red,fontSize:"11px",fontWeight:700,fontFamily:"inherit"}}>삭제</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );})}
                    </div>
                  </div>);
                })}
                <div style={{background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,padding:"20px",boxShadow:shadow,marginTop:"8px"}}>
                  <div style={{fontWeight:700,fontSize:"14px",marginBottom:"12px",color:C.text}}>📝 추가 메모 및 운영 지침</div>
                  <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:"10px",padding:"12px 14px",color:C.text,fontSize:"13px",lineHeight:1.8,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
              </div>
            )}

            {stab==="schedule"&&renderCalendar()}
            {stab==="applicant"&&renderApplicants()}

            {stab==="learning"&&(
              <div>
                <div style={{display:"flex",gap:"4px",marginBottom:"20px",background:C.surface,borderRadius:"12px",padding:"4px",border:`1px solid ${C.border}`,width:"fit-content",boxShadow:shadow,flexWrap:"wrap"}}>
                  {([["tech","📋","기술 데이터",filledRows>0?filledRows:null],["qa","💬","Q&A",filledQA>0?filledQA:null],["file","📁","파일 업로드",ldProc>0?'proc':ldReady>0?ldReady:null],["url","🔗","URL 학습",null]]).map(([id,icon,lbl,badge])=>(
                    <button key={id} onClick={()=>setLtab(id)} style={{position:"relative",padding:"7px 14px",borderRadius:"9px",border:"none",cursor:"pointer",background:ltab===id?`linear-gradient(135deg,${C.blueMid},${C.blue})`:"transparent",color:ltab===id?"#fff":C.subtle,fontSize:"12px",fontWeight:ltab===id?700:500,transition:"all 0.2s",whiteSpace:"nowrap"}}>
                      {icon} {lbl}
                      {badge==='proc'&&<span style={{position:"absolute",top:"4px",right:"4px",width:"6px",height:"6px",borderRadius:"50%",background:C.amber}}/>}
                      {typeof badge==='number'&&badge>0&&<span style={{position:"absolute",top:"3px",right:"3px",minWidth:"14px",height:"14px",borderRadius:"7px",background:C.blueLight,color:"#fff",fontSize:"9px",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 2px"}}>{badge}</span>}
                    </button>
                  ))}
                </div>
                {ltab==="tech"&&(
                  <TableSection title="기술 데이터 관리" icon="📋" accent={C.blue} badge={filledRows} badgeLabel="건 학습 중" desc="솔루션별 키워드와 설명을 입력하면 AI 챗봇이 학습하여 답변합니다." onAdd={addRow} addLabel="＋ 행 추가"
                    footer={<div style={{padding:"10px 20px",borderTop:`1px solid ${C.border}`,background:C.bg,display:"flex",gap:"12px",alignItems:"center",fontSize:"12px",flexWrap:"wrap"}}><span style={{color:C.muted}}>총 <b style={{color:C.blue}}>{tableData.length}</b>행 · <b style={{color:C.green}}>{filledRows}</b>건 AI 학습 중</span>{tableData.length>0&&<button onClick={()=>confirmDelete("기술 데이터 전체를 초기화하시겠습니까?",()=>setTableData([]))} style={{marginLeft:"auto",background:"none",border:`1px solid ${C.border}`,borderRadius:"7px",padding:"3px 10px",color:C.muted,fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>전체 초기화</button>}</div>}>
                    <div style={{display:"grid",gridTemplateColumns:"180px 200px 1fr 44px",background:C.bg,borderBottom:`1px solid ${C.border}`,padding:"0 8px"}}>{["오케스트로 솔루션","키워드","설명",""].map((h,i)=><div key={i} style={{padding:"10px 12px",fontSize:"11px",fontWeight:700,color:C.muted}}>{h}</div>)}</div>
                    {tableData.length===0?<div style={{padding:"40px",textAlign:"center",color:C.muted}}><div style={{fontSize:"28px",marginBottom:"8px"}}>📋</div><div>데이터가 없습니다</div></div>
                    :<div style={{maxHeight:"480px",overflowY:"auto"}}>{tableData.map(row=>(
                      <div key={row.id} style={{display:"grid",gridTemplateColumns:"180px 200px 1fr 44px",borderBottom:`1px solid ${C.border}`,padding:"0 8px",alignItems:"stretch"}} onMouseEnter={e=>e.currentTarget.style.background=`${C.blue}05`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{padding:"6px 4px",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center"}}><select value={row.solution} onChange={e=>updateRow(row.id,"solution",e.target.value)} style={{width:"100%",background:"transparent",border:"none",outline:"none",color:row.solution?C.text:C.muted,fontFamily:"inherit",fontSize:"12px",fontWeight:600,padding:"6px 8px",cursor:"pointer"}}><option value="">솔루션 선택...</option>{SOLUTION_OPTIONS.map(opt=><option key={opt} value={opt}>{opt}</option>)}</select></div>
                        <div style={{padding:"6px 4px",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center"}}><input value={row.keyword} onChange={e=>updateRow(row.id,"keyword",e.target.value)} placeholder="핵심 키워드" style={{width:"100%",background:"transparent",border:"none",outline:"none",color:C.blue,fontFamily:"inherit",fontSize:"12px",padding:"6px 8px"}}/></div>
                        <div style={{padding:"4px"}}><textarea value={row.desc} onChange={e=>updateRow(row.id,"desc",e.target.value)} placeholder="솔루션 상세 설명..." rows={2} style={cellTA()}/></div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}><button onClick={()=>deleteRow(row.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:"14px",padding:"5px",borderRadius:"6px"}} onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.background="#fee2e2";}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.background="none";}}>🗑</button></div>
                      </div>
                    ))}</div>}
                  </TableSection>
                )}
                {ltab==="qa"&&(
                  <TableSection title="교육운영 Q&A 관리" icon="💬" accent={C.teal} badge={filledQA} badgeLabel="건 학습 중" desc="자주 묻는 질문과 답변을 입력하면 AI 챗봇이 정확히 답변합니다." onAdd={addQA} addLabel="＋ Q&A 추가" qaFileRef={qaFileRef} onImport={importQAExcel}
                    footer={<div style={{padding:"10px 20px",borderTop:`1px solid ${C.border}`,background:C.bg,display:"flex",gap:"12px",alignItems:"center",fontSize:"12px",flexWrap:"wrap"}}><span style={{color:C.muted}}>총 <b style={{color:C.teal}}>{qaData.length}</b>건 · <b style={{color:C.green}}>{filledQA}</b>건 AI 학습 중</span>{qaData.length>0&&<button onClick={()=>confirmDelete("Q&A 전체를 초기화하시겠습니까?",()=>setQaData([]))} style={{marginLeft:"auto",background:"none",border:`1px solid ${C.border}`,borderRadius:"7px",padding:"3px 10px",color:C.muted,fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>전체 초기화</button>}</div>}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1.6fr 44px",background:C.bg,borderBottom:`1px solid ${C.border}`,padding:"0 8px"}}>{[{lbl:"질문",col:C.teal},{lbl:"답변",col:C.green},{lbl:""}].map((h,i)=><div key={i} style={{padding:"10px 12px",fontSize:"11px",fontWeight:700,color:h.col||C.muted}}>{h.lbl}</div>)}</div>
                    {qaData.length===0?<div style={{padding:"40px",textAlign:"center",color:C.muted}}><div style={{fontSize:"28px",marginBottom:"8px"}}>💬</div><div>Q&A 데이터가 없습니다</div></div>
                    :<div style={{maxHeight:"480px",overflowY:"auto"}}>{qaData.map((row,i)=>(
                      <div key={row.id} style={{display:"grid",gridTemplateColumns:"1fr 1.6fr 44px",borderBottom:`1px solid ${C.border}`,padding:"0 8px",alignItems:"stretch"}} onMouseEnter={e=>e.currentTarget.style.background=`${C.teal}05`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{padding:"4px",borderRight:`1px solid ${C.border}`,display:"flex",gap:"6px",alignItems:"flex-start"}}><span style={{fontSize:"10px",fontWeight:800,color:C.teal,padding:"10px 4px 0 6px",flexShrink:0}}>Q{i+1}</span><textarea value={row.q} onChange={e=>updateQA(row.id,"q",e.target.value)} placeholder="질문..." rows={2} style={cellTA(C.text)}/></div>
                        <div style={{padding:"4px",display:"flex",gap:"6px",alignItems:"flex-start"}}><span style={{fontSize:"10px",fontWeight:800,color:C.green,padding:"10px 4px 0 6px",flexShrink:0}}>A{i+1}</span><textarea value={row.a} onChange={e=>updateQA(row.id,"a",e.target.value)} placeholder="답변..." rows={2} style={cellTA(C.subtle)}/></div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}><button onClick={()=>deleteQA(row.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:"14px",padding:"5px",borderRadius:"6px"}} onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.background="#fee2e2";}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.background="none";}}>🗑</button></div>
                      </div>
                    ))}</div>}
                  </TableSection>
                )}
                {ltab==="file"&&(
                  <div>
                    <div style={{background:isDrag?`${C.blue}05`:C.surface,border:`2px dashed ${isDrag?C.blueLight:C.border2}`,borderRadius:"16px",padding:"48px 24px",textAlign:"center",cursor:"pointer",transition:"all 0.2s",boxShadow:shadow,marginBottom:"20px"}} onClick={()=>fileRef.current?.click()} onDragOver={e=>{e.preventDefault();setIsDrag(true);}} onDragLeave={()=>setIsDrag(false)} onDrop={e=>{e.preventDefault();setIsDrag(false);handleFiles(e.dataTransfer.files);}}>
                      <div style={{fontSize:"40px",marginBottom:"12px"}}>{isDrag?"📂":"📁"}</div>
                      <div style={{fontWeight:700,fontSize:"15px",marginBottom:"6px",color:isDrag?C.blue:C.text}}>파일을 드래그하거나 클릭하여 업로드</div>
                      <div style={{fontSize:"12px",color:C.muted,marginBottom:"16px"}}>PDF 파일을 업로드하면 AI가 내용을 자동 분석합니다</div>
                      <span style={{padding:"5px 14px",borderRadius:"20px",fontSize:"12px",fontWeight:700,background:"#dc262612",color:"#dc2626",border:"1px solid #dc262633"}}>📄 PDF</span>
                      <input ref={fileRef} type="file" multiple accept=".pdf" style={{display:"none"}} onChange={e=>{handleFiles(e.target.files);e.target.value='';}}/>
                    </div>
                    {ld.length>0&&(<div style={{background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:shadowLg}}>
                      <div style={{padding:"12px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bg}}>
                        <div style={{fontWeight:700,fontSize:"13px",color:C.text}}>🗂 업로드된 학습 자료 · <span style={{color:C.green}}>{ldReady}건 완료</span></div>
                        <button onClick={()=>confirmDelete("학습 자료 전체를 삭제하시겠습니까?",()=>setLd([]))} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:"7px",padding:"3px 10px",color:C.muted,fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>전체 삭제</button>
                      </div>
                      {renderFileList(ld)}
                    </div>)}
                  </div>
                )}
                {ltab==="url"&&(
                  <div>
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"16px",padding:"40px",display:"flex",flexDirection:"column",alignItems:"center",boxShadow:shadow,marginBottom:"20px"}}>
                      <div style={{fontSize:"44px",marginBottom:"14px"}}>🔗</div>
                      <div style={{fontWeight:700,fontSize:"15px",marginBottom:"6px",color:C.text}}>URL을 입력하여 학습 시작</div>
                      <div style={{fontSize:"12px",color:C.muted,marginBottom:"24px",textAlign:"center"}}>웹 페이지 내용을 AI가 자동으로 수집하고 분석합니다</div>
                      <div style={{display:"flex",gap:"8px",width:"100%",maxWidth:"560px"}}>
                        <input value={urlInput} onChange={e=>setUrlInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&processURL(urlInput)} placeholder="https://example.com" style={{flex:1,background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:"10px",padding:"11px 16px",color:C.text,fontSize:"13px",outline:"none",fontFamily:"inherit"}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                        <button onClick={()=>processURL(urlInput)} disabled={!urlInput.trim()} style={{padding:"11px 20px",borderRadius:"10px",border:"none",cursor:urlInput.trim()?"pointer":"not-allowed",background:urlInput.trim()?`linear-gradient(135deg,${C.purple},#6d28d9)`:C.border,color:"#fff",fontSize:"13px",fontWeight:700,fontFamily:"inherit"}}>학습 시작</button>
                      </div>
                    </div>
                    {ld.filter(d=>d.type==='url').length>0&&(<div style={{background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:shadowLg}}>
                      <div style={{padding:"12px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bg}}>
                        <div style={{fontWeight:700,fontSize:"13px",color:C.text}}>🔗 학습된 URL 목록</div>
                        <button onClick={()=>confirmDelete("URL 학습 자료 전체를 삭제하시겠습니까?",()=>setLd(p=>p.filter(d=>d.type!=='url')))} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:"7px",padding:"3px 10px",color:C.muted,fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>URL 전체 삭제</button>
                      </div>
                      {renderFileList(ld.filter(d=>d.type==='url'))}
                    </div>)}
                  </div>
                )}
                <div style={{marginTop:"16px",padding:"12px 20px",background:C.surface,borderRadius:"12px",border:`1px solid ${C.border}`,display:"flex",gap:"16px",flexWrap:"wrap",alignItems:"center",boxShadow:shadow}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"12px"}}><span style={{width:"6px",height:"6px",borderRadius:"50%",background:C.green,display:"inline-block"}}></span><span style={{color:C.subtle}}>AI 챗봇 실시간 연동 중</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:"5px"}}><span>📋</span><span style={{fontSize:"12px",color:C.subtle}}>기술데이터</span><span style={{fontSize:"13px",fontWeight:800,color:C.blue}}>{filledRows}건</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:"5px"}}><span>💬</span><span style={{fontSize:"12px",color:C.subtle}}>Q&A</span><span style={{fontSize:"13px",fontWeight:800,color:C.teal}}>{filledQA}건</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:"5px"}}><span>🧠</span><span style={{fontSize:"12px",color:C.subtle}}>자료</span><span style={{fontSize:"13px",fontWeight:800,color:C.purple}}>{ldReady}건</span></div>
                </div>
              </div>
            )}

            {stab==="log"&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}>
                  <div><h3 style={{fontSize:"16px",fontWeight:800,marginBottom:"4px",color:C.text}}>대화 로그</h3><p style={{color:C.muted,fontSize:"13px"}}>AI 챗봇을 통해 대화한 내용이 자동으로 기록됩니다.</p></div>
                  <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                    <span style={{fontSize:"12px",color:C.muted}}>총 <b style={{color:C.blue}}>{logs.length}</b>건</span>
                    <button onClick={()=>confirmDelete("대화 로그를 전체 삭제하시겠습니까?",()=>setLogs([]))} disabled={logs.length===0} style={{padding:"8px 14px",background:logs.length===0?"#f1f5f9":"#fee2e2",border:`1px solid ${logs.length===0?C.border:"#dc262222"}`,borderRadius:"9px",cursor:logs.length===0?"not-allowed":"pointer",color:logs.length===0?C.muted:C.red,fontSize:"12px",fontWeight:700,fontFamily:"inherit"}}>🗑 전체 삭제</button>
                  </div>
                </div>
                <div style={{background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:shadowLg}}>
                  <div style={{display:"grid",gridTemplateColumns:"52px 130px 1fr 1fr 140px",background:C.bg,borderBottom:`1.5px solid ${C.border}`}}>
                    {[["#","center"],["일시","center"],["사용자 질문","left"],["AI 답변","left"],["관련 교육과정","center"]].map(([h,align],i)=>(
                      <div key={i} style={{padding:"11px 14px",fontSize:"11px",fontWeight:700,color:C.muted,textAlign:align,borderRight:i<4?`1px solid ${C.border}`:"none"}}>{h}</div>
                    ))}
                  </div>
                  {logs.length===0?(<div style={{padding:"70px",textAlign:"center",color:C.muted}}><div style={{fontSize:"40px",marginBottom:"12px"}}>💬</div><div style={{fontSize:"14px",fontWeight:600,color:C.subtle,marginBottom:"6px"}}>아직 대화 기록이 없습니다</div><div style={{fontSize:"12px"}}>AI 챗봇 탭에서 대화를 시작하면 자동으로 기록됩니다.</div></div>)
                  :(<div style={{maxHeight:"600px",overflowY:"auto"}}>
                    {[...logs].reverse().map((log,i)=>{const{date,time}=fmtDateTime(log.timestamp);return(
                      <div key={log.id} style={{display:"grid",gridTemplateColumns:"52px 130px 1fr 1fr 140px",borderBottom:`1px solid ${C.border}`,alignItems:"stretch",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=`${C.blue}04`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{padding:"14px",display:"flex",alignItems:"flex-start",justifyContent:"center",borderRight:`1px solid ${C.border}`}}><span style={{fontSize:"11px",color:C.muted,fontWeight:600}}>{logs.length-i}</span></div>
                        <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",borderRight:`1px solid ${C.border}`}}><span style={{fontSize:"11px",fontWeight:700,color:C.subtle}}>{date}</span><span style={{fontSize:"10px",color:C.muted}}>{time}</span></div>
                        <div style={{padding:"12px 14px",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"flex-start",gap:"6px"}}><span style={{fontSize:"10px",fontWeight:700,color:C.blue,background:`${C.blue}12`,padding:"2px 6px",borderRadius:"6px",whiteSpace:"nowrap",flexShrink:0,marginTop:"1px"}}>Q</span><span style={{fontSize:"12.5px",color:C.text,lineHeight:1.65,wordBreak:"break-word"}}>{log.userMessage}</span></div>
                        <div style={{padding:"12px 14px",borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"flex-start",gap:"6px"}}><span style={{fontSize:"10px",fontWeight:700,color:C.green,background:`${C.green}12`,padding:"2px 6px",borderRadius:"6px",whiteSpace:"nowrap",flexShrink:0,marginTop:"1px"}}>A</span><span style={{fontSize:"12px",color:C.subtle,lineHeight:1.65,wordBreak:"break-word",display:"-webkit-box",WebkitLineClamp:4,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{log.aiResponse}</span></div>
                        <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:"4px",alignItems:"flex-start"}}>
                          {log.courseNames&&log.courseNames.length>0?log.courseNames.map((name,j)=>{const course=courses.find(c=>c.courseName===name);const cc=course?CAT_COLORS[course.category]||CAT_COLORS["공통"]:{bg:`${C.blue}10`,text:C.blue,border:`${C.blue}22`};return (<span key={j} style={{fontSize:"10px",fontWeight:700,color:cc.text,background:cc.bg,padding:"3px 8px",borderRadius:"8px",border:`1px solid ${cc.border}`,lineHeight:1.4,wordBreak:"keep-all"}}>{name}</span>);}):
                          <span style={{fontSize:"11px",color:C.muted}}>—</span>}
                        </div>
                      </div>
                    );})}
                  </div>)}
                  {logs.length>0&&(<div style={{padding:"10px 20px",borderTop:`1px solid ${C.border}`,background:C.bg,display:"flex",gap:"20px",fontSize:"11px",color:C.muted,flexWrap:"wrap",alignItems:"center"}}><span>🗂 총 <b style={{color:C.blue}}>{logs.length}</b>건</span><span style={{marginLeft:"auto"}}>최신 순 정렬 · 세션 간 자동 저장</span></div>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 교육과정 모달 ── */}
      {courseModal&&(
        <div {...makeBackdropHandlers(()=>setCourseModal(null))} style={backdropStyle}>
          <div style={{background:C.surface,borderRadius:"20px",width:"100%",maxWidth:"560px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`,animation:"modalIn 0.2s ease"}}>
            <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.surface,zIndex:1}}>
              <div style={{fontWeight:900,fontSize:"16px",color:C.text}}>{courseModal.mode==='add'?"📚 교육과정 추가":"✏️ 교육과정 수정"}</div>
              <button onClick={()=>setCourseModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:"18px",padding:"2px 6px",borderRadius:"6px"}}>✕</button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:"14px"}}>
              {[{label:"중분류 (카테고리)",key:"category",type:"select",options:COURSE_CATEGORIES},{label:"교육과정명",key:"courseName",type:"text",placeholder:"예: CMP 어드민 과정"},{label:"교육 내용",key:"content",type:"textarea",placeholder:"교육 내용을 입력하세요..."},{label:"교육 대상",key:"target",type:"checkbox"},{label:"강사",key:"instructor",type:"text",placeholder:"강사명"},{label:"교육 시간",key:"hours",type:"number",placeholder:"예: 16"}].map(field=>(
                <div key={field.key}>
                  <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>{field.label}</label>
                  {field.type==="select"?(<select value={courseModal.data[field.key]} onChange={e=>setCourseModal(p=>({...p,data:{...p.data,[field.key]:e.target.value}}))} style={{...inp(),cursor:"pointer"}}>{field.options.map(o=><option key={o} value={o}>{o}</option>)}</select>)
                  :field.type==="checkbox"?(<div style={{display:"flex",flexWrap:"wrap",gap:"6px",padding:"10px 12px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:"9px"}}>{COURSE_TARGETS.map(t=>{const sel=Array.isArray(courseModal.data.target)&&courseModal.data.target.includes(t);const tc=TARGET_COLORS[t]||TARGET_COLORS["전체"];return(<label key={t} onClick={()=>toggleTarget(t)} style={{display:"flex",alignItems:"center",gap:"6px",padding:"5px 12px",borderRadius:"18px",border:`1.5px solid ${sel?tc.text:C.border}`,background:sel?tc.bg:"transparent",cursor:"pointer",userSelect:"none"}}><span style={{width:"12px",height:"12px",borderRadius:"3px",border:`2px solid ${sel?tc.text:C.border}`,background:sel?tc.text:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sel&&<span style={{color:"#fff",fontSize:"8px",fontWeight:900}}>✓</span>}</span><span style={{fontSize:"12px",fontWeight:sel?700:400,color:sel?tc.text:C.subtle}}>{t}</span></label>);})}</div>)
                  :field.type==="textarea"?(<textarea value={courseModal.data[field.key]} onChange={e=>setCourseModal(p=>({...p,data:{...p.data,[field.key]:e.target.value}}))} placeholder={field.placeholder} rows={3} style={{...inp(),resize:"vertical",lineHeight:1.7}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>)
                  :(<input type={field.type} value={courseModal.data[field.key]} onChange={e=>setCourseModal(p=>({...p,data:{...p.data,[field.key]:e.target.value}}))} placeholder={field.placeholder} style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>)}
                </div>
              ))}
            </div>
            <div style={{padding:"14px 24px 20px",display:"flex",gap:"8px"}}>
              <button onClick={()=>saveCourse(courseModal.data)} disabled={!courseModal.data.courseName.trim()} style={{flex:1,padding:"11px",borderRadius:"10px",border:"none",cursor:courseModal.data.courseName.trim()?"pointer":"not-allowed",background:courseModal.data.courseName.trim()?`linear-gradient(135deg,${C.blueMid},${C.blue})`:C.border,color:"#fff",fontSize:"13px",fontWeight:800,fontFamily:"inherit"}}>{courseModal.mode==='add'?"추가하기":"저장하기"}</button>
              <button onClick={()=>setCourseModal(null)} style={{padding:"11px 20px",borderRadius:"10px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"13px",fontFamily:"inherit"}}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 교육일정 모달 ── */}
      {scheduleModal&&(
        <div {...makeBackdropHandlers(()=>setScheduleModal(null))} style={backdropStyle}>
          <div style={{background:C.surface,borderRadius:"20px",width:"100%",maxWidth:"480px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`,animation:"modalIn 0.2s ease"}}>
            <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.surface,zIndex:1}}>
              <div style={{fontWeight:900,fontSize:"16px",color:C.text}}>{scheduleModal.mode==='add'?"📅 일정 추가":"✏️ 일정 수정"}</div>
              <button onClick={()=>setScheduleModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:"18px",padding:"2px 6px",borderRadius:"6px"}}>✕</button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:"14px"}}>
              <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>일정 제목 *</label><input value={scheduleModal.data.title} onChange={e=>setScheduleModal(p=>({...p,data:{...p.data,title:e.target.value}}))} placeholder="예: CMP 기초 과정 1일차" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
              <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>날짜 *</label><input type="date" value={scheduleModal.data.date} onChange={e=>setScheduleModal(p=>({...p,data:{...p.data,date:e.target.value}}))} style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
              <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>카테고리</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{COURSE_CATEGORIES.map(cat=>{const cc=CAT_COLORS[cat];const sel=scheduleModal.data.category===cat;return(<button key={cat} onClick={()=>setScheduleModal(p=>({...p,data:{...p.data,category:cat}}))} style={{padding:"5px 13px",borderRadius:"18px",border:`1.5px solid ${sel?cc.dot:C.border}`,background:sel?cc.bg:"transparent",color:sel?cc.text:C.muted,fontSize:"12px",fontWeight:sel?700:400,cursor:"pointer",fontFamily:"inherit"}}>{cat}</button>);})}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>시작 시간</label><input type="time" value={scheduleModal.data.startTime} onChange={e=>setScheduleModal(p=>({...p,data:{...p.data,startTime:e.target.value}}))} style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>종료 시간</label><input type="time" value={scheduleModal.data.endTime} onChange={e=>setScheduleModal(p=>({...p,data:{...p.data,endTime:e.target.value}}))} style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
              </div>
              <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>장소</label>
                <select value={scheduleModal.data.location} onChange={e=>setScheduleModal(p=>({...p,data:{...p.data,location:e.target.value}}))} style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:"9px",padding:"9px 12px",color:C.text,fontSize:"13px",outline:"none",fontFamily:"inherit",cursor:"pointer",boxSizing:"border-box"}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}>
                  {LOCATION_OPTIONS.map(opt=><option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>메모</label><textarea value={scheduleModal.data.note} onChange={e=>setScheduleModal(p=>({...p,data:{...p.data,note:e.target.value}}))} placeholder="추가 메모를 입력하세요..." rows={2} style={{...inp(),resize:"vertical",lineHeight:1.7}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
            </div>
            <div style={{padding:"14px 24px 20px",display:"flex",gap:"8px"}}>
              <button onClick={()=>saveSchedule(scheduleModal.data)} disabled={!scheduleModal.data.title.trim()||!scheduleModal.data.date} style={{flex:1,padding:"11px",borderRadius:"10px",border:"none",cursor:(scheduleModal.data.title.trim()&&scheduleModal.data.date)?"pointer":"not-allowed",background:(scheduleModal.data.title.trim()&&scheduleModal.data.date)?`linear-gradient(135deg,${C.blueMid},${C.blue})`:C.border,color:"#fff",fontSize:"13px",fontWeight:800,fontFamily:"inherit"}}>{scheduleModal.mode==='add'?"추가하기":"저장하기"}</button>
              {scheduleModal.mode==='edit'&&<button onClick={()=>deleteSchedule(scheduleModal.data.id)} style={{padding:"11px 16px",borderRadius:"10px",border:"none",cursor:"pointer",background:"#fee2e2",color:C.red,fontSize:"13px",fontWeight:700,fontFamily:"inherit"}}>삭제</button>}
              <button onClick={()=>setScheduleModal(null)} style={{padding:"11px 20px",borderRadius:"10px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"13px",fontFamily:"inherit"}}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 응시자 모달 (신규) ── */}
      {applicantModal&&(
        <div {...makeBackdropHandlers(()=>setApplicantModal(null))} style={backdropStyle}>
          <div style={{background:C.surface,borderRadius:"20px",width:"100%",maxWidth:"560px",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`,animation:"modalIn 0.2s ease"}}>
            <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.surface,zIndex:1}}>
              <div style={{fontWeight:900,fontSize:"16px",color:C.text}}>{applicantModal.mode==='add'?"👥 응시자 추가":"✏️ 응시자 수정"}</div>
              <button onClick={()=>setApplicantModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:"18px",padding:"2px 6px",borderRadius:"6px"}}>✕</button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:"14px"}}>

              {/* 기본 정보 */}
              <div style={{fontSize:"11px",fontWeight:800,color:C.blue,letterSpacing:"0.05em",paddingBottom:"4px",borderBottom:`1px solid ${C.border}`}}>기본 정보</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <div>
                  <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>입사년월</label>
                  <input value={applicantModal.data.joinYearMonth} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,joinYearMonth:e.target.value}}))} placeholder="예: 2026년 5월" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>이름 *</label>
                  <input value={applicantModal.data.name} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,name:e.target.value}}))} placeholder="홍길동" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
              </div>
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>구분 (회사)</label>
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                  {COMPANY_OPTIONS.map(c=>{const sel=applicantModal.data.company===c;return(
                    <button key={c} onClick={()=>setApplicantModal(p=>({...p,data:{...p.data,company:c}}))} style={{padding:"6px 14px",borderRadius:"20px",border:`1.5px solid ${sel?C.blue:C.border}`,background:sel?`${C.blue}10`:"transparent",color:sel?C.blue:C.muted,fontSize:"12px",fontWeight:sel?700:400,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>
                  );})}
                  <input value={!COMPANY_OPTIONS.includes(applicantModal.data.company)?applicantModal.data.company:""} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,company:e.target.value}}))} placeholder="직접 입력..." style={{...inp(),flex:1,minWidth:"120px",padding:"6px 12px"}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>소속본부</label><input value={applicantModal.data.division} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,division:e.target.value}}))} placeholder="예: 솔루션개발본부" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>소속팀</label><input value={applicantModal.data.team} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,team:e.target.value}}))} placeholder="예: IaaS개발실" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
              </div>

              {/* 본부장 정보 */}
              <div style={{background:`${C.purple}06`,borderRadius:"10px",border:`1px solid ${C.purple}22`,padding:"12px 14px"}}>
                <div style={{fontSize:"11px",fontWeight:800,color:C.purple,marginBottom:"10px",display:"flex",alignItems:"center",gap:"6px"}}>
                  🏢 본부장 정보 <span style={{fontWeight:400,color:C.muted,fontSize:"10px"}}>AI 자동분류 시 자동 입력됩니다</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                  <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"4px"}}>본부장 이름</label><input value={applicantModal.data.divisionHeadName||""} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,divisionHeadName:e.target.value}}))} placeholder="홍본부장" style={{...inp(),padding:"8px 12px"}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                  <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"4px"}}>본부장 이메일</label><input value={applicantModal.data.divisionHeadEmail||""} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,divisionHeadEmail:e.target.value}}))} placeholder="head@okestro.com" style={{...inp(),padding:"8px 12px"}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                </div>
              </div>

              {/* 팀장 정보 */}
              <div style={{background:`${C.blue}06`,borderRadius:"10px",border:`1px solid ${C.blue}22`,padding:"12px 14px"}}>
                <div style={{fontSize:"11px",fontWeight:800,color:C.blue,marginBottom:"10px",display:"flex",alignItems:"center",gap:"6px"}}>
                  👥 팀장 정보 <span style={{fontWeight:400,color:C.muted,fontSize:"10px"}}>AI 자동분류 시 자동 입력됩니다</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                  <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"4px"}}>팀장 이름</label><input value={applicantModal.data.teamLeaderName||""} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,teamLeaderName:e.target.value}}))} placeholder="김팀장" style={{...inp(),padding:"8px 12px"}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                  <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"4px"}}>팀장 이메일</label><input value={applicantModal.data.teamLeaderEmail||""} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,teamLeaderEmail:e.target.value}}))} placeholder="leader@okestro.com" style={{...inp(),padding:"8px 12px"}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                </div>
              </div>
              <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>이메일</label><input value={applicantModal.data.email} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,email:e.target.value}}))} placeholder="hong@okestro.com" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>

              {/* 테스트 결과 */}
              <div style={{fontSize:"11px",fontWeight:800,color:C.green,letterSpacing:"0.05em",paddingBottom:"4px",borderBottom:`1px solid ${C.border}`,marginTop:"4px"}}>테스트 결과 <span style={{fontSize:"10px",fontWeight:500,color:C.muted}}>(최대 3회 응시)</span></div>
              {[
                {nth:"1차",scoreKey:"score1",passKey:"pass1",prev:null},
                {nth:"2차",scoreKey:"score2",passKey:"pass2",prev:"pass1"},
                {nth:"3차",scoreKey:"score3",passKey:"pass3",prev:"pass2"},
              ].map(({nth,scoreKey,passKey,prev})=>{
                const nthNum=nth[0]; // "1","2","3"
                const isLocked=prev&&!applicantModal.data[prev];
                const sc=PASS_STATUS_COLORS[applicantModal.data[passKey]]||PASS_STATUS_COLORS[""];
                const sNum=parseFloat(applicantModal.data[scoreKey]);
                const sColor=isNaN(sNum)?"":sNum>=60?C.green:C.red;
                return(
                  <div key={nth} style={{borderRadius:"10px",border:`1.5px solid ${isLocked?C.border:applicantModal.data[passKey]?sc.border:C.border}`,padding:"12px 14px",background:isLocked?C.bg:applicantModal.data[passKey]?sc.bg+"44":"#fafbfd",opacity:isLocked?0.45:1,transition:"all 0.2s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                      <span style={{fontSize:"11px",fontWeight:800,color:isLocked?C.muted:C.subtle,background:isLocked?C.bg:`${C.blue}10`,padding:"2px 9px",borderRadius:"20px",border:`1px solid ${isLocked?C.border:C.blue}22`}}>{nth}</span>
                      {isLocked&&<span style={{fontSize:"10px",color:C.muted}}>이전 회차 결과 입력 후 활성화</span>}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"130px 1fr 1.6fr",gap:"10px"}}>
                      <div>
                        <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>응시일</label>
                        <input type="date" disabled={isLocked} value={applicantModal.data[`date${nthNum}`]} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,[`date${nthNum}`]:e.target.value}}))} style={{...inp(),fontSize:"12px"}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                      </div>
                      <div>
                        <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>점수</label>
                        <div style={{position:"relative"}}>
                          <input type="number" min="0" max="100" disabled={isLocked} value={applicantModal.data[scoreKey]}
                            onChange={e=>{
                              const val=e.target.value;
                              const num=parseFloat(val);
                              // 60점 이상 → 합격 자동, 미만 → 불합격 자동, 빈값 → 유지
                              const autoPass=val===""?applicantModal.data[passKey]:(num>=60?"합격":"불합격");
                              // 최신 차수 여부 확인 (3차 > 2차 > 1차)
                              const isLatest=passKey==="pass3"?true:passKey==="pass2"?!applicantModal.data.pass3:!applicantModal.data.pass2&&!applicantModal.data.pass3;
                              // finalStatus 동기화: 합격→합격, 불합격→불합격, 빈값→진행중
                              const newFinal=isLatest?(autoPass==="합격"?"합격":autoPass==="불합격"?"불합격":applicantModal.data.finalStatus):applicantModal.data.finalStatus;
                              setApplicantModal(p=>({...p,data:{...p.data,[scoreKey]:val,[passKey]:autoPass,finalStatus:newFinal}}));
                            }}
                            placeholder="0~100" style={{...inp(),paddingRight:"28px",color:sColor,fontWeight:sColor?800:400}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                          {applicantModal.data[scoreKey]&&<span style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",fontSize:"11px",color:C.muted,pointerEvents:"none"}}>점</span>}
                        </div>
                      </div>
                      <div>
                        <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>합격여부</label>
                        <div style={{display:"flex",gap:"5px"}}>
                          {PASS_STATUS_OPTIONS.map(s=>{const c=PASS_STATUS_COLORS[s];const sel=applicantModal.data[passKey]===s;return(
                            <button key={s} disabled={isLocked} onClick={()=>{
                              const newPass=applicantModal.data[passKey]===s?"":s;
                              // 최신 차수 여부 확인
                              const isLatest=passKey==="pass3"?true:passKey==="pass2"?!applicantModal.data.pass3:!applicantModal.data.pass2&&!applicantModal.data.pass3;
                              // finalStatus 동기화
                              const newFinal=isLatest?(newPass==="합격"?"합격":newPass==="불합격"?"불합격":newPass==="퇴사"?"퇴사":applicantModal.data.finalStatus):applicantModal.data.finalStatus;
                              setApplicantModal(p=>({...p,data:{...p.data,[passKey]:newPass,finalStatus:newFinal}}));
                            }} style={{flex:1,padding:"7px 2px",borderRadius:"7px",border:`1.5px solid ${sel?c.text:C.border}`,background:sel?c.bg:"transparent",color:sel?c.text:C.muted,fontSize:"11px",fontWeight:sel?700:400,cursor:isLocked?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{s}</button>
                          );})}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>최종 상태</label>
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                  {FINAL_STATUS_OPTIONS.map(s=>{const fc=FINAL_STATUS_COLORS[s];const sel=applicantModal.data.finalStatus===s;return(
                    <button key={s} onClick={()=>setApplicantModal(p=>({...p,data:{...p.data,finalStatus:s}}))} style={{padding:"6px 14px",borderRadius:"20px",border:`1.5px solid ${sel?fc.text:C.border}`,background:sel?fc.bg:"transparent",color:sel?fc.text:C.muted,fontSize:"12px",fontWeight:sel?700:400,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>
                  );})}
                </div>
              </div>

              {/* 공유 메모 */}
              <div style={{fontSize:"11px",fontWeight:800,color:C.purple,letterSpacing:"0.05em",paddingBottom:"4px",borderBottom:`1px solid ${C.border}`,marginTop:"4px"}}>공유 메모</div>
              <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>사유/비고</label><textarea value={applicantModal.data.reason} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,reason:e.target.value}}))} placeholder="예: 경영전략본부로 재응시 의무 없음, 퇴사..." rows={2} style={{...inp(),resize:"vertical",lineHeight:1.7}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>아카데미 공유사항</label><textarea value={applicantModal.data.academyNote} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,academyNote:e.target.value}}))} placeholder="아카데미 내부 공유 내용" rows={2} style={{...inp(),resize:"vertical",lineHeight:1.7}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>인사팀 공유사항</label><textarea value={applicantModal.data.hrNote} onChange={e=>setApplicantModal(p=>({...p,data:{...p.data,hrNote:e.target.value}}))} placeholder="인사팀 전달 내용" rows={2} style={{...inp(),resize:"vertical",lineHeight:1.7}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
              </div>
            </div>
            <div style={{padding:"14px 24px 20px",display:"flex",gap:"8px"}}>
              <button onClick={()=>saveApplicant(applicantModal.data)} disabled={!applicantModal.data.name.trim()} style={{flex:1,padding:"11px",borderRadius:"10px",border:"none",cursor:applicantModal.data.name.trim()?"pointer":"not-allowed",background:applicantModal.data.name.trim()?`linear-gradient(135deg,${C.purple}dd,${C.purple})`:C.border,color:"#fff",fontSize:"13px",fontWeight:800,fontFamily:"inherit"}}>{applicantModal.mode==='add'?"추가하기":"저장하기"}</button>
              {applicantModal.mode==='edit'&&<button onClick={()=>deleteApplicant(applicantModal.data.id)} style={{padding:"11px 16px",borderRadius:"10px",border:"none",cursor:"pointer",background:"#fee2e2",color:C.red,fontSize:"13px",fontWeight:700,fontFamily:"inherit"}}>삭제</button>}
              <button onClick={()=>setApplicantModal(null)} style={{padding:"11px 20px",borderRadius:"10px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"13px",fontFamily:"inherit"}}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI 자동분류 모달 ── */}
      {aiMailModal&&(()=>{
        const am=aiMailModal;
        const setAM=patch=>setAiMailModal(p=>({...p,...patch}));

        // 선택된 년월의 응시자 추출
        const getMonthApplicants=ym=>{
          return applicants.filter(a=>
            [a.date1,a.date2,a.date3].some(d=>d&&d.startsWith(ym))
          );
        };

        // 응시자별 해당 월 차시 정보
        const getAttemptForMonth=(a,ym)=>{
          if(a.date3&&a.date3.startsWith(ym)) return{nth:"3차",score:a.score3,pass:a.pass3,date:a.date3};
          if(a.date2&&a.date2.startsWith(ym)) return{nth:"2차",score:a.score2,pass:a.pass2,date:a.date2};
          if(a.date1&&a.date1.startsWith(ym)) return{nth:"1차",score:a.score1,pass:a.pass1,date:a.date1};
          return null;
        };

        // 본부 > 팀 그룹화 (팀장/본부장 정보 자동 추출)
        const buildGroups=ym=>{
          const apps=getMonthApplicants(ym);
          const g={};
          apps.forEach(a=>{
            const div=a.division||"(본부 미지정)";
            const team=a.team||"(팀 미지정)";
            if(!g[div]) g[div]={
              headName:a.divisionHeadName||"",
              headEmail:a.divisionHeadEmail||"",
              teams:{}
            };
            // 본부장 정보가 있으면 덮어쓰기 (비어있을 때만)
            if(!g[div].headName && a.divisionHeadName) g[div].headName=a.divisionHeadName;
            if(!g[div].headEmail && a.divisionHeadEmail) g[div].headEmail=a.divisionHeadEmail;

            if(!g[div].teams[team]) g[div].teams[team]={
              leaderName:a.teamLeaderName||"",
              leaderEmail:a.teamLeaderEmail||"",
              members:[]
            };
            // 팀장 정보가 있으면 덮어쓰기 (비어있을 때만)
            if(!g[div].teams[team].leaderName && a.teamLeaderName) g[div].teams[team].leaderName=a.teamLeaderName;
            if(!g[div].teams[team].leaderEmail && a.teamLeaderEmail) g[div].teams[team].leaderEmail=a.teamLeaderEmail;

            g[div].teams[team].members.push(a);
          });
          return g;
        };

        // AI 메일 생성
        const generateEmails=async()=>{
          setAM({isGenerating:true,emails:[]});
          const groups=am.groups;
          const [y,m]=am.yearMonth.split("-");
          const ymLabel=`${y}년 ${parseInt(m)}월`;
          const emails=[];

          for(const [div,divData] of Object.entries(groups)){
            for(const [team,teamData] of Object.entries(divData.teams)){
              if(!teamData.members.length) continue;
              const rows=teamData.members.map(a=>{
                const att=getAttemptForMonth(a,am.yearMonth);
                return `- ${a.name} (${a.company}) | ${att?.nth||"-"} 응시 | 점수: ${att?.score||"-"}점 | 결과: ${att?.pass||"-"}`;
              }).join("\n");

              const prompt=`당신은 오케스트로 아카데미 교육팀 담당자입니다.
아래 정보를 바탕으로 팀장에게 보낼 공식 비즈니스 이메일을 한국어로 작성해주세요.

[발신] 오케스트로 아카데미 교육팀
[수신] ${team} 팀장 ${teamData.leaderName||"귀중"}
[시기] ${ymLabel} 신규입사자 솔루션 테스트 결과

[응시자 데이터]
${rows}

이메일 작성 지침:
- 제목: "[오케스트로 아카데미] ${ymLabel} 솔루션 테스트 결과 안내 - ${team}"
- 정중하고 간결한 비즈니스 한국어로 작성
- 테스트 목적을 한 줄로 간략히 안내
- 응시자별 결과는 절대 표(|---|) 형식을 사용하지 말고, 아래와 같이 불렛포인트로 작성:
  • 홍길동 — 1차 응시 / 85점 / 합격
  • 김철수 — 1차 응시 / 52점 / 불합격
- 불합격자가 있는 경우 재응시 안내 문구 포함
- 마무리 인사 포함
- 서명: 오케스트로 아카데미 교육팀

JSON 형식으로만 응답: {"subject":"...","body":"..."}`;

              try{
                const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:prompt}]})});
                const data=await res.json();
                const raw=data.content?.map(c=>c.text||"").join("")||"{}";
                const clean=raw.replace(/```json|```/g,"").trim();
                let parsed={subject:`[오케스트로 아카데미] ${ymLabel} 테스트 결과 - ${team}`,body:raw};
                try{parsed=JSON.parse(clean);}catch{}
                emails.push({type:"팀",division:div,team,recipientName:teamData.leaderName,recipientEmail:teamData.leaderEmail,subject:parsed.subject,body:parsed.body});
              }catch(e){
                emails.push({type:"팀",division:div,team,recipientName:teamData.leaderName,recipientEmail:teamData.leaderEmail,subject:`[오케스트로 아카데미] ${ymLabel} 테스트 결과 - ${team}`,body:`오류: ${e.message}`});
              }
            }

            // 본부장 메일 (본부 전체 요약)
            if(divData.headEmail||divData.headName){
              const allMembers=Object.values(divData.teams).flatMap(t=>t.members);
              const rows=allMembers.map(a=>{
                const att=getAttemptForMonth(a,am.yearMonth);
                return `- ${a.name} (${a.team||"-"}) | ${att?.nth||"-"} | ${att?.score||"-"}점 | ${att?.pass||"-"}`;
              }).join("\n");

              const prompt=`당신은 오케스트로 아카데미 교육팀 담당자입니다.
본부장에게 보낼 ${ymLabel} 솔루션 테스트 결과 요약 이메일을 작성해주세요.

[발신] 오케스트로 아카데미 교육팀
[수신] ${div} 본부장 ${divData.headName||"귀중"}

[본부 전체 응시자 데이터]
${rows}

이메일 작성 지침:
- 제목: "[오케스트로 아카데미] ${ymLabel} ${div} 솔루션 테스트 결과 보고"
- 정중하고 간결한 비즈니스 한국어로 작성
- 본부 전체 현황을 한 줄 요약 (총 N명 응시, 합격 N명, 불합격 N명, 합격률 N%)
- 응시자별 결과는 절대 표(|---|) 형식을 사용하지 말고, 팀별로 묶어 불렛포인트로 작성:
  [클라우드PS팀]
  • 홍길동 — 1차 응시 / 85점 / 합격
  • 김철수 — 1차 응시 / 52점 / 불합격
- 불합격자 후속 조치(재응시 일정 등) 간략 안내
- 마무리 인사 포함
- 서명: 오케스트로 아카데미 교육팀

JSON 형식으로만 응답: {"subject":"...","body":"..."}`;

              try{
                const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:prompt}]})});
                const data=await res.json();
                const raw=data.content?.map(c=>c.text||"").join("")||"{}";
                const clean=raw.replace(/```json|```/g,"").trim();
                let parsed={subject:`[오케스트로 아카데미] ${ymLabel} ${div} 결과 보고`,body:raw};
                try{parsed=JSON.parse(clean);}catch{}
                emails.push({type:"본부",division:div,team:"",recipientName:divData.headName,recipientEmail:divData.headEmail,subject:parsed.subject,body:parsed.body});
              }catch(e){
                emails.push({type:"본부",division:div,team:"",recipientName:divData.headName,recipientEmail:divData.headEmail,subject:`[오케스트로 아카데미] ${ymLabel} ${div} 결과 보고`,body:`오류: ${e.message}`});
              }
            }
          }
          setAM({isGenerating:false,emails,step:3});
        };

        const fmtYMLabel=ym=>{if(!ym)return"";const[y,m]=ym.split("-");return `${y}년 ${parseInt(m)}월`;};
        const monthApps=am.yearMonth?getMonthApplicants(am.yearMonth):[];

        return(
          <div {...makeBackdropHandlers(()=>setAiMailModal(null))} style={backdropStyle}>
            <div style={{background:C.surface,borderRadius:"20px",width:"100%",maxWidth:"780px",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.22)",border:`1px solid ${C.border}`,animation:"modalIn 0.2s ease"}}>

              {/* 모달 헤더 */}
              <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.surface,zIndex:1}}>
                <div>
                  <div style={{fontWeight:900,fontSize:"16px",color:C.text,display:"flex",alignItems:"center",gap:"10px"}}>
                    🤖 AI 자동분류 · 메일 초안 생성
                    <span style={{fontSize:"11px",fontWeight:500,color:C.muted,background:C.bg,padding:"3px 10px",borderRadius:"20px",border:`1px solid ${C.border}`}}>
                      {am.step===1?"① 년월 선택":am.step===2?"② 팀장/본부장 정보 입력":"③ 생성된 메일 확인"}
                    </span>
                  </div>
                  <div style={{fontSize:"11px",color:C.muted,marginTop:"3px"}}>응시자를 본부·팀별로 분류하고 결과 안내 메일을 AI가 자동 작성합니다</div>
                </div>
                <button onClick={()=>setAiMailModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:"20px",padding:"2px 6px",borderRadius:"6px",flexShrink:0}}>✕</button>
              </div>

              <div style={{padding:"24px"}}>

                {/* ── STEP 1: 년월 선택 ── */}
                {am.step===1&&(
                  <div>
                    <div style={{marginBottom:"20px"}}>
                      <label style={{display:"block",fontSize:"12px",fontWeight:700,color:C.subtle,marginBottom:"8px"}}>분석할 응시 년월 선택</label>
                      {am.availableYMs.length>0?(
                        <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"12px"}}>
                          {am.availableYMs.map(ym=>(
                            <button key={ym} onClick={()=>setAM({yearMonth:ym})} style={{padding:"8px 18px",borderRadius:"20px",border:`1.5px solid ${am.yearMonth===ym?C.purple:C.border}`,background:am.yearMonth===ym?`${C.purple}12`:"transparent",color:am.yearMonth===ym?C.purple:C.subtle,fontSize:"13px",fontWeight:am.yearMonth===ym?700:400,cursor:"pointer",fontFamily:"inherit"}}>
                              {fmtYMLabel(ym)}
                            </button>
                          ))}
                        </div>
                      ):(
                        <div style={{fontSize:"12px",color:C.muted,marginBottom:"12px",padding:"12px",background:C.bg,borderRadius:"10px"}}>
                          ⚠️ 응시일이 입력된 데이터가 없습니다. 수동으로 입력해주세요.
                        </div>
                      )}
                      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                        <input type="month" value={am.yearMonth} onChange={e=>setAM({yearMonth:e.target.value})} style={{...inp(),maxWidth:"200px"}}/>
                        <span style={{fontSize:"12px",color:C.muted}}>직접 입력도 가능합니다</span>
                      </div>
                    </div>

                    {am.yearMonth&&(
                      <div style={{background:`${C.purple}08`,borderRadius:"14px",border:`1px solid ${C.purple}22`,padding:"16px 20px",marginBottom:"20px"}}>
                        <div style={{fontWeight:700,fontSize:"13px",color:C.purple,marginBottom:"10px"}}>📋 {fmtYMLabel(am.yearMonth)} 응시자 미리보기 ({monthApps.length}명)</div>
                        {monthApps.length===0?(
                          <div style={{fontSize:"12px",color:C.muted}}>해당 월에 응시한 데이터가 없습니다.</div>
                        ):(
                          <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                            {monthApps.map(a=>{
                              const att=getAttemptForMonth(a,am.yearMonth);
                              const pc=PASS_STATUS_COLORS[att?.pass||""]||PASS_STATUS_COLORS[""];
                              return(
                                <div key={a.id} style={{display:"flex",alignItems:"center",gap:"10px",fontSize:"12px",padding:"6px 10px",background:C.surface,borderRadius:"8px",border:`1px solid ${C.border}`}}>
                                  <span style={{fontWeight:700,color:C.text,minWidth:"70px"}}>{a.name}</span>
                                  <span style={{fontSize:"11px",color:C.blue,background:`${C.blue}10`,padding:"2px 7px",borderRadius:"6px"}}>{a.company}</span>
                                  <span style={{color:C.muted,fontSize:"11px"}}>{a.division} · {a.team}</span>
                                  <span style={{marginLeft:"auto",display:"flex",gap:"6px",alignItems:"center"}}>
                                    {att?.nth&&<span style={{fontSize:"10px",color:C.muted}}>{att.nth}</span>}
                                    {att?.score&&<span style={{fontWeight:800,color:parseFloat(att.score)>=60?C.green:C.red}}>{att.score}점</span>}
                                    {att?.pass&&<span style={{fontSize:"10px",padding:"2px 8px",borderRadius:"20px",background:pc.bg,color:pc.text,border:`1px solid ${pc.border}`,fontWeight:700}}>{att.pass}</span>}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{display:"flex",justifyContent:"flex-end"}}>
                      <button disabled={!am.yearMonth||monthApps.length===0} onClick={()=>{
                        const g=buildGroups(am.yearMonth);
                        // prev 입력값 우선, 없으면 applicant 데이터에서 자동 추출한 값 사용
                        const merged={};
                        Object.entries(g).forEach(([div,divData])=>{
                          const prev=am.groups[div]||{};
                          merged[div]={
                            headName:prev.headName||divData.headName||"",
                            headEmail:prev.headEmail||divData.headEmail||"",
                            teams:{}
                          };
                          Object.entries(divData.teams).forEach(([team,teamData])=>{
                            const prevT=(prev.teams||{})[team]||{};
                            merged[div].teams[team]={
                              leaderName:prevT.leaderName||teamData.leaderName||"",
                              leaderEmail:prevT.leaderEmail||teamData.leaderEmail||"",
                              members:teamData.members
                            };
                          });
                        });
                        setAM({step:2,groups:merged});
                      }} style={{padding:"11px 28px",borderRadius:"10px",border:"none",cursor:(!am.yearMonth||monthApps.length===0)?"not-allowed":"pointer",background:(!am.yearMonth||monthApps.length===0)?C.border:`linear-gradient(135deg,${C.purple}dd,${C.purple})`,color:"#fff",fontSize:"13px",fontWeight:800,fontFamily:"inherit"}}>
                        다음 단계 →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: 팀장/본부장 입력 ── */}
                {am.step===2&&(
                  <div>
                    <div style={{fontSize:"12px",color:C.muted,marginBottom:"16px",padding:"10px 14px",background:`${C.blue}06`,borderRadius:"10px",border:`1px solid ${C.blue}22`}}>
                      💡 {fmtYMLabel(am.yearMonth)} 응시자를 본부·팀별로 분류했습니다. 응시자 데이터에 팀장/본부장 정보가 있으면 자동으로 입력됩니다. 없는 항목만 직접 입력해주세요.
                    </div>
                    {Object.entries(am.groups).map(([div,divData])=>(
                      <div key={div} style={{marginBottom:"20px",borderRadius:"14px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:shadow}}>
                        {/* 본부 헤더 */}
                        <div style={{padding:"14px 18px",background:`linear-gradient(135deg,${C.blue}0a,${C.purple}06)`,borderBottom:`1px solid ${C.border}`}}>
                          <div style={{fontWeight:800,fontSize:"14px",color:C.text,marginBottom:"10px"}}>🏢 {div}</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                            <div>
                              <label style={{display:"block",fontSize:"10px",fontWeight:700,color:C.purple,marginBottom:"4px"}}>
                                본부장 이름 {divData.headName&&<span style={{fontWeight:600,color:C.green,fontSize:"9px"}}>✓ 자동입력됨</span>}
                              </label>
                              <input value={divData.headName} onChange={e=>setAiMailModal(p=>{const g={...p.groups};g[div]={...g[div],headName:e.target.value};return{...p,groups:g};})} placeholder="홍길동" style={{...inp(),padding:"7px 10px",fontSize:"12px",background:divData.headName?`${C.green}08`:C.bg,borderColor:divData.headName?`${C.green}44`:C.border}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=divData.headName?`${C.green}44`:C.border}/>
                            </div>
                            <div>
                              <label style={{display:"block",fontSize:"10px",fontWeight:700,color:C.purple,marginBottom:"4px"}}>
                                본부장 이메일 {divData.headEmail?<span style={{fontWeight:600,color:C.green,fontSize:"9px"}}>✓ 자동입력됨</span>:<span style={{fontWeight:400,color:C.muted}}>(입력 시 본부장 메일 생성)</span>}
                              </label>
                              <input value={divData.headEmail} onChange={e=>setAiMailModal(p=>{const g={...p.groups};g[div]={...g[div],headEmail:e.target.value};return{...p,groups:g};})} placeholder="head@okestro.com" style={{...inp(),padding:"7px 10px",fontSize:"12px",background:divData.headEmail?`${C.green}08`:C.bg,borderColor:divData.headEmail?`${C.green}44`:C.border}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=divData.headEmail?`${C.green}44`:C.border}/>
                            </div>
                          </div>
                        </div>
                        {/* 팀 목록 */}
                        {Object.entries(divData.teams).map(([team,teamData])=>(
                          <div key={team} style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,background:C.surface}}>
                            <div style={{display:"flex",alignItems:"flex-start",gap:"16px",flexWrap:"wrap"}}>
                              <div style={{flex:"0 0 auto"}}>
                                <div style={{fontSize:"12px",fontWeight:700,color:C.text,marginBottom:"6px"}}>👥 {team} <span style={{fontSize:"10px",color:C.muted,fontWeight:400}}>({teamData.members.length}명)</span></div>
                                <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"8px"}}>
                                  {teamData.members.map(a=>{
                                    const att=getAttemptForMonth(a,am.yearMonth);
                                    const pc=PASS_STATUS_COLORS[att?.pass||""]||PASS_STATUS_COLORS[""];
                                    return(<span key={a.id} style={{fontSize:"10px",padding:"2px 7px",borderRadius:"6px",background:pc.bg,color:pc.text,border:`1px solid ${pc.border}`,fontWeight:600}}>{a.name} {att?.score?att.score+"점":""}</span>);
                                  })}
                                </div>
                              </div>
                              <div style={{flex:1,minWidth:"280px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                                <div>
                                  <label style={{display:"block",fontSize:"10px",fontWeight:700,color:C.blue,marginBottom:"4px"}}>
                                    팀장 이름 {teamData.leaderName&&<span style={{fontWeight:600,color:C.green,fontSize:"9px"}}>✓ 자동입력됨</span>}
                                  </label>
                                  <input value={teamData.leaderName} onChange={e=>setAiMailModal(p=>{const g=JSON.parse(JSON.stringify(p.groups));g[div].teams[team].leaderName=e.target.value;return{...p,groups:g};})} placeholder="홍길동" style={{...inp(),padding:"7px 10px",fontSize:"12px",background:teamData.leaderName?`${C.green}08`:C.bg,borderColor:teamData.leaderName?`${C.green}44`:C.border}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=teamData.leaderName?`${C.green}44`:C.border}/>
                                </div>
                                <div>
                                  <label style={{display:"block",fontSize:"10px",fontWeight:700,color:C.blue,marginBottom:"4px"}}>
                                    팀장 이메일 {teamData.leaderEmail?<span style={{fontWeight:600,color:C.green,fontSize:"9px"}}>✓ 자동입력됨</span>:<span style={{color:C.red,fontSize:"9px"}}>* 필수</span>}
                                  </label>
                                  <input value={teamData.leaderEmail} onChange={e=>setAiMailModal(p=>{const g=JSON.parse(JSON.stringify(p.groups));g[div].teams[team].leaderEmail=e.target.value;return{...p,groups:g};})} placeholder="leader@okestro.com" style={{...inp(),padding:"7px 10px",fontSize:"12px",background:teamData.leaderEmail?`${C.green}08`:C.bg,borderColor:teamData.leaderEmail?`${C.green}44`:C.border}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=teamData.leaderEmail?`${C.green}44`:C.border}/>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div style={{display:"flex",gap:"8px",justifyContent:"flex-end",marginTop:"8px"}}>
                      <button onClick={()=>setAM({step:1})} style={{padding:"11px 20px",borderRadius:"10px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"13px",fontFamily:"inherit"}}>← 이전</button>
                      <button onClick={generateEmails} style={{padding:"11px 28px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${C.purple}dd,${C.purple})`,color:"#fff",fontSize:"13px",fontWeight:800,fontFamily:"inherit",display:"flex",alignItems:"center",gap:"8px"}}>
                        🤖 AI 메일 초안 생성
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: 생성된 메일 ── */}
                {am.step===3&&(
                  <div>
                    {am.isGenerating?(
                      <div style={{textAlign:"center",padding:"60px 20px"}}>
                        <div style={{fontSize:"36px",marginBottom:"14px"}}>🤖</div>
                        <div style={{fontWeight:700,fontSize:"14px",color:C.text,marginBottom:"6px"}}>AI가 메일 초안을 작성 중입니다...</div>
                        <div style={{fontSize:"12px",color:C.muted}}>본부·팀 수에 따라 10~30초 소요될 수 있습니다</div>
                        <div style={{display:"flex",gap:"5px",justifyContent:"center",marginTop:"16px"}}>
                          {[0,1,2].map(j=><div key={j} style={{width:"8px",height:"8px",borderRadius:"50%",background:C.purple,animation:"bounce 1.2s infinite",animationDelay:`${j*0.2}s`}}/>)}
                        </div>
                      </div>
                    ):(
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"10px"}}>
                          <div>
                            <div style={{fontWeight:800,fontSize:"14px",color:C.text}}>✅ {am.emails.length}건의 메일 초안이 생성됐습니다</div>
                            <div style={{fontSize:"11px",color:C.muted,marginTop:"2px"}}>{fmtYMLabel(am.yearMonth)} · 팀장/본부장 수신용</div>
                          </div>
                          <button onClick={()=>setAM({step:2})} style={{padding:"7px 16px",borderRadius:"9px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"12px",fontFamily:"inherit"}}>← 다시 편집</button>
                        </div>
                        {am.emails.map((mail,i)=>(
                          <div key={i} style={{marginBottom:"16px",borderRadius:"14px",border:`1.5px solid ${mail.type==="본부"?C.purple+"44":C.blue+"44"}`,overflow:"hidden",boxShadow:shadow}}>
                            {/* 메일 헤더 */}
                            <div style={{padding:"12px 18px",background:mail.type==="본부"?`${C.purple}08`:`${C.blue}06`,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px"}}>
                              <div>
                                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                                  <span style={{fontSize:"10px",fontWeight:800,padding:"2px 8px",borderRadius:"20px",background:mail.type==="본부"?`${C.purple}18`:`${C.blue}12`,color:mail.type==="본부"?C.purple:C.blue,border:`1px solid ${mail.type==="본부"?C.purple+"33":C.blue+"33"}`}}>{mail.type==="본부"?"본부장":"팀장"}</span>
                                  <span style={{fontWeight:700,fontSize:"13px",color:C.text}}>{mail.division}{mail.team?` > ${mail.team}`:""}</span>
                                </div>
                                <div style={{fontSize:"11px",color:C.muted}}>
                                  To: <b style={{color:C.text}}>{mail.recipientName||"(이름 미입력)"}</b>{mail.recipientEmail&&<span style={{marginLeft:"6px",color:C.blue}}>&lt;{mail.recipientEmail}&gt;</span>}
                                </div>
                                <div style={{fontSize:"11px",color:C.subtle,marginTop:"3px",fontWeight:600}}>제목: {mail.subject}</div>
                              </div>
                              <button onClick={()=>{navigator.clipboard?.writeText(`수신: ${mail.recipientName} <${mail.recipientEmail}>\n제목: ${mail.subject}\n\n${mail.body}`).then(()=>alert("클립보드에 복사됐습니다.")).catch(()=>alert("복사에 실패했습니다."));}} style={{padding:"6px 14px",borderRadius:"8px",border:`1px solid ${C.border}`,cursor:"pointer",background:C.surface,color:C.subtle,fontSize:"11px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>📋 복사</button>
                            </div>
                            {/* 메일 본문 */}
                            <div style={{padding:"16px 18px",background:C.surface}}>
                              <pre style={{fontSize:"12px",lineHeight:1.8,color:C.text,whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0,fontFamily:"'Malgun Gothic','Segoe UI',sans-serif"}}>{mail.body}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 비밀번호 확인 모달 ── */}
      {deleteConfirm&&(()=>{
        let pwVal="";
        const PasswordModal=()=>{
          const [pw,setPw]=useState("");
          const [err,setErr]=useState("");
          const handleSubmit=()=>{
            if(pw==="0828"){deleteConfirm.action();setDeleteConfirm(null);}
            else{setErr("비밀번호가 올바르지 않습니다.");setPw("");}
          };
          return(
            <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000,backdropFilter:"blur(4px)"}}
              onClick={e=>{if(e.target===e.currentTarget)setDeleteConfirm(null);}}>
              <div style={{background:"#fff",borderRadius:"16px",width:"100%",maxWidth:"360px",padding:"28px 28px 24px",boxShadow:"0 20px 60px rgba(0,0,0,0.25)",border:"1px solid #e2e8f0",animation:"modalIn 0.18s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
                  <div style={{width:"40px",height:"40px",borderRadius:"10px",background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>🗑</div>
                  <div>
                    <div style={{fontWeight:800,fontSize:"15px",color:"#0f172a"}}>삭제 확인</div>
                    <div style={{fontSize:"12px",color:"#94a3b8",marginTop:"2px"}}>{deleteConfirm.msg}</div>
                  </div>
                </div>
                <div style={{marginBottom:"16px"}}>
                  <label style={{display:"block",fontSize:"12px",fontWeight:700,color:"#334155",marginBottom:"6px"}}>비밀번호 입력</label>
                  <input
                    autoFocus
                    type="password"
                    value={pw}
                    onChange={e=>{setPw(e.target.value);setErr("");}}
                    onKeyDown={e=>{if(e.key==="Enter")handleSubmit();if(e.key==="Escape")setDeleteConfirm(null);}}
                    placeholder="비밀번호를 입력하세요"
                    style={{width:"100%",background:"#f8fafc",border:`1.5px solid ${err?"#dc2626":"#e2e8f0"}`,borderRadius:"9px",padding:"10px 14px",color:"#0f172a",fontSize:"14px",outline:"none",fontFamily:"inherit",boxSizing:"border-box",transition:"border-color 0.15s"}}
                    onFocus={e=>e.target.style.borderColor=err?"#dc2626":"#3b82f6"}
                    onBlur={e=>e.target.style.borderColor=err?"#dc2626":"#e2e8f0"}
                  />
                  {err&&<div style={{fontSize:"12px",color:"#dc2626",marginTop:"6px",display:"flex",alignItems:"center",gap:"4px"}}>⚠️ {err}</div>}
                </div>
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={()=>setDeleteConfirm(null)} style={{flex:1,padding:"10px",borderRadius:"9px",border:"1px solid #e2e8f0",cursor:"pointer",background:"transparent",color:"#64748b",fontSize:"13px",fontWeight:600,fontFamily:"inherit"}}>취소</button>
                  <button onClick={handleSubmit} style={{flex:1,padding:"10px",borderRadius:"9px",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontSize:"13px",fontWeight:800,fontFamily:"inherit"}}>삭제</button>
                </div>
              </div>
            </div>
          );
        };
        return <PasswordModal key="pw-modal"/>;
      })()}

      {/* ── 텍스트 툴팁 팝업 ── */}
      {tooltip&&(
        <div style={{
          position:"fixed",
          left:Math.min(tooltip.x, window.innerWidth-320),
          top:tooltip.y,
          zIndex:9999,
          maxWidth:"300px",
          background:"#0f172a",
          color:"#f8fafc",
          borderRadius:"10px",
          padding:"10px 14px",
          boxShadow:"0 8px 32px rgba(0,0,0,0.28)",
          pointerEvents:"none",
          animation:"tooltipIn 0.12s ease",
        }}>
          <div style={{fontSize:"10px",fontWeight:700,color:"#94a3b8",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{tooltip.label}</div>
          <div style={{fontSize:"12px",lineHeight:1.75,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{tooltip.content}</div>
        </div>
      )}
    </div>
  );
}
