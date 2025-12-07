import React, { useContext } from "react";
import { FaFileAlt, FaTimes } from "react-icons/fa";
import { ChatContext } from "../../context/ChatContext";

const FileToSendPreview = () => {
  const { file, setFile } = useContext(ChatContext);

  if (!file) return null;

  return (
    <div
      className="
        flex items-center gap-3 p-3 mb-2 rounded-lg shadow-md
        bg-oliveDark
        lg:bg-oliveGreen
      "
    >
      <FaFileAlt
        className="
          text-oliveGreen
          lg:text-oliveDark
        "
        size={20}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium w-[90%] truncate">{file.name}</p>
        <p
          className="
            text-gray-400 text-xs
            lg:text-gray-700
          "
        >
          {(file.size / 1024).toFixed(2)} KB
        </p>
      </div>

      <button
        onClick={() => setFile(null)}
        className="text-red-400 hover:text-red-500 transition"
      >
        <FaTimes size={18} />
      </button>
    </div>
  );
};

export default FileToSendPreview;
