import type { GameState, Relationship } from './types.ts';
import { livingRels } from './conditions.ts';

/** Replace {tokens} in story text. Unknown tokens are left alone so content bugs are visible. */
export function fill(s: GameState, text: string, target?: Relationship): string {
  const ch = s.character;
  const first = (kind: Relationship['kind']) => livingRels(s, kind)[0]?.name;
  const map: Record<string, string | undefined> = {
    first: ch.firstName,
    last: ch.lastName,
    age: String(ch.age),
    target: target?.name,
    partner: first('partner'),
    parent: first('parent'),
    friend: first('friend') ?? target?.name,
    child: first('child'),
  };
  return text.replace(/\{(\w+)\}/g, (m, k: string) => map[k] ?? m);
}
