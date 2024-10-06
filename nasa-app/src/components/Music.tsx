import { useEffect, useState } from "react";
import useSound from "use-sound";

type Props = {
  urls: Record<string, string>;
  currentTrack: string;
}

export default function Music(props: Props) {
  const { urls, currentTrack } = props;

  const [play, { stop }] = useSound(urls[currentTrack], {
    loop: true,
  });

  useEffect(() => {
    window.addEventListener("mousemove", (event) => {
      play();
    }, { once: true });
  }, [play]);

  useEffect(() => {
    stop();
  }, [currentTrack]);

  return (
    <div style={{ position: "fixed", display: "none" }} />
  );
}
