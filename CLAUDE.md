# MyDevWeb Frontend

## Tech Stack
- React 18 + TypeScript（strict mode）
- Vite（build tool）
- Ant Design（UI library）

## Build & Run
```
npm run dev      # 本機開發，localhost:5173
npm run build    # 生產 build，輸出 dist/
npm run lint     # ESLint 檢查
```

## Code Style
- 元件：PascalCase，functional component + arrow function
- Props：explicit interface 定義
- API calls：統一放在 `src/api/` 或 `src/services/`
- 環境變數：用 `VITE_` 前綴，透過 `import.meta.env.VITE_XXX` 存取

## Naming Conventions
- Variables / parameters：camelCase（`userId`、`isLoading`）
- Functions / methods：camelCase（`fetchData`、`handleSubmit`）
- React components：PascalCase（`UserCard`、`AuthPage`）
- Types / Interfaces：PascalCase，Interface 不加 `I` 前綴（`UserProfile` 非 `IUserProfile`）
- Constants：UPPER_SNAKE_CASE（`MAX_RETRY`、`API_BASE_URL`）
- Boolean 變數加語意前綴：`is`、`has`、`can`（`isVisible`、`hasError`）

## 重要環境變數
- `VITE_API_BASE`：後端 API base URL
- `VITE_AUTH_BASE`：Auth base URL
- `VITE_GOOGLE_CLIENT_ID`：Google OAuth client ID

## CI/CD
- push to main → lint + build（GitHub Actions ci.yml）
- push tag `V.*` → build image + push Docker Hub + 更新 Deployment repo（release.yml）
- Image：`zxcbig7/mydevweb-frontend:<tag>`
