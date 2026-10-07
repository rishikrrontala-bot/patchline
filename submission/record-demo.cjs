'use strict';

// Records the real local Patchline prototype. No audio, network API, or patient data.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = process.env.PATCHLINE_URL || 'http://127.0.0.1:8765/';
const rehearsal = process.argv.includes('--rehearse');
const videoPath = path.join(__dirname, 'Patchline-Demo.webm');

const pause = (page, ms) => page.waitForTimeout(ms);

async function visible(page, selector, name) {
  const control = page.locator(selector).first();
  if (!await control.isVisible()) throw new Error(`Missing ${name}: ${selector}`);
  console.log(`OK ${name}`);
  return control;
}

async function check(page, selector, expected, name) {
  const actual = (await page.locator(selector).first().textContent())?.trim() || '';
  if (!actual.includes(expected)) throw new Error(`${name}: expected ${expected}, saw ${actual}`);
  console.log(`OK ${name}: ${actual.slice(0, 80)}`);
}

async function injectOverlays(page) {
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.style.cssText = 'position:fixed;left:0;top:0;z-index:999999;pointer-events:none;width:28px;height:28px;filter:drop-shadow(2px 3px 3px rgba(0,0,0,.3));transition:left .10s ease,top .10s ease';
    cursor.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 2L23 15L14 16L10 25L4 2Z" fill="#F4F1EA" stroke="#100F0D" stroke-width="2" stroke-linejoin="round"/></svg>';
    document.body.append(cursor);
    document.addEventListener('mousemove', event => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });
    const caption = document.createElement('div');
    caption.id = 'demo-caption';
    caption.style.cssText = 'position:fixed;left:24px;right:24px;bottom:18px;z-index:999998;pointer-events:none;background:rgba(16,15,13,.94);color:#F4F1EA;font:600 19px/1.35 Arial,sans-serif;letter-spacing:.01em;padding:13px 20px;border-left:5px solid #DA532C;max-width:1160px;box-sizing:border-box';
    caption.textContent = 'SIMULATED PROTOTYPE · No physical patch or treatment';
    document.body.append(caption);
  });
}

async function caption(page, text) {
  await page.locator('#demo-caption').evaluate((el, value) => { el.textContent = value; }, text);
  await pause(page, 350);
}

async function moveTo(page, control) {
  await control.scrollIntoViewIfNeeded();
  await pause(page, 350);
  const box = await control.boundingBox();
  if (!box) throw new Error('Target has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
  await pause(page, 300);
}

async function click(page, selector, name) {
  const control = await visible(page, selector, name);
  await moveTo(page, control);
  await control.click();
  await pause(page, 700);
}

async function scrollTo(page, selector, name) {
  const target = await visible(page, selector, name);
  await target.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  await pause(page, 1300);
}

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome', headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--mute-audio']
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ...(rehearsal ? {} : { recordVideo: { dir: path.join(__dirname, '.video-tmp'), size: { width: 1280, height: 720 } } })
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });

  try {
    if (rehearsal) {
      const fieldMap = await page.evaluate(() => Array.from(document.querySelectorAll('button,a,input'))
        .filter(el => el.getBoundingClientRect().width > 0)
        .map(el => ({ tag: el.tagName, id: el.id, text: el.textContent.trim().slice(0, 40), scenario: el.dataset.scenario || '' })));
      console.log('FIELD MAP', JSON.stringify(fieldMap));
      await visible(page, 'a[href="#prototype"]', 'prototype link');
      await visible(page, '[data-scenario="stable"]', 'stable control');
      await visible(page, '[data-scenario="change"]', 'change control');
      await visible(page, '[data-scenario="fault"]', 'fault control');
      await visible(page, '#trace-grid', 'sensor traces');
      await visible(page, '#decision-label', 'bounded decision');
      await visible(page, '#handoff', 'handoff');
      await visible(page, '#print-report', 'print report control');
      await visible(page, '#boundaries', 'boundaries');
      await page.locator('[data-scenario="stable"]').click();
      await check(page, '#decision-label', 'Record', 'stable decision');
      await page.locator('[data-scenario="change"]').click();
      await check(page, '#decision-label', 'review', 'change decision');
      await page.locator('[data-scenario="fault"]').click();
      await check(page, '#score-value', '—', 'fault withheld score');
      await check(page, '#ultrasound-value', '0 / 3', 'fault ultrasound zero');
      await check(page, '#violet-value', '0 / 3', 'fault violet zero');
      await visible(page, '#claim-list button', 'evidence link');
      if (errors.length) throw new Error(`Page errors: ${errors.join('; ')}`);
      console.log('REHEARSAL PASSED');
    } else {
      await injectOverlays(page);
      await page.mouse.move(1170, 80, { steps: 10 });
      await caption(page, 'A smart bandage concept you can question');
      await pause(page, 3300);
      await click(page, 'a[href="#prototype"]', 'Explore prototype');
      await caption(page, 'Four generated sensor channels. No patient readings.');
      await pause(page, 1500);
      await click(page, '[data-scenario="stable"]', 'Stable trace');
      await scrollTo(page, '.trace-panel', 'sensor traces');
      await pause(page, 2800);
      await scrollTo(page, '.decision-panel', 'control plane');
      await caption(page, 'Stable trace: record only. Both virtual outputs stay at zero.');
      await pause(page, 2700);
      await scrollTo(page, '.tuning-panel', 'last-sample controls');
      await caption(page, 'You can change the last synthetic reading yourself.');
      await click(page, '#manual-temperature', 'temperature slider');
      for (let index = 0; index < 4; index += 1) {
        await page.locator('#manual-temperature').press('ArrowRight');
        await pause(page, 300);
      }
      await pause(page, 2500);
      await click(page, '#reset-controls', 'Reset last sample');
      await pause(page, 1000);

      await scrollTo(page, '.scenario-bar', 'scenario controls');
      await click(page, '[data-scenario="change"]', 'Pattern change trace');
      await caption(page, 'Changing pattern: prepare a human review.');
      await scrollTo(page, '.decision-panel', 'changed decision');
      await pause(page, 3400);
      await caption(page, '0–3 indicators are abstract tokens, never doses.');
      await pause(page, 2700);

      await scrollTo(page, '.scenario-bar', 'scenario controls');
      await click(page, '[data-scenario="fault"]', 'Sensor fault trace');
      await caption(page, 'Bad evidence stops the loop before the model can act.');
      await scrollTo(page, '.trace-panel', 'fault traces');
      await pause(page, 2400);
      await scrollTo(page, '.decision-panel', 'quality hold decision');
      await pause(page, 3300);
      await caption(page, 'Score withheld. Virtual ultrasound and violet light: zero.');
      await pause(page, 2600);

      await scrollTo(page, '#handoff', 'reviewable handoff');
      await caption(page, 'Every claim links to the source synthetic samples.');
      await pause(page, 2300);
      await click(page, '#claim-list .claim-row:last-child button', 'View flagged samples');
      await pause(page, 2600);
      await scrollTo(page, '#handoff', 'handoff and model provenance');
      await caption(page, 'Model provenance and firmware-like events stay visible.');
      await pause(page, 3600);
      await caption(page, 'A one-page report can be printed for human review.');
      await page.emulateMedia({ media: 'print' });
      await pause(page, 4800);
      await page.emulateMedia({ media: 'screen' });
      await pause(page, 1000);

      await scrollTo(page, '#boundaries', 'prototype boundaries');
      await caption(page, 'No physical sensors. No infection diagnosis. No treatment.');
      await pause(page, 4300);
      await caption(page, 'PATCHLINE · Built by Rishik Rontala');
      await pause(page, 3500);
      if (errors.length) throw new Error(`Page errors: ${errors.join('; ')}`);
      console.log('RECORDING FLOW PASSED');
    }
  } finally {
    await context.close();
    if (!rehearsal) {
      await page.video().saveAs(videoPath);
      console.log(`VIDEO ${videoPath} ${fs.statSync(videoPath).size} bytes`);
    }
    await browser.close();
  }
})().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
