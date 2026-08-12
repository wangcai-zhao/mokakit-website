/**
 * .gitignore 模板精选数据集（纯静态、零依赖）
 *
 * 模板内容整理自社区广泛使用的 gitignore 规则（github/gitignore 风格），
 * 按五大类聚合：操作系统 / 编辑器·IDE / 编程语言 / 框架·平台 / 工具·其他。
 * 选择器会把这些片段按需拼接成一个完整 .gitignore。
 */

export type GitignoreGroup = 'os' | 'ide' | 'lang' | 'framework' | 'tool';

export interface GitignoreTemplate {
  id: string;
  label: string;
  group: GitignoreGroup;
  content: string;
}

export const GROUPS: { id: GitignoreGroup; name: string }[] = [
  { id: 'os', name: '操作系统' },
  { id: 'ide', name: '编辑器 / IDE' },
  { id: 'lang', name: '编程语言' },
  { id: 'framework', name: '框架 / 平台' },
  { id: 'tool', name: '工具 / 其他' },
];

export const TEMPLATES: GitignoreTemplate[] = [
  // ---------- 操作系统 ----------
  {
    id: 'macos',
    label: 'macOS',
    group: 'os',
    content: `# macOS
.DS_Store
.AppleDouble
.LSOverride
Icon
._*
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk`,
  },
  {
    id: 'windows',
    label: 'Windows',
    group: 'os',
    content: `# Windows
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db
*.stackdump
[Dd]esktop.ini
$RECYCLE.BIN/
*.cab
*.msi
*.msix
*.msm
*.msp
*.lnk`,
  },
  {
    id: 'linux',
    label: 'Linux',
    group: 'os',
    content: `# Linux
*~
.directory
.Trash-*
.nfs*`,
  },

  // ---------- 编辑器 / IDE ----------
  {
    id: 'vscode',
    label: 'VS Code',
    group: 'ide',
    content: `# VS Code
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
*.code-workspace`,
  },
  {
    id: 'intellij',
    label: 'IntelliJ / JetBrains',
    group: 'ide',
    content: `# IntelliJ IDEA / JetBrains
.idea/
*.iws
*.iml
*.ipr
out/`,
  },
  {
    id: 'vim',
    label: 'Vim',
    group: 'ide',
    content: `# Vim
[._]*.swo
*~
*.swp`,
  },
  {
    id: 'sublime',
    label: 'Sublime Text',
    group: 'ide',
    content: `# Sublime Text
*.sublime-workspace
*.sublime-project`,
  },
  {
    id: 'eclipse',
    label: 'Eclipse',
    group: 'ide',
    content: `# Eclipse
.metadata
bin/
tmp/
*.tmp
*.bak
*.swp
*~.nib`,
  },
  {
    id: 'xcode',
    label: 'Xcode',
    group: 'ide',
    content: `# Xcode
xcuserdata/
*.xcworkspace
*.xcodeproj/project.xcworkspace
*.xcodeproj/xcuserdata
build/
DerivedData/
*.hmap
*.ipa
*.dSYM.zip
*.dSYM`,
  },
  {
    id: 'androidstudio',
    label: 'Android Studio',
    group: 'ide',
    content: `# Android Studio
*.iml
.gradle/
local.properties
.idea/
.DS_Store
captures/
.externalNativeBuild/
.cxx/`,
  },
  {
    id: 'emacs',
    label: 'Emacs',
    group: 'ide',
    content: `# Emacs
*~
\\#*\\#
/.emacs.desktop
/.emacs.desktop.lock
*.elc
auto-save-list
tramp
.\\#*`,
  },

  // ---------- 编程语言 ----------
  {
    id: 'node',
    label: 'Node.js',
    group: 'lang',
    content: `# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.pnpm-store/
.yarn/`,
  },
  {
    id: 'python',
    label: 'Python',
    group: 'lang',
    content: `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
.pytest_cache/
.mypy_cache/
.ruff_cache/
.venv/
env/
venv/
ENV/`,
  },
  {
    id: 'java',
    label: 'Java',
    group: 'lang',
    content: `# Java
*.class
*.log
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar
hs_err_pid*
.classpath
.project
.settings/
bin/`,
  },
  {
    id: 'go',
    label: 'Go',
    group: 'lang',
    content: `# Go
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
go.work`,
  },
  {
    id: 'rust',
    label: 'Rust',
    group: 'lang',
    content: `# Rust
/target/
**/*.rs.bk`,
  },
  {
    id: 'cpp',
    label: 'C++',
    group: 'lang',
    content: `# C++
*.o
*.obj
*.dll
*.exe
*.lib
*.out
*.a
*.so
build/
cmake-build-*/`,
  },
  {
    id: 'csharp',
    label: 'C#',
    group: 'lang',
    content: `# C#
bin/
obj/
*.user
*.suo
*.userosscache
*.sln.docstates`,
  },
  {
    id: 'php',
    label: 'PHP',
    group: 'lang',
    content: `# PHP
/vendor/
*.log`,
  },
  {
    id: 'ruby',
    label: 'Ruby',
    group: 'lang',
    content: `# Ruby
*.gem
*.rbc
/.bundle
/vendor/bundle
/lib/bundler/man/`,
  },
  {
    id: 'swift',
    label: 'Swift',
    group: 'lang',
    content: `# Swift (SwiftPM)
.build/
Packages/
.swiftpm/
xcuserdata/`,
  },
  {
    id: 'kotlin',
    label: 'Kotlin',
    group: 'lang',
    content: `# Kotlin
*.class
*.jar
.gradle/
build/`,
  },
  {
    id: 'dart',
    label: 'Dart',
    group: 'lang',
    content: `# Dart
.dart_tool/
.packages
.pub-cache/
.pub/
build/`,
  },
  {
    id: 'r',
    label: 'R',
    group: 'lang',
    content: `# R
.Rhistory
.RData
.RDataTmp
.Rproj.user/`,
  },
  {
    id: 'scala',
    label: 'Scala',
    group: 'lang',
    content: `# Scala
*.class
*.jar
.bloop/
.metals/
target/`,
  },
  {
    id: 'haskell',
    label: 'Haskell',
    group: 'lang',
    content: `# Haskell
*.hi
*.hi-boot
*.o
*.dyn_hi
.dist-build/
cabal-dev/`,
  },
  {
    id: 'elixir',
    label: 'Elixir',
    group: 'lang',
    content: `# Elixir
/_build/
/deps/
*.beam`,
  },
  {
    id: 'lua',
    label: 'Lua',
    group: 'lang',
    content: `# Lua
*.lua~
*.luac`,
  },

  // ---------- 框架 / 平台 ----------
  {
    id: 'django',
    label: 'Django',
    group: 'framework',
    content: `# Django
*.log
*.pot
*.pyc
__pycache__/
local_settings.py
db.sqlite3
media/
staticfiles/`,
  },
  {
    id: 'flask',
    label: 'Flask',
    group: 'framework',
    content: `# Flask
instance/
.webassets-cache
*.log`,
  },
  {
    id: 'laravel',
    label: 'Laravel',
    group: 'framework',
    content: `# Laravel
/vendor/
node_modules/
public/storage
storage/*.key
.env
Homestead.json
Homestead.yaml`,
  },
  {
    id: 'rails',
    label: 'Ruby on Rails',
    group: 'framework',
    content: `# Rails
/.bundle
/config/master.key
/log/*.log
/tmp/
/public/assets`,
  },
  {
    id: 'nextjs',
    label: 'Next.js',
    group: 'framework',
    content: `# Next.js
.next/
out/
next-env.d.ts`,
  },
  {
    id: 'nuxt',
    label: 'Nuxt',
    group: 'framework',
    content: `# Nuxt
.nuxt/
.output/
.data/`,
  },
  {
    id: 'angular',
    label: 'Angular',
    group: 'framework',
    content: `# Angular
/.angular/cache
/dist
/tmp
/out-tsc`,
  },
  {
    id: 'svelte',
    label: 'Svelte / SvelteKit',
    group: 'framework',
    content: `# Svelte / SvelteKit
.svelte-kit/`,
  },
  {
    id: 'vue',
    label: 'Vue',
    group: 'framework',
    content: `# Vue
/dist
/node_modules`,
  },
  {
    id: 'flutter',
    label: 'Flutter',
    group: 'framework',
    content: `# Flutter
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
build/`,
  },
  {
    id: 'unity',
    label: 'Unity',
    group: 'framework',
    content: `# Unity
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]serSettings/`,
  },
  {
    id: 'android',
    label: 'Android',
    group: 'framework',
    content: `# Android
*.apk
*.aab
.gradle/
local.properties
.externalNativeBuild/
.cxx/`,
  },
  {
    id: 'dotnet',
    label: '.NET',
    group: 'framework',
    content: `# .NET
bin/
obj/
*.user
.vs/`,
  },
  {
    id: 'wordpress',
    label: 'WordPress',
    group: 'framework',
    content: `# WordPress
/wp-config.php
/wp-content/uploads/
/wp-content/cache/
/wp-content/upgrade/`,
  },
  {
    id: 'terraform',
    label: 'Terraform',
    group: 'framework',
    content: `# Terraform
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl`,
  },

  // ---------- 工具 / 其他 ----------
  {
    id: 'latex',
    label: 'LaTeX',
    group: 'tool',
    content: `# LaTeX
*.aux
*.lof
*.log
*.lol
*.toc
*.out
*.bbl
*.blg
*.fdb_latexmk
*.fls`,
  },
  {
    id: 'jupyter',
    label: 'Jupyter Notebook',
    group: 'tool',
    content: `# Jupyter Notebook
.ipynb_checkpoints`,
  },
  {
    id: 'cmake',
    label: 'CMake',
    group: 'tool',
    content: `# CMake
CMakeCache.txt
CMakeFiles/`,
  },
  {
    id: 'godot',
    label: 'Godot',
    group: 'tool',
    content: `# Godot
/.import
export.cfg`,
  },
  {
    id: 'unreal',
    label: 'Unreal Engine',
    group: 'tool',
    content: `# Unreal Engine
Binaries/
DerivedDataCache/
Intermediate/
Saved/`,
  },
  {
    id: 'vite',
    label: 'Vite',
    group: 'tool',
    content: `# Vite
dist/
.vite/`,
  },
  {
    id: 'maven',
    label: 'Maven / Gradle',
    group: 'tool',
    content: `# Maven / Gradle
target/`,
  },
];

/** 常用预设：典型前端/Node 项目的推荐组合 */
export const PRESET_COMMON = ['macos', 'windows', 'linux', 'vscode', 'node', 'nextjs', 'vite'];
