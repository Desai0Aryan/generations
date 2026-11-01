// Browser stand-in for react-native-svg: the same components, rendered as plain SVG elements.
import React from 'react';
const mk = (tag: string) => ({ children, ...p }: any) => React.createElement(tag, p, children);
export const Svg = ({ children, style, ...p }: any) => <svg {...p} style={{ display: 'block', ...(style ?? {}) }}>{children}</svg>;
export const G = mk('g');
export const Path = mk('path');
export const Circle = mk('circle');
export const Ellipse = mk('ellipse');
export const Rect = mk('rect');
export const Line = mk('line');
export const Polygon = mk('polygon');
export const Defs = mk('defs');
export const LinearGradient = mk('linearGradient');
export const RadialGradient = mk('radialGradient');
export const Stop = mk('stop');
export const ClipPath = mk('clipPath');
export default Svg;
