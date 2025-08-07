import React, { useCallback } from 'react'
import Particles from "react-particles"
import { loadFull } from "tsparticles"

const ParticleBackground = () => {
  const particlesInit = useCallback(async engine => {
    await loadFull(engine)
  }, [])

  const particlesLoaded = useCallback(async container => {
    // Optional: Log when particles are loaded
    console.log("Particles loaded:", container)
  }, [])

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onClick: {
              enable: true,
              mode: "push",
            },
            onHover: {
              enable: true,
              mode: "repulse",
            },
            resize: true,
          },
          modes: {
            push: {
              quantity: 4,
            },
            repulse: {
              distance: 200,
              duration: 0.4,
            },
          },
        },
        particles: {
          color: {
            value: ["#FFD700", "#F4C430", "#DAA520", "#FFFFFF"],
          },
          links: {
            color: "#FFD700",
            distance: 150,
            enable: true,
            opacity: 0.3,
            width: 1,
          },
          collisions: {
            enable: true,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 2,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 80,
          },
          opacity: {
            value: 0.7,
            random: {
              enable: true,
              minimumValue: 0.3,
            },
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 0.1,
            },
          },
          shape: {
            type: ["circle", "triangle", "polygon"],
            polygon: {
              nb_sides: 6,
            },
          },
          size: {
            value: { min: 1, max: 5 },
            random: {
              enable: true,
              minimumValue: 1,
            },
            animation: {
              enable: true,
              speed: 2,
              minimumValue: 0.5,
            },
          },
        },
        detectRetina: true,
        themes: [
          {
            name: "light",
            default: {
              value: false,
              mode: "light",
            },
            options: {
              particles: {
                color: {
                  value: "#FFD700",
                },
                links: {
                  color: "#DAA520",
                },
              },
            },
          },
          {
            name: "dark",
            default: {
              value: true,
              mode: "dark",
            },
            options: {
              particles: {
                color: {
                  value: ["#FFD700", "#F4C430", "#FFFFFF"],
                },
                links: {
                  color: "#FFD700",
                },
              },
            },
          },
        ],
        responsive: [
          {
            maxWidth: 768,
            options: {
              particles: {
                number: {
                  value: 40,
                },
                links: {
                  enable: false,
                },
              },
              interactivity: {
                events: {
                  onHover: {
                    enable: false,
                  },
                },
              },
            },
          },
        ],
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  )
}

export default ParticleBackground
