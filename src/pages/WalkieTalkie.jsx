import { useContext } from "react";
import Broadcast from "../components/walkietalkie/Broadcast";
import RecentCalls from "../components/walkietalkie/RecentCalls";
import { IoFlash } from "react-icons/io5";
import CommInterface from "../components/walkietalkie/CommInterface";
import { CommContext } from "../context/CommContext";
import { MdOutlinePodcasts } from "react-icons/md";

const WalkieTalkie = () => {
  const { setIsOpenComm } = useContext(CommContext);

  return (
    <>
      {/* Header Section */}
      <div className="sticky top-0 z-50 flex xl:hidden justify-between items-center bg-oliveDark text-white p-4 text-sm font-medium dark:bg-oliveLight">
        <button
          aria-label="Upgrade to Premium"
          className="bg-white text-black dark:bg-gray-800 dark:text-white rounded-lg flex items-center gap-2 px-3 py-2 border border-olive transition-all hover:scale-105"
        >
          <IoFlash className="text-yellow" />{" "}
          <span className="hidden md:block">Upgrade to Premium</span>
        </button>
        {/* Better Comm Icon */}
        <MdOutlinePodcasts
          aria-label="Open Communication Panel"
          size={28}
          className="cursor-pointer text-white hover:text-yellow transition-colors"
          onClick={() => setIsOpenComm(true)}
        />
      </div>

      <div className="text-white overflow-y-auto">
        <div className="flex gap-4">
          <div className="md:w-2/3 flex-1">
            <Broadcast />
            <RecentCalls />
          </div>
          <div className="md:w-1/3 hidden xl:block">
            <CommInterface />
          </div>
        </div>
      </div>
    </>
  );
};

export default WalkieTalkie;
