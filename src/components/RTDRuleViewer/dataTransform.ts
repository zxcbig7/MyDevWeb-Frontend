// ============================================================
// dataTransform.ts
// 負責把 API 回傳的 RuleDTO[] 轉換成元件使用的 RuleData[]
// ============================================================

import type { RuleInfoDTO, RuleData } from "./types";

// 去掉陣列後綴，例如："BlockA[0]" → "BlockA"
// TODO: 未來如果有更複雜的命名規則，可在這裡擴充
function getBaseBlockName(blockName: string): string {
  const match = blockName.match(/^(.+?)\[\d+\]$/);
  return match ? match[1] : blockName;
}

export function convertDtosToData(dtos: RuleInfoDTO[]): RuleData[] {
  const blockMap = new Map<string, RuleData>();

  for (const dto of dtos) {
    if (!dto.BLOCK_NAME) continue;
    const baseName = getBaseBlockName(dto.BLOCK_NAME);

    const preBlock =
      dto.PREBLOCK && dto.PREBLOCK.trim() !== ""
        ? dto.PREBLOCK.split(",").map((s) => getBaseBlockName(s.trim())).slice(0, 2)
        : null;

    // 第一次看到這個 baseName，先建立空的 entry
    if (!blockMap.has(baseName)) {
      blockMap.set(baseName, {
        PHASE: dto.PHASE ?? "",
        RULE_NAME: dto.RULE_NAME ?? "",
        BLOCK_NAME: baseName,
        BLOCK_TYPE: dto.BLOCK_TYPE ?? "",
        BLOCK_GROUP: dto.BLOCK_GROUP ?? "",
        BLOCK_SEQ: dto.BLOCK_SEQ ?? "",
        POSX: dto.POSX,
        POSY: dto.POSY,
        PREBLOCK: preBlock,
        VALUES: [],
      });
    }

    // 有值才推入
    if (dto.VALUE && dto.VALUE.trim() !== "") {
      const entry = blockMap.get(baseName)!;
      entry.VALUES ??= [];
      entry.VALUES.push({ KEY: dto.KEY, COLUMN1: dto.COLUMN1, COLUMN2: dto.COLUMN2, VALUE: dto.VALUE });
    }
  }

  return Array.from(blockMap.values());
}
