import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store';
import { useGuard } from '../../hooks';
import { getCurrentTab } from '../../api';
import {
  listGrantedOrigins,
  prettyOrigin,
  removeOrigin,
  requestOrigin
} from '../../lib/permissions';
import { originPatternFromUrl } from '../../lib/format';

// Why each baseline permission exists. Shown verbatim so security reviewers can
// audit the extension's footprint without reading the manifest.
const BASELINE: Array<{ name: string; why: string }> = [
  { name: 'storage', why: '把任务、设置、日志保存在浏览器本地，不上传云端。' },
  { name: 'sidePanel', why: '在侧边栏显示 WebLoop 操作界面。' },
  { name: 'scripting / activeTab', why: '仅在你授权的站点注入录制与回放脚本。' },
  { name: 'tabs / windows', why: '按计划打开任务起始页并跟随同站点新标签页。' },
  { name: 'downloads', why: '检测导出文件何时下载完成，并保存截图。' },
  { name: 'notifications', why: '任务成功、失败或需要人工时提醒你。' },
  { name: 'alarms', why: '按“每天 / 工作日 / 周期”触发定时任务。' },
  { name: 'webNavigation', why: '判断页面是否加载完成，避免在加载中误操作。' }
];

export function PermissionsView() {
  const { showToast } = useStore();
  const guard = useGuard();
  const [origins, setOrigins] = useState<string[]>([]);
  const [currentOrigin, setCurrentOrigin] = useState<string | null>(null);
  const [currentGranted, setCurrentGranted] = useState(false);

  const load = useCallback(async () => {
    const list = await listGrantedOrigins();
    setOrigins(list);
    const tab = await getCurrentTab();
    if (tab?.url && /^https?:/.test(tab.url)) {
      const origin = originPatternFromUrl(tab.url);
      setCurrentOrigin(origin);
      setCurrentGranted(list.includes(origin));
    } else {
      setCurrentOrigin(null);
      setCurrentGranted(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grantCurrent = guard(async () => {
    if (!currentOrigin) throw new Error('请先打开一个 http/https 网页');
    const ok = await requestOrigin(currentOrigin);
    showToast(ok ? '已授权当前站点' : '未授权');
    await load();
  });

  const revoke = (origin: string) =>
    guard(async () => {
      const ok = await removeOrigin(origin);
      showToast(ok ? '已撤销该站点授权' : '撤销失败');
      await load();
    });

  return (
    <section className="view active">
      <div className="card">
        <div className="section-head">
          <div>
            <h2>站点授权</h2>
            <p>WebLoop 只在你逐个授权的站点上运行，权限可随时撤销。</p>
          </div>
        </div>
        <div className="notice ok">
          本地优先：任务、日志、设置都存在浏览器本地。WebLoop 不申请“读取所有网站数据”，
          只有在你录制或运行某个站点时才会请求该站点的访问权限。
        </div>
        {currentOrigin && (
          <div className="perm-current">
            <div>
              <div className="perm-origin">{prettyOrigin(currentOrigin)}</div>
              <div className="perm-sub">{currentGranted ? '当前页面已授权' : '当前页面尚未授权'}</div>
            </div>
            {currentGranted ? (
              <button className="ghost" onClick={revoke(currentOrigin)}>
                撤销
              </button>
            ) : (
              <button className="primary" onClick={grantCurrent}>
                授权当前站点
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2>已授权的站点</h2>
            <p>{origins.length} 个站点</p>
          </div>
        </div>
        {origins.length ? (
          <div className="perm-list">
            {origins.map((o) => (
              <div className="perm-row" key={o}>
                <span className="perm-origin">{prettyOrigin(o)}</span>
                <button className="ghost" onClick={revoke(o)}>
                  撤销
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="notice">还没有授权任何站点。打开目标网页并开始录制即可授权。</div>
        )}
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2>基础权限说明</h2>
            <p>这些是扩展运行所需的固定权限，不涉及具体站点数据。</p>
          </div>
        </div>
        <div className="perm-list">
          {BASELINE.map((p) => (
            <div className="perm-explain" key={p.name}>
              <code>{p.name}</code>
              <span>{p.why}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
