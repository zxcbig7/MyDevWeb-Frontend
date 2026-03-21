---
title: TypeScript 常用技巧
date: 2025-01-02
tags: [TypeScript]
description: Utility Types、型別守衛、泛型等實用語法。
---

## Utility Types

```ts
type A = Partial<User>      // 所有欄位變 optional
type B = Required<User>     // 所有欄位變必填
type C = Pick<User, 'id' | 'name'>   // 挑幾個
type D = Omit<User, 'password'>      // 排除幾個
type E = Record<string, number>      // key-value map
```

## 型別守衛

```ts
function isString(v: unknown): v is string {
  return typeof v === 'string';
}

if (isString(value)) {
  console.log(value.toUpperCase()); // TS 知道這裡是 string
}
```

## 泛型

```ts
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// 帶約束
function getKey<T extends { id: string }>(item: T): string {
  return item.id;
}
```

## as const

```ts
const DIRECTIONS = ['left', 'right', 'up', 'down'] as const;
type Direction = typeof DIRECTIONS[number]; // 'left' | 'right' | 'up' | 'down'
```
