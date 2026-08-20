// start.js — 兼容不同 Node 版本的启动器
// Node < 24 需要 --experimental-sqlite 才能启用 node:sqlite（持久化）；
// Node >= 24 该模块已稳定，无需该 flag。
import { spawn } from 'node:child_process';
import process from 'node:process';

const major = Number(process.versions.node.split('.')[0]);
const flag = major < 24 ? ['--experimental-sqlite'] : [];

const child = spawn(process.execPath, [...flag, 'server.js'], {
  stdio: 'inherit',
  env: process.env
});
child.on('exit', (code) => process.exit(code ?? 0));
