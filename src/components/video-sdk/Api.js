import { Import } from "lucide-react";
import { onFailure } from "../../utils/notifications/OnFailure";
import { extractErrorMessage } from "../../utils/formmaters";

let authToken = import.meta.env.VITE_VIDEOSDK_TOKEN; //1 year
// Getter for the current auth token
export const getAuthToken = () => authToken;

// Setter to update the auth token dynamically
export const setAuthToken = (newToken) => {
  authToken = newToken;
};

// Create a meeting with the current token
export const createMeeting = async () => {
  try {
    const res = await fetch(import.meta.env.VITE_VIDEOSDK_URL, {
      method: "POST",
      headers: {
        Authorization: getAuthToken(), // your token with apikey and permissions
        "Content-Type": "application/json", // fix this header
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const errorData = await res?.json();
      onFailure({
        message: "Failed to generate meeting ID.",
        error:
          extractErrorMessage(errorData) ||
          "Failed to create meeting. Please try again later.",
      });
    }

    const { roomId } = await res?.json();
    return roomId;
  } catch (error) {
    onFailure({
      message: "An error occurred while creating the meeting.",
      error: extractErrorMessage(error),
    });
    console.error("Error in createMeeting:", error);
    throw error;
  }
};
