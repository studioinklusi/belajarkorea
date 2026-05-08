const fs = require('fs');
const files = [
  'src/app/api/ai-buddy/route.ts',
  'src/app/(app)/courses/[slug]/lessons/[lessonId]/page.tsx',
  'src/app/(app)/pricing/page.tsx',
  'src/app/(app)/dashboard/page.tsx',
  'src/app/(app)/certificates/[courseSlug]/page.tsx',
  'src/app/(app)/ai-buddy/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('v_active_subscriptions')) {
    let parts = content.split('v_active_subscriptions');
    for (let i = 1; i < parts.length; i++) {
        parts[i] = parts[i].replace(/\.eq\('user_id',\s*user\.id\)/, ".eq('user_id', user.id).neq('computed_status', 'expired')");
    }
    content = parts.join('v_active_subscriptions');
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
}
