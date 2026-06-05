const BUILT_IN_LEVELS = [
  // TUTORIAL
  {
    bg: 1,
    length: 1800,
    platforms: [
      { x: 0, y: 580, width: 1800, height: 200 },
      { x: 400, y: 550, width: 200, height: 20 },
      { x: 700, y: 500, width: 200, height: 20 }
    ],
    spikes: [],
    coins: [
      { x: 420, y: 520, width: 20, height: 20 },
      { x: 720, y: 470, width: 20, height: 20 },
      { x: 900, y: 605, width: 20, height: 20 }
    ],
    winZone: { x: 1300, y: 575, width: 100, height: 50 }
  },
  // LEVEL 1
  {
    bg: 1,
    length: 2000,
    platforms: [
      { x: 0, y: 580, width: 2000, height: 200 },
      { x: 500, y: 550, width: 150, height: 20 },
      { x: 800, y: 500, width: 150, height: 20 }
    ],
    spikes: [
      { x: 900, y: 585, width: 40, height: 40 }
    ],
    coins: [
      { x: 520, y: 520, width: 20, height: 20 },
      { x: 820, y: 470, width: 20, height: 20 },
      { x: 950, y: 605, width: 20, height: 20 },
      { x: 1400, y: 605, width: 20, height: 20 }
    ],
    winZone: { x: 1500, y: 575, width: 100, height: 50 }
  },
  // LEVEL 2
  {
    bg: 1,
    length: 2200,
    platforms: [
      { x: 0, y: 580, width: 2200, height: 200 },
      { x: 600, y: 550, width: 120, height: 20 },
      { x: 1100, y: 550, width: 120, height: 20 }
    ],
    spikes: [
      { x: 800, y: 585, width: 40, height: 40 }
    ],
    coins: [
      { x: 620, y: 520, width: 20, height: 20 },
      { x: 1120, y: 520, width: 20, height: 20 },
      { x: 850, y: 605, width: 20, height: 20 },
      { x: 1500, y: 605, width: 20, height: 20 }
    ],
    winZone: { x: 1700, y: 575, width: 100, height: 50 }
  },
  // LEVEL 3
  {
    bg: 1,
    length: 2400,
    platforms: [
      { x: 0, y: 580, width: 2400, height: 200 },
      { x: 400, y: 550, width: 100, height: 20 },
      { x: 650, y: 500, width: 100, height: 20 },
      { x: 900, y: 450, width: 100, height: 20 }
    ],
    spikes: [
      { x: 1000, y: 585, width: 40, height: 40 }
    ],
    coins: [
      { x: 420, y: 520, width: 20, height: 20 },
      { x: 670, y: 470, width: 20, height: 20 },
      { x: 920, y: 420, width: 20, height: 20 },
      { x: 1050, y: 605, width: 20, height: 20 },
      { x: 1600, y: 605, width: 20, height: 20 }
    ],
    winZone: { x: 1900, y: 575, width: 100, height: 50 }
  },
  // LEVEL 4
  {
    bg: 1,
    length: 2600,
    platforms: [
      { x: 0, y: 580, width: 2600, height: 200 },
      { x: 500, y: 550, width: 80, height: 20 },
      { x: 700, y: 500, width: 80, height: 20 },
      { x: 900, y: 450, width: 80, height: 20 },
      { x: 1100, y: 400, width: 80, height: 20 }
    ],
    spikes: [
      { x: 1300, y: 585, width: 40, height: 40 },
      { x: 1500, y: 585, width: 40, height: 40 }
    ],
    coins: [
      { x: 520, y: 520, width: 20, height: 20 },
      { x: 720, y: 470, width: 20, height: 20 },
      { x: 920, y: 420, width: 20, height: 20 },
      { x: 1120, y: 370, width: 20, height: 20 },
      { x: 1350, y: 605, width: 20, height: 20 }
    ],
    winZone: { x: 2100, y: 575, width: 100, height: 50 }
  },
  // LEVEL 5
  {
    bg: 1,
    length: 2800,
    platforms: [
      { x: 0, y: 580, width: 2800, height: 200 },
      { x: 400, y: 550, width: 60, height: 20 },
      { x: 550, y: 500, width: 60, height: 20 },
      { x: 700, y: 450, width: 60, height: 20 }
    ],
    spikes: [
      { x: 900, y: 585, width: 40, height: 40 },
      { x: 1100, y: 585, width: 40, height: 40 },
      { x: 1300, y: 585, width: 40, height: 40 }
    ],
    coins: [
      { x: 420, y: 520, width: 20, height: 20 },
      { x: 570, y: 470, width: 20, height: 20 },
      { x: 720, y: 420, width: 20, height: 20 },
      { x: 950, y: 605, width: 20, height: 20 },
      { x: 1150, y: 605, width: 20, height: 20 }
    ],
    winZone: { x: 2300, y: 575, width: 100, height: 50 }
  }
];
