import React, { useContext, useState } from "react";
import { MdCallMade, MdCallReceived, MdCallMissed } from "react-icons/md";
import { FiPhone } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";

const CallHistory = ({ contact, logs }) => {
  const { authDetails } = useContext(AuthContext);
  const currentUserEmail = authDetails?.user?.email;
  const [filter, setFilter] = useState("all");

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleString(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });

  const getCallDetails = (log) => {
    const isOutgoing = log.send_user_email === currentUserEmail;
    const isMissed = log.call_state === "miss";

    if (isOutgoing) {
      if (isMissed) {
        return {
          label: "Outgoing • Missed",
          color: "text-red-600 bg-red-50",
          type: "missed",
          icon: <MdCallMade className="text-red-600" />,
        };
      } else {
        return {
          label: "Outgoing • Answered",
          color: "text-green-600 bg-green-50",
          type: "outgoing",
          icon: <MdCallMade className="text-green-600" />,
        };
      }
    } else {
      if (isMissed) {
        return {
          label: "Missed",
          color: "text-red-600 bg-red-50",
          type: "missed",
          icon: <MdCallMissed className="text-red-600" />,
        };
      } else {
        return {
          label: "Incoming • Answered",
          color: "text-green-600 bg-green-50",
          type: "incoming",
          icon: <MdCallReceived className="text-green-600" />,
        };
      }
    }
  };

  const filteredLogs = logs
    ?.filter((log) => {
      return (
        log?.send_user_email === contact?.contact_email ||
        log?.recieve_user_email === contact?.contact_email
      );
    })
    ?.map((log) => ({ ...log, ...getCallDetails(log) }))
    ?.filter((log) => {
      if (filter === "all") return true;
      return log.type === filter;
    });

  return (
    <div className="bg-white rounded-xl p-4 w-80 md:w-[500px] lg:w-[700px] shadow-xl">
      <div className="flex justify-between gap-2 items-center mb-4 border-b pb-3">
        <h2 className="text-xl font-semibold text-olive">
          Call History with {contact?.contact_name}{" "}
          {filteredLogs?.length > 0 && `(${filteredLogs?.length})`}
        </h2>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-md p-1.5 bg-gray-50 text-gray-700 focus:outline-none"
        >
          <option value="all">All</option>
          <option value="incoming">Incoming</option>
          <option value="outgoing">Outgoing</option>
          <option value="missed">Missed</option>
        </select>
      </div>

      {filteredLogs?.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No call logs found for this filter.
        </p>
      ) : (
        <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {filteredLogs.map((log, index) => (
            <li
              key={index}
              className="flex items-center justify-between bg-gray-50 p-3 py-2 rounded-md border border-gray-200 shadow-sm hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${log.color}`}>
                  {log.icon}
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      log.color.split(" ")[0]
                    }`}
                  >
                    {log.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(log.created_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Duration:{" "}
                    <span className="font-semibold text-gray-700">
                      {log?.call_duration || "00:00:00"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <FiPhone className="text-gray-400" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CallHistory;
