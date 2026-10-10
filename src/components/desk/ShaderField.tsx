import { useEffect, useRef } from "react";

const PLATE_VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const PLATE_FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform int uMode;
uniform sampler2D uTex;

float kick(float t) {
  return 0.5 + 0.5 * sin(t * 0.65);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 suv = vec2(uv.x, 1.0 - uv.y);
  float k = kick(uTime);
  vec2 p = suv;
  if (uMode == 2) {
    p.x += 0.018 * sin(suv.y * 16.0 + uTime * 1.3);
    p.y += 0.014 * sin(suv.x * 12.0 - uTime * 0.9);
  }
  p = clamp(p, 0.001, 0.999);
  vec3 col = texture2D(uTex, p).rgb;
  float pocket = smoothstep(0.12, 0.62, length((uv - vec2(0.5, 0.46)) * vec2(1.15, 1.35)));
  col *= mix(0.62, 1.0, pocket);
  col += vec3(0.85, 0.9, 0.86) * k * 0.08 * smoothstep(0.45, 0.0, length(uv - vec2(0.18, 0.28)));
  if (uMode == 0 || uMode == 2) {
    float amp = 0.018 + 0.055 * k;
    float wave = 0.58 + amp * sin(uv.x * 22.0 + uTime * 11.0) * sin(uv.x * 3.14159);
    float ghost = 0.62 + 0.02 * sin(uv.x * 14.0 - uTime * 6.0) * sin(uv.x * 3.14159);
    col += vec3(0.91, 0.89, 0.83) * smoothstep(0.012, 0.0, abs(uv.y - wave));
    col += vec3(0.72, 0.60, 0.42) * smoothstep(0.008, 0.0, abs(uv.y - ghost));
  }
  if (uMode == 1) {
    float span = 0.012;
    if (uv.x > 0.02 && uv.x < 0.20) {
      float cell = (uv.x - 0.02) / span;
      float coln = floor(cell);
      if (fract(cell) < 0.62) {
        float wob = abs(sin(coln * 0.85 + uTime * 8.0));
        float walk = abs(sin(uTime * 3.2 - coln * 0.35));
        float mag = clamp(0.12 + 0.88 * (0.55 * k + 0.25 * wob + 0.20 * walk), 0.0, 1.0);
        float top = 0.80 - 0.46 * mag;
        if (uv.y > top && uv.y < 0.80) col = mix(col, vec3(0.91, 0.89, 0.83), 0.85);
      }
    }
    if (uv.x > 0.80 && uv.x < 0.98) {
      float cell = (uv.x - 0.80) / span;
      float coln = floor(cell);
      if (fract(cell) < 0.62) {
        float wob = abs(sin(coln * 1.05 + 2.0 + uTime * 9.0));
        float walk = abs(sin(uTime * 3.6 + coln * 0.4));
        float mag = clamp(0.10 + 0.90 * (0.60 * k + 0.22 * wob + 0.18 * walk), 0.0, 1.0);
        float top = 0.80 - 0.46 * mag;
        if (uv.y > top && uv.y < 0.80) col = mix(col, vec3(0.77, 0.19, 0.16), 0.88);
      }
    }
  }
  if (uMode == 0) {
    float scan = fract(uTime * 0.08);
    col += vec3(0.91, 0.89, 0.83) * smoothstep(0.004, 0.0, abs(uv.x - scan)) * 0.35 * pocket;
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

const DISP_VERT = `
precision mediump float;
attribute vec2 aUv;
uniform float uTime;
varying vec2 vUv;
varying float vH;

float kick(float t) {
  return 0.5 + 0.5 * sin(t * 0.65);
}

void main() {
  float k = kick(uTime);
  float edge = smoothstep(0.08, 0.48, length(aUv - vec2(0.5)));
  float h = sin(aUv.x * 9.0 + uTime * 1.5) * sin(aUv.y * 7.0 - uTime * 0.8);
  h += k * sin(aUv.x * 22.0 + aUv.y * 5.0);
  h *= 0.28 * (0.2 + edge);
  vec3 p = vec3((aUv.x - 0.5) * 2.6, (aUv.y - 0.52) * 1.55 + h, 0.0);
  float ct = 0.9;
  float st = 0.44;
  float y = p.y * ct;
  float z = 1.85 + p.y * st;
  gl_Position = vec4(p.x * 1.7, y * 2.05, (z - 1.2) / 2.0, z);
  vUv = vec2(aUv.x, 1.0 - aUv.y);
  vH = h;
}
`;

const DISP_FRAG = `
precision mediump float;
uniform sampler2D uTex;
varying vec2 vUv;
varying float vH;
void main() {
  vec3 col = texture2D(uTex, clamp(vUv, 0.001, 0.999)).rgb;
  col += vec3(0.91, 0.89, 0.83) * smoothstep(0.01, 0.14, vH);
  col += vec3(0.55, 0.16, 0.14) * smoothstep(0.0, -0.1, vH) * 0.45;
  gl_FragColor = vec4(col, 1.0);
}
`;

const POINT_VERT = `
precision mediump float;
attribute vec2 aSeed;
uniform float uTime;
uniform vec2 uRes;
varying float vBright;
varying float vWarm;

float kick(float t) {
  return 0.5 + 0.5 * sin(t * 0.65);
}

void main() {
  float k = kick(uTime);
  float ang = aSeed.x * 6.28318 + uTime * (0.12 + aSeed.y * 0.55);
  float rad = 0.22 + aSeed.y * 0.9 + k * 0.06;
  vec2 p = vec2(cos(ang) * rad, sin(ang) * rad * 0.52);
  gl_Position = vec4(p, 0.0, 1.0);
  gl_PointSize = (2.5 + aSeed.x * 11.0) * (0.55 + k) * (uRes.y / 800.0);
  vBright = 0.25 + 0.75 * aSeed.y;
  vWarm = aSeed.x;
}
`;

const POINT_FRAG = `
precision mediump float;
varying float vBright;
varying float vWarm;
void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.12, d) * (0.35 + 0.65 * vBright);
  vec3 cream = vec3(0.91, 0.89, 0.83);
  vec3 red = vec3(0.77, 0.19, 0.16);
  vec3 col = mix(red, cream, vWarm);
  gl_FragColor = vec4(col, a);
}
`;

const RIBBON_VERT = `
precision mediump float;
attribute vec2 aRib;
uniform float uTime;
varying float vAlong;

float kick(float t) {
  return 0.5 + 0.5 * sin(t * 0.65);
}

void main() {
  float t = aRib.x;
  float side = aRib.y;
  float k = kick(uTime);
  float amp = 0.05 + 0.09 * k;
  float y = amp * sin(t * 20.0 + uTime * 7.0) + 0.02 * sin(t * 46.0 - uTime * 12.0);
  float dy = amp * 20.0 * cos(t * 20.0 + uTime * 7.0);
  vec2 tangent = normalize(vec2(2.0, dy));
  vec2 normal = vec2(-tangent.y, tangent.x);
  vec2 pos = vec2(t * 2.0 - 1.0, y - 0.08) + normal * side * (0.007 + 0.012 * k);
  gl_Position = vec4(pos, 0.0, 1.0);
  vAlong = t;
}
`;

const RIBBON_FRAG = `
precision mediump float;
varying float vAlong;
void main() {
  vec3 cream = vec3(0.91, 0.89, 0.83);
  vec3 brass = vec3(0.72, 0.60, 0.42);
  gl_FragColor = vec4(mix(brass, cream, 0.5 + 0.5 * sin(vAlong * 18.0)), 0.9);
}
`;

const STUDY_FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform int uMode;
uniform sampler2D uTex;

float kick(float t) {
  return 0.5 + 0.5 * sin(t * 0.65);
}

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 suv = vec2(uv.x, 1.0 - uv.y);
  float k = kick(uTime);
  vec3 col = texture2D(uTex, clamp(suv, 0.001, 0.999)).rgb;

  if (uMode == 6) {
    float e = 0.0035;
    float h = luma(col);
    float hx = luma(texture2D(uTex, clamp(suv + vec2(e, 0.0), 0.001, 0.999)).rgb);
    float hy = luma(texture2D(uTex, clamp(suv + vec2(0.0, e), 0.001, 0.999)).rgb);
    vec3 n = normalize(vec3(h - hx, hy - h, 0.16));
    vec3 L = normalize(vec3(sin(uTime * 0.6) * 0.7, 0.42, 0.85));
    float ndl = clamp(dot(n, L), 0.0, 1.0);
    float rim = pow(1.0 - ndl, 2.0);
    col = col * (0.25 + 1.2 * ndl) + vec3(0.91, 0.89, 0.83) * rim * 0.22;
    col += vec3(0.77, 0.19, 0.16) * pow(ndl, 3.0) * (0.15 + k);
  } else if (uMode == 7) {
    vec2 beacon = vec2(0.16, 0.72);
    float ring = abs(length(uv - beacon) - (0.075 + 0.04 * k)) - 0.0035;
    float bars = 8.0;
    if (uv.x < 0.22 || uv.x > 0.78) {
      float x0 = uv.x < 0.5 ? 0.03 : 0.80;
      float cell = floor((uv.x - x0) / 0.012);
      float cx = x0 + (cell + 0.32) * 0.012;
      float wob = abs(sin(cell * 0.9 + uTime * 8.0));
      float mag = clamp(0.12 + 0.88 * (0.58 * k + 0.42 * wob), 0.0, 1.0);
      float halfH = 0.02 + 0.22 * mag;
      bars = sdBox(uv - vec2(cx, 0.78 - halfH), vec2(0.0034, halfH));
    }
    float d = min(ring, bars);
    vec3 cream = vec3(0.91, 0.89, 0.83);
    vec3 red = vec3(0.77, 0.19, 0.16);
    vec3 ink = mix(red, cream, step(bars, ring));
    col = mix(col, ink, smoothstep(0.014, 0.0, d));
    col += ink * exp(-26.0 * max(d, 0.0)) * 0.5;
    float pocket = smoothstep(0.12, 0.58, length((uv - vec2(0.5, 0.46)) * vec2(1.15, 1.35)));
    col *= mix(0.7, 1.0, pocket);
  } else {
    vec2 q = suv - vec2(0.18, 0.28);
    float r = length(q);
    float a = atan(q.y, q.x);
    vec2 polar = vec2(fract(a / 6.28318 + uTime * 0.03), clamp(r * 1.55, 0.001, 0.999));
    col = texture2D(uTex, polar).rgb * smoothstep(1.05, 0.15, r);
    float band = abs(fract(r * 8.0 - uTime * 0.4) - 0.5);
    col += vec3(0.91, 0.89, 0.83) * smoothstep(0.12, 0.02, band) * 0.45;
    col += vec3(0.77, 0.19, 0.16) * smoothstep(0.03, 0.0, abs(r - (0.16 + 0.05 * k)));
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

const RAY_FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform int uMode;
uniform sampler2D uTex;

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

vec2 scene(vec3 p, int mode) {
  vec3 q = p;
  if (mode == 11) q.xz = mod(q.xz + 2.0, 4.0) - 2.0;
  float ground = p.y;
  float beacon = length(q - vec3(-1.15, 0.7, 2.4)) - 0.34;
  float mast = sdCapsule(q, vec3(1.2, 0.0, 2.8), vec3(1.55, 1.85, 2.8), 0.04);
  float lampA = length(q - vec3(1.5, 1.78, 2.8)) - 0.075;
  float lampB = length(q - vec3(1.68, 1.58, 2.8)) - 0.075;
  vec2 res = vec2(ground, 0.0);
  if (beacon < res.x) res = vec2(beacon, 1.0);
  if (mast < res.x) res = vec2(mast, 2.0);
  if (lampA < res.x) res = vec2(lampA, 3.0);
  if (lampB < res.x) res = vec2(lampB, 3.0);
  return res;
}

vec3 normalAt(vec3 p, int mode) {
  vec2 e = vec2(0.0025, 0.0);
  return normalize(vec3(
    scene(p + e.xyy, mode).x - scene(p - e.xyy, mode).x,
    scene(p + e.yxy, mode).x - scene(p - e.yxy, mode).x,
    scene(p + e.yyx, mode).x - scene(p - e.yyx, mode).x
  ));
}

float softShadow(vec3 ro, vec3 rd, int mode) {
  float res = 1.0;
  float t = 0.04;
  for (int i = 0; i < 14; i++) {
    float h = scene(ro + rd * t, mode).x;
    res = min(res, 12.0 * h / t);
    t += clamp(h, 0.03, 0.25);
    if (res < 0.01 || t > 5.0) break;
  }
  return clamp(res, 0.15, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float yaw = uTime * 0.035;
  float sy = sin(yaw);
  vec3 ro = vec3(sy * 0.85, 1.25, -0.35);
  vec3 ta = vec3(0.15, 0.55, 2.3);
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.55 * ww);

  float t = 0.02;
  float id = 0.0;
  float found = 0.0;
  for (int i = 0; i < 22; i++) {
    vec2 h = scene(ro + rd * t, uMode);
    if (h.x < 0.002) {
      found = 1.0;
      id = h.y;
      break;
    }
    t += h.x;
    if (t > 16.0) break;
  }

  vec3 skyUv = vec3(rd.x * 0.22 + 0.5, clamp(0.55 - rd.y * 0.35, 0.0, 1.0), 0.0);
  vec3 col = texture2D(uTex, skyUv.xy).rgb * 0.45;

  if (found > 0.5 && t < 16.0) {
    vec3 p = ro + rd * t;
    vec3 n = normalAt(p, uMode);
    vec3 L = normalize(vec3(-0.4, 0.85, 0.2));
    float diff = clamp(dot(n, L), 0.0, 1.0);
    float shade = 1.0;
    float occ = 1.0;
    if (uMode == 10) {
      shade = softShadow(p + n * 0.02, L, uMode);
      float sca = 1.0;
      occ = 0.0;
      for (int i = 0; i < 4; i++) {
        float h = 0.06 + 0.1 * float(i);
        occ += (h - scene(p + n * h, uMode).x) * sca;
        sca *= 0.65;
      }
      occ = clamp(1.0 - occ, 0.25, 1.0);
    }
    vec3 base = vec3(0.05, 0.055, 0.06);
    if (id < 0.5) {
      vec2 g = abs(fract(p.xz * 0.5) - 0.5);
      float line = smoothstep(0.04, 0.0, min(g.x, g.y));
      base = mix(vec3(0.035, 0.04, 0.042), vec3(0.16, 0.17, 0.15), line);
    } else if (id < 1.5) {
      base = vec3(0.91, 0.89, 0.83);
      diff = 1.0;
      shade = 1.0;
    } else if (id < 2.5) {
      base = vec3(0.12, 0.13, 0.14);
    } else {
      base = vec3(0.77, 0.16, 0.13);
      diff = 1.0;
      shade = 1.0;
    }
    col = base * (0.18 + diff * shade * occ);
    if (id > 0.5 && id < 1.5) col = vec3(0.95, 0.93, 0.86);
    if (id > 2.5) col = vec3(0.85, 0.18, 0.14);
    col = mix(col, vec3(0.02, 0.025, 0.03), 1.0 - exp(-0.045 * t * t));
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGLRenderingContext, vertSrc: string, fragSrc: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export type ShaderMode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export function ShaderField({ mode, plate: plateSrc = "/field-plate.jpg" }: { mode: ShaderMode; plate?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: true, powerPreference: "high-performance" });
    if (!gl) return;

    const plate = link(gl, PLATE_VERT, PLATE_FRAG);
    const displace = link(gl, DISP_VERT, DISP_FRAG);
    const points = link(gl, POINT_VERT, POINT_FRAG);
    const ribbon = link(gl, RIBBON_VERT, RIBBON_FRAG);
    const study = link(gl, PLATE_VERT, STUDY_FRAG);
    const ray = link(gl, PLATE_VERT, RAY_FRAG);
    if (!plate) return;

    const tri = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tri);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const cols = 64;
    const rows = 36;
    const uvs = new Float32Array((cols + 1) * (rows + 1) * 2);
    const idx = new Uint16Array(cols * rows * 6);
    let u = 0;
    for (let y = 0; y <= rows; y += 1) {
      for (let x = 0; x <= cols; x += 1) {
        uvs[u++] = x / cols;
        uvs[u++] = y / rows;
      }
    }
    let n = 0;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const i = y * (cols + 1) + x;
        idx[n++] = i;
        idx[n++] = i + 1;
        idx[n++] = i + cols + 1;
        idx[n++] = i + 1;
        idx[n++] = i + cols + 2;
        idx[n++] = i + cols + 1;
      }
    }
    const grid = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, grid);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const gridIdx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gridIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

    const seeds = new Float32Array(420 * 2);
    for (let i = 0; i < seeds.length; i += 1) seeds[i] = Math.random();
    const pointBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);

    const steps = 160;
    const rib = new Float32Array((steps + 1) * 4);
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      rib[i * 4] = t;
      rib[i * 4 + 1] = -1;
      rib[i * 4 + 2] = t;
      rib[i * 4 + 3] = 1;
    }
    const ribBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ribBuf);
    gl.bufferData(gl.ARRAY_BUFFER, rib, gl.STATIC_DRAW);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([8, 11, 14, 255]));
    let alive = true;
    const image = new Image();
    image.onload = () => {
      if (!alive) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    };
    image.src = plateSrc;

    const platePos = gl.getAttribLocation(plate, "aPos");
    const studyPos = study ? gl.getAttribLocation(study, "aPos") : -1;
    const rayPos = ray ? gl.getAttribLocation(ray, "aPos") : -1;
    const dispUv = displace ? gl.getAttribLocation(displace, "aUv") : -1;
    const pointSeed = points ? gl.getAttribLocation(points, "aSeed") : -1;
    const ribAttr = ribbon ? gl.getAttribLocation(ribbon, "aRib") : -1;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let stopped = false;
    const started = performance.now();

    const resize = () => {
      const dpr = Math.min(1, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const silence = () => {
      if (platePos >= 0) gl.disableVertexAttribArray(platePos);
      if (studyPos >= 0) gl.disableVertexAttribArray(studyPos);
      if (rayPos >= 0) gl.disableVertexAttribArray(rayPos);
      if (dispUv >= 0) gl.disableVertexAttribArray(dispUv);
      if (pointSeed >= 0) gl.disableVertexAttribArray(pointSeed);
      if (ribAttr >= 0) gl.disableVertexAttribArray(ribAttr);
    };

    const drawPlate = (which: number, time: number) => {
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.useProgram(plate);
      silence();
      gl.bindBuffer(gl.ARRAY_BUFFER, tri);
      gl.enableVertexAttribArray(platePos);
      gl.vertexAttribPointer(platePos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(gl.getUniformLocation(plate, "uRes"), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(plate, "uTime"), time);
      gl.uniform1i(gl.getUniformLocation(plate, "uMode"), which);
      gl.uniform1i(gl.getUniformLocation(plate, "uTex"), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const draw = () => {
      if (stopped) return;
      resize();
      const time = reduce.matches ? 0.4 : (performance.now() - started) / 1000;
      const which = modeRef.current;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      if (which === 3 && displace && dispUv >= 0) {
        gl.clearColor(0.031, 0.043, 0.055, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.useProgram(displace);
        silence();
        gl.bindBuffer(gl.ARRAY_BUFFER, grid);
        gl.enableVertexAttribArray(dispUv);
        gl.vertexAttribPointer(dispUv, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gridIdx);
        gl.uniform1f(gl.getUniformLocation(displace, "uTime"), time);
        gl.uniform1i(gl.getUniformLocation(displace, "uTex"), 0);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      } else if (which >= 6 && study && studyPos >= 0) {
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.useProgram(study);
        silence();
        gl.bindBuffer(gl.ARRAY_BUFFER, tri);
        gl.enableVertexAttribArray(studyPos);
        gl.vertexAttribPointer(studyPos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(gl.getUniformLocation(study, "uRes"), canvas.width, canvas.height);
        gl.uniform1f(gl.getUniformLocation(study, "uTime"), time);
        gl.uniform1i(gl.getUniformLocation(study, "uMode"), which);
        gl.uniform1i(gl.getUniformLocation(study, "uTex"), 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else if (which >= 9 && ray && rayPos >= 0) {
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.useProgram(ray);
        silence();
        gl.bindBuffer(gl.ARRAY_BUFFER, tri);
        gl.enableVertexAttribArray(rayPos);
        gl.vertexAttribPointer(rayPos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(gl.getUniformLocation(ray, "uRes"), canvas.width, canvas.height);
        gl.uniform1f(gl.getUniformLocation(ray, "uTime"), time);
        gl.uniform1i(gl.getUniformLocation(ray, "uMode"), which);
        gl.uniform1i(gl.getUniformLocation(ray, "uTex"), 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else {
        drawPlate(which > 2 ? 4 : which, time);
        if (which === 4 && points && pointSeed >= 0) {
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
          gl.useProgram(points);
          silence();
          gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
          gl.enableVertexAttribArray(pointSeed);
          gl.vertexAttribPointer(pointSeed, 2, gl.FLOAT, false, 0, 0);
          gl.uniform1f(gl.getUniformLocation(points, "uTime"), time);
          gl.uniform2f(gl.getUniformLocation(points, "uRes"), canvas.width, canvas.height);
          gl.drawArrays(gl.POINTS, 0, seeds.length / 2);
          gl.disable(gl.BLEND);
        } else if (which === 5 && ribbon && ribAttr >= 0) {
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.useProgram(ribbon);
          silence();
          gl.bindBuffer(gl.ARRAY_BUFFER, ribBuf);
          gl.enableVertexAttribArray(ribAttr);
          gl.vertexAttribPointer(ribAttr, 2, gl.FLOAT, false, 0, 0);
          gl.uniform1f(gl.getUniformLocation(ribbon, "uTime"), time);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, (steps + 1) * 2);
          gl.disable(gl.BLEND);
        }
      }

      if (!document.hidden && !reduce.matches) raf = requestAnimationFrame(draw);
    };

    const onVis = () => {
      if (!document.hidden && !reduce.matches) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }
    };

    raf = requestAnimationFrame(draw);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stopped = true;
      alive = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      gl.deleteTexture(tex);
      gl.deleteBuffer(tri);
      gl.deleteBuffer(grid);
      gl.deleteBuffer(gridIdx);
      gl.deleteBuffer(pointBuf);
      gl.deleteBuffer(ribBuf);
      gl.deleteProgram(plate);
      if (displace) gl.deleteProgram(displace);
      if (points) gl.deleteProgram(points);
      if (ribbon) gl.deleteProgram(ribbon);
      if (study) gl.deleteProgram(study);
      if (ray) gl.deleteProgram(ray);
    };
  }, [plateSrc]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
