import { useContext } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { AxiosInstance } from "axios";
import { queryClient } from "../services/query-client";
import { onFailure } from "../utils/notifications/OnFailure";
import { extractErrorMessage } from "../utils/formmaters";
import { ChatContext } from "../context/ChatContext";

export const useSendMessageMutation = (
  client: AxiosInstance,
  clearMessageInput: () => void = () => {}
): UseMutationResult<any, unknown, FormData, unknown> => {
  const { setCallMessage } = useContext(ChatContext);

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await client.post("/user/chat/messages/send", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },

    onSuccess: async (response, variables) => {
      const messageData = {
        ...response?.data?.data,
        mss_type: response?.data?.data?.mss_type,
        is_my_chat: "yes",
        ...(response?.data?.data?.mss_type === "call" && {
          call_state: "ringing", // only add if it's a call
        }),
      };

      // If already fetched, append new message to existing messages
      queryClient.setQueryData(
        [
          `${
            variables.get("current_chat_user_type") === "group"
              ? "groupMessages"
              : "chatMessages"
          }`,
          variables.get("current_chat_user"),
        ],
        (old: any) => {
          if (!old || !Array.isArray(old.pages)) {
            // First message: create initial page structure
            return {
              pages: [{ data: [messageData] }],
              pageParams: [undefined],
            };
          }

          const lastPageIndex = old.pages.length - 1;
          const lastPage = old.pages[lastPageIndex];

          // Avoid duplicates
          const exists = lastPage.data.find(
            (msg: any) => msg.id === messageData.id
          );
          if (exists) return old;

          const newPages = [...old.pages];
          newPages[lastPageIndex] = {
            ...lastPage,
            data: [...lastPage.data, messageData],
          };

          return { ...old, pages: newPages };
        }
      );

      // If it's a call message, store the message in context
      if (variables?.get("mss_type") === "call") {
        setCallMessage({
          ...messageData,
          id: messageData?.id,
          msg_id: messageData?.id,
          status: "ringing",
        });
      }
      // Clear input field if provided
      clearMessageInput();
    },

    onError: (error) => {
      console.error("❌ Message send error:", error);
      throw Error(extractErrorMessage(error));
    },
  });
};

export const useTypingStatus = (client: AxiosInstance) => {
  return useMutation({
    mutationFn: ({ current_chat_user, typing }: any) =>
      client.post("/user/messages/typing", {
        current_chat_user,
        typing,
      }),
  });
};
