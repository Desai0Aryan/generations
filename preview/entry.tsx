import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App.tsx';

const style = document.createElement('style');
style.textContent = `
  html,body,#root{height:100%;margin:0;background:#050912}
  body{display:flex;justify-content:center;align-items:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#EAF0FA}
  #phone{width:min(430px,100vw);height:min(900px,100vh);position:relative;display:flex;flex-direction:column;overflow:hidden;background:#0B1220;border-radius:28px;box-shadow:0 0 0 1px #26334F,0 30px 80px rgba(0,0,0,.6)}
  @media (max-width:520px){#phone{border-radius:0;height:100vh}}
  .rn-input::placeholder{color:rgba(138,155,184,.7)}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#26334F;border-radius:3px}
`;
document.head.appendChild(style);
const root = document.getElementById('root')!;
root.innerHTML = '<div id="phone"></div>';
createRoot(document.getElementById('phone')!).render(<App />);
