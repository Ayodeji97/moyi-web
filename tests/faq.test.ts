import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

// The questions moved off the home page to /faq (owner, 2026-11-16); all start closed.
const doc = new JSDOM(readFileSync('dist/faq.html', 'utf8')).window.document;
const home = new JSDOM(readFileSync('dist/index.html', 'utf8')).window.document;

const FAQ: [string, string][] = [
  ['How does one shared day work across time zones?', "Each bond keeps one shared day, set by a single time zone for the bond (the creator's own, to begin with). You both write within that day wherever you are, and either of you can propose a different time zone in Bond settings."],
  ['What happens if one of us stops writing?', 'Nothing is sent to the other person, and nobody is told they are waiting on you. A missed day only resets the streak count. You can also leave a bond at any time, without explaining.'],
  ['Can Mọyì read our entries?', 'Entries are not end to end encrypted, so in principle they can be read on our servers. We never sell them or use them for ads, and the privacy page explains exactly who can see them, and when.'],
  ['How do I delete my account?', "In the app, go to Settings, then Account, then Delete account. No phone? Email hello@getmoyi.app from your account's address. The delete account page lists what is removed, and when."],
];

describe('the FAQs page', () => {
  it('has one h1, "FAQs", and the four questions word for word, all closed', () => {
    expect([...doc.querySelectorAll('h1')].map((h) => h.textContent)).toEqual(['FAQs']);
    const qas = [...doc.querySelectorAll('details.qa')];
    expect(qas).toHaveLength(4);
    qas.forEach((d, i) => {
      expect(d.querySelector('summary')!.textContent!.trim()).toBe(FAQ[i]![0]);
      expect(d.querySelector('p')!.textContent!.trim()).toBe(FAQ[i]![1]);
    });
    expect(qas.some((d) => d.hasAttribute('open'))).toBe(false);
  });

  it('sends the home-page anchors back to the home page', () => {
    const hrefs = [...doc.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/#how');
    expect(hrefs).toContain('/#get');
    expect(hrefs.filter((h) => h === '#how' || h === '#get')).toEqual([]);
  });

  it('is linked from the home page, which no longer carries the questions', () => {
    expect(home.querySelector('details.qa')).toBeNull();
    expect(home.querySelector('header a[href="/faq"]')).not.toBeNull();
    expect(home.querySelector('footer a[href="/faq"]')).not.toBeNull();
  });
});
