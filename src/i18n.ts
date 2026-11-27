import { useEffect, useState } from 'react';
export type PublicLanguage = 'en' | 'he';
const KEY = 'dupaman-public-language';
const EVENT = 'dupaman-language-change';
export function getPublicLanguage(): PublicLanguage { if (typeof window === 'undefined') return 'en'; try { const v=localStorage.getItem(KEY); if(v==='he'||v==='en') return v; } catch {} return 'en'; }
export function setPublicLanguage(language: PublicLanguage): void { try { localStorage.setItem(KEY,language); } catch {} window.dispatchEvent(new CustomEvent(EVENT,{detail:language})); }
export function usePublicLanguage(): PublicLanguage { const [language,setLanguage]=useState<PublicLanguage>(getPublicLanguage); useEffect(()=>{ const sync=(event?:Event)=>{ const next=(event as CustomEvent<PublicLanguage>|undefined)?.detail ?? getPublicLanguage(); if(next==='en'||next==='he') setLanguage(next); }; window.addEventListener(EVENT,sync); window.addEventListener('storage',sync); document.documentElement.lang=language; document.documentElement.dir=language==='he'?'rtl':'ltr'; return ()=>{window.removeEventListener(EVENT,sync);window.removeEventListener('storage',sync);}; },[language]); return language; }
