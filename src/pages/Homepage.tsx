// ============================================================
// Homepage.tsx — 個人首頁 / 履歷
// ============================================================

import { useState } from "react";

const SHOW_PRIVATE = import.meta.env.VITE_SHOW_PRIVATE === "true";

const PROFILE = {
  name: "賴春伸",
  nameEn: "Vic Lai",
  title: "Developer | Runner",
  tagline: "只要拒絕停下，跑步跟人生一樣沒有失敗。",
  avatar: "/avatar.jpg" as string | null,

  about: `嗨，我是賴春伸 👋
  每當我見到新概念就想實作出來，同時也喜歡整理並分享所嘗試的事物，這個網站就是這樣來的。
  未來將慢慢把覺得值得或合適的技術整合在這個網站，沒事的話應該會一直開發下去。
  沒有特定主題，可能會放些所見、所聞、所學的事物，包含開發筆記、踩坑經驗、專案紀錄、學習心得或偶爾的一些想法。

  如果在這找到有用的東西，那很好。
  如果沒有，也歡迎來找我討論。`,

  githubUsername: "zxcbig7", // ← 只需填這個，stats 卡片會自動帶入

  contact: {
    email: "zxcbig7@gamil.com",
    github: "https://github.com/zxcbig7",
    linkedin: "https://www.linkedin.com/in/chun-sheng-lai-b8640a195/",
    website: "", // 個人網站（可留空）
  },

  skills: [
    { category: "程式語言", items: ["C#", "TypeScript", "Python", "Oracle SQL"] },
    { category: "網站架構", items: ["React", "Vite", ".NET / ASP.NET Core"] },
    { category: "數學規畫", items: ["CPLEX", "Gurobi"] },
    { category: "系統模擬", items: ["FlexSim", "NetLogo"] },
    { category: "其他", items: ["Git", "Docker", "Oracle"] },
  ],

  experience: [
    {
      company: "臺灣積體電路製造股份有限公司",
      role: "ISDD Engineer",
      period: "2025/11 – 至今",
      description: [
        "全端開發，將排程引擎的決策邏輯視覺化呈現，讓產線人員得以理解並分析排程依據。",
        "排程系統開發與維護，負責 Scheduling / Dispatching 系統的設計、實作與部署。",
        "需求溝通與系統落地直接與晶圓廠使用者溝通需求，完成從定義、設計到上線的完整流程。"
      ],
    },
    {
      company: "友達光電股份有限公司",
      role: "Intern",
      period: "2024/07 – 2024/09",
      description: [
        "導入 CPLEX 求解器建構排程最佳化模型，開發動態日生產排程再規畫系統。", ,
        "開發 VSTO Excel 增益集介面，讓規劃人員可直接在 Excel 中操作模型、調整例外條件，實現人機協作流程",
        "將每日人工排程時間從 30 分鐘縮短至 10 秒。",
      ],
    },
    {
      company: "永聯物流開發 (ALP)",
      role: "Intern",
      period: "2022/07 – 2023/01",
      description: [
        "使用 Flexim 與 NetLogo 建構 RMFS 物流倉儲模擬系統，模擬多情境下的設施配置與作業流程。",
        "量化各情境的運作效率指標，提供數據依據，支援公司擴廠選址與設施規劃決策。",
      ],
    },
  ],

  projects: [
    {
      name: "[開發中] Rule Viewer",
      description: "全端開發可視化工具，渲染機台派工規則流程圖，將排程決策邏輯透明化，輔助人員理解與分析。",
      tags: ["React", "TypeScript", ".NET Web API"],
      link: "",
      //image: "/project/RuleViewer.png", // 放圖片 URL 或 /images/xxx.png，留空不顯示
    },
    {
      name: "代數建模語言與大型語言模型之數學規劃開發框架",
      description: "數學規劃模型在各領域的決策問題中具有廣泛應用，但在模型開發過程中，溝通障礙往往成為效率的瓶頸，從而影響模型的品質和決策的效益。本研究提出一個結合代數模型語言與大型語言模型的自動化開發框架，用於協助數學規劃模型的開發流程。為了因應大型規劃問題在開發過程中的模組化與擴展需求，本研究設計混合整數線性規劃模型開發應用程式介面，透過標準化流程與物件化架構，提升數學規劃模型與程式的可讀性。實驗結果顯示，本研究提出的框架在以自然語言描述為基礎的數學規劃問題公開資料集，對269 個問題達到90.7% 的準確度，優於現有成果。此外，在語言模型處理輸入與生成回應所需的運算成本可接受的情況下，平均約需一分鐘完成最佳化任務，實現了高效且高準確性的開發流程。",
      tags: ["Python", "C#", "Large Language Models", "Automated Modeling", "Mathematical Programming"],
      link: "https://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi?randomimg=egXEuM_1774073088&validpath=%2Ftmp%2F%5Enclcdr__doschk%2FegXEuM_1774073088__NDI3NTIy&validinput=427522&check=%E7%A2%BA%E5%AE%9A",
      image: "/project/paper.png",
    },
    {
      name: "[開發中]數學最佳化求解器抽象層框架開發",
      description: "在 .NET 環境中開發了一個統一封裝 CPLEX 的數學最佳化框架，提供一致的開發介面以消除不同求解器間的語法差異。開發者只需透過框架的標準 API 提供模型參數即可快速建構數學模型，並在不修改業務邏輯的情況下自由切換底層求解器。此框架採模組化設計，可跨專案重複引用，顯著降低團隊溝通成本與新成員的學習曲線。",
      tags: ["C#", "CPELX"],
      link: SHOW_PRIVATE ? "https://github.com/zxcbig7/OptimFoundation" : "",
    },
    {
      name: "[開發中]最佳化求解器開發",
      description: "碩士期間與實驗室成員一同開發，將課程所學與論文研究中接觸到的數學最佳化演算法付諸實作，目標自行開發一套類似 CPLEX 與 Gurobi 的數學最佳化求解器(雖然求解效率上不可能贏，但至少能求解:D)。求解器基於 .NET 環境建構，目標是提供模組化、可擴充的求解核心，作為後續演算法開發研究的底層基礎。",
      tags: ["C#", "Linear Program"],
      link: SHOW_PRIVATE ? "https://github.com/zxcbig7/Linear-Program-Solver" : "",
      image: "",
    },

  ],

  education: [
    {
      school: "國立陽明交通大學",
      degree: "碩士",
      major: "工業工程與管理學系",
      period: "2023 – 2025",
    },
    {
      school: "國立臺灣科技大學",
      degree: "學士",
      major: "工業管理系",
      period: "2019 – 2023",
    },
  ],
};

// ── Icons (SVG inline) ──────────────────────────────────────

function IconMail() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0-9.75 6.75L2.25 6.75" />
    </svg>
  );
}

function IconGithub() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function IconLinkedin() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

// ── Sub-components ──────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-base font-bold text-slate-700 shrink-0">{children}</h2>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function SkillTag({ label }: { label: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      {label}
    </span>
  );
}

function ProjectTag({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
      {label}
    </span>
  );
}

function ProjectCard({ proj }: { proj: typeof PROFILE.projects[number] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden hover:border-blue-200 hover:shadow-sm transition-all group flex flex-col">
      {proj.image && (
        <img src={proj.image} alt={proj.name} className="w-full h-36 object-contain bg-slate-50" />
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors leading-snug">{proj.name}</h3>
          {proj.link && (
            <a href={proj.link} target="_blank" rel="noreferrer"
              className="text-slate-400 hover:text-blue-500 shrink-0 transition-colors mt-0.5">
              <IconLink />
            </a>
          )}
        </div>
        <p className={`text-xs text-slate-500 leading-relaxed mb-1 flex-1 ${expanded ? "" : "line-clamp-4"}`}>
          {proj.description}
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] text-blue-400 hover:text-blue-600 text-left mb-2 transition-colors"
        >
          {expanded ? "收合" : "展開"}
        </button>
        <div className="flex flex-wrap gap-1.5">
          {proj.tags.map((t) => <ProjectTag key={t} label={t} />)}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export default function Homepage() {
  const { name, nameEn, title, tagline, avatar, about, contact, skills, experience, projects, education } = PROFILE;

  const initials = name
    .split("")
    .filter((c) => /[\u4e00-\u9fa5A-Z]/i.test(c))
    .slice(0, 2)
    .join("");

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      {/* ── Logo Banner ── */}
      <div className="flex flex-col items-center pt-8 pb-2 gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium tracking-widest">
          <span>開發</span>
          <span className="text-slate-300">/</span>
          <span>長跑</span>
          <span className="text-slate-300">/</span>
          <span>咖啡</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">

        {/* ── Hero ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 shadow-sm text-center sm:text-left">
          {/* Avatar */}
          <div className="shrink-0 sm:w-44">
            {avatar ? (
              <img src={avatar} alt={name} className="w-28 h-28 sm:w-44 sm:h-44 rounded-2xl object-cover shadow-md mx-auto" />
            ) : (
              <div className="w-28 h-28 sm:w-44 sm:h-44 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-md mx-auto">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">{title}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{name}</h1>
            <p className="text-sm text-slate-400 font-medium mb-3">{nameEn}</p>
            <p className="text-sm text-slate-500 leading-relaxed">{tagline}</p>

            {/* Contact Links */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              {contact.email && (
                <a href={`mailto:${contact.email}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200">
                  <IconMail /><span className="hidden sm:inline">{contact.email}</span><span className="sm:hidden">Email</span>
                </a>
              )}
              {SHOW_PRIVATE && contact.github && (
                <a href={contact.github} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200">
                  <IconGithub />GitHub
                </a>
              )}
              {contact.linkedin && (
                <a href={contact.linkedin} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200">
                  <IconLinkedin />LinkedIn
                </a>
              )}
              {contact.website && (
                <a href={contact.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200">
                  <IconLink />Website
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm">
          <SectionTitle>About Me</SectionTitle>
          <p className="text-sm text-slate-600 leading-7 whitespace-pre-line">{about}</p>
        </section>

        {/* ── Skills ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm">
          <SectionTitle>Skills</SectionTitle>
          <div className="space-y-4">
            {skills.map((group) => (
              <div key={group.category} className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4">
                <span className="shrink-0 sm:w-28 text-xs font-semibold text-slate-400 sm:pt-0.5">{group.category}</span>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((s) => <SkillTag key={s} label={s} />)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Experience ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm">
          <SectionTitle>Experience</SectionTitle>
          <div className="space-y-8">
            {experience.map((exp, i) => (
              <div key={i} className="flex gap-5">
                {/* Timeline dot */}
                <div className="flex flex-col items-center shrink-0 pt-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                  {i < experience.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-2" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div>
                      <span className="font-semibold text-slate-800 text-sm">{exp.role}</span>
                      <span className="text-slate-400 mx-2 text-xs">@</span>
                      <span className="text-blue-600 text-sm font-medium">{exp.company}</span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{exp.period}</span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {exp.description.map((d, j) => (
                      <li key={j} className="text-sm text-slate-500 leading-relaxed flex gap-2">
                        <span className="text-slate-300 shrink-0 mt-1">›</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Projects ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm">
          <SectionTitle>Projects</SectionTitle>
          <div className="flex flex-col gap-4">
            {projects.map((proj, i) => (
              <ProjectCard key={i} proj={proj} />
            ))}
          </div>
        </section>

        {/* ── Education ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm">
          <SectionTitle>Education</SectionTitle>
          <div className="space-y-4">
            {education.map((edu, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold shrink-0">
                  {edu.school[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{edu.school}</span>
                    <span className="text-xs text-slate-400">{edu.period}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{edu.degree}・{edu.major}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <div className="text-center text-xs text-slate-400 pb-6">
          Made with ❤️ by Vic Lai 2026
        </div>

      </div>
    </div>
  );
}
