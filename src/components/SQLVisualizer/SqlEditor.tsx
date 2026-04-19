interface SqlEditorProps {
  value: string;
  onChange: (v: string) => void;
}

export default function SqlEditor({ value, onChange }: SqlEditorProps) {
  const lines = value.split("\n");

  return (
    <div
      className="flex rounded-xl border border-slate-700 bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500"
      style={{ minHeight: "13rem" }}
    >
      {/* Line numbers */}
      <div
        className="select-none text-right font-mono text-xs text-slate-600 bg-slate-800 py-4 px-2 shrink-0"
        style={{ minWidth: "2.8rem", lineHeight: "1.5rem" }}
        aria-hidden
      >
        {lines.map((_, idx) => (
          <div key={idx}>{idx + 1}</div>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 font-mono text-sm bg-transparent text-green-300 py-4 px-3 resize-none focus:outline-none placeholder:text-slate-600 leading-6"
        placeholder="貼上 SQL 程式碼..."
        spellCheck={false}
        style={{ lineHeight: "1.5rem" }}
      />
    </div>
  );
}
