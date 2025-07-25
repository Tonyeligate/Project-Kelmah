export const particleConfigs = {
  default: {
    particles: {
      number: {
        value: 80,
        density: { enable: true, value_area: 800 },
      },
      color: { value: '#ffd700' },
      shape: {
        type: 'circle',
        stroke: { width: 0 },
        polygon: { nb_sides: 5 },
      },
      opacity: {
        value: 0.5,
        random: true,
        animation: {
          enable: true,
          speed: 1,
          opacity_min: 0.1,
          sync: false,
        },
      },
      size: {
        value: 3,
        random: true,
        animation: {
          enable: true,
          speed: 2,
          size_min: 0.1,
          sync: false,
        },
      },
      line_linked: {
        enable: true,
        distance: 150,
        color: '#ffd700',
        opacity: 0.4,
        width: 1,
      },
      move: {
        enable: true,
        speed: 2,
        direction: 'none',
        random: false,
        straight: false,
        out_mode: 'out',
        bounce: false,
        attract: { enable: true, rotateX: 600, rotateY: 1200 },
      },
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: true, mode: 'repulse' },
        onclick: { enable: true, mode: 'push' },
        resize: true,
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
        push: { particles_nb: 4 },
      },
    },
  },

  constellation: {
    // ... constellation effect config
  },

  bubbles: {
    // ... bubbles effect config
  },

  snow: {
    // ... snow effect config
  },
};
