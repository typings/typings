require('shelljs/global')

mkdir('-p', 'typings')

touch('typings/main.d.ts')

echo('SKIP_PREPUBLISH=true')
env['SKIP_PREPUBLISH'] = true

exec('npm install')
exec('rimraf dist')

if (!which('tsc')) {
  echo('Sorry, this script requires tsc');
  exit(1)
}

if (exec('tsc', {silent:true}).code !== 0) {
  echo('tsc completed intial build as expected')
}
else {
  echo('tsc completed without errors... that is unexpected and may merit investigation...')
  exit(1)
}
