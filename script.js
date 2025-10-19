const characters = "@%#*+=-:. ";
const imageUpload = document.getElementById("imageUpload");
const asciiDisplay = document.getElementById("asciiDisplay");
const hiddenCanvas = document.getElementById("hiddenCanvas");
const canvasContext = hiddenCanvas.getContext("2d");
const useColor = document.getElementById("useColor");
const widthSlider = document.getElementById("widthSlider");
const widthDisplay = document.getElementById("widthDisplay");
const saveButton = document.getElementById("saveButton");
const hiddenVideo = document.getElementById("hiddenVideo");
const videoControls = document.getElementById("videoControls");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const fpsSlider = document.getElementById("fpsSlider");
const fpsDisplay = document.getElementById("fpsDisplay");
const exportScale = document.getElementById("exportScale");
let uploadedImage = null;
let isVideo = false;
let videoInterval = null;


widthSlider.addEventListener("input", () => {
  widthDisplay.textContent = widthSlider.value;
  if (uploadedImage && !isVideo) convertToAscii();
});


useColor.addEventListener("change", () => {
  if (uploadedImage && !isVideo) convertToAscii();
});


fpsSlider.addEventListener("input", () => {
  fpsDisplay.textContent = fpsSlider.value;
  if (isVideo && videoInterval) {
    stopVideo();
    startVideo();
  }
});

// check if uploaded thingy is video or image and loads it for playback or converting

imageUpload.addEventListener("change", event => {
  const selectedFile = event.target.files[0];
  if (!selectedFile) return;
  
  stopVideo();
  
  if (selectedFile.type.startsWith("video/")) {
    isVideo = true;
    videoControls.style.display = "block";
    saveButton.style.display = "none";
    
    hiddenVideo.src = URL.createObjectURL(selectedFile);
    hiddenVideo.load();
    hiddenVideo.onloadeddata = () => {
      uploadedImage = hiddenVideo;
      startVideo();
    };
  } else {
    isVideo = false;
    videoControls.style.display = "none";
    
    uploadedImage = new Image();
    uploadedImage.onload = () => {
      convertToAscii();
      saveButton.style.display = "inline-block";
    };
    uploadedImage.src = URL.createObjectURL(selectedFile);
  }
});

// makes higher res png of displayed ascii art and triggers download

saveButton.addEventListener("click", () => {
  const preElement = document.getElementById("asciiDisplay");
  
  const scaleFactor = parseInt(exportScale.value);
  
  const exportCanvas = document.createElement("canvas");
  const exportContext = exportCanvas.getContext("2d");
  
  exportCanvas.width = preElement.scrollWidth * scaleFactor;
  exportCanvas.height = preElement.scrollHeight * scaleFactor;
  
  exportContext.fillStyle = "#111111";
  exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  
  exportContext.font = `${6 * scaleFactor}px monospace`;
  exportContext.textBaseline = "top";
  
  const textLines = preElement.innerHTML.split("\n");
  const verticalSpacing = 6 * scaleFactor;
  
  for (let lineIndex = 0; lineIndex < textLines.length; lineIndex++) {
    let currentLine = textLines[lineIndex];
    let horizontalPosition = 0;
    
    if (useColor.checked) {
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = currentLine;
      const coloredSpans = tempContainer.querySelectorAll("span");
      
      coloredSpans.forEach(span => {
        const textColor = span.style.color;
        const character = span.textContent;
        exportContext.fillStyle = textColor;
        exportContext.fillText(character, horizontalPosition * 3.6 * scaleFactor, lineIndex * verticalSpacing);
        horizontalPosition++;
      });
    } else {
      exportContext.fillStyle = "white";
      exportContext.fillText(currentLine, 0, lineIndex * verticalSpacing);
    }
  }
  
  exportCanvas.toBlob(imageBlob => {
    const downloadUrl = URL.createObjectURL(imageBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = "ascii-art.png";
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);
  });
});


playButton.addEventListener("click", () => {
  if (isVideo && hiddenVideo.paused) {
    hiddenVideo.play();
    if (!videoInterval) startVideo();
  }
});


pauseButton.addEventListener("click", () => {
  if (isVideo) {
    hiddenVideo.pause();
    stopVideo();
  }
});


function startVideo() {
  if (videoInterval) clearInterval(videoInterval);
  
  hiddenVideo.play();
  
  const framesPerSecond = parseInt(fpsSlider.value);
  videoInterval = setInterval(() => {
    convertToAscii();
  }, 1000 / framesPerSecond);
}


function stopVideo() {
  if (videoInterval) {
    clearInterval(videoInterval);
    videoInterval = null;
  }
}

// read pixel data from image or vid, convert each pixel's brightness to ascii char then build a string of ascii art

function convertToAscii() {
  if (!uploadedImage) return;
  
  const sourceWidth = isVideo ? hiddenVideo.videoWidth : uploadedImage.width;
  const sourceHeight = isVideo ? hiddenVideo.videoHeight : uploadedImage.height;
  
  if (!sourceWidth || !sourceHeight) return;
  
  const targetWidth = parseInt(widthSlider.value);
  const targetHeight = Math.floor(sourceHeight / sourceWidth * targetWidth * 0.55);
  
  hiddenCanvas.width = targetWidth;
  hiddenCanvas.height = targetHeight;
  canvasContext.drawImage(uploadedImage, 0, 0, targetWidth, targetHeight);
  
  const imagePixels = canvasContext.getImageData(0, 0, targetWidth, targetHeight);
  const pixelData = imagePixels.data;
  let asciiOutput = "";
  
  for (let row = 0; row < targetHeight; row++) {
    for (let column = 0; column < targetWidth; column++) {
      const pixelIndex = (row * targetWidth + column) * 4;
      const redValue = pixelData[pixelIndex];
      const greenValue = pixelData[pixelIndex + 1];
      const blueValue = pixelData[pixelIndex + 2];
      const pixelBrightness = 0.299 * redValue + 0.587 * greenValue + 0.114 * blueValue;
      const characterIndex = Math.floor((pixelBrightness / 255) * (characters.length - 1));
      const asciiCharacter = characters[characterIndex];
      
      if (useColor.checked) {
        asciiOutput += `<span style="color:rgb(${redValue},${greenValue},${blueValue})">${asciiCharacter}</span>`;
      } else {
        asciiOutput += asciiCharacter;
      }
    }
    asciiOutput += "\n";
  }
  
  asciiDisplay.innerHTML = asciiOutput;
}
