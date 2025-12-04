// ============================================================================
// File: userscript/protonmail-show-alias.user.js
// ==UserScript==
// @name         Proton Mail: Show Alias
// @namespace    cc.proton.xoriginalto
// @version      1.0.0
// @author       Kimiko2547
// @license      MIT
// @description  Alt+Shift+X → View headers → copy X-Original-To; inserts "Alias …" after recipient.
// @homepageURL  https://github.com/Kimiko2547/protonmail-show-alias
// @match        https://mail.proton.me/*
// @downloadURL  https://raw.githubusercontent.com/Kimiko2547/protonmail-show-alias/main/protonmail-show-alias.user.js
// @updateURL    https://raw.githubusercontent.com/Kimiko2547/protonmail-show-alias/main/protonmail-show-alias.user.js
// @icon         data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='88' height='64' x='4' y='16' rx='8' ry='8' fill='%23007aff'/><path fill='%23fff' d='M12 24h72L48 48 12 24z'/><path fill='%23fff' d='M12 72V31l36 21 36-21v41z'/><g fill='%23fff'><rect x='26' y='74' width='44' height='6' rx='3'/><rect x='38' y='62' width='20' height='6' rx='3'/></g></svg>
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const CFG = {
    hotkey: { altKey: true, shiftKey: true, key: 'X' },
    toastMs: 3800,
    autoClose: true,
    buttonLabel: 'Show Alias',
    kebabId: 'message-header-expanded:more-dropdown',
    headersItemId: 'message-view-more-dropdown:view-message-headers',
    modalClass: 'message-headers-modal',
    waits: { menuAfterKebabMs: 180, scanMenuMs: 1200, dialogMs: 3500 },
    aliasId: 'xot-alias-inline'
  };

  GM_addStyle([
    '.xot-btn{font:12px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;border:1px solid currentColor;',
    'padding:2px 8px;border-radius:999px;cursor:pointer;opacity:.92;margin-inline:6px;white-space:nowrap}',
    '.xot-btn:hover{opacity:1}',
    '.xot-toast{position:fixed;inset-inline:0;bottom:18px;margin:0 auto;max-width:90vw;width:max-content;',
    'z-index:2147483647;background:rgba(0,0,0,.9);color:#fff;padding:10px 14px;border-radius:10px;',
    'font:13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.3)}',
    /* Dotless inline style */
    '.xot-alias{display:inline;opacity:.9;margin-left:.5rem;font:12px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}',
    '.xot-alias .xot-label{font-weight:600;opacity:.85;margin-right:.35rem}',
    /* White copy icon */
    '.xot-copy{display:inline-flex;vertical-align:middle;margin-left:.5rem;cursor:pointer;opacity:.9;color:#fff}',
    '.xot-copy:hover{opacity:1}',
    '.xot-copy svg{fill:currentColor}'
  ].join(''));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const q = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const vis = (el) => {
    if (!el || !el.isConnected) return false;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  function toast(msg){const e=document.createElement('div');e.className='xot-toast';e.textContent=msg;document.body.appendChild(e);setTimeout(()=>e.remove(),CFG.toastMs);}
  async function copy(text){try{await navigator.clipboard.writeText(text);}catch{window.prompt('Copy value:', text);}}

  function unfold(raw){const out=[];for(const line of raw.split(/\r?\n/)){if(/^\s/.test(line)&&out.length) out[out.length-1]+=' '+line.trim(); else out.push(line);}return out;}
  function headerValue(raw,name){const esc=name.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');const re=new RegExp('^'+esc+'\\s*:\\s*(.+)$','i');const hit=unfold(raw).find((l)=>re.test(l));return hit?hit.replace(re,'$1').trim():null;}
  function extractXOT(text){return headerValue(text,'X-Original-To')||headerValue(text,'Delivered-To')||headerValue(text,'To');}

  function getHeadersDialog(){const dlg=q('.'+CFG.modalClass);if(!dlg)return null;const pre=q('pre, code, .headers, .raw',dlg);const text=(pre?pre.textContent:dlg.textContent)||'';return{dlg,text};}
  function closeDialog(dlg){const btn=q('button[aria-label*="Close"]',dlg)||q('button[title*="Close"]',dlg)||q('[data-testid*="close"]',dlg);if(btn)btn.click();else document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));}

  async function openHeaders(){
    let item=q('[data-testid="'+CFG.headersItemId+'"]');
    if(item){item.click();return true;}
    const kebab=q('[data-testid="'+CFG.kebabId+'"]');
    if(!kebab||!vis(kebab)){toast('Open an email to view original recipient address.');return false;}
    const expanded=kebab.getAttribute('aria-expanded')||'false';
    if(expanded==='false'){kebab.click();await sleep(CFG.waits.menuAfterKebabMs);}
    const t0=performance.now();
    while(performance.now()-t0<CFG.waits.scanMenuMs){item=q('[data-testid="'+CFG.headersItemId+'"]');if(item&&vis(item)){item.click();break;}await sleep(60);}
    if(!item){toast('“View headers” menu item not found.');return false;}
    const t1=performance.now();
    while(performance.now()-t1<CFG.waits.dialogMs){if(getHeadersDialog())return true;await sleep(80);}
    return false;
  }

  function removeOldAlias(){qsa('#'+CFG.aliasId).forEach((n)=>n.remove());}
  function makeCopyIcon(onClick,title){
    const btn=document.createElement('span');
    btn.className='xot-copy'; btn.setAttribute('role','button'); btn.setAttribute('tabindex','0'); btn.setAttribute('aria-label', title || 'Copy alias');
    btn.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8a1 1 0 1 1 0-2h4a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v1a1 1 0 1 1-2 0V3z"></path><path d="M2 6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm2-1a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4z"></path></svg>';
    const handler=(e)=>{e.preventDefault();e.stopPropagation();onClick();};
    btn.addEventListener('click',handler,{passive:true});
    btn.addEventListener('keydown',(e)=>{if(e.key==='Enter'||e.key===' ') handler(e);},{passive:true});
    return btn;
  }
  function makeAliasNode(value){
    const span=document.createElement('span');
    span.id=CFG.aliasId; span.className='xot-alias'; span.title='Extracted from message headers (X-Original-To)';
    const b=document.createElement('span'); b.className='xot-label'; b.textContent='Alias';
    span.appendChild(b);
    span.appendChild(document.createTextNode(' '));
    const v=document.createElement('span'); v.textContent=value;
    span.appendChild(v);
    span.appendChild(makeCopyIcon(()=>copy(value).then(()=>toast('Copied alias: '+value)).catch(()=>{}),'Copy alias to clipboard'));
    return span;
  }
  function insertAliasAfterRecipientLabel(value){
    removeOldAlias();
    const roots=[
      '[data-testid="recipients:partial-recipients-list"]',
      '[data-testid*="recipients:partial-recipients-list"]',
      '[data-testid*="message-header-expanded"]'
    ];
    let label=null;
    for(let i=0;i<roots.length;i+=1){
      const root=q(roots[i]); if(!root) continue;
      label=q('[data-testid="recipient-label"]',root)||q('[data-testid*="recipient-label"]',root);
      if(label&&vis(label))break; label=null;
    }
    if(!label){label=q('[data-testid="recipient-label"]')||q('[data-testid*="recipient-label"]'); if(label&&!vis(label)) label=null;}
    if(!label){console.warn('XOT: recipient-label not found; alias inline not placed.');return false;}
    label.insertAdjacentElement('afterend', makeAliasNode(value));
    return true;
  }

  async function run(){
    let info=getHeadersDialog();
    if(!info){const ok=await openHeaders(); if(!ok) return; info=getHeadersDialog();}
    if(!info||!info.text){toast('Headers not found.');return;}
    const xot=extractXOT(info.text);
    if(!xot){toast('X-Original-To not present.');return;}
    await copy(xot); toast('X-Original-To: '+xot);
    insertAliasAfterRecipientLabel(xot);
    if(CFG.autoClose) closeDialog(info.dlg);
  }

  function injectButton(){
    if(q('.xot-btn')) return;
    const regions=['[data-testid*="message-toolbar"]','[data-testid*="message-header"]','.messageView-header','header','nav'];
    let bar=null;
    for(let i=0;i<regions.length;i+=1){const el=q(regions[i]); if(el&&q('button,[role="button"]',el)){bar=el;break;}}
    if(!bar) return;
    const btn=document.createElement('button');
    btn.type='button'; btn.className='xot-btn'; btn.textContent=CFG.buttonLabel;
    btn.addEventListener('click', ()=>run(), {passive:true});
    if(bar.firstElementChild) bar.insertBefore(btn, bar.firstElementChild); else bar.appendChild(btn);
  }
  const mo=new MutationObserver(()=>injectButton());
  mo.observe(document.documentElement,{childList:true,subtree:true});
  injectButton();

  window.addEventListener('keydown',(ev)=>{
    const k=CFG.hotkey;
    const same=(!!ev.altKey===!!k.altKey)&& (!!ev.shiftKey===!!k.shiftKey)&& (!!ev.ctrlKey===!!k.ctrlKey)&& ((ev.key||'').toUpperCase()===(k.key||'').toUpperCase());
    if(same){ev.preventDefault(); run();}
  }, true);
})();
