import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as tf from "@tensorflow/tfjs";

/** RL GridWorld — Beginner Mode
 * Tabs: Q-Learning, DQN, Policy Gradient
 * Beginner-friendly: mobile responsive grid, BFS overlay fixed,
 * overflow guards, quick tips, newbie preset, auto-stopping when optimal,
 * auto-show shortest path at the end for clarity.
 */

/* ========== Utilities ========== */
function useInterval(cb, ms, enabled = true) {
  const saved = useRef(cb);
  useEffect(() => { saved.current = cb; }, [cb]);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms, enabled]);
}
const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
const choice = arr => arr[Math.floor(Math.random()*arr.length)];
const mean = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

/* ========== GridWorld ========== */
const ACTIONS=[0,1,2,3]; const ACTION_LABEL=["↑","→","↓","←"];
function makeGridEnv({
  size=4, start=0, goal=15, traps=[5,10], walls=[],
  rewards={ step:-1, goal:+10, trap:-5, wallBump:-2 },
  slipProb=0, maxSteps=50
}){
  const S = size * size;
  const isTrap=i=>traps.includes(i);
  const isWall=i=>walls.includes(i);
  const inBounds=(r,c)=>r>=0&&r<size&&c>=0&&c<size;
  function step(s,a,rng=Math.random){
    let act=a; if (rng()<slipProb) act = choice(ACTIONS);
    const r0=Math.floor(s/size), c0=s%size; let r=r0,c=c0; if (act===0)r--; if(act===1)c++; if(act===2)r++; if(act===3)c--;
    let ns=s; let rwd=rewards.step; let done=false;
    if (!inBounds(r,c)) { rwd=rewards.wallBump; ns=s; }
    else {
      ns=r*size+c;
      if (isWall(ns)) { rwd=rewards.wallBump; ns=s; }
      if (isTrap(ns)) { rwd=rewards.trap; done=true; }
      if (ns===goal) { rwd=rewards.goal; done=true; }
    }
    return { ns, r:rwd, done };
  }
  function validActions(s){
    const row=Math.floor(s/size), col=s%size; const acts=[];
    if (row>0 && !isWall(s-size)) acts.push(0);
    if (col<size-1 && !isWall(s+1)) acts.push(1);
    if (row<size-1 && !isWall(s+size)) acts.push(2);
    if (col>0 && !isWall(s-1)) acts.push(3);
    return acts.length?acts:ACTIONS;
  }
  return { size,S, start, goal, traps, walls, rewards, slipProb, maxSteps, step, validActions, isTrap, isWall, inBounds };
}

/* ---------- Internals helpers ---------- */
function shortestPathStates(env){
  const { size, start, goal } = env;
  const q=[start], prev=Array(env.S).fill(-1), seen=Array(env.S).fill(false);
  seen[start]=true;
  const nbrs = (s)=>{
    const r=Math.floor(s/size), c=s%size, out=[];
    const cand=[[r-1,c],[r,c+1],[r+1,c],[r,c-1]];
    for(const [nr,nc] of cand){
      if(nr>=0 && nr<size && nc>=0 && nc<size){
        const ns=nr*size+nc;
        if(!env.isWall(ns)) out.push(ns);
      }
    }
    return out;
  };
  while(q.length){
    const u=q.shift();
    if(u===goal) break;
    for(const v of nbrs(u)){
      if(!seen[v]){ seen[v]=true; prev[v]=u; q.push(v); }
    }
  }
  if(!seen[goal]) return null;
  const path=[]; let cur=goal;
  while(cur!==-1){ path.push(cur); if(cur===start) break; cur=prev[cur]; }
  return path.reverse();
}
function simulateGreedy(env, selector){
  const path=[env.start]; let s=env.start, steps=0, outcome="timeout";
  while(steps<env.maxSteps){
    const a=selector(s);
    const { ns } = env.step(s,a,()=>1); // no slip
    if(ns===env.goal){ outcome="goal"; path.push(ns); break; }
    if(env.isTrap(ns)){ outcome="trap"; path.push(ns); break; }
    // guard against stuck-on-same-cell loops (shouldn't happen with masking, but safe)
    if (ns === s) { steps++; path.push(ns); break; }
    path.push(ns);
    s=ns; steps++;
  }
  if(steps>=env.maxSteps && (path[path.length-1]!==env.goal && !env.isTrap(path[path.length-1]))) outcome="timeout";
  return { path, outcome, steps:path.length-1 };
}

/* ========== Small UI ========== */
function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      {(title||subtitle) && (
        <div className="mb-2">
          {title && <div className="font-semibold">{title}</div>}
          {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input aria-label={label} type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
function Slider({ label, value, onChange, min, max, step }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="w-28 sm:w-24 text-zinc-600">{label}</span>
      <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} className="w-40 sm:w-48" />
      <span className="w-10 text-right tabular-nums">{value}</span>
    </label>
  );
}
function Num({ label, value, onChange, step=1, min, max, w="w-24" }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="w-32 sm:w-28 text-zinc-600">{label}</span>
      <input aria-label={label} type="number" value={Number.isFinite(value)?value:""} onChange={e=>onChange(Number(e.target.value))} step={step} min={min} max={max} className={`rounded-md border px-2 py-1 bg-white ${w}`} />
    </label>
  );
}
function Pill({ children, tone="zinc" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-800",
    green: "bg-emerald-100 text-emerald-800",
    yellow: "bg-amber-100 text-amber-900",
    red: "bg-rose-100 text-rose-800",
    blue: "bg-sky-100 text-sky-800",
    violet: "bg-violet-100 text-violet-800",
  };
  return <span className={`px-2 py-0.5 rounded text-[11px] ${tones[tone]||tones.zinc}`}>{children}</span>;
}
function Sparkline({ series }) {
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current; if(!canvas) return;
    const w=canvas.width=canvas.clientWidth, h=canvas.height=canvas.clientHeight;
    const ctx=canvas.getContext("2d"); ctx.clearRect(0,0,w,h);
    if(!series.length) return;
    const max=Math.max(...series,1), min=Math.min(...series,0);
    const norm=v=> (max===min?0.5:(v-min)/(max-min));
    ctx.beginPath();
    series.forEach((v,i)=>{
      const x=(i/(series.length-1||1))*(w-2)+1;
      const y=h-1 - norm(v)*(h-2);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.lineWidth=2; ctx.strokeStyle="#111827"; ctx.stroke();
  },[series]);
  return <canvas ref={ref} className="w-full h-10" />;
}

/* ✅ ControlBar & Legend */
function ControlBar({ auto, onToggleAuto, onStep, onReset, speed, setSpeed, note }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onToggleAuto} className={`px-3 py-2 rounded-md border text-sm ${auto?"bg-rose-600 text-white":"bg-emerald-600 text-white"}`}>
          {auto ? "Pause" : "Play"}
        </button>
        <button onClick={onStep} className="px-3 py-2 rounded-md border text-sm bg-white">Step</button>
        <button onClick={onReset} className="px-3 py-2 rounded-md border text-sm bg-white">Reset</button>
        <div className="ml-0 sm:ml-2"><Slider label="Speed" value={speed} onChange={setSpeed} min={1} max={200} step={1} /></div>
      </div>
      <div className="mt-2 text-xs text-zinc-600">
        {note || "Play runs many steps automatically. Step does one update. Reset clears learning."}
      </div>
    </Card>
  );
}
function Legend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="px-2 py-0.5 rounded border bg-indigo-100">Agent</span>
      <span className="px-2 py-0.5 rounded border bg-emerald-100">Goal</span>
      <span className="px-2 py-0.5 rounded border bg-rose-100">Trap</span>
      <span className="px-2 py-0.5 rounded border bg-zinc-200">Wall</span>
      <span className="px-2 py-0.5 rounded border">Arrows = policy</span>
      <span className="px-2 py-0.5 rounded border bg-amber-100">Amber ring = path</span>
    </div>
  );
}

/* ========== Grid (mobile-proof) ========== */
function Grid({ env, agentState, policy, values, showValues=false, edit=false, onToggleTrap, onToggleWall, onSetGoal, highlightPath=null, showPathOrder=false }) {
  const order = useMemo(()=> {
    if(!highlightPath) return {};
    const m={}; highlightPath.forEach((s,i)=>{ m[s]=i; });
    return m;
  },[highlightPath]);

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="grid gap-2 min-w-[280px]"
        style={{ gridTemplateColumns: `repeat(${env.size}, minmax(0,1fr))` }}
      >
        {Array.from({ length: env.S }, (_, i)=>{
          const isAgent=i===agentState, isGoal=i===env.goal, isTrap=env.traps.includes(i), isWall=env.walls.includes(i);
          const inPath = !!highlightPath && highlightPath.includes(i);
          const bg = isGoal?"bg-emerald-100": isAgent?"bg-indigo-100": isWall?"bg-zinc-200": isTrap?"bg-rose-100":"bg-white";
          const ring = inPath ? "ring-2 ring-amber-400 shadow-[0_0_0_2px_rgba(251,191,36,0.25)_inset]" : "";
          return (
            <div
              key={i}
              className={`relative rounded-lg border p-1 select-none ${bg} ${ring}`}
              style={{ aspectRatio: "1/1", minHeight: 56 }}
              onClick={()=>{ if (!edit) return; if (isGoal) return; if (isWall) onToggleWall?.(i); else onToggleTrap?.(i); }}
              onContextMenu={(e)=>{ e.preventDefault(); if (edit) onToggleWall?.(i); }}
              onDoubleClick={()=> edit && onSetGoal?.(i)}
              title={`Cell ${i}`}
            >
              <div className="absolute top-1 left-1 text-[10px] text-zinc-500">{i}</div>

              {policy && (
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 text-[10px] p-1">
                  {[0,1,2,3].map(a=>{
                    const p=policy[i]?.[a] ?? 0;
                    const w=clamp(Math.abs(p),0,1);
                    const label=ACTION_LABEL[a];
                    const style={opacity:0.18+0.82*w};
                    return (
                      <div key={a} className="flex items-center justify-center">
                        <div className="px-1 py-0.5 rounded bg-white/70" style={style}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {showValues && values && (
                <div className="absolute bottom-1 right-1 text-[10px] px-1 py-0.5 rounded bg-black/5">
                  {Number.isFinite(values?.[i])? values[i].toFixed(2):""}
                </div>
              )}

              {showPathOrder && inPath && (
                <div className="absolute bottom-1 left-1 text-[10px] px-1 py-0.5 rounded bg-amber-200/80">
                  {order[i]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========== Shared “theory blocks” ========== */
function Glossary() {
  return (
    <ul className="text-xs leading-5 text-zinc-700 list-disc pl-5">
      <li><b>State (s)</b>: the current cell.</li>
      <li><b>Action (a)</b>: ↑ → ↓ ←.</li>
      <li><b>Reward (r)</b>: step cost, trap penalty, or goal bonus.</li>
      <li><b>Return (G)</b>: total future rewards (discounted by γ).</li>
      <li><b>Value</b>: how good a state is (expected return).</li>
      <li><b>Policy</b>: how the agent chooses actions.</li>
    </ul>
  );
}
function TheoryCard({ title, notes }) {
  return (
    <div className="text-sm text-zinc-700">
      <div className="font-semibold mb-1">{title}</div>
      <div className="space-y-2 text-xs leading-5">
        {notes.map((n,i)=>(<div key={i}>{n}</div>))}
      </div>
    </div>
  );
}

/* ========== Q-Learning (tabular) ========== */
function QLearningTab({ envConfig }) {
  const [env,setEnv]=useState(()=>makeGridEnv(envConfig));
  const [alpha,setAlpha]=useState(0.3);
  const [gamma,setGamma]=useState(0.95);
  const [eps,setEps]=useState(0.3);
  const [speed,setSpeed]=useState(20);
  const [auto,setAuto]=useState(false);
  const [showValues,setShowValues]=useState(false);
  const [showBFS,setShowBFS]=useState(false);
  const [autoShowOptimal, setAutoShowOptimal] = useState(false);

  const [Q,setQ]=useState(()=>Array.from({length:env.S},()=>[0,0,0,0]));
  const [s,setS]=useState(env.start);
  const [ep,setEp]=useState(0);
  const [epRet,setEpRet]=useState(0);
  const [returns,setReturns]=useState([]);
  const [stepsInEp,setStepsInEp]=useState(0);
  const [epPath,setEpPath]=useState([env.start]);
  const [epCap,setEpCap]=useState(200);
  const [showLastPath,setShowLastPath]=useState(false);
  const [showLearnedPath,setShowLearnedPath]=useState(true);
  const [episodeLog,setEpisodeLog]=useState([]);
  const [optPath,setOptPath]=useState(shortestPathStates(env));
  const [greedyPath,setGreedyPath]=useState(null);
  const [optStreak,setOptStreak]=useState(0);
  const [learned,setLearned]=useState(false);
  const [learnedAtEp,setLearnedAtEp]=useState(null);
  const [epsHistory,setEpsHistory]=useState([0.3]);
  const exploredRef=useRef(0); const exploitedRef=useRef(0);

  useEffect(()=>{ const e=makeGridEnv(envConfig); setEnv(e); setOptPath(shortestPathStates(e)); resetAll(true,e); },[envConfig]);

  function resetAll(hard=false, e=env){
    setQ(Array.from({length:e.S},()=>[0,0,0,0]));
    setS(e.start); setEp(0); setEpRet(0); setStepsInEp(0); setEpPath([e.start]);
    if(hard) { setReturns([]); setEpisodeLog([]); setLearned(false); setLearnedAtEp(null); setOptStreak(0); setGreedyPath(null); setEps(0.3); setEpsHistory([0.3]); setShowLearnedPath(true); }
    exploredRef.current=0; exploitedRef.current=0;
    setOptPath(shortestPathStates(e));
    setAutoShowOptimal(false);
  }

  function greedyAction(si){
    const acts=env.validActions(si); let bestA=acts[0], bestQ=-Infinity;
    for(const a of acts){ if(Q[si][a]>bestQ){ bestQ=Q[si][a]; bestA=a; } }
    return bestA;
  }
  const chooseAction=si=>{
    if(Math.random()<eps){ exploredRef.current += 1; return choice(env.validActions(si)); }
    exploitedRef.current += 1; return greedyAction(si);
  };

  function endEpisode(reason){
    const ret = epRet;
    const steps = epPath.length-1;
    setEpisodeLog(log=>[
      { ep: ep+1, outcome:reason, steps, ret: Number(ret.toFixed(2)), explored: exploredRef.current, exploited: exploitedRef.current },
      ...log.slice(0,49)
    ]);
    setReturns(rs=>[...rs.slice(-199), ret]);

    const gp = simulateGreedy(env, greedyAction);
    setGreedyPath(gp.path);
    const optimal = (gp.outcome==="goal" && optPath && gp.path.length===optPath.length);
    setOptStreak(k=> optimal ? k+1 : 0);
    if(optimal && (optStreak+1)>=3 && !learned){
      setLearned(true); setLearnedAtEp(ep+1);
      setAutoShowOptimal(true);
    }

    setEp(e=>e+1); setEpRet(0); setStepsInEp(0); setEpPath([env.start]);
    setEps(e=>{ const v=Math.max(0.05, e*0.995); setEpsHistory(h=>[...h.slice(-199), v]); return v; });
    exploredRef.current=0; exploitedRef.current=0;
    if(auto && ep+1>=epCap){ setAuto(false); setAutoShowOptimal(true); }
  }

  function stepOnce(){
    const a=chooseAction(s);
    const { ns,r,done }=env.step(s,a,Math.random);
    const maxNext=Math.max(...Q[ns]);
    const tdTarget=r + gamma*maxNext;
    const tdError=tdTarget - Q[s][a];
    const newQ=Q.map(row=>row.slice()); newQ[s][a]+=alpha*tdError;
    setQ(newQ);
    const newS = done?env.start:ns;
    setS(newS);
    setEpRet(v=>v+r);
    setStepsInEp(v=>v+1);
    setEpPath(p=>[...p, ns]);
    if(done || stepsInEp+1>=env.maxSteps){
      const reason = done ? (ns===env.goal ? "goal" : env.isTrap(ns) ? "trap" : "done") : "timeout";
      endEpisode(reason);
    }
  }
  useInterval(()=>{ for(let i=0;i<speed;i++) stepOnce(); }, 60, auto);

  const policy=useMemo(()=> Q.map(row=>{
    const out=[0,0,0,0], bestA=row.indexOf(Math.max(...row));
    for(let a=0;a<4;a++){ const n=(row[a]-(-10))/(10-(-10)); out[a]=Number.isFinite(n)?clamp(n,0,1):0; }
    out[bestA]=Math.max(out[bestA],0.9); return out;
  }),[Q]);
  const values=useMemo(()=> Q.map(row=>Math.max(...row)),[Q]);

  const learnedBanner = learned ? (
    <div className="mt-2 p-2 rounded bg-amber-50 text-amber-900 text-xs">
      <b>Learned optimal path</b> (matched BFS 3×) {learnedAtEp ? `at episode ${learnedAtEp}` : ""}. Toggle “My learned path” to compare.
    </div>
  ) : null;

  const doneBanner = (autoShowOptimal && optPath) ? (
    <div className="mt-2 p-2 rounded bg-emerald-50 text-emerald-900 text-xs">
      <b>Finished!</b> Showing the <b>shortest (BFS) path</b>. Press Play to train again (this overlay will hide).
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-3">
      <ControlBar
        auto={auto}
        onToggleAuto={()=>setAuto(a=>{ const next=!a; if(next) setAutoShowOptimal(false); return next; })}
        onStep={stepOnce}
        onReset={()=>resetAll(true)}
        speed={speed}
        setSpeed={setSpeed}
        note={<span><b>Q-Learning:</b> Update Q toward <code>r + γ·max Q(s′,·)</code>. Log tracks explore/exploit.</span>}
      />

      <div className="grid md:grid-cols-3 gap-3">
        <Card title="Grid">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Legend />
              {learned && <Pill tone="green">Learned at ep {learnedAtEp}</Pill>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Toggle label="Values" value={showValues} onChange={setShowValues} />
              <Toggle label="Last episode path" value={showLastPath} onChange={setShowLastPath} />
              <Toggle label="My learned path" value={showLearnedPath} onChange={setShowLearnedPath} />
              <Toggle label="Shortest path (BFS)" value={showBFS} onChange={setShowBFS} />
            </div>
          </div>
          <Grid
            env={env}
            agentState={s}
            policy={policy}
            values={values}
            showValues={showValues}
            highlightPath={
              showLastPath ? epPath :
              (showLearnedPath && greedyPath) ? greedyPath :
              (showBFS || autoShowOptimal) ? optPath : null
            }
            showPathOrder={showLastPath}
            edit
            onToggleTrap={i=>{ const traps=env.traps.includes(i)? env.traps.filter(t=>t!==i):[...env.traps,i]; const e=makeGridEnv({...env,traps}); setEnv(e); setOptPath(shortestPathStates(e)); }}
            onToggleWall={i=>{ const walls=env.walls.includes(i)? env.walls.filter(t=>t!==i):[...env.walls,i]; const e=makeGridEnv({...env,walls}); setEnv(e); setOptPath(shortestPathStates(e)); }}
            onSetGoal={i=>{ const e=makeGridEnv({...env,goal:i}); setEnv(e); setOptPath(shortestPathStates(e)); }}
          />
          <div className="mt-2 text-xs text-zinc-600">Tap = trap • Long-press/right-click = wall • Double-tap = goal.</div>
          {learnedBanner}
          {doneBanner}
        </Card>

        <Card title="Progress" subtitle="Returns & ε">
          <div className="text-xs text-zinc-600 mb-2">
            Episode {ep} / {epCap} • Steps {stepsInEp} • Return {epRet.toFixed(1)} • ε {eps.toFixed(3)}
          </div>
          <Sparkline series={returns} />
          <div className="mt-2">
            <div className="text-xs text-zinc-600 mb-1">ε history</div>
            <Sparkline series={epsHistory} />
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Num label="Episode cap" value={epCap} onChange={setEpCap} step={10} min={10} max={2000} />
            <Num label="α (learn rate)" value={alpha} onChange={setAlpha} step={0.01} min={0.01} max={1} />
            <Num label="γ (discount)" value={gamma} onChange={setGamma} step={0.01} min={0} max={0.999} />
            <Num label="ε (start)" value={eps} onChange={(v)=>{ setEps(v); setEpsHistory(h=>[...h, v]); }} step={0.01} min={0.01} max={1} />
          </div>
          <div className="mt-2 text-xs">
            {optPath ? <>Shortest steps to goal (BFS): <b>{optPath.length-1}</b></> : "Goal unreachable (BFS)."}
            {learned && <div className="mt-1 text-emerald-700 font-medium">✓ Matched BFS 3× consecutively</div>}
          </div>
        </Card>

        <Card title="Episode log" subtitle="Latest first (50 max)">
          <div className="text-xs space-y-1 max-h-56 overflow-auto">
            {episodeLog.map((e,i)=>(
              <div key={i} className="grid grid-cols-5 gap-2">
                <span>Ep {e.ep}</span>
                <span className={e.outcome==="goal"?"text-emerald-700":e.outcome==="trap"?"text-rose-700":"text-zinc-600"}>{e.outcome}</span>
                <span>steps {e.steps}</span>
                <span>return {e.ret}</span>
                <span title="explore / exploit">exp {e.explored}/{e.exploited}</span>
              </div>
            ))}
            {episodeLog.length===0 && <div className="text-zinc-500">No episodes yet.</div>}
          </div>
          <div className="mt-3">
            <TheoryCard
              title="Exploration vs Exploitation (ε-greedy)"
              notes={[
                "With probability ε the agent explores (random valid action). With 1−ε it exploits (best known action).",
                "Start with higher ε to discover the map; decay ε so it commits to a good route.",
                "If exploration stays high late, lower ε or decay faster.",
              ]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ========== Policy Gradient (REINFORCE + baseline) ========== */
const softmax = (logits)=>{ const m=Math.max(...logits); const ex=logits.map(x=>Math.exp(x-m)); const Z=ex.reduce((a,b)=>a+b,0)||1; return ex.map(e=>e/Z); };
const entropyOf = (pArr) => { let h=0; for(const p of pArr){ const q=Math.max(p,1e-8); h += -q*Math.log(q); } return h; };

function PGTab({ envConfig }){
  const [env,setEnv]=useState(()=>makeGridEnv(envConfig));
  const [speed,setSpeed]=useState(10);
  const [auto,setAuto]=useState(false);
  const [lr,setLr]=useState(0.05);
  const [entropyCoef,setEntropyCoef]=useState(0.01);
  const [gamma,setGamma]=useState(0.95);
  const [showValues,setShowValues]=useState(false);
  const [showBFS,setShowBFS]=useState(false);
  const [autoShowOptimal, setAutoShowOptimal] = useState(false);

  const [theta,setTheta]=useState(()=>Array.from({length:env.S},()=>[0,0,0,0]));
  const [V,setV]=useState(()=>Array.from({length:env.S},()=>0));

  const [ep,setEp]=useState(0);
  const [epRet,setEpRet]=useState(0);
  const [returns,setReturns]=useState([]);
  const [epCap,setEpCap]=useState(200);
  const [episodeLog,setEpisodeLog]=useState([]);

  // NEW: live movement replay state
  const [agentS, setAgentS] = useState(env.start);
  const [replayPath, setReplayPath] = useState(null);
  const [replayIdx, setReplayIdx] = useState(0);
  const [animateAfterRollout, setAnimateAfterRollout] = useState(true);

  const [lastPath,setLastPath]=useState(null);
  const [showLastPath,setShowLastPath]=useState(false);
  const [showLearnedPath,setShowLearnedPath]=useState(true);
  const [optPath,setOptPath]=useState(shortestPathStates(env));
  const [optStreak,setOptStreak]=useState(0);
  const [learned,setLearned]=useState(false);
  const [learnedAtEp,setLearnedAtEp]=useState(null);
  const [entropyHist,setEntropyHist]=useState([]);

  const [greedyPath, setGreedyPath] = useState(null);

  useEffect(()=>{ const e=makeGridEnv(envConfig); setEnv(e); resetAll(true,e); },[envConfig]);
  function resetAll(hard=false,e=env){
    setTheta(Array.from({length:e.S},()=>[0,0,0,0]));
    setV(Array.from({length:e.S},()=>0));
    setEp(0); setEpRet(0);
    if(hard){ setReturns([]); setEpisodeLog([]); setLearned(false); setLearnedAtEp(null); setOptStreak(0); setLastPath(null); setEntropyHist([]); setShowLearnedPath(true); }
    setOptPath(shortestPathStates(e));
    setAutoShowOptimal(false);
    setAgentS(e.start); setReplayPath(null); setReplayIdx(0);
    setGreedyPath(null);
  }

  const policyProbs = s => softmax(theta[s]);
  function chooseAction(s){ const p=policyProbs(s); let u=Math.random(), acc=0; for(let a=0;a<4;a++){ acc+=p[a]; if(u<=acc) return a; } return 3; }

  function rolloutEpisode(){
    let traj=[], sCur=env.start, sumR=0, steps=0, path=[env.start], outcome="timeout";
    let entries=[];
    while(steps<env.maxSteps){
      const p=policyProbs(sCur); entries.push(entropyOf(p));
      const a=chooseAction(sCur);
      const out=env.step(sCur,a,Math.random);
      traj.push({s:sCur,a,r:out.r});
      sumR+=out.r; steps++; path.push(out.ns);
      if(out.done){ outcome = (out.ns===env.goal) ? "goal" : env.isTrap(out.ns) ? "trap" : "done"; break; }
      sCur=out.ns;
    }
    if(steps>=env.maxSteps && outcome!=="goal" && outcome!=="trap") outcome="timeout";
    return { traj, sumR, steps, path, outcome, avgEntropy: mean(entries) };
  }
  function computeReturns(traj){ const G=Array(traj.length).fill(0); let g=0; for(let t=traj.length-1;t>=0;t--){ g=traj[t].r + gamma*g; G[t]=g; } return G; }

  function trainOneEpisode(){
    const { traj,sumR,steps,path,outcome,avgEntropy }=rolloutEpisode(); const G=computeReturns(traj);
    const newT=theta.map(r=>r.slice()); const newV=V.slice();
    for(let t=0;t<traj.length;t++){
      const {s,a}=traj[t]; const p=softmax(newT[s]); const adv=G[t]-newV[s];
      for(let k=0;k<4;k++){
        const ind=(k===a)?1:0; const grad=(ind - p[k]) * adv;
        const entGrad = entropyCoef * (p[k]*(Math.log(p[k]+1e-8)+1));
        newT[s][k] +=  lr * (grad - entGrad);
      }
      newV[s] += 0.2*(G[t]-newV[s]);
    }
    setTheta(newT); setV(newV);
    setEp(e=>e+1); setEpRet(sumR); setReturns(rs=>[...rs.slice(-199), sumR]);
    setEpisodeLog(log=>[{ep:ep+1, outcome, steps, ret:Number(sumR.toFixed(2)), entropy: Number(avgEntropy.toFixed(3))}, ...log.slice(0,49)]);
    setEntropyHist(h=>[...h.slice(-199), avgEntropy]);
    setLastPath(path);

    if (animateAfterRollout) {
      setReplayPath(path);
      setReplayIdx(0);
      setAgentS(path[0] ?? env.start);
    }

    const selector = (s)=>{
      const p=softmax(newT[s]);
      const acts = env.validActions(s);
      let best=acts[0], bv=-Infinity;
      for (const a of acts){ if(p[a]>bv){ bv=p[a]; best=a; } }
      return best;
    };
    const gp = simulateGreedy(env, selector);
    setGreedyPath(gp.path);
    const optimal = (gp.outcome==="goal" && optPath && gp.path.length===optPath.length);
    setOptStreak(k=> optimal ? k+1 : 0);
    if(optimal && (optStreak+1)>=3 && !learned){
      setLearned(true); setLearnedAtEp(ep+1);
      setAutoShowOptimal(true);
    }

    if(auto && ep+1>=epCap){ setAuto(false); setAutoShowOptimal(true); }
  }

  useInterval(() => {
    if (!replayPath) return;
    setReplayIdx(i => {
      const next = i + 1;
      if (replayPath && next < replayPath.length) {
        setAgentS(replayPath[next]);
        return next;
      }
      setReplayPath(null);
      return i;
    });
  }, Math.max(60, 1000 / (4 + speed)), !!replayPath);

  useInterval(()=>{ for(let i=0;i<speed;i++) trainOneEpisode(); }, 60, auto && !replayPath);

  const policy=useMemo(()=> theta.map(logits=>softmax(logits)),[theta]);
  const values=V;

  const learnedBanner = learned ? (
    <div className="mt-2 p-2 rounded bg-amber-50 text-amber-900 text-xs">
      <b>Learned optimal path</b> (matched BFS 3×) {learnedAtEp ? `at episode ${learnedAtEp}` : ""}.
    </div>
  ) : null;

  const doneBanner = (autoShowOptimal && optPath) ? (
    <div className="mt-2 p-2 rounded bg-emerald-50 text-emerald-900 text-xs">
      <b>Finished!</b> Showing the <b>shortest (BFS) path</b>. Press Play to train again (this overlay will hide).
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-3">
      <ControlBar
        auto={auto}
        onToggleAuto={()=>setAuto(a=>{ const next=!a; if(next) setAutoShowOptimal(false); return next; })}
        onStep={trainOneEpisode}
        onReset={()=>resetAll(true)}
        speed={speed}
        setSpeed={setSpeed}
        note={<span><b>Policy Gradient:</b> Per-episode updates; watch the agent replay its sampled path after each rollout. <i>Entropy</i> shows exploration.</span>}
      />

      <div className="grid md:grid-cols-3 gap-3">
        <Card title="Grid">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Legend />
              {learned && <Pill tone="green">Learned at ep {learnedAtEp}</Pill>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Toggle label="Values" value={showValues} onChange={setShowValues} />
              <Toggle label="Last episode path" value={showLastPath} onChange={setShowLastPath} />
              <Toggle label="My learned path" value={showLearnedPath} onChange={setShowLearnedPath} />
              <Toggle label="Shortest path (BFS)" value={showBFS} onChange={setShowBFS} />
            </div>
          </div>

          <Grid
            env={env}
            agentState={agentS}
            policy={policy}
            values={values}
            showValues={showValues}
            highlightPath={
              showLastPath ? lastPath :
              (showLearnedPath && greedyPath) ? greedyPath :
              (showBFS || autoShowOptimal) ? optPath : null
            }
            showPathOrder={showLastPath}
            edit
            onToggleTrap={i=>{ const traps=env.traps.includes(i)? env.traps.filter(t=>t!==i):[...env.traps,i]; const e=makeGridEnv({...env,traps}); setEnv(e); setOptPath(shortestPathStates(e)); }}
            onToggleWall={i=>{ const walls=env.walls.includes(i)? env.walls.filter(t=>t!==i):[...env.walls,i]; const e=makeGridEnv({...env,walls}); setEnv(e); setOptPath(shortestPathStates(e)); }}
            onSetGoal={i=>{ const e=makeGridEnv({...env,goal:i}); setEnv(e); setOptPath(shortestPathStates(e)); }}
          />
          {learnedBanner}
          {doneBanner}
        </Card>

        <Card title="Progress" subtitle="Returns & Entropy">
          <div className="text-xs text-zinc-600 mb-2">Episode {ep} / {epCap} • Last return {epRet.toFixed(1)}</div>
          <Sparkline series={returns} />
          <div className="mt-2">
            <div className="text-xs text-zinc-600 mb-1">Avg entropy per episode</div>
            <Sparkline series={entropyHist} />
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Num label="Episode cap" value={epCap} onChange={setEpCap} step={10} min={10} max={2000} />
            <Num label="γ (discount)" value={gamma} onChange={setGamma} step={0.01} min={0} max={0.999} />
            <Num label="lr (policy)" value={lr} onChange={setLr} step={0.005} min={0.005} max={0.5} />
            <Num label="entropy coef" value={entropyCoef} onChange={setEntropyCoef} step={0.005} min={0} max={0.2} />
          </div>
          <div className="mt-2 text-xs">
            {optPath ? <>Shortest steps to goal (BFS): <b>{optPath.length-1}</b></> : "Goal unreachable (BFS)."}
            {learned && <div className="mt-1 text-emerald-700 font-medium">✓ Matched BFS 3× consecutively</div>}
          </div>
        </Card>

        <Card title="Episode log" subtitle="Latest first (50 max)">
          <div className="text-xs space-y-1 max-h-56 overflow-auto">
            {episodeLog.map((e,i)=>(
              <div key={i} className="grid grid-cols-5 gap-2">
                <span>Ep {e.ep}</span>
                <span className={e.outcome==="goal"?"text-emerald-700":e.outcome==="trap"?"text-rose-700":"text-zinc-600"}>{e.outcome}</span>
                <span>steps {e.steps}</span>
                <span>return {e.ret}</span>
                <span title="avg policy entropy">H≈{e.entropy}</span>
              </div>
            ))}
            {episodeLog.length===0 && <div className="text-zinc-500">No episodes yet.</div>}
          </div>
          <TheoryCard
            title="Entropy intuition"
            notes={[
              "High entropy: actions have similar probabilities → exploration.",
              "Low entropy: one action dominates → exploitation.",
              "If stuck early, increase entropy coefficient briefly.",
            ]}
          />
        </Card>
      </div>
    </div>
  );
}


/* ========== DQN (Deep Q-Network) ========== */
const oneHot16=i=>{ const v=new Array(16).fill(0); v[i]=1; return v; };
// Huber
const huberLossFn = (yTrue, yPred) => tf.tidy(() => {
  const delta = tf.scalar(1);
  const err   = tf.abs(tf.sub(yTrue, yPred));
  const quad  = tf.minimum(err, delta);
  const lin   = tf.sub(err, quad);
  const loss  = tf.add(tf.mul(0.5, tf.square(quad)), tf.mul(delta, lin));
  return loss.mean();
});
function buildDQN(lr=0.0007){
  const m=tf.sequential();
  m.add(tf.layers.dense({units:64,activation:"relu",inputShape:[16]}));
  m.add(tf.layers.dense({units:64,activation:"relu"}));
  m.add(tf.layers.dense({units:4}));
  m.compile({optimizer:tf.train.adam(lr),loss:huberLossFn});
  return m;
}
async function copyWeights(from,to){ const w=from.getWeights(); to.setWeights(w); }
const SHOULD_DISPOSE_TF=(typeof process!=="undefined" && process.env && process.env.NODE_ENV==="production");

function DQNTab({ envConfig }){
  const [env,setEnv]=useState(()=>makeGridEnv(envConfig));
  const [gamma,setGamma]=useState(0.95);
  const [lr,setLr]=useState(0.0007);
  const [eps,setEps]=useState(0.35);
  const EPS_MIN = 0.02;
  const [speed,setSpeed]=useState(40);
  const [auto,setAuto]=useState(false);
  const [showValues,setShowValues]=useState(false);
  const [showBFS,setShowBFS]=useState(false);
  const [autoShowOptimal, setAutoShowOptimal] = useState(false);

  const modelRef=useRef(null), targetRef=useRef(null);
  const stepRef=useRef(0), bufferRef=useRef([]), trainingRef=useRef(false), disposedRef=useRef(false), activeOpsRef=useRef(0);
  const [s,setS]=useState(env.start);
  const [ep,setEp]=useState(0); const [epRet,setEpRet]=useState(0); const [stepsInEp,setStepsInEp]=useState(0);
  const [returns,setReturns]=useState([]); const [lossSmoothed,setLossSmoothed]=useState(0); const [bufferFill,setBufferFill]=useState(0);
  const [batch,setBatch]=useState(64); const [bufferCap,setBufferCap]=useState(5000); const [targetSync,setTargetSync]=useState(800);
  const [epPath,setEpPath]=useState([env.start]);
  const [epCap,setEpCap]=useState(1200);
  const [episodeLog,setEpisodeLog]=useState([]);
  const [optPath,setOptPath]=useState(shortestPathStates(env));
  const [greedyPath,setGreedyPath]=useState(null);
  const [optStreak,setOptStreak]=useState(0);
  const [learned,setLearned]=useState(false);
  const [learnedAtEp,setLearnedAtEp]=useState(null);
  const [showLastPath,setShowLastPath]=useState(false);
  const [showLearnedPath,setShowLearnedPath]=useState(true);
  const [epsHistory,setEpsHistory]=useState([0.35]);
  const exploredRef=useRef(0); const exploitedRef=useRef(0);

  // ---- helpers (with masking)
  const maskedArgmax = (qRow, acts) => {
    let bestA = acts[0] ?? 0;
    let bestV = -Infinity;
    for (const a of acts) {
      const v = qRow[a];
      if (v > bestV) { bestV = v; bestA = a; }
    }
    return bestA;
  };

  // init models
  useEffect(()=>{ const m=buildDQN(lr), t=buildDQN(lr); modelRef.current=m; targetRef.current=t; copyWeights(m,t); disposedRef.current=false;
    return ()=>{ disposedRef.current=true; trainingRef.current=false; if(!SHOULD_DISPOSE_TF){ modelRef.current=null; targetRef.current=null; return; }
      const wait=async()=>{ while(activeOpsRef.current>0){ await new Promise(r=>setTimeout(r,0)); } m.dispose(); t.dispose(); if(modelRef.current===m) modelRef.current=null; if(targetRef.current===t) targetRef.current=null; }; wait();
    };
  },[]);
  useEffect(()=>{ if(!modelRef.current||!targetRef.current) return; modelRef.current.compile({optimizer:tf.train.adam(lr),loss:huberLossFn}); targetRef.current.compile({optimizer:tf.train.adam(lr),loss:huberLossFn}); },[lr]);
  useEffect(()=>{ const e=makeGridEnv(envConfig); setEnv(e);
    bufferRef.current=[]; setS(e.start); setEp(0); setEpRet(0); setStepsInEp(0); setReturns([]);
    stepRef.current=0; setBufferFill(0); setLossSmoothed(0); setEpisodeLog([]); setEpPath([e.start]);
    setOptPath(shortestPathStates(e)); setGreedyPath(null); setOptStreak(0); setLearned(false); setLearnedAtEp(null);
    exploredRef.current=0; exploitedRef.current=0; setEpsHistory([eps]); setShowLearnedPath(true);
    setAutoShowOptimal(false);
  },[envConfig]);

  const greedyActionFromQ=(qRow, state)=>{
    const acts = env.validActions(state);
    return maskedArgmax(qRow, acts);
  };
  const predictQAllStates=model=>{ activeOpsRef.current++; try { return tf.tidy(()=>{ const xs=tf.tensor2d(Array.from({length:16},(_,i)=>oneHot16(i))); const q=model.predict(xs); return q.arraySync(); }); } finally { activeOpsRef.current--; } };

  async function trainBatch(){
    if(disposedRef.current || !modelRef.current || !targetRef.current) return;
    if(trainingRef.current) return;
    const buf=bufferRef.current; if(buf.length<batch) return;
    trainingRef.current=true; activeOpsRef.current++;
    try{
      const idxs=Array.from({length:batch},()=>Math.floor(Math.random()*buf.length));
      const samples=idxs.map(i=>buf[i]);
      const states=samples.map(e=>oneHot16(e.s));
      const nextStates=samples.map(e=>oneHot16(e.ns));
      const [qNextMax, qcArr]=(()=>{
        const qnMaxArr=tf.tidy(()=>{ const ns=tf.tensor2d(nextStates); const qn=targetRef.current.predict(ns); const qnMax=qn.max(1); return Array.from(qnMax.dataSync()); });
        const qcArray=tf.tidy(()=>{ const s=tf.tensor2d(states); const qc=modelRef.current.predict(s); return qc.arraySync(); });
        return [qnMaxArr,qcArray];
      })();
      const targets=[]; for(let i=0;i<batch;i++){
        const e=samples[i];
        const y=qcArr[i].slice();
        const targetQ=e.r + (e.done?0:gamma*qNextMax[i]);
        y[e.a]=targetQ;
        targets.push(y);
      }
      const xT=tf.tensor2d(states), yT=tf.tensor2d(targets);
      const hist=await modelRef.current.fit(xT,yT,{epochs:1,batchSize:batch,verbose:0}); xT.dispose(); yT.dispose();
      if(!disposedRef.current){ const loss=hist.history.loss[0]; setLossSmoothed(prev=>prev? prev*0.9+0.1*loss : loss); }
    } finally { activeOpsRef.current--; trainingRef.current=false; }
  }

  function onEpisodeEnd(ns, doneFlag){
    const ret = epRet;
    const steps = epPath.length-1;
    const outcome = doneFlag ? (ns===env.goal ? "goal" : env.isTrap(ns) ? "trap" : "done") : "timeout";
    setEpisodeLog(log=>[{ep:ep+1, outcome, steps, ret:Number(ret.toFixed(2)), explored: exploredRef.current, exploited: exploitedRef.current}, ...log.slice(0,49)]);
    setReturns(rs=>[...rs.slice(-199), ret]);

    if(modelRef.current){
      const qAll=predictQAllStates(modelRef.current);
      const selector=(state)=> greedyActionFromQ(qAll[state], state); // ✅ masked
      const gp = simulateGreedy(env, selector);
      setGreedyPath(gp.path);
      const optimal = (gp.outcome==="goal" && optPath && gp.path.length===optPath.length);
      setOptStreak(k=> optimal ? k+1 : 0);
      if(optimal && (optStreak+1)>=3 && !learned){
        setLearned(true); setLearnedAtEp(ep+1);
        setAutoShowOptimal(true);
      }
    }

    setEp(e=>e+1); setEpRet(0); setStepsInEp(0); setEpPath([env.start]);
    setEps(e=>{ const v=Math.max(EPS_MIN, e*0.995); setEpsHistory(h=>[...h.slice(-199), v]); return v; });
    exploredRef.current=0; exploitedRef.current=0;
    if(auto && ep+1>=epCap){ setAuto(false); setAutoShowOptimal(true); }
  }

  async function stepOnce(){
    if(disposedRef.current || !modelRef.current) return;
    let a;
    const acts = env.validActions(s);
    if(Math.random()<eps){
      a=acts[Math.floor(Math.random()*acts.length)];
      exploredRef.current += 1;
    } else {
      activeOpsRef.current++;
      try{
        const arr=tf.tidy(()=>{ const x=tf.tensor2d([oneHot16(s)]); const y=modelRef.current.predict(x); return y.arraySync()[0]; });
        a=maskedArgmax(arr, acts); // ✅ masked exploit
      } finally { activeOpsRef.current--; }
      exploitedRef.current += 1;
    }
    const {ns,r,done}=env.step(s,a,Math.random);
    const buf=bufferRef.current; if(buf.length>=bufferCap) buf.shift(); buf.push({s,a,r,ns,done}); setBufferFill(buf.length/bufferCap);
    setS(done?env.start:ns); setEpRet(v=>v+r); setStepsInEp(v=>v+1); setEpPath(p=>[...p, ns]);
    if(done || stepsInEp+1>=env.maxSteps){ onEpisodeEnd(ns, done); }
    stepRef.current += 1;
    if(stepRef.current % targetSync === 0 && !disposedRef.current && targetRef.current){ await copyWeights(modelRef.current, targetRef.current); }
    await trainBatch();
  }
  useInterval(()=>{ (async()=>{ for(let i=0;i<speed;i++) await stepOnce(); })(); }, 60, auto);

  const [policy,setPolicy]=useState(null); const [values,setValues]=useState(null);
  useEffect(()=>{
    if(!modelRef.current || disposedRef.current) return;
    const qAll=predictQAllStates(modelRef.current);

    // Normalize per-row and zero-out invalid actions for display;
    // Values = max over valid actions only
    const pol = qAll.map((row, sIdx) => {
      const acts = env.validActions(sIdx);
      const allowedVals = acts.map(a => row[a]);
      const minR = Math.min(...allowedVals);
      const maxR = Math.max(...allowedVals);
      const norm = (v)=> (maxR===minR ? 0.5 : (v - minR) / (maxR - minR));
      const out = [0,0,0,0];
      for (let a=0;a<4;a++){
        out[a] = acts.includes(a) ? clamp(norm(row[a]), 0, 1) : 0;
      }
      return out;
    });
    const vals = qAll.map((row, sIdx) => {
      const acts = env.validActions(sIdx);
      return Math.max(...acts.map(a=>row[a]));
    });

    setPolicy(pol); setValues(vals);
  },[lossSmoothed,ep,s,eps,env]);

  useEffect(()=>{ if (learned && auto) setAuto(false); }, [learned, auto]);

  const endSummary = (auto===false && ep>0 && (episodeLog[0]?.ep||0) >= epCap) ? (
    <div className="mt-2 p-2 rounded bg-emerald-50 text-emerald-800 text-xs">
      <b>Run finished.</b> ε decayed to {eps.toFixed(3)}. {learned ? "Optimal path learned 🎉" : "Try larger replay buffer or slower target sync."}
    </div>
  ) : null;

  const learnedBanner = learned ? (
    <div className="mt-2 p-2 rounded bg-emerald-100 text-emerald-900 text-xs font-medium">
      ✓ Optimized path learned (matched BFS 3×) {learnedAtEp ? `at episode ${learnedAtEp}` : ""}.
    </div>
  ) : null;

  const doneBanner = (autoShowOptimal && optPath) ? (
    <div className="mt-2 p-2 rounded bg-emerald-50 text-emerald-900 text-xs">
      <b>Finished!</b> Showing the <b>shortest (BFS) path</b>. Press Play to train again (this overlay will hide).
    </div>
  ) : null;

  const pathPanel = (
    <div className="mt-2 text-xs text-zinc-700">
      <div className="flex gap-3 flex-wrap">
        <div><b>BFS shortest</b>: {optPath ? optPath.length-1 : "—"}</div>
        <div><b>Greedy path now</b>: {greedyPath ? greedyPath.length-1 : "—"}</div>
        <div><b>Gap</b>: {(optPath && greedyPath) ? (greedyPath.length - optPath.length) : "—"}</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <ControlBar
        auto={auto}
        onToggleAuto={()=>setAuto(a=>{ const next=!a; if(next) setAutoShowOptimal(false); return next; })}
        onStep={stepOnce}
        onReset={()=>{
          bufferRef.current=[]; setBufferFill(0);
          setEp(0); setEpRet(0); setStepsInEp(0); setReturns([]);
          setEps(0.35); setEpisodeLog([]); setEpPath([env.start]);
          setLearned(false); setLearnedAtEp(null); setOptStreak(0);
          exploredRef.current=0; exploitedRef.current=0; setEpsHistory([0.35]);
          setShowLearnedPath(true); setAutoShowOptimal(false);
          setGreedyPath(null); // ✅ clear learned path
        }}
        speed={speed}
        setSpeed={setSpeed}
        note={<span><b>DQN:</b> Neural net Q(s,·) + replay + target net. Auto-stops after matching BFS 3×.</span>}
      />

      {/* Newbie quick preset */}
      <Card>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            className="px-3 py-2 rounded-md border bg-zinc-900 text-white"
            onClick={()=>{
              const e = makeGridEnv({ ...env, traps: [], walls: [], slipProb: 0.0, rewards: { ...env.rewards, goal: 12, trap: -6, step: -1, wallBump: -2 } });
              setEnv(e); setOptPath(shortestPathStates(e));
              setLr(0.0007); setEps(0.35); setEpsHistory([0.35]); setBatch(64); setBufferCap(5000); setTargetSync(800); setEpCap(1200);
              bufferRef.current = []; setEpisodeLog([]); setReturns([]); setEp(0); setEpRet(0); setStepsInEp(0); setS(e.start); setEpPath([e.start]); setLearned(false); setLearnedAtEp(null); setOptStreak(0); setShowLearnedPath(true); setAutoShowOptimal(false); setGreedyPath(null); setAuto(true);
            }}
            title="Sets an easy environment & tuned hyperparams, then starts training."
          >
            Train to Optimal (Newbie)
          </button>

          <span className="text-zinc-600">
            Tip: toggle <b>Shortest path (BFS)</b> to see the theoretical route. When the learned path matches it 3×, training pauses and the BFS overlay appears.
          </span>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-3">
        <Card title="Grid">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Legend />
              {learned && <Pill tone="green">Learned at ep {learnedAtEp}</Pill>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Toggle label="Values" value={showValues} onChange={setShowValues} />
              <Toggle label="Last episode path" value={showLastPath} onChange={setShowLastPath} />
              <Toggle label="My learned path" value={showLearnedPath} onChange={setShowLearnedPath} />
              <Toggle label="Shortest path (BFS)" value={showBFS} onChange={setShowBFS} />
            </div>
          </div>
          <Grid
            env={env}
            agentState={s}
            policy={policy}
            values={values}
            showValues={showValues}
            highlightPath={
              showLastPath ? epPath :
              (learned && showLearnedPath) ? greedyPath :
              (showBFS || autoShowOptimal) ? optPath : null
            }
            showPathOrder={showLastPath}
            edit
            onToggleTrap={i=>{ const traps=env.traps.includes(i)? env.traps.filter(t=>t!==i):[...env.traps,i]; const e=makeGridEnv({...env,traps}); setEnv(e); setOptPath(shortestPathStates(e)); }}
            onToggleWall={i=>{ const walls=env.walls.includes(i)? env.walls.filter(t=>t!==i):[...env.walls,i]; const e=makeGridEnv({...env,walls}); setEnv(e); setOptPath(shortestPathStates(e)); }}
            onSetGoal={i=>{ const e=makeGridEnv({...env,goal:i}); setEnv(e); setOptPath(shortestPathStates(e)); }}
          />
          {learnedBanner}
          {doneBanner}
          {pathPanel}
          {endSummary}
        </Card>

        <Card title="Progress" subtitle="Returns, ε & Loss">
          <div className="text-xs text-zinc-600 mb-2">
            Episode {ep} / {epCap} • Steps {stepsInEp} • Return {epRet.toFixed(1)} • Loss {lossSmoothed?lossSmoothed.toFixed(4):"—"} • ε {eps.toFixed(3)}
          </div>
          <Sparkline series={returns} />
          <div className="mt-2">
            <div className="text-xs text-zinc-600 mb-1">ε history</div>
            <Sparkline series={epsHistory} />
          </div>
          <div className="mt-2 text-xs text-zinc-600">Replay buffer: {Math.round(bufferFill*100)}%</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Num label="Episode cap" value={epCap} onChange={setEpCap} step={10} min={10} max={2000} />
            <Num label="γ (discount)" value={gamma} onChange={setGamma} step={0.01} min={0} max={0.999} />
            <Num label="lr" value={lr} onChange={setLr} step={0.0005} min={0.0001} max={0.01} />
            <Num label="Target sync" value={targetSync} onChange={setTargetSync} step={50} min={50} max={2000} />
          </div>
          <div className="mt-2 text-xs">
            {optPath ? <>Shortest steps to goal (BFS): <b>{optPath.length-1}</b></> : "Goal unreachable (BFS)."}
            {learned && <div className="mt-1 text-emerald-700 font-medium">✓ Matched BFS 3× consecutively</div>}
          </div>
        </Card>

        <Card title="Episode log" subtitle="Latest first (50 max)">
          <div className="text-xs space-y-1 max-h-56 overflow-auto">
            {episodeLog.map((e,i)=>(
              <div key={i} className="grid grid-cols-6 gap-2">
                <span>Ep {e.ep}</span>
                <span className={e.outcome==="goal"?"text-emerald-700":e.outcome==="trap"?"text-rose-700":"text-zinc-600"}>{e.outcome}</span>
                <span>steps {e.steps}</span>
                <span>return {e.ret}</span>
                <span title="explore">explr {e.explored}</span>
                <span title="exploit">explt {e.exploited}</span>
              </div>
            ))}
            {episodeLog.length===0 && <div className="text-zinc-500">No episodes yet.</div>}
          </div>
          <TheoryCard
            title="DQN Notes for Newbies"
            notes={[
              "Two nets: online learns, target stabilizes the bootstrap (copy periodically).",
              "Replay buffer breaks correlation: sample past transitions randomly.",
              "ε-greedy balances trying new routes vs. using the best known route; decay ε gradually.",
              "Huber loss is robust to outliers.",
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

/* ========== Root ========== */
export default function ReinforcementLearning() {
  const [tab,setTab]=useState("dqn");
  const [envConfig,setEnvConfig]=useState({
    size:4, start:0, goal:15,
    traps:[5,10], walls:[],
    rewards:{ step:-1.0, goal:12, trap:-6, wallBump:-2 },
    slipProb:0.0, maxSteps:50
  });

  return (
    <div className="mx-auto max-w-5xl p-3 sm:p-4">
      <motion.h1 initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.25}} className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
        RL GridWorld — Beginner Mode
      </motion.h1>
      <div className="text-xs sm:text-sm text-zinc-600 mb-3">
        Learn RL by editing a tiny 4×4 world. Toggle overlays to see the shortest path (BFS), your agent’s current plan, and the last episode’s path.
      </div>

      {/* Beginner “How it works” quick panel */}
      <Card>
        <div className="text-xs sm:text-sm text-zinc-700 grid gap-2 sm:grid-cols-3">
          <div><b>Goal:</b> reach the green cell. Traps (red) end the episode with a penalty. Walls block movement.</div>
          <div><b>Train:</b> hit <b>Play</b>. Watch returns go up and ε/entropy go down as it commits to a route.</div>
          <div><b>Edit world:</b> tap = toggle trap • long-press/right-click = wall • double-tap = set goal.</div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2 my-3">
        {[
          {id:"q", label:"Q-Learning"},
          {id:"dqn", label:"DQN"},
          {id:"pg", label:"Policy Gradient"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-md border px-3 py-2 text-sm ${tab===t.id?"bg-zinc-900 text-white":"bg-white"}`}>{t.label}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-3">
        <Card title="Environment" subtitle="Rewards & dynamics">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Num label="Step" value={envConfig.rewards.step} onChange={v=>setEnvConfig({...envConfig, rewards:{...envConfig.rewards, step:v}})} step={1} min={-5} max={0} />
            <Num label="Goal" value={envConfig.rewards.goal} onChange={v=>setEnvConfig({...envConfig, rewards:{...envConfig.rewards, goal:v}})} step={1} min={1} max={50} />
            <Num label="Trap" value={envConfig.rewards.trap} onChange={v=>setEnvConfig({...envConfig, rewards:{...envConfig.rewards, trap:v}})} step={1} min={-50} max={0} />
            <Num label="Wall" value={envConfig.rewards.wallBump} onChange={v=>setEnvConfig({...envConfig, rewards:{...envConfig.rewards, wallBump:v}})} step={1} min={-10} max={0} />
            <Num label="Slip" value={envConfig.slipProb} onChange={v=>setEnvConfig({...envConfig, slipProb:clamp(v,0,0.5)})} step={0.01} min={0} max={0.5} />
            <Num label="Max steps" value={envConfig.maxSteps} onChange={v=>setEnvConfig({...envConfig, maxSteps:v})} step={1} min={5} max={200} />
          </div>
          <div className="mt-2 text-xs text-zinc-600">Tap = trap • Long-press/right-click = wall • Double-tap = goal.</div>
        </Card>

        <Card title="Layout editor" subtitle="Click to edit">
          <Grid
            env={makeGridEnv(envConfig)}
            agentState={envConfig.start}
            policy={null}
            values={null}
            edit
            onToggleTrap={i=>{ const traps=envConfig.traps.includes(i)? envConfig.traps.filter(x=>x!==i):[...envConfig.traps,i]; setEnvConfig({...envConfig,traps}); }}
            onToggleWall={i=>{ const walls=envConfig.walls.includes(i)? envConfig.walls.filter(x=>x!==i):[...envConfig.walls,i]; setEnvConfig({...envConfig,walls}); }}
            onSetGoal={i=> setEnvConfig({...envConfig, goal:i})}
          />
        </Card>

        <Card title="Quick glossary & newbie tips">
          <Glossary />
          <div className="text-xs text-zinc-600 mt-2 space-y-1">
            <div><b>Explore first:</b> start with higher ε / entropy.</div>
            <div><b>Commit later:</b> decay ε / entropy so the policy locks onto the good path.</div>
            <div><b>Compare:</b> toggle the BFS overlay to see the theoretical shortest route.</div>
          </div>
        </Card>
      </div>

      <AnimatePresence mode="wait">
        {tab==="q" && (
          <motion.div key="q" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}}>
            <QLearningTab envConfig={envConfig} />
          </motion.div>
        )}
        {tab==="dqn" && (
          <motion.div key="dqn" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}}>
            <DQNTab envConfig={envConfig} />
          </motion.div>
        )}
        {tab==="pg" && (
          <motion.div key="pg" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}}>
            <PGTab envConfig={envConfig} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
