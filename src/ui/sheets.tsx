// Bottom sheets: choose an action, act on a person, browse the job board.
import React, { createContext, useContext, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, Pill, Row, Sheet, StatBar } from './components.tsx';
import { Portrait } from './art.tsx';
import { colors, fmtMoney, serif } from './theme.ts';
import { useGame } from '../store/GameContext.tsx';
import { actionStatus, actionsForPerson, choiceStates, jobCheck, wizardStep } from '../engine/actions.ts';
import { getWizard } from '../content/wizards.ts';
import { ClosetSheet } from './closet.tsx';
import { tap } from './fx.ts';
import { getAction, GROUP_INFO } from '../content/actions.ts';
import { FIELD_BY_ID, JOB_BOARD_FIELDS } from '../content/jobs.ts';
import { labelFor } from '../engine/lifecycle.ts';

export type SheetState =
  | { t: 'action'; actionId: string; targetId?: string }
  | { t: 'person'; relId: string }
  | { t: 'jobs' }
  | { t: 'wizard'; wizId: string }
  | { t: 'closet' }
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
      {sheet?.t === 'wizard' ? <WizardSheet wizId={sheet.wizId} onClose={close} /> : null}
      {sheet?.t === 'closet' ? <ClosetSheet onClose={close} /> : null}
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
        <Portrait name={rel.name} age={rel.age} gender={rel.gender} size={64} ring={colors.gold} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <StatBar label="Bond" value={rel.closeness} color="#F08BB5" thin />
          {rel.job || rel.traits ? <Text style={{ color: colors.muted, fontSize: 12 }}>{[rel.job, rel.traits?.join(', ')].filter(Boolean).join(' · ')}</Text> : null}
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
    <Sheet title="Job board" subtitle="Apply for a career. You can apply as often as you like, but repeat tries lower your odds." onClose={onClose}>
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
              <Button small label="Apply" onPress={() => { applyJob(f.id); onClose(); }} style={{ marginTop: 10 }} />
            ) : null}
          </Card>
        );
      })}
      {ch.flags.reference ? <Text style={{ color: colors.good, fontSize: 12, marginTop: 4 }}>✓ A mentor has agreed to give you a reference: better odds.</Text> : null}
    </Sheet>
  );
}

export { GROUP_INFO };


// ───────── Wizard: pick-your-option flows ─────────
function WizardSheet({ wizId, onClose }: { wizId: string; onClose: () => void }) {
  const { game, runWizard, refresh } = useGame();
  const [picks, setPicks] = useState<string[]>([]);
  const w = getWizard(wizId);
  if (!game || !w) return null;
  const step = wizardStep(game, wizId, picks);
  if (!step) return null;
  const choose = (id: string) => {
    tap();
    const next = [...picks, id];
    if (wizardStep(game, wizId, next)) setPicks(next);
    else { runWizard(wizId, next); onClose(); }
  };
  return (
    <Sheet title={step.title} subtitle={step.sub ?? w.label} onClose={onClose}>
      {picks.length > 0 ? <Text onPress={() => setPicks(picks.slice(0, -1))} style={{ color: colors.gold, fontWeight: '700', marginBottom: 10 }}>← Back</Text> : null}
      {step.options.map((o) => {
        const off = !!o.disabled || (o.cost !== undefined && game.character.money < o.cost);
        return (
          <Pressable key={o.id} onPress={() => (off ? undefined : choose(o.id))} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 14, padding: 12, marginBottom: 8, opacity: off ? 0.5 : 1, borderWidth: 1, borderColor: colors.border }}>
            {o.portrait ? <Portrait name={o.portrait.name} age={o.portrait.age} gender={o.portrait.gender} size={54} /> : <Text style={{ fontSize: 26, width: 40, textAlign: 'center' }}>{o.icon ?? '•'}</Text>}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{o.label}</Text>
              {o.sub ? <Text style={{ color: o.disabled ? colors.danger : colors.muted, fontSize: 12, marginTop: 2 }}>{o.disabled ?? o.sub}</Text> : null}
              {o.tags?.[0] ? <Text style={{ color: colors.muted, fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>{o.tags[0]}</Text> : null}
              {o.meter ? (
                <View style={{ marginTop: 6 }}>
                  <View style={{ height: 5, backgroundColor: colors.bg, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${o.meter.value}%`, height: 5, backgroundColor: o.meter.label === 'Risk' ? (o.meter.value > 40 ? colors.danger : '#E0B866') : '#F08BB5' }} />
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>{o.meter.label} {o.meter.value}{o.meter.label === 'Risk' ? '%' : ''}</Text>
                </View>
              ) : null}
            </View>
            {o.badge ? <Pill text={o.badge} color={colors.gold} /> : null}
          </Pressable>
        );
      })}
      {step.refresh ? <Button variant="ghost" small label="🔄 Look for someone else" onPress={() => { tap(); refresh(step.refresh!); }} style={{ marginTop: 4 }} /> : null}
    </Sheet>
  );
}
