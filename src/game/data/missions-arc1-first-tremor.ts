import type { Mission } from '@/game/state/game-state';

/**
 * Arc 1 — "The First Tremor".
 * Causal chain: bats flee deep caves → slimes invade the forest → ancient
 * 2000-year-dormant machines wake defending the ruins → Slime King, a
 * creature of black ooze and ether risen from the deepest earth crack.
 * (The ooze is petroleum, but this world has no concept or word for it —
 * characters and lore only ever describe what they see, never name it.)
 * No empire/faction origin — the machines are prehistoric, civilization unknown.
 *
 * 5 main quests (chain-first-tremor, chainOrders 2–6) + 5 repeatable expeditions
 * that unlock after their parent quest. All dialog is bilingual (VN + EN).
 */
export const ARC1_MISSIONS: Mission[] = [
  // ===== Q1 — Strange Exodus =====
  {
    id: 'ft-strange-exodus', name: 'Strange Exodus', tier: 'F',
    description: 'Cave bats — never seen outside the mountains — assault the forest edge.',
    isMainQuest: true, chainId: 'chain-first-tremor', chainOrder: 2,
    zone: 'Forest Edge',
    durationMs: 90_000, travelTimeMs: 10_000,
    goldRewardMin: 80, goldRewardMax: 100, expReward: 120,
    requiredMembers: 1, requiredLevel: 1,
    enemyIds: [],
    waves: [
      { enemyIds: ['cave-bat', 'cave-bat'], spawnXOffset: 0, hpMultiplier: 0.5 },
      { enemyIds: ['cave-bat', 'cave-bat'], spawnXOffset: 8, hpMultiplier: 0.5 },
    ],
    conditionalDrops: [{ itemId: 'BAT_WING', chance: 1.0, quantity: 3 }],
    cardLore: 'Đàn thú rừng kéo nhau bỏ lãnh địa. Dơi hang — loài chỉ sống sâu trong núi — đang tấn công người dân ở bìa rừng.',
    preArrivalDialog: [{
      speakerId: 'ba-nguyet', speakerNameVN: 'Bà Nguyệt', speakerNameEN: 'Elder Nguyet',
      textVN: 'Dơi hang chưa bao giờ rời khỏi núi. Có điều gì đó... đang xua đuổi chúng ra ngoài.',
      textEN: 'Cave bats have never left the mountains. Something... is driving them out.',
    }],
    postCombatDialog: [{
      speakerId: 'kael', speakerNameVN: 'Kael', speakerNameEN: 'Kael',
      textVN: 'Loài này chỉ sống sâu trong hang núi. Sao lại ở đây? Cần vào rừng sâu — tìm cửa hang.',
      textEN: 'These bats live deep in mountain caves. Why are they here? We need to go deeper — find the cave entrance.',
    }],
  },

  // ===== Q2 — Path to the Depths =====
  {
    id: 'ft-path-to-depths', name: 'Path to the Depths', tier: 'F',
    description: 'Slimes have invaded the deep forest, driving the animals out.',
    isMainQuest: true, chainId: 'chain-first-tremor', chainOrder: 3,
    prerequisiteId: 'ft-strange-exodus',
    zone: 'Deep Forest',
    durationMs: 120_000, travelTimeMs: 15_000,
    goldRewardMin: 120, goldRewardMax: 150, expReward: 160,
    requiredMembers: 2, requiredLevel: 1,
    enemyIds: [],
    waves: [
      { enemyIds: ['slime', 'slime', 'slime'], spawnXOffset: 0, hpMultiplier: 0.4 },
      { enemyIds: ['slime', 'slime', 'slime'], spawnXOffset: 8, hpMultiplier: 0.4 },
    ],
    conditionalDrops: [{ itemId: 'SLIME_GEL', chance: 1.0, quantity: 5 }],
    cardLore: 'Tiếng vọng kỳ lạ lan khắp núi rừng. Guild cử người tiến sâu vào rừng — hướng về cửa hang cổ đại nghìn năm tuổi.',
    preArrivalDialog: [{
      speakerId: 'mai', speakerNameVN: 'Mai', speakerNameEN: 'Mai',
      textVN: 'Trên đường vào rừng sâu... những sinh vật này. Tôi chưa từng thấy chúng ở đây bao giờ.',
      textEN: "On the path into the deep forest... these creatures. I've never seen them here before.",
    }],
    postCombatDialog: [{
      speakerId: 'kael', speakerNameVN: 'Kael', speakerNameEN: 'Kael',
      textVN: 'Slime. Chúng mới xâm chiếm khu rừng này — đây là lý do thú rừng bỏ chạy. Nhưng slime đến từ đâu?',
      textEN: "Slime. They've invaded this forest — that's why the animals fled. But where did the slimes come from?",
    }],
  },

  // ===== Q3 — Ancient Threshold =====
  {
    id: 'ft-ancient-threshold', name: 'Ancient Threshold', tier: 'F',
    description: 'Ancient machines, dormant 2000 years, guard the cave entrance.',
    isMainQuest: true, chainId: 'chain-first-tremor', chainOrder: 4,
    prerequisiteId: 'ft-path-to-depths',
    zone: 'Cave Entrance',
    durationMs: 150_000, travelTimeMs: 15_000,
    goldRewardMin: 150, goldRewardMax: 180, expReward: 200,
    requiredMembers: 2, requiredLevel: 2,
    enemyIds: [],
    waves: [
      { enemyIds: ['flying-drone'], spawnXOffset: 0, hpMultiplier: 1.0 },
      { enemyIds: ['flying-drone'], spawnXOffset: 5, hpMultiplier: 1.0 },
      { enemyIds: ['flying-drone'], spawnXOffset: 10, hpMultiplier: 1.0 },
    ],
    conditionalDrops: [{ itemId: 'STONE', chance: 1.0, quantity: 10 }],
    cardLore: 'Cửa hang cổ đại dẫn xuống lòng đất. Những âm thanh cơ khí vang vọng từ bên trong — di tích của một nền văn minh đã khuất hơn 2000 năm.',
    preArrivalDialog: [{
      speakerId: 'founder', speakerNameVN: 'Thủ lĩnh', speakerNameEN: 'Guild Master',
      textVN: 'Cỗ máy... chúng còn hoạt động được sau 2000 năm. Không phải kỹ thuật của bất kỳ nền văn minh nào tôi từng biết.',
      textEN: "Machines... still functional after 2000 years. No engineering I've ever known.",
    }],
    postCombatDialog: [{
      speakerId: 'mai', speakerNameVN: 'Mai', speakerNameEN: 'Mai',
      textVN: 'Chúng không tấn công để giết — chỉ để bảo vệ. Có gì đó sâu hơn mà chúng không muốn ta chạm tới.',
      textEN: "They didn't attack to kill — only to protect. Something deeper they don't want us to reach.",
    }],
  },

  // ===== Q4 — Ruins of the Forgotten Age =====
  {
    id: 'ft-ruins-forgotten-age', name: 'Ruins of the Forgotten Age', tier: 'F',
    description: 'Robot sentinels protect the deepest level of the prehistoric ruins.',
    isMainQuest: true, chainId: 'chain-first-tremor', chainOrder: 5,
    prerequisiteId: 'ft-ancient-threshold',
    zone: 'Underground Ruins',
    durationMs: 180_000, travelTimeMs: 20_000,
    goldRewardMin: 180, goldRewardMax: 220, expReward: 240,
    requiredMembers: 2, requiredLevel: 2,
    enemyIds: [],
    waves: [
      { enemyIds: ['dog-robot', 'dog-robot'], spawnXOffset: 0, hpMultiplier: 1.0 },
      { enemyIds: ['dog-robot'], spawnXOffset: 12, hpMultiplier: 1.5 }, // elite sentinel
    ],
    conditionalDrops: [
      { itemId: 'METAL_PLATE', chance: 1.0, quantity: 6 },
      { itemId: 'DRONE_SENSOR', chance: 1.0, quantity: 2 },
    ],
    cardLore: 'Di tích trải dài xuống tầng sâu nhất. Hàng trăm cỗ máy ngủ yên từ thời tiền sử đang tỉnh giấc — và chúng đang bảo vệ điều gì đó.',
    preArrivalDialog: [{
      speakerId: 'ba-nguyet', speakerNameVN: 'Bà Nguyệt', speakerNameEN: 'Elder Nguyet',
      textVN: 'Truyền thuyết làng tôi... kể về ánh sáng từ lòng đất, về những tiếng động hàng đêm từ thời xa xưa. Đây là nơi đó.',
      textEN: 'Village legends... told of light from the earth, of nightly sounds from ancient times. This is that place.',
    }],
    postCombatDialog: [{
      speakerId: 'kael', speakerNameVN: 'Kael', speakerNameEN: 'Kael',
      textVN: 'Tầng sâu nhất... có gì đó đang phát ra ether. Không phải máy móc — thứ đó đang sống.',
      textEN: "The deepest level... something is radiating ether. Not a machine — it's alive.",
    }],
  },

  // ===== Q5 — The Slime Sovereign (Arc 1 boss) =====
  {
    id: 'ft-slime-sovereign', name: 'The Slime Sovereign', tier: 'F',
    description: 'A creature of black ooze and ether risen from the deepest crack. The source.',
    isMainQuest: true, isBossGate: true,
    chainId: 'chain-first-tremor', chainOrder: 6,
    prerequisiteId: 'ft-ruins-forgotten-age',
    zone: 'Ancient Core',
    durationMs: 300_000, travelTimeMs: 20_000,
    goldRewardMin: 280, goldRewardMax: 320, expReward: 400,
    requiredMembers: 2, requiredLevel: 2,
    enemyIds: [],
    waves: [
      { enemyIds: ['slime', 'slime', 'slime'], spawnXOffset: 0, hpMultiplier: 0.5 },
      { enemyIds: ['slime', 'slime-king', 'slime'], spawnXOffset: 10, hpMultiplier: 1.0 },
    ],
    conditionalDrops: [
      { itemId: 'SLIME_KING_CORE', chance: 1.0, quantity: 1 },
      { itemId: 'SLIME_GEL', chance: 1.0, quantity: 6 },
    ],
    cardLore: 'Không phải máy móc. Không phải sinh vật bình thường. Slime King hình thành từ thứ chất lỏng đen trào lên từ khe nứt sâu nhất, thấm đẫm ether của 2000 năm di tích — chui lên từ lòng đất.',
    preArrivalDialog: [{
      speakerId: 'kael', speakerNameVN: 'Kael', speakerNameEN: 'Kael',
      textVN: 'Không ai tạo ra nó. Nó tự hình thành — từ thứ chất lỏng đen rỉ ra theo khe nứt, và 2000 năm ether từ di tích thấm vào. Đây là nguồn gốc của tất cả.',
      textEN: "No one made it. It formed on its own — a black fluid seeping through the cracks, 2000 years of ether from the ruins absorbing in. This is the source of everything.",
    }],
    postCombatDialog: [
      {
        speakerId: 'founder', speakerNameVN: 'Thủ lĩnh', speakerNameEN: 'Guild Master',
        textVN: 'Nó đã chết. Nhưng khe nứt dưới lòng đất... vẫn còn đó. Đây chưa phải là kết thúc.',
        textEN: "It's gone. But the crack in the earth... is still there. This isn't the end.",
      },
      {
        speakerId: 'mai', speakerNameVN: 'Mai', speakerNameEN: 'Mai',
        textVN: 'Di tích này... ai đã xây nó? Và tại sao ngay dưới làng chúng ta?',
        textEN: "These ruins... who built them? And why right beneath our village?",
      },
    ],
  },

  // ===== Expeditions (repeatable, unlock after parent quest, no dialog) =====
  {
    id: 'exp-forest-edge-bats', name: 'Forest Edge Patrol', tier: 'F',
    description: 'Keep the cave bats off the forest edge.',
    isExpedition: true, spawnedFromQuestId: 'ft-strange-exodus', prerequisiteId: 'ft-strange-exodus',
    zone: 'Forest Edge',
    durationMs: 90_000, travelTimeMs: 10_000,
    goldRewardMin: 50, goldRewardMax: 100, expReward: 80,
    requiredMembers: 1, requiredLevel: 1,
    enemyIds: [],
    waves: [{ enemyIds: ['cave-bat', 'cave-bat', 'cave-bat', 'cave-bat'], spawnXOffset: 0, hpMultiplier: 0.5 }],
  },
  {
    id: 'exp-deep-forest-slimes', name: 'Deep Forest Patrol', tier: 'F',
    description: 'Cull the slimes spreading through the deep forest.',
    isExpedition: true, spawnedFromQuestId: 'ft-path-to-depths', prerequisiteId: 'ft-path-to-depths',
    zone: 'Deep Forest',
    durationMs: 120_000, travelTimeMs: 15_000,
    goldRewardMin: 60, goldRewardMax: 120, expReward: 110,
    requiredMembers: 2, requiredLevel: 1,
    enemyIds: [],
    waves: [{ enemyIds: ['slime', 'slime', 'slime', 'slime', 'slime', 'slime'], spawnXOffset: 0, hpMultiplier: 0.4 }],
  },
  {
    id: 'exp-cave-patrol', name: 'Cave Entrance Patrol', tier: 'F',
    description: 'Patrol the cave entrance for reactivated drones.',
    isExpedition: true, spawnedFromQuestId: 'ft-ancient-threshold', prerequisiteId: 'ft-ancient-threshold',
    zone: 'Cave Entrance',
    durationMs: 150_000, travelTimeMs: 15_000,
    goldRewardMin: 80, goldRewardMax: 150, expReward: 140,
    requiredMembers: 2, requiredLevel: 1,
    enemyIds: [],
    waves: [{ enemyIds: ['flying-drone', 'flying-drone'], spawnXOffset: 0, hpMultiplier: 1.0 }],
  },
  {
    id: 'exp-ruins-patrol', name: 'Ruins Patrol', tier: 'F',
    description: 'Hold back the robot sentinels in the underground ruins.',
    isExpedition: true, spawnedFromQuestId: 'ft-ruins-forgotten-age', prerequisiteId: 'ft-ruins-forgotten-age',
    zone: 'Underground Ruins',
    durationMs: 180_000, travelTimeMs: 20_000,
    goldRewardMin: 100, goldRewardMax: 180, expReward: 170,
    requiredMembers: 2, requiredLevel: 1,
    enemyIds: [],
    waves: [{ enemyIds: ['dog-robot', 'dog-robot'], spawnXOffset: 0, hpMultiplier: 1.0 }],
  },
  {
    id: 'exp-ancient-core', name: 'Ancient Core Patrol', tier: 'F',
    description: 'Suppress the slimes still seeping from the deepest crack.',
    isExpedition: true, spawnedFromQuestId: 'ft-slime-sovereign', prerequisiteId: 'ft-slime-sovereign',
    zone: 'Ancient Core',
    durationMs: 240_000, travelTimeMs: 20_000,
    goldRewardMin: 150, goldRewardMax: 250, expReward: 250,
    requiredMembers: 2, requiredLevel: 2,
    enemyIds: [],
    waves: [{ enemyIds: ['slime', 'slime', 'slime-king'], spawnXOffset: 0, hpMultiplier: 1.0 }],
  },
];
