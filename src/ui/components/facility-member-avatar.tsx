/** Avatar card showing member sprite + unassign button — facility tray + quest party slots. */

import '@/ui/styles/member-avatar.css';
import type { Member } from '@/game/state/game-state';
import { getSpritePath, getAvatarPath } from '@/scene/sprites/sprite-path-resolver';

interface FacilityMemberAvatarProps {
  member: Member;
  onUnassign: (id: string) => void;
}

export function FacilityMemberAvatar({ member, onUnassign }: FacilityMemberAvatarProps) {
  const base = getSpritePath(member.civilization, member.archetype ?? 'warrior', member.gender ?? 'M');
  const src  = getAvatarPath(base);

  return (
    <div className="fp-avatar-card">
      <div className="fp-avatar-frame">
        <img src={src} alt={member.name} className="fp-avatar-img" />
        <button className="fp-avatar-remove" onClick={() => onUnassign(member.id)}>×</button>
      </div>
      <div className="fp-avatar-name">{member.name}</div>
    </div>
  );
}
