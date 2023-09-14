// Show the UI
figma.showUI(__html__, { width: 240, height: 100 });

// Listen to messages from the UI
figma.ui.onmessage = msg => {
    if (msg.type === 'generateRadarChart') {
        // Sample input
        const sampleInput: RadarGraphInput = {
            color: "#F24822",
            minValue: 0,
            maxValue: 100,
            dataSets: [
                { name: "A", value: 50 },
                { name: "B", value: 75 },
                { name: "C", value: 90 },
                { name: "D", value: 50 },
                { name: "E", value: 10 },
                { name: "F", value: 65 },
                { name: "G", value: 35 }
            ]
        };
        createRadarGraph(sampleInput);
    }
}

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
  const color = hexToRgb("#F24822");
  const strokeColor = hexToRgb("DBDBDB");
    const frameSize = 500;
    const centerX = 250; //frameSize / 2;
    const centerY = 250; //frameSize / 2;
    const maxRadius = 200 //frameSize / 2;
    
    

    // Create a new frame for the radar graph
    const frame = figma.createFrame();
    frame.resize(frameSize, frameSize);
    figma.currentPage.appendChild(frame);
    frame.constraints = {
        horizontal: "SCALE",
        vertical: "SCALE"
    };

    const totalDataSets = input.dataSets.length;
    const angleIncrement = (2 * Math.PI) / totalDataSets;

    // Helper function to get a point on a circle given an angle and radius
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
      const angle = i * angleIncrement;
      const point = getPointOnCircle(angle, radius);
      radarPolygonPoints.push(`${point.x},${point.y}`);
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
                    segments: [{ start: 0, end: 1 }]
                };
                vector.strokes = [{ type: 'SOLID', color: strokeColor }];
                vector.strokeWeight = 2 ;
                frame.appendChild(vector);
                vector.constraints = {
                    horizontal: "SCALE",
                    vertical: "SCALE"
                };
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
        vectorPolygon.strokes = [{ type: 'SOLID', color: strokeColor }];
        vectorPolygon.strokeWeight = 2 ;
        frame.appendChild(vectorPolygon);
        vectorPolygon.constraints = {
            horizontal: "SCALE",
            vertical: "SCALE"
        };
    }

    // Draw radar chart polygon for fill
    const radarFillPolygon = figma.createVector();
    radarFillPolygon.vectorNetwork = {
        vertices: radarPolygonPoints.map(point => {
            const [x, y] = point.split(',').map(Number);
            return { x, y };
        }),
        segments: Array(radarPolygonPoints.length - 1).fill(0).map((_, i) => {
            return { start: i, end: i + 1 };
        }).concat({ start: radarPolygonPoints.length - 1, end: 0 }) // To close the polygon
    };
    radarFillPolygon.fills = [{ type: 'SOLID', color: color }];
    radarFillPolygon.opacity = 0.3;
    frame.appendChild(radarFillPolygon);
    radarFillPolygon.constraints = {
        horizontal: "SCALE",
        vertical: "SCALE"
    };

    // Draw radar chart polygon for stroke
    const radarStrokePolygon = figma.createVector();
    //radarStrokePolygon.vectorNetwork = radarFillPolygon.vectorNetwork; // Use the same network
    radarStrokePolygon.vectorNetwork = {
      vertices: radarPolygonPoints.map(point => {
          const [x, y] = point.split(',').map(Number);
          return { x, y };
      }),
      segments: Array(radarPolygonPoints.length - 1).fill(0).map((_, i) => {
          return { start: i, end: i + 1 };
      }).concat({ start: radarPolygonPoints.length - 1, end: 0 }) // To close the polygon
  };
    
    radarStrokePolygon.strokes = [{ type: 'SOLID', color: color }];
    radarStrokePolygon.strokeWeight = 4;
    frame.appendChild(radarStrokePolygon);
    radarStrokePolygon.constraints = {
        horizontal: "SCALE",
        vertical: "SCALE"
    };

    // Draw circles on data points
    for (let i = 0; i < totalDataSets; i++) {
        const dataSet = input.dataSets[i];
        const radius = ((dataSet.value - input.minValue) / (input.maxValue - input.minValue)) * maxRadius;
        const angle = i * angleIncrement;
        const point = getPointOnCircle(angle, radius);

        // Draw circle on each data point
        const circle = figma.createEllipse();
        circle.resize(16, 16);
        circle.x = point.x - 8; // Adjust for circle's size
        circle.y = point.y - 8;
        circle.fills = [{ type: 'SOLID', color: color }];
        frame.appendChild(circle);
        circle.constraints = {
            horizontal: "SCALE",
            vertical: "SCALE"
        };
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