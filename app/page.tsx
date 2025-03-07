"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  LiveKitRoom,
  useVoiceAssistant,
  RoomAudioRenderer,
  AgentState,
} from "@livekit/components-react";
import { useCallback, useEffect, useState } from "react";

type LocalAgentState = AgentState | "disconnected" | "connecting" | "connected";
import { MediaDeviceFailure } from "livekit-client";
import type { ConnectionDetails } from "./api/connection-details/route";
import { Mic } from "lucide-react";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";

export default function Page() {
  const [connectionDetails, updateConnectionDetails] = useState<ConnectionDetails | undefined>(undefined);
  const [agentState, setAgentState] = useState<LocalAgentState>("disconnected");

  const toggleConnection = useCallback(async () => {
    if (connectionDetails) {
      updateConnectionDetails(undefined);
    } else {
      const url = new URL(
        process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
        window.location.origin
      );
      const response = await fetch(url.toString());
      const connectionDetailsData = await response.json();
      updateConnectionDetails(connectionDetailsData);
    }
  }, [connectionDetails]);

  return (
    <main className="h-full flex items-center justify-center bg-[var(--lk-bg)]">
      <LiveKitRoom
        token={connectionDetails?.participantToken}
        serverUrl={connectionDetails?.serverUrl}
        connect={connectionDetails !== undefined}
        audio={true}
        video={false}
        onMediaDeviceFailure={onDeviceFailure}
        onDisconnected={() => updateConnectionDetails(undefined)}
      >
        <MicrophoneButton 
          onClick={toggleConnection} 
          state={agentState}
        />
        <SimpleVoiceAssistant onStateChange={setAgentState} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}

function SimpleVoiceAssistant({ onStateChange }: { onStateChange: (state: LocalAgentState) => void }) {
  const { state } = useVoiceAssistant();
  const krisp = useKrispNoiseFilter();
  
  useEffect(() => {
    onStateChange(state);
    krisp.setNoiseFilterEnabled(true);
  }, [krisp, onStateChange, state]);

  return null;
}

function MicrophoneButton({ onClick, state }: { onClick: () => void, state: LocalAgentState }) {
  return (
    <motion.button
      onClick={onClick}
      className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: state === "connecting" ? [1, 1.1, 1] : 1,
        transition: {
          repeat: state === "connecting" ? Infinity : 0,
          duration: 1
        }
      }}
    >
      <Mic size={24} className={state === "connected" ? "animate-pulse" : ""} />
    </motion.button>
  );
}

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
