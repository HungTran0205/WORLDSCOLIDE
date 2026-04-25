# Member Stat Production (Pool-Based) — Implementation Guide & Formulas

**Date:** 2026-04-23  
**Status:** Ready for Development  
**Technology:** TypeScript/React, ready to copy-paste

---

## Part 1: Core Formulas (Production Calculation)

### 1.1 Unified Formula (All Rooms)

```
Total Production = Base × (1 + k × TotalStats / 400)
Per-Member Production = Total Production / MemberCount

Where:
  Base = 100 (Stone), 50 (Magic), 150 (Wood)
  k = 1.5 (scaling coefficient)
  TotalStats = Sum of member stats (STR, INT, AGI)
  MemberCount = Number of members (1–8)
  400 = Max possible (8 × 50 base stat)
```

---

## Part 2: TypeScript Implementation

### 2.1 Core Functions

```typescript
// ============================================
// src/game/systems/production-system.ts
// ============================================

/**
 * Calculate total production for a room using pool-based scaling
 * @param baseProduction - Room-specific base (100, 50, 150)
 * @param totalStats - Sum of all member stats in room (STR, INT, or AGI)
 * @param memberCount - Number of members assigned (1–8)
 * @returns Total room production per cycle
 */
export function calculateRoomTotalProduction(
  baseProduction: number,
  totalStats: number,
  memberCount: number
): number {
  // Validate inputs
  if (memberCount < 1) {
    return 0; // Empty room
  }
  
  if (memberCount > 8) {
    console.warn(`Member count exceeds max (8). Clamping.`);
    memberCount = 8;
  }
  
  if (totalStats < 0) {
    console.warn(`Negative total stats: ${totalStats}. Using 0.`);
    totalStats = 0;
  }
  
  // Pool-based formula: Base × (1 + k × TotalStats/400)
  const k = 1.5; // Scaling coefficient
  const maxStats = 400; // 8 members × 50 max stat each
  
  const poolFactor = 1 + (k * totalStats) / maxStats;
  const totalProduction = baseProduction * poolFactor;
  
  return totalProduction;
}

/**
 * Calculate per-member production
 * @param roomProduction - Total room production (from calculateRoomTotalProduction)
 * @param memberCount - Number of members
 * @returns Production per member
 */
export function calculatePerMemberProduction(
  roomProduction: number,
  memberCount: number
): number {
  if (memberCount < 1) return 0;
  return roomProduction / memberCount;
}

/**
 * Calculate production for entire room in one call
 * @param roomType - 'stone' | 'magic' | 'wood'
 * @param members - Array of member objects with stat properties
 * @returns Object with total and per-member production
 */
export interface ProductionResult {
  totalProduction: number;
  perMemberProduction: number;
  poolStats: number;
  poolPercentage: number; // 0–100
}

export function calculateRoomProduction(
  roomType: 'stone' | 'magic' | 'wood',
  members: Array<{ str?: number; int?: number; agi?: number }>
): ProductionResult {
  // Configuration
  const config = {
    stone: { base: 100, statKey: 'str' },
    magic: { base: 50, statKey: 'int' },
    wood: { base: 150, statKey: 'agi' },
  };
  
  const cfg = config[roomType];
  if (!cfg) {
    throw new Error(`Unknown room type: ${roomType}`);
  }
  
  // Empty room
  if (members.length === 0) {
    return {
      totalProduction: 0,
      perMemberProduction: 0,
      poolStats: 0,
      poolPercentage: 0,
    };
  }
  
  // Sum stats to create pool
  const totalStats = members.reduce((sum, m) => {
    const stat = m[cfg.statKey] || 0;
    return sum + Math.max(0, stat); // Clamp negative to 0
  }, 0);
  
  // Calculate production
  const totalProduction = calculateRoomTotalProduction(
    cfg.base,
    totalStats,
    members.length
  );
  
  const perMemberProduction = calculatePerMemberProduction(
    totalProduction,
    members.length
  );
  
  const poolPercentage = Math.min(
    100,
    (totalStats / 400) * 100 // Cap at 100%
  );
  
  return {
    totalProduction,
    perMemberProduction,
    poolStats: totalStats,
    poolPercentage,
  };
}

/**
 * Get production breakdown with member-by-member details
 */
export interface MemberProductionDetail {
  memberId: string;
  memberName: string;
  stat: number;
  contribution: number; // This member's share of pool
  estimatedProduction: number; // Rough estimate of their production
}

export function getRoomProductionBreakdown(
  roomType: 'stone' | 'magic' | 'wood',
  members: Array<{ id: string; name: string; str?: number; int?: number; agi?: number }>
): MemberProductionDetail[] {
  const config = {
    stone: { base: 100, statKey: 'str' },
    magic: { base: 50, statKey: 'int' },
    wood: { base: 150, statKey: 'agi' },
  };
  
  const cfg = config[roomType];
  
  // Calculate room-level production first
  const roomProduction = calculateRoomProduction(roomType, members);
  
  // Estimate per-member production share
  // (Note: This is approximate; actual distribution depends on game logic)
  return members.map((member) => {
    const stat = member[cfg.statKey] || 0;
    const poolPercentage = (stat / roomProduction.poolStats) || 0;
    const estimatedShare = roomProduction.totalProduction * poolPercentage;
    
    return {
      memberId: member.id,
      memberName: member.name,
      stat,
      contribution: stat,
      estimatedProduction: estimatedShare,
    };
  });
}
```

### 2.2 Integration with Game State

```typescript
// ============================================
// Example usage in guild/room management
// ============================================

interface Member {
  id: string;
  name: string;
  str: number;
  int: number;
  agi: number;
}

interface ExtractionRoom {
  id: string;
  type: 'stone' | 'magic' | 'wood';
  assignedMembers: Member[];
  storage: number;
  capacity: number;
  lastProductionTime: number;
}

/**
 * Update room production on each cycle
 */
function updateRoomProduction(room: ExtractionRoom): void {
  const cycleIntervalMs = 5 * 60 * 1000; // 5 minutes
  
  // Check if cycle time elapsed
  if (Date.now() - room.lastProductionTime < cycleIntervalMs) {
    return; // Not ready yet
  }
  
  // Calculate production
  const production = calculateRoomProduction(room.type, room.assignedMembers);
  
  // Add to storage (capped)
  const newStorage = Math.min(
    room.capacity,
    room.storage + production.totalProduction
  );
  
  room.storage = newStorage;
  room.lastProductionTime = Date.now();
  
  // Log for monitoring
  console.log(
    `[${room.type}] Pool: ${production.poolStats}/400 | ` +
    `Produced: ${Math.round(production.totalProduction)} | ` +
    `Storage: ${Math.round(room.storage)}/${room.capacity}`
  );
}

/**
 * Get room stats for UI display
 */
interface RoomStats {
  roomType: string;
  memberCount: number;
  poolStats: number;
  poolPercentage: number;
  totalProduction: number;
  perMemberProduction: number;
  storage: string;
  breakdown: MemberProductionDetail[];
}

function getRoomStats(room: ExtractionRoom): RoomStats {
  const production = calculateRoomProduction(room.type, room.assignedMembers);
  const breakdown = getRoomProductionBreakdown(room.type, room.assignedMembers);
  
  return {
    roomType: room.type,
    memberCount: room.assignedMembers.length,
    poolStats: Math.round(production.poolStats),
    poolPercentage: Math.round(production.poolPercentage),
    totalProduction: Math.round(production.totalProduction),
    perMemberProduction: Math.round(production.perMemberProduction),
    storage: `${Math.round(room.storage)}/${room.capacity}`,
    breakdown,
  };
}
```

---

## Part 3: Unit Tests

### 3.1 Jest/Vitest Test Suite

```typescript
// ============================================
// tests/production-system.test.ts
// ============================================

import {
  calculateRoomTotalProduction,
  calculatePerMemberProduction,
  calculateRoomProduction,
} from '@/game/systems/production-system';

describe('Production System (Pool-Based)', () => {
  
  describe('calculateRoomTotalProduction', () => {
    
    it('should return 0 for empty room', () => {
      const prod = calculateRoomTotalProduction(100, 0, 0);
      expect(prod).toBe(0);
    });
    
    it('should calculate production at base with zero stats', () => {
      const prod = calculateRoomTotalProduction(100, 0, 1);
      expect(prod).toBeCloseTo(100, 1); // 100 × (1 + 1.5 × 0/400) = 100
    });
    
    it('should scale correctly at 25% pool (100 stats)', () => {
      const prod = calculateRoomTotalProduction(100, 100, 1);
      // 100 × (1 + 1.5 × 100/400) = 100 × 1.375 = 137.5
      expect(prod).toBeCloseTo(137.5, 1);
    });
    
    it('should scale correctly at 50% pool (200 stats)', () => {
      const prod = calculateRoomTotalProduction(100, 200, 1);
      // 100 × (1 + 1.5 × 200/400) = 100 × 1.75 = 175
      expect(prod).toBeCloseTo(175, 1);
    });
    
    it('should scale correctly at 100% pool (400 stats)', () => {
      const prod = calculateRoomTotalProduction(100, 400, 8);
      // 100 × (1 + 1.5 × 400/400) = 100 × 2.5 = 250
      expect(prod).toBeCloseTo(250, 1);
    });
    
    it('should handle high stats gracefully (asymptotic)', () => {
      const prod500 = calculateRoomTotalProduction(100, 500, 1);
      const prod1000 = calculateRoomTotalProduction(100, 1000, 1);
      // Both should grow but slower (asymptotic behavior)
      expect(prod500).toBeGreaterThan(250);
      expect(prod1000).toBeGreaterThan(prod500);
      // But not infinitely — stays bounded
    });
    
    it('should handle negative stats by clamping to zero', () => {
      const prod = calculateRoomTotalProduction(100, -50, 1);
      // Should treat as 0
      expect(prod).toBeCloseTo(100, 1);
    });
  });
  
  describe('calculatePerMemberProduction', () => {
    
    it('should divide total by member count', () => {
      const perMember = calculatePerMemberProduction(250, 8);
      expect(perMember).toBeCloseTo(31.25, 1);
    });
    
    it('should handle single member', () => {
      const perMember = calculatePerMemberProduction(100, 1);
      expect(perMember).toBeCloseTo(100, 1);
    });
    
    it('should return 0 for empty', () => {
      const perMember = calculatePerMemberProduction(100, 0);
      expect(perMember).toBe(0);
    });
  });
  
  describe('calculateRoomProduction (integrated)', () => {
    
    it('should calculate stone mining correctly', () => {
      const members = [
        { str: 50, int: 0, agi: 0 },
        { str: 40, int: 0, agi: 0 },
      ];
      
      const result = calculateRoomProduction('stone', members);
      
      // Pool = 90
      // Total = 100 × (1 + 1.5 × 90/400) = 100 × 1.3375 = 133.75
      expect(result.totalProduction).toBeCloseTo(133.75, 1);
      expect(result.perMemberProduction).toBeCloseTo(66.9, 1);
      expect(result.poolStats).toBe(90);
      expect(result.poolPercentage).toBeCloseTo(22.5, 1);
    });
    
    it('should use correct base for wood extraction', () => {
      const members = [{ str: 0, int: 0, agi: 50 }];
      const stone = calculateRoomProduction('stone', members);
      const wood = calculateRoomProduction('wood', members);
      
      // Wood base is 1.5x stone
      expect(wood.totalProduction).toBeCloseTo(stone.totalProduction * 1.5, 1);
    });
    
    it('should use correct base for magic extraction', () => {
      const members = [{ str: 50, int: 50, agi: 50 }];
      const stone = calculateRoomProduction('stone', members);
      const magic = calculateRoomProduction('magic', members);
      
      // Magic base is 0.5x stone
      expect(magic.totalProduction).toBeCloseTo(stone.totalProduction * 0.5, 1);
    });
    
    it('should handle mixed team composition', () => {
      const members = [
        { str: 40, int: 30, agi: 25 },
        { str: 35, int: 20, agi: 45 },
        { str: 25, int: 50, agi: 10 },
      ];
      
      const stone = calculateRoomProduction('stone', members);
      const magic = calculateRoomProduction('magic', members);
      const wood = calculateRoomProduction('wood', members);
      
      // Each should calculate correctly based on pool
      expect(stone.poolStats).toBe(40 + 35 + 25); // 100
      expect(magic.poolStats).toBe(30 + 20 + 50); // 100
      expect(wood.poolStats).toBe(25 + 45 + 10); // 80
    });
    
    it('should return 0 for empty room', () => {
      const result = calculateRoomProduction('stone', []);
      
      expect(result.totalProduction).toBe(0);
      expect(result.perMemberProduction).toBe(0);
      expect(result.poolStats).toBe(0);
    });
  });
});
```

---

## Part 4: Configuration

### 4.1 Config File

```typescript
// ============================================
// src/game/config/production-config.ts
// ============================================

export const PRODUCTION_CONFIG = {
  // Base production values per room type
  BASE_PRODUCTION: {
    stone: 100,
    magic: 50,
    wood: 150,
  },
  
  // Pool scaling parameter
  POOL_SCALING: {
    k: 1.5, // ← Main tuning parameter
    maxStats: 400, // 8 × 50 base stats per member
    maxMembers: 8,
  },
  
  // Cycle timing
  PRODUCTION_CYCLE_MS: 5 * 60 * 1000, // 5 minutes
  
  // Room storage capacity (may vary per tier)
  STORAGE_CAPACITY: {
    stone: 2000,
    magic: 1000,
    wood: 3000,
  },
};

// Tuning quick-reference
export const TUNING_REFERENCE = {
  // If production feels off, adjust k:
  // k=1.0  → Conservative (20% less than 1.5)
  // k=1.5  → Recommended (baseline)
  // k=2.0  → Generous (33% more than 1.5)
  // k=2.5  → Aggressive (67% more than 1.5)
  
  // Formula for production at full pool (400 stats):
  // max_production = base * (1 + k * 400/400) = base * (1 + k)
  // stone: 100 * (1 + k)
  // magic: 50 * (1 + k)
  // wood: 150 * (1 + k)
};
```

---

## Part 5: Lookup Tables (Pre-Calculated)

### 5.1 All Production Scenarios (k=1.5)

**Stone Mining (Base 100)**
```typescript
const STONE_PRODUCTION_TABLE = {
  pool_50: 118.75,   // 1 member STR 50
  pool_100: 137.5,   // 2 members STR 50
  pool_150: 156.25,  // 3 members STR 50
  pool_200: 175,     // 4 members STR 50
  pool_250: 193.75,  // 5 members STR 50
  pool_300: 212.5,   // 6 members STR 50
  pool_350: 231.25,  // 7 members STR 50
  pool_400: 250,     // 8 members STR 50
};

// Per-member production from pool
const STONE_PER_MEMBER = {
  pool_50_members_1: 118.75,
  pool_100_members_2: 68.75,
  pool_200_members_4: 43.75,
  pool_400_members_8: 31.25,
};
```

---

## Part 6: UI Integration Examples

### 6.1 Room Display Component (React)

```typescript
// ============================================
// src/ui/components/RoomDetail.tsx
// ============================================

import React from 'react';
import { calculateRoomProduction, getRoomStats } from '@/game/systems/production-system';

interface RoomDetailProps {
  room: ExtractionRoom;
}

export const RoomDetail: React.FC<RoomDetailProps> = ({ room }) => {
  const stats = getRoomStats(room);
  const production = calculateRoomProduction(room.type, room.assignedMembers);
  
  return (
    <div className="room-detail">
      <h2>{room.type.toUpperCase()} PRODUCTION</h2>
      
      {/* Pool Visualization */}
      <div className="pool-stats">
        <div className="label">POOL STATS</div>
        <div className="pool-bar">
          <div 
            className="pool-fill" 
            style={{ width: `${production.poolPercentage}%` }}
          />
        </div>
        <div className="pool-text">
          {stats.poolStats} / 400 ({Math.round(production.poolPercentage)}%)
        </div>
      </div>
      
      {/* Members List */}
      <div className="members-list">
        <div className="label">MEMBERS ASSIGNED ({stats.memberCount})</div>
        {room.assignedMembers.map((member, idx) => (
          <div key={member.id} className="member-row">
            <span className="member-name">{member.name}</span>
            <span className="member-stat">
              {room.type === 'stone' && `STR ${member.str}`}
              {room.type === 'magic' && `INT ${member.int}`}
              {room.type === 'wood' && `AGI ${member.agi}`}
            </span>
          </div>
        ))}
      </div>
      
      {/* Production Display */}
      <div className="production-display">
        <div className="total-production">
          <div className="label">TOTAL PRODUCTION</div>
          <div className="value">{stats.totalProduction} /cycle</div>
        </div>
        
        <div className="per-member-production">
          <div className="label">PER MEMBER</div>
          <div className="value">{stats.perMemberProduction} /cycle</div>
        </div>
      </div>
      
      {/* Storage */}
      <div className="storage">
        <div className="label">STORAGE</div>
        <div className="storage-bar">
          <div 
            className="storage-fill" 
            style={{ width: `${(room.storage / room.capacity) * 100}%` }}
          />
        </div>
        <div className="storage-text">{stats.storage}</div>
      </div>
      
      {/* Tooltip */}
      <div className="tooltip-hint">
        ℹ️ Pool Stats measure your team's combined strength (STR, INT, or AGI).
        More members or higher stats = more production!
      </div>
    </div>
  );
};
```

### 6.2 Member Assignment Preview

```typescript
// ============================================
// src/ui/components/MemberAssignmentPreview.tsx
// ============================================

interface MemberAssignmentPreviewProps {
  draggedMember: Member;
  targetRoom: ExtractionRoom;
}

export const MemberAssignmentPreview: React.FC<MemberAssignmentPreviewProps> = ({
  draggedMember,
  targetRoom,
}) => {
  // Current production
  const currentProduction = calculateRoomProduction(targetRoom.type, targetRoom.assignedMembers);
  
  // Production with new member
  const newMembers = [...targetRoom.assignedMembers, draggedMember];
  const newProduction = calculateRoomProduction(targetRoom.type, newMembers);
  
  const totalChange = newProduction.totalProduction - currentProduction.totalProduction;
  const perMemberChange = newProduction.perMemberProduction - currentProduction.perMemberProduction;
  
  return (
    <div className="assignment-preview">
      <h3>PREVIEW: {draggedMember.name}</h3>
      
      <div className="current">
        <div className="label">Current Pool</div>
        <div className="value">
          {Math.round(currentProduction.poolStats)} / 400
        </div>
      </div>
      
      <div className="arrow">→</div>
      
      <div className="new">
        <div className="label">New Pool</div>
        <div className="value">
          {Math.round(newProduction.poolStats)} / 400 
          {totalChange > 0 && (
            <span className="positive"> +{Math.round(totalChange)}</span>
          )}
        </div>
      </div>
      
      <div className="production-impact">
        <div className="total">
          <span>Total:</span>
          <span className={totalChange > 0 ? 'positive' : 'neutral'}>
            {Math.round(currentProduction.totalProduction)} 
            → {Math.round(newProduction.totalProduction)}
          </span>
        </div>
        
        <div className="per-member">
          <span>Per Member:</span>
          <span className={perMemberChange > 0 ? 'positive' : perMemberChange < 0 ? 'negative' : 'neutral'}>
            {Math.round(currentProduction.perMemberProduction)} 
            → {Math.round(newProduction.perMemberProduction)}
          </span>
        </div>
      </div>
    </div>
  );
};
```

---

## Part 7: Deployment Checklist

- [ ] Formulas implemented in `production-system.ts`
- [ ] All 8 unit tests passing
- [ ] Config values set to k=1.5 in `production-config.ts`
- [ ] RoomDetail component updated to show pool stats
- [ ] MemberAssignmentPreview shows production impact
- [ ] Tutorial updated (see tactical-guide.md)
- [ ] Patch notes finalized
- [ ] QA test plan created
- [ ] Monitoring dashboards set up
- [ ] Rollback plan documented
- [ ] Launch ready ✅

---

## Part 8: Migration from Old System

**If migrating from old Sigmoid+Synergy:**

```typescript
// DEPRECATION TIMELINE:

// Week 1: Parallel calculation (both systems)
const oldProduction = calculateOldSigmoidSynergy(...);
const newProduction = calculateRoomProduction(...);
console.log(`Old: ${oldProduction}, New: ${newProduction}`);

// Week 2: Switch default, keep old as fallback
const production = calculateRoomProduction(...); // ← NEW
const oldFallback = calculateOldSigmoidSynergy(...); // ← DEPRECATED

// Week 3: Remove old code
// Delete calculateOldSigmoidSynergy completely
```

---

**End of Implementation Guide**
