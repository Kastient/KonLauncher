import React, { useState } from 'react';
import JavaLauncherApp from './JavaLauncherApp';
import BedrockLauncherApp from './BedrockLauncherApp';

const CLIENT_MODES = {
  JAVA: 'java',
  BEDROCK: 'bedrock'
};

export default function App() {
  const [activeClient, setActiveClient] = useState(CLIENT_MODES.JAVA);
  const clientSwitch = (
    <div className="inline-flex items-center gap-5">
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
