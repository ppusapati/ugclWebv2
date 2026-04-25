$files = Get-ChildItem .\src -Recurse -File -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch '\\src\\archive\\' }
$replacements = @(
  @("nav('/admin/", "nav('/"),
  @('nav("/admin/', 'nav("/'),
  @('nav(`/admin/', 'nav(`/'),
  @("nav('/admin')", "nav('/')"),
  @('nav("/admin")', 'nav("/")'),
  @('nav(`/admin`)', 'nav(`/`)'),

  @("redirect(302, '/admin/", "redirect(302, '/"),
  @('redirect(302, "/admin/', 'redirect(302, "/'),
  @('redirect(302, `/admin/', 'redirect(302, `/'),
  @("redirect(302, '/admin')", "redirect(302, '/')"),
  @('redirect(302, "/admin")', 'redirect(302, "/")'),
  @('redirect(302, `/admin`)', 'redirect(302, `/`)'),

  @('href="/admin/', 'href="/'),
  @("href='/admin/", "href='/"),
  @('href={`/admin/', 'href={/'),
  @('href="/admin"', 'href="/"'),
  @("href='/admin'", "href='/'"),

  @("path: '/admin/", "path: '/"),
  @('path: "/admin/', 'path: "/'),
  @('path: `/admin/', 'path: `/'),
  @("path: '/admin'", "path: '/'"),
  @('path: "/admin"', 'path: "/"'),

  @("parent: '/admin/", "parent: '/"),
  @('parent: "/admin/', 'parent: "/'),
  @('parent: `/admin/', 'parent: `/'),
  @("parent: '/admin'", "parent: '/'"),
  @('parent: "/admin"', 'parent: "/"')
)

foreach($f in $files){
  $content = Get-Content $f.FullName -Raw
  $updated = $content
  foreach($r in $replacements){
    $updated = $updated.Replace($r[0], $r[1])
  }
  if($updated -ne $content){
    Set-Content -Path $f.FullName -Value $updated -NoNewline
  }
}
Write-Output 'ROUTE_REDIRECT_REWRITE_DONE'
