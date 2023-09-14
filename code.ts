
if (figma.editorType === 'figma') {
  // Define the input types
type DataSet = {
  name: string;
  value: number;
};

type RadarGraphInput = {
  color: string;
  minValue: number;
  maxValue: number;
  dataSets: DataSet[];
};

// Create the radar graph based on the given input
function createRadarGraph(input: RadarGraphInput) {
  const frameSize = 500;
  const centerX = frameSize / 2;
  const centerY = frameSize / 2;
  const maxRadius = frameSize / 2;

  // Create a new frame for the radar graph
  const frame = figma.createFrame();
  frame.resize(frameSize, frameSize);
  figma.currentPage.appendChild(frame);

  const totalDataSets = input.dataSets.length;
  const angleIncrement = (2 * Math.PI) / totalDataSets;

  // Helper function to get a point on a circle given an angle and radius
  function getPointOnCircle(angle: number, radius: number) {
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  }

  // Draw spider-web pattern
  for (let i = 0.25; i <= 1; i += 0.25) {
    const polygonPoints: string[] = [];
    for (let j = 0; j < totalDataSets; j++) {
      const angle = j * angleIncrement;
      const point = getPointOnCircle(angle, i * maxRadius);
      polygonPoints.push(`${point.x},${point.y}`);

      // Draw line from center to point for the outermost circle
      if (i === 1) {
        const vector = figma.createVector();
        vector.vectorNetwork = {
          vertices: [
            { x: centerX, y: centerY },
            { x: point.x, y: point.y }
          ],
          segments: [{ start: 0, end: 1}]
        };
        frame.appendChild(vector);
        
      }
    }
    const vectorPolygon = figma.createVector();
    vectorPolygon.vectorNetwork = {
      vertices: polygonPoints.map(point => {
        const [x, y] = point.split(',').map(Number);
        return { x, y };
      }),
      segments: Array(polygonPoints.length - 1).fill(0).map((_, i) => {
        return { start: i, end: i + 1 };
      }).concat({ start: polygonPoints.length - 1, end: 0 }) // To close the polygon
    };
    frame.appendChild(vectorPolygon);
    
  }

  // Draw radar chart polygon
  const radarPolygonPoints: string[] = [];
  for (let i = 0; i < totalDataSets; i++) {
    const dataSet = input.dataSets[i];
    const radius = ((dataSet.value - input.minValue) / (input.maxValue - input.minValue)) * maxRadius;
    const angle = i * angleIncrement;
    const point = getPointOnCircle(angle, radius);
    radarPolygonPoints.push(`${point.x},${point.y}`);

    // Draw circle on each data point
    const circle = figma.createEllipse();
    circle.resize(10, 10);
    circle.x = point.x - 5; // Adjust for circle's size
    circle.y = point.y - 5;
    frame.appendChild(circle);
  }
  const radarVectorPolygon = figma.createVector();
  radarVectorPolygon.vectorNetwork = {
    vertices: radarPolygonPoints.map(point => {
      const [x, y] = point.split(',').map(Number);
      return { x, y };
    }),
    segments: Array(radarPolygonPoints.length - 1).fill(0).map((_, i) => {
      return { start: i, end: i + 1 };
    }).concat({ start: radarPolygonPoints.length - 1, end: 0 }) // To close the polygon
  };
  
  radarVectorPolygon.strokes = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]; // Set color based on input
  radarVectorPolygon.opacity = 0.1;
  frame.appendChild(radarVectorPolygon);
}

// Sample call
const sampleInput: RadarGraphInput = {
  color: "#FF0000",
  minValue: 0,
  maxValue: 100,
  dataSets: [
    { name: "A", value: 50 },
    { name: "B", value: 75 },
    { name: "C", value: 30 },
    { name: "D", value: 60 }
  ]
};

createRadarGraph(sampleInput);

 }

// Runs this code if the plugin is run in FigJam
if (figma.editorType === 'figjam') {
  
};
