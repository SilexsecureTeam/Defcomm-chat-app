import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OtpInput from "react-otp-input";
import { FaSpinner } from "react-icons/fa";
import useAuth from "../hooks/useAuth";
import { useEffect } from "react";

const VerifyUser = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const encrypt = queryParams.get("auth");
  const { verifyUser } = useAuth();
  const [otp, setOtp] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // redirect if no auth param
  useEffect(() => {
    if (!encrypt) {
      navigate("/login", { replace: true });
    }
  }, [encrypt, navigate]);

  const handleVerify = async () => {
    if (otp.length !== 4) return;

    try {
      await verifyUser.mutateAsync(
        { otp, encrypt },
        { onSuccess: () => setIsVerified(true) }
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-[780px] flex justify-center lg:justify-end items-center pt-20">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        {!isVerified ? (
          <>
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Account Verification
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Enter the 4-digit code sent to your email to verify your account.
            </p>

            <OtpInput
              value={otp}
              onChange={(value) => /^\d*$/.test(value) && setOtp(value)}
              numInputs={4}
              isInputNum
              containerStyle="flex justify-center gap-3 mb-4"
              inputStyle={{
                background: "#fff",
                border: "2px solid #CBD5E1",
                borderRadius: "10px",
                color: "#1E293B",
                width: "55px",
                height: "55px",
                fontSize: "22px",
                fontWeight: "600",
              }}
              renderInput={(props) => <input {...props} inputMode="numeric" />}
            />

            {verifyUser.isError && (
              <p className="text-red-500 text-sm mb-4 text-center">
                {verifyUser.error?.response?.data?.message ||
                  verifyUser.error?.message ||
                  "Verification failed. Please try again."}
              </p>
            )}

            <button
              onClick={handleVerify}
              disabled={verifyUser.isPending || otp.length !== 4}
              className="w-full bg-oliveLight hover:bg-oliveDark text-white py-3 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60 flex justify-center items-center"
            >
              {verifyUser.isPending ? (
                <>
                  <FaSpinner className="animate-spin mr-2" /> Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              🎉 Verification Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your account has been successfully verified. You can now log in.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-oliveLight hover:bg-oliveDark text-white py-3 rounded-lg font-medium transition"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyUser;
