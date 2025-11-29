import React from "react";
import { useForm } from "react-hook-form";
import useComm from "../../hooks/useComm";
import { onSuccess } from "../../utils/notifications/OnSuccess";
import { onFailure } from "../../utils/notifications/OnFailure";
import { GiRadioTower } from "react-icons/gi"; // military-style icon

const CreateChannelForm = ({ setIsModalOpen }) => {
  const { createChannelMutation } = useComm();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await createChannelMutation.mutateAsync(
        {
          ...data,
          frequency: "",
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            reset();
          },
        }
      );
    } catch (err) {
      onFailure({ message: "Failed to create channel." });
    }
  };

  return (
    <div className="bg-oliveDark shadow-2xl w-full max-w-md p-6 mx-auto border-2 border-oliveLight">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <GiRadioTower className="text-4xl text-yellow-400" />
        <h3 className="text-2xl font-bold text-yellow-400 uppercase">
          Create Comm Channel
        </h3>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Channel Name */}
        <div>
          <label className="block text-sm font-semibold text-yellow-300 mb-1">
            Channel Name
          </label>
          <input
            {...register("name", { required: "Channel name is required" })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-oliveLight text-white placeholder-yellow-200 transition ${
              errors.name ? "border-red-500" : "border-gray-500"
            }`}
            placeholder="Enter channel name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-yellow-300 mb-1">
            Description
          </label>
          <textarea
            {...register("description", {
              required: "Description is required",
            })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-oliveLight text-white placeholder-yellow-200 transition ${
              errors.description ? "border-red-500" : "border-gray-500"
            }`}
            placeholder="Optional description..."
            rows={3}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-oliveDark font-bold uppercase transition-all disabled:opacity-70"
        >
          {isSubmitting ? "Creating..." : "Create Channel"}
        </button>
      </form>
    </div>
  );
};

export default CreateChannelForm;
