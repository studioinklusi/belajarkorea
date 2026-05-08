const fs = require('fs');

// 1. Dashboard: Keep .neq('computed_status', 'expired') so we can show Grace Period warning.
// 2. Others: Use .eq('computed_status', 'active') to strictly block grace period access!

const strictFiles = [
  'src/app/api/ai-buddy/route.ts',
  'src/app/(app)/courses/[slug]/lessons/[lessonId]/page.tsx',
  'src/app/(app)/pricing/page.tsx',
  'src/app/(app)/certificates/[courseSlug]/page.tsx',
  'src/app/(app)/ai-buddy/page.tsx'
];

for (const file of strictFiles) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\.neq\('computed_status', 'expired'\)/g, ".eq('computed_status', 'active')");
  fs.writeFileSync(file, content);
  console.log('Updated strict file ' + file);
}

// Update dashboard UI to make Grace Period look locked/suspended
let dash = fs.readFileSync('src/app/(app)/dashboard/page.tsx', 'utf8');

// Replace green background for grace period with orange/red
dash = dash.replace(
  /className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-2xl p-5 text-white shadow-lg shadow-green-500\/20"/,
  'className={`rounded-2xl p-5 text-white shadow-lg ${subscription.computed_status === \\\'active\\\' ? \\\'bg-gradient-to-r from-green-500 to-emerald-400 shadow-green-500/20\\\' : \\\'bg-gradient-to-r from-rose-500 to-red-500 shadow-red-500/20\\\'}`}'
);

// Replace Sisa Waktu text
dash = dash.replace(
  /<p className="text-sm text-green-50 mt-4 font-medium">Sisa Waktu Akses<\/p>/,
  '<p className="text-sm text-white/90 mt-4 font-medium">{subscription.computed_status === \\\'active\\\' ? \\\'Sisa Waktu Akses\\\' : \\\'Akses Ditangguhkan\\\'}</p>'
);

// Replace days count and date
dash = dash.replace(
  /<p className="text-4xl font-black mt-1 mb-2">\s*\{subscription\.days_remaining\} <span className="text-lg font-bold opacity-80">Hari<\/span>\s*<\/p>\s*<p className="text-xs text-green-100 font-medium opacity-90">\s*Berlaku s\/d \{new Date\(subscription\.expires_at\)\.toLocaleDateString\('id-ID', \{ day: 'numeric', month: 'long', year: 'numeric' \}\)\}\s*<\/p>/m,
  `{subscription.computed_status === 'active' ? (
                      <>
                        <p className="text-4xl font-black mt-1 mb-2">
                          {subscription.days_remaining} <span className="text-lg font-bold opacity-80">Hari</span>
                        </p>
                        <p className="text-xs text-white/90 font-medium opacity-90">
                          Berlaku s/d {new Date(subscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl sm:text-3xl font-black mt-1 mb-2">
                          KADALUARSA
                        </p>
                        <p className="text-xs text-white/90 font-medium opacity-90">
                          Harap perpanjang paket untuk lanjut belajar.
                        </p>
                      </>
                    )}`
);

fs.writeFileSync('src/app/(app)/dashboard/page.tsx', dash);
console.log('Updated dashboard');
