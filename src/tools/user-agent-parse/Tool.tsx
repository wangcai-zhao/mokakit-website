import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

function detect(uas: string) {
  const ua = uas;
  let browser = '未知';
  let browserVer = '';
  let os = '未知';
  let device = '桌面';

  if (/Edg\//.test(ua)) {
    browser = 'Edge';
    browserVer = (ua.match(/Edg\/([\d.]+)/) || [])[1] || '';
  } else if (/OPR\/|Opera/.test(ua)) {
    browser = 'Opera';
    browserVer = (ua.match(/(?:OPR|Opera)\/([\d.]+)/) || [])[1] || '';
  } else if (/Chrome\//.test(ua)) {
    browser = 'Chrome';
    browserVer = (ua.match(/Chrome\/([\d.]+)/) || [])[1] || '';
  } else if (/Firefox\//.test(ua)) {
    browser = 'Firefox';
    browserVer = (ua.match(/Firefox\/([\d.]+)/) || [])[1] || '';
  } else if (/Version\/.*Safari/.test(ua) || /Safari\//.test(ua)) {
    browser = 'Safari';
    browserVer = (ua.match(/Version\/([\d.]+)/) || [])[1] || '';
  }

  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS/macOS (Apple)';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Linux/.test(ua)) os = 'Linux';

  if (/Mobile/.test(ua)) device = '手机';
  else if (/Tablet|iPad/.test(ua)) device = '平板';
  else if (/TV|SmartTV/.test(ua)) device = '电视';

  return { browser, browserVer, os, device };
}

export default function UserAgentParseTool() {
  const [input, setInput] = useState(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  );

  const result = useMemo(() => {
    if (input.trim() === '') return '';
    const d = detect(input);
    return [
      `浏览器：   ${d.browser}${d.browserVer ? ' ' + d.browserVer : ''}`,
      `操作系统： ${d.os}`,
      `设备类型： ${d.device}`,
    ].join('\n');
  }, [input]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={result}
      placeholder="粘贴 User-Agent 字符串…"
      note="按常见 UA 特征识别浏览器/系统/设备。本地解析，不上传。"
    />
  );
}
