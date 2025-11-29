import React, { useState, useContext, useEffect } from "react";
import { MeetingContext } from "../../context/MeetingContext";
import CallComponentContent from "./call/CallComponentContent";
import ConferenceRoom from "../../pages/ConferenceRoom";

type Props = {
  initialMeetingId?: string;
  setInitialMeetingId?: (id: string | null) => void;
  mode?: "CALL" | "CONFERENCE";
};

const CallComponent = ({ initialMeetingId, setInitialMeetingId }: Props) => {
  const [meetingId, setMeetingId] = useState(initialMeetingId || null);
  const { providerMeetingId, setProviderMeetingId } =
    useContext(MeetingContext);

  useEffect(() => {
    if (meetingId && !providerMeetingId && initialMeetingId) {
      setProviderMeetingId(meetingId);
    }
  }, [meetingId]);

  // Keep parent in sync
  useEffect(() => {
    if (!meetingId && setInitialMeetingId) {
      setInitialMeetingId(null);
    }
  }, [meetingId]);
  
  return (
    <CallComponentContent meetingId={meetingId} setMeetingId={(id) => {
        setMeetingId(id);
        if (setInitialMeetingId) setInitialMeetingId(id);
      }} />
  );
};
export default CallComponent;
