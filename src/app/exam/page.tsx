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

/* ── BG Card Sets ── */
const BG = {
  quiz: [
    { top:"3%",left:"1%",w:"19vw",h:"27vw",rot:-4,spd:0.2,grad:"linear-gradient(145deg,#eab308,#ea580c)" },
    { top:"-1%",left:"36%",w:"22vw",h:"29vw",rot:3,spd:0.3,grad:"linear-gradient(145deg,#fbbf24,#d97706)" },
    { top:"2%",right:"2%",w:"18vw",h:"28vw",rot:-2,spd:0.15,grad:"linear-gradient(145deg,#f59e0b,#b45309)" },
    { bottom:"1%",left:"5%",w:"21vw",h:"30vw",rot:2,spd:0.35,grad:"linear-gradient(145deg,#fde68a,#f59e0b)" },
    { bottom:"-2%",left:"40%",w:"17vw",h:"25vw",rot:-3,spd:0.18,grad:"linear-gradient(145deg,#fdba74,#ea580c)" },
    { bottom:"2%",right:"3%",w:"20vw",h:"31vw",rot:4,spd:0.28,grad:"linear-gradient(145deg,#fef3c7,#fbbf24)" },
  ],
  test: [
    { top:"1%",left:"2%",w:"20vw",h:"28vw",rot:-2,spd:0.15,grad:"linear-gradient(145deg,#292524,#44403c)" },
    { top:"-3%",left:"35%",w:"23vw",h:"30vw",rot:1,spd:0.25,grad:"linear-gradient(145deg,#57534e,#78716c)" },
    { top:"3%",right:"4%",w:"18vw",h:"26vw",rot:-3,spd:0.2,grad:"linear-gradient(145deg,#a8a29e,#d6d3d1)" },
    { bottom:"2%",left:"3%",w:"19vw",h:"29vw",rot:3,spd:0.3,grad:"linear-gradient(145deg,#44403c,#292524)" },
    { bottom:"0%",left:"38%",w:"21vw",h:"27vw",rot:-1,spd:0.22,grad:"linear-gradient(145deg,#78716c,#a8a29e)" },
    { bottom:"3%",right:"2%",w:"20vw",h:"30vw",rot:2,spd:0.28,grad:"linear-gradient(145deg,#d6d3d1,#e7e5e4)" },
  ],
  review: [
    { top:"2%",left:"3%",w:"18vw",h:"26vw",rot:-3,spd:0.18,grad:"linear-gradient(145deg,#0891b2,#164e63)" },
    { top:"-1%",left:"33%",w:"21vw",h:"29vw",rot:2,spd:0.28,grad:"linear-gradient(145deg,#22d3ee,#06b6d4)" },
    { top:"1%",right:"3%",w:"20vw",h:"28vw",rot:-2,spd:0.22,grad:"linear-gradient(145deg,#a5f3fc,#67e8f9)" },
    { bottom:"1%",left:"4%",w:"20vw",h:"31vw",rot:4,spd:0.32,grad:"linear-gradient(145deg,#155e75,#0e7490)" },
    { bottom:"-2%",left:"37%",w:"18vw",h:"25vw",rot:-4,spd:0.15,grad:"linear-gradient(145deg,#06b6d4,#0891b2)" },
    { bottom:"3%",right:"4%",w:"19vw",h:"28vw",rot:1,spd:0.25,grad:"linear-gradient(145deg,#67e8f9,#a5f3fc)" },
  ],
  mypage: [
    { top:"1%",left:"2%",w:"19vw",h:"28vw",rot:-2,spd:0.2,grad:"linear-gradient(145deg,#7c3aed,#4c1d95)" },
    { top:"-2%",left:"35%",w:"22vw",h:"30vw",rot:3,spd:0.3,grad:"linear-gradient(145deg,#a78bfa,#7c3aed)" },
    { top:"3%",right:"3%",w:"18vw",h:"27vw",rot:-3,spd:0.15,grad:"linear-gradient(145deg,#c4b5fd,#a78bfa)" },
    { bottom:"2%",left:"5%",w:"21vw",h:"29vw",rot:2,spd:0.35,grad:"linear-gradient(145deg,#6d28d9,#5b21b6)" },
    { bottom:"-1%",left:"39%",w:"17vw",h:"24vw",rot:-4,spd:0.18,grad:"linear-gradient(145deg,#ddd6fe,#c4b5fd)" },
    { bottom:"3%",right:"2%",w:"20vw",h:"30vw",rot:1,spd:0.25,grad:"linear-gradient(145deg,#8b5cf6,#6d28d9)" },
  ],
};

const PG_CONF: Record<string,{title:string;sub:string;opacity:number}> = {
  quiz:{title:"Quiz",sub:"通常テスト — 自主学習",opacity:0.3},
  test:{title:"Test",sub:"共通テスト — 公開中のテスト",opacity:0.12},
  review:{title:"Review",sub:"成績履歴 — 分析",opacity:0.25},
  mypage:{title:"My Page",sub:"プロフィール — お知らせ",opacity:0.2},
};

/* ── Shared UI ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:"min(1.1vw,10px)",fontWeight:600,color:C.textLight,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"min(1.5vh,10px)",fontFamily:"'IBM Plex Mono',monospace" }}>{children}</div>;
}

function CardSelect({ items, selected, onSelect, columns=4 }: { items:{id:string;label:string;icon:string;desc?:string;color?:string;bg?:string}[]; selected:string; onSelect:(id:string)=>void; columns?:number }) {
  return (
    <div style={{ display:"grid",gridTemplateColumns:`repeat(${columns},1fr)`,gap:"min(1.2vw,10px)" }}>
      {items.map(item => {
        const active = selected === item.id;
        const sc = item.color || C.text;
        return (
          <button key={item.id} onClick={() => onSelect(item.id)} style={{
            padding:"min(2vh,16px) min(1vw,8px)", border:`1.5px solid ${active ? sc : C.border}`,
            background:active?(item.bg||`${sc}08`):"transparent", color:active?sc:C.textMid,
            display:"flex",flexDirection:"column",alignItems:"center",gap:"min(0.6vh,4px)",
            cursor:"pointer",fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",transition:"all 0.15s",
          }}>
            <span style={{ fontSize:"min(2.5vw,22px)",filter:active?"none":"grayscale(40%)" }}>{item.icon}</span>
            <span style={{ fontSize:"min(1.3vw,12px)",fontWeight:active?700:450 }}>{item.label}</span>
            {item.desc && <span style={{ fontSize:"min(1vw,9px)",color:C.textLight }}>{item.desc}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Types ── */
interface User { id:string;name:string;role:string;avatar_url?:string|null }
interface CommonTest { id:string;title:string;franchise:Franchise|null;common_test_question:{count:number}[] }
interface Ann { id:string;title:string;body:string|null;is_pinned:boolean;starts_at:string }
interface Session { id:string;difficulty:Difficulty;franchise:Franchise;total_questions:number;score:number;finished_at:string;common_test_id:string|null }
interface CardStat { quiz_card_id:string;card_name:string;franchise:string;price:number;total:number;correct:number;accuracy:number }

/* ════════════════════════════════════════════════════════════════ */
export default function ProvaApp() {
  const router = useRouter();
  const [page, setPage] = useState("home");
  const [scrollY, setScrollY] = useState(0);
  const [maxScrollY, setMaxScrollY] = useState(0);
  const [hoveredTab, setHoveredTab] = useState<string|null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Quiz state
  const [mode, setMode] = useState("10");
  const [mat, setMat] = useState<Franchise|"all">("Pokemon");
  const [diff, setDiff] = useState<Difficulty>("easy");
  const [selectedTest, setSelectedTest] = useState<string|null>(null);

  useEffect(() => {
    const u = sessionStorage.getItem("user");
    if (!u) { router.push("/"); return; }
    setUser(JSON.parse(u));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/exam/common-tests").then(r=>r.json()).then(d=>setCommonTests(Array.isArray(d)?d:[]));
    fetch("/api/announcements").then(r=>r.json()).then(d=>setAnnouncements(Array.isArray(d)?d.slice(0,5):[]));
    // HOME用カード画像を取得（ランダム12枚）
    fetch("/api/admin/cards?limit=12").then(r=>r.json()).then((cards:{image_url:string|null}[])=>{
      setCardImages(cards.filter((c:{image_url:string|null})=>c.image_url).map((c:{image_url:string|null})=>c.image_url!));
    });
    fetch(`/api/exam/history?user_id=${user.id}`).then(r=>r.json()).then(data=>{
      setSessions(data.sessions??[]);
      setCardStats(data.card_stats??[]);
      const normalTotal = (data.sessions??[]).filter((s:{difficulty:string})=>s.difficulty==="normal").reduce((sum:number,s:{total_questions:number})=>sum+s.total_questions,0);
      setHardUnlocked(normalTotal>=20);
    });
  }, [user]);

  // Scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const y = containerRef.current.scrollTop;
      setScrollY(y);
      setMaxScrollY(p => Math.max(p, y));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) { el.addEventListener("scroll",handleScroll,{passive:true}); return()=>el.removeEventListener("scroll",handleScroll); }
  }, [handleScroll]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
    setScrollY(0);
    if (page === "home") setMaxScrollY(0);
  }, [page]);

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

  const isHome = page === "home";
  const pgConf = PG_CONF[page];
  const MATERIALS = [
    {id:"all",label:"全商材",icon:"🃏",desc:"ランダム"},
    {id:"Pokemon",label:"ポケモン",icon:"⚡"},
    {id:"ONE PIECE",label:"ワンピース",icon:"🏴‍☠️"},
    {id:"YU-GI-OH!",label:"遊戯王",icon:"🔮"},
  ];
  const DIFFS = [
    {id:"easy",label:"かんたん",icon:"🌱",desc:"4択",color:C.green,bg:C.greenBg},
    {id:"normal",label:"ノーマル",icon:"🔥",desc:"許容範囲あり",color:C.accent,bg:C.accentLight},
    ...(hardUnlocked?[{id:"hard",label:"むずかしい",icon:"💀",desc:"範囲が狭い",color:C.red,bg:C.redBg}]:[]),
  ];

  const thS:React.CSSProperties = {padding:"min(1vh,8px) min(1.2vw,12px)",textAlign:"left",fontSize:"min(1vw,9px)",fontWeight:600,color:C.textLight,letterSpacing:"0.08em",textTransform:"uppercase",borderBottom:`1px solid ${C.border}`};
  const tdS:React.CSSProperties = {padding:"min(1.1vh,9px) min(1.2vw,12px)",fontSize:"min(1.2vw,12px)",borderBottom:`1px solid ${C.border}22`};

  return (
    <>
      <style>{`
        @keyframes holoShine{0%{background-position:-100% -100%}50%{background-position:200% 200%}100%{background-position:-100% -100%}}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes badgePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        .no-sb::-webkit-scrollbar{width:0}
      `}</style>

      <div ref={containerRef} className="no-sb" style={{width:"100vw",height:"100vh",overflow:"auto",background:C.bg,position:"relative",fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",color:C.text}}>

        {/* ── Header ── */}
        <header style={{
          position:"fixed",top:0,left:0,right:0,zIndex:20,padding:"12px 28px",
          display:"flex",alignItems:"center",justifyContent:"space-between",
          background:scrollY>60?"rgba(245,243,238,0.9)":"transparent",
          backdropFilter:scrollY>60?"blur(10px)":"none",transition:"all 0.3s",
        }}>
          <div className="flex items-center gap-3 cursor-pointer" onClick={()=>setPage("home")}>
            <div style={{width:36,height:36,background:`linear-gradient(135deg,${C.text},#44403c)`,color:"#f59e0b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>TS</div>
            <span style={{fontSize:17,fontWeight:700,letterSpacing:"-0.02em"}}>{isHome?"TOM.STOCKS":"PROVA"}</span>
          </div>
        </header>

        {/* ── HOME ── */}
        {isHome && (
          <div style={{position:"relative",width:"100%",height:"280vh"}}>
            <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:1,pointerEvents:"none",textAlign:"center"}}>
              <div style={{fontSize:"min(20vw,280px)",fontWeight:"normal",fontFamily:"'Times New Roman',Times,serif",color:C.text,letterSpacing:"0.04em",lineHeight:0.85,textTransform:"uppercase"}}>Prova</div>
              <div style={{fontSize:10,fontWeight:500,letterSpacing:"0.4em",color:C.textLight,marginTop:16,fontFamily:"'IBM Plex Mono',monospace"}}>TOM.STOCKS CARD QUIZ</div>
            </div>
            {[
              {left:"2%",top:"3vh",w:"22%",h:"30vh",spd:0.3,at:-20,grad:"linear-gradient(145deg,#eab308,#ea580c)"},
              {left:"26%",top:"1vh",w:"24%",h:"34vh",spd:0.5,at:-20,grad:"linear-gradient(145deg,#dc2626,#881337)"},
              {left:"54%",top:"4vh",w:"21%",h:"28vh",spd:0.35,at:-20,grad:"linear-gradient(145deg,#7c3aed,#4c1d95)"},
              {left:"78%",top:"2vh",w:"20%",h:"32vh",spd:0.45,at:-20,grad:"linear-gradient(145deg,#0891b2,#164e63)"},
              {left:"4%",top:"52vh",w:"23%",h:"32vh",spd:0.5,at:-20,grad:"linear-gradient(145deg,#ea580c,#9a3412)"},
              {left:"29%",top:"48vh",w:"25%",h:"30vh",spd:0.35,at:-20,grad:"linear-gradient(145deg,#be123c,#881337)"},
              {left:"56%",top:"50vh",w:"22%",h:"34vh",spd:0.55,at:-20,grad:"linear-gradient(145deg,#6d28d9,#4c1d95)"},
              {left:"80%",top:"46vh",w:"19%",h:"28vh",spd:0.4,at:-20,grad:"linear-gradient(145deg,#b45309,#78350f)"},
              {left:"1%",top:"110vh",w:"24%",h:"30vh",spd:0.45,at:15,grad:"linear-gradient(145deg,#059669,#065f46)"},
              {left:"27%",top:"105vh",w:"23%",h:"34vh",spd:0.3,at:18,grad:"linear-gradient(145deg,#d97706,#92400e)"},
              {left:"53%",top:"112vh",w:"22%",h:"28vh",spd:0.6,at:14,grad:"linear-gradient(145deg,#e11d48,#9f1239)"},
              {left:"77%",top:"108vh",w:"21%",h:"32vh",spd:0.35,at:20,grad:"linear-gradient(145deg,#8b5cf6,#6d28d9)"},
            ].map((card,i) => {
              const maxS = typeof window!=="undefined"?window.innerHeight*1.5:1200;
              const scrollPct = maxS>0?(maxScrollY/maxS)*100:0;
              const raw = (scrollPct-card.at)/20;
              const reveal = Math.min(1,Math.max(0,raw));
              const d = reveal*250;
              const clip = reveal>=1?"none":reveal<=0?"polygon(0 0,0 0,0 0)":`polygon(-5% -5%,${d}% -5%,-5% ${d}%)`;
              return (
                <div key={i} style={{
                  position:"absolute",left:card.left,top:card.top,width:card.w,height:card.h,
                  background: cardImages[i]
                    ? `url(${cardImages[i]}) center/cover no-repeat`
                    : card.grad,
                  clipPath:clip,transform:`translateY(${-scrollY*card.spd}px)`,zIndex:2,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.1)",
                }}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,transparent 30%,rgba(255,255,255,0.3) 50%,transparent 70%)",backgroundSize:"300% 300%",animation:`holoShine ${3+(i%3)}s ease infinite`,opacity:0.25,pointerEvents:"none"}} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Sub pages ── */}
        {!isHome && pgConf && (
          <div style={{position:"relative",width:"100%",height:"280vh"}}>
            {(BG[page as keyof typeof BG]||BG.quiz).map((c,i) => {
              const pos:React.CSSProperties = {};
              if("top" in c) pos.top=c.top; if("bottom" in c) pos.bottom=(c as {bottom?:string}).bottom;
              if("left" in c) pos.left=c.left; if("right" in c) pos.right=(c as {right?:string}).right;
              return <div key={`${page}-${i}`} style={{position:"absolute",...pos,width:c.w,height:c.h,background:c.grad,transform:`rotate(${c.rot}deg) translateY(${-scrollY*c.spd}px)`,opacity:pgConf.opacity,zIndex:0}} />;
            })}

            <div style={{position:"sticky",top:0,height:"calc(100vh - 50px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"min(4vh,28px) min(3vw,24px)",zIndex:2}}>
              <div style={{textAlign:"center",marginBottom:"min(3vh,24px)"}}>
                <div style={{fontSize:"min(12vw,140px)",fontWeight:"normal",fontFamily:"'Times New Roman',Times,serif",color:C.text,letterSpacing:"0.03em",lineHeight:0.85,textTransform:"uppercase"}}>{pgConf.title}</div>
                <div style={{fontSize:"min(1.1vw,10px)",fontWeight:500,letterSpacing:"0.3em",color:C.textLight,marginTop:"min(1.5vh,12px)",fontFamily:"'IBM Plex Mono',monospace"}}>{pgConf.sub}</div>
              </div>

              {/* QUIZ */}
              {page==="quiz" && (
                <div style={{maxWidth:"min(52vw,560px)",margin:"0 auto",width:"100%"}}>
                  <div style={{marginBottom:"min(3vh,24px)"}}>
                    <SectionLabel>モード</SectionLabel>
                    <div style={{display:"flex"}}>
                      {[{id:"10",l:"⚡ 10問テスト"},{id:"endless",l:"♾️ エンドレス"}].map((m,i) => (
                        <button key={m.id} onClick={()=>setMode(m.id)} style={{padding:"min(1.5vh,12px) 0",flex:1,border:`1.5px solid ${mode===m.id?C.text:C.border}`,borderRight:i===0?"none":undefined,background:mode===m.id?C.text:"transparent",color:mode===m.id?"#fff":C.text,fontSize:"min(1.5vw,13px)",fontWeight:mode===m.id?700:450,fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",cursor:"pointer",transition:"all 0.15s",textAlign:"center"}}>{m.l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:"min(3vh,24px)"}}>
                    <SectionLabel>商材を選択</SectionLabel>
                    <CardSelect items={MATERIALS} selected={mat} onSelect={id=>setMat(id as Franchise|"all")} />
                  </div>
                  <div style={{marginBottom:"min(3.5vh,28px)"}}>
                    <SectionLabel>難易度</SectionLabel>
                    <CardSelect items={DIFFS} selected={diff} onSelect={id=>setDiff(id as Difficulty)} columns={DIFFS.length} />
                  </div>
                  {error && <p style={{textAlign:"center",fontSize:12,color:C.red,marginBottom:12}}>{error}</p>}
                  <button onClick={handleQuizStart} disabled={loading} style={{width:"100%",maxWidth:"min(40vw,380px)",padding:"min(1.8vh,14px) 0",border:"none",background:C.text,color:"#fff",fontSize:"min(1.6vw,14px)",fontWeight:700,fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",letterSpacing:"0.04em",cursor:"pointer",transition:"all 0.2s",margin:"0 auto",display:"block",opacity:loading?0.5:1}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px ${C.text}30`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="none";}}
                  >{loading?"準備中...": `${mode==="endless"?"エンドレス":"10問テスト"} スタート →`}</button>
                  <div style={{textAlign:"center",marginTop:"min(1.5vh,10px)",fontSize:"min(1.1vw,10px)",color:C.textLight}}>{MATERIALS.find(m=>m.id===mat)?.label} · {DIFFS.find(d=>d.id===diff)?.label}</div>
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
                <div style={{maxWidth:"min(62vw,680px)",margin:"0 auto",width:"100%"}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"min(1vw,10px)",marginBottom:"min(3vh,24px)"}}>
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
                  <div style={{border:`1.5px solid ${C.border}`,background:"rgba(255,255,255,0.35)"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr>{["種別","商材","難易度","スコア","正答率","日付"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                      <tbody>
                        {sessions.length===0 && <tr><td colSpan={6} style={{...tdS,textAlign:"center",color:C.textLight}}>まだ受験データがありません</td></tr>}
                        {sessions.slice(0,15).map((r,i) => {
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
                </div>
              )}

              {/* MY PAGE */}
              {page==="mypage" && user && (
                <div style={{maxWidth:"min(52vw,560px)",margin:"0 auto",width:"100%"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"min(1.5vw,14px)",padding:"min(2vh,16px) min(2vw,18px)",marginBottom:"min(3vh,24px)",border:`1.5px solid ${C.border}`,background:"rgba(255,255,255,0.45)"}}>
                    <div style={{width:"min(5vw,44px)",height:"min(5vw,44px)",background:C.text,color:"#f59e0b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"min(2vw,16px)",fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",overflow:"hidden"}}>
                      {user.avatar_url?<img src={user.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} />:user.name[0]}
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
                    {["パスワード変更","成績履歴","ヘルプ"].map((t,i) => (
                      <button key={i} onClick={()=>{if(t==="パスワード変更")router.push("/exam/mypage");if(t==="成績履歴")router.push("/exam/history");}} style={{flex:1,padding:"min(1.3vh,10px) 0",border:`1.5px solid ${C.border}`,borderRight:i<2?"none":`1.5px solid ${C.border}`,background:"transparent",color:C.textMid,fontSize:"min(1.1vw,10px)",fontWeight:500,cursor:"pointer",fontFamily:"'IBM Plex Mono','Noto Sans JP',monospace",transition:"all 0.15s",textAlign:"center"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=C.text;e.currentTarget.style.color=C.bg;}}
                        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textMid;}}
                      >{t}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Bottom Nav ── */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,height:50,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",zIndex:30,background:"rgba(245,243,238,0.92)",backdropFilter:"blur(10px)",borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"flex"}}>
            {isHome && <div style={{display:"flex",alignItems:"center",marginRight:16}}><span style={{fontSize:10,color:C.textLight,letterSpacing:"0.08em"}}>SCROLL ↓</span></div>}
            {[{id:"quiz",l:"QUIZ"},{id:"test",l:"TEST"},{id:"review",l:"REVIEW"}].map((tab,i) => {
              const active = page===tab.id;
              const hov = hoveredTab===tab.id;
              return <button key={tab.id} onClick={()=>setPage(tab.id)} onMouseEnter={()=>setHoveredTab(tab.id)} onMouseLeave={()=>setHoveredTab(null)} style={{padding:"8px 24px",fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",cursor:"pointer",border:`1.5px solid ${C.text}`,borderRight:i<2?"none":`1.5px solid ${C.text}`,background:active?C.text:hov?`${C.text}08`:C.bg,color:active?C.bg:C.text,transition:"all 0.15s"}}>{tab.l}</button>;
            })}
          </div>
          {!isHome && <button onClick={()=>setPage("home")} style={{background:"none",border:"none",color:C.textLight,fontSize:10,cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'IBM Plex Mono',monospace",transition:"color 0.12s"}} onMouseEnter={e=>e.currentTarget.style.color=C.text} onMouseLeave={e=>e.currentTarget.style.color=C.textLight}>← HOME</button>}
          {isHome && <button onClick={()=>{sessionStorage.clear();router.push("/");}} style={{background:"none",border:"none",color:C.textLight,fontSize:10,cursor:"pointer",letterSpacing:"0.1em",fontFamily:"'IBM Plex Mono',monospace"}} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.textLight}>LOGOUT</button>}
          <button onClick={()=>setPage("mypage")} onMouseEnter={()=>setHoveredTab("mypage")} onMouseLeave={()=>setHoveredTab(null)} style={{padding:"8px 20px",fontSize:11,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",cursor:"pointer",border:`1.5px solid ${C.text}`,background:page==="mypage"?C.text:hoveredTab==="mypage"?`${C.text}08`:C.bg,color:page==="mypage"?C.bg:C.text,transition:"all 0.15s",position:"relative"}}>
            MY PAGE
            {page!=="mypage"&&announcements.length>0 && <div style={{position:"absolute",top:-7,right:-7,width:18,height:18,borderRadius:"50%",background:C.red,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",animation:"badgePulse 2s ease infinite"}}>{announcements.length}</div>}
          </button>
        </div>
      </div>
    </>
  );
}
