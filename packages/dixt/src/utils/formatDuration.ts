import pad from "./pad";

const formatTime = (totalTime: number) => {
  const hours = Math.floor(totalTime / 1000 / 60 / 60);
  const minutes = Math.floor((totalTime / 1000 / 60) % 60);
  return `${pad(hours, 2)}h${pad(minutes, 2)}`;
};

export default formatTime;
