import React, { useState } from "react";
import { FaPlus, FaSignInAlt } from "react-icons/fa";
import Modal from "../modal/Modal";
import CreateChannelForm from "./CreateChannelForm";

const InitComm = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      className="bg-oliveLight min-h-96 w-full min-w-[400px] max-w-[500px] py-8 px-6 text-white flex flex-col items-center justify-center"
      style={{
        background: `linear-gradient(to bottom, #36460A 10%, #000000 65%)`,
      }}
    >
      <h2 className="text-2xl font-bold mb-4 text-center">
        Join a Walkie Talkie Session
      </h2>
      <p className="text-sm text-gray-300 mb-8 text-center">
        Meeting hasn’t started yet. You can create or join a new walkie talkie
        room.
      </p>

      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full flex items-center gap-2 mb-4"
      >
        <FaPlus /> Create New Room
      </button>

      <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full flex items-center gap-2">
        <FaSignInAlt /> Join Existing Room
      </button>

      <Modal isOpen={isModalOpen} closeModal={() => setIsModalOpen(false)}>
        <CreateChannelForm setIsModalOpen={setIsModalOpen} />
      </Modal>
    </div>
  );
};

export default InitComm;
