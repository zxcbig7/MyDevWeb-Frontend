// HomePage.tsx：主頁面布局
// 桌面（≥ 768px）：左側 Sider 常駐
// 手機（< 768px）：頂部標題列 + 底部 Tab Bar + Drawer（更多）

import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { ImCalculator } from "react-icons/im";
import {
  DesktopOutlined,
  PieChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  BookOutlined,
  LockOutlined,
} from "@ant-design/icons";

import type { MenuProps } from "antd";
import { Drawer, Layout, Menu, theme } from "antd";

const { Content, Sider } = Layout;
type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return { key, icon, children, label } as MenuItem;
}

// 
const SHOW_PRIVATE = import.meta.env.VITE_SHOW_PRIVATE === "true";

// 私有項目標籤：公開時正常顯示，非公開時加鎖頭圖示
function privateLabel(label: string) {
  if (SHOW_PRIVATE) return label;
  return (
    <span className="flex items-center justify-between gap-1 w-full opacity-50">
      {label}
      <LockOutlined style={{ fontSize: 11 }} />
    </span>
  );
}

const items: MenuItem[] = [
  getItem("首頁", "/homepage", <PieChartOutlined />),
  getItem("開發筆記", "/notes", <BookOutlined />),

  { type: "divider" } as MenuItem,

  {
    key: "專案開發",
    icon: <DesktopOutlined />,
    label: privateLabel("專案開發"),
    disabled: !SHOW_PRIVATE,
    children: [
      getItem("Rule Viewer", "/ruleviewer", <DesktopOutlined />),
      getItem("Sudoku Solver", "/sudoku", <ImCalculator />),
    ],
  } as MenuItem,

  {
    key: "開發輔助工具",
    icon: <ImCalculator />,
    label: privateLabel("開發輔助工具"),
    disabled: !SHOW_PRIVATE,
    children: [
      getItem("Tailwind Cheatsheet", "/tailwind", <ImCalculator />),
    ],
  } as MenuItem,
];

// ── 響應式偵測 hook ─────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}


// ── 主元件 ──────────────────────────────────────────────────
const HomePage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const selectedKeys = useMemo(() => [location.pathname], [location.pathname]);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    const key = String(e.key);
    if (key.startsWith("/")) {
      navigate(key);
      setDrawerOpen(false);
    }
  };

  // 目前頁面名稱（手機 top bar 顯示）
  const currentPageLabel = useMemo(() => {
    const flat = items.flatMap((item: any) =>
      item?.children ? [item, ...item.children] : [item]
    );
    const found = flat.find((item: any) => item?.key === location.pathname);
    return typeof found?.label === "string" ? found.label : "Menu";
  }, [location.pathname]);

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>

      {/* ── 桌面 Sider（手機隱藏） ─────────────────────────── */}
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} style={{ overflow: "hidden" }}>
          {/* 收合狀態：整條 Sider 可點擊展開 */}
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%", cursor: collapsed ? "pointer" : "default" }}
            onClick={() => { if (collapsed) setCollapsed(false); }}
          >

            {/* 收合按鈕：整條 header 都可點 */}
            <div
              onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c); }}
              style={{
                display: "flex", alignItems: "center",
                justifyContent: "center",
                padding: "0 12px", height: 48, flexShrink: 0,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer", color: "rgba(255,255,255,0.45)",
                fontSize: 16, transition: "color 0.2s, background 0.2s",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                e.currentTarget.style.background = "none";
              }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : (
                <>
                  <MenuFoldOutlined />
                  <span style={{ fontSize: 12, marginLeft: 8 }}>收合</span>
                </>
              )}
            </div>

            {/* 選單 */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              <Menu
                theme="dark" mode="inline" items={items}
                selectedKeys={selectedKeys} onClick={handleMenuClick}
                style={{ borderRight: 0 }}
              />
            </div>

          </div>
        </Sider>
      )}

      {/* ── 手機 Drawer ─────────────────────────────────────── */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{
          body: { padding: 0, background: "#001529", height: "100%", display: "flex", flexDirection: "column" },
          header: { display: "none" },
          wrapper: { width: "min(240px, 75vw)" },
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <Menu
            theme="dark" mode="inline" items={items}
            selectedKeys={selectedKeys} onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          />
        </div>
      </Drawer>

      <Layout style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>

        {/* ── 手機 Top Bar（標題） ─────────────────────────── */}
        {isMobile && (
          <div style={{
            height: 44, background: "#001529", flexShrink: 0,
            display: "flex", alignItems: "center",
            justifyContent: "center", padding: "0 12px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600 }}>
              {currentPageLabel}
            </span>
          </div>
        )}

        {/* ── 內容區 ──────────────────────────────────────── */}
        <Content style={{
          flex: 1, minHeight: 0, overflow: "hidden",
          display: "flex", flexDirection: "column", margin: 0, padding: 0,
        }}>
          <div style={{
            flex: 1, minHeight: 0, padding: 0,
            background: colorBgContainer,
            borderRadius: isMobile ? 0 : borderRadiusLG,
            overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            <Outlet />
          </div>
        </Content>

        {/* ── 手機底部 Tab Bar ─────────────────────────────── */}
        {isMobile && (() => {
          const tabs = [
            { key: "/homepage", label: "首頁", icon: <PieChartOutlined /> },
            { key: "/notes",    label: "筆記", icon: <BookOutlined /> },
            { key: "__more__",  label: "更多", icon: <MenuOutlined /> },
          ];
          const active = location.pathname;
          return (
            <div style={{
              height: 56, flexShrink: 0,
              background: "#001529",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
            }}>
              {tabs.map((tab) => {
                const isActive = tab.key !== "__more__" && active.startsWith(tab.key);
                return (
                  <button
                    key={tab.key}
                    onClick={() => tab.key === "__more__" ? setDrawerOpen(true) : navigate(tab.key)}
                    style={{
                      flex: 1, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 3,
                      background: "none", border: "none", cursor: "pointer",
                      color: isActive ? "#1677ff" : "rgba(255,255,255,0.45)",
                      fontSize: 18, transition: "color 0.2s",
                    }}
                  >
                    {tab.icon}
                    <span style={{ fontSize: 10, lineHeight: 1 }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })()}
      </Layout>

    </Layout>
  );
};

export default HomePage;
