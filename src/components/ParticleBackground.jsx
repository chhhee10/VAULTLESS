import { useCallback } from "react";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";


export default function ParticleBackground() {

  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: {
          enable: true,
          zIndex: 0
        },

        background: {
          color: "#000000"
        },

        particles: {
          number: {
            value: 200
          },

          color: {
            value: "#00ffcc"
          },

          size: {
            value: 2
          },

          move: {
            enable: true,
            speed: 1.0
          },

          links: {
            enable: true,
            distance: 160,
            color: "#00ffcc",
            opacity: 0.4,
            width: 1
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
              distance: 200,
              links: {
                opacity: 1
              }
            }
          }
        }
      }}
    />
  );
}