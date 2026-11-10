import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/**
 * One pass instead of two: FXAA + cinematic grade (S-curve, split toning,
 * vignette, grain) in a single fullscreen draw.
 */
const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uVignette: { value: 1.05 },
    uGrain: { value: 0.02 },
    uWarmth: { value: 0.045 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uWarmth;
    varying vec2 vUv;

    float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 rcp = 1.0 / resolution;
      vec3 rgbM  = texture2D(tDiffuse, vUv).rgb;
      vec3 rgbNW = texture2D(tDiffuse, vUv + vec2(-1.0, -1.0) * rcp).rgb;
      vec3 rgbNE = texture2D(tDiffuse, vUv + vec2( 1.0, -1.0) * rcp).rgb;
      vec3 rgbSW = texture2D(tDiffuse, vUv + vec2(-1.0,  1.0) * rcp).rgb;
      vec3 rgbSE = texture2D(tDiffuse, vUv + vec2( 1.0,  1.0) * rcp).rgb;

      float lM = luma(rgbM);
      float lNW = luma(rgbNW), lNE = luma(rgbNE), lSW = luma(rgbSW), lSE = luma(rgbSE);
      float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
      float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));

      vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
      float dirReduce = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);
      float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
      dir = clamp(dir * rcpDirMin, vec2(-8.0), vec2(8.0)) * rcp;

      vec3 rgbA = 0.5 * (
        texture2D(tDiffuse, vUv + dir * (1.0 / 3.0 - 0.5)).rgb +
        texture2D(tDiffuse, vUv + dir * (2.0 / 3.0 - 0.5)).rgb
      );
      vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture2D(tDiffuse, vUv - dir * 0.5).rgb +
        texture2D(tDiffuse, vUv + dir * 0.5).rgb
      );

      float lB = luma(rgbB);
      vec3 c = (lB < lMin || lB > lMax) ? rgbA : rgbB;

      // --- grade ---
      c = clamp(c, 0.0, 1.0);
      c = mix(c, c * c * (3.0 - 2.0 * c), 0.18);

      float l = luma(c);
      vec3 warm = vec3(uWarmth, uWarmth * 0.45, -uWarmth * 0.55);
      vec3 cool = vec3(-uWarmth * 0.55, -uWarmth * 0.15, uWarmth * 0.75);
      c += mix(cool, warm, smoothstep(0.25, 0.85, l)) * (0.55 + 0.45 * l);

      vec2 q = vUv - 0.5;
      float v = smoothstep(0.85, 0.18, length(q) * uVignette);
      c *= mix(0.62, 1.0, v);

      float g = hash(vUv * resolution + fract(uTime) * 137.0) - 0.5;
      c += g * uGrain;

      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

export function createComposer(renderer, scene, camera, options = {}) {
  const size = renderer.getSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
    samples: options.msaa ?? 0,
  });

  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(size.x, size.y);

  composer.addPass(new RenderPass(scene, camera));

  const BLOOM_SCALE = 0.5;
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(size.x * BLOOM_SCALE, size.y * BLOOM_SCALE),
    0.62, 0.85, 0.78
  );
  bloom.enabled = options.bloom !== false;
  composer.addPass(bloom);

  composer.addPass(new OutputPass());

  const finalPass = new ShaderPass(FinalShader);
  composer.addPass(finalPass);

  const setSize = (w, h) => {
    composer.setSize(w, h);
    bloom.setSize(w * BLOOM_SCALE, h * BLOOM_SCALE);
    const pr = renderer.getPixelRatio();
    finalPass.material.uniforms.resolution.value.set(w * pr, h * pr);
  };
  setSize(size.x, size.y);

  const setPixelRatio = (pr) => {
    composer.setPixelRatio(pr);
    composer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
    finalPass.material.uniforms.resolution.value.set(
      renderer.domElement.clientWidth * pr,
      renderer.domElement.clientHeight * pr
    );
  };

  return {
    composer,
    bloom,
    finalPass,
    render: (dt) => {
      finalPass.material.uniforms.uTime.value += dt;
      composer.render(dt);
    },
    setSize,
    setPixelRatio,
    setBloomEnabled: (on) => { bloom.enabled = on; },
  };
}
