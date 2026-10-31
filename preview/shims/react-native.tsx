// Minimal react-native -> DOM shim. ONLY used by the browser preview (preview/build.ts).
// The real app uses the real react-native; this exists so the same UI code can be played in a browser.
import React from 'react';

type Style = any;
const flatten = (s: Style): Record<string, any> => {
  if (!s) return {};
  if (Array.isArray(s)) return s.reduce((a, x) => ({ ...a, ...flatten(x) }), {});
  return s;
};

export function rn(style: Style): React.CSSProperties {
  const s = flatten(style);
  const o: Record<string, any> = {};
  for (const [k, v] of Object.entries(s)) {
    if (v === undefined || v === null) continue;
    switch (k) {
      case 'paddingHorizontal': o.paddingLeft = v; o.paddingRight = v; break;
      case 'paddingVertical': o.paddingTop = v; o.paddingBottom = v; break;
      case 'marginHorizontal': o.marginLeft = v; o.marginRight = v; break;
      case 'marginVertical': o.marginTop = v; o.marginBottom = v; break;
      case 'lineHeight': o.lineHeight = typeof v === 'number' ? `${v}px` : v; break;
      case 'textAlignVertical': case 'includeFontPadding': case 'elevation': case 'resizeMode':
      case 'shadowColor': case 'shadowOffset': case 'shadowOpacity': case 'shadowRadius': break;
      default: o[k] = v;
    }
  }
  return o as React.CSSProperties;
}

const base: React.CSSProperties = { display: 'flex', flexDirection: 'column', position: 'relative', boxSizing: 'border-box', flexShrink: 0, alignItems: 'stretch', minWidth: 0, minHeight: 0 };

export const View = React.forwardRef<HTMLDivElement, any>(({ style, children, onLayout, ...rest }, ref) => (
  <div ref={ref} style={{ ...base, ...rn(style) }} {...pick(rest)}>{children}</div>
));

function pick(p: any) { const o: any = {}; if (p.testID) o['data-testid'] = p.testID; return o; }

export function Text({ style, children, numberOfLines, onPress, ...rest }: any) {
  const s: React.CSSProperties = { margin: 0, display: 'inline', boxSizing: 'border-box', whiteSpace: 'pre-wrap', wordBreak: 'break-word', font: 'inherit', color: 'inherit', ...rn(style) };
  if (numberOfLines) Object.assign(s, { display: '-webkit-box', WebkitLineClamp: numberOfLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' });
  if (onPress) s.cursor = 'pointer';
  return <span style={s} onClick={onPress} {...pick(rest)}>{children}</span>;
}

export function Pressable({ style, children, onPress, disabled }: any) {
  const [pressed, setPressed] = React.useState(false);
  const st = typeof style === 'function' ? style({ pressed }) : style;
  return (
    <div
      role="button"
      onClick={() => { if (!disabled && onPress) onPress(); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{ ...base, cursor: disabled ? 'default' : 'pointer', userSelect: 'none', ...rn(st) }}
    >
      {typeof children === 'function' ? children({ pressed }) : children}
    </div>
  );
}

export function ScrollView({ style, contentContainerStyle, children, horizontal }: any) {
  return (
    <div style={{ ...base, flexGrow: 1, flexShrink: 1, flexBasis: 'auto', overflowY: horizontal ? 'hidden' : 'auto', overflowX: horizontal ? 'auto' : 'hidden', flexDirection: horizontal ? 'row' : 'column', minHeight: 0, ...rn(style) }}>
      <div style={{ ...base, flexGrow: 1, flexDirection: horizontal ? 'row' : 'column', ...rn(contentContainerStyle) }}>{children}</div>
    </div>
  );
}

export function TextInput({ value, onChangeText, placeholder, style, secureTextEntry }: any) {
  return (
    <input
      className="rn-input"
      value={value}
      placeholder={placeholder}
      type={secureTextEntry ? 'password' : 'text'}
      onChange={(e) => onChangeText && onChangeText(e.target.value)}
      style={{ ...base, font: 'inherit', outline: 'none', ...rn(style) }}
    />
  );
}

export const StyleSheet = { create: <T,>(s: T) => s, flatten, absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as any };
export const Platform = { OS: 'web', select: (o: any) => o.web ?? o.default };
export type StyleProp<T> = T | T[] | null | undefined | false;
export type ViewStyle = Record<string, any>;
