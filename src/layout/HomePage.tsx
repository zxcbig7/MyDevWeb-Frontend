
// HomePage.tsx：主頁面布局，包含側邊欄和內容區域，使用 Ant Design 的 Layout 組件實現。
// 1. 定義側邊欄菜單項目，包含圖標和子菜單。
// 2. 使用 useState 管理側邊欄的折疊狀態，useLocation 獲取當前路徑以高亮選中菜單項，useNavigate 用於導航。
// 3. 在內容區域使用 Outlet 組件顯示子路由對應的內容。
import React, { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LogoutOutlined } from "@ant-design/icons";

// 圖片
import { ImCalculator } from "react-icons/im";
import {
  DesktopOutlined,
  PieChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";

// 模板
import type { MenuProps } from "antd";
import { Layout, Menu, theme } from "antd";

// Layout 組件
const { Content, Sider } = Layout;

// 定義菜單項目的類型，使用 TypeScript 的 Required 和 MenuProps 來確保所有屬性都被定義。
// 語法:
// type MenuItem = Required<MenuProps>["items"][number];
// 這行代碼的意思是：從 MenuProps 的 items 屬性中提取出每個菜單項目的類型，並使用 Required 確保所有屬性都是必需的。

type MenuItem = Required<MenuProps>["items"][number];

// 定義一個輔助函數 getItem，用於創建菜單項目對象，接受標籤、鍵、圖標和子菜單作為參數，返回一個符合 MenuItem 類型的對象。

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return { key, icon, children, label } as MenuItem;
}

const IS_DEV = import.meta.env.VITE_APP_ENV === "DEV";

const items: MenuItem[] = [
  getItem("Dashboard", "/dashboard", <PieChartOutlined />),
  getItem("Rule Viewer", "/ruleviewer", <DesktopOutlined />),

  ...(IS_DEV ? [
    getItem("Sudoku Solver", "/sudoku", <ImCalculator />),
    getItem("Tailwind Cheatsheet", "/tailwind", <ImCalculator />),

    getItem("RTD Rule Viewer", "", <DesktopOutlined />, [
      getItem("Block Inspector", "/ruleviewer/test1", <DesktopOutlined />),
      getItem("Rule View (Canvas)", "/ruleviewer/test2", <DesktopOutlined />),
      getItem("Controls", "/ruleviewer/test3", <DesktopOutlined />),
    ]),
  ] : []),
];

const HomePage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const selectedKeys = useMemo(() => [location.pathname], [location.pathname]);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    const key = String(e.key);
    // 只有 / 開頭的才當路由導頁，sub-menu 的 key 不導頁
    if (key.startsWith("/")) navigate(key);
  };

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ overflow: "hidden" }}
      >
        {/* 填滿 Sider 全高的 flex 容器 */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

          {/* 頂部：收合按鈕 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "0 8px",
            height: 48,
            flexShrink: 0,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            <button
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? "展開" : "收合"}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.45)",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 6,
                transition: "color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                e.currentTarget.style.background = "none";
              }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </div>

          {/* 中間：選單（佔滿剩餘空間） */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <Menu
              theme="dark"
              mode="inline"
              items={items}
              selectedKeys={selectedKeys}
              onClick={handleMenuClick}
              style={{ borderRight: 0 }}
            />
          </div>

          {/* 底部：登出（貼底） */}
          <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={logout}
              title="登出"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                height: 48,
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.45)",
                fontSize: 14,
                cursor: "pointer",
                transition: "color 0.2s, background 0.2s",
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
              <LogoutOutlined />
              {!collapsed && <span>登出</span>}
            </button>
          </div>

        </div>
      </Sider>

      <Layout style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/*<Header style={{ padding: 0, background: colorBgContainer }} />*/}
        <Content style={{
          margin: 0,
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: 0, // ✅ 改成內距
        }}>
           {/*<Breadcrumb style={{ margin: "0 0 0px 0" }} /> 麵包屑導覽：顯示「目前頁面在網站階層中的位置」 */}
          <div style={{
            flex: 1,
            minHeight: 0,
            padding: 0,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          >
            <Outlet /> {/* 內容由 App.tsx 的子路由決定，若無此，子路由的內容無處顯示。 */}
          </div>
        </Content>
      </Layout>

    </Layout>
  );
};

export default HomePage;
