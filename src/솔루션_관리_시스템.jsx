// ApplicantManager.jsx
// 오케스트로 AIDA-Tutor — 응시자 관리 독립 모듈
import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

// ── 공통 디자인 토큰 ──────────────────────────────────────────
const C = {
  bg:"#f0f4f8", surface:"#ffffff",
  border:"#e2e8f0", border2:"#cbd5e1",
  blue:"#1d4ed8", blueMid:"#2563eb", blueLight:"#3b82f6",
  text:"#0f172a", subtle:"#334155", muted:"#94a3b8",
  green:"#059669", red:"#dc2626", amber:"#d97706", purple:"#7c3aed", teal:"#0d9488",
};
const shadow   = "0 1px 6px rgba(0,0,0,0.07),0 4px 16px rgba(0,0,0,0.05)";
const shadowLg = "0 4px 24px rgba(0,0,0,0.09),0 1px 4px rgba(0,0,0,0.05)";
const uid = () => Math.random().toString(36).slice(2, 8);

// ── 응시자 관련 상수 ──────────────────────────────────────────
const COMPANY_OPTIONS      = ["오케스트로","오케스트로클라우드","오케스트로AGI","기타"];
const PASS_STATUS_OPTIONS  = ["합격","불합격","미응시","-"];
const FINAL_STATUS_OPTIONS = ["합격","불합격","진행중","해당없음","퇴사"];

const PASS_STATUS_COLORS = {
  "합격":   {bg:"#f0fdf4",border:"#bbf7d0",text:"#059669"},
  "불합격": {bg:"#fef2f2",border:"#fecaca",text:"#dc2626"},
  "미응시": {bg:"#fffbeb",border:"#fde68a",text:"#d97706"},
  "-":      {bg:"#f8fafc",border:"#e2e8f0",text:"#94a3b8"},
  "":       {bg:"#eff6ff",border:"#bfdbfe",text:"#3b82f6"},
};
const FINAL_STATUS_COLORS = {
  "합격":    {bg:"#f0fdf4",border:"#bbf7d0",text:"#059669"},
  "불합격":  {bg:"#fef2f2",border:"#fecaca",text:"#dc2626"},
  "진행중":  {bg:"#eff6ff",border:"#bfdbfe",text:"#3b82f6"},
  "해당없음":{bg:"#f8fafc",border:"#e2e8f0",text:"#94a3b8"},
  "퇴사":    {bg:"#fdf4ff",border:"#e9d5ff",text:"#7c3aed"},
  "":        {bg:"#eff6ff",border:"#bfdbfe",text:"#93c5fd"},
};

const EMPTY_APPLICANT = {
  joinYearMonth:"", name:"", company:"오케스트로",
  division:"", team:"",
  divisionHeadName:"", divisionHeadEmail:"",
  teamLeaderName:"",   teamLeaderEmail:"",
  email:"",
  score1:"", pass1:"", date1:"",
  score2:"", pass2:"", date2:"",
  score3:"", pass3:"", date3:"",
  finalStatus:"진행중",
  reason:"", academyNote:"", hrNote:"",
};

const backdropStyle = {
  position:"fixed", inset:0,
  background:"rgba(15,23,42,0.45)",
  display:"flex", alignItems:"center", justifyContent:"center",
  zIndex:200, backdropFilter:"blur(6px)", padding:"20px",
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function ApplicantManager() {
  const [loaded,      setLoaded]      = useState(false);
  const [applicants,  setApplicants]  = useState([]);
  const [applicantModal,  setApplicantModal]  = useState(null);
  const [applicantFilter, setApplicantFilter] = useState("전체");
  const [applicantSearch, setApplicantSearch] = useState("");
  const [selectedIds,     setSelectedIds]     = useState([]);
  const [appViewMode,     setAppViewMode]      = useState("list");
  const [sortConfig,      setSortConfig]       = useState({key:null,dir:"asc"});
  const [aiMailModal,     setAiMailModal]      = useState(null);
  const [tooltip,         setTooltip]          = useState(null);
  const [deleteConfirm,   setDeleteConfirm]    = useState(null);
  const [mainMenu,        setMainMenu]         = useState("list");
  const [deptData,        setDeptData]         = useState([]);
  const [deptModal,       setDeptModal]        = useState(null);

  const appFileRef  = useRef(null);
  const deptFileRef = useRef(null);
  const mouseDownTargetRef = useRef(null);

  const makeBackdropHandlers = (closeFn) => ({
    onMouseDown: e => { mouseDownTargetRef.current = e.target; },
    onClick: e => { if(e.target===e.currentTarget && mouseDownTargetRef.current===e.currentTarget) closeFn(); },
  });

  // ── 스토리지 ────────────────────────────────────────────────
  useEffect(()=>{
    (async()=>{
      try{
        const r=await window.storage?.get('aida:applicants_v2');
        if(r) setApplicants(JSON.parse(r.value));
      }catch{}
      finally{ setLoaded(true); }
    })();
  },[]);

  useEffect(()=>{
    if(!loaded) return;
    window.storage?.set('aida:applicants_v2', JSON.stringify(applicants), true).catch(()=>{});
  },[applicants, loaded]);

  useEffect(()=>{
    (async()=>{
      try{ const r=await window.storage?.get('aida:deptData_v1'); if(r) setDeptData(JSON.parse(r.value)); }catch{}
    })();
  },[]);
  useEffect(()=>{
    window.storage?.set('aida:deptData_v1', JSON.stringify(deptData), true).catch(()=>{});
  },[deptData]);

  // ── 비밀번호 확인 ─────────────────────────────────────────
  const confirmDelete=(msg,action)=>setDeleteConfirm({msg,action});

  // ── CRUD ──────────────────────────────────────────────────
  const saveApplicant=data=>{
    if(!data.name.trim()) return;
    if(applicantModal.mode==='add') setApplicants(p=>[...p,{...data,id:uid()}]);
    else setApplicants(p=>p.map(a=>a.id===data.id?data:a));
    setApplicantModal(null);
  };
  const deleteApplicant=id=>{
    confirmDelete("이 응시자를 삭제하시겠습니까?",()=>{
      setApplicants(p=>p.filter(a=>a.id!==id));
      setApplicantModal(null);
    });
  };

  // ── 엑셀 일괄등록 ─────────────────────────────────────────
  const importApplicantExcel=async file=>{
    try{
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
      const newRows=rows.map(row=>{
        const k=Object.keys(row);
        const g=(patterns)=>{const key=k.find(k=>patterns.some(p=>new RegExp(p,'i').test(k)));return key?String(row[key]||"").trim():"";};
        return {
          id:uid(),
          joinYearMonth:     g(['입사년월','입사','joinYear']),
          name:              g(['이름','name','성명']),
          company:           g(['구분','회사','company']),
          division:          g(['소속본부','본부','division']),
          team:              g(['소속팀','팀','team']),
          divisionHeadName:  g(['본부장 이름','본부장이름','headName']),
          divisionHeadEmail: g(['본부장 이메일','본부장이메일','headEmail']),
          teamLeaderName:    g(['팀장 이름','팀장이름','leaderName']),
          teamLeaderEmail:   g(['팀장 이메일','팀장이메일','leaderEmail']),
          email:             g(['이메일','email','mail']),
          score1:            g(['1차 점수','1차점수','score1']),
          pass1:             g(['1차 합격여부','1차합격','pass1']),
          date1:             g(['1차 응시일','1차응시일','date1']),
          score2:            g(['2차 점수','2차점수','score2']),
          pass2:             g(['2차 합격여부','2차합격','pass2']),
          date2:             g(['2차 응시일','2차응시일','date2']),
          score3:            g(['3차 점수','3차점수','score3']),
          pass3:             g(['3차 합격여부','3차합격','pass3']),
          date3:             g(['3차 응시일','3차응시일','date3']),
          finalStatus:       g(['최종 상태','최종상태','final','finalStatus'])||"진행중",
          reason:            g(['사유','비고','reason','note']),
          academyNote:       g(['아카데미 공유','아카데미공유','academy','academyNote']),
          hrNote:            g(['인사팀 공유','인사팀공유','hr','hrNote']),
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

  // ── 양식 다운로드 ─────────────────────────────────────────
  const downloadApplicantTemplate=()=>{
    const headers=[
      "입사년월","이름","구분(회사)","소속본부","소속팀",
      "본부장 이름","본부장 이메일","팀장 이름","팀장 이메일","이메일",
      "1차 응시일","1차 점수","1차 합격여부",
      "2차 응시일","2차 점수","2차 합격여부",
      "3차 응시일","3차 점수","3차 합격여부",
      "최종 상태","사유/비고","아카데미 공유사항","인사팀 공유사항",
    ];
    const example=[
      "2026년 5월","홍길동","오케스트로","솔루션개발본부","IaaS개발실",
      "김본부장","head@okestro.com","이팀장","leader@okestro.com","hong@okestro.com",
      "2026-05-13","85","합격","","","","","","",
      "합격","","","",
    ];
    const notes=[
      ["📋 온보딩 대상자 일괄등록 양식 — 작성 안내"],[""],
      ["※ 구분(회사): 오케스트로 / 오케스트로클라우드 / 오케스트로AGI / 기타"],
      ["※ 합격여부: 합격 / 불합격 / 미응시 / -"],
      ["※ 최종 상태: 합격 / 불합격 / 진행중 / 해당없음 / 퇴사"],
      ["※ 응시일 형식: YYYY-MM-DD (예: 2026-05-13)"],
      ["※ 점수: 0~100 숫자만 입력 (60점 이상 합격)"],[""],
      ["※ 2행의 예시 데이터는 삭제 후 3행부터 실제 데이터를 입력하세요."],
    ];
    const wb=XLSX.utils.book_new();
    const ws=XLSX.utils.aoa_to_sheet([headers,example]);
    ws['!cols']=[{wch:14},{wch:10},{wch:16},{wch:18},{wch:20},{wch:12},{wch:24},{wch:12},{wch:24},{wch:28},{wch:14},{wch:10},{wch:12},{wch:14},{wch:10},{wch:12},{wch:14},{wch:10},{wch:12},{wch:12},{wch:24},{wch:20},{wch:20}];
    ws['!rows']=[{hpt:22},{hpt:18}];
    XLSX.utils.book_append_sheet(wb,ws,"입력양식");
    const guideWs=XLSX.utils.aoa_to_sheet(notes);
    guideWs['!cols']=[{wch:60}];
    XLSX.utils.book_append_sheet(wb,guideWs,"작성안내");
    XLSX.writeFile(wb,"온보딩_대상자_일괄등록_양식.xlsx");
  };

  // ── 부서/팀 CRUD ──────────────────────────────────────────
  const addCompany  = name => { if(!name.trim()) return; setDeptData(p=>[...p,{id:uid(),company:name.trim(),divisions:[]}]); };
  const delCompany  = id   => setDeptData(p=>p.filter(c=>c.id!==id));
  const addDivision = (cid,div) => setDeptData(p=>p.map(c=>c.id===cid?{...c,divisions:[...c.divisions,{id:uid(),...div,teams:[]}]}:c));
  const updDivision = (cid,did,patch) => setDeptData(p=>p.map(c=>c.id===cid?{...c,divisions:c.divisions.map(d=>d.id===did?{...d,...patch}:d)}:c));
  const delDivision = (cid,did) => setDeptData(p=>p.map(c=>c.id===cid?{...c,divisions:c.divisions.filter(d=>d.id!==did)}:c));
  const addTeam     = (cid,did,team) => setDeptData(p=>p.map(c=>c.id===cid?{...c,divisions:c.divisions.map(d=>d.id===did?{...d,teams:[...d.teams,{id:uid(),...team}]}:d)}:c));
  const updTeam     = (cid,did,tid,patch) => setDeptData(p=>p.map(c=>c.id===cid?{...c,divisions:c.divisions.map(d=>d.id===did?{...d,teams:d.teams.map(t=>t.id===tid?{...t,...patch}:t)}:d)}:c));
  const delTeam     = (cid,did,tid) => setDeptData(p=>p.map(c=>c.id===cid?{...c,divisions:c.divisions.map(d=>d.id===did?{...d,teams:d.teams.filter(t=>t.id!==tid)}:d)}:c));
  const saveDeptModal = data => {
    const m = deptModal;
    if(m.type==="company")  { m.mode==="add"?addCompany(data.company):setDeptData(p=>p.map(c=>c.id===m.cid?{...c,company:data.company}:c)); }
    if(m.type==="division") { m.mode==="add"?addDivision(m.cid,data):updDivision(m.cid,m.did,data); }
    if(m.type==="team")     { m.mode==="add"?addTeam(m.cid,m.did,data):updTeam(m.cid,m.did,m.tid,data); }
    setDeptModal(null);
  };

  // ── 부서 엑셀 일괄등록 ────────────────────────────────────
  const importDeptExcel = async file => {
    try{
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
      const nd=[...deptData];
      rows.forEach(row=>{
        const g=pats=>{const k=Object.keys(row).find(k=>pats.some(p=>new RegExp(p,'i').test(k)));return k?String(row[k]||"").trim():"";};
        const co=g(['회사','company']); const dn=g(['본부명','본부','division']); const hN=g(['본부장이름','본부장 이름','headName']); const hE=g(['본부장이메일','본부장 이메일','headEmail']);
        const tn=g(['팀명','팀','team']); const lN=g(['팀장이름','팀장 이름','leaderName']); const lE=g(['팀장이메일','팀장 이메일','leaderEmail']);
        if(!co&&!dn&&!tn) return;
        let comp=nd.find(c=>c.company===co); if(!comp&&co){comp={id:uid(),company:co,divisions:[]};nd.push(comp);}
        if(!comp) return;
        let div=comp.divisions.find(d=>d.name===dn); if(!div&&dn){div={id:uid(),name:dn,headName:hN,headEmail:hE,teams:[]};comp.divisions.push(div);}
        if(!div) return;
        if(hN&&!div.headName) div.headName=hN; if(hE&&!div.headEmail) div.headEmail=hE;
        if(tn&&!div.teams.find(t=>t.name===tn)) div.teams.push({id:uid(),name:tn,leaderName:lN,leaderEmail:lE});
      });
      setDeptData([...nd]); alert("부서/팀 데이터를 등록했습니다.");
    }catch(e){alert(`파일 읽기 오류: ${e.message}`);}
  };
  const downloadDeptTemplate = () => {
    const headers=["회사","본부명","본부장이름","본부장이메일","팀명","팀장이름","팀장이메일"];
    const ex=[["오케스트로","솔루션개발본부","홍본부장","head@okestro.com","IaaS개발실","김팀장","leader@okestro.com"],
              ["오케스트로","솔루션개발본부","홍본부장","head@okestro.com","PaaS개발실","박팀장","park@okestro.com"]];
    const wb=XLSX.utils.book_new();
    const ws=XLSX.utils.aoa_to_sheet([headers,...ex]);
    ws['!cols']=[{wch:16},{wch:20},{wch:12},{wch:26},{wch:18},{wch:12},{wch:26}];
    XLSX.utils.book_append_sheet(wb,ws,"부서팀등록");
    XLSX.writeFile(wb,"부서팀_등록_양식.xlsx");
  };

  // ── 헬퍼 ──────────────────────────────────────────────────
  const getLatest=a=>{
    if(a.pass3||a.score3) return{score:a.score3,pass:a.pass3,nth:"3차",date:a.date3||""};
    if(a.pass2||a.score2) return{score:a.score2,pass:a.pass2,nth:"2차",date:a.date2||""};
    if(a.pass1||a.score1) return{score:a.score1,pass:a.pass1,nth:"1차",date:a.date1||""};
    return{score:a.testScore||"",pass:a.passStatus||"",nth:"",date:""};
  };

  const inp=(ex={})=>({
    width:"100%", background:C.bg, border:`1.5px solid ${C.border}`,
    borderRadius:"9px", padding:"9px 12px", color:C.text,
    fontSize:"13px", outline:"none", fontFamily:"inherit",
    boxSizing:"border-box", ...ex,
  });

  // ── 월별 뷰 ───────────────────────────────────────────────
  const getAttemptForMonth=(a,ym)=>{
    if(a.date3&&a.date3.startsWith(ym)) return{nth:"3차",score:a.score3,pass:a.pass3,date:a.date3};
    if(a.date2&&a.date2.startsWith(ym)) return{nth:"2차",score:a.score2,pass:a.pass2,date:a.date2};
    if(a.date1&&a.date1.startsWith(ym)) return{nth:"1차",score:a.score1,pass:a.pass1,date:a.date1};
    return null;
  };

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
    const[y,m]=ym.split("-");
    return `${y}년 ${parseInt(m)}월`;
  };

  // ── AI 자동분류 ──────────────────────────────────────────
  const getMonthApplicants=ym=>applicants.filter(a=>[a.date1,a.date2,a.date3].some(d=>d&&d.startsWith(ym)));

  const buildGroups=ym=>{
    const apps=getMonthApplicants(ym);
    const g={};
    apps.forEach(a=>{
      const div=a.division||"(본부 미지정)";
      const team=a.team||"(팀 미지정)";
      if(!g[div]) g[div]={headName:a.divisionHeadName||"",headEmail:a.divisionHeadEmail||"",teams:{}};
      if(!g[div].headName&&a.divisionHeadName) g[div].headName=a.divisionHeadName;
      if(!g[div].headEmail&&a.divisionHeadEmail) g[div].headEmail=a.divisionHeadEmail;
      if(!g[div].teams[team]) g[div].teams[team]={leaderName:a.teamLeaderName||"",leaderEmail:a.teamLeaderEmail||"",members:[]};
      if(!g[div].teams[team].leaderName&&a.teamLeaderName) g[div].teams[team].leaderName=a.teamLeaderName;
      if(!g[div].teams[team].leaderEmail&&a.teamLeaderEmail) g[div].teams[team].leaderEmail=a.teamLeaderEmail;
      g[div].teams[team].members.push(a);
    });
    return g;
  };

  const generateEmails=()=>{
    const am=aiMailModal;
    const [y,m]=am.yearMonth.split("-");
    const mNum=parseInt(m);
    const emails=[];
    Object.entries(am.groups).forEach(([div,divData])=>{
      Object.entries(divData.teams).forEach(([team,teamData])=>{
        if(!teamData.members.length) return;
        const rows=teamData.members.map(a=>{
          const att=getAttemptForMonth(a,am.yearMonth);
          const passColor=att?.pass==="합격"?"✅":att?.pass==="불합격"?"❌":"⏺";
          return `  ${passColor} ${a.name}  |  ${att?.nth||"-"} 응시  |  ${att?.score!=null&&att.score!==""?att.score+"점":"-"}  |  ${att?.pass||"-"}`;
        }).join("\n");
        const subject=`${mNum}월 OKESTRO Solution Test 시험 결과`;
        const body=`안녕하세요, 오케스트로 아카데미 입니다.\n\n${y}년 ${mNum}월 OKESTRO Solution Test 진행에 협조해 주셔서 감사합니다.\n\n${mNum}월 솔루션 테스트의 결과를 공유 드립니다.\n\n[시험 결과]\n${rows}\n\n100점 만점에 합격 점수는 60점이오니, 확인 시 참고해 주시기 바랍니다.\n\n관련하여 궁금한 사항 있으시면 아카데미로 문의해 주시기 바랍니다.\n\n감사합니다.\n오케스트로 아카데미 교육팀`;
        emails.push({division:div,team,leaderName:teamData.leaderName,leaderEmail:teamData.leaderEmail,headName:divData.headName,headEmail:divData.headEmail,subject,body});
      });
    });
    setAiMailModal(p=>({...p,emails,step:3,isGenerating:false}));
  };

  // ── 렌더 ──────────────────────────────────────────────────
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

  const handleSort=key=>{
    setSortConfig(p=>p.key===key?{key,dir:p.dir==="asc"?"desc":"asc"}:{key,dir:"asc"});
  };
  const sorted=[...filtered].sort((a,b)=>{
    if(!sortConfig.key) return 0;
    if(sortConfig.key==="testResult"){
      const va=parseFloat(getLatest(a).score)||((getLatest(a).pass==="미응시")?-1:-2);
      const vb=parseFloat(getLatest(b).score)||((getLatest(b).pass==="미응시")?-1:-2);
      return sortConfig.dir==="asc"?va-vb:vb-va;
    }
    const va=(a[sortConfig.key]||"").toLowerCase();
    const vb=(b[sortConfig.key]||"").toLowerCase();
    if(va<vb) return sortConfig.dir==="asc"?-1:1;
    if(va>vb) return sortConfig.dir==="asc"?1:-1;
    return 0;
  });

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


  const NAV_TABS=[
    {id:"list",icon:"≡",label:"관리 리스트"},
    {id:"ai",icon:"🤖",label:"AI 자동분류"},
    {id:"dept",icon:"🏢",label:"부서/팀 관리"},
  ];
  const fmtYML=ym=>{if(!ym)return"";const[y,m]=ym.split("-");return`${y}년 ${parseInt(m)}월`;};

  return(
    <div style={{background:C.bg,minHeight:"100vh"}}>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.3}40%{transform:translateY(-7px);opacity:1}}`}</style>

      {/* GNB */}
      <div style={{background:C.surface,borderBottom:`1.5px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",padding:"0 40px",display:"flex",alignItems:"stretch",height:"52px",gap:"2px"}}>
          <span style={{fontWeight:900,fontSize:"13px",color:C.blue,marginRight:"20px",letterSpacing:"-0.5px",display:"flex",alignItems:"center",whiteSpace:"nowrap"}}>솔루션테스트관리시스템</span>
          {NAV_TABS.map(tab=>{
            const active=mainMenu===tab.id;
            return(
              <button key={tab.id} onClick={()=>{
                setMainMenu(tab.id);
                if(tab.id==="ai"&&!aiMailModal){
                  const yms=new Set();
                  applicants.forEach(a=>{[a.date1,a.date2,a.date3].filter(Boolean).forEach(d=>yms.add(d.slice(0,7)));});
                  const list=[...yms].sort().reverse();
                  setAiMailModal({step:1,yearMonth:list[0]||"",availableYMs:list,groups:{},emails:[],isGenerating:false});
                }
              }}
              style={{padding:"0 18px",border:"none",borderBottom:active?`2.5px solid ${C.blue}`:"2.5px solid transparent",cursor:"pointer",background:"transparent",color:active?C.blue:C.muted,fontSize:"13px",fontWeight:active?700:500,fontFamily:"inherit",transition:"all 0.15s",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:"6px"}}>
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"28px 40px 60px"}}>
        <div style={{marginBottom:"20px",paddingBottom:"14px",borderBottom:`2px solid ${C.blue}22`}}>
          <h1 style={{fontSize:"20px",fontWeight:900,color:C.text,margin:0,letterSpacing:"-0.3px"}}>신규입사자 솔루션 테스트 관리</h1>
        </div>

        {/* 관리 리스트 */}
        {mainMenu==="list"&&(
          <>
          {appViewMode==="monthly"?(
            <>
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
            </>
          ):(
            <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:"10px",marginBottom:"14px"}}>
              {STAT_ITEMS.map(s=>(
                <div key={s.label} style={{background:s.bg,borderRadius:"12px",padding:"12px 14px",border:`1px solid ${s.color}22`,boxShadow:shadow,cursor:"pointer",transition:"transform 0.15s"}} onClick={()=>setApplicantFilter(s.label)} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
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
              <input ref={appFileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>{if(e.target.files[0])importApplicantExcel(e.target.files[0]);e.target.value='';}}/>
              <button onClick={downloadApplicantTemplate} style={{padding:"7px 14px",borderRadius:"9px",border:`1.5px solid ${C.teal}44`,cursor:"pointer",background:`${C.teal}06`,color:C.teal,fontSize:"12px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>⬇️ 양식 다운로드</button>
              <button onClick={()=>appFileRef.current?.click()} style={{padding:"7px 14px",borderRadius:"9px",border:`1.5px solid ${C.teal}55`,cursor:"pointer",background:`${C.teal}10`,color:C.teal,fontSize:"12px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>📊 일괄등록</button>
              <button onClick={()=>setApplicantModal({mode:'add',data:{...EMPTY_APPLICANT}})} style={{padding:"7px 16px",borderRadius:"9px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${C.purple}dd,${C.purple})`,color:"#fff",fontSize:"12px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>＋ 추가</button>
            </div>
            <div style={{background:C.surface,borderRadius:"16px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:shadowLg}}>
              <table style={{borderCollapse:"collapse",width:"100%",fontSize:"12px",tableLayout:"fixed"}}>
                <colgroup>
                  <col style={{width:"36px"}}/><col style={{width:"82px"}}/><col style={{width:"68px"}}/><col style={{width:"100px"}}/>
                  <col style={{width:"108px"}}/><col style={{width:"96px"}}/><col style={{width:"148px"}}/><col style={{width:"108px"}}/>
                  <col style={{width:"88px"}}/><col style={{width:"72px"}}/><col style={{width:"54px"}}/>
                </colgroup>
                <thead>
                  <tr style={{background:C.bg,borderBottom:`1.5px solid ${C.border}`}}>
                    <th style={{padding:"10px 0",textAlign:"center",borderRight:`1px solid ${C.border}`}}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{cursor:"pointer",width:"14px",height:"14px",accentColor:C.blue}}/>
                    </th>
                    {[
                      {label:"입사년월",key:"joinYearMonth"},{label:"이름",key:"name"},{label:"구분(회사)",key:"company"},
                      {label:"소속본부",key:"division"},{label:"소속팀",key:"team"},{label:"이메일",key:"email"},
                      {label:"테스트 결과",key:"testResult",bg:`${C.green}06`},{label:"최종 상태",key:"finalStatus",bg:`${C.purple}06`},
                      {label:"메모",key:null},{label:"",key:null},
                    ].map(({label,key,bg},i)=>{
                      const isActive=sortConfig.key===key;
                      const arrow=!key?"":(isActive?(sortConfig.dir==="asc"?"↑":"↓"):"↕");
                      return(
                        <th key={i} onClick={key?()=>handleSort(key):undefined}
                          style={{padding:"10px 10px",textAlign:"left",fontWeight:700,fontSize:"11px",color:isActive?C.blue:C.muted,whiteSpace:"nowrap",overflow:"hidden",borderRight:i<9?`1px solid ${C.border}`:"none",background:isActive?`${C.blue}08`:(bg||"transparent"),cursor:key?"pointer":"default",userSelect:"none",transition:"background 0.15s,color 0.15s"}}
                          onMouseEnter={key?e=>{if(!isActive)e.currentTarget.style.background=`${C.blue}05`;}:undefined}
                          onMouseLeave={key?e=>{if(!isActive)e.currentTarget.style.background=bg||"transparent";}:undefined}>
                          <span style={{display:"flex",alignItems:"center",gap:"4px"}}>{label}{key&&<span style={{fontSize:"10px",color:isActive?C.blue:C.border2,fontWeight:400,lineHeight:1}}>{arrow}</span>}</span>
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
                      <tr key={a.id} style={{borderBottom:idx<sorted.length-1?`1px solid ${C.border}`:"none",background:isSel?`${C.blue}06`:"transparent",transition:"background 0.15s"}} onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=`${C.blue}04`;}} onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}>
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
                        <td style={{padding:"8px 10px",borderRight:`1px solid ${C.border}`,background:`${C.purple}04`,textAlign:"center"}}>
                          {a.finalStatus?<span style={{fontSize:"10px",padding:"2px 8px",borderRadius:"20px",background:fc.bg,color:fc.text,border:`1px solid ${fc.border}`,fontWeight:700,whiteSpace:"nowrap"}}>{a.finalStatus}</span>:<span style={{color:C.muted,fontSize:"11px"}}>—</span>}
                        </td>
                        <td style={{padding:"8px 6px",borderRight:`1px solid ${C.border}`,textAlign:"center"}}>
                          <div style={{display:"flex",gap:"3px",justifyContent:"center"}}>
                            {[{icon:"📝",label:"사유/비고",val:a.reason},{icon:"🏫",label:"아카데미 공유",val:a.academyNote},{icon:"👥",label:"인사팀 공유",val:a.hrNote}].map(({icon,label,val})=>(
                              <span key={label} style={{fontSize:"13px",opacity:val?1:0.2,cursor:val?"pointer":"default",filter:val?"none":"grayscale(1)",transition:"opacity 0.15s"}}
                                onMouseEnter={val?e=>{const r=e.currentTarget.getBoundingClientRect();setTooltip({label,content:val,x:r.left,y:r.bottom+6});}:undefined}
                                onMouseLeave={val?()=>setTooltip(null):undefined}
                              >{icon}</span>
                            ))}
                          </div>
                        </td>
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
            </>
          )}
          </>
        )}

        {/* AI 자동분류 페이지 */}
        {mainMenu==="ai"&&(()=>{
          const am=aiMailModal||{step:1,yearMonth:"",availableYMs:[],groups:{},emails:[],isGenerating:false};
          const setAM=patch=>setAiMailModal(p=>({...(p||am),...patch}));
          const monthApps=am.yearMonth?getMonthApplicants(am.yearMonth):[];
          return(
            <div style={{background:C.surface,borderRadius:"20px",border:`1px solid ${C.border}`,boxShadow:shadowLg,overflow:"hidden"}}>
              <div style={{padding:"18px 24px 14px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(135deg,${C.purple}08,${C.blue}05)`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"10px"}}>
                <div>
                  <div style={{fontWeight:900,fontSize:"16px",color:C.text,display:"flex",alignItems:"center",gap:"10px"}}>
                    🤖 AI 자동분류 · 메일 초안 생성
                    <span style={{fontSize:"11px",fontWeight:500,color:C.muted,background:C.bg,padding:"3px 10px",borderRadius:"20px",border:`1px solid ${C.border}`}}>{am.step===1?"① 년월 선택":am.step===2?"② 팀장/본부장 정보 입력":"③ 생성된 메일 확인"}</span>
                  </div>
                  <div style={{fontSize:"11px",color:C.muted,marginTop:"3px"}}>응시자를 본부·팀별로 분류하고 결과 안내 메일을 AI가 자동 작성합니다</div>
                </div>
                <button onClick={()=>{const yms=new Set();applicants.forEach(a=>{[a.date1,a.date2,a.date3].filter(Boolean).forEach(d=>yms.add(d.slice(0,7)));});const list=[...yms].sort().reverse();setAiMailModal({step:1,yearMonth:list[0]||"",availableYMs:list,groups:{},emails:[],isGenerating:false});}} style={{padding:"6px 14px",borderRadius:"8px",border:`1px solid ${C.border}`,cursor:"pointer",background:C.bg,color:C.muted,fontSize:"12px",fontFamily:"inherit"}}>↺ 초기화</button>
              </div>
              <div style={{padding:"24px"}}>
                {am.step===1&&(
                  <div>
                    <div style={{marginBottom:"20px"}}>
                      <label style={{display:"block",fontSize:"12px",fontWeight:700,color:C.subtle,marginBottom:"8px"}}>분석할 응시 년월 선택</label>
                      {am.availableYMs.length>0&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"12px"}}>
                          {am.availableYMs.map(ym=>(
                            <button key={ym} onClick={()=>setAM({yearMonth:ym})} style={{padding:"8px 18px",borderRadius:"20px",border:`1.5px solid ${am.yearMonth===ym?C.purple:C.border}`,background:am.yearMonth===ym?`${C.purple}12`:"transparent",color:am.yearMonth===ym?C.purple:C.subtle,fontSize:"13px",fontWeight:am.yearMonth===ym?700:400,cursor:"pointer",fontFamily:"inherit"}}>{fmtYML(ym)}</button>
                          ))}
                        </div>
                      )}
                      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                        <input type="month" value={am.yearMonth} onChange={e=>setAM({yearMonth:e.target.value})} style={{...inp({maxWidth:"200px"})}}/>
                        <span style={{fontSize:"12px",color:C.muted}}>직접 입력도 가능합니다</span>
                      </div>
                    </div>
                    {am.yearMonth&&(
                      <div style={{background:`${C.purple}08`,borderRadius:"14px",border:`1px solid ${C.purple}22`,padding:"16px 20px",marginBottom:"20px"}}>
                        <div style={{fontWeight:700,fontSize:"13px",color:C.purple,marginBottom:"10px"}}>📋 {fmtYML(am.yearMonth)} 응시자 미리보기 ({monthApps.length}명)</div>
                        {monthApps.length===0?(<div style={{fontSize:"12px",color:C.muted}}>해당 월에 응시한 데이터가 없습니다.</div>):(
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
                        const merged={};
                        Object.entries(g).forEach(([div,divData])=>{
                          const prev=am.groups[div]||{};
                          merged[div]={headName:prev.headName||divData.headName||"",headEmail:prev.headEmail||divData.headEmail||"",teams:{}};
                          Object.entries(divData.teams).forEach(([team,teamData])=>{
                            const prevT=(prev.teams||{})[team]||{};
                            merged[div].teams[team]={leaderName:prevT.leaderName||teamData.leaderName||"",leaderEmail:prevT.leaderEmail||teamData.leaderEmail||"",members:teamData.members};
                          });
                        });
                        setAM({step:2,groups:merged});
                      }} style={{padding:"11px 28px",borderRadius:"10px",border:"none",cursor:(!am.yearMonth||monthApps.length===0)?"not-allowed":"pointer",background:(!am.yearMonth||monthApps.length===0)?C.border:`linear-gradient(135deg,${C.purple}dd,${C.purple})`,color:"#fff",fontSize:"13px",fontWeight:800,fontFamily:"inherit"}}>다음 단계 →</button>
                    </div>
                  </div>
                )}
                {am.step===2&&(
                  <div>
                    <div style={{fontSize:"12px",color:C.muted,marginBottom:"16px",padding:"10px 14px",background:`${C.blue}06`,borderRadius:"10px",border:`1px solid ${C.blue}22`}}>
                      💡 {fmtYML(am.yearMonth)} 응시자를 본부·팀별로 분류했습니다. 자동입력된 항목을 확인하고 없는 항목만 직접 입력해주세요.
                    </div>
                    {Object.entries(am.groups).map(([div,divData])=>(
                      <div key={div} style={{marginBottom:"20px",borderRadius:"14px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:shadow}}>
                        <div style={{padding:"14px 18px",background:`linear-gradient(135deg,${C.blue}0a,${C.purple}06)`,borderBottom:`1px solid ${C.border}`}}>
                          <div style={{fontWeight:800,fontSize:"14px",color:C.text,marginBottom:"10px"}}>🏢 {div}</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                            <div>
                              <label style={{display:"block",fontSize:"10px",fontWeight:700,color:C.purple,marginBottom:"4px"}}>본부장 이름 {divData.headName&&<span style={{fontWeight:600,color:C.green,fontSize:"9px"}}>✓ 자동입력됨</span>}</label>
                              <input value={divData.headName} onChange={e=>setAiMailModal(p=>{const g={...(p||am).groups};g[div]={...g[div],headName:e.target.value};return{...(p||am),groups:g};})} placeholder="홍길동" style={{...inp({padding:"7px 10px",fontSize:"12px"})}}/>
                            </div>
                            <div>
                              <label style={{display:"block",fontSize:"10px",fontWeight:700,color:C.purple,marginBottom:"4px"}}>본부장 이메일</label>
                              <input value={divData.headEmail} onChange={e=>setAiMailModal(p=>{const g={...(p||am).groups};g[div]={...g[div],headEmail:e.target.value};return{...(p||am),groups:g};})} placeholder="head@okestro.com" style={{...inp({padding:"7px 10px",fontSize:"12px"})}}/>
                            </div>
                          </div>
                        </div>
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
                                  <label style={{display:"block",fontSize:"10px",fontWeight:700,color:C.blue,marginBottom:"4px"}}>팀장 이름 {teamData.leaderName&&<span style={{fontWeight:600,color:C.green,fontSize:"9px"}}>✓ 자동</span>}</label>
                                  <input value={teamData.leaderName} onChange={e=>setAiMailModal(p=>{const g={...(p||am).groups};g[div].teams[team]={...g[div].teams[team],leaderName:e.target.value};return{...(p||am),groups:g};})} placeholder="김팀장" style={{...inp({padding:"7px 10px",fontSize:"12px"})}}/>
                                </div>
                                <div>
                                  <label style={{display:"block",fontSize:"10px",fontWeight:700,color:C.blue,marginBottom:"4px"}}>팀장 이메일 {teamData.leaderEmail&&<span style={{fontWeight:600,color:C.green,fontSize:"9px"}}>✓ 자동</span>}</label>
                                  <input value={teamData.leaderEmail} onChange={e=>setAiMailModal(p=>{const g={...(p||am).groups};g[div].teams[team]={...g[div].teams[team],leaderEmail:e.target.value};return{...(p||am),groups:g};})} placeholder="leader@okestro.com" style={{...inp({padding:"7px 10px",fontSize:"12px"})}}/>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px"}}>
                      <button onClick={()=>setAM({step:1})} style={{padding:"10px 20px",borderRadius:"10px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"13px",fontFamily:"inherit"}}>← 이전</button>
                      <button onClick={()=>{setAM({step:3,isGenerating:false});generateEmails();}} style={{padding:"11px 28px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${C.purple}dd,${C.purple})`,color:"#fff",fontSize:"13px",fontWeight:800,fontFamily:"inherit"}}>📝 메일 초안 생성</button>
                    </div>
                  </div>
                )}
                {am.step===3&&(
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:"15px",color:C.text}}>📬 {am.emails.length}개 팀 메일 초안이 생성됐습니다</div>
                        <div style={{fontSize:"11px",color:C.muted,marginTop:"3px"}}>{fmtYML(am.yearMonth)} · 제목/내용/이메일 주소를 각각 복사하세요</div>
                      </div>
                      <button onClick={()=>setAM({step:2})} style={{padding:"7px 16px",borderRadius:"9px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"12px",fontFamily:"inherit"}}>← 다시 편집</button>
                    </div>
                    {am.emails.map((mail,i)=>{
                      const cp=(text,label)=>{
                        try{
                          const el=document.createElement('textarea');
                          el.value=text;
                          el.style.cssText='position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
                          document.body.appendChild(el);
                          el.focus();
                          el.select();
                          const ok=document.execCommand('copy');
                          document.body.removeChild(el);
                          if(ok){alert(`${label} 복사됐습니다`);}
                          else{navigator.clipboard?.writeText(text).then(()=>alert(`${label} 복사됐습니다`)).catch(()=>alert('복사에 실패했습니다'));}
                        }catch(e){
                          navigator.clipboard?.writeText(text).then(()=>alert(`${label} 복사됐습니다`)).catch(()=>alert('복사에 실패했습니다'));
                        }
                      };
                      const passCount=mail.body.split("✅").length-1;
                      const failCount=mail.body.split("❌").length-1;
                      return(
                        <div key={i} style={{marginBottom:"20px",borderRadius:"16px",border:`1.5px solid ${C.blue}33`,overflow:"hidden",boxShadow:shadowLg}}>
                          {/* 카드 헤더 */}
                          <div style={{padding:"14px 20px",background:`linear-gradient(135deg,${C.blue}08,${C.purple}05)`,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
                            <div>
                              <div style={{fontWeight:800,fontSize:"14px",color:C.text,marginBottom:"4px"}}>🏢 {mail.division} &gt; 👥 {mail.team}</div>
                              <div style={{display:"flex",gap:"8px",fontSize:"11px"}}>
                                {passCount>0&&<span style={{color:C.green,fontWeight:700}}>✅ 합격 {passCount}명</span>}
                                {failCount>0&&<span style={{color:C.red,fontWeight:700}}>❌ 불합격 {failCount}명</span>}
                                <span style={{color:C.muted}}>총 {mail.leaderEmail?mail.leaderEmail:"팀장 이메일 미입력"}</span>
                              </div>
                            </div>
                          </div>

                          {/* 제목 */}
                          <div style={{padding:"12px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:"10px",background:C.surface}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:"10px",fontWeight:700,color:C.muted,marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.05em"}}>제목</div>
                              <div style={{fontSize:"13px",fontWeight:700,color:C.text}}>{mail.subject}</div>
                            </div>
                            <button onClick={()=>cp(mail.subject,"제목이")} style={{flexShrink:0,padding:"6px 12px",borderRadius:"7px",border:`1px solid ${C.blue}33`,cursor:"pointer",background:`${C.blue}08`,color:C.blue,fontSize:"11px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>📋 제목 복사</button>
                          </div>

                          {/* 이메일 주소 복사 */}
                          <div style={{padding:"10px 20px",borderBottom:`1px solid ${C.border}`,background:`${C.bg}88`,display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
                            <span style={{fontSize:"11px",color:C.muted,fontWeight:600}}>수신:</span>
                            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:"6px",background:C.surface,borderRadius:"8px",padding:"5px 10px",border:`1px solid ${C.border}`}}>
                                <span style={{fontSize:"11px",color:C.blue,fontWeight:600}}>팀장</span>
                                <span style={{fontSize:"11px",color:C.subtle}}>{mail.leaderName||"—"}</span>
                                {mail.leaderEmail&&<span style={{fontSize:"11px",color:C.muted}}>&lt;{mail.leaderEmail}&gt;</span>}
                                <button onClick={()=>cp(mail.leaderEmail||"","팀장 이메일이")} disabled={!mail.leaderEmail} style={{padding:"3px 8px",borderRadius:"5px",border:`1px solid ${C.border}`,cursor:mail.leaderEmail?"pointer":"not-allowed",background:mail.leaderEmail?`${C.blue}08`:"transparent",color:mail.leaderEmail?C.blue:C.muted,fontSize:"10px",fontWeight:700,fontFamily:"inherit"}}>📋 복사</button>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:"6px",background:C.surface,borderRadius:"8px",padding:"5px 10px",border:`1px solid ${C.border}`}}>
                                <span style={{fontSize:"11px",color:C.purple,fontWeight:600}}>본부장</span>
                                <span style={{fontSize:"11px",color:C.subtle}}>{mail.headName||"—"}</span>
                                {mail.headEmail&&<span style={{fontSize:"11px",color:C.muted}}>&lt;{mail.headEmail}&gt;</span>}
                                <button onClick={()=>cp(mail.headEmail||"","본부장 이메일이")} disabled={!mail.headEmail} style={{padding:"3px 8px",borderRadius:"5px",border:`1px solid ${C.border}`,cursor:mail.headEmail?"pointer":"not-allowed",background:mail.headEmail?`${C.purple}08`:"transparent",color:mail.headEmail?C.purple:C.muted,fontSize:"10px",fontWeight:700,fontFamily:"inherit"}}>📋 복사</button>
                              </div>
                            </div>
                          </div>

                          {/* 본문 */}
                          <div style={{padding:"16px 20px",background:C.surface,position:"relative"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                              <div style={{fontSize:"10px",fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em"}}>메일 내용</div>
                              <button onClick={()=>cp(mail.body,"내용이")} style={{padding:"5px 12px",borderRadius:"7px",border:`1px solid ${C.teal}44`,cursor:"pointer",background:`${C.teal}08`,color:C.teal,fontSize:"11px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>📋 내용 복사</button>
                            </div>
                            <pre style={{fontSize:"12px",lineHeight:1.9,color:C.text,whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0,fontFamily:"'Malgun Gothic','Segoe UI',sans-serif",background:`${C.bg}66`,borderRadius:"10px",padding:"14px 16px",border:`1px solid ${C.border}`}}>{mail.body}</pre>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 부서/팀 관리 페이지 */}
        {mainMenu==="dept"&&(
          <div>
            <div style={{display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap",alignItems:"center"}}>
              <div style={{flex:1,fontSize:"13px",color:C.muted}}>회사 › 본부 › 팀 구조를 등록하고 관리합니다.</div>
              <input ref={deptFileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>{if(e.target.files[0])importDeptExcel(e.target.files[0]);e.target.value='';}}/>
              <button onClick={downloadDeptTemplate} style={{padding:"7px 14px",borderRadius:"9px",border:`1.5px solid ${C.teal}44`,cursor:"pointer",background:`${C.teal}06`,color:C.teal,fontSize:"12px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>⬇️ 엑셀 양식</button>
              <button onClick={()=>deptFileRef.current?.click()} style={{padding:"7px 14px",borderRadius:"9px",border:`1.5px solid ${C.teal}55`,cursor:"pointer",background:`${C.teal}10`,color:C.teal,fontSize:"12px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>📊 엑셀 일괄등록</button>
              <button onClick={()=>setDeptModal({type:"company",mode:"add",data:{company:""}})} style={{padding:"7px 16px",borderRadius:"9px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${C.blue}dd,${C.blue})`,color:"#fff",fontSize:"12px",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>＋ 회사 추가</button>
            </div>
            {deptData.length===0&&(
              <div style={{textAlign:"center",padding:"80px 20px",background:C.surface,borderRadius:"16px",border:`1.5px dashed ${C.border}`,color:C.muted}}>
                <div style={{fontSize:"40px",marginBottom:"12px"}}>🏢</div>
                <div style={{fontWeight:700,color:C.subtle,fontSize:"14px",marginBottom:"6px"}}>등록된 부서/팀 구조가 없습니다</div>
                <div style={{fontSize:"12px"}}>엑셀 일괄등록 또는 + 회사 추가 버튼으로 시작하세요</div>
              </div>
            )}
            {deptData.map(comp=>(
              <div key={comp.id} style={{marginBottom:"20px",background:C.surface,borderRadius:"16px",border:`1.5px solid ${C.blue}33`,overflow:"hidden",boxShadow:shadowLg}}>
                <div style={{padding:"14px 20px",background:`linear-gradient(135deg,${C.blue}10,${C.blue}06)`,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:"12px"}}>
                  <span style={{fontSize:"16px"}}>🏛</span>
                  <span style={{fontWeight:900,fontSize:"15px",color:C.blue,flex:1}}>{comp.company}</span>
                  <span style={{fontSize:"11px",color:C.muted,marginRight:"8px"}}>{comp.divisions.length}개 본부 · {comp.divisions.reduce((a,d)=>a+d.teams.length,0)}개 팀</span>
                  <button onClick={()=>setDeptModal({type:"division",mode:"add",cid:comp.id,data:{name:"",headName:"",headEmail:""}})} style={{padding:"5px 12px",borderRadius:"7px",border:`1px solid ${C.blue}44`,cursor:"pointer",background:`${C.blue}10`,color:C.blue,fontSize:"11px",fontWeight:700,fontFamily:"inherit"}}>+ 본부</button>
                  <button onClick={()=>setDeptModal({type:"company",mode:"edit",cid:comp.id,data:{company:comp.company}})} style={{padding:"5px 10px",borderRadius:"7px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"11px",fontFamily:"inherit"}}>✏️</button>
                  <button onClick={()=>confirmDelete(`'${comp.company}' 회사를 삭제하시겠습니까?`,()=>delCompany(comp.id))} style={{padding:"5px 10px",borderRadius:"7px",border:"1px solid #fecaca",cursor:"pointer",background:"#fef2f2",color:C.red,fontSize:"11px",fontFamily:"inherit"}}>🗑</button>
                </div>
                {comp.divisions.length===0&&<div style={{padding:"24px",textAlign:"center",color:C.muted,fontSize:"12px"}}>본부를 추가하세요</div>}
                {comp.divisions.map((div,di)=>(
                  <div key={div.id} style={{borderBottom:di<comp.divisions.length-1?`1px solid ${C.border}`:"none"}}>
                    <div style={{padding:"12px 20px 12px 28px",background:`${C.purple}04`,display:"flex",alignItems:"center",gap:"10px",borderBottom:`1px solid ${C.border}44`}}>
                      <span style={{fontSize:"13px"}}>🏢</span>
                      <div style={{flex:1}}>
                        <span style={{fontWeight:800,fontSize:"13px",color:C.text}}>{div.name}</span>
                        {(div.headName||div.headEmail)&&(
                          <span style={{marginLeft:"10px",fontSize:"11px",color:C.purple}}>
                            {div.headName&&<span>본부장: {div.headName}</span>}
                            {div.headEmail&&<span style={{marginLeft:"6px",color:C.muted}}>({div.headEmail})</span>}
                          </span>
                        )}
                      </div>
                      <span style={{fontSize:"11px",color:C.muted,marginRight:"6px"}}>{div.teams.length}개 팀</span>
                      <button onClick={()=>setDeptModal({type:"team",mode:"add",cid:comp.id,did:div.id,data:{name:"",leaderName:"",leaderEmail:""}})} style={{padding:"4px 10px",borderRadius:"6px",border:`1px solid ${C.teal}44`,cursor:"pointer",background:`${C.teal}08`,color:C.teal,fontSize:"11px",fontWeight:700,fontFamily:"inherit"}}>+ 팀</button>
                      <button onClick={()=>setDeptModal({type:"division",mode:"edit",cid:comp.id,did:div.id,data:{name:div.name,headName:div.headName||"",headEmail:div.headEmail||""}})} style={{padding:"4px 8px",borderRadius:"6px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"11px",fontFamily:"inherit"}}>✏️</button>
                      <button onClick={()=>confirmDelete(`'${div.name}' 본부를 삭제하시겠습니까?`,()=>delDivision(comp.id,div.id))} style={{padding:"4px 8px",borderRadius:"6px",border:"1px solid #fecaca",cursor:"pointer",background:"#fef2f2",color:C.red,fontSize:"11px",fontFamily:"inherit"}}>🗑</button>
                    </div>
                    {div.teams.map((team,ti)=>(
                      <div key={team.id} style={{padding:"9px 20px 9px 52px",display:"flex",alignItems:"center",gap:"10px",background:ti%2===0?"transparent":`${C.bg}88`,borderTop:`1px solid ${C.border}22`}}>
                        <span style={{fontSize:"12px"}}>👥</span>
                        <div style={{flex:1}}>
                          <span style={{fontWeight:700,fontSize:"12px",color:C.subtle}}>{team.name}</span>
                          {(team.leaderName||team.leaderEmail)&&(
                            <span style={{marginLeft:"10px",fontSize:"11px",color:C.blue}}>
                              {team.leaderName&&<span>팀장: {team.leaderName}</span>}
                              {team.leaderEmail&&<span style={{marginLeft:"6px",color:C.muted}}>({team.leaderEmail})</span>}
                            </span>
                          )}
                        </div>
                        <button onClick={()=>setDeptModal({type:"team",mode:"edit",cid:comp.id,did:div.id,tid:team.id,data:{name:team.name,leaderName:team.leaderName||"",leaderEmail:team.leaderEmail||""}})} style={{padding:"3px 8px",borderRadius:"6px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"11px",fontFamily:"inherit"}}>✏️</button>
                        <button onClick={()=>confirmDelete(`'${team.name}' 팀을 삭제하시겠습니까?`,()=>delTeam(comp.id,div.id,team.id))} style={{padding:"3px 8px",borderRadius:"6px",border:"1px solid #fecaca",cursor:"pointer",background:"#fef2f2",color:C.red,fontSize:"11px",fontFamily:"inherit"}}>🗑</button>
                      </div>
                    ))}
                    {div.teams.length===0&&<div style={{padding:"8px 52px",fontSize:"11px",color:C.muted}}>팀을 추가하세요</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {applicantModal&&(()=>{
        // ── setAM: 점수→합불 자동, 최종상태 자동 ──
        const setAM=patch=>setApplicantModal(p=>{
          let d={...p.data,...patch};
          // 3: 점수 입력 시 합격/불합격 자동 세팅
          ["1","2","3"].forEach(n=>{
            if(`score${n}`in patch){
              const s=parseFloat(d[`score${n}`]);
              if(!isNaN(s)&&d[`score${n}`]!=="") d[`pass${n}`]=s>=60?"합격":"불합격";
            }
          });
          // 5: 최종 상태 자동 반영 (퇴사/해당없음은 수동 유지)
          if(!("finalStatus"in patch)){
            const wasManual=["퇴사","해당없음"].includes(p.data.finalStatus);
            if(!wasManual){
              if([d.pass1,d.pass2,d.pass3].some(v=>v==="합격")) d.finalStatus="합격";
              else if(d.pass3==="불합격") d.finalStatus="불합격";
              else if(d.pass1||d.pass2||d.pass3) d.finalStatus="진행중";
              else d.finalStatus=d.finalStatus||"진행중";
            }
          }
          return{...p,data:d};
        });

        // 드롭다운용 본부/팀 목록
        const divOptions=[...new Set(deptData.flatMap(c=>c.divisions.map(d=>d.name)))];
        const selDivObj=deptData.flatMap(c=>c.divisions).find(d=>d.name===applicantModal.data.division);
        const teamOptions=selDivObj?selDivObj.teams.map(t=>t.name):[];

        return(
          <div {...makeBackdropHandlers(()=>setApplicantModal(null))} style={backdropStyle}>
            <div style={{background:C.surface,borderRadius:"20px",width:"100%",maxWidth:"560px",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`,animation:"modalIn 0.2s ease"}}>
              <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.surface,zIndex:1}}>
                <div style={{fontWeight:900,fontSize:"16px",color:C.text}}>{applicantModal.mode==='add'?"👥 응시자 추가":"✏️ 응시자 수정"}</div>
                <button onClick={()=>setApplicantModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:"18px",padding:"2px 6px",borderRadius:"6px"}}>✕</button>
              </div>
              <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:"14px"}}>
                <div style={{fontSize:"11px",fontWeight:800,color:C.blue,letterSpacing:"0.05em",paddingBottom:"4px",borderBottom:`1px solid ${C.border}`}}>기본 정보</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  <div>
                    <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>입사년월일</label>
                    <input type="date" value={applicantModal.data.joinYearMonth} onChange={e=>setAM({joinYearMonth:e.target.value})} style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                    {applicantModal.data.joinYearMonth&&!/^\d{4}-\d{2}-\d{2}$/.test(applicantModal.data.joinYearMonth)&&(
                      <div style={{fontSize:"10px",color:C.amber,marginTop:"3px"}}>⚠️ 기존 형식: {applicantModal.data.joinYearMonth}</div>
                    )}
                  </div>
                  <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>이름 *</label><input value={applicantModal.data.name} onChange={e=>setAM({name:e.target.value})} placeholder="홍길동" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>구분 (회사)</label>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {COMPANY_OPTIONS.map(c=>{const sel=applicantModal.data.company===c;return(
                      <button key={c} onClick={()=>setAM({company:c})} style={{padding:"6px 14px",borderRadius:"20px",border:`1.5px solid ${sel?C.blue:C.border}`,background:sel?`${C.blue}10`:"transparent",color:sel?C.blue:C.muted,fontSize:"12px",fontWeight:sel?700:400,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>
                    );})}
                    <input value={!COMPANY_OPTIONS.includes(applicantModal.data.company)?applicantModal.data.company:""} onChange={e=>setAM({company:e.target.value})} placeholder="직접 입력..." style={{...inp(),flex:1,minWidth:"120px",padding:"6px 12px"}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                  </div>
                </div>

                {/* 2: 소속본부/팀 드롭다운 */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  <div>
                    <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>
                      소속본부 {divOptions.length>0&&<span style={{fontSize:"10px",color:C.teal,fontWeight:500}}>({divOptions.length}개 등록됨)</span>}
                    </label>
                    {divOptions.length>0?(
                      <>
                        <select value={divOptions.includes(applicantModal.data.division)?applicantModal.data.division:"__custom__"}
                          onChange={e=>{
                            if(e.target.value==="__custom__") return;
                            const dObj=deptData.flatMap(c=>c.divisions).find(d=>d.name===e.target.value);
                            setAM({division:e.target.value,team:"",
                              divisionHeadName:dObj?.headName||applicantModal.data.divisionHeadName,
                              divisionHeadEmail:dObj?.headEmail||applicantModal.data.divisionHeadEmail});
                          }}
                          style={{...inp(),appearance:"auto",marginBottom:"5px"}}>
                          <option value="">— 선택하세요 —</option>
                          {divOptions.map(d=><option key={d} value={d}>{d}</option>)}
                          <option value="__custom__">✏️ 직접 입력</option>
                        </select>
                        <input value={applicantModal.data.division} onChange={e=>setAM({division:e.target.value,team:""})} placeholder="또는 직접 입력" style={{...inp(),fontSize:"11px",padding:"6px 10px",color:C.muted}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                      </>
                    ):(
                      <input value={applicantModal.data.division} onChange={e=>setAM({division:e.target.value})} placeholder="예: 솔루션개발본부" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                    )}
                  </div>
                  <div>
                    <label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>
                      소속팀 {teamOptions.length>0&&<span style={{fontSize:"10px",color:C.teal,fontWeight:500}}>({teamOptions.length}개)</span>}
                    </label>
                    {teamOptions.length>0?(
                      <>
                        <select value={teamOptions.includes(applicantModal.data.team)?applicantModal.data.team:""}
                          onChange={e=>{
                            if(!e.target.value) return;
                            const tObj=selDivObj?.teams.find(t=>t.name===e.target.value);
                            setAM({team:e.target.value,
                              teamLeaderName:tObj?.leaderName||applicantModal.data.teamLeaderName,
                              teamLeaderEmail:tObj?.leaderEmail||applicantModal.data.teamLeaderEmail});
                          }}
                          style={{...inp(),appearance:"auto",marginBottom:"5px"}}>
                          <option value="">— 선택하세요 —</option>
                          {teamOptions.map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                        <input value={applicantModal.data.team} onChange={e=>setAM({team:e.target.value})} placeholder="또는 직접 입력" style={{...inp(),fontSize:"11px",padding:"6px 10px",color:C.muted}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                      </>
                    ):(
                      <input value={applicantModal.data.team} onChange={e=>setAM({team:e.target.value})} placeholder="예: IaaS개발실" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                    )}
                  </div>
                </div>

                <div style={{background:`${C.purple}06`,borderRadius:"10px",border:`1px solid ${C.purple}22`,padding:"12px 14px"}}>
                  <div style={{fontSize:"11px",fontWeight:800,color:C.purple,marginBottom:"10px"}}>🏢 본부장 정보</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                    <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"4px"}}>본부장 이름</label><input value={applicantModal.data.divisionHeadName||""} onChange={e=>setAM({divisionHeadName:e.target.value})} placeholder="홍본부장" style={{...inp(),padding:"8px 12px"}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                    <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"4px"}}>본부장 이메일</label><input value={applicantModal.data.divisionHeadEmail||""} onChange={e=>setAM({divisionHeadEmail:e.target.value})} placeholder="head@okestro.com" style={{...inp(),padding:"8px 12px"}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                  </div>
                </div>
                <div style={{background:`${C.blue}06`,borderRadius:"10px",border:`1px solid ${C.blue}22`,padding:"12px 14px"}}>
                  <div style={{fontSize:"11px",fontWeight:800,color:C.blue,marginBottom:"10px"}}>👥 팀장 정보</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                    <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"4px"}}>팀장 이름</label><input value={applicantModal.data.teamLeaderName||""} onChange={e=>setAM({teamLeaderName:e.target.value})} placeholder="김팀장" style={{...inp(),padding:"8px 12px"}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                    <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"4px"}}>팀장 이메일</label><input value={applicantModal.data.teamLeaderEmail||""} onChange={e=>setAM({teamLeaderEmail:e.target.value})} placeholder="leader@okestro.com" style={{...inp(),padding:"8px 12px"}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                  </div>
                </div>
                <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>이메일</label><input value={applicantModal.data.email} onChange={e=>setAM({email:e.target.value})} placeholder="hong@okestro.com" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>

                <div style={{fontSize:"11px",fontWeight:800,color:C.green,letterSpacing:"0.05em",paddingBottom:"4px",borderBottom:`1px solid ${C.border}`,marginTop:"4px"}}>테스트 결과 <span style={{fontSize:"10px",fontWeight:500,color:C.muted}}>(최대 3회 · 60점 이상 합격)</span></div>
                {[
                  {nth:"1차",scoreKey:"score1",passKey:"pass1",dateKey:"date1",prev:null},
                  {nth:"2차",scoreKey:"score2",passKey:"pass2",dateKey:"date2",prev:"pass1"},
                  {nth:"3차",scoreKey:"score3",passKey:"pass3",dateKey:"date3",prev:"pass2"},
                ].map(({nth,scoreKey,passKey,dateKey,prev})=>{
                  // 4: 이전 차시가 없거나 합격이면 비활성
                  const isLocked=prev&&(!applicantModal.data[prev]||applicantModal.data[prev]==="합격");
                  const lockReason=prev&&applicantModal.data[prev]==="합격"?"이전 차시 합격 — 추가 응시 불필요":"이전 회차 결과 입력 후 활성화";
                  const sc=PASS_STATUS_COLORS[applicantModal.data[passKey]]||PASS_STATUS_COLORS[""];
                  const sNum=parseFloat(applicantModal.data[scoreKey]);
                  const sColor=isNaN(sNum)?"":sNum>=60?C.green:C.red;
                  return(
                    <div key={nth} style={{borderRadius:"10px",border:`1.5px solid ${isLocked?C.border:applicantModal.data[passKey]?sc.border:C.border}`,padding:"12px 14px",background:isLocked?C.bg:applicantModal.data[passKey]?sc.bg+"44":"#fafbfd",opacity:isLocked?0.4:1,transition:"all 0.2s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                        <span style={{fontSize:"11px",fontWeight:800,color:isLocked?C.muted:C.subtle,background:isLocked?C.bg:`${C.blue}10`,padding:"2px 9px",borderRadius:"20px"}}>{nth}</span>
                        {isLocked&&<span style={{fontSize:"10px",color:C.muted,fontStyle:"italic"}}>{lockReason}</span>}
                        {!isLocked&&applicantModal.data[passKey]==="합격"&&<span style={{fontSize:"10px",color:C.green,fontWeight:700}}>✅ 합격</span>}
                        {!isLocked&&applicantModal.data[passKey]==="불합격"&&<span style={{fontSize:"10px",color:C.red,fontWeight:700}}>❌ 불합격</span>}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"}}>
                        <div>
                          <label style={{display:"block",fontSize:"10px",fontWeight:700,color:C.subtle,marginBottom:"4px"}}>응시일</label>
                          <input type="date" disabled={!!isLocked} value={applicantModal.data[dateKey]||""} onChange={e=>setAM({[dateKey]:e.target.value})} style={{...inp({padding:"7px 10px",fontSize:"12px"})}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                        </div>
                        <div>
                          <label style={{display:"block",fontSize:"10px",fontWeight:700,color:C.subtle,marginBottom:"4px"}}>점수 <span style={{color:C.muted,fontWeight:400}}>(60↑합격)</span></label>
                          <input type="number" min="0" max="100" disabled={!!isLocked} value={applicantModal.data[scoreKey]} onChange={e=>setAM({[scoreKey]:e.target.value})} placeholder="0~100" style={{...inp({padding:"7px 10px",fontSize:"13px",fontWeight:sColor?"800":"400",color:sColor||C.text})}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/>
                        </div>
                        <div>
                          <label style={{display:"block",fontSize:"10px",fontWeight:700,color:C.subtle,marginBottom:"4px"}}>결과 <span style={{color:C.teal,fontWeight:400,fontSize:"9px"}}>자동입력</span></label>
                          <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                            {PASS_STATUS_OPTIONS.map(s=>{const psc=PASS_STATUS_COLORS[s];const sel=applicantModal.data[passKey]===s;return(
                              <button key={s} disabled={!!isLocked} onClick={()=>setAM({[passKey]:s})} style={{padding:"4px 9px",borderRadius:"20px",border:`1.5px solid ${sel?psc.text:C.border}`,background:sel?psc.bg:"transparent",color:sel?psc.text:C.muted,fontSize:"10px",fontWeight:sel?700:400,cursor:isLocked?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.1s"}}>{s}</button>
                            );})}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 5: 최종 상태 - 자동반영 + 수동오버라이드 */}
                <div style={{background:`${C.purple}06`,borderRadius:"10px",border:`1px solid ${C.purple}22`,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                    <label style={{fontSize:"11px",fontWeight:800,color:C.purple}}>최종 상태</label>
                    <span style={{fontSize:"10px",color:C.muted,background:C.bg,padding:"2px 8px",borderRadius:"20px",border:`1px solid ${C.border}`}}>테스트 결과에 따라 자동 반영됩니다</span>
                  </div>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {FINAL_STATUS_OPTIONS.map(s=>{const fc=FINAL_STATUS_COLORS[s];const sel=applicantModal.data.finalStatus===s;return(
                      <button key={s} onClick={()=>setAM({finalStatus:s})} style={{padding:"7px 16px",borderRadius:"20px",border:`1.5px solid ${sel?fc.text:C.border}`,background:sel?fc.bg:"transparent",color:sel?fc.text:C.muted,fontSize:"12px",fontWeight:sel?700:400,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",boxShadow:sel?`0 0 0 2px ${fc.text}22`:"none"}}>{s}</button>
                    );})}
                  </div>
                  {["퇴사","해당없음"].includes(applicantModal.data.finalStatus)&&(
                    <div style={{fontSize:"10px",color:C.amber,marginTop:"6px"}}>⚠️ 수동으로 설정된 상태입니다. 테스트 결과가 변경되어도 자동 반영되지 않습니다.</div>
                  )}
                </div>

                <div style={{fontSize:"11px",fontWeight:800,color:C.purple,letterSpacing:"0.05em",paddingBottom:"4px",borderBottom:`1px solid ${C.border}`,marginTop:"4px"}}>공유 메모</div>
                <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>사유/비고</label><textarea value={applicantModal.data.reason} onChange={e=>setAM({reason:e.target.value})} placeholder="예: 경영전략본부로 재응시 의무 없음, 퇴사..." rows={2} style={{...inp(),resize:"vertical",lineHeight:1.7}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>아카데미 공유사항</label><textarea value={applicantModal.data.academyNote} onChange={e=>setAM({academyNote:e.target.value})} placeholder="아카데미 내부 공유 내용" rows={2} style={{...inp(),resize:"vertical",lineHeight:1.7}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                  <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>인사팀 공유사항</label><textarea value={applicantModal.data.hrNote} onChange={e=>setAM({hrNote:e.target.value})} placeholder="인사팀 전달 내용" rows={2} style={{...inp(),resize:"vertical",lineHeight:1.7}} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                </div>
              </div>
              <div style={{padding:"14px 24px 20px",display:"flex",gap:"8px"}}>
                <button onClick={()=>saveApplicant(applicantModal.data)} disabled={!applicantModal.data.name.trim()} style={{flex:1,padding:"11px",borderRadius:"10px",border:"none",cursor:applicantModal.data.name.trim()?"pointer":"not-allowed",background:applicantModal.data.name.trim()?`linear-gradient(135deg,${C.purple}dd,${C.purple})`:C.border,color:"#fff",fontSize:"13px",fontWeight:800,fontFamily:"inherit"}}>{applicantModal.mode==='add'?"추가하기":"저장하기"}</button>
                {applicantModal.mode==='edit'&&<button onClick={()=>deleteApplicant(applicantModal.data.id)} style={{padding:"11px 16px",borderRadius:"10px",border:"none",cursor:"pointer",background:"#fee2e2",color:C.red,fontSize:"13px",fontWeight:700,fontFamily:"inherit"}}>삭제</button>}
                <button onClick={()=>setApplicantModal(null)} style={{padding:"11px 20px",borderRadius:"10px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"13px",fontFamily:"inherit"}}>취소</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 부서/팀 편집 모달 */}
      {deptModal&&(()=>{
        const m=deptModal;
        const setD=patch=>setDeptModal(p=>({...p,data:{...p.data,...patch}}));
        const titles={company:{add:"🏛 회사 추가",edit:"🏛 회사 수정"},division:{add:"🏢 본부 추가",edit:"🏢 본부 수정"},team:{add:"👥 팀 추가",edit:"👥 팀 수정"}};
        return(
          <div style={backdropStyle} onClick={e=>{if(e.target===e.currentTarget)setDeptModal(null);}}>
            <div style={{background:C.surface,borderRadius:"18px",width:"100%",maxWidth:"460px",boxShadow:"0 20px 60px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`,animation:"modalIn 0.2s ease"}}>
              <div style={{padding:"18px 22px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontWeight:900,fontSize:"15px",color:C.text}}>{titles[m.type][m.mode]}</div>
                <button onClick={()=>setDeptModal(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:"18px",padding:"2px 6px"}}>✕</button>
              </div>
              <div style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:"12px"}}>
                {m.type==="company"&&(
                  <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>회사명 *</label><input autoFocus value={m.data.company} onChange={e=>setD({company:e.target.value})} placeholder="예: 오케스트로" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                )}
                {m.type==="division"&&(
                  <>
                    <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>본부명 *</label><input autoFocus value={m.data.name} onChange={e=>setD({name:e.target.value})} placeholder="예: 솔루션개발본부" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                      <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>본부장 이름</label><input value={m.data.headName} onChange={e=>setD({headName:e.target.value})} placeholder="홍본부장" style={inp()} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                      <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>본부장 이메일</label><input value={m.data.headEmail} onChange={e=>setD({headEmail:e.target.value})} placeholder="head@okestro.com" style={inp()} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                    </div>
                  </>
                )}
                {m.type==="team"&&(
                  <>
                    <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>팀명 *</label><input autoFocus value={m.data.name} onChange={e=>setD({name:e.target.value})} placeholder="예: IaaS개발실" style={inp()} onFocus={e=>e.target.style.borderColor=C.blueLight} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                      <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>팀장 이름</label><input value={m.data.leaderName} onChange={e=>setD({leaderName:e.target.value})} placeholder="김팀장" style={inp()} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                      <div><label style={{display:"block",fontSize:"11px",fontWeight:700,color:C.subtle,marginBottom:"5px"}}>팀장 이메일</label><input value={m.data.leaderEmail} onChange={e=>setD({leaderEmail:e.target.value})} placeholder="leader@okestro.com" style={inp()} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/></div>
                    </div>
                  </>
                )}
              </div>
              <div style={{padding:"12px 22px 18px",display:"flex",gap:"8px"}}>
                <button onClick={()=>saveDeptModal(m.data)} style={{flex:1,padding:"10px",borderRadius:"9px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${C.blue}dd,${C.blue})`,color:"#fff",fontSize:"13px",fontWeight:800,fontFamily:"inherit"}}>{m.mode==="add"?"추가하기":"저장하기"}</button>
                <button onClick={()=>setDeptModal(null)} style={{padding:"10px 18px",borderRadius:"9px",border:`1px solid ${C.border}`,cursor:"pointer",background:"transparent",color:C.muted,fontSize:"13px",fontFamily:"inherit"}}>취소</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 비밀번호 확인 모달 */}
      {deleteConfirm&&(()=>{
        const PasswordModal=()=>{
          const [pw,setPw]=useState("");
          const [err,setErr]=useState("");
          const handleSubmit=()=>{
            if(pw==="0828"){deleteConfirm.action();setDeleteConfirm(null);}
            else{setErr("비밀번호가 올바르지 않습니다.");setPw("");}
          };
          return(
            <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000,backdropFilter:"blur(4px)"}} onClick={e=>{if(e.target===e.currentTarget)setDeleteConfirm(null);}}>
              <div style={{background:"#fff",borderRadius:"16px",width:"100%",maxWidth:"360px",padding:"28px 28px 24px",boxShadow:"0 20px 60px rgba(0,0,0,0.25)",border:"1px solid #e2e8f0",animation:"modalIn 0.18s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
                  <div style={{width:"40px",height:"40px",borderRadius:"10px",background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>🗑</div>
                  <div><div style={{fontWeight:800,fontSize:"15px",color:"#0f172a"}}>삭제 확인</div><div style={{fontSize:"12px",color:"#94a3b8",marginTop:"2px"}}>{deleteConfirm.msg}</div></div>
                </div>
                <div style={{marginBottom:"16px"}}>
                  <label style={{display:"block",fontSize:"12px",fontWeight:700,color:"#334155",marginBottom:"6px"}}>비밀번호 입력</label>
                  <input autoFocus type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>{if(e.key==="Enter")handleSubmit();if(e.key==="Escape")setDeleteConfirm(null);}} placeholder="비밀번호를 입력하세요" style={{width:"100%",background:"#f8fafc",border:`1.5px solid ${err?"#dc2626":"#e2e8f0"}`,borderRadius:"9px",padding:"10px 14px",color:"#0f172a",fontSize:"14px",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}} onFocus={e=>e.target.style.borderColor=err?"#dc2626":"#3b82f6"} onBlur={e=>e.target.style.borderColor=err?"#dc2626":"#e2e8f0"}/>
                  {err&&<div style={{fontSize:"12px",color:"#dc2626",marginTop:"6px"}}>⚠️ {err}</div>}
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

      {tooltip&&(
        <div style={{position:"fixed",left:Math.min(tooltip.x,window.innerWidth-320),top:tooltip.y,zIndex:9999,maxWidth:"300px",background:"#0f172a",color:"#f8fafc",borderRadius:"10px",padding:"10px 14px",boxShadow:"0 8px 32px rgba(0,0,0,0.28)",pointerEvents:"none"}}>
          <div style={{fontSize:"10px",fontWeight:700,color:"#94a3b8",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{tooltip.label}</div>
          <div style={{fontSize:"12px",lineHeight:1.75,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{tooltip.content}</div>
        </div>
      )}
    </div>
  );
}
