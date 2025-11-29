import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdQueueMusic, MdMoreVert } from "react-icons/md";
import { LuAudioLines } from "react-icons/lu";
import useComm from "../../hooks/useComm";
import { FaSpinner } from "react-icons/fa";
import LoaderCard from "./LoaderCard";
import EmptyState from "./EmptyState";

function RecentCalls() {
  const navigate = useNavigate();
  const { getInvitedChannelPending, updateChannelInviteStatus } = useComm();
  const { data, isLoading } = getInvitedChannelPending;
  const { isLoading: isMutating, variables } = updateChannelInviteStatus;

  // local per-item loading state with action type ('accept' | 'reject')
  const [loading, setLoading] = useState({ subId: null, action: null });

  const handleAccept = async (sub_id) => {
    setLoading({ subId: sub_id, action: "accept" });

    try {
      if (typeof updateChannelInviteStatus.mutateAsync === "function") {
        await updateChannelInviteStatus.mutateAsync({
          sub_id,
          status: "active",
        });
      } else {
        updateChannelInviteStatus.mutate(
          { sub_id, status: "active" },
          {
            onSettled: () => setLoading({ subId: null, action: null }),
          }
        );
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading({ subId: null, action: null });
    }
  };

  const handleReject = async (sub_id) => {
    setLoading({ subId: sub_id, action: "reject" });

    try {
      if (typeof updateChannelInviteStatus.mutateAsync === "function") {
        await updateChannelInviteStatus.mutateAsync({
          sub_id,
          status: "reject",
        });
      } else {
        updateChannelInviteStatus.mutate(
          { sub_id, status: "reject" },
          {
            onSettled: () => setLoading({ subId: null, action: null }),
          }
        );
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading({ subId: null, action: null });
    }
  };

  return (
    <div className="p-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center space-x-2">
          <MdQueueMusic size={20} className="text-green-400" />
          <span>Recently Invited</span>
        </h2>
        <MdMoreVert size={20} className="text-gray-400 cursor-pointer" />
      </div>

      {isLoading ? (
        <LoaderCard />
      ) : data?.length === 0 ? (
        <EmptyState />
      ) : (
        data?.map((call, index) => {
          // determine if this item has a mutation in progress (either via local state or external mutation)
          const itemMutatingExternally =
            isMutating && variables?.sub_id === call?.sub_id;

          const isItemBusy =
            loading.subId === call?.sub_id || itemMutatingExternally;

          const isAccepting =
            (loading.subId === call?.sub_id && loading.action === "accept") ||
            (itemMutatingExternally && variables?.status === "active"); // optional fallback
          const isRejecting =
            (loading.subId === call?.sub_id && loading.action === "reject") ||
            (itemMutatingExternally && variables?.status === "reject"); // optional fallback

          return (
            <div
              key={index}
              className="flex gap-3 items-center mt-4 p-3 bg-gray-800 text-white rounded-md even:bg-oliveGreen even:text-gray-900 shadow-sm"
            >
              <figure className="w-12 h-12 rounded-full bg-gray-400 shrink-0" />

              <section className="flex flex-col justify-center flex-1">
                <p className="font-semibold truncate">{call?.name}</p>
                <span className="text-sm opacity-60 truncate">
                  {call?.frequency} – {call?.description || "No description"}
                </span>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAccept(call?.sub_id)}
                    disabled={isItemBusy}
                    className={`text-xs px-3 py-1 rounded transition duration-150 ${
                      isItemBusy
                        ? "bg-green-400 cursor-not-allowed opacity-70"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isAccepting ? (
                      <FaSpinner className="animate-spin inline-block mr-1" />
                    ) : null}
                    Accept
                  </button>

                  <button
                    onClick={() => handleReject(call?.sub_id)}
                    disabled={isItemBusy}
                    className={`text-xs px-3 py-1 rounded transition duration-150 ${
                      isItemBusy
                        ? "bg-red-400 cursor-not-allowed opacity-70"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {isRejecting ? (
                      <FaSpinner className="animate-spin inline-block mr-1" />
                    ) : null}
                    Reject
                  </button>
                </div>
              </section>

              <section className="flex flex-col items-end gap-1">
                <LuAudioLines className="size-4 md:size-6 text-gray-300" />
                <span className="text-xs font-medium">{call.time}</span>
              </section>
            </div>
          );
        })
      )}
    </div>
  );
}

export default RecentCalls;
