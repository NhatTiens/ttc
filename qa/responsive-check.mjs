import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(root, 'apps/web/src/app/globals.css'), 'utf8');
const shell = fs.readFileSync(path.join(root, 'apps/web/src/components/layout/app-shell.tsx'), 'utf8');
const mobileNav = fs.readFileSync(path.join(root, 'apps/web/src/components/layout/mobile-navigation.tsx'), 'utf8');
const table = fs.readFileSync(path.join(root, 'apps/web/src/components/ui/table.tsx'), 'utf8');

const failures = [];
function expect(name, condition) {
  if (!condition) failures.push(name);
}

expect('desktop sidebar default', css.includes('.app-shell__desktop-sidebar { position: fixed;'));
expect('tablet breakpoint includes 1024', css.includes('@media (max-width: 1024px) and (min-width: 768px)'));
expect('tablet hides desktop sidebar', css.includes('.app-shell__desktop-sidebar { display: none; }'));
expect('tablet shows rail', css.includes('.app-shell__tablet-sidebar { display: block; }'));
expect('mobile breakpoint', css.includes('@media (max-width: 767px)'));
expect('mobile hides sidebars', css.includes('.app-shell__desktop-sidebar, .app-shell__tablet-sidebar { display: none; }'));
expect('mobile bottom navigation', css.includes('.mobile-navigation { display: grid; grid-template-columns: repeat(5, 1fr);'));
expect('small-phone breakpoint', css.includes('@media (max-width: 389px)'));
expect('responsive table desktop/mobile switch', css.includes('.responsive-table__desktop { display: none; }') && css.includes('.responsive-table__mobile { display: grid; gap: 10px; }'));
expect('mobile has dedicated component', shell.includes('<MobileNavigation />') && mobileNav.includes('aria-label="Mobile navigation"'));
expect('app shell has skip link', shell.includes('href="#main-content"'));
expect('main content landmark', shell.includes('id="main-content"'));
expect('responsive table renders separate mobile items', table.includes('responsive-table__mobile'));

const targets = [1440, 1280, 1024, 768, 430, 390, 375].map((width) => ({
  width,
  navigation: width >= 1280 ? 'desktop-sidebar' : width >= 768 ? 'tablet-rail' : 'mobile-bottom-nav',
  contentPadding: width < 390 ? 12 : width < 768 ? 16 : width <= 1024 ? 20 : width < 1280 ? 24 : 32,
}));

if (failures.length) {
  console.error('Responsive contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Responsive contract passed.');
for (const target of targets) {
  console.log(`${target.width}px -> ${target.navigation}; main inline padding ~${target.contentPadding}px`);
}
