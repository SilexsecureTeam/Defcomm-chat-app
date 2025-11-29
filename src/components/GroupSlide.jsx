import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import mainLogo from "../assets/logo-icon.png";

const GroupSlide = ({
  groups,
  selectedGroup = {},
  setSelectedGroup,
  forceSingleView = false,
}) => {
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  return (
    <div className="relative w-full mb-5">
      {/* Swiper Slider */}
      <Swiper
        spaceBetween={15}
        navigation={{ nextEl: ".next-btn", prevEl: ".prev-btn" }}
        modules={[Navigation]}
        onSlideChange={(swiper) => {
          setIsBeginning(swiper.isBeginning);
          setIsEnd(swiper.isEnd);
        }}
        breakpoints={
          forceSingleView
            ? { 320: { slidesPerView: 1 }, 640: { slidesPerView: 2 } }
            : {
                320: { slidesPerView: 1 },
                640: { slidesPerView: 2 },
                750: { slidesPerView: 1 },
                900: { slidesPerView: 2 },
                1200: { slidesPerView: 3 },
              }
        }
        className="p-3"
      >
        {groups?.map((group, index) => {
          const isSelected = selectedGroup?.group_id === group.group_id;

          return (
            <SwiperSlide
              key={group.group_id}
              onClick={() => setSelectedGroup(group)}
              className="w-[80%] md:min-w-60 relative"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex items-center gap-4 p-3 rounded-lg shadow-md my-2 
                  ${
                    isSelected
                      ? "bg-oliveLight/80 border border-green-400"
                      : "bg-oliveLight/50 hover:bg-oliveLight"
                  } 
                  cursor-pointer relative min-h-[100px]`}
              >
                {isSelected && (
                  <FaCheckCircle className="absolute top-2 right-2 text-green-400 text-xl z-10" />
                )}
                <figure className="flex-shrink-0 w-14 h-14 bg-gray-600 rounded-full overflow-hidden">
                  <img
                    src={group.image || mainLogo}
                    alt="Group"
                    className="w-full h-full object-cover"
                  />
                </figure>
                <section className="min-w-0 flex-1">
                  <p
                    className="text-lg font-semibold truncate"
                    title={group?.group_name}
                  >
                    {group.group_name}
                  </p>
                  <p className="text-sm text-gray-400">{group.company_name}</p>
                </section>
              </motion.div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Navigation Buttons */}
      <div className="flex justify-end gap-4 mt-4">
        <button
          className={`prev-btn p-2 border border-white rounded-full transition-all duration-300 ${
            isBeginning
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-white hover:text-black"
          }`}
          disabled={isBeginning}
        >
          <AiOutlineLeft size={20} />
        </button>
        <button
          className={`next-btn p-2 border border-white rounded-full transition-all duration-300 ${
            isEnd
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-white hover:text-black"
          }`}
          disabled={isEnd}
        >
          <AiOutlineRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default GroupSlide;
