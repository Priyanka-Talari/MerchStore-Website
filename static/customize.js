// Product data
const products = [
  { id: 'tshirt', name: 'T-Shirt', image: '/static/images/pp1.webp', badge: 'New' },
  { id: 'cap', name: 'Cap', image: '/static/images/blackcap.jpg' },
  { id: 'polaroid', name: 'Polaroid', image: '/static/images/polaroidc.jpg' },
  { id: 'mug1', name: 'Mug', image: '/static/images/plainmug.jpg' },
  { id: 'hoodie', name: 'Hoodie', image: '/static/images/hoodiec.avif', badge: 'Trending' },
  { id: 'totebag', name: 'Tote Bag', image: '/static/images/totebagc.webp' },
  { id: 'pillow', name: 'Pillow', image: '/static/images/pillowc.jpg' },
  { id: 'diary', name: 'Diary Cover', image: '/static/images/diary.avif', badge: 'Hot' }
];

// DOM Elements
const productSection = document.getElementById('productSection');
const customizationSection = document.getElementById('customizationSection');
const productPreview = document.getElementById('productPreview');
const productTitle = document.getElementById('productTitle');
const textInput = document.getElementById('textInput');
const addTextBtn = document.getElementById('addTextBtn');
const clearCanvasBtn = document.getElementById('clearCanvasBtn');
const saveDesignBtn = document.getElementById('saveDesignBtn');
const backToProductsBtn = document.getElementById('backToProductsBtn');
const colorOptions = document.querySelectorAll('.color-option');
const fontSelect = document.getElementById('fontSelect');
const decreaseSize = document.getElementById('decreaseSize');
const increaseSize = document.getElementById('increaseSize');
const fontSize = document.getElementById('fontSize');
const imageUpload = document.getElementById('imageUpload');

// Canvas setup
const canvas = document.getElementById('customCanvas');
const ctx = canvas.getContext('2d');
let canvasWidth = 500;
let canvasHeight = 500;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Customization variables
let selectedProduct = null;
let selectedColor = '#000000';
let selectedFontSize = 24;
let selectedFont = 'Arial';
let canvasElements = [];
let isDragging = false;
let dragTarget = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Variables for resizing
let selectedElement = null; // currently selected element (for drag/resize)
let isResizing = false;
let currentResizeHandle = null;

// Utility: Get text bounds for text elements
function getTextBounds(element) {
  ctx.font = element.font;
  const textWidth = ctx.measureText(element.content).width;
  return {
    left: element.x - textWidth / 2,
    top: element.y - element.fontSize,
    right: element.x + textWidth / 2,
    bottom: element.y
  };
}

// Utility: Check if mouse is near a resize handle (corner) of the selected element
function getResizeHandleAtPosition(x, y) {
  if (!selectedElement) return null;
  const handleSize = 10;
  let bounds;
  if (selectedElement.type === 'text') {
    bounds = getTextBounds(selectedElement);
  } else if (selectedElement.type === 'image') {
    bounds = {
      left: selectedElement.x - selectedElement.width / 2,
      top: selectedElement.y - selectedElement.height / 2,
      right: selectedElement.x + selectedElement.width / 2,
      bottom: selectedElement.y + selectedElement.height / 2
    };
  }
  if (!bounds) return null;
  if (Math.abs(x - bounds.left) <= handleSize && Math.abs(y - bounds.top) <= handleSize) {
    return { element: selectedElement, handle: 'nw' };
  }
  if (Math.abs(x - bounds.right) <= handleSize && Math.abs(y - bounds.top) <= handleSize) {
    return { element: selectedElement, handle: 'ne' };
  }
  if (Math.abs(x - bounds.left) <= handleSize && Math.abs(y - bounds.bottom) <= handleSize) {
    return { element: selectedElement, handle: 'sw' };
  }
  if (Math.abs(x - bounds.right) <= handleSize && Math.abs(y - bounds.bottom) <= handleSize) {
    return { element: selectedElement, handle: 'se' };
  }
  return null;
}

// Update cursor style based on position (shows resize cursor near handles)
function updateCursorStyle(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const resizeHandleInfo = getResizeHandleAtPosition(mouseX, mouseY);
  if (resizeHandleInfo) {
    if (resizeHandleInfo.handle === 'nw' || resizeHandleInfo.handle === 'se') {
      canvas.style.cursor = 'nwse-resize';
    } else if (resizeHandleInfo.handle === 'ne' || resizeHandleInfo.handle === 'sw') {
      canvas.style.cursor = 'nesw-resize';
    }
  } else {
    canvas.style.cursor = 'default';
  }
}

// Initialize page
function init() {
  loadProducts();
  setupEventListeners();
  renderCanvas();
}

// Load product cards
function loadProducts() {
  productSection.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    let badgeHTML = '';
    if (product.badge) {
      badgeHTML = `<div class="product-badge">${product.badge}</div>`;
    }
    card.innerHTML = `
      ${badgeHTML}
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/200x200?text=Image+Not+Found'">
      <div class="product-info">
        <div class="product-name">${product.name}</div>
      </div>
    `;
    productSection.appendChild(card);
  });
}

// Setup event listeners
function setupEventListeners() {
  productSection.addEventListener('click', function(e) {
    const card = e.target.closest('.product-card');
    if (card) {
      selectProduct(card.dataset.productId);
    }
  });

  addTextBtn.addEventListener('click', function() {
    addTextToCanvas(textInput.value);
    textInput.value = '';
  });

  textInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTextToCanvas(textInput.value);
      textInput.value = '';
    }
  });

  fontSelect.addEventListener('change', function() {
    selectedFont = fontSelect.value;
  });

  decreaseSize.addEventListener('click', function() {
    if (selectedFontSize > 12) {
      selectedFontSize -= 2;
      fontSize.textContent = selectedFontSize;
    }
  });

  increaseSize.addEventListener('click', function() {
    if (selectedFontSize < 72) {
      selectedFontSize += 2;
      fontSize.textContent = selectedFontSize;
    }
  });

  clearCanvasBtn.addEventListener('click', function() {
    canvasElements = [];
    renderCanvas();
  });

  saveDesignBtn.addEventListener('click', function() {
    saveDesign();
  });

  async function saveDesign() {
    const canvas = document.getElementById('customCanvas'); 
    const productName = document.getElementById('productTitle').innerText;
    
    if (!canvas) {
        alert("Canvas not found!");
        return;
    }

    // Convert canvas to image URL (base64)
    const imageData = canvas.toDataURL("image/png");

    // Upload the image to Firebase Storage
    const storageRef = ref(storage, `designs/${Date.now()}.png`);
    await uploadString(storageRef, imageData, 'data_url');

    // Get the uploaded image URL
    const imageUrl = await getDownloadURL(storageRef);

    // Save data to Firestore
    try {
        const docRef = await addDoc(collection(db, "custom_designs"), {
            productName: productName,
            imageUrl: imageUrl,
            timestamp: new Date()
        });
        alert("Design saved successfully!");
    } catch (error) {
        console.error("Error saving design:", error);
        alert("Failed to save design.");
    }
}

  backToProductsBtn.addEventListener('click', function() {
    showProductSection();
  });

  colorOptions.forEach(option => {
    option.addEventListener('click', function() {
      colorOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      selectedColor = option.dataset.color;
    });
  });

  imageUpload.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = function(event) {
        addImageToCanvas(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  canvas.addEventListener('mousedown', handleCanvasMouseDown);
  canvas.addEventListener('mousemove', handleCanvasMouseMove)
  canvas.addEventListener('mouseup', handleCanvasMouseUp);
  canvas.addEventListener('mouseout', handleCanvasMouseUp);
  canvas.addEventListener('mousemove', updateCursorStyle);

  canvas.addEventListener('touchstart', handleCanvasTouchStart);
  canvas.addEventListener('touchmove', handleCanvasTouchMove);
  canvas.addEventListener('touchend', handleCanvasTouchEnd);
}

// Select product and show customization
function selectProduct(productId) {
  selectedProduct = products.find(p => p.id === productId);
  if (selectedProduct) {
    productTitle.textContent = selectedProduct.name;
    productPreview.src = selectedProduct.image;
    productPreview.onerror = function() {
      this.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
    };
    customizationSection.classList.add('active');
    customizationSection.scrollIntoView({ behavior: 'smooth' });
    canvasElements = [];
    renderCanvas();
  }
}

// Add text to canvas
function addTextToCanvas(text) {
  if (!text.trim()) return;
  const textElement = {
    type: 'text',
    content: text,
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    color: selectedColor,
    font: `${selectedFontSize}px ${selectedFont}`,
    fontSize: selectedFontSize,
    fontFamily: selectedFont,
    draggable: true
  };
  canvasElements.push(textElement);
  selectedElement = textElement; // select new element
  renderCanvas();
}

// Add image to canvas
function addImageToCanvas(imageSrc) {
  const img = new Image();
  img.src = imageSrc;
  img.onload = function() {
    let width = img.width;
    let height = img.height;
    const maxDimension = 150;
    if (width > height) {
      if (width > maxDimension) {
        height = height * (maxDimension / width);
        width = maxDimension;
      }
    } else {
      if (height > maxDimension) {
        width = width * (maxDimension / height);
        height = maxDimension;
      }
    }
    const imageElement = {
      type: 'image',
      content: img,
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      width: width,
      height: height,
      draggable: true
    };
    canvasElements.push(imageElement);
    selectedElement = imageElement; // select new image
    renderCanvas();
  };
  img.onerror = function() {
    alert('Error loading image. Please try another one.');
  };
}

// Render all elements on canvas
function renderCanvas() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  canvasElements.forEach(element => {
    if (element.type === 'text') {
      ctx.font = element.font;
      ctx.fillStyle = element.color;
      ctx.textAlign = 'center';
      ctx.fillText(element.content, element.x, element.y);
    } else if (element.type === 'image') {
      ctx.drawImage(
        element.content,
        element.x - element.width / 2,
        element.y - element.height / 2,
        element.width,
        element.height
      );
    }
  });
}

// Save design
function saveDesign() {
  alert('Design saved! In production, this would save your design.');
}

// Show product section
function showProductSection() {
  customizationSection.classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mouse down handler for dragging/resizing
function handleCanvasMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // First, check if clicking near a resize handle of the selected element
  const resizeInfo = getResizeHandleAtPosition(mouseX, mouseY);
  if (resizeInfo) {
    selectedElement = resizeInfo.element;
    isResizing = true;
    currentResizeHandle = resizeInfo.handle;
    return;
  }
  
  // Otherwise, check if clicking on an element for dragging
  for (let i = canvasElements.length - 1; i >= 0; i--) {
    const element = canvasElements[i];
    if (element.type === 'text' && element.draggable) {
      ctx.font = element.font;
      const textWidth = ctx.measureText(element.content).width;
      if (
        mouseX > element.x - textWidth / 2 &&
        mouseX < element.x + textWidth / 2 &&
        mouseY > element.y - element.fontSize &&
        mouseY < element.y
      ) {
        isDragging = true;
        dragTarget = element;
        dragOffsetX = mouseX - element.x;
        dragOffsetY = mouseY - element.y;
        selectedElement = element;
        return;
      }
    } else if (element.type === 'image' && element.draggable) {
      if (
        mouseX > element.x - element.width / 2 &&
        mouseX < element.x + element.width / 2 &&
        mouseY > element.y - element.height / 2 &&
        mouseY < element.y + element.height / 2
      ) {
        isDragging = true;
        dragTarget = element;
        dragOffsetX = mouseX - element.x;
        dragOffsetY = mouseY - element.y;
        selectedElement = element;
        return;
      }
    }
  }
}

// Mouse move handler for dragging/resizing
function handleCanvasMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  if (isResizing && selectedElement) {
    if (selectedElement.type === 'image') {
      const left = selectedElement.x - selectedElement.width / 2;
      const right = selectedElement.x + selectedElement.width / 2;
      const top = selectedElement.y - selectedElement.height / 2;
      const bottom = selectedElement.y + selectedElement.height / 2;
      let newLeft = left, newRight = right, newTop = top, newBottom = bottom;
      if (currentResizeHandle === 'nw') {
        newLeft = mouseX;
        newTop = mouseY;
      } else if (currentResizeHandle === 'ne') {
        newRight = mouseX;
        newTop = mouseY;
      } else if (currentResizeHandle === 'sw') {
        newLeft = mouseX;
        newBottom = mouseY;
      } else if (currentResizeHandle === 'se') {
        newRight = mouseX;
        newBottom = mouseY;
      }
      const newWidth = newRight - newLeft;
      const newHeight = newBottom - newTop;
      selectedElement.x = newLeft + newWidth / 2;
      selectedElement.y = newTop + newHeight / 2;
      selectedElement.width = newWidth;
      selectedElement.height = newHeight;
    } else if (selectedElement.type === 'text') {
      const bounds = getTextBounds(selectedElement);
      let newLeft = bounds.left, newRight = bounds.right, newTop = bounds.top, newBottom = bounds.bottom;
      if (currentResizeHandle === 'nw') {
        newLeft = mouseX;
        newTop = mouseY;
      } else if (currentResizeHandle === 'ne') {
        newRight = mouseX;
        newTop = mouseY;
      } else if (currentResizeHandle === 'sw') {
        newLeft = mouseX;
        newBottom = mouseY;
      } else if (currentResizeHandle === 'se') {
        newRight = mouseX;
        newBottom = mouseY;
      }
      const newWidth = newRight - newLeft;
      const newHeight = newBottom - newTop;
      // Update font size roughly based on new height
      selectedElement.fontSize = Math.max(10, newHeight);
      selectedElement.font = `${selectedElement.fontSize}px ${selectedElement.fontFamily}`;
      selectedElement.x = newLeft + newWidth / 2;
      selectedElement.y = newTop + newHeight;
    }
    renderCanvas();
    return;
  }
  if (isDragging && dragTarget) {
    dragTarget.x = mouseX - dragOffsetX;
    dragTarget.y = mouseY - dragOffsetY;
    renderCanvas();
  }
}

// Mouse up handler
function handleCanvasMouseUp(e) {
  isDragging = false;
  isResizing = false;
  dragTarget = null;
  currentResizeHandle = null;
}

// Touch event handlers
function handleCanvasTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  handleCanvasMouseDown(mouseEvent);
}

function handleCanvasTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  handleCanvasMouseMove(mouseEvent);
}

function handleCanvasTouchEnd(e) {
  e.preventDefault();
  const mouseEvent = new MouseEvent('mouseup', {});
  handleCanvasMouseUp(mouseEvent);
}

window.onload = init;