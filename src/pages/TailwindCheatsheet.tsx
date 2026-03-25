import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Each demo card: className applied to the preview element + visual
// ─────────────────────────────────────────────────────────────────
type Card = {
  cls: string;          // class name shown in code badge
  desc?: string;        // short description
  preview: React.ReactNode;
};
type Group = { title: string; cards: Card[] };

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] text-gray-400 mt-1 text-center">{children}</div>;
}

// ── SECTIONS ────────────────────────────────────────────────────
const GROUPS: Group[] = [

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DISPLAY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Display", cards: [
    {
      cls: "block",
      desc: "每個元素佔滿整行",
      preview: (
        <div>
          <span className="block bg-blue-200 text-blue-800 text-xs px-2 py-1 mb-1 rounded">block 1</span>
          <span className="block bg-blue-300 text-blue-800 text-xs px-2 py-1 mb-1 rounded">block 2</span>
          <span className="block bg-blue-400 text-blue-800 text-xs px-2 py-1 rounded">block 3</span>
        </div>
      ),
    },
    {
      cls: "inline",
      desc: "元素保持在文字流中",
      preview: (
        <p className="text-xs text-gray-700 leading-6">
          文字 <span className="inline bg-yellow-200 px-1 rounded">inline A</span> 文字 <span className="inline bg-yellow-300 px-1 rounded">inline B</span> 文字繼續
        </p>
      ),
    },
    {
      cls: "inline-block",
      desc: "inline 但可設定寬高",
      preview: (
        <div className="text-xs text-gray-700 leading-8">
          文字 <span className="inline-block bg-green-200 w-16 h-6 text-center rounded text-green-800 align-middle">w-16 h-6</span> 文字繼續
        </div>
      ),
    },
    {
      cls: "flex",
      desc: "橫向彈性排列",
      preview: (
        <div className="flex gap-2 p-2 bg-gray-100 rounded">
          {["A","B","C"].map(l => <div key={l} className="flex-1 h-10 bg-blue-400 text-white text-sm font-bold flex items-center justify-center rounded">{l}</div>)}
        </div>
      ),
    },
    {
      cls: "grid",
      desc: "格線排列",
      preview: (
        <div className="grid grid-cols-3 gap-2 p-2 bg-gray-100 rounded">
          {[1,2,3,4,5,6].map(n => <div key={n} className="h-8 bg-purple-400 text-white text-xs font-bold flex items-center justify-center rounded">{n}</div>)}
        </div>
      ),
    },
    {
      cls: "hidden",
      desc: "完全隱藏，不佔空間",
      preview: (
        <div className="flex gap-2 items-center p-2 bg-gray-100 rounded">
          <div className="h-8 w-16 bg-green-400 text-white text-xs flex items-center justify-center rounded">顯示</div>
          <div className="hidden h-8 w-16 bg-red-400 text-white text-xs items-center justify-center rounded">hidden</div>
          <div className="h-8 w-16 bg-green-400 text-white text-xs flex items-center justify-center rounded">顯示</div>
          <span className="text-[10px] text-gray-400">← 中間被隱藏</span>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FLEXBOX — Direction
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Flexbox — Direction", cards: [
    {
      cls: "flex-row",
      desc: "左到右排列（預設）",
      preview: (
        <div>
          <div className="flex flex-row gap-2 p-2 bg-gray-100 rounded">
            {["1","2","3"].map(n => <div key={n} className="w-10 h-10 bg-blue-500 text-white text-sm font-bold flex items-center justify-center rounded">{n}</div>)}
          </div>
          <Label>→ 左到右</Label>
        </div>
      ),
    },
    {
      cls: "flex-row-reverse",
      desc: "右到左排列",
      preview: (
        <div>
          <div className="flex flex-row-reverse gap-2 p-2 bg-gray-100 rounded">
            {["1","2","3"].map(n => <div key={n} className="w-10 h-10 bg-purple-500 text-white text-sm font-bold flex items-center justify-center rounded">{n}</div>)}
          </div>
          <Label>← 右到左</Label>
        </div>
      ),
    },
    {
      cls: "flex-col",
      desc: "上到下排列",
      preview: (
        <div>
          <div className="flex flex-col gap-2 p-2 bg-gray-100 rounded">
            {["1","2","3"].map(n => <div key={n} className="h-8 bg-green-500 text-white text-sm font-bold flex items-center justify-center rounded">{n}</div>)}
          </div>
          <Label>↓ 上到下</Label>
        </div>
      ),
    },
    {
      cls: "flex-col-reverse",
      desc: "下到上排列",
      preview: (
        <div>
          <div className="flex flex-col-reverse gap-2 p-2 bg-gray-100 rounded">
            {["1","2","3"].map(n => <div key={n} className="h-8 bg-orange-500 text-white text-sm font-bold flex items-center justify-center rounded">{n}</div>)}
          </div>
          <Label>↑ 下到上</Label>
        </div>
      ),
    },
    {
      cls: "flex-wrap",
      desc: "滿出去時換行",
      preview: (
        <div>
          <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded w-48">
            {["A","B","C","D","E","F"].map(l => <div key={l} className="w-14 h-8 bg-pink-400 text-white text-xs font-bold flex items-center justify-center rounded">{l}</div>)}
          </div>
          <Label>width=192px，自動換行</Label>
        </div>
      ),
    },
    {
      cls: "flex-nowrap",
      desc: "不換行，可能溢出",
      preview: (
        <div>
          <div className="flex flex-nowrap gap-2 p-2 bg-gray-100 rounded overflow-hidden w-48">
            {["A","B","C","D","E","F"].map(l => <div key={l} className="w-14 h-8 shrink-0 bg-red-400 text-white text-xs font-bold flex items-center justify-center rounded">{l}</div>)}
          </div>
          <Label>溢出被裁切</Label>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FLEXBOX — Justify Content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Flexbox — Justify Content (主軸對齊)", cards: [
    ...[
      ["justify-start",   "bg-blue-400",   "靠左"],
      ["justify-center",  "bg-purple-400", "置中"],
      ["justify-end",     "bg-green-400",  "靠右"],
      ["justify-between", "bg-orange-400", "兩端"],
      ["justify-around",  "bg-pink-400",   "等間距包邊"],
      ["justify-evenly",  "bg-teal-400",   "完全等距"],
    ].map(([cls, color, note]) => ({
      cls: cls as string,
      desc: note as string,
      preview: (
        <div>
          <div className={`flex ${cls} gap-0 p-2 bg-gray-100 rounded`}>
            {["1","2","3"].map(n => <div key={n} className={`w-10 h-10 ${color} text-white text-sm font-bold flex items-center justify-center rounded`}>{n}</div>)}
          </div>
          <Label>{note as string}</Label>
        </div>
      ),
    })),
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FLEXBOX — Align Items
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Flexbox — Align Items (交叉軸對齊)", cards: [
    ...[
      ["items-start",   "bg-blue-400",   "靠上"],
      ["items-center",  "bg-purple-400", "垂直置中"],
      ["items-end",     "bg-green-400",  "靠下"],
      ["items-stretch", "bg-orange-400", "撐滿高度"],
      ["items-baseline","bg-pink-400",   "文字基線對齊"],
    ].map(([cls, color, note]) => ({
      cls: cls as string,
      desc: note as string,
      preview: (
        <div>
          <div className={`flex ${cls} gap-2 p-2 bg-gray-100 rounded h-20`}>
            {[["1","h-6"],["2","h-10"],["3","h-8"]].map(([n,h]) => <div key={n} className={`w-10 ${h} ${color} text-white text-sm font-bold flex items-center justify-center rounded`}>{n}</div>)}
          </div>
          <Label>{note as string}</Label>
        </div>
      ),
    })),
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FLEXBOX — Grow / Shrink
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Flexbox — Grow / Shrink", cards: [
    {
      cls: "flex-1",
      desc: "平均分配剩餘空間",
      preview: (
        <div className="flex gap-2 p-2 bg-gray-100 rounded">
          <div className="flex-1 h-10 bg-blue-500 text-white text-xs font-bold flex items-center justify-center rounded">flex-1</div>
          <div className="flex-1 h-10 bg-blue-400 text-white text-xs font-bold flex items-center justify-center rounded">flex-1</div>
          <div className="flex-1 h-10 bg-blue-300 text-white text-xs font-bold flex items-center justify-center rounded">flex-1</div>
        </div>
      ),
    },
    {
      cls: "flex-none",
      desc: "不伸縮，保持原始大小",
      preview: (
        <div className="flex gap-2 p-2 bg-gray-100 rounded">
          <div className="flex-none w-16 h-10 bg-red-400 text-white text-xs font-bold flex items-center justify-center rounded">none w-16</div>
          <div className="flex-1 h-10 bg-blue-400 text-white text-xs font-bold flex items-center justify-center rounded">flex-1</div>
          <div className="flex-none w-16 h-10 bg-red-400 text-white text-xs font-bold flex items-center justify-center rounded">none w-16</div>
        </div>
      ),
    },
    {
      cls: "grow / grow-0",
      desc: "grow 填充剩餘空間",
      preview: (
        <div className="flex gap-2 p-2 bg-gray-100 rounded">
          <div className="grow h-10 bg-green-500 text-white text-xs font-bold flex items-center justify-center rounded">grow ←填充→</div>
          <div className="grow-0 w-12 h-10 bg-gray-400 text-white text-xs font-bold flex items-center justify-center rounded">grow-0</div>
        </div>
      ),
    },
    {
      cls: "shrink / shrink-0",
      desc: "shrink-0 拒絕被壓縮",
      preview: (
        <div className="flex gap-2 p-2 bg-gray-100 rounded w-48">
          <div className="shrink min-w-0 h-10 bg-orange-400 text-white text-xs font-bold flex items-center justify-center rounded truncate px-1">shrink 被壓縮</div>
          <div className="shrink-0 w-24 h-10 bg-purple-500 text-white text-xs font-bold flex items-center justify-center rounded">shrink-0</div>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GRID
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Grid — Columns", cards: [
    ...[1,2,3,4,6].map(n => ({
      cls: `grid-cols-${n}`,
      desc: `${n} 欄格線`,
      preview: (
        <div className={`grid grid-cols-${n} gap-1.5 p-2 bg-gray-100 rounded`}>
          {Array.from({length: n*2}).map((_,i) => <div key={i} className="h-8 bg-indigo-400 text-white text-xs font-bold flex items-center justify-center rounded">{i+1}</div>)}
        </div>
      ),
    })),
    {
      cls: "col-span-2",
      desc: "橫跨 2 欄",
      preview: (
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-gray-100 rounded">
          <div className="col-span-2 h-8 bg-pink-500 text-white text-xs font-bold flex items-center justify-center rounded">col-span-2</div>
          <div className="h-8 bg-pink-300 text-white text-xs font-bold flex items-center justify-center rounded">1</div>
          <div className="h-8 bg-pink-300 text-white text-xs font-bold flex items-center justify-center rounded">2</div>
          <div className="h-8 bg-pink-300 text-white text-xs font-bold flex items-center justify-center rounded">3</div>
          <div className="h-8 bg-pink-300 text-white text-xs font-bold flex items-center justify-center rounded">4</div>
        </div>
      ),
    },
    {
      cls: "row-span-2",
      desc: "縱跨 2 行",
      preview: (
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-gray-100 rounded">
          <div className="row-span-2 bg-teal-500 text-white text-xs font-bold flex items-center justify-center rounded">row-span-2</div>
          <div className="h-8 bg-teal-300 text-white text-xs font-bold flex items-center justify-center rounded">2</div>
          <div className="h-8 bg-teal-300 text-white text-xs font-bold flex items-center justify-center rounded">3</div>
          <div className="h-8 bg-teal-300 text-white text-xs font-bold flex items-center justify-center rounded">4</div>
          <div className="h-8 bg-teal-300 text-white text-xs font-bold flex items-center justify-center rounded">5</div>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GAP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Gap (間距)", cards: [
    ...[0,1,2,4,6,8].map(n => ({
      cls: `gap-${n}`,
      desc: `間距 ${n * 4}px`,
      preview: (
        <div>
          <div className={`flex gap-${n} p-2 bg-gray-100 rounded`}>
            {["A","B","C","D"].map(l => <div key={l} className="w-10 h-10 bg-violet-400 text-white text-sm font-bold flex items-center justify-center rounded shrink-0">{l}</div>)}
          </div>
          <Label>gap = {n * 4}px</Label>
        </div>
      ),
    })),
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PADDING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Padding", cards: [
    ...[0,1,2,4,6,8,12].map(n => ({
      cls: `p-${n}`,
      desc: `四邊內距 ${n * 4}px`,
      preview: (
        <div>
          <div className={`p-${n} bg-blue-100 rounded inline-block`}>
            <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">內容</div>
          </div>
          <Label>p-{n} = {n*4}px 四邊</Label>
        </div>
      ),
    })),
    {
      cls: "px-4 / py-4",
      desc: "只設定水平 or 垂直方向",
      preview: (
        <div className="flex gap-4 items-start">
          <div>
            <div className="px-8 bg-green-100 rounded inline-block">
              <div className="bg-green-500 text-white text-xs font-bold py-1 px-2 rounded">內容</div>
            </div>
            <Label>px-8 (左右)</Label>
          </div>
          <div>
            <div className="py-6 bg-orange-100 rounded inline-block">
              <div className="bg-orange-500 text-white text-xs font-bold py-1 px-2 rounded">內容</div>
            </div>
            <Label>py-6 (上下)</Label>
          </div>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MARGIN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Margin", cards: [
    ...[0,1,2,4,6,8].map(n => ({
      cls: `m-${n}`,
      desc: `四邊外距 ${n * 4}px`,
      preview: (
        <div className="bg-gray-100 rounded p-1">
          <div className={`m-${n} bg-purple-500 text-white text-xs font-bold flex items-center justify-center h-8 rounded`}>m-{n}</div>
          <Label>margin = {n*4}px</Label>
        </div>
      ),
    })),
    {
      cls: "mx-auto",
      desc: "水平置中",
      preview: (
        <div className="bg-gray-100 rounded p-2">
          <div className="mx-auto w-24 h-8 bg-pink-500 text-white text-xs font-bold flex items-center justify-center rounded">mx-auto</div>
          <Label>自動置中</Label>
        </div>
      ),
    },
    {
      cls: "mt / mr / mb / ml",
      desc: "單邊 margin",
      preview: (
        <div className="flex gap-3 flex-wrap">
          {[["mt-4","上","bg-red-400"],["mr-4","右","bg-orange-400"],["mb-4","下","bg-yellow-400"],["ml-4","左","bg-green-400"]].map(([cls,note,color])=>(
            <div key={cls} className="bg-gray-100 rounded p-1">
              <div className={`${cls} ${color} text-white text-[10px] font-bold flex items-center justify-center w-12 h-6 rounded`}>{cls}</div>
              <Label>{note}</Label>
            </div>
          ))}
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SIZING — Width
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Width", cards: [
    ...[
      ["w-8","32px","bg-blue-400"],
      ["w-16","64px","bg-blue-500"],
      ["w-32","128px","bg-blue-600"],
      ["w-64","256px","bg-blue-700"],
    ].map(([cls,px,color])=>({
      cls: cls as string,
      desc: px as string,
      preview: (
        <div>
          <div className={`${cls} h-8 ${color} text-white text-xs font-bold flex items-center justify-center rounded`}>{px}</div>
          <Label>{cls}</Label>
        </div>
      ),
    })),
    {
      cls: "w-1/4 / w-1/2 / w-3/4 / w-full",
      desc: "百分比寬度",
      preview: (
        <div className="flex flex-col gap-1.5 w-full bg-gray-100 rounded p-2">
          {[["w-1/4","bg-purple-300"],["w-1/2","bg-purple-400"],["w-3/4","bg-purple-500"],["w-full","bg-purple-600"]].map(([cls,color])=>(
            <div key={cls} className={`${cls} h-6 ${color} text-white text-xs font-bold flex items-center justify-center rounded`}>{cls}</div>
          ))}
        </div>
      ),
    },
    {
      cls: "min-w / max-w",
      desc: "設定最小 / 最大寬度",
      preview: (
        <div className="flex flex-col gap-2 w-full">
          <div className="max-w-xs w-full bg-green-100 p-1 rounded">
            <div className="w-full h-6 bg-green-500 text-white text-xs font-bold flex items-center justify-center rounded">max-w-xs (320px)</div>
          </div>
          <div className="max-w-sm w-full bg-teal-100 p-1 rounded">
            <div className="w-full h-6 bg-teal-500 text-white text-xs font-bold flex items-center justify-center rounded">max-w-sm (384px)</div>
          </div>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SIZING — Height
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Height", cards: [
    {
      cls: "h-4 / h-8 / h-16 / h-32",
      desc: "固定高度（16 / 32 / 64 / 128px）",
      preview: (
        <div className="flex items-end gap-2 p-2 bg-gray-100 rounded h-36">
          {[["h-4","bg-pink-300"],["h-8","bg-pink-400"],["h-16","bg-pink-500"],["h-32","bg-pink-600"]].map(([cls,color])=>(
            <div key={cls} className="flex flex-col items-center gap-1">
              <div className={`${cls} w-10 ${color} rounded text-[0px]`}/>
              <span className="text-[9px] text-gray-500">{cls}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      cls: "min-h / max-h",
      desc: "設定最小 / 最大高度",
      preview: (
        <div className="flex gap-4 items-start">
          <div>
            <div className="min-h-16 w-16 bg-violet-400 text-white text-xs font-bold flex items-center justify-center rounded p-1 text-center">min-h-16</div>
            <Label>最少 64px</Label>
          </div>
          <div>
            <div className="max-h-12 overflow-hidden w-16 bg-violet-500 text-white text-xs font-bold flex items-start justify-center rounded p-1">max-h-12 超出被截斷</div>
            <Label>最多 48px</Label>
          </div>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TYPOGRAPHY — Font Size
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Font Size", cards: [
    ...[
      ["text-xs","12px"],["text-sm","14px"],["text-base","16px"],["text-lg","18px"],
      ["text-xl","20px"],["text-2xl","24px"],["text-3xl","30px"],["text-4xl","36px"],
      ["text-5xl","48px"],
    ].map(([cls,px])=>({
      cls: cls as string,
      desc: px as string,
      preview: (
        <div className="flex items-baseline gap-3">
          <span className={`${cls} font-semibold text-gray-800`}>Aa</span>
          <span className="text-xs text-gray-400">{px}</span>
        </div>
      ),
    })),
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TYPOGRAPHY — Font Weight
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Font Weight", cards: [
    ...[
      ["font-thin","100"],["font-extralight","200"],["font-light","300"],
      ["font-normal","400"],["font-medium","500"],["font-semibold","600"],
      ["font-bold","700"],["font-extrabold","800"],["font-black","900"],
    ].map(([cls,w])=>({
      cls: cls as string,
      desc: `font-weight: ${w}`,
      preview: (
        <div className="flex items-center gap-3">
          <span className={`${cls} text-xl text-gray-800`}>The quick brown fox</span>
          <span className="text-xs text-gray-400 shrink-0">{w}</span>
        </div>
      ),
    })),
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TYPOGRAPHY — Text Color
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Text Color", cards: [
    {
      cls: "text-{color}-{shade}",
      desc: "文字顏色，色系 50–950 共 11 階",
      preview: (
        <div className="flex flex-col gap-1">
          {[
            ["text-red-500","bg-red-50"],
            ["text-orange-500","bg-orange-50"],
            ["text-yellow-600","bg-yellow-50"],
            ["text-green-600","bg-green-50"],
            ["text-blue-600","bg-blue-50"],
            ["text-purple-600","bg-purple-50"],
            ["text-pink-600","bg-pink-50"],
            ["text-gray-700","bg-gray-50"],
          ].map(([cls,bg])=>(
            <div key={cls} className={`flex items-center gap-2 px-2 py-0.5 rounded ${bg}`}>
              <span className={`${cls} font-semibold text-sm`}>{cls}</span>
            </div>
          ))}
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TYPOGRAPHY — Align & Decoration
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Text Align & Decoration", cards: [
    ...[
      ["text-left","靠左"],["text-center","置中"],["text-right","靠右"],
    ].map(([cls,note])=>({
      cls: cls as string,
      desc: note as string,
      preview: (
        <div className={`${cls} bg-gray-50 rounded px-3 py-2 border w-48`}>
          <p className="text-sm text-gray-700">The quick brown fox</p>
          <p className="text-xs text-gray-400">{note}</p>
        </div>
      ),
    })),
    ...[
      ["underline","底線"],["overline","上線"],["line-through","刪除線"],["no-underline","無線"],
    ].map(([cls,note])=>({
      cls: cls as string,
      desc: note as string,
      preview: (
        <div className="flex items-center gap-3">
          <span className={`${cls} text-base text-gray-800`}>Sample Text</span>
          <span className="text-xs text-gray-400">{note}</span>
        </div>
      ),
    })),
    ...[
      ["uppercase","轉大寫"],["lowercase","轉小寫"],["capitalize","首字大寫"],
    ].map(([cls,note])=>({
      cls: cls as string,
      desc: note as string,
      preview: (
        <div className="flex items-center gap-3">
          <span className={`${cls} text-base text-gray-800`}>hello world</span>
          <span className="text-xs text-gray-400">→ {note}</span>
        </div>
      ),
    })),
    {
      cls: "truncate",
      desc: "文字溢出顯示 …",
      preview: (
        <div>
          <div className="w-40 truncate bg-yellow-50 border rounded px-2 py-1 text-sm text-gray-700">
            This is a very long text that should be truncated
          </div>
          <Label>寬度 160px，自動截斷</Label>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TYPOGRAPHY — Leading / Tracking
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Line Height & Letter Spacing", cards: [
    ...[
      ["leading-none","1.0"],["leading-tight","1.25"],["leading-normal","1.5"],
      ["leading-relaxed","1.625"],["leading-loose","2.0"],
    ].map(([cls,val])=>({
      cls: cls as string,
      desc: `line-height: ${val}`,
      preview: (
        <div className={`${cls} text-sm text-gray-700 bg-gray-50 rounded px-3 py-2 border w-48`}>
          <p>The quick brown fox</p>
          <p>jumps over the lazy dog.</p>
          <p className="text-[9px] text-gray-400 mt-1">line-height: {val}</p>
        </div>
      ),
    })),
    ...[
      ["tracking-tighter","-0.05em"],["tracking-tight","-0.025em"],
      ["tracking-normal","0em"],["tracking-wide","0.025em"],
      ["tracking-wider","0.05em"],["tracking-widest","0.1em"],
    ].map(([cls,val])=>({
      cls: cls as string,
      desc: `letter-spacing: ${val}`,
      preview: (
        <div>
          <span className={`${cls} text-base font-semibold text-gray-800`}>HELLO WORLD</span>
          <Label>letter-spacing: {val}</Label>
        </div>
      ),
    })),
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BACKGROUND COLORS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Background Color", cards: [
    {
      cls: "bg-{color}-{shade}",
      desc: "背景顏色，色系 50–950 共 11 階",
      preview: (
        <div className="flex flex-col gap-2">
          {[
            ["slate","from-slate-200 via-slate-500 to-slate-900"],
            ["red","from-red-200 via-red-500 to-red-900"],
            ["orange","from-orange-200 via-orange-500 to-orange-900"],
            ["yellow","from-yellow-200 via-yellow-500 to-yellow-900"],
            ["green","from-green-200 via-green-500 to-green-900"],
            ["blue","from-blue-200 via-blue-500 to-blue-900"],
            ["purple","from-purple-200 via-purple-500 to-purple-900"],
            ["pink","from-pink-200 via-pink-500 to-pink-900"],
          ].map(([name, gradient]) => (
            <div key={name} className="flex gap-1 items-center">
              <span className="text-[10px] text-gray-500 w-12">{name}</span>
              <div className={`flex-1 h-5 rounded bg-linear-to-r ${gradient}`}/>
            </div>
          ))}
          <div className="text-[9px] text-gray-400 mt-1">每色系 50–950 共 11 階</div>
        </div>
      ),
    },
    {
      cls: "bg-opacity / bg-white/50",
      desc: "背景透明度",
      preview: (
        <div className="flex gap-2 flex-wrap">
          {[10,25,50,75,100].map(o => (
            <div key={o} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-blue-500 rounded" style={{opacity: o/100}}/>
              <span className="text-[9px] text-gray-500">{o}%</span>
            </div>
          ))}
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GRADIENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Gradients", cards: [
    ...[
      ["bg-linear-to-r","→ 右","from-blue-400 to-purple-500"],
      ["bg-linear-to-l","← 左","from-blue-400 to-purple-500"],
      ["bg-linear-to-t","↑ 上","from-blue-400 to-purple-500"],
      ["bg-linear-to-b","↓ 下","from-blue-400 to-purple-500"],
      ["bg-linear-to-br","↘ 右下","from-orange-400 to-pink-500"],
      ["bg-linear-to-bl","↙ 左下","from-orange-400 to-pink-500"],
      ["bg-linear-to-tr","↗ 右上","from-green-400 to-teal-500"],
      ["bg-linear-to-tl","↖ 左上","from-green-400 to-teal-500"],
    ].map(([cls,dir,colors])=>({
      cls: cls as string,
      desc: `漸層方向 ${dir as string}`,
      preview: (
        <div>
          <div className={`h-12 w-full rounded ${cls} ${colors}`}/>
          <Label>{dir}</Label>
        </div>
      ),
    })),
    {
      cls: "via (3色)",
      desc: "from → via → to",
      preview: (
        <div className="flex flex-col gap-2">
          {[
            "from-red-400 via-yellow-400 to-green-400",
            "from-blue-400 via-purple-400 to-pink-400",
            "from-cyan-400 via-blue-500 to-indigo-600",
          ].map(g => <div key={g} className={`h-8 w-full rounded bg-linear-to-r ${g}`}/>)}
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BORDER WIDTH & STYLE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Border Width", cards: [
    ...[0,1,2,4,8].map(n=>({
      cls: n===1?"border":`border-${n===0?"0":n}`,
      desc: n===0 ? "無框線" : n===1 ? "1px 框線（預設）" : `${n}px 框線`,
      preview: (
        <div>
          <div className={`${n===1?"border":`border-${n===0?"0":n}`} border-indigo-500 bg-indigo-50 h-12 w-full rounded flex items-center justify-center text-xs text-indigo-700 font-semibold`}>
            {n}px
          </div>
          <Label>border{n===0?"-0":n===1?"":"-"+n}</Label>
        </div>
      ),
    })),
    {
      cls: "border-t / r / b / l",
      desc: "單邊框線",
      preview: (
        <div className="flex gap-2 flex-wrap">
          {[["border-t","上"],["border-r","右"],["border-b","下"],["border-l","左"]].map(([cls,note])=>(
            <div key={cls}>
              <div className={`${cls} border-blue-500 bg-blue-50 w-12 h-12 rounded flex items-center justify-center text-[10px] text-blue-700`}>{note}</div>
              <Label>{cls}</Label>
            </div>
          ))}
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BORDER STYLE & COLOR
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Border Style & Color", cards: [
    ...[
      ["border-solid","實線"],["border-dashed","虛線"],
      ["border-dotted","點線"],["border-double","雙線"],["border-none","無線"],
    ].map(([cls,note])=>({
      cls: cls as string,
      desc: note as string,
      preview: (
        <div>
          <div className={`border-2 ${cls} border-gray-500 bg-gray-50 h-10 w-full rounded flex items-center justify-center text-xs text-gray-600`}>{note}</div>
        </div>
      ),
    })),
    {
      cls: "border-{color}",
      desc: "框線顏色",
      preview: (
        <div className="flex gap-2 flex-wrap">
          {[["border-red-400","bg-red-50"],["border-blue-400","bg-blue-50"],["border-green-400","bg-green-50"],["border-purple-400","bg-purple-50"]].map(([cls,bg])=>(
            <div key={cls} className={`border-2 ${cls} ${bg} w-10 h-10 rounded flex items-center justify-center text-[8px] text-gray-600`}>{cls.split("-")[1]}</div>
          ))}
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BORDER RADIUS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Border Radius", cards: [
    ...[
      ["rounded-none","0"],["rounded-sm","2px"],["rounded","4px"],
      ["rounded-md","6px"],["rounded-lg","8px"],["rounded-xl","12px"],
      ["rounded-2xl","16px"],["rounded-3xl","24px"],["rounded-full","9999px"],
    ].map(([cls,val])=>({
      cls: cls as string,
      desc: `圓角 ${val}`,
      preview: (
        <div className="flex items-center gap-3">
          <div className={`${cls} w-14 h-14 bg-indigo-400`}/>
          <span className="text-xs text-gray-400">{val}</span>
        </div>
      ),
    })),
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SHADOWS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Box Shadow", cards: [
    ...[
      ["shadow-none",  "無陰影"],
      ["shadow-sm",    "極小陰影"],
      ["shadow",       "預設陰影"],
      ["shadow-md",    "中陰影"],
      ["shadow-lg",    "大陰影"],
      ["shadow-xl",    "超大陰影"],
      ["shadow-2xl",   "最大陰影"],
      ["shadow-inner", "向內陰影"],
    ].map(([cls, desc])=>({
      cls,
      desc,
      preview: (
        <div className="py-4 px-2 bg-gray-50 rounded flex justify-center">
          <div className={`${cls} w-24 h-12 bg-white rounded-lg flex items-center justify-center text-xs text-gray-500 font-medium`}>{cls}</div>
        </div>
      ),
    })),
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // OPACITY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Opacity", cards: [
    {
      cls: "opacity-{0~100}",
      desc: "元素整體透明度，0 全透明 → 100 不透明",
      preview: (
        <div className="flex gap-3 items-end">
          {[0,10,25,50,75,90,100].map(o=>(
            <div key={o} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-blue-500 rounded-lg" style={{opacity:o/100}}/>
              <span className="text-[9px] text-gray-500">{o}</span>
            </div>
          ))}
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FILTERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Filters", cards: [
    {
      cls: "blur-*",
      desc: "模糊濾鏡，數值越大越模糊",
      preview: (
        <div className="flex gap-3 items-center flex-wrap">
          {["blur-none","blur-sm","blur","blur-md","blur-lg","blur-xl"].map(cls=>(
            <div key={cls} className="flex flex-col items-center gap-1">
              <div className={`${cls} w-10 h-10 bg-linear-to-br from-blue-400 to-purple-500 rounded-lg`}/>
              <span className="text-[9px] text-gray-500">{cls.replace("blur-","")}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      cls: "brightness-*",
      desc: "亮度調整，100 為原始，>100 變亮，<100 變暗",
      preview: (
        <div className="flex gap-3 items-center flex-wrap">
          {[50,75,100,125,150,200].map(n=>(
            <div key={n} className="flex flex-col items-center gap-1">
              <div className={`brightness-${n} w-10 h-10 bg-orange-400 rounded-lg`}/>
              <span className="text-[9px] text-gray-500">{n}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      cls: "contrast-*",
      desc: "對比度調整，100 為原始",
      preview: (
        <div className="flex gap-3 items-center flex-wrap">
          {[50,75,100,125,150,200].map(n=>(
            <div key={n} className="flex flex-col items-center gap-1">
              <div className={`contrast-${n} w-10 h-10 bg-linear-to-br from-gray-200 to-gray-800 rounded-lg`}/>
              <span className="text-[9px] text-gray-500">{n}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      cls: "grayscale",
      desc: "去色 vs 原色",
      preview: (
        <div className="flex gap-6 items-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 bg-linear-to-br from-red-400 via-yellow-400 to-blue-500 rounded-lg"/>
            <span className="text-[10px] text-gray-400">原色</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="grayscale w-14 h-14 bg-linear-to-br from-red-400 via-yellow-400 to-blue-500 rounded-lg"/>
            <span className="text-[10px] text-gray-400">grayscale</span>
          </div>
        </div>
      ),
    },
    {
      cls: "saturate-*",
      desc: "飽和度調整，0 完全去飽和，100 原始",
      preview: (
        <div className="flex gap-3 items-center flex-wrap">
          {[0,50,100,150,200].map(n=>(
            <div key={n} className="flex flex-col items-center gap-1">
              <div className={`saturate-${n} w-10 h-10 bg-linear-to-br from-red-400 to-blue-500 rounded-lg`}/>
              <span className="text-[9px] text-gray-500">{n}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      cls: "sepia",
      desc: "懷舊棕色濾鏡",
      preview: (
        <div className="flex gap-6 items-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 bg-linear-to-br from-green-400 to-blue-500 rounded-lg"/>
            <span className="text-[10px] text-gray-400">原色</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="sepia w-14 h-14 bg-linear-to-br from-green-400 to-blue-500 rounded-lg"/>
            <span className="text-[10px] text-gray-400">sepia</span>
          </div>
        </div>
      ),
    },
    {
      cls: "backdrop-blur-*",
      desc: "背景模糊（毛玻璃效果）",
      preview: (
        <div className="relative w-48 h-24 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 rounded-lg overflow-hidden">
          <div className="absolute inset-4 backdrop-blur-sm bg-white/20 rounded-lg flex items-center justify-center text-white text-xs font-bold">backdrop-blur-sm</div>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRANSFORMS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Transform — Rotate", cards: [
    ...[0,6,12,45,90,135,180].map(deg=>({
      cls: `rotate-${deg}`,
      desc: `旋轉 ${deg}°`,
      preview: (
        <div className="flex flex-col items-center gap-2 py-2">
          <div style={{transform:`rotate(${deg}deg)`}} className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">→</div>
          <span className="text-[10px] text-gray-400">{deg}°</span>
        </div>
      ),
    })),
  ]},

  { title: "Transform — Scale", cards: [
    ...[0,50,75,90,100,110,125,150].map(n=>({
      cls: `scale-${n}`,
      desc: `縮放 ${n}%`,
      preview: (
        <div className="flex flex-col items-center gap-2 py-2 h-20 justify-center">
          <div style={{transform:`scale(${n/100})`}} className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">{n}%</div>
        </div>
      ),
    })),
  ]},

  { title: "Transform — Translate", cards: [
    {
      cls: "translate-x-*",
      desc: "X 軸水平位移",
      preview: (
        <div className="bg-gray-100 rounded p-3 h-20 relative overflow-hidden">
          <div className="flex items-center h-full gap-2">
            {[-8,-4,0,4,8,16].map(n=>(
              <div key={n} className="flex flex-col items-center gap-1">
                <div style={{transform:`translateX(${n*4}px)`}} className="w-8 h-8 bg-purple-400 rounded text-[9px] text-white font-bold flex items-center justify-center">{n}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      cls: "translate-y-*",
      desc: "Y 軸垂直位移",
      preview: (
        <div className="bg-gray-100 rounded p-3 h-24 overflow-hidden">
          <div className="flex items-start gap-3">
            {[-4,-2,0,2,4,6].map(n=>(
              <div key={n} className="flex flex-col items-center gap-1">
                <div style={{transform:`translateY(${n*4}px)`}} className="w-8 h-8 bg-pink-400 rounded text-[9px] text-white font-bold flex items-center justify-center">{n}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      cls: "skew-x / skew-y",
      desc: "X / Y 軸傾斜變形",
      preview: (
        <div className="flex gap-6 items-center py-2">
          {[["skew-x-6","X 方向"],["skew-y-6","Y 方向"]].map(([cls,note])=>(
            <div key={cls} className="flex flex-col items-center gap-2">
              <div className={`${cls} w-12 h-12 bg-orange-400 rounded flex items-center justify-center text-white text-xs font-bold`}>{cls.split("-").slice(-1)}</div>
              <span className="text-[10px] text-gray-400">{note}</span>
            </div>
          ))}
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRANSITIONS & ANIMATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Transitions", cards: [
    {
      cls: "transition + duration",
      desc: "hover 時顏色平滑過渡",
      preview: (
        <div className="flex gap-3 flex-wrap">
          {[
            ["duration-75","75ms","bg-blue-400 hover:bg-blue-700"],
            ["duration-300","300ms","bg-green-400 hover:bg-green-700"],
            ["duration-700","700ms","bg-purple-400 hover:bg-purple-700"],
          ].map(([cls,ms,color])=>(
            <div key={cls} className="flex flex-col items-center gap-1">
              <button className={`transition-colors ${cls} ${color} text-white text-xs font-bold px-3 py-2 rounded-lg`}>{ms}</button>
              <span className="text-[9px] text-gray-400">hover 看效果</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      cls: "transition-all",
      desc: "所有屬性一起動畫",
      preview: (
        <div className="flex gap-3">
          <button className="transition-all duration-300 bg-blue-500 hover:bg-blue-700 hover:scale-110 hover:shadow-lg text-white text-xs font-bold px-4 py-2 rounded-lg">
            hover me
          </button>
          <span className="text-xs text-gray-400 self-center">縮放 + 顏色 + 陰影</span>
        </div>
      ),
    },
    {
      cls: "ease-in / ease-out / ease-in-out",
      desc: "動畫緩動曲線，控制加速 / 減速方式",
      preview: (
        <div className="flex gap-3 flex-wrap">
          {[
            ["ease-linear","linear"],
            ["ease-in","加速"],
            ["ease-out","減速"],
            ["ease-in-out","加速再減速"],
          ].map(([cls,note])=>(
            <button key={cls} className={`transition-all duration-500 ${cls} bg-gray-200 hover:bg-gray-700 hover:text-white text-xs px-2 py-1 rounded`}>{note}</button>
          ))}
        </div>
      ),
    },
  ]},

  { title: "Animation", cards: [
    {
      cls: "animate-spin",
      desc: "持續旋轉",
      preview: (
        <div className="flex items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full"/>
          <span className="text-sm text-gray-500">Loading spinner</span>
        </div>
      ),
    },
    {
      cls: "animate-ping",
      desc: "擴散波紋效果",
      preview: (
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="animate-ping absolute w-6 h-6 bg-green-400 rounded-full opacity-75"/>
            <div className="w-4 h-4 bg-green-600 rounded-full"/>
          </div>
          <span className="text-sm text-gray-500">Notification dot</span>
        </div>
      ),
    },
    {
      cls: "animate-pulse",
      desc: "呼吸閃爍",
      preview: (
        <div className="flex flex-col gap-2 w-48">
          <div className="animate-pulse h-4 bg-gray-300 rounded"/>
          <div className="animate-pulse h-4 bg-gray-300 rounded w-3/4"/>
          <div className="animate-pulse h-4 bg-gray-300 rounded w-1/2"/>
          <span className="text-[10px] text-gray-400">Skeleton loading</span>
        </div>
      ),
    },
    {
      cls: "animate-bounce",
      desc: "上下彈跳",
      preview: (
        <div className="flex items-end gap-4 h-16">
          <div className="animate-bounce w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg">↓</div>
          <span className="text-sm text-gray-500 mb-0">Scroll down</span>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POSITION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Position", cards: [
    {
      cls: "relative / absolute",
      desc: "relative 建立定位基準，absolute 相對父元素定位",
      preview: (
        <div>
          <div className="relative w-full h-20 bg-blue-100 rounded border-2 border-dashed border-blue-300">
            <span className="text-[10px] text-blue-400 p-1">relative 父容器</span>
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">absolute top-2 right-2</div>
            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">absolute bottom-2 left-2</div>
          </div>
        </div>
      ),
    },
    {
      cls: "top / right / bottom / left",
      desc: "定位偏移量，inset-0 = 貼齊四邊",
      preview: (
        <div className="relative w-full h-28 bg-gray-100 rounded border-2 border-dashed border-gray-300">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded">top-0</div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded">bottom-0</div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded">left-0</div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded">right-0</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gray-400 text-white text-[10px] px-2 py-0.5 rounded">inset-0</div>
          </div>
        </div>
      ),
    },
    {
      cls: "z-index",
      desc: "堆疊層級，數字越大越在上面",
      preview: (
        <div className="relative h-16">
          {[
            {z:"z-30",color:"bg-blue-500",left:"left-0",top:"top-0"},
            {z:"z-20",color:"bg-purple-500",left:"left-6",top:"top-2"},
            {z:"z-10",color:"bg-green-500",left:"left-12",top:"top-4"},
          ].map(({z,color,left,top})=>(
            <div key={z} className={`absolute ${left} ${top} ${z} ${color} text-white text-xs font-bold w-20 h-10 rounded flex items-center justify-center shadow`}>{z}</div>
          ))}
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // OVERFLOW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Overflow", cards: [
    ...[
      ["overflow-visible","內容超出仍顯示"],
      ["overflow-hidden","超出被截斷"],
      ["overflow-scroll","永遠顯示捲軸"],
      ["overflow-auto","只在需要時顯示捲軸"],
    ].map(([cls,note])=>({
      cls: cls as string,
      desc: note as string,
      preview: (
        <div>
          <div className={`${cls} h-12 w-full bg-gray-100 rounded border border-gray-200`}>
            <div className="w-64 h-8 bg-blue-400 text-white text-xs flex items-center px-2 m-2 rounded whitespace-nowrap">
              很長的內容 — Long content that overflows the container
            </div>
          </div>
          <Label>{note}</Label>
        </div>
      ),
    })),
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Ring (Focus Ring)", cards: [
    ...[1,2,4,8].map(n=>({
      cls: `ring-${n}`,
      desc: `外框光暈 ${n}px`,
      preview: (
        <div className="p-3 bg-gray-50 rounded flex justify-center">
          <div className={`ring-${n} ring-blue-500 w-20 h-10 bg-white rounded-lg flex items-center justify-center text-xs text-gray-600`}>ring-{n}</div>
        </div>
      ),
    })),
    {
      cls: "ring-offset-2",
      desc: "光暈與元素邊緣之間的空隙",
      preview: (
        <div className="p-3 bg-gray-50 rounded flex justify-center">
          <div className="ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50 w-20 h-10 bg-white rounded-lg flex items-center justify-center text-xs text-gray-600">ring-offset</div>
        </div>
      ),
    },
    {
      cls: "ring-inset",
      desc: "光暈向內繪製，不佔外部空間",
      preview: (
        <div className="p-3 bg-gray-50 rounded flex justify-center">
          <div className="ring-2 ring-inset ring-blue-500 w-20 h-10 bg-white rounded-lg flex items-center justify-center text-xs text-gray-600">ring-inset</div>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INTERACTIVITY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Cursor", cards: [
    {
      cls: "cursor-*",
      desc: "滑鼠指標樣式，hover 到方塊查看效果",
      preview: (
        <div className="flex flex-wrap gap-2">
          {[
            ["cursor-auto","auto"],["cursor-default","default"],["cursor-pointer","pointer"],
            ["cursor-wait","wait"],["cursor-text","text"],["cursor-move","move"],
            ["cursor-not-allowed","not-allowed"],["cursor-grab","grab"],
            ["cursor-crosshair","crosshair"],["cursor-zoom-in","zoom-in"],
          ].map(([cls,label])=>(
            <div key={cls} className={`${cls} px-2 py-1 bg-gray-100 hover:bg-blue-100 rounded text-xs text-gray-700 border border-gray-200`}>{label}</div>
          ))}
        </div>
      ),
    },
  ]},

  { title: "User Select", cards: [
    ...[
      ["select-none","無法選取文字"],
      ["select-text","可選取文字"],
      ["select-all","點擊全選"],
      ["select-auto","瀏覽器預設"],
    ].map(([cls,note])=>({
      cls: cls as string,
      desc: note as string,
      preview: (
        <div>
          <div className={`${cls} bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-sm text-gray-700`}>
            試著選取這段文字 — Try to select this text
          </div>
          <Label>{note}</Label>
        </div>
      ),
    })),
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RESPONSIVE BREAKPOINTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Responsive Breakpoints", cards: [
    {
      cls: "sm: / md: / lg: / xl: / 2xl:",
      desc: "前綴讓 class 只在對應螢幕寬度以上生效",
      preview: (
        <div className="flex flex-col gap-2">
          {[
            {bp:"sm",w:"640px",color:"bg-blue-100 border-blue-300 text-blue-700"},
            {bp:"md",w:"768px",color:"bg-green-100 border-green-300 text-green-700"},
            {bp:"lg",w:"1024px",color:"bg-yellow-100 border-yellow-300 text-yellow-700"},
            {bp:"xl",w:"1280px",color:"bg-orange-100 border-orange-300 text-orange-700"},
            {bp:"2xl",w:"1536px",color:"bg-red-100 border-red-300 text-red-700"},
          ].map(({bp,w,color})=>(
            <div key={bp} className={`flex items-center gap-2 px-3 py-1.5 rounded border ${color}`}>
              <code className="text-sm font-bold font-mono w-8">{bp}:</code>
              <span className="text-xs">≥ {w} 才生效</span>
              <code className="ml-auto text-xs font-mono opacity-70">{bp}:text-lg  {bp}:flex-col</code>
            </div>
          ))}
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE VARIANTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "State Variants", cards: [
    {
      cls: "hover:",
      desc: "滑鼠懸停時套用",
      preview: (
        <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-500 hover:text-white transition-colors">
          Hover 我看看
        </button>
      ),
    },
    {
      cls: "focus:",
      desc: "取得 focus 時套用",
      preview: (
        <input className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-48" placeholder="點我 focus" />
      ),
    },
    {
      cls: "active:",
      desc: "點擊按下時套用",
      preview: (
        <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium active:scale-95 active:bg-green-700 transition-all">
          按住看縮放
        </button>
      ),
    },
    {
      cls: "disabled:",
      desc: "元素 disabled 狀態時套用",
      preview: (
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">正常</button>
          <button disabled className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">disabled</button>
        </div>
      ),
    },
    {
      cls: "group-hover:",
      desc: "父元素 hover 時，子元素改變",
      preview: (
        <div className="group flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer w-56">
          <div className="w-8 h-8 rounded-lg bg-gray-200 group-hover:bg-blue-400 transition-colors flex items-center justify-center text-gray-500 group-hover:text-white">★</div>
          <div>
            <div className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Title</div>
            <div className="text-xs text-gray-400 group-hover:text-blue-400">Subtitle</div>
          </div>
        </div>
      ),
    },
    {
      cls: "odd: / even:",
      desc: "奇偶行交替背景",
      preview: (
        <div className="rounded overflow-hidden border border-gray-200 w-48">
          {["Apple","Banana","Cherry","Date","Elder"].map((item,i)=>(
            <div key={item} className={`px-3 py-1.5 text-sm ${i%2===0?"bg-white":"bg-gray-50"}`}>{item}</div>
          ))}
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DARK MODE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Dark Mode", cards: [
    {
      cls: "dark:bg-* / dark:text-*",
      desc: "系統或 HTML class 切換深色模式時套用",
      preview: (
        <div className="flex gap-4">
          <div className="bg-white border rounded-xl p-4 w-36 shadow-sm">
            <div className="text-xs font-bold text-gray-700 mb-1">Light Mode</div>
            <div className="text-xs text-gray-500">bg-white</div>
            <div className="text-xs text-gray-500">text-gray-700</div>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 w-36 shadow-sm">
            <div className="text-xs font-bold text-white mb-1">Dark Mode</div>
            <div className="text-xs text-gray-400">dark:bg-gray-900</div>
            <div className="text-xs text-gray-400">dark:text-white</div>
          </div>
        </div>
      ),
    },
  ]},

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ARBITRARY VALUES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { title: "Arbitrary Values [ ]", cards: [
    {
      cls: "w-[任意值]",
      desc: "用 [ ] 帶入任意 CSS 值，不受 scale 限制",
      preview: (
        <div className="flex flex-col gap-2 w-full">
          {[["w-[200px]","200px"],["w-[33.33%]","33.33%"],["w-[calc(100%-2rem)]","calc(100%-2rem)"]].map(([cls,val])=>(
            <div key={cls} className="flex items-center gap-2">
              <div className={`${cls} h-7 bg-indigo-400 rounded text-[10px] text-white flex items-center justify-center truncate px-1`}>{val}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      cls: "bg-[#hex] / text-[#hex]",
      desc: "直接使用 HEX / RGB 等任意顏色值",
      preview: (
        <div className="flex flex-wrap gap-2">
          {["#ff6b6b","#4ecdc4","#45b7d1","#96ceb4","#ffeaa7","#dfe6e9"].map(hex=>(
            <div key={hex} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-lg shadow-sm" style={{background:hex}}/>
              <code className="text-[8px] text-gray-500">{hex}</code>
            </div>
          ))}
        </div>
      ),
    },
    {
      cls: "text-[14px] / p-[10px_20px]",
      desc: "任意字體大小或 padding，支援空格用底線分隔",
      preview: (
        <div className="flex flex-col gap-2">
          {[
            {cls:"text-[11px]",val:"11px"},
            {cls:"text-[14px]",val:"14px"},
            {cls:"text-[19px]",val:"19px"},
            {cls:"text-[26px]",val:"26px"},
          ].map(({cls,val})=>(
            <span key={val} className={`${cls} text-gray-700`}>{val} — The quick brown fox</span>
          ))}
        </div>
      ),
    },
  ]},
];

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────
export default function TailwindCheatsheet() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState(GROUPS[0]?.title ?? "");
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

  // Scrollspy: observe each section inside the main scroll container
  useEffect(() => {
    if (search) return;
    const root = mainRef.current;
    if (!root) return;
    const observers: IntersectionObserver[] = [];
    GROUPS.forEach(g => {
      const el = document.getElementById(slugify(g.title));
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(g.title); },
        { root, rootMargin: "-10% 0px -70% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [search]);

  // Auto-scroll sidebar to keep active item visible
  useEffect(() => {
    const btn = activeButtonRef.current;
    const sidebar = sidebarRef.current;
    if (!btn || !sidebar) return;
    const btnTop = btn.offsetTop;
    const sidebarH = sidebar.clientHeight;
    const scrollTop = sidebar.scrollTop;
    if (btnTop < scrollTop + 16 || btnTop > scrollTop + sidebarH - 48)
      sidebar.scrollTo({ top: btnTop - sidebarH / 2 + 20, behavior: "smooth" });
  }, [activeSection]);

  const filtered = search
    ? GROUPS.map(g => ({
        ...g,
        cards: g.cards.filter(c =>
          c.cls.toLowerCase().includes(search.toLowerCase()) ||
          (c.desc ?? "").toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(g => g.cards.length > 0)
    : GROUPS;

  function scrollTo(title: string) {
    document.getElementById(slugify(title))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="h-screen bg-gray-50 font-sans flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Tailwind CSS Cheat Sheet</h1>
          <p className="text-[11px] text-gray-400">每個 class 都有即時視覺效果預覽</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜尋 class… (flex, rounded, shadow)"
          className="ml-auto w-72 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="text-xs text-gray-400 shrink-0">{filtered.length} 分類</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar ── */}
        {!search && (
          <aside ref={sidebarRef} className="sticky top-14 h-[calc(100vh-56px)] w-52 shrink-0 overflow-y-auto border-r border-gray-200 bg-white py-3">
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">目錄</div>
            <nav className="flex flex-col gap-0.5 px-2">
              {GROUPS.map(g => {
                const isActive = activeSection === g.title;
                return (
                  <button
                    key={g.title}
                    ref={isActive ? activeButtonRef : null}
                    onClick={() => scrollTo(g.title)}
                    className={`text-left text-xs px-2 py-1.5 rounded transition-colors truncate ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600 font-semibold"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {isActive && <span className="inline-block w-1 h-1 rounded-full bg-indigo-500 mr-1.5 mb-0.5 align-middle" />}
                    {g.title}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* ── Main ── */}
        <div ref={mainRef} className="flex-1 min-w-0 overflow-y-auto px-6 py-6 flex flex-col gap-10">
          {filtered.map(group => (
            <section key={group.title} id={slugify(group.title)} className="scroll-mt-16">
              {/* Group title */}
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
                {group.title}
              </h2>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.cards.map(card => (
                  <div key={card.cls} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Card header */}
                    <div className="px-3 pt-3 pb-2 border-b border-gray-100 bg-gray-50 shrink-0">
                      <code className="text-xs font-bold font-mono text-indigo-600 break-all">{card.cls}</code>
                      {card.desc && <p className="text-[10px] text-gray-400 mt-0.5">{card.desc}</p>}
                    </div>
                    {/* Preview area */}
                    <div className="flex-1 p-4 flex items-start">
                      {card.preview}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
