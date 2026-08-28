import { useCallback } from "react";
import Particles from "react-particles";
import { loadSlim } from "tsparticles-slim";

export default function AIBrainBackground() {

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="ai-particles"
      init={particlesInit}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0
      }}
      options={{
        fpsLimit: 60,
        particles: {
          number: {
            value: 90,
            density: { enable: true, area: 800 }
          },
          color: {
            value: ["#a855f7", "#ec4899", "#c084fc"]
          },
          shape: {
            type: "circle"
          },
          opacity: {
            value: 0.6
          },
          size: {
            value: { min: 1, max: 3 }
          },
          links: {
            enable: true,
            distance: 140,
            color: "#a855f7",
            opacity: 0.5,
            width: 1
          },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            outModes: {
              default: "bounce"
            }
          }
        },
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab"
            }
          },
          modes: {
            grab: {
              distance: 160,
              links: {
                opacity: 0.8
              }
            }
          }
        }
      }}
    />
  );
}