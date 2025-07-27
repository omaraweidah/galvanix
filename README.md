# Galvanix - Premium Garage Doors

A modern, interactive website showcasing Galvanix garage doors with 3D animations.

## Setup Instructions

### Run the Application

```bash
# Start the local server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

## Features

- **Interactive 3D Garage Door**: Scroll to open/close the garage door
- **Realistic Animation**: Panels retract into the top housing like a real garage door
- **Responsive Design**: Works on all screen sizes
- **Smooth Scrolling**: Seamless navigation between sections

## File Structure

```
Galvanix/
├── index.html          # Main HTML file
├── script.js           # JavaScript with 3D animations
├── styles.css          # CSS styling
├── garage_door_01/     # 3D garage door model
│   ├── scene.gltf      # Main model file
│   ├── scene.bin       # Binary data
│   ├── textures/       # Model textures
│   └── license.txt     # Model license
└── assets/             # Images and other assets
```

## Animation Details

The garage door animation follows realistic retraction mechanics:
- Panels retract sequentially from bottom to top
- Each panel moves upward and slightly backward into the housing
- Smooth interpolation for realistic movement
- Scroll down to open, scroll up to close

## Troubleshooting

If the garage door model doesn't load:
1. Check that the `garage_door_01` folder contains all required files
2. Verify the file paths in `script.js`
3. Check browser console for loading errors
4. The app will fall back to a custom garage door if the model fails to load 