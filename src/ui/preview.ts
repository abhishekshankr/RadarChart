export type PreviewData = {
  color: string;
  gridColor: string;
  minValue: number;
  maxValue: number;
  dataSets: { name: string; value: number }[];
  showDataValue: boolean;
  showDataPoints: boolean;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 100, g: 100, b: 220 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function renderPreview(canvas: HTMLCanvasElement, data: PreviewData) {
  const ctx = canvas.getContext('2d')!;
  // Use CSS display size for all math; the context is already scaled by dpr in setupCanvas.
  const size = parseFloat(canvas.style.width) || (canvas.width / (window.devicePixelRatio || 1));
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const n = data.dataSets.length;

  ctx.clearRect(0, 0, size, size);

  if (n < 3) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Add at least 3 data points', cx, cy);
    return;
  }

  const range = data.maxValue - data.minValue || 1;
  const angleInc = (2 * Math.PI) / n;
  const startAngle = (3 * Math.PI) / 2;

  const gridStroke = data.gridColor || '#E5E7EB';

  // Draw 5 spider rings
  for (let ring = 0.2; ring <= 1.001; ring += 0.2) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = i * angleInc + startAngle;
      const r = ring * maxR;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = gridStroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw radial lines when showDataValue is false
  if (!data.showDataValue) {
    for (let i = 0; i < n; i++) {
      const a = i * angleInc + startAngle;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a));
      ctx.strokeStyle = gridStroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Compute data polygon points
  const pts = data.dataSets.map((d, i) => {
    const r = ((d.value - data.minValue) / range) * maxR;
    const a = i * angleInc + startAngle;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  const { r, g, b } = hexToRgb(data.color);

  // Fill
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = `rgba(${r},${g},${b},0.3)`;
  ctx.fill();

  // Stroke
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Data point circles
  if (data.showDataPoints) {
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();
    });
  }

  // Axis labels
  ctx.fillStyle = '#374151';
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const a = i * angleInc + startAngle;
    const labelR = maxR + 14;
    const lx = cx + labelR * Math.cos(a);
    const ly = cy + labelR * Math.sin(a);
    ctx.fillText(data.dataSets[i].name, lx, ly);
  }
}
