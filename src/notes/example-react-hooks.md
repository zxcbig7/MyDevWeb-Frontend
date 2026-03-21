---
title: React Hooks 快速參考
date: 2025-01-01
tags: [React, TypeScript]
description: useState、useEffect、useRef、useMemo 等常用 Hook 語法整理。
---

## useState

宣告一個本地狀態，回傳 `[值, 更新函數]`。

```tsx
const [count, setCount] = useState(0);
const [name, setName] = useState<string | null>(null);

setCount(c => c + 1);  // functional update（安全寫法）
```

## useEffect

處理副作用（API call、事件監聽、Timer）。

```tsx
useEffect(() => {
  fetchData();            // 執行副作用
  return () => cleanup(); // cleanup（元件卸載時執行）
}, [dep]);               // deps 變化時重新執行；[] 只跑一次
```

## useRef

持有不觸發重渲染的可變值，或取得 DOM 節點。

```tsx
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();

const timerRef = useRef<number | null>(null); // 跨渲染保留值
```

## useMemo / useCallback

避免不必要的重算或函數重建。

```tsx
const sorted = useMemo(() => [...list].sort(), [list]);
const handleClick = useCallback(() => doSomething(id), [id]);
```
