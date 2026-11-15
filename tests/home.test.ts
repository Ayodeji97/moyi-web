import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const html = readFileSync('dist/index.html', 'utf8');
const doc = new JSDOM(html).window.document;

describe('home page, the evening', () => {
  it('has exactly one h1', () => {
    const h1s = doc.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0]!.textContent?.trim()).toBe('Write before you read.');
  });

  it('carries the promise line', () => {
    const text = doc.body.textContent ?? '';
    expect(text).toContain('Write before you read.');
    expect(text).toContain('Your day opens when you both have.');
  });

  it('has four frames in order inside #how', () => {
    const frames = [...doc.querySelectorAll('[data-frame]')];
    expect(frames.map((f) => f.getAttribute('data-frame'))).toEqual(['1', '2', '3', '4']);
    for (const f of frames) expect(f.closest('#how')).not.toBeNull();
  });

  it('shows exactly one view per phone, in the story order', () => {
    const devs = [...doc.querySelectorAll('.dev')];
    const shown = devs.map((d) => {
      const visible = [...d.querySelectorAll('.v')].filter((v) => !v.hasAttribute('hidden'));
      expect(visible).toHaveLength(1);
      return visible[0]!.getAttribute('data-view');
    });
    expect(shown).toEqual(['write', 'wait', 'write', 'reveal']);
  });

  it('ships exactly one script: an external module from /_astro/', () => {
    const tags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    expect(html.match(/<script\b/g) ?? []).toHaveLength(1);
    expect(tags).toHaveLength(1);
    const [, attrs, inner] = tags[0]!;
    expect(attrs).toMatch(/\stype="module"/);
    expect(/\ssrc="([^"]+)"/.exec(attrs!)?.[1]).toMatch(/^\/_astro\/[^/]+\.js$/);
    expect(inner!.trim()).toBe('');
  });

  it('keeps the live-only rail, progress line and hint hidden in the built page', () => {
    for (const r of ['rail', 'progress', 'hint']) {
      const el = doc.querySelector(`#how [data-role="${r}"]`);
      expect(el, r).not.toBeNull();
      expect(el!.hasAttribute('hidden'), r).toBe(true);
      expect(el!.getAttribute('aria-hidden'), r).toBe('true');
    }
    expect([...doc.querySelectorAll('[data-role="rail"] li')].map((li) => li.textContent)).toEqual([
      'Amara writes',
      'Tunde writes',
      'Read together',
    ]);
    expect(doc.querySelectorAll('[data-role="progress"] > span > i')).toHaveLength(3);
    expect(doc.querySelector('#how')!.hasAttribute('data-live')).toBe(false);
  });
});

const FAQ: [string, string][] = [
  ['How does one shared day work across time zones?', "Each bond keeps one shared day, set by a single time zone for the bond (the creator's own, to begin with). You both write within that day wherever you are, and either of you can propose a different time zone in Bond settings."],
  ['What happens if one of us stops writing?', 'Nothing is sent to the other person, and nobody is told they are waiting on you. A missed day only resets the streak count. You can also leave a bond at any time, without explaining.'],
  ['Can Mọyì read our entries?', 'Entries are not end to end encrypted, so in principle they can be read on our servers. We never sell them or use them for ads, and the privacy page explains exactly who can see them, and when.'],
  ['How do I delete my account?', "In the app, go to Settings, then Account, then Delete account. No phone? Email hello@getmoyi.app from your account's address. The delete account page lists what is removed, and when."],
];

describe('home page, the rest', () => {
  it('orders the sections after #how inside main', () => {
    const main = doc.querySelector('main')!;
    const kids = [...main.children].map((c) => c.id || c.getAttribute('data-section'));
    expect(kids).toEqual(['how', 'statement', 'for-two', 'private', 'questions', 'close']);
  });

  it('carries every approved string', () => {
    const text = (doc.body.textContent ?? '').replace(/\s+/g, ' ');
    for (const s of [
      'One sentence a day about someone you love.', 'Kept sealed until they write theirs.',
      'For two', 'Whoever your one person is.',
      'My partner', 'Across the room, or across the world.',
      'My close friend', 'The one you would call first.',
      'My family', 'A sibling, a parent, a cousin. Both of you 18 or over.',
      'Lagos and London, or Lisbon and Los Angeles. Mọyì keeps one shared day for both of you, whatever the time zones say.',
      'Private by construction', 'Made for two people, and only two.',
      'Just the two of you', 'Read receipts', 'Last seen', 'Typing dots', 'Followers', 'A feed',
      'Two people. Nobody else.',
      'No audience, and no sign of who opened the app or when. Leave a bond at any time, with no questions.',
      'Kind to missed days', 'Miss a day. Nothing is lost.',
      'Only the streak count resets. Nobody is told, and nobody is waiting on you.',
      'Honest about privacy', 'Your words stay yours.',
      'No ads, and your words are never sold. Entries are not end to end encrypted, and we explain why in plain words.',
      'Read the privacy page', 'Questions', 'Before you download.', 'I know your worth.', 'Mo mọ ìyì rẹ.',
    ]) expect(text, s).toContain(s);
  });

  it('pins the four questions and answers word for word', () => {
    const qas = [...doc.querySelectorAll('details.qa')];
    expect(qas).toHaveLength(4);
    qas.forEach((d, i) => {
      expect(d.querySelector('summary')!.textContent!.trim()).toBe(FAQ[i]![0]);
      expect(d.querySelector('p')!.textContent!.trim()).toBe(FAQ[i]![1]);
    });
    expect(qas.map((d) => d.hasAttribute('open'))).toEqual([true, false, false, false]);
  });

  it('lists the things Mọyì does not have, and the week of dots', () => {
    const ul = doc.querySelector('ul[aria-label="Things Mọyì does not have"]')!;
    expect([...ul.querySelectorAll('li > s')].map((e) => e.textContent)).toEqual(['Read receipts', 'Last seen', 'Typing dots', 'Followers', 'A feed']);
    const days = doc.querySelector('[role="img"][aria-label="A week with six days written and one missed"]')!;
    expect(days.querySelectorAll('i')).toHaveLength(7);
    expect(days.querySelectorAll('i.miss')).toHaveLength(1);
  });

  it('puts the stores in the close, with #get', () => {
    const close = doc.querySelector('[data-section="close"]')!;
    expect(close.querySelector('#get')).not.toBeNull();
    expect(close.querySelector('footer')).toBeNull();
    const foot = doc.querySelector('footer')!;
    expect(foot.closest('main')).toBeNull();
    expect(foot.parentElement).toBe(doc.body);
    expect(close.querySelector('p.yo')!.getAttribute('lang')).toBe('yo');
  });

  it('only links to allowed hrefs', () => {
    const ok = ['/', '#how', '#get', '/privacy', '/terms', '/data-processing', '/support', '/delete-account', 'mailto:hello@getmoyi.app'];
    for (const a of doc.querySelectorAll('a[href]')) {
      const h = a.getAttribute('href')!;
      expect(ok.includes(h) || h.startsWith('https://apps.apple.com/') || h.startsWith('https://play.google.com/'), h).toBe(true);
    }
  });
});
