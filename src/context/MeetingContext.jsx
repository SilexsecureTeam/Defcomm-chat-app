import React, { createContext, useState, useEffect, useContext } from "react";
import { MeetingProvider as SDKMeetingProvider } from "@videosdk.live/react-sdk";
import { AuthContext } from "./AuthContext";
import { getAuthToken } from "../components/video-sdk/Api";
import { useRef } from "react";

export const MeetingContext = createContext();

export const MeetingProvider = ({ children }) => {
  const { authDetails } = useContext(AuthContext);
  const [isCreator, setIsCreator] = useState(null);
  const [conference, setConference] = useState(null);
  const [me, setMe] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [providerMeetingId, setProviderMeetingId] = useState(null);
  const [showConference, setShowConference] = useState(false);
  const [token, setToken] = useState(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [isCall, setIsCall] = useState(false);
  const tokenFetchedRef = useRef(false);

  // Automatically refetch token whenever user or conference changes
  useEffect(() => {
    if (!providerMeetingId) return;

    const fetchToken = async () => {
      // if (isCall && tokenFetchedRef.current) {
      //   setIsTokenLoading(false);
      //   return;
      // }

      try {
        setIsTokenLoading(true);
        const role = !isCall ? (isCreator ? "host" : "guest") : "host";

        const response = await getAuthToken(authDetails.user.id, role);
        setToken(response?.token || response);

        tokenFetchedRef.current = true;
      } catch (error) {
        setTokenError(error.message);
        setToken(null);
      } finally {
        setIsTokenLoading(false);
      }
    };

    fetchToken();
  }, [providerMeetingId, isCreator]);

  return (
    <MeetingContext.Provider
      value={{
        conference,
        setConference,
        me,
        setMe,
        isScreenSharing,
        setIsScreenSharing,
        providerMeetingId,
        setProviderMeetingId,
        showConference,
        setShowConference,
        token,
        isCreator,
        setIsCreator,
        isTokenLoading,
        tokenError,
        isCall,
        setIsCall,
      }}
    >
      <SDKMeetingProvider
        key={`${token}-${providerMeetingId || "test"}`}
        config={{
          meetingId: providerMeetingId,
          name: authDetails?.user?.name || "Guest User",
          participantId: authDetails?.user?.id || `guest-${Date.now()}`,
          micEnabled: false,
          webcamEnabled: false,
          mode: "SEND_AND_RECV",
          chatEnabled: true,
          raiseHandEnabled: true,
          debugMode: true,
        }}
        token={token || "default"}
      >
        {children}
      </SDKMeetingProvider>
    </MeetingContext.Provider>
  );
};
