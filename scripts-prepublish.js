require('shelljs/global');

if (!env['SKIP_PREPUBLISH']) {
  exec('npm run build')
}
else {
  echo('Skipping prepublish step...');
}
