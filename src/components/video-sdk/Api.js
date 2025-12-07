import { onFailure } from "../../utils/notifications/OnFailure";
import { extractErrorMessage } from "../../utils/formmaters";
import axios from "axios";

export const getAuthToken = async (participantId, role = "guest") => {
  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_DEFCOMM_MEETING_SERVER}api/get-token`,
      { participantId, role }
    );
    return data?.token;
  } catch (error) {
    onFailure({
      message: "Failed to fetch VideoSDK token.",
      error: extractErrorMessage(error),
    });
  }
};

// Setter to update the auth token dynamically
export const setAuthToken = (newToken) => {
  authToken = newToken;
};

export const createMeeting = async () => {
  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_DEFCOMM_MEETING_SERVER}api/create-meeting`
    );
    return data?.meetingId;
  } catch (error) {
    onFailure({
      message: "Failed to fetch VideoSDK token.",
      error: extractErrorMessage(error),
    });
    throw error;
  }
};
