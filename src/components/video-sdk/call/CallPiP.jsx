import { formatCallDuration } from "../../../utils/formmaters";

const CallPiP = ({ callDuration, onRestore, onEnd }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-xl p-3 flex items-center gap-4 z-50">
      <div className="text-black font-semibold text-sm">
        In Call: {formatCallDuration(callDuration)}
      </div>
      <button
        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
        onClick={onRestore}
      >
        Restore
      </button>
      <button
        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
        onClick={onEnd}
      >
        End
      </button>
    </div>
  );
};

export default CallPiP;
