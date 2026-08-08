#version 460 core
#include <flutter/runtime_effect.glsl>

precision mediump float;

uniform vec2 uSize;
uniform float uTime;
uniform vec2 uPointer;
uniform float uIntensity;

out vec4 fragColor;

vec3 spectrum(float hue) {
  vec3 phase = vec3(0.0, 0.66, 0.33);
  return 0.55 + 0.45 * cos(6.28318 * (hue + phase));
}

float noise(vec2 point) {
  return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 safeSize = max(uSize, vec2(1.0));
  vec2 uv = FlutterFragCoord().xy / safeSize;
  vec2 pointer = uPointer / safeSize;
  float sweep = uv.x * 0.72 + uv.y * 0.38 + uTime * 0.12;
  float pointerShift = (pointer.x - 0.5) * 0.35 + (pointer.y - 0.5) * 0.16;
  vec3 rainbow = spectrum(sweep + pointerShift);
  float beam = pow(
    max(0.0, 1.0 - abs(fract(sweep + pointerShift) - 0.5) * 5.0),
    2.0
  );
  float grain = noise(floor(uv * safeSize * 0.42) + floor(uTime * 8.0));
  float foil = mix(0.16, 0.62, beam) + grain * 0.12;
  float edge = smoothstep(0.72, 1.0, max(abs(uv.x - 0.5), abs(uv.y - 0.5)) * 2.0);
  float alpha = clamp((foil + edge * 0.22) * uIntensity, 0.0, 0.58);
  // Flutter expects premultiplied shader output. Keeping RGB proportional to
  // alpha preserves the card art instead of washing it out under plus blending.
  vec3 premultipliedFoil = (rainbow * 0.72 + beam * 0.2) * alpha;
  fragColor = vec4(premultipliedFoil, alpha);
}
