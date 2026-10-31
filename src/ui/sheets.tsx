// Bottom sheets: choose an action, act on a person, browse the job board.
import React, { createContext, useContext, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Pill, Row, Sheet, StatBar } from './components.tsx';
import { Portrait } from './art.tsx';
import { colors, fmtMoney, serif } from './theme.ts';
import { useGame } from '../store/GameContext.tsx';
import { actionStatus, actionsForPerson, choiceStates, jobCheck } from '../engine/actions.ts';
import { getAction, GROUP_INFO } from '../content/actions.ts';
import { FIELD_BY_ID, JOB_BOARD_FIELDS } from '../content/jobs.ts';
import { labelFor } from '../engine/lifecycle.ts';

export type SheetState =
  | { t: 'action'; actionId: string; targetId?: string }
  | { t: 'person'; relId: string }
  | { t: 'jobs' }
  | null;

const Ctx = createContext<{ open: (s: SheetState) => void; close: () => void }>({ open: () => {}, close: () => {} });
export const useSheets = () => useContext(Ctx);

export function SheetHost({ children }: { children: React.ReactNode }) {
  const [sheet, setSheet] = useState<SheetState>(null);
  const close = () => setSheet(null);
  return (
    <Ctx.Provider value={{ open: setSheet, close }}>
      {children}
      {sheet?.t === 'action' ? <ActionSheet actionId={sheet.actionId} targetId={sheet.targetId} onClose={close} /> : null}
      {sheet?.t === 'person' ? <PersonSheet relId={sheet.relId} onClose={close} /> : null}
      {sheet?.t === 'jobs' ? <JobBoardSheet onClose={close} /> : null}
    </Ctx.Provider>
  );
}

function ActionSheet({ actionId, targetId, onClose }: { actionId: string; targetId?: string; onClose: () => void }) {
  const { game, perform } = useGame();
  const a = getAction(actionId);
  if (!game || !a) return null;
  const status = actionStatus(game, a, targetId);
  const states = choiceStates(game, a);
  const target = game.relationships.find((r) => r.id === targetId);
  return (
    <Sheet title={a.label} subtitle={target ? `With ${target.name}` : a.hint} onClose={onClose}>
      {!status.ok ? <Text style={{ color: colors.danger, marginBottom: 10 }}>{status.reason}</Text> : null}
      {a.time > 0 ? <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>Uses {a.time} free-time {a.time === 1 ? 'slot' : 'slots'}</Text> : <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>Takes no free time</Text>}
      {states.map((c) => (
        <Row
          key={c.index}
          icon={a.icon}
          title={c.choice.label}
          sub={c.reason ?? c.choice.hint}
          tone={c.reason ? 'danger' : undefined}
          disabled={!c.enabled || !status.ok}
          onPress={() => { perform(a.id, c.index, targetId); onClose(); }}
        />
      ))}
    </Sheet>
  );
}

function PersonSheet({ relId, onClose }: { relId: string; onClose: () => void }) {
  const { game, perform } = useGame();
  const { open } = useSheets();
  const rel = game?.relationships.find((r) => r.id === relId);
  if (!game || !rel) return null;
  const list = actionsForPerson(game, rel);
  return (
    <Sheet title={rel.name} subtitle={`${labelFor(rel.kind)} · age ${rel.age} · bond ${rel.closeness}`} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <Portrait name={rel.name} age={rel.age} size={64} ring={colors.gold} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <StatBar label="Bond" value={rel.closeness} color="#F08BB5" thin />
          <Text style={{ color: colors.muted, fontSize: 12 }}>Time left this year: {game.actionsLeft}</Text>
        </View>
      </View>
      {list.length === 0 ? <Text style={{ color: colors.muted }}>Nothing to do together right now.</Text> : null}
      {list.map(({ action, status }) => (
        <Row
          key={action.id}
          icon={action.icon}
          title={action.label}
          sub={status.ok ? action.hint : status.reason}
          tone={status.ok ? undefined : 'danger'}
          disabled={!status.ok}
          onPress={() => {
            if (action.choices.length === 1) { perform(action.id, 0, rel.id); onClose(); }
            else open({ t: 'action', actionId: action.id, targetId: rel.id });
          }}
        />
      ))}
    </Sheet>
  );
}

function JobBoardSheet({ onClose }: { onClose: () => void }) {
  const { game, applyJob } = useGame();
  if (!game) return null;
  const ch = game.character;
  const cur = ch.job && !ch.retired ? ch.job : null;
  const curField = cur?.field ? FIELD_BY_ID[cur.field] : undefined;
  return (
    <Sheet title="Job board" subtitle="Apply for a career. Each application uses a free-time slot." onClose={onClose}>
      <Card style={{ marginBottom: 12, borderColor: cur ? colors.gold : colors.border }}>
        {cur ? (
          <View>
            <Text style={{ color: colors.gold, fontFamily: serif, fontSize: 20 }}>{cur.title}</Text>
            <Text style={{ color: colors.muted, marginBottom: 8 }}>{fmtMoney(cur.salary)} / yr · {cur.years} {cur.years === 1 ? 'year' : 'years'} on the job</Text>
            <StatBar label="Job performance" value={cur.perf ?? 50} color={colors.good} thin />
            {curField ? <Text style={{ color: colors.muted, fontSize: 12 }}>Level {(cur.level ?? 0) + 1} of {curField.ladder.length} in {curField.label}. Work hard to get promoted.</Text> : null}
          </View>
        ) : (
          <Text style={{ color: colors.muted }}>{ch.retired ? 'You are retired.' : 'You are not working. Pick a field below.'}</Text>
        )}
      </Card>
      {JOB_BOARD_FIELDS.map((f) => {
        const chk = jobCheck(game, f);
        const same = cur?.field === f.id;
        const top = f.ladder[f.ladder.length - 1];
        const entry = f.ladder[0];
        return (
          <Card key={f.id} style={{ marginBottom: 10, opacity: chk.ok || same ? 1 : 0.8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 26, marginRight: 10 }}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{f.label}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{f.blurb}</Text>
              </View>
              {same ? <Pill text="Your field" color={colors.gold} /> : chk.ok ? <Pill text={`${Math.round(chk.chance * 100)}% odds`} color={colors.good} /> : null}
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
              {entry.title} {fmtMoney(entry.salary)} → {top.title} {fmtMoney(top.salary)}
            </Text>
            {!chk.ok ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>Needs: {chk.reasons.join(' · ')}</Text> : null}
            {chk.ok && !same ? (
              <Button small label={game.actionsLeft < 1 ? 'No free time left' : 'Apply'} disabled={game.actionsLeft < 1} onPress={() => { applyJob(f.id); onClose(); }} style={{ marginTop: 10 }} />
            ) : null}
          </Card>
        );
      })}
      {ch.flags.reference ? <Text style={{ color: colors.good, fontSize: 12, marginTop: 4 }}>✓ A mentor has agreed to give you a reference: better odds.</Text> : null}
    </Sheet>
  );
}

export { GROUP_INFO };
