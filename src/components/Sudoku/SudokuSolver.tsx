import { useState, useEffect } from "react";
import axios from "axios";

export interface SovleRequest {
  solution: Grid | null;
}

export interface SolveResponse {
  solved: boolean;
  board: Grid;
  message: string;
}

type Grid = (number | null)[][];
type Selected = { row: number; col: number } | null;

type SolveStep =
  | { type: "try"; row: number; col: number; num: number }
  | { type: "backtrack"; row: number; col: number };

// 初始空格子
const mapFn = () => Array(9).fill(null);
const EMPTY_GRID: Grid = Array.from({ length: 9 }, mapFn);

//#region Sudoku Logic

function isValid(grid: Grid, row: number, col: number, num: number): boolean {
  // 行列檢查
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }

  // 3x3 區域檢查
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }

  // true: 沒有衝突->可繼續解
  // false: 有衝突->不繼續解(不嘗試填入下一個數字)
  return true;
}

// 求解思路: 從左上角開始，遇到空格就嘗試填入 1-9 的數字，並檢查是否有效。
// 如果有效，就繼續遞迴求解下一個空格；
// 如果無效或遞迴失敗，就回退（backtrack）並嘗試下一個數字。直到整個棋盤被填滿或確定無解。
function solve(grid: Grid, steps: SolveStep[]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, row, col, num)) {
            // 嘗試填入數字
            grid[row][col] = num;
            steps.push({ type: "try", row, col, num });
            // 繼續遞迴求解下一個空格
            if (solve(grid, steps)) return true;
            // 回退（backtrack）並嘗試下一個數字
            grid[row][col] = null;
            steps.push({ type: "backtrack", row, col });
          }
        }
        return false;
      }
    }
  }
  return true;
}
//#endregion

// 計算選取格子的同行、同列、同宮 已使用的數字（排除自身格子）
function getUsedNums(puzzle: Grid, row: number, col: number): Set<number> {
  const used = new Set<number>();
  for (let i = 0; i < 9; i++) {
    if (i !== col && puzzle[row][i] !== null) used.add(puzzle[row][i]!);
    if (i !== row && puzzle[i][col] !== null) used.add(puzzle[i][col]!);
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && puzzle[r][c] !== null) used.add(puzzle[r][c]!);
    }
  }
  return used;
}

// 數字選擇盤
function Choises({
  usedNums,
  noSelection,
  onSelect,
  onDelete,
}: {
  usedNums: Set<number>;
  noSelection: boolean;
  onSelect: (n: number) => void;
  onDelete: () => void;
}) {
  return (
    <div style={choicesStyles.wrapper}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
        const isUsed = usedNums.has(n);
        const btnDisabled = noSelection || isUsed;
        return (
          <button
            key={n}
            disabled={btnDisabled}
            onClick={() => onSelect(n)}
            style={{
              ...choicesStyles.numBtn,
              opacity: btnDisabled ? 0.3 : 1,
              cursor: btnDisabled ? "default" : "pointer",
              background: isUsed ? "#e0e0e0" : "#f5f5f5",
              textDecoration: isUsed ? "line-through" : "none",
            }}
          >
            {n}
          </button>
        );
      })}
      <button
        disabled={noSelection}
        onClick={onDelete}
        style={{
          ...choicesStyles.delBtn,
          opacity: noSelection ? 0.3 : 1,
          cursor: noSelection ? "default" : "pointer",
        }}
      >
        ×
      </button>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
type Difficulty = typeof DIFFICULTIES[number];

export default function SudokuSolver() {
  const [puzzle, setPuzzle] = useState<Grid>(EMPTY_GRID.map((row) => [...row]));
  const [clues, setClues] = useState<Grid | null>(null);
  const [solution, setSolution] = useState<Grid | null>(null);
  const [selected, setSelected] = useState<Selected>(null);
  const [locked, setLocked] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<SolveStep[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [isGenerating, setIsGenerating] = useState(false);

  // 填入數字到指定格子（functional update 避免 stale closure）
  const setCell = (row: number, col: number, value: number | null) => {
    setPuzzle((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = value;
      return next;
    });
    setSolution(null);
    setError(null);
  };

  // 鍵盤輸入支援：選取格子後可直接按數字鍵或退格
  useEffect(() => {
    if (!selected) return;
    const { row, col } = selected;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "9") {
        // 避免填寫重複數字
        if (isValid(puzzle, row, col, parseInt(e.key))) {
          setCell(row, col, parseInt(e.key));
        }
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        setCell(row, col, null);
      } else {
        const dirs: Record<string, [number, number]> = {
          ArrowRight: [0, 1], ArrowLeft: [0, -1],
          ArrowDown: [1, 0], ArrowUp: [-1, 0],
        };
        const dir = dirs[e.key];
        if (dir) {
          const [dr, dc] = dir;
          setSelected((s) => {
            if (!s) return s;
            let r = s.row + dr, c = s.col + dc;
            while (r >= 0 && r <= 8 && c >= 0 && c <= 8) {
              if (clues === null || clues[r][c] === null) return { row: r, col: c };
              r += dr; c += dc;
            }
            return s;
          });
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, clues]);

  // 固定題目：鎖定目前輸入的數字為黑字線索
  const handleSetPuzzle = () => {
    setClues(puzzle.map((r) => [...r])); // 快照目前格子為固定線索
    setLocked(true);
    setSelected(null);
    setSolution(null);
    setSteps([]);
    setError(null);
  };

  const handleSolve = () => {
    const grid: Grid = puzzle.map((row) => [...row]);
    const solveSteps: SolveStep[] = [];
    const success = solve(grid, solveSteps);
    if (success) {
      setSolution(grid);
      setSteps(solveSteps);
      setSelected(null);
      setError(null);
    } else {
      setSolution(null);
      setSteps([]);
      setError("此題目無解，請確認輸入是否正確。");
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await axios.get<{ success: boolean; data: { Board: number[][] } }>(
        `${API_BASE}/api/SudokuSolver/problem`,
        { params: { difficulty }, withCredentials: true }
      );
      const board = res.data.data.Board;
      const grid: Grid = board.map(row => row.map(n => n === 0 ? null : n));
      setPuzzle(grid);
      setClues(grid.map(r => [...r]));
      setSolution(null);
      setLocked(true);
      setSelected(null);
      setSteps([]);
    } catch {
      setError("出題失敗，請確認後端是否運行中。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setPuzzle(EMPTY_GRID.map((row) => [...row]));
    setClues(null);
    setSolution(null);
    setLocked(false);
    setSelected(null);
    setSteps([]);
    setError(null);
  };

  // 點擊格子：固定線索或答案格不可選取，其他格子可選取並顯示背景
  const handleCellClick = (row: number, col: number) => {
    const isFixedClue = clues !== null && clues[row][col] !== null;
    const isAnswerCell = solution !== null && puzzle[row][col] === null;
    if (isFixedClue || isAnswerCell) return; // 固定線索或答案格不可選
    setSelected({ row, col });
  };

  // 計算選取格子的已使用數字
  const usedNums = selected ? getUsedNums(puzzle, selected.row, selected.col) : new Set<number>();

  const dimStyle = (disabled: boolean): React.CSSProperties => ({
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? "default" : "pointer",
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sudoku Solver</h1>

      <div style={styles.gridWrapper}>
        <table style={styles.table}>
          <tbody>
            {Array.from({ length: 9 }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: 9 }, (_, col) => {
                  const puzzleVal = puzzle[row][col];
                  const solvedVal = solution ? solution[row][col] : null;
                  const isFixedClue = clues !== null && clues[row][col] !== null;
                  const isAnswerCell = solution !== null && puzzleVal === null;
                  const isSelected = selected?.row === row && selected?.col === col;

                  const borderRight = (col === 2 || col === 5 || col === 8) ? "3px solid #333" : "1px solid #aaa";
                  const borderBottom = (row === 2 || row === 5 || row === 8) ? "3px solid #333" : "1px solid #aaa";

                  return (
                    <td
                      key={col}
                      onClick={() => handleCellClick(row, col)}
                      style={{
                        ...styles.cell,
                        borderRight,
                        borderBottom,
                        borderLeft: col === 0 ? "3px solid #333" : undefined,
                        borderTop: row === 0 ? "3px solid #333" : undefined,
                        background: isSelected ? "#fff9c4" : "transparent",
                        cursor: isFixedClue || isAnswerCell ? "default" : "pointer",
                        userSelect: "none",
                      }}
                    >
                      {isAnswerCell ? (
                        // 答案：藍字
                        <span style={styles.answerText}>{solvedVal}</span>
                      ) : isFixedClue ? (
                        // 固定線索：黑字，不可選
                        <span style={styles.clueText}>{puzzleVal}</span>
                      ) : (
                        // 可編輯格（輸入中 or 鎖定後自填）
                        <span style={styles.userText}>{puzzleVal ?? ""}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 數字選擇盤 */}
      <Choises
        usedNums={usedNums}
        noSelection={selected === null}
        onSelect={(n) => { if (selected) setCell(selected.row, selected.col, n); }}
        onDelete={() => { if (selected) setCell(selected.row, selected.col, null); }}
      />

      {selected && (
        <p style={styles.hint}>已選取：第 {selected.row + 1} 列，第 {selected.col + 1} 行</p>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {/* 出題區 */}
      <div style={styles.buttonRow}>
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value as Difficulty)}
          style={styles.select}
        >
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button
          style={{ ...styles.generateBtn, opacity: isGenerating ? 0.6 : 1 }}
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? "出題中…" : "出題"}
        </button>
      </div>

      {/* 操作區 */}
      <div style={styles.buttonRow}>
        <button style={{ ...styles.solveBtn, ...dimStyle(locked) }} onClick={handleSetPuzzle} disabled={locked}>
          設定
        </button>
        <button style={{ ...styles.solveBtn, ...dimStyle(!locked) }} onClick={handleSolve} disabled={!locked}>
          求解
        </button>
        <button style={styles.clearBtn} onClick={handleClear}>
          清除
        </button>
      </div>

      {
        /*求解過程記錄：嘗試填入數字和回退的步驟，藍字表示嘗試，紅字表示回退*/
        steps.length > 0 && (
          <div style={styles.logPanel}>
            <h3 style={styles.logTitle}>求解過程（共 {steps.length} 步）</h3>
            <div style={styles.logScroll}>
              {steps.map((step, i) =>
                step.type === "try" ? (
                  <div key={i} style={styles.logTry}>
                    {i + 1}. 嘗試 ({step.row + 1},{step.col + 1}) 填入 {step.num}
                  </div>
                ) : (
                  <div key={i} style={styles.logBacktrack}>
                    {i + 1}. 回退 ({step.row + 1},{step.col + 1})
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </div>
  );
}


// 設計
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 16px",
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: "28px",
    marginBottom: "24px",
    color: "#222",
  },
  gridWrapper: {
    overflowX: "auto",
  },
  table: {
    borderCollapse: "collapse",
  },
  cell: {
    width: "48px",
    height: "48px",
    textAlign: "center",
    verticalAlign: "middle",
    padding: 0,
    position: "relative",
  },
  userText: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#727272", // 略灰，與固定線索做區別
  },
  clueText: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#111",
    userSelect: "none",
  },
  answerText: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1565c0",
  },
  hint: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#888",
  },
  error: {
    marginTop: "16px",
    color: "#c62828",
    fontSize: "15px",
  },
  buttonRow: {
    display: "flex",
    gap: "16px",
    marginTop: "24px",
  },
  solveBtn: {
    padding: "10px 32px",
    fontSize: "16px",
    fontWeight: "bold",
    background: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  clearBtn: {
    padding: "10px 32px",
    fontSize: "16px",
    fontWeight: "bold",
    background: "#eee",
    color: "#333",
    border: "1px solid #bbb",
    borderRadius: "8px",
    cursor: "pointer",
  },
  generateBtn: {
    padding: "10px 32px",
    fontSize: "16px",
    fontWeight: "bold",
    background: "#2e7d32",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  select: {
    padding: "10px 16px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #bbb",
    background: "#fafafa",
    cursor: "pointer",
  },
  logPanel: {
    marginTop: "32px",
    width: "100%",
    maxWidth: "480px",
  },
  logTitle: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "#444",
    marginBottom: "8px",
  },
  logScroll: {
    height: "200px",
    overflowY: "auto",
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "8px 12px",
    background: "#fafafa",
    fontSize: "13px",
    lineHeight: "1.8",
    fontFamily: "monospace",
  },
  logTry: {
    color: "#1565c0",
  },
  logBacktrack: {
    color: "#c62828",
  },
};

const choicesStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    gap: "8px",
    marginTop: "20px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  numBtn: {
    width: "44px",
    height: "44px",
    fontSize: "18px",
    fontWeight: "bold",
    borderRadius: "8px",
    border: "1px solid #bbb",
  },
  delBtn: {
    width: "44px",
    height: "44px",
    fontSize: "20px",
    fontWeight: "bold",
    borderRadius: "8px",
    border: "1px solid #e57373",
    background: "#ffebee",
    color: "#c62828",
  },
};
