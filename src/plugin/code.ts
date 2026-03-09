
// Show the UI
figma.showUI(__html__, { width: 760, height: 780 });

// Send saved preferences to UI on launch
figma.clientStorage.getAsync('prefs').then(prefs => {
  figma.ui.postMessage({ type: 'prefsLoaded', prefs: prefs ?? {} });
});

// Listen to messages from the UI
figma.ui.onmessage = async msg => {
  if (msg.type === 'setPrefs') {
    await figma.clientStorage.setAsync('prefs', msg.prefs);
    return;
  }
  if (msg.type === 'submitData') {
    const inputData: RadarGraphInput = {
      color: msg.data.color,
      gridColor: msg.data.gridColor || '#E5E7EB',
      minValue: msg.data.minValue,
      maxValue: msg.data.maxValue,
      dataSets: msg.data.dataSets,
      showDataValue: msg.data.showDataValue,
      showDataPoints: msg.data.showDataPoints
    };
    createRadarGraph(inputData);
  }
}


// Define the input types
type DataSet = {
  name: string;
  value: number;
};

type RadarGraphInput = {
  color: string;
  gridColor: string;
  minValue: number;
  maxValue: number;
  dataSets: DataSet[];
  showDataValue: boolean;
  showDataPoints: boolean;
};

function buildPolygonSegments(count: number) {
  return Array(count - 1).fill(0).map((_, i) => ({ start: i, end: i + 1 }))
    .concat({ start: count - 1, end: 0 });
}

// Create the radar graph based on the given input
async function createRadarGraph(input: RadarGraphInput) {

  // Load all fonts in parallel
  await Promise.all([
    figma.loadFontAsync({ family: "Inter", style: "Bold" }),
    figma.loadFontAsync({ family: "Inter", style: "Medium" }),
    figma.loadFontAsync({ family: "Inter", style: "Regular" }),
  ]);

  const color = hexToRgb(input.color);
  const spiderPolygonColor = hexToRgb(input.gridColor);
  const frameSize = 500;
  const centerX = frameSize / 2;
  const centerY = frameSize / 2;
  const maxRadius = frameSize * 0.4;
  const scaleDivision = (input.maxValue - input.minValue) / 5;

  // Create a new frame for the radar graph
  const frame = figma.createFrame();
  frame.name = 'Radar Chart';
  frame.resize(frameSize, frameSize);

  if (figma.editorType === 'figma') {
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  } else if (figma.editorType === 'figjam') {
    frame.fills = [];
  }

  frame.x = figma.viewport.center.x - frameSize / 2;
  frame.y = figma.viewport.center.y - frameSize / 2;
  frame.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  figma.currentPage.appendChild(frame);

  const totalDataSets = input.dataSets.length;
  const angleIncrement = (2 * Math.PI) / totalDataSets;

  function getPointOnCircle(angle: number, radius: number) {
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  }

  const radarPolygonPoints: string[] = [];
  for (let i = 0; i < totalDataSets; i++) {
    const dataSet = input.dataSets[i];
    const radius = ((dataSet.value - input.minValue) / (input.maxValue - input.minValue)) * maxRadius;
    const angle = i * angleIncrement + (3 * Math.PI / 2);
    const point = getPointOnCircle(angle, radius);
    radarPolygonPoints.push(`${point.x},${point.y}`);
  }

  let divisionMultiplier = 1;

  // Draw spider-web pattern
  for (let i = 0.2; i <= 1; i += 0.2) {
    const polygonPoints: string[] = [];
    for (let j = 0; j < totalDataSets; j++) {
      const angle = j * angleIncrement + (3 * Math.PI / 2);
      const point = getPointOnCircle(angle, i * maxRadius);

      // Scale labels on the first axis
      if (input.showDataValue && j === 0) {
        const labelOffset = -15;
        const labelText = figma.createText();
        if (i === 0.2) {
          labelText.characters = String(input.minValue + scaleDivision);
        } else if (i === 1) {
          labelText.characters = String(input.maxValue);
        } else {
          labelText.characters = String(Number((input.minValue + (scaleDivision * divisionMultiplier)).toFixed(1)));
        }
        labelText.fontName = { family: "Inter", style: "Bold" };
        labelText.fontSize = 12;
        labelText.fills = [{ type: 'SOLID', color: spiderPolygonColor }];
        labelText.x = point.x + Math.cos(angle) * labelOffset - labelText.width / 2;
        labelText.y = point.y + Math.sin(angle) * labelOffset - labelText.height / 2;
        labelText.constraints = { horizontal: "SCALE", vertical: "SCALE" };
        frame.appendChild(labelText);
        divisionMultiplier++;
      }

      // Axis name labels on outermost ring
      if (i === 1) {
        const labelOffset = 25;
        const labelText = figma.createText();
        labelText.characters = input.dataSets[j].name;
        labelText.fontName = { family: "Inter", style: "Medium" };
        labelText.fontSize = 12;
        labelText.x = point.x + Math.cos(angle) * labelOffset - labelText.width / 2;
        labelText.y = point.y + Math.sin(angle) * labelOffset - labelText.height / 2;
        labelText.constraints = { horizontal: "SCALE", vertical: "SCALE" };
        frame.appendChild(labelText);
      }

      polygonPoints.push(`${point.x},${point.y}`);

      // Radial lines from center (when scale labels are hidden)
      if (!input.showDataValue && i === 1) {
        const vector = figma.createVector();
        await vector.setVectorNetworkAsync({
          vertices: [{ x: centerX, y: centerY }, { x: point.x, y: point.y }],
          segments: [{ start: 0, end: 1 }]
        });
        vector.strokes = [{ type: 'SOLID', color: spiderPolygonColor }];
        vector.strokeWeight = 2;
        vector.constraints = { horizontal: "SCALE", vertical: "SCALE" };
        frame.appendChild(vector);
      }
    }

    // Spider ring polygon
    const vectorPolygon = figma.createVector();
    const vertices = polygonPoints.map(p => { const [x, y] = p.split(',').map(Number); return { x, y }; });
    await vectorPolygon.setVectorNetworkAsync({ vertices, segments: buildPolygonSegments(vertices.length) });
    vectorPolygon.strokes = [{ type: 'SOLID', color: spiderPolygonColor }];
    vectorPolygon.strokeWeight = 2;
    vectorPolygon.strokeJoin = "ROUND";
    vectorPolygon.constraints = { horizontal: "SCALE", vertical: "SCALE" };
    frame.appendChild(vectorPolygon);
  }

  // Shared vertices for data polygon
  const radarVertices = radarPolygonPoints.map(p => { const [x, y] = p.split(',').map(Number); return { x, y }; });
  const radarSegments = buildPolygonSegments(radarVertices.length);

  // Data polygon — fill
  const radarFillPolygon = figma.createVector();
  await radarFillPolygon.setVectorNetworkAsync({ vertices: radarVertices, segments: radarSegments });
  radarFillPolygon.fills = [{ type: 'SOLID', color: color }];
  radarFillPolygon.opacity = 0.3;
  radarFillPolygon.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  frame.appendChild(radarFillPolygon);

  // Data polygon — stroke
  const radarStrokePolygon = figma.createVector();
  await radarStrokePolygon.setVectorNetworkAsync({ vertices: radarVertices, segments: radarSegments });
  radarStrokePolygon.strokes = [{ type: 'SOLID', color: color }];
  radarStrokePolygon.strokeWeight = 4;
  radarStrokePolygon.strokeJoin = "ROUND";
  radarStrokePolygon.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  frame.appendChild(radarStrokePolygon);

  // Data point circles
  if (input.showDataPoints) {
    for (let i = 0; i < totalDataSets; i++) {
      const dataSet = input.dataSets[i];
      const radius = ((dataSet.value - input.minValue) / (input.maxValue - input.minValue)) * maxRadius;
      const angle = i * angleIncrement + (3 * Math.PI / 2);
      const point = getPointOnCircle(angle, radius);
      const circle = figma.createEllipse();
      circle.resize(12, 12);
      circle.x = point.x - 6;
      circle.y = point.y - 6;
      circle.fills = [{ type: 'SOLID', color: color }];
      circle.constraints = { horizontal: "SCALE", vertical: "SCALE" };
      frame.appendChild(circle);
    }
  }
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error("Invalid HEX color.");
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  };
}
