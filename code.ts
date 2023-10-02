
// Show the UI
figma.showUI(__html__, { width: 400, height: 780 });

// Listen to messages from the UI
figma.ui.onmessage = msg => {
  if (msg.type === 'submitData') {
    const inputData: RadarGraphInput = {
      color: msg.data.color, // Updated to get the color from the UI
      rounding: msg.data.rounding, // New field
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
  rounding: number; // New field for the rounding input
  minValue: number;
  maxValue: number;
  dataSets: DataSet[];
  showDataValue: boolean;
  showDataPoints: boolean;
};


// Create the radar graph based on the given input
async function createRadarGraph(input: RadarGraphInput) {
  
  //Awaiting font load for text
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  
  const color = hexToRgb(input.color);

  const cornerRadius = input.rounding; // Get the rounding value

  const spiderPolygonColor = hexToRgb("F1F1F1");
  const frameSize = 500;
  const centerX = 250; //frameSize / 2;
  const centerY = 250; //frameSize / 2;
  const maxRadius = 200 //frameSize / 2;

  const scaleDivision = (input.maxValue - input.minValue) / 5;


  // Create a new frame for the radar graph
// Create a new frame for the radar graph
const frame = figma.createFrame();
frame.name = 'Radar Chart';
frame.resize(frameSize, frameSize);
if (figma.editorType === 'figma') {
  frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
}
else if(figma.editorType === 'figjam'){
  frame.fills = [];
}

// Get the current viewport center
const viewportCenterX = figma.viewport.center.x;
const viewportCenterY = figma.viewport.center.y;

// Adjust the position of the radar chart frame to the viewport center
frame.x = viewportCenterX - frame.width / 2;
frame.y = viewportCenterY - frame.height / 2;

// Other settings and appending the frame
frame.constraints = {
    horizontal: "SCALE",
    vertical: "SCALE"
};
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

  const radarPolygonPoints: string[] = [];
  for (let i = 0; i < totalDataSets; i++) {
    const dataSet = input.dataSets[i];
    const radius = ((dataSet.value - input.minValue) / (input.maxValue - input.minValue)) * maxRadius;
    const angle = i * angleIncrement + (3 * Math.PI / 2);
    const point = getPointOnCircle(angle, radius);
    radarPolygonPoints.push(`${point.x},${point.y}`);
  }

  let divisionMultipler = 1;
  
  // Draw spider-web pattern
  for (let i = 0.2; i <= 1; i += 0.2) {
    const polygonPoints: string[] = [];
    for (let j = 0; j < totalDataSets; j++) {
      const angle = j * angleIncrement + (3 * Math.PI / 2);
      const point = getPointOnCircle(angle, i * maxRadius);

      // Create text labels for the data scale
      if(input.showDataValue) {
      if(j==0){
        const labelOffset = -15; // Adjust as necessary
        const labelText = figma.createText();
        if(i==0.2){
          labelText.characters = String(input.minValue + scaleDivision);
        }
        else if(i==1){
          labelText.characters = String(input.maxValue);
        }
        else{
          // limiting the decimal place of the values to 1
          const labelValue = Number((input.minValue +(scaleDivision * divisionMultipler)).toFixed(1));
          labelText.characters = String(labelValue);
        }
        //labelText.characters = String(input.dataSets[j].value);
        labelText.fontName = { family: "Inter", style: "Bold" };
        labelText.fontSize = 12;
        labelText.fills = [{ type: 'SOLID', color: spiderPolygonColor }];
        labelText.x = point.x + Math.cos(angle) * labelOffset - labelText.width / 2;
        labelText.y = point.y + Math.sin(angle) * labelOffset - labelText.height / 2;
        labelText.constraints = {
          horizontal: "SCALE",
          vertical: "SCALE"
      };
        frame.appendChild(labelText);
        divisionMultipler++;
      }
      }
      if (i == 1) {
        // Creating text labels

        const labelOffset = 25; // Adjust as necessary
        const labelText = figma.createText();
        labelText.characters = input.dataSets[j].name;
        labelText.fontName = { family: "Inter", style: "Medium" };
        labelText.fontSize = 12;
        labelText.x = point.x + Math.cos(angle) * labelOffset - labelText.width / 2;
        labelText.y = point.y + Math.sin(angle) * labelOffset - labelText.height / 2;
        labelText.constraints = {
          horizontal: "SCALE",
          vertical: "SCALE"
      };
        frame.appendChild(labelText);

      }
      polygonPoints.push(`${point.x},${point.y}`);

      // Creating lines from center to the circle
      if(!input.showDataValue){
      if (i === 1) {
        const vector = figma.createVector();
        vector.vectorNetwork = {
          vertices: [
            { x: centerX, y: centerY },
            { x: point.x, y: point.y }
          ],
          segments: [{ start: 0, end: 1 }]
        };
        vector.strokes = [{ type: 'SOLID', color: spiderPolygonColor }];
        vector.strokeWeight = 2;
        frame.appendChild(vector);
        vector.constraints = {
          horizontal: "SCALE",
          vertical: "SCALE"
        };
      }
    }
    }

    //Create the spider polygon
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

    vectorPolygon.strokes = [{ type: 'SOLID', color: spiderPolygonColor }];
    vectorPolygon.strokeWeight = 2;
    vectorPolygon.strokeJoin = "ROUND";

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
  radarFillPolygon.cornerRadius = cornerRadius;
  
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
  radarStrokePolygon.strokeJoin = "ROUND";
  radarStrokePolygon.cornerRadius = cornerRadius;


  frame.appendChild(radarStrokePolygon);
  radarStrokePolygon.constraints = {
    horizontal: "SCALE",
    vertical: "SCALE"
  };

  if(input.showDataPoints){
  // Draw circles on data points
  for (let i = 0; i < totalDataSets; i++) {
    const dataSet = input.dataSets[i];
    const radius = ((dataSet.value - input.minValue) / (input.maxValue - input.minValue)) * maxRadius;
    const angle = i * angleIncrement + (3 * Math.PI / 2);
    const point = getPointOnCircle(angle, radius);

    // Draw circle on each data point
    const circle = figma.createEllipse();
    circle.resize(12, 12);
    circle.x = point.x - 6; // Adjust for circle's size
    circle.y = point.y - 6;
    circle.fills = [{ type: 'SOLID', color: color }];
    frame.appendChild(circle);
    circle.constraints = {
      horizontal: "SCALE",
      vertical: "SCALE"
    };
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