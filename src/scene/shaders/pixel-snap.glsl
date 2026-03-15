// Pixel snap vertex shader (optional enhancement)
// Snaps vertex positions to a virtual pixel grid for consistent pixel-art look
uniform float pixelSize;

void main() {
  vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  pos.xy = floor(pos.xy / pixelSize) * pixelSize;
  gl_Position = pos;
}
