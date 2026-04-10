"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FRANCHISE_JA } from "@/lib/types";
import type { Franchise, Difficulty } from "@/lib/types";

/* ── Palette ── */
const C = {
  bg: "#f5f3ee", text: "#1a1a1a", textMid: "#78716c", textLight: "#a8a29e",
  accent: "#b45309", accentLight: "#fef3c7", green: "#15803d", greenBg: "#f0fdf4",
  red: "#b91c1c", redBg: "#fef2f2", border: "#e8e3d9",
};

/* (HOME card layout: CSS grid — design.md §3) */

/* ── Subpage BG card positions (6 cards, position:fixed) ── */
const BG_POS = [
  {top:"2vh",left:"1vw",w:"18vw",rot:-4,spd:0.15},
  {top:"-5vh",left:"36vw",w:"20vw",rot:3,spd:0.28},
  {top:"5vh",left:"74vw",w:"17vw",rot:-2,spd:0.10},
  {top:"50vh",left:"2vw",w:"19vw",rot:2,spd:0.30},
  {top:"45vh",left:"40vw",w:"16vw",rot:-3,spd:0.12},
  {top:"52vh",left:"75vw",w:"18vw",rot:4,spd:0.22},
];

/* ── Subpage config ── */
const PG_CONF: Record<string,{title:string;sub:string;opacity:number;overlay:string}> = {
  quiz:{title:"Quiz",sub:"通常テスト — 自主学習",opacity:0.3,overlay:"rgba(234,179,8,0.18)"},
  test:{title:"Test",sub:"共通テスト — 公開中のテスト",opacity:0.12,overlay:"rgba(41,37,36,0.35)"},
  review:{title:"Review",sub:"成績履歴 — 分析",opacity:0.25,overlay:"rgba(8,145,178,0.22)"},
  mypage:{title:"My Page",sub:"プロフィール — お知らせ",opacity:0.2,overlay:"rgba(124,58,237,0.25)"},
};

/* ── Shared UI ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:"min(1.1vw,10px)",fontWeight:600,color:C.textLight,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"min(1.5vh,10px)",fontFamily:"'IBM Plex Mono',monospace" }}>{children}</div>;
}

/* ── Types ── */
interface User { id:string;name:string;role:string;avatar_url?:string|null }
interface CommonTest { id:string;title:string;franchise:Franchise|null;common_test_question:{count:number}[] }
interface Ann { id:string;title:string;body:string|null;is_pinned:boolean;starts_at:string }
interface Session { id:string;difficulty:Difficulty;franchise:Franchise;total_questions:number;score:number;finished_at:string;common_test_id:string|null }
interface CardStat { quiz_card_id:string;card_name:string;franchise:string;price:number;image_url:string|null;total:number;correct:number;accuracy:number }

/* ════════════════════════════════════════════════════════════════ */
export default function ProvaApp() {
  const router = useRouter();
  const validPages = ["home","quiz","test","review","mypage"];
  const getPageFromHash = () => {
    if (typeof window === "undefined") return "home";
    const h = window.location.hash.replace("#","");
    return validPages.includes(h) ? h : "home";
  };
  const [page, setPageState] = useState(getPageFromHash);
  const setPage = useCallback((p: string) => {
    setPageState(p);
    window.location.hash = p === "home" ? "" : p;
  }, []);
  const [scrollY, setScrollY] = useState(0);
  const [hoveredTab, setHoveredTab] = useState<string|null>(null);
  const [subBgSeed, setSubBgSeed] = useState(0);
  const [avatarHover, setAvatarHover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isHomeRef = useRef(true);

  // Data
  const [user, setUser] = useState<User|null>(null);
  const [commonTests, setCommonTests] = useState<CommonTest[]>([]);
  const [announcements, setAnnouncements] = useState<Ann[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cardStats, setCardStats] = useState<CardStat[]>([]);
  const [hardUnlocked, setHardUnlocked] = useState(false);
  const [cardImages, setCardImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Review state
  const [reviewTab, setReviewTab] = useState<"history"|"cards">("history");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Quiz state
  const [mode, setMode] = useState("10");
  const [mat, setMat] = useState<Franchise|"all">("Pokemon");
  const [diff, setDiff] = useState<Difficulty>("easy");
  const [selectedTest, setSelectedTest] = useState<string|null>(null);

  const isHome = page === "home";
  isHomeRef.current = isHome;
  const pgConf = PG_CONF[page];

  useEffect(() => {
    const u = sessionStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    setUser(JSON.parse(u));
  }, [router]);

  useEffect(() => {
    const onHash = () => setPageState(getPageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/exam/common-tests").then(r=>r.json()).then(d=>setCommonTests(Array.isArray(d)?d:[]));
    fetch("/api/announcements").then(r=>r.json()).then(d=>setAnnouncements(Array.isArray(d)?d.slice(0,5):[]));
    fetch("/api/admin/cards?limit=200").then(r=>r.json()).then((cards:{card_name:string;image_url:string|null}[])=>{
      const valid = cards
        .filter((c) => c.image_url && !c.card_name.includes("BOX") && !c.card_name.includes("box") && !c.card_name.includes("Box"))
        .sort(() => Math.random() - 0.5)
        .map((c) => c.image_url!);
      setCardImages(valid);
    });
    fetch(`/api/exam/history?user_id=${user.id}`).then(r=>r.json()).then(data=>{
      setSessions(data.sessions??[]);
      setCardStats(data.card_stats??[]);
      const normalTotal = (data.sessions??[]).filter((s:{difficulty:string})=>s.difficulty==="normal").reduce((sum:number,s:{total_questions:number})=>sum+s.total_questions,0);
      setHardUnlocked(normalTotal>=20);
    });
  }, [user]);

  // Scroll handler with infinite loop warp (spec §3)
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    // HOME infinite loop: warp when scrollTop > 200vh
    if (isHomeRef.current) {
      const vh = window.innerHeight;
      if (el.scrollTop > vh * 2) {
        el.scrollTop -= vh * 1.4;
      }
    }
    setScrollY(el.scrollTop);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) { el.addEventListener("scroll", handleScroll, { passive: true }); return () => el.removeEventListener("scroll", handleScroll); }
  }, [handleScroll]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
    setScrollY(0);
    if (!isHome) setSubBgSeed(prev => prev + 1);
  }, [page, isHome]);

  // (Step 3で IntersectionObserver + React state によるリビールを追加予定)

  // Actions
  async function handleQuizStart() {
    if (!user) return;
    setError("");setLoading(true);
    try {
      const res = await fetch("/api/exam/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:user.id,franchise:mat,difficulty:diff,mode:mode==="endless"?"endless":"normal"})});
      const data = await res.json();
      if (!res.ok){setError(data.error);return;}
      sessionStorage.setItem("exam",JSON.stringify(data));
      sessionStorage.setItem("exam_difficulty",diff);
      router.push("/exam/play");
    } catch{setError("通信エラー");}finally{setLoading(false);}
  }

  async function handleTestStart() {
    if (!user||!selectedTest) return;
    setError("");setLoading(true);
    try {
      const res = await fetch("/api/exam/common/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:user.id,common_test_id:selectedTest})});
      const data = await res.json();
      if (!res.ok){setError(data.error);return;}
      sessionStorage.setItem("exam",JSON.stringify(data));
      sessionStorage.setItem("exam_difficulty","common");
      router.push("/exam/play");
    } catch{setError("通信エラー");}finally{setLoading(false);}
  }

  async function handleAvatarUpload(file: File) {
    if (!user) return;
    const fd = new FormData();
    fd.append("user_id", user.id);
    fd.append("image", file);
    try {
      const res = await fetch("/api/auth/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.avatar_url) {
        const updated = { ...user, avatar_url: data.avatar_url };
        setUser(updated);
        sessionStorage.setItem("user", JSON.stringify(updated));
      }
    } catch { /* ignore */ }
  }

  async function handleReviewStart() {
    if (!user) return;
    setReviewLoading(true);
    try {
      const res = await fetch("/api/exam/review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:user.id,difficulty:"easy"})});
      const data = await res.json();
      if (!res.ok){setError(data.error);setReviewLoading(false);return;}
      sessionStorage.setItem("exam",JSON.stringify(data));
      sessionStorage.setItem("exam_difficulty","easy");
      router.push("/exam/play");
    } catch{setError("通信エラー");}finally{setReviewLoading(false);}
  }

  function handleLogout() { sessionStorage.clear(); router.push("/"); }

  // 商材選択
  const MATERIALS: {id:string;label:string;logo?:string;icon?:string;desc?:string}[] = [
    {id:"all",label:"全商材",icon:"🃏",desc:"ランダム"},
    {id:"Pokemon",label:"ポケモン",logo:"/logos/pokemon.png"},
    {id:"ONE PIECE",label:"ワンピース",logo:"/logos/onepiece.png"},
    {id:"YU-GI-OH!",label:"遊戯王",logo:"/logos/yugioh.png"},
  ];
  const DIFFS = [
    {id:"easy",label:"かんたん",icon:"🌱",desc:"4択",color:C.green,bg:C.greenBg},
    {id:"normal",label:"ノーマル",icon:"🔥",desc:"許容範囲あり",color:C.accent,bg:C.accentLight},
    ...(hardUnlocked?[{id:"hard",label:"むずかしい",icon:"💀",desc:"範囲が狭い",color:C.red,bg:C.redBg}]:[]),
  ];

  const thS:React.CSSProperties = {padding:"min(1vh,8px) min(1.2vw,12px)",textAlign:"left",fontSize:"min(1vw,9px)",fontWeight:600,color:C.textLight,letterSpacing:"0.08em",textTransform:"uppercase",borderBottom:`1px solid ${C.border}`};
  const tdS:React.CSSProperties = {padding:"min(1.1vh,9px) min(1.2vw,12px)",fontSize:"min(1.2vw,12px)",borderBottom:`1px solid ${C.border}22`};

  // HOME: card image list (Set A + Set B with different images)
  const homeCardImages = [
    ...cardImages.slice(0, 12),
    ...cardImages.slice(12, 24),
  ];

  return (
    <>
      <style>{`
        @keyframes holoShine{0%{background-position:-100% -100%}50%{background-position:200% 200%}100%{background-position:-100% -100%}}
        @keyframes badgePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        .no-sb::-webkit-scrollbar{width:0}
      `}</style>

      {/* ── Scroll container ── */}
      <div ref={containerRef} className="no-sb" style={{width:"100vw",height:"100vh",overflow:"auto",background:C.bg,position:"relative",fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",color:C.text}}>

        {/* HOME: scroll area with card grid (design.md §3) */}
        {isHome && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:"24px",padding:"24px",width:"100%",zIndex:2,position:"relative"}}>
            {homeCardImages.map((imgUrl, i) => (
              <div key={i} style={{
                aspectRatio:"63 / 88",
                overflow:"hidden",
                background: imgUrl ? `url(${imgUrl}) center/cover no-repeat` : "transparent",
              }} />
            ))}
          </div>
        )}

        {/* Subpage: spacer for scroll */}
        {!isHome && pgConf && <div style={{height:"280vh"}} />}
      </div>

      {/* ── HOME: PROVA title (fixed, behind cards — spec §4) ── */}
      {isHome && (
        <div style={{
          position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          zIndex:1,pointerEvents:"none",userSelect:"none",
          fontFamily:"'Times New Roman',Times,serif",fontWeight:"normal",
          fontSize:"min(28vw,500px)",letterSpacing:"0.04em",textTransform:"uppercase",
          color:C.text,lineHeight:0.85,whiteSpace:"nowrap",
        }}>Prova</div>
      )}

      {/* ── Subpage: fixed BG layer ── */}
      {!isHome && pgConf && (
        <div style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
          {BG_POS.map((bp,i) => {
            const imgIdx = cardImages.length > 0 ? (i + subBgSeed * 7) % cardImages.length : -1;
            const img = imgIdx >= 0 ? cardImages[imgIdx] : null;
            return (
              <div key={`${page}-${subBgSeed}-${i}`} style={{
                position:"absolute",top:bp.top,left:bp.left,width:bp.w,aspectRatio:"63/88",
                transform:`rotate(${bp.rot}deg) translateY(${-scrollY*bp.spd}px)`,
                opacity:pgConf.opacity,overflow:"hidden",
              }}>
                <div style={{
                  width:"100%",height:"100%",
                  background: img ? `url(${img}) center/cover no-repeat` : pgConf.overlay,
                }} />
                {img && <div style={{position:"absolute",inset:0,background:pgConf.overlay,pointerEvents:"none"}} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Subpage: fixed content layer ── */}
      {!isHome && pgConf && (
        <div style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"min(4vh,28px) min(3vw,24px)",pointerEvents:"none"}}>
          <div style={{pointerEvents:"auto",display:"flex",flexDirection:"column",alignItems:"center",width:"100%"}}>
            <div style={{textAlign:"center",marginBottom:"min(2.5vh,20px)"}}>
              <div style={{fontSize:"min(12vw,140px)",fontWeight:"normal",fontFamily:"'Times New Roman',Times,serif",color:C.text,letterSpacing:"0.03em",lineHeight:0.85,textTransform:"uppercase"}}>{pgConf.title}</div>
              <div style={{fontSize:"min(1.1vw,10px)",fontWeight:500,letterSpacing:"0.3em",color:C.textLight,marginTop:"min(1.5vh,12px)",fontFamily:"'IBM Plex Mono',monospace"}}>{pgConf.sub}</div>
            </div>

            {/* QUIZ */}
            {page==="quiz" && (
              <div style={{maxWidth:"min(52vw,560px)",margin:"0 auto",width:"100%"}}>
                <div style={{marginBottom:"min(2.5vh,20px)"}}>
                  <SectionLabel>モード</SectionLabel>
                  <div style={{display:"flex"}}>
                    {[{id:"10",l:"⚡ 10問テスト"},{id:"endless",l:"♾️ エンドレス"}].map((m,i) => (
                      <button key={m.id} onClick={()=>setMode(m.id)} style={{padding:"min(1.5vh,12px) 0",flex:1,border:`1.5px solid ${mode===m.id?C.text:C.border}`,borderRight:i===0?"none":undefined,background:mode===m.id?C.text:"transparent",color:mode===m.id?"#fff":C.text,fontSize:"min(1.5vw,13px)",fontWeight:mode===m.id?700:450,fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",cursor:"pointer",transition:"all 0.15s",textAlign:"center"}}>{m.l}</button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:"min(2.5vh,20px)"}}>
                  <SectionLabel>商材を選択</SectionLabel>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"min(1.2vw,10px)"}}>
                    {MATERIALS.map(item => {
                      const active = mat === item.id;
                      return (
                        <button key={item.id} onClick={() => setMat(item.id as Franchise|"all")} style={{
                          padding:"min(1.8vh,14px) min(0.8vw,6px)", border:`1.5px solid ${active ? C.text : C.border}`,
                          background:active?`${C.text}08`:"transparent", color:active?C.text:C.textMid,
                          display:"flex",flexDirection:"column",alignItems:"center",gap:"min(0.6vh,4px)",
                          cursor:"pointer",fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",transition:"all 0.15s",
                        }}>
                          {item.logo
                            ? <img src={item.logo} alt={item.label} style={{height:"min(5vw,44px)",width:"auto",maxWidth:"100%",objectFit:"contain",filter:active?"none":"grayscale(40%)",transition:"filter 0.15s"}} />
                            : <span style={{fontSize:"min(2.5vw,22px)",filter:active?"none":"grayscale(40%)"}}>{item.icon}</span>
                          }
                          <span style={{fontSize:"min(1.2vw,11px)",fontWeight:active?700:450}}>{item.label}</span>
                          {item.desc && <span style={{fontSize:"min(1vw,9px)",color:C.textLight}}>{item.desc}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{marginBottom:"min(3vh,24px)"}}>
                  <SectionLabel>難易度</SectionLabel>
                  <div style={{display:"grid",gridTemplateColumns:`repeat(${DIFFS.length},1fr)`,gap:"min(1.2vw,10px)"}}>
                    {DIFFS.map(item => {
                      const active = diff === item.id;
                      const sc = item.color || C.text;
                      return (
                        <button key={item.id} onClick={() => setDiff(item.id as Difficulty)} style={{
                          padding:"min(2vh,16px) min(1vw,8px)", border:`1.5px solid ${active ? sc : C.border}`,
                          background:active?(item.bg||`${sc}08`):"transparent", color:active?sc:C.textMid,
                          display:"flex",flexDirection:"column",alignItems:"center",gap:"min(0.6vh,4px)",
                          cursor:"pointer",fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",transition:"all 0.15s",
                        }}>
                          <span style={{fontSize:"min(2.5vw,22px)",filter:active?"none":"grayscale(40%)"}}>{item.icon}</span>
                          <span style={{fontSize:"min(1.3vw,12px)",fontWeight:active?700:450}}>{item.label}</span>
                          {item.desc && <span style={{fontSize:"min(1vw,9px)",color:C.textLight}}>{item.desc}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {error && <p style={{textAlign:"center",fontSize:12,color:C.red,marginBottom:12}}>{error}</p>}
                <button onClick={handleQuizStart} disabled={loading} style={{width:"100%",maxWidth:"min(40vw,380px)",padding:"min(1.8vh,14px) 0",border:"none",background:C.text,color:"#fff",fontSize:"min(1.6vw,14px)",fontWeight:700,fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",letterSpacing:"0.04em",cursor:"pointer",transition:"all 0.2s",margin:"0 auto",display:"block",opacity:loading?0.5:1}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px ${C.text}30`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="none";}}
                >{loading?"準備中...": `${mode==="endless"?"エンドレス":"10問テスト"} スタート →`}</button>
                <div style={{textAlign:"center",marginTop:"min(1vh,8px)",fontSize:"min(1.1vw,10px)",color:C.textLight}}>{MATERIALS.find(m=>m.id===mat)?.label} · {DIFFS.find(d=>d.id===diff)?.label}</div>
              </div>
            )}

            {/* TEST */}
            {page==="test" && (
              <div style={{maxWidth:"min(52vw,560px)",margin:"0 auto",width:"100%"}}>
                <SectionLabel>公開中の共通テスト</SectionLabel>
                <div style={{display:"flex",flexDirection:"column",gap:"min(1.2vh,10px)",marginBottom:"min(3vh,24px)"}}>
                  {commonTests.length===0 && <p style={{textAlign:"center",color:C.textLight,padding:24}}>公開中の共通テストはありません</p>}
                  {commonTests.map(test => {
                    const active = selectedTest===test.id;
                    return (
                      <button key={test.id} onClick={()=>setSelectedTest(test.id)} style={{display:"flex",alignItems:"center",gap:"min(1.5vw,14px)",padding:"min(2vh,16px) min(2vw,18px)",border:`1.5px solid ${active?C.text:C.border}`,background:active?`${C.text}06`:"transparent",cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",transition:"all 0.15s"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:"min(1.3vw,12px)",fontWeight:600,color:C.text}}>{test.title}</div>
                          <div style={{fontSize:"min(1vw,10px)",color:C.textLight,marginTop:3}}>{test.common_test_question?.[0]?.count??0}問 · {test.franchise?FRANCHISE_JA[test.franchise]:"全商材"}</div>
                        </div>
                        {active && <span style={{fontSize:"min(1.5vw,14px)",color:C.text}}>→</span>}
                      </button>
                    );
                  })}
                </div>
                {error && <p style={{textAlign:"center",fontSize:12,color:C.red,marginBottom:12}}>{error}</p>}
                <button onClick={handleTestStart} disabled={loading||!selectedTest} style={{width:"100%",maxWidth:"min(40vw,380px)",padding:"min(1.8vh,14px) 0",border:"none",background:selectedTest?C.text:C.border,color:"#fff",fontSize:"min(1.6vw,14px)",fontWeight:700,fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",cursor:selectedTest?"pointer":"not-allowed",transition:"all 0.2s",margin:"0 auto",display:"block",opacity:loading?0.5:1}}>テスト開始 →</button>
                {!selectedTest && <div style={{textAlign:"center",marginTop:"min(1.2vh,8px)",fontSize:"min(1vw,10px)",color:C.textLight}}>テストを選択してください</div>}
              </div>
            )}

            {/* REVIEW */}
            {page==="review" && (
              <div style={{maxWidth:"min(62vw,680px)",margin:"0 auto",width:"100%",maxHeight:"calc(100vh - min(30vh,200px))",overflowY:"auto"}} className="no-sb">
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"min(1vw,10px)",marginBottom:"min(2vh,16px)"}}>
                  {[
                    {label:"正答率",value:sessions.length>0?`${Math.round(sessions.reduce((s,ss)=>s+(ss.total_questions?(ss.score/ss.total_questions)*100:0),0)/sessions.length)}%`:"—",icon:"🎯"},
                    {label:"回答数",value:String(sessions.reduce((s,ss)=>s+ss.total_questions,0)),icon:"✏️"},
                    {label:"受験回数",value:String(sessions.length),icon:"📋"},
                    {label:"間違い",value:String(cardStats.filter(c=>c.accuracy<100).length),icon:"❌"},
                  ].map((s,i) => (
                    <div key={i} style={{padding:"min(1.5vh,12px)",textAlign:"center",border:`1.5px solid ${C.border}`,background:"rgba(255,255,255,0.45)"}}>
                      <div style={{fontSize:"min(2vw,18px)"}}>{s.icon}</div>
                      <div style={{fontSize:"min(2.4vw,22px)",fontWeight:700,fontFamily:"'IBM Plex Mono',monospace"}}>{s.value}</div>
                      <div style={{fontSize:"min(0.9vw,9px)",color:C.textLight,marginTop:2}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {cardStats.filter(c=>c.accuracy<100).length>0 && (
                  <button onClick={handleReviewStart} disabled={reviewLoading} style={{width:"100%",maxWidth:"min(40vw,380px)",padding:"min(1.5vh,12px) 0",border:"none",background:C.accent,color:"#fff",fontSize:"min(1.4vw,13px)",fontWeight:700,fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",letterSpacing:"0.04em",cursor:"pointer",transition:"all 0.2s",margin:"0 auto min(2vh,16px)",display:"block",opacity:reviewLoading?0.5:1}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px ${C.accent}30`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="none";}}
                  >{reviewLoading?"準備中...":"🔄 間違えた問題で復習する →"}</button>
                )}
                {error && <p style={{textAlign:"center",fontSize:12,color:C.red,marginBottom:12}}>{error}</p>}
                <div style={{display:"flex",marginBottom:"min(2vh,16px)"}}>
                  {([{id:"history" as const,l:"受験履歴"},{id:"cards" as const,l:"間違えやすいカード"}]).map((tab,i) => (
                    <button key={tab.id} onClick={()=>setReviewTab(tab.id)} style={{flex:1,padding:"min(1.3vh,10px) 0",border:`1.5px solid ${reviewTab===tab.id?C.text:C.border}`,borderRight:i===0?"none":undefined,background:reviewTab===tab.id?C.text:"transparent",color:reviewTab===tab.id?"#fff":C.text,fontSize:"min(1.3vw,12px)",fontWeight:reviewTab===tab.id?700:450,fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",cursor:"pointer",transition:"all 0.15s",textAlign:"center"}}>{tab.l}</button>
                  ))}
                </div>
                {reviewTab==="history" && (
                  <div style={{border:`1.5px solid ${C.border}`,background:"rgba(255,255,255,0.35)"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr>{["種別","商材","難易度","スコア","正答率","日付"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                      <tbody>
                        {sessions.length===0 && <tr><td colSpan={6} style={{...tdS,textAlign:"center",color:C.textLight}}>まだ受験データがありません</td></tr>}
                        {sessions.slice(0,20).map((r,i) => {
                          const acc = r.total_questions?Math.round((r.score/r.total_questions)*100):0;
                          return (
                            <tr key={i} style={{transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(180,83,9,0.03)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <td style={tdS}><span style={{padding:"1px 6px",background:r.common_test_id?C.redBg:"#f5f3ee",color:r.common_test_id?C.red:C.textMid,fontSize:"min(1vw,10px)",fontWeight:600}}>{r.common_test_id?"共通":"通常"}</span></td>
                              <td style={tdS}>{FRANCHISE_JA[r.franchise]??r.franchise}</td>
                              <td style={{...tdS,color:C.textMid,fontSize:"min(1.1vw,11px)"}}>{r.difficulty==="easy"?"かんたん":r.difficulty==="normal"?"ノーマル":"むずかしい"}</td>
                              <td style={{...tdS,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600}}>{r.score}/{r.total_questions}</td>
                              <td style={{...tdS,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600}}>{acc}%</td>
                              <td style={{...tdS,color:C.textLight,fontFamily:"'IBM Plex Mono',monospace"}}>{new Date(r.finished_at).toLocaleDateString("ja-JP",{month:"2-digit",day:"2-digit"})}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {reviewTab==="cards" && (
                  <div style={{display:"flex",flexDirection:"column",gap:"min(1vh,8px)"}}>
                    {cardStats.filter(c=>c.accuracy<100).length===0 && <p style={{padding:24,textAlign:"center",color:C.textLight,border:`1.5px solid ${C.border}`}}>間違えたカードはありません</p>}
                    {cardStats.filter(c=>c.accuracy<100).map(card => (
                      <a key={card.quiz_card_id} href={`/cards/${card.quiz_card_id}`} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:"min(1.2vw,12px)",padding:"min(1.3vh,10px) min(1.5vw,14px)",border:`1.5px solid ${C.border}`,background:"rgba(255,255,255,0.35)",textDecoration:"none",color:C.text,transition:"background 0.1s",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(180,83,9,0.03)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.35)"}
                      >
                        <div style={{width:"min(4vw,40px)",height:"min(5.6vw,56px)",background:card.image_url?`${C.bg} url(${card.image_url}) center/contain no-repeat`:C.border,flexShrink:0}} />
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:"min(1.2vw,12px)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{card.card_name}</div>
                          <div style={{fontSize:"min(1vw,10px)",color:C.textLight,fontFamily:"'IBM Plex Mono',monospace",marginTop:2}}>{FRANCHISE_JA[card.franchise as keyof typeof FRANCHISE_JA]??card.franchise} · ¥{card.price.toLocaleString()}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:"min(1.8vw,16px)",fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",color:card.accuracy<50?C.red:card.accuracy<80?C.accent:C.green}}>{card.accuracy}%</div>
                          <div style={{fontSize:"min(0.9vw,9px)",color:C.textLight,fontFamily:"'IBM Plex Mono',monospace"}}>{card.correct}/{card.total}</div>
                        </div>
                        <span style={{fontSize:"min(1.2vw,12px)",color:C.textLight}}>→</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MY PAGE */}
            {page==="mypage" && user && (
              <div style={{maxWidth:"min(52vw,560px)",margin:"0 auto",width:"100%",maxHeight:"calc(100vh - min(30vh,200px))",overflowY:"auto"}} className="no-sb">
                <input ref={avatarInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleAvatarUpload(f);e.target.value="";}} />
                <div style={{display:"flex",alignItems:"center",gap:"min(1.5vw,14px)",padding:"min(2vh,16px) min(2vw,18px)",marginBottom:"min(3vh,24px)",border:`1.5px solid ${C.border}`,background:"rgba(255,255,255,0.45)"}}>
                  <div style={{width:"min(5vw,44px)",height:"min(5vw,44px)",background:C.text,color:"#f59e0b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"min(2vw,16px)",fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",overflow:"hidden",position:"relative",cursor:"pointer"}}
                    onMouseEnter={()=>setAvatarHover(true)} onMouseLeave={()=>setAvatarHover(false)}
                    onClick={()=>avatarInputRef.current?.click()}
                  >
                    {user.avatar_url?<img src={user.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:user.name[0]}
                    {avatarHover && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"min(0.9vw,8px)",fontFamily:"'IBM Plex Mono',monospace",fontWeight:600}}>変更</div>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"min(1.5vw,14px)",fontWeight:700}}>{user.name}</div>
                    <div style={{fontSize:"min(1vw,10px)",color:C.textLight,fontFamily:"'IBM Plex Mono',monospace"}}>{user.role}</div>
                  </div>
                </div>
                <SectionLabel>お知らせ</SectionLabel>
                <div style={{marginBottom:"min(3vh,24px)"}}>
                  {announcements.length===0 && <p style={{padding:16,textAlign:"center",color:C.textLight,border:`1.5px solid ${C.border}`}}>お知らせはありません</p>}
                  {announcements.map((n,i) => (
                    <div key={n.id} style={{padding:"min(1.3vh,10px) min(1.5vw,14px)",border:`1.5px solid ${n.is_pinned?C.accent:C.border}`,borderTop:i>0?"none":undefined,background:n.is_pinned?C.accentLight:"rgba(255,255,255,0.35)",transition:"background 0.1s"}}
                      onMouseEnter={e=>{if(!n.is_pinned)e.currentTarget.style.background="rgba(180,83,9,0.03)";}}
                      onMouseLeave={e=>{if(!n.is_pinned)e.currentTarget.style.background="rgba(255,255,255,0.35)";}}
                    >
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          {n.is_pinned && <span style={{fontSize:"min(0.9vw,8px)",fontWeight:700,color:C.red,background:C.redBg,padding:"1px 5px"}}>固定</span>}
                          <span style={{fontSize:"min(1.3vw,12px)",fontWeight:600}}>{n.title}</span>
                        </div>
                        <span style={{fontSize:"min(1vw,10px)",color:C.textLight,fontFamily:"'IBM Plex Mono',monospace"}}>{new Date(n.starts_at).toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"})}</span>
                      </div>
                      {n.body && <div style={{fontSize:"min(1.1vw,11px)",color:C.textMid,marginTop:4}}>{n.body}</div>}
                    </div>
                  ))}
                </div>
                <SectionLabel>設定</SectionLabel>
                <div style={{display:"flex"}}>
                  {["パスワード変更","成績履歴","ログアウト"].map((t,i) => (
                    <button key={i} onClick={()=>{if(t==="パスワード変更")router.push("/exam/mypage");if(t==="成績履歴")router.push("/exam/history");if(t==="ログアウト")handleLogout();}} style={{flex:1,padding:"min(1.3vh,10px) 0",border:`1.5px solid ${C.border}`,borderRight:i<2?"none":`1.5px solid ${C.border}`,background:"transparent",color:t==="ログアウト"?C.red:C.textMid,fontSize:"min(1.1vw,10px)",fontWeight:500,cursor:"pointer",fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",transition:"all 0.15s",textAlign:"center"}}
                      onMouseEnter={e=>{e.currentTarget.style.background=t==="ログアウト"?C.red:C.text;e.currentTarget.style.color=C.bg;}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=t==="ログアウト"?C.red:C.textMid;}}
                    >{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Nav buttons (fixed, z-index:10 — above cards) ── */}
      <div style={{position:"fixed",bottom:16,left:24,right:24,display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:10,pointerEvents:"none"}}>
        <div style={{display:"flex",pointerEvents:"auto"}}>
          {[{id:"quiz",l:"QUIZ"},{id:"test",l:"TEST"},{id:"review",l:"REVIEW"}].map((tab,i) => {
            const active = page===tab.id;
            const hov = hoveredTab===tab.id;
            const label = active ? "HOME" : tab.l;
            const onClick = active ? ()=>setPage("home") : ()=>setPage(tab.id);
            return <button key={tab.id} onClick={onClick} onMouseEnter={()=>setHoveredTab(tab.id)} onMouseLeave={()=>setHoveredTab(null)} style={{padding:"8px 24px",fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",cursor:"pointer",border:`1.5px solid ${C.text}`,borderRight:i<2?"none":`1.5px solid ${C.text}`,background:active?C.text:hov?`${C.text}08`:C.bg,color:active?C.bg:C.text,transition:"all 0.15s"}}>{label}</button>;
          })}
        </div>
        <button onClick={()=>setPage(page==="mypage"?"home":"mypage")} onMouseEnter={()=>setHoveredTab("mypage")} onMouseLeave={()=>setHoveredTab(null)} style={{padding:"8px 20px",fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",cursor:"pointer",border:`1.5px solid ${C.text}`,background:page==="mypage"?C.text:hoveredTab==="mypage"?`${C.text}08`:C.bg,color:page==="mypage"?C.bg:C.text,transition:"all 0.15s",position:"relative",pointerEvents:"auto"}}>
          {page==="mypage"?"HOME":"MY PAGE"}
          {page!=="mypage"&&announcements.length>0 && <div style={{position:"absolute",top:-7,right:-7,width:18,height:18,borderRadius:"50%",background:C.red,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",animation:"badgePulse 2s ease infinite"}}>{announcements.length}</div>}
        </button>
      </div>
    </>
  );
}
