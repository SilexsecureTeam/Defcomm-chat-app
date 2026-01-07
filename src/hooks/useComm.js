import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { axiosClient } from "../services/axios-client";
import { AuthContext } from "../context/AuthContext";
import { onSuccess } from "../utils/notifications/OnSuccess";
import { onFailure } from "../utils/notifications/OnFailure";
import { extractErrorMessage } from "../utils/formmaters";
import { CommContext } from "../context/CommContext";

const useComm = () => {
  const { authDetails } = useContext(AuthContext);

  const token = authDetails?.access_token;
  const client = axiosClient(token);
  const queryClient = useQueryClient();

  // Fetch Walkie-Talkie Channels
  const getChannelList = () =>
    useQuery({
      queryKey: ["channelList"],
      queryFn: async () => {
        const { data } = await client.get("/walkietalkie/channecreatellist");
        return data?.data || [];
      },
      enabled: !!authDetails?.user_enid,
      staleTime: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: "offlineFirst",
    });

  const getInvitedChannelList = () =>
    useQuery({
      queryKey: ["channelList Active"],
      queryFn: async () => {
        const { data } = await client.get(
          "/walkietalkie/channellistinvited/active"
        );
        return data?.data || [];
      },
      enabled: !!authDetails?.user_enid,
      staleTime: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: "offlineFirst",
    });

  const getInvitedChannelPending = () =>
    useQuery({
      queryKey: ["channelList Invited Pending"],
      queryFn: async () => {
        const { data } = await client.get(
          "/walkietalkie/channellistinvited/pending"
        );
        return data?.data || [];
      },
      enabled: !!authDetails?.user_enid,
      staleTime: 0,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: "offlineFirst",
    });

  // ➕ Create New Comm Channel
  const createChannelMutation = useMutation({
    mutationFn: (payload) =>
      client.post("/walkietalkie/channelcreate", payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["channelList Active"]);
      onSuccess({
        message: "Comm channel successfully created!",
        success: "New channel added",
      });
    },
    onError: (err) => {
      onFailure({
        message: "Failed to create comm channel",
        error: extractErrorMessage(err),
      });
    },
  });

  const addUserToChannel = useMutation({
    mutationFn: (payload) =>
      client.post("/walkietalkie/channelinvite", payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["channelList Active"]);
    },
    onError: (err) => {
      onFailure({
        message: "Failed to add user to channel",
        error: extractErrorMessage(err),
      });
    },
  });
  const updateChannelInviteStatus = useMutation({
    mutationFn: (payload) =>
      client.post("/walkietalkie/channelinvitedstatus", payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["channelList Active"]);
      queryClient.invalidateQueries(["channelList Invited Pending"]);
      onSuccess({
        message: "Channel invitation status updated!",
        success: "Updated successfully",
      });
    },
    onError: (err) => {
      onFailure({
        message: "Failed to update channel invitation status",
        error: extractErrorMessage(err),
      });
    },
  });

  const deleteChannel = useMutation({
    mutationFn: (channelId) =>
      client.get(`/walkietalkie/channedelete/${channelId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["channelList Active"]);
      onSuccess({
        message: "Channel deleted successfully!",
        success: "Deleted",
      });
    },
    onError: (err) => {
      onFailure({
        message: "Failed to delete channel",
        error: extractErrorMessage(err),
      });
    },
  });

  const broadcastMessage = useMutation({
    mutationFn: (payload) =>
      client.post("/walkietalkie/channelbroadcast", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onError: (err) => {
      onFailure({
        message: "Failed to broadcast message",
        error: extractErrorMessage(err),
      });
    },
  });

  const subscriberJoin = useMutation({
    mutationFn: (payload) =>
      client.post("/walkietalkie/subscriberJoin", payload),
    onSuccess: () => {
      onSuccess({
        message: "Channel Connected",
        success: `You are now subscribed to the channel.`,
      });
      queryClient.invalidateQueries(["subscriberActive"]);
    },
    onError: (err) => {
      onFailure({
        message: "Unable to connect to the channel",
        error: extractErrorMessage(err),
      });
    },
  });

  const subscriberLeave = useMutation({
    mutationFn: (payload) =>
      client.post("/walkietalkie/subscriberLeave", payload),
    onError: (err) => {
      onFailure({
        message: "Unable to disconnect from the channel",
        error: extractErrorMessage(err),
      });
    },
  });

  const getSubscriberActive = (channelId) =>
    useQuery({
      queryKey: ["subscriberActive", channelId],
      queryFn: async () => {
        const { data } = await client.get(
          `/walkietalkie/subscriberActive/${channelId}`
        );
        return data?.data || [];
      },
      enabled: !!channelId,
    });

  return {
    getChannelList,
    createChannelMutation,
    addUserToChannel,
    getInvitedChannelList,
    getInvitedChannelPending,
    updateChannelInviteStatus,
    broadcastMessage,
    deleteChannel,
    subscriberJoin,
    subscriberLeave,
    getSubscriberActive,
  };
};

export default useComm;
