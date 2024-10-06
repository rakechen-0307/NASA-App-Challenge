import { useRef, useLayoutEffect } from "react";
import { threeController } from "./ThreeController";
import { useResizeDetector } from "react-resize-detector";


export default function ThreeSimulator() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { ref: containerRef } = useResizeDetector({
    onResize: ({ width, height }) => {
      if (threeController.isInitialized()) {
        threeController.resize(width as number, height as number);
      }
    },
  });

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    // console.log(canvas, container);
    if (canvas && container) {
      threeController.init(canvas, container);
    }
  }, [canvasRef, containerRef]);


  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: -1,
      }}
      ref={containerRef}
    >
      <div ref={canvasRef} />
    </div>
  )
}
