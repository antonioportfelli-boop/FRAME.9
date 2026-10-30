import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity, ArrowUpRight, BookOpen, Boxes, Check, ChevronDown, CircleAlert,
  Command, FileSearch, GitBranch, LayoutDashboard, LockKeyhole, Menu,
  Network, Search, ShieldCheck, Signal, SlidersHorizontal, Workflow, X,
} from "lucide-react";

export const Route = createFileRoute("/trinity")({ component: TrinityWorkspace });

type Tab = "overview" | "corpus" | "genealogy" | "interpretation" | "signals" | "commands" | "plugins" | "audit";
const nav: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "corpus", label: "Corpus explorer", icon: BookOpen },
  { id: "genealogy", label: "Genealogy graph", icon: Network },
  { id: "interpretation", label: "Interpretation lab", icon: FileSearch },
  { id: "signals", label: "Signal lab", icon: Activity },
  { id: "commands", label: "Kratt command blocks", icon: Workflow },
  { id: "plugins", label: "Plugin registry", icon: Boxes },
  { id: "audit", label: "Audit & settings", icon: ShieldCheck },
];

const events = [
  { time: "09:42:18", title: "Semantic fixture validated", detail: "tanakh-genealogy-fixture-03", state: "PASS" },
  { time: "09:39:04", title: "Interpretation candidate created", detail: "Rule HIL-07 · reviewer required", state: "REVIEW" },
  { time: "09:31:52", title: "Synthetic observation ingested", detail: "SIM-NEURO-02 · 128 Hz", state: "SYNTHETIC" },
];

function TrinityWorkspace() {
  const [active, setActive] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const activeLabel = nav.find((item) => item.id === active)?.label ?? "Overview";
  const filteredEvents = useMemo(
    () => events.filter((event) => (event.title + event.detail).toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <main className="flex h-[100dvh] min-h-0 bg-[#090e13] text-[#e8eef2]">
      {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-white/10 bg-[#0c131a] transition-transform lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200"><Workflow size={19}/></div>
          <div><div className="text-sm font-semibold tracking-[0.16em]">FRAME<span className="text-cyan-300">.9</span></div><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Trinity workspace</div></div>
          <button className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={17}/></button>
        </div>
        <div className="px-4 pt-5"><div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Workspace</div>
          <nav className="space-y-1" aria-label="Main navigation">
            {nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setActive(id); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${active === id ? "border border-cyan-300/15 bg-cyan-300/10 text-cyan-100" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"}`}><Icon size={16}/><span>{label}</span>{id === "interpretation" && <span className="ml-auto rounded-md bg-amber-300/10 px-1.5 py-0.5 text-[10px] text-amber-200">3</span>}</button>)}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 p-4">
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-3"><div className="flex items-center gap-2 text-xs font-medium text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300"/>Local simulation mode</div><p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">External devices and clinical actions are disabled.</p></div>
          <div className="mt-3 flex items-center justify-between px-1 text-[10px] text-slate-600"><span>TRINITY CORE</span><span>v0.1.0 · DEV</span></div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/10 bg-[#0c131a]/90 px-4 sm:px-7">
          <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19}/></button>
          <div className="min-w-0"><div className="truncate text-[11px] text-slate-500">FRAME.9 <span className="px-1.5 text-slate-700">/</span> Trinity <span className="px-1.5 text-slate-700">/</span> <span className="text-slate-300">{activeLabel}</span></div><div className="mt-1 text-sm font-semibold">{activeLabel}</div></div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <label className="hidden h-9 w-52 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 md:flex"><Search size={14} className="text-slate-500"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search workspace…" className="w-full bg-transparent text-xs outline-none placeholder:text-slate-600"/></label>
            <span className="hidden rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-2.5 py-1.5 text-[10px] font-medium text-amber-200 sm:inline-flex">DEVELOPMENT</span>
            <button className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5" aria-label="Filters"><SlidersHorizontal size={16}/></button>
            <div className="grid h-8 w-8 place-items-center rounded-full border border-cyan-200/20 bg-cyan-200/10 text-[11px] font-semibold text-cyan-100">TW</div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1500px] p-4 sm:p-7">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div><div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300"><span className="h-1 w-5 bg-cyan-300"/> Trinity control surface</div><h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">Research, inspect, validate.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">A source-grounded workspace for semantic structures, human-reviewed interpretations and safe simulation.</p></div>
              <button onClick={() => setActive("commands")} className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-300/10 px-4 py-2.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/15"><Command size={15}/> Open command inspector <ArrowUpRight size={14}/></button>
            </div>

            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3.5"><CircleAlert size={17} className="mt-0.5 shrink-0 text-amber-200"/><div><div className="text-xs font-semibold text-amber-100">Research prototype · non-clinical</div><p className="mt-1 text-[11px] leading-relaxed text-amber-100/65">Signal Lab uses synthetic fixtures only. This workspace does not diagnose, recommend treatment, control implants or connect to physical neurodevices.</p></div></div>

            {active === "overview" && <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric icon={GitBranch} label="Semantic assertions" value="1,284" note="Across 6 local fixtures" />
                <Metric icon={FileSearch} label="Review queue" value="03" note="Human review required" accent="amber"/>
                <Metric icon={Signal} label="Synthetic observations" value="248" note="No physical device source" />
                <Metric icon={ShieldCheck} label="Command policy" value="LOCKED" note="Dry-run · approval gated" accent="green"/>
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
                <Panel title="Recent activity" subtitle="Local simulation event stream" action="View audit"><div className="divide-y divide-white/[0.06]">{filteredEvents.map((event) => <div key={event.time} className="flex flex-wrap items-center gap-3 py-4 first:pt-1 last:pb-1"><div className="font-mono text-[10px] text-slate-600">{event.time}</div><div className="min-w-0 flex-1"><div className="text-xs font-medium text-slate-200">{event.title}</div><div className="mt-1 truncate text-[11px] text-slate-500">{event.detail}</div></div><StateTag value={event.state}/></div>)}</div></Panel>
                <Panel title="Review required" subtitle="Interpretation candidates awaiting a person"><div className="space-y-3"><div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3"><div className="flex items-center justify-between"><span className="text-xs font-semibold">HIL-07 · Parallel structure</span><StateTag value="PENDING"/></div><p className="mt-2 text-[11px] leading-relaxed text-slate-400">Two candidate readings share partial textual evidence. Alternative retained pending source review.</p><button onClick={() => setActive("interpretation")} className="mt-3 text-[11px] font-semibold text-cyan-200 hover:text-cyan-100">Compare candidates →</button></div><div className="flex items-center gap-2 text-[11px] text-slate-500"><LockKeyhole size={13}/> No autonomous acceptance or execution</div></div></Panel>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2"><Panel title="Domain boundaries" subtitle="Separated by design"><Boundary title="Textual-semantic domain" detail="Passages · assertions · interpretive rules · provenance" /><Boundary title="Biomedical / signal domain" detail="Synthetic observations · units · timestamps · device metadata" /><div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.04] p-3 text-[11px] leading-relaxed text-cyan-100/80">Cross-domain associations require an explicit reviewed link. They are never inferred as clinical facts.</div></Panel><Panel title="System readiness" subtitle="Current development snapshot"><Readiness label="UI shell" value="Prototype route" /><Readiness label="Lockfile JSON" value="Repaired · parse verified" good/><Readiness label="Semantic engine" value="Next implementation step" /><Readiness label="Physical device access" value="Disabled by policy" good/></Panel></div>
            </>}

            {active === "corpus" && <Panel title="Corpus explorer" subtitle="Source-first textual workspace"><div className="grid gap-4 lg:grid-cols-[280px_1fr]"><div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-slate-500">Edition</label><div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs">Tanakh · demo corpus <ChevronDown className="float-right" size={14}/></div><label className="block pt-3 text-[10px] uppercase tracking-widest text-slate-500">Passage</label><div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-3 text-xs text-cyan-100">Genesis 1 · synthetic fixture</div></div><div className="rounded-xl border border-white/[0.08] bg-[#0a1117] p-5"><div className="mb-3 text-[10px] uppercase tracking-widest text-slate-500">Source text preview · illustrative fixture</div><p className="max-w-2xl text-sm leading-8 text-slate-200">The selected passage is represented here as a source-linked text region. Imported editions, exact wording, translation metadata and citations must be supplied by a verified corpus connector.</p><div className="mt-5 flex flex-wrap gap-2"><StateTag value="SOURCE REQUIRED"/><StateTag value="NO INTERPRETATION APPLIED"/></div></div></div></Panel>}

            {active === "genealogy" && <Panel title="Genealogy explorer" subtitle="Assertions are source-linked, not genetic or clinical facts"><div className="grid gap-3 md:grid-cols-2"><Relationship from="Person A" to="Person B" status="ATTESTED" source="Fixture passage G-01"/><Relationship from="Person B" to="Person C" status="PROPOSED" source="Fixture passage G-02"/><Relationship from="Person A" to="Person D" status="DISPUTED" source="Fixture passage G-03"/></div><p className="mt-4 text-[11px] text-slate-500">Graph canvas will be added after the assertion model and accessible list view are validated.</p></Panel>}

            {active === "interpretation" && <Panel title="Interpretation lab" subtitle="Compare candidates without discarding alternatives"><div className="grid gap-3 lg:grid-cols-2"><Candidate title="Candidate A" rule="Hillel · inference pattern" matched="2 matched evidence items" missing="1 missing source reference"/><Candidate title="Candidate B" rule="Parallelism · structural reading" matched="1 matched evidence item" missing="2 missing source references"/></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-3"><div className="text-[11px] text-amber-100/80">A reviewer decision is required. This UI does not declare a reading authoritative.</div><button onClick={() => setReviewed(true)} className="rounded-lg border border-amber-200/20 px-3 py-2 text-[11px] font-semibold text-amber-100">{reviewed ? "Review recorded locally" : "Record review placeholder"}</button></div></Panel>}

            {active === "signals" && <Panel title="Signal lab" subtitle="Synthetic fixtures only"><div className="mb-4 rounded-lg border border-fuchsia-300/20 bg-fuchsia-300/[0.06] p-3 text-xs font-semibold text-fuchsia-100">SYNTHETIC DATA · NOT A LIVE SENSOR</div><div className="grid gap-3 sm:grid-cols-3"><Metric icon={Activity} label="Sample rate" value="128 Hz" note="Simulated stream"/><Metric icon={Signal} label="Channel count" value="04" note="Fixture metadata"/><Metric icon={ShieldCheck} label="Clinical use" value="PROHIBITED" note="No decision support"/></div><div className="mt-4 rounded-xl border border-white/[0.08] p-4"><div className="mb-3 text-xs font-semibold">Synthetic signal preview</div><div className="flex h-24 items-end gap-1">{Array.from({length:64},(_,i)=><div key={i} className="flex-1 rounded-t-sm bg-cyan-300/50" style={{height:`${18+((i*17+i*i*3)%70)}%`}}/>)}</div><div className="mt-2 text-[10px] text-slate-600">Illustrative waveform only · no measured human data</div></div></Panel>}

            {active === "commands" && <Panel title="Kratt command inspector" subtitle="Deny-by-default capability model · no live execution"><div className="rounded-xl border border-white/10 bg-[#080e13] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-semibold">semantic.fixture.validate</div><div className="mt-1 text-[10px] text-slate-500">Local fixture validation · read-only</div></div><StateTag value="DRY-RUN ONLY"/></div><div className="my-4 grid gap-2 sm:grid-cols-3"><Scope name="Read fixture" allowed/><Scope name="Write semantic store" /><Scope name="Physical device control"/></div><button onClick={() => setDryRun(!dryRun)} className="rounded-lg bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-200">{dryRun ? "Hide dry-run preview" : "Preview dry-run"}</button>{dryRun && <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.05] p-3 font-mono text-[11px] leading-6 text-emerald-100"><div>$ validate semantic.fixture.validate</div><div>✓ Manifest schema valid</div><div>✓ Requested scope: read-only fixture</div><div>✓ External capability requests: none</div><div>! Execution not performed — preview only</div></div>}</div><div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500"><LockKeyhole size={14}/> No production execution, external device access or unattended agent action is exposed.</div></Panel>}

            {active === "plugins" && <Panel title="Plugin registry" subtitle="Capability-scoped modules"><div className="grid gap-3 md:grid-cols-2"><Plugin name="Synthetic signal source" version="0.1.0" scope="fixture:read" state="ENABLED"/><Plugin name="Tanakh corpus adapter" version="planned" scope="corpus:read" state="PLANNED"/><Plugin name="Kratt validator" version="planned" scope="command:validate" state="PLANNED"/><Plugin name="Physical device adapter" version="disabled" scope="device:control" state="BLOCKED"/></div></Panel>}

            {active === "audit" && <Panel title="Audit & settings" subtitle="Policy boundaries and event provenance"><div className="space-y-3"><Boundary title="Identity and permissions" detail="User identity and role-based capability checks required before writes."/><Boundary title="Data retention" detail="Retention policy and export controls must be configured per data class."/><Boundary title="Human approval" detail="Interpretation decisions and consequential command execution require explicit review."/><Boundary title="Privacy" detail="No sensitive health or personal data is used in this demonstration."/><Boundary title="Audit events" detail="Every state-changing action must record actor, scope, input hash, outcome and timestamp."/></div></Panel>}
            <footer className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-4 text-[10px] text-slate-600"><span>FRAME.9 · TRINITY CONTROL SURFACE</span><span>SIMULATION ONLY · BUILD NOT YET VERIFIED</span></footer>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({icon: Icon,label,value,note,accent="cyan"}:{icon:typeof Activity;label:string;value:string;note:string;accent?:"cyan"|"amber"|"green"}) {
  const color = accent==="amber" ? "text-amber-200 bg-amber-300/10" : accent==="green" ? "text-emerald-200 bg-emerald-300/10" : "text-cyan-200 bg-cyan-300/10";
  return <div className="rounded-xl border border-white/[0.08] bg-[#101820] p-4"><div className="flex items-center justify-between"><span className="text-[11px] text-slate-500">{label}</span><span className={`rounded-lg p-2 ${color}`}><Icon size={15}/></span></div><div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div><div className="mt-1 text-[10px] text-slate-600">{note}</div></div>;
}
function Panel({title,subtitle,action,children}:{title:string;subtitle:string;action?:string;children:React.ReactNode}) {
  return <section className="rounded-xl border border-white/[0.08] bg-[#101820] p-4 sm:p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-[11px] text-slate-500">{subtitle}</p></div>{action && <button className="text-[10px] text-cyan-200">{action} →</button>}</div>{children}</section>;
}
function StateTag({value}:{value:string}) {
  const c=value==="PASS"||value==="ATTESTED"||value==="ENABLED" ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200" : value==="PENDING"||value==="REVIEW"||value==="DISPUTED" ? "border-amber-300/20 bg-amber-300/[0.06] text-amber-200" : value==="SYNTHETIC" ? "border-fuchsia-300/20 bg-fuchsia-300/[0.06] text-fuchsia-200" : "border-white/10 bg-white/[0.03] text-slate-400";
  return <span className={`rounded-md border px-2 py-1 text-[9px] font-semibold tracking-wide ${c}`}>{value}</span>;
}
function Boundary({title,detail}:{title:string;detail:string}) { return <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3"><div className="text-xs font-medium">{title}</div><div className="mt-1 text-[11px] leading-relaxed text-slate-500">{detail}</div></div>; }
function Readiness({label,value,good=false}:{label:string;value:string;good?:boolean}) { return <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-3 last:border-0"><span className="text-xs text-slate-400">{label}</span><span className={`text-[10px] ${good?"text-emerald-200":"text-amber-200"}`}>{good?"✓ ":""}{value}</span></div>; }
function Relationship({from,to,status,source}:{from:string;to:string;status:string;source:string}) { return <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold">{from} <span className="px-2 text-cyan-300">→</span> {to}</span><StateTag value={status}/></div><div className="mt-2 text-[10px] text-slate-500">Source: {source}</div></div>; }
function Candidate({title,rule,matched,missing}:{title:string;rule:string;matched:string;missing:string}) { return <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"><div className="flex items-center justify-between"><div className="text-sm font-semibold">{title}</div><StateTag value="ALTERNATIVE"/></div><div className="mt-2 text-[11px] text-cyan-200">{rule}</div><div className="mt-4 space-y-2 text-[11px]"><div className="flex items-center gap-2 text-emerald-200"><Check size={13}/>{matched}</div><div className="flex items-center gap-2 text-amber-200"><CircleAlert size={13}/>{missing}</div></div></div>; }
function Scope({name,allowed=false}:{name:string;allowed?:boolean}) { return <div className={`rounded-lg border p-3 ${allowed?"border-emerald-300/20 bg-emerald-300/[0.05]":"border-red-300/15 bg-red-300/[0.04]"}`}><div className="text-[10px] text-slate-400">{name}</div><div className={`mt-1 text-[10px] font-semibold ${allowed?"text-emerald-200":"text-red-200"}`}>{allowed?"ALLOWED":"DENIED"}</div></div>; }
function Plugin({name,version,scope,state}:{name:string;version:string;scope:string;state:string}) { return <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"><div className="flex items-center justify-between gap-2"><div className="text-xs font-semibold">{name}</div><StateTag value={state}/></div><div className="mt-3 flex justify-between text-[10px] text-slate-500"><span>Version {version}</span><span>{scope}</span></div></div>; }
