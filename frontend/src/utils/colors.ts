const BOX_COLORS = [
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
];

export function generateRandomColor(): string {
  return BOX_COLORS[Math.floor(Math.random() * BOX_COLORS.length)];
}

export const SELECTED_COLOR = '#00ff00';
