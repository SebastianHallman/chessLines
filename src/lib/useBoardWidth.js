import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;
const DESKTOP_BOARD_WIDTH = 480;

function calcBoardWidth() {
  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    // 8px padding on each side from .board-area on mobile
    return Math.min(window.innerWidth - 16, DESKTOP_BOARD_WIDTH);
  }
  return DESKTOP_BOARD_WIDTH;
}

export function useBoardWidth() {
  const [width, setWidth] = useState(calcBoardWidth);
  useEffect(() => {
    function onResize() {
      setWidth(calcBoardWidth());
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}
