import { HiOutlineInbox } from "react-icons/hi";

const EmptyState = ({
  title = "Nothing here yet",
  description = "You’ll see content here once it's available.",
  icon = <HiOutlineInbox size={48} className="text-zinc-500" />,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 text-zinc-400">
      {icon}
      <h3 className="text-lg font-semibold text-zinc-300 mt-3">{title}</h3>
      <p className="text-sm mt-1 max-w-xs">{description}</p>
    </div>
  );
};

export default EmptyState;
