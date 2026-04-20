import React, { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import JavaLauncherApp from './JavaLauncherApp';
import BedrockLauncherApp from './BedrockLauncherApp';

const CLIENT_MODES = {
  JAVA: 'java',
  BEDROCK: 'bedrock'
};

const toCounter = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
};

const normalizeStatsPayload = (payload) => ({
  online: toCounter(payload?.online),
  users: toCounter(payload?.users),
  downloads: toCounter(payload?.downloads),
  updatedAt: payload?.updatedAt || null
});

const formatCompactCount = (value) => {
  try {
    return new Intl.NumberFormat('ru-RU').format(toCounter(value));
  } catch {
    return String(toCounter(value));
  }
};

export default function App() {
  const [activeClient, setActiveClient] = useState(CLIENT_MODES.JAVA);
  const [launcherStats, setLauncherStats] = useState(() =>
    normalizeStatsPayload({ online: 0, users: 0, downloads: 0, updatedAt: null })
  );

  useEffect(() => {
    const statsApi = window.launcherStats;
    if (!statsApi) return undefined;

    let mounted = true;
    const applyPayload = (payload) => {
      if (!mounted) return;
      setLauncherStats(normalizeStatsPayload(payload));
    };

    const loadInitial = async () => {
      try {
        const result = await statsApi.get?.();
        if (result?.ok && result?.data) {
          applyPayload(result.data);
        }
      } catch {
        // noop
      }

      try {
        const refreshed = await statsApi.refresh?.();
        if (refreshed?.ok && refreshed?.data) {
          applyPayload(refreshed.data);
        }
      } catch {
        // noop
      }
    };

    const unsubscribe = statsApi.onUpdate?.((payload) => applyPayload(payload));
    void loadInitial();

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const usageCountLabel = useMemo(
    () => formatCompactCount(Math.max(launcherStats.users, launcherStats.downloads)),
    [launcherStats.downloads, launcherStats.users]
  );
  const onlineCountLabel = useMemo(() => formatCompactCount(launcherStats.online), [launcherStats.online]);

  const clientSwitch = (
    <div className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-[#0c1320]/85 px-4 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-zinc-300">
        <Download size={11} className="text-zinc-400" />
        <span>{usageCountLabel}</span>
      </div>
      <button
        type="button"
        onClick={() => setActiveClient(CLIENT_MODES.JAVA)}
        className={`text-[12px] font-black uppercase tracking-[0.18em] transition-colors ${
          activeClient === CLIENT_MODES.JAVA
            ? 'text-white'
            : 'text-zinc-500 hover:text-zinc-200'
        }`}
      >
        Java
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveClient(CLIENT_MODES.BEDROCK)}
          className={`text-[12px] font-black uppercase tracking-[0.18em] transition-colors ${
            activeClient === CLIENT_MODES.BEDROCK
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-200'
          }`}
        >
          Bedrock
        </button>
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.85)] animate-pulse" />
          <span>online {onlineCountLabel}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative h-full w-full">
      {activeClient === CLIENT_MODES.JAVA ? (
        <JavaLauncherApp headerCenterSlot={clientSwitch} />
      ) : (
        <BedrockLauncherApp headerCenterSlot={clientSwitch} />
      )}
    </div>
  );
}
