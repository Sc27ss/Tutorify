import { useEffect } from "react";

declare global {
  interface Window {
    voiceflow?: {
      chat: {
        load: (config: {
          verify: { projectID: string };
          url: string;
          voice?: { url: string };
        }) => void;
      };
    };
  }
}

const SCRIPT_ID = "vf-widget-script";

export function Chatbot() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "text/javascript";
    script.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
    script.onload = () => {
      window.voiceflow?.chat.load({
        verify: { projectID: "6a95e4d6fc41b976e368099a" },
        url: "https://general-runtime.voiceflow.com",
        voice: { url: "https://runtime-api.voiceflow.com" },
      });
    };
    document.body.appendChild(script);
  }, []);

  return null;
}
