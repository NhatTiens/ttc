import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.join(root, 'apps/web/src');
const read = (relativePath) => fs.readFileSync(path.join(sourceRoot, relativePath), 'utf8');
const showcase = read('components/design-system-showcase.tsx');

const componentFiles = {
  Button: 'components/ui/button.tsx', IconButton: 'components/ui/button.tsx',
  Card: 'components/ui/card.tsx', StatCard: 'components/ui/card.tsx', ServiceCard: 'components/ui/card.tsx',
  Input: 'components/ui/form-controls.tsx', Textarea: 'components/ui/form-controls.tsx', Select: 'components/ui/form-controls.tsx', SearchInput: 'components/ui/form-controls.tsx', NumberInput: 'components/ui/form-controls.tsx',
  Tabs: 'components/ui/tabs.tsx', Table: 'components/ui/table.tsx', ResponsiveTable: 'components/ui/table.tsx', Pagination: 'components/ui/table.tsx',
  Badge: 'components/ui/badge.tsx', StatusBadge: 'components/ui/badge.tsx', OrderStatus: 'components/ui/badge.tsx',
  Modal: 'components/ui/overlays.tsx', Drawer: 'components/ui/overlays.tsx', ConfirmDialog: 'components/ui/overlays.tsx',
  Toast: 'components/ui/toast.tsx', EmptyState: 'components/ui/states.tsx', ErrorState: 'components/ui/states.tsx', LoadingState: 'components/ui/states.tsx', Skeleton: 'components/ui/states.tsx',
  UserAvatar: 'components/ui/identity.tsx', NotificationMenu: 'components/ui/identity.tsx', WalletBalance: 'components/ui/identity.tsx',
  AppShell: 'components/layout/app-shell.tsx', Sidebar: 'components/layout/sidebar.tsx', MobileNavigation: 'components/layout/mobile-navigation.tsx', Topbar: 'components/layout/topbar.tsx', PageHeader: 'components/layout/page-header.tsx'
};

const platforms = ['facebook', 'tiktok', 'instagram', 'youtube', 'threads'];
const statuses = ['Processing', 'Completed', 'Pending', 'Failed', 'Cancelled', 'Partial', 'Refunded'];
const showcaseSections = ['Typography', 'Colors', 'Buttons & icon buttons', 'Form controls', 'Cards', 'Table & responsive table', 'Badges & order status', 'Modal, drawer & confirm dialog', 'Toast', 'Loading, empty & error states'];
const failures = [];

for (const [name, file] of Object.entries(componentFiles)) {
  const source = read(file);
  if (!source.includes(`function ${name}`) && !source.includes(`const ${name}`)) failures.push(`${name} missing from ${file}`);
}

const platformIcons = read('components/brand/platform-icons.tsx');
for (const platform of platforms) if (!platformIcons.includes(platform)) failures.push(`platform missing ${platform}`);
const badge = read('components/ui/badge.tsx');
for (const status of statuses) if (!badge.includes(status)) failures.push(`status missing ${status}`);
for (const section of showcaseSections) if (!showcase.includes(section)) failures.push(`design-system section missing ${section}`);
if (!fs.existsSync(path.join(sourceRoot, 'app/(app)/design-system/page.tsx'))) failures.push('/design-system route missing');

if (failures.length) {
  console.error('Component contract failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Component contract passed.');
console.log(`Components: ${Object.keys(componentFiles).length}; platforms: ${platforms.length}; statuses: ${statuses.length}.`);
