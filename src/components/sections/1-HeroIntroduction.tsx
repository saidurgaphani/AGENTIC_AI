'use client';

import React from 'react';

export function HeroIntroduction() {
  return (
    <section className="relative w-full h-[100svh] min-h-[700px] overflow-hidden bg-[#0a0b0c]">
      <link rel="preload" as="video" type="video/mp4" href="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261005_115944_095d91d4-030f-4e82-b42b-a388c0816d24.mp4" />
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --hero-s: min(100vh / 800, 100vw / 716);
          --hero-cover: max(100vw / 1280, 100vh / 800);
          --cream: #F7F5EF;
          --white: #F9F9F9;
          --ink: rgba(255,255,255,.88);
          --accent: #D6523A;
        }
        .hero-frame {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #0a0b0c;
        }
        .hero-bg-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          background: #0a0b0c;
        }
        .hero-tint {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(to bottom,
            rgba(0,0,0,0.118) 0%, rgba(0,0,0,0.092) 11%, rgba(0,0,0,0.083) 20%,
            rgba(0,0,0,0.079) 29%, rgba(0,0,0,0.014) 37.5%, rgba(0,0,0,0.016) 46%,
            rgba(0,0,0,0.043) 55%, rgba(0,0,0,0.058) 64%, rgba(0,0,0,0.062) 73%,
            rgba(0,0,0,0.080) 81%, rgba(0,0,0,0.090) 90%, rgba(0,0,0,0.095) 100%
          );
        }
        .hero-top-blend {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 180px;
          background: linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 20%, rgba(255,255,255,0) 100%);
          z-index: 15;
          pointer-events: none;
        }

        .hero-stage {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 1280px;
          height: 800px;
          margin: -400px 0 0 -640px;
          transform: scale(var(--hero-s));
          transform-origin: 50% 50%;
          font-family: var(--font-body-family), system-ui, sans-serif;
          font-kerning: none;
          font-variant-ligatures: none;
          font-feature-settings: normal;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: geometricPrecision;
          z-index: 20;
        }
        
        .eyebrow {
          position: absolute; left: 0; top: 80px; width: 1280px; margin: 0;
          font-weight: 700; font-size: 10px; line-height: 1; word-spacing: 0.522px;
          text-align: center; text-transform: uppercase;
          color: var(--cream); text-shadow: 0 1px 3px rgba(0,0,0,.45);
          letter-spacing: 3px; text-indent: 3px;
        }
        
        .headline {
          position: absolute; left: 0; top: 120px; width: 1280px; margin: 0;
          font-family: var(--font-display-family), "Impact", system-ui, sans-serif;
          font-weight: 800; font-size: 82px; line-height: 1.05;
          text-align: center; text-transform: uppercase;
          color: var(--cream); text-shadow: 0 15px 36px rgba(0,0,0,0.50);
          display: flex; flex-direction: column; gap: 2px;
        }
        .headline span { display: block; }
        
        .mark {
          position: absolute; left: 549.5px; top: 520px; width: 52px; height: 52px; overflow: visible;
        }
        
        .feature { 
          position: absolute; 
          display: flex; 
          flex-direction: column; 
          gap: 12px; 
          width: 340px; 
        }
        .feature h2 { font-weight: 700; font-size: 22px; line-height: 1.1; text-transform: uppercase; color: var(--white); text-shadow: 0 1px 4px rgba(0,0,0,.4); margin: 0; letter-spacing: 0.5px; }
        .feature p { font-weight: 400; font-size: 15px; line-height: 1.4; color: var(--ink); text-shadow: 0 1px 3px rgba(0,0,0,.35); margin: 0; }
        
        .f-left { text-align: right; right: 730px; top: 550px; align-items: flex-end; }
        .f-left .icon { margin-right: -4px; margin-bottom: 8px; width: 35px; height: 34px; }
        
        .f-right { text-align: left; left: 730px; top: 550px; align-items: flex-start; }
        .f-right .icon { margin-left: -3px; margin-bottom: 8px; width: 35px; height: 38px; }
        
        /* Entrance Animation */
        @media (prefers-reduced-motion: no-preference) {
          .eyebrow { animation: riseIn 0.55s cubic-bezier(.33,.9,.35,1) 0.15s both; }
          .headline span { animation: riseIn 0.9s cubic-bezier(.16,1,.3,1) both; }
          .hl1 { animation-delay: 0.28s; }
          .hl2 { animation-delay: 0.37s; }
          .hl3 { animation-delay: 0.46s; }
          .hl4 { animation-delay: 0.55s; }
          .mark { transform-origin: 50% 50%; animation: markIn 0.7s cubic-bezier(.2,.9,.25,1) 0.72s both; }
          .f-left { animation: blockInL 0.75s cubic-bezier(.16,1,.3,1) 0.82s both; }
          .f-right { animation: blockInR 0.75s cubic-bezier(.16,1,.3,1) 0.90s both; }
        }
        @keyframes riseIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes markIn { from { opacity: 0; transform: scale(.88); } to { opacity: 1; transform: none; } }
        @keyframes blockInL { from { opacity: 0; transform: translate(-16px,12px); } to { opacity: 1; transform: none; } }
        @keyframes blockInR { from { opacity: 0; transform: translate( 16px,12px); } to { opacity: 1; transform: none; } }
        
        /* Responsive Tablet Portrait */
        @media (min-width: 610px) and (max-aspect-ratio: 1/1) {
          :root { --u: min(100vw / 768, 100vh / 1024); --rail: clamp(120px, calc(var(--hero-cover) * 219), 26vw); }
          .hero-stage {
            inset: 0; margin: 0; width: auto; height: auto; transform: none;
            display: grid;
            grid-template-columns: 1fr var(--rail) 1fr;
            grid-template-rows: auto auto 1fr auto auto minmax(0,.38fr);
            padding: calc(46 * var(--u)) clamp(24px,5.2vw,72px) calc(24 * var(--u));
          }
          .eyebrow, .headline, .mark, .feature { position: static; }
          .eyebrow { grid-area: 1/1/2/-1; font-size: calc(11 * var(--u)); margin-bottom: calc(20 * var(--u)); width: auto; }
          .headline { grid-area: 2/1/3/-1; font-size: calc(84 * var(--u)); width: auto; }
          .mark { grid-area: 4/1/5/-1; justify-self: center; width: calc(64 * var(--u)); height: calc(64 * var(--u)); margin-bottom: calc(16 * var(--u)); margin-left: calc(32 * var(--u)); right: 5%; }
          .f-left { grid-area: 5/1/6/2; width: auto; }
          .f-right { grid-area: 5/3/6/4; width: auto; }
          .feature .icon { width: calc(42 * var(--u)); height: calc(46 * var(--u)); margin-bottom: calc(14 * var(--u)); }
          .feature h2 { font-size: calc(22 * var(--u)); }
          .feature p { font-size: calc(14.5 * var(--u)); max-width: calc(310 * var(--u)); }
        }
        
        /* Responsive Phone */
        @media (max-width: 609px) {
          .hero-frame { height: 100vh; height: 100dvh; }
          :root { --u: min(100vw / 390, 100dvh / 780); }
          .hero-stage {
            inset: 0; margin: 0; width: auto; height: auto; transform: none;
            display: grid;
            grid-template-columns: 100%;
            grid-template-rows: auto auto 1fr auto auto auto minmax(0,.3fr);
            padding: calc(30 * var(--u)) max(calc(22 * var(--u)), env(safe-area-inset-right)) max(calc(32 * var(--u)), env(safe-area-inset-bottom)) max(calc(22 * var(--u)), env(safe-area-inset-left));
          }
          .eyebrow, .headline, .mark, .feature { position: static; }
          .eyebrow { grid-row: 1; font-size: clamp(8px, calc(9.5 * var(--u)), 11px); margin-bottom: calc(16 * var(--u)); width: auto; }
          .headline { grid-row: 2; font-size: clamp(26px, min(11.6vw, calc(52 * var(--u))), 64px); width: auto; }
          .mark { grid-row: 4; justify-self: center; width: clamp(38px, calc(46 * var(--u)), 54px); height: clamp(38px, calc(46 * var(--u)), 54px); margin-bottom: calc(18 * var(--u)); right: 5%; }
          .f-left { grid-row: 5; margin-bottom: calc(26 * var(--u)); width: auto; }
          .f-right { grid-row: 6; width: auto; }
          .feature .icon { width: clamp(26px, calc(34 * var(--u)), 40px); height: clamp(28px, calc(37 * var(--u)), 43px); }
          .feature h2 { font-size: clamp(15px, calc(17 * var(--u)), 20px); }
          .feature p { font-size: clamp(11.5px, calc(13.5 * var(--u)), 14.5px); max-width: calc(320 * var(--u)); }
        }
      ` }} />

      <div className="hero-frame">
        <video 
          className="hero-bg-video" 
          autoPlay 
          muted 
          loop 
          playsInline 
          disablePictureInPicture
          aria-label="Aerial view of a container freight train crossing black coal terrain"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261005_115944_095d91d4-030f-4e82-b42b-a388c0816d24.mp4"
        />
        <div className="hero-tint"></div>
        <div className="hero-top-blend"></div>
        <main className="hero-stage">
          <p className="eyebrow">
            <span>POC V1.0 · CANONICAL RUN</span>
          </p>
          <h1 className="headline">
            <span className="hl1">CRITICAL</span>
            <span className="hl2">SUPPLIER</span>
            <span className="hl3">RECOVERY</span>
            <span className="hl4">ORCHESTRATION</span>
          </h1>

          <svg className="mark" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="26" cy="26" r="23" stroke="#D6523A" strokeWidth="1.6" strokeDasharray="98.3 46.3" transform="rotate(2.5 26 26)" />
            <g stroke="#D6523A" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="26.5" cy="26.1" r="2.3" />
              <path d="M28.9 27.6C31.6 29 32.9 31.2 31.8 33.3 30.7 35.4 27.2 36.1 24.2 35.1" />
            </g>
          </svg>

          <section className="feature f-left">
            <svg className="icon" viewBox="0 0 35 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <clipPath id="gclip"><circle cx="17.5" cy="17" r="9.80" /></clipPath>
              <circle cx="17.5" cy="17" r="16.5" stroke="#F9F9F9" strokeWidth="1.9" strokeDasharray="3.6 3" />
              <circle cx="17.5" cy="17" r="9.80" fill="#F9F9F9" />
              <g stroke="#101215" strokeWidth="0.90" clipPath="url(#gclip)">
                <path d="M11.90 7.20 V26.80 M17.5 7.20 V26.80 M23.10 7.20 V26.80" />
                <path d="M7.70 11.40 H27.30 M7.70 17 H27.30 M7.70 22.60 H27.30" />
              </g>
            </svg>
            <h2>Disruption Window</h2>
            <p>When a tier-one supplier shuts down for seven days, traditional MRP fails and single-echelon optimization lags.</p>
          </section>

          <section className="feature f-right">
            <svg className="icon" viewBox="0 0 35 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="17" height="9.6" rx="0.5" fill="#F9F9F9" />
              <rect x="10.5" y="13.5" width="13.5" height="10.9" rx="0.5" fill="#F9F9F9" />
              <rect x="17.5" y="28.3" width="17" height="9.7" rx="0.5" fill="#F9F9F9" />
              <g fill="#101215">
                <rect x="2.5" y="2.5" width="1.1" height="1.9" />
                <rect x="5.6" y="2.5" width="1.1" height="1.9" />
                <rect x="8.7" y="2.5" width="1.1" height="1.9" />
                <rect x="11.8" y="2.5" width="1.1" height="1.9" />
                <rect x="14.9" y="2.5" width="1.1" height="1.9" />
                
                <rect x="2.5" y="6.5" width="1.1" height="1.9" />
                <rect x="5.6" y="6.5" width="1.1" height="1.9" />
                <rect x="8.7" y="6.5" width="1.1" height="1.9" />
                <rect x="11.8" y="6.5" width="1.1" height="1.9" />
                <rect x="14.9" y="6.5" width="1.1" height="1.9" />
                
                <rect x="12.5" y="15.2" width="1.1" height="1.9" />
                <rect x="15.6" y="15.2" width="1.1" height="1.9" />
                <rect x="18.7" y="15.2" width="1.1" height="1.9" />
                <rect x="21.8" y="15.2" width="1.1" height="1.9" />
                
                <rect x="12.5" y="20.4" width="1.1" height="1.9" />
                <rect x="15.6" y="20.4" width="1.1" height="1.9" />
                <rect x="18.7" y="20.4" width="1.1" height="1.9" />
                <rect x="21.8" y="20.4" width="1.1" height="1.9" />
                
                <rect x="19.5" y="30.3" width="1.1" height="1.9" />
                <rect x="22.6" y="30.3" width="1.1" height="1.9" />
                <rect x="25.7" y="30.3" width="1.1" height="1.9" />
                <rect x="28.8" y="30.3" width="1.1" height="1.9" />
                <rect x="31.9" y="30.3" width="1.1" height="1.9" />
                
                <rect x="19.5" y="34.4" width="1.1" height="1.9" />
                <rect x="22.6" y="34.4" width="1.1" height="1.9" />
                <rect x="25.7" y="34.4" width="1.1" height="1.9" />
                <rect x="28.8" y="34.4" width="1.1" height="1.9" />
                <rect x="31.9" y="34.4" width="1.1" height="1.9" />
              </g>
            </svg>
            <h2>Multi-Agent Recovery</h2>
            <p>We combine specialized advisory agents with deterministic constraints and OR-Tools to deliver a feasible plan.</p>
          </section>
        </main>
      </div>
    </section>
  );
}
