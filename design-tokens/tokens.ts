// TODO: stub — 與 tokens.css 同步維護。給 inline style / AntD theme provider 用
// 例如：<ConfigProvider theme={{ token: { colorPrimary: colors.primary } }}>

export const colors = {
  primary: "#1677ff",
  bg: "#ffffff",
  bgDark: "#001529",
  text: "rgba(0, 0, 0, 0.88)",
  textMuted: "rgba(255, 255, 255, 0.45)",
  border: "rgba(255, 255, 255, 0.08)",
  danger: "#ff4d4f",
} as const;

export const radius = {
  btn: 8,
  card: 16,
  panel: 24,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
} as const;

export const fontSize = {
  sm: 12,
  base: 14,
  lg: 16,
} as const;

export const fontFamily = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
} as const;
