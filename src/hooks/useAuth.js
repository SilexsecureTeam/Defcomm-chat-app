import { useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { axiosClient } from "../services/axios-client";
import { AuthContext } from "../context/AuthContext";
import { onFailure } from "../utils/notifications/OnFailure";
import { onSuccess } from "../utils/notifications/OnSuccess";
import { queryClient } from "../services/query-client";
import { extractErrorMessage } from "../utils/formmaters";

const useAuth = () => {
  const navigate = useNavigate();
  const { authDetails, updateAuth } = useContext(AuthContext);
  const client = axiosClient(authDetails?.access_token);

  // 🔄 Query: Get Profile Data
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await client.get("/user/profile");
      updateAuth({ ...authDetails, user: data?.data }); // You might want to update with new profile data too
      return data;
    },
    enabled: !!authDetails?.access_token, // only run if user is logged in
    onError: (err) => {
      onFailure({
        message: "Failed to fetch profile",
        error: extractErrorMessage(err),
      });
    },
  });

  // 🔐 Login Mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const { data } = await client.post("/login", credentials);
      if (!data?.data?.user) {
        throw new Error("Invalid response: User data not found");
      }
      return data.data;
    },
    onSuccess: (userData) => {
      updateAuth(userData);
      onSuccess({
        message: "Login Successful!",
        success: "Continuing to dashboard",
      });
      navigate("/dashboard/home");
    },
    onError: (error) => {
      onFailure({ message: "Login Failed", error: extractErrorMessage(error) });
    },
  });

  // 📤 Profile Upload Mutation
  const profileMutation = useMutation({
    mutationFn: async (userData) => {
      const { data } = await client.post("/user/profile/upload", userData, {
        headers: {
          "Content-Type": "multipart/form-data", // This header ensures the form data is processed correctly
        },
      });
      return data;
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries(["profile"]); // Refresh profile
      onSuccess({
        message: "Profile Update",
        success: "Profile updated successfully!",
      });
    },
    onError: (err) => {
      console.log("Profile Update error:", err);
      onFailure({
        message: "Profile Update Failed",
        error: extractErrorMessage(err),
      });
    },
  });

  // 🔢 OTP Request
  const requestOtpMutation = useMutation({
    mutationFn: async (credential) => {
      const { data } = await client.post("/requestOtpSms", {
        phone: credential?.phone,
      });
      if (data?.status !== 200) throw new Error("An error occurred");
      return data;
    },
    onSuccess: (data) => {
      onSuccess({
        message: "OTP Requested!",
        success: `Here is the otp- ${data?.otp}`,
      });
    },
    onError: (err) => {
      onFailure({
        message: "OTP Request Failed",
        error: extractErrorMessage(err),
      });
    },
  });

  // ✅ OTP Verify
  const verifyOtpMutation = useMutation({
    mutationFn: async (otpData) => {
      const { data } = await client.post("/loginWithPhone", otpData);
      if (data?.status !== 200)
        throw new Error("Invalid response: User data not found");
      return data.data;
    },
    onSuccess: (userData, variables) => {
      if (userData?.user?.status === "block") {
        onFailure({
          message: "Access Denied",
          error: "Your account has been blocked. Please contact support.",
        });
        return;
      }

      updateAuth(userData);
      navigate(variables?.from || "/dashboard/home", { replace: true });
      onSuccess({
        message: "OTP Verified!",
        success: "Continuing to dashboard",
      });
    },
    onError: (err) => {
      onFailure({
        message: "OTP Verification Failed",
        error: extractErrorMessage(err),
      });
    },
  });

  // 🚪 Logout
  const logoutMutation = useMutation({
    mutationFn: async (mode) => {
      const payload = mode === "all" ? {} : { device: authDetails?.device_id };
      await client.post("/auth/logout", payload);
    },
    onSuccess: (_, variables) => {
      // Clear auth state
      updateAuth(null);

      // Selectively clear cache (safer than full clear)
      queryClient.removeQueries();

      // Redirect
      navigate("/login", {
        state: { from: null, fromLogout: true },
        replace: true,
      });

      onSuccess({
        message: "Logout successful",
        success: "You have been logged out.",
      });
    },
    onError: (err) => {
      onFailure({
        message: "Logout Failed",
        error: extractErrorMessage(err),
      });
    },
  });

  const verifyUser = useMutation({
    mutationFn: async (otpData) => {
      const { data } = await client.post(`/userVerify`, otpData);
      return data.data;
    },
    onSuccess: () => {
      updateAuth(null);

      onSuccess({
        message: "Verification successful",
        success: "You can now log in.",
      });
    },
    onError: (err) => {
      onFailure({
        message: "Verification Failed!",
        error: extractErrorMessage(err),
      });
    },
  });

  const approveUser = useMutation({
    mutationFn: async (code) => {
      if (!code) throw new Error("Invalid QR code");
      const { data } = await client.post(`/qr/${code}/approve`, {
        confirm: true,
      });
      return data;
    },
    onSuccess: () => {
      onSuccess({
        message: "User approved successfully!",
        success: "The user can now access their account.",
      });
    },
    onError: (err) => {
      onFailure({
        message: "User approval failed",
        error: extractErrorMessage(err),
      });
    },
  });

  // 1️⃣ Generate QR Session
  const qrCreateQuery = useQuery({
    queryKey: ["qr-create"],
    queryFn: async () => {
      const { data } = await client.post("/qr/create");
      return data; // should contain sessionId or token
    },
    enabled: false, // run manually
    onError: (err) => {
      onFailure({
        message: "Failed to generate QR",
        error: extractErrorMessage(err),
      });
    },
  });

  // ⏳ QR Status Polling
  const logQrUser = useMutation({
    mutationFn: async (sessionId) => {
      if (!sessionId) return;
      const data = await client.post(`/qr/${sessionId}/exchange`, {
        confirm: true,
      });
      return data?.data;
    },
    onSuccess: (userData) => {
      console.log(userData);
      if (userData) {
        updateAuth(userData?.data);
        navigate("/dashboard/home", { replace: true });
        onSuccess({
          message: "QR Login Successful",
          success: "Welcome back!",
        });
      }
    },
  });

  const useQrStatus = (sessionId) => {
    return useQuery({
      queryKey: ["qr-status", sessionId],
      queryFn: async () => {
        const { data } = await client.get(`/qr/${sessionId}/status`);
        console.log("QR Status:", data);

        if (data?.status === "approved") {
          // 🔐 trigger login exchange once approved
          logQrUser.mutate(sessionId);
        }

        return data;
      },
      enabled: !!sessionId, // only run if sessionId exists
      refetchInterval: (lastData) => {
        // ✅ stop polling once approved
        if (lastData?.status === "approved") return false;
        return 2000; // otherwise keep polling every 2s
      },
    });
  };

  // ⏳ Loading states
  const isLoading = {
    login: loginMutation.isPending,
    profile: profileMutation.isPending,
    requestOtp: requestOtpMutation.isPending,
    verifyOtp: verifyOtpMutation.isPending,
    logout: logoutMutation.isPending,
    qrCreate: qrCreateQuery.isFetching,
    overall:
      loginMutation.isPending ||
      profileMutation.isPending ||
      requestOtpMutation.isPending ||
      verifyOtpMutation.isPending ||
      qrCreateQuery.isFetching ||
      logoutMutation.isPending,
  };

  return {
    login: loginMutation.mutate,
    profile: profileMutation.mutateAsync,
    verifyOtp: verifyOtpMutation.mutate,
    requestOtp: requestOtpMutation.mutateAsync,
    logout: logoutMutation.mutate,
    approveUser,
    qrCreate: qrCreateQuery.refetch,
    useQrStatus,
    logQrUser,
    verifyUser,
    isLoading,
    profileQuery,
  };
};

export default useAuth;
