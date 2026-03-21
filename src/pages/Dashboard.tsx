// ============================================================
// Dashboard.tsx — 個人首頁 / 履歷
// ============================================================

const PROFILE = {
  name: "你的名字",
  nameEn: "Your Name",
  title: "Software Engineer",
  tagline: "一句話描述自己，例：熱愛解決問題的全端工程師，喜歡把複雜的事變簡單。",
  avatar: null as string | null, // 放圖片 URL，null 顯示縮寫

  about: `在這裡寫你的自我介紹（2–4 句）。可以描述你的背景、個性、對技術的熱情，
或者你目前正在學什麼、做什麼。讓看的人能快速認識你。`,

  githubUsername: "zxcbig7", // ← 只需填這個，stats 卡片會自動帶入

  contact: {
    email: "zxcbig7@gamil.com",
    github: "https://github.com/zxcbig7",
    linkedin: "https://www.linkedin.com/in/chun-sheng-lai-b8640a195/",
    website: "", // 個人網站（可留空）
  },

  skills: [
    { category: "程式語言", items: ["C#", "TypeScript", "Python", "SQL"] },
    { category: "前端", items: ["React", "Tailwind CSS", "Vite", "Ant Design"] },
    { category: "後端", items: [".NET / ASP.NET Core"] },
    { category: "最佳化", items: ["CPLEX", "Gurobi"] },
    { category: "系統模擬", items: ["FlexSim", "NetLogo"] },
    { category: "工具 & 其他", items: ["Git", "Docker", "Oracle"] },
  ],

  experience: [
    {
      company: "公司名稱",
      role: "職稱",
      period: "2023/01 – 至今",
      description: [
        "描述這份工作做了什麼，用動詞開頭，例：負責前端架構設計與元件開發。",
        "說明具體成果或貢獻，例：優化 API 回應速度，提升效能 30%。",
        "可列出使用的技術，例：使用 React + TypeScript 開發內部工具。",
      ],
    },
    {
      company: "上一份公司或實習",
      role: "職稱 / 實習生",
      period: "2022/07 – 2022/12",
      description: [
        "描述這份經歷的主要負責事項。",
        "可以是實習、兼職、或專案合作。",
      ],
    },
  ],

  projects: [
    {
      name: "RTD Rule Viewer",
      description: "生產現場規則可視化工具，使用 React + Canvas 渲染規則流程圖，支援關鍵字搜尋與機台追蹤。",
      tags: ["React", "TypeScript", "Canvas", "Ant Design"],
      link: "",
    },
    {
      name: "專案名稱",
      description: "簡短描述這個專案做什麼、解決什麼問題、你在其中的角色。",
      tags: ["技術", "技術", "技術"],
      link: "", // GitHub 或 Demo URL
    },
  ],

  education: [
    {
      school: "國立陽明交通大學",
      degree: "碩士",
      major: "工業工程系",
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

// ── Main Component ──────────────────────────────────────────

export default function Dashboard() {
  const { name, nameEn, title, tagline, avatar, about, contact, skills, experience, projects, education } = PROFILE;

  const initials = name
    .split("")
    .filter((c) => /[\u4e00-\u9fa5A-Z]/i.test(c))
    .slice(0, 2)
    .join("");

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        {/* ── Hero ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center gap-8 shadow-sm">
          {/* Avatar */}
          <div className="shrink-0">
            {avatar ? (
              <img src={avatar} alt={name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">{title}</p>
            <h1 className="text-3xl font-bold text-slate-800">{name}</h1>
            <p className="text-sm text-slate-400 font-medium mb-3">{nameEn}</p>
            <p className="text-sm text-slate-500 leading-relaxed">{tagline}</p>

            {/* Contact Links */}
            <div className="flex flex-wrap gap-2 mt-4">
              {contact.email && (
                <a href={`mailto:${contact.email}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200">
                  <IconMail />{contact.email}
                </a>
              )}
              {contact.github && (
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
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <SectionTitle>About Me</SectionTitle>
          <p className="text-sm text-slate-600 leading-7 whitespace-pre-line">{about}</p>
        </section>

        {/* ── Skills ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <SectionTitle>Skills</SectionTitle>
          <div className="space-y-4">
            {skills.map((group) => (
              <div key={group.category} className="flex items-start gap-4">
                <span className="shrink-0 w-28 text-xs font-semibold text-slate-400 pt-0.5">{group.category}</span>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((s) => <SkillTag key={s} label={s} />)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Experience ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
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
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <SectionTitle>Projects</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((proj, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{proj.name}</h3>
                  {proj.link && (
                    <a href={proj.link} target="_blank" rel="noreferrer"
                      className="text-slate-400 hover:text-blue-500 shrink-0 transition-colors">
                      <IconLink />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{proj.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {proj.tags.map((t) => <ProjectTag key={t} label={t} />)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── GitHub Stats ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <SectionTitle>GitHub</SectionTitle>
          <div className="flex flex-col sm:flex-row gap-4 items-stretch">
            {/* 總覽卡片 */}
            <img
              src={`https://github-readme-stats.vercel.app/api?username=${PROFILE.githubUsername}&show_icons=true&hide_border=true&count_private=true&theme=default&bg_color=f8fafc&title_color=1e293b&text_color=475569&icon_color=3b82f6`}
              alt="GitHub Stats"
              className="rounded-xl border border-slate-200 w-full sm:flex-1 min-w-0"
              style={{ objectFit: "contain" }}
            />
            {/* 語言比例卡片 */}
            <img
              src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${PROFILE.githubUsername}&layout=compact&hide_border=true&theme=default&bg_color=f8fafc&title_color=1e293b&text_color=475569`}
              alt="Top Languages"
              className="rounded-xl border border-slate-200 w-full sm:w-56 shrink-0"
              style={{ objectFit: "contain" }}
            />
          </div>
          {/* GitHub 連結 */}
          {PROFILE.contact.github && (
            <a
              href={PROFILE.contact.github}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              <IconGithub />
              {PROFILE.contact.github}
            </a>
          )}
        </section>

        {/* ── Education ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
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
          Built with React + TypeScript ✦ {new Date().getFullYear()}
        </div>

      </div>
    </div>
  );
}
