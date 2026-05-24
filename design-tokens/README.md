# Design Tokens

兩個 app（`apps/blog`、`apps/devconsole`）共用的 design tokens，維持視覺一致。

## 內容

- `tokens.css` — CSS variables，給 stylesheet / Tailwind / inline `var(--x)` 使用
- `tokens.ts` — TypeScript constants，給 AntD `ConfigProvider`、inline style、JS 邏輯使用

> 兩份必須**同步維護**（改一邊另一邊也要改）。stub 階段為求簡單先不做 build-time 校驗。

## 用法

### CSS

```tsx
// apps/<app>/src/main.tsx
import "../../../design-tokens/tokens.css";
import "./index.css";
```

```css
/* 任何 stylesheet */
.my-card {
  background: var(--color-bg);
  border-radius: var(--radius-card);
  padding: var(--spacing-md);
}
```

### TypeScript

```tsx
import { colors } from "../../../design-tokens/tokens";

<ConfigProvider theme={{ token: { colorPrimary: colors.primary } }}>
  ...
</ConfigProvider>
```

## 注意

- TODO: 後續盤點現有 hard-code 顏色 / spacing / font 收斂到此
- 改變 token 後兩個 app 都需要 rebuild / restart dev server 才看得到
