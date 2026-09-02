/* ==========================================================================
   بوابتك - Hero floor grid: engineering paper in raw WebGL (no library)
   One fullscreen quad, one fragment shader. A perspective floor of minor and
   major lines that starts at the datum line and converges into the gateway.
   Neutral colour, slow drift, no glow. Loaded lazily by main.js only when
   motion is allowed and the device is not low-end; renders only while the
   hero is on screen and the tab is visible. The static CSS grid stays as
   the fallback whenever this module does not run.
   ========================================================================== */

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_horizon;   /* datum line, as a fraction of the canvas height from the bottom */
uniform float u_vanish;    /* gateway centre, as a fraction of the canvas width from the left */
uniform vec3 u_color;

const float NEAR = 0.012;
const float X_SCALE = 3.2;
const float Z_SCALE = 2.2;
const float DRIFT = 0.12;
const float LINE_PX = 1.25;
const float MINOR = 0.09;
const float MAJOR = 0.22;

float line(float v, float halfWidth) {
  float d = abs(fract(v + 0.5) - 0.5);
  return 1.0 - smoothstep(0.0, halfWidth, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float below = u_horizon - uv.y;
  if (below <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float depth = 1.0 / (below + NEAR);
  float aspect = u_resolution.x / u_resolution.y;

  float px = (uv.x - u_vanish) * aspect * depth * X_SCALE;
  float pz = depth * Z_SCALE + u_time * DRIFT;

  /* world units per screen pixel, so lines stay about one pixel at every depth */
  float wx = aspect * depth * X_SCALE / u_resolution.x * LINE_PX;
  float wz = Z_SCALE * depth * depth / u_resolution.y * LINE_PX;

  float minor = max(line(px, wx), line(pz, wz));
  float major = max(line(px / 4.0, wx / 4.0), line(pz / 4.0, wz / 4.0));
  float alpha = max(minor * MINOR, major * MAJOR);

  /* fade where lines would alias near the datum, and quieten the far side so the copy stays clean */
  float fade = smoothstep(0.0, 0.12, below);
  float side = 1.0 - 0.55 * smoothstep(0.18, 0.62, abs(uv.x - u_vanish) * aspect);
  alpha *= fade * side;

  gl_FragColor = vec4(u_color * alpha, alpha);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

function createProgram(gl) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}`);
  }
  return program;
}

/* Neutral drafting-paper white with a trace of the brand's coolness */
const LINE_COLOR = [0.8, 0.84, 0.92];

export function initHeroGrid(host, options = {}) {
  const hero = host.closest('.hero') || host;
  const horizonEl = options.horizon || null;
  const anchorEl = options.anchor || null;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero__canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const gl =
    canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: 'low-power',
    }) || canvas.getContext('experimental-webgl');

  if (!gl) {
    throw new Error('WebGL not available');
  }

  const program = createProgram(gl);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    time: gl.getUniformLocation(program, 'u_time'),
    horizon: gl.getUniformLocation(program, 'u_horizon'),
    vanish: gl.getUniformLocation(program, 'u_vanish'),
    color: gl.getUniformLocation(program, 'u_color'),
  };

  gl.uniform3fv(uniforms.color, new Float32Array(LINE_COLOR));
  gl.uniform1f(uniforms.horizon, 0.3);
  gl.uniform1f(uniforms.vanish, 0.5);
  gl.clearColor(0, 0, 0, 0);

  const renderScale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;

  let width = 0;
  let height = 0;
  let frame = 0;
  let running = false;
  let visible = true;
  let destroyed = false;
  const start = performance.now();

  /* The datum line and the gateway are laid out by CSS; read where they landed
     and hand the fractions to the shader so the floor starts on the line and
     converges into the opening, in both text directions. */
  function anchor() {
    const hostRect = host.getBoundingClientRect();
    if (hostRect.width === 0 || hostRect.height === 0) return;

    let horizon = 0.3;
    if (horizonEl) {
      const baseRect = horizonEl.getBoundingClientRect();
      horizon = 1 - (baseRect.top - hostRect.top) / hostRect.height;
    }

    let vanish = 0.5;
    if (anchorEl) {
      const archRect = anchorEl.getBoundingClientRect();
      vanish = (archRect.left + archRect.width / 2 - hostRect.left) / hostRect.width;
    }

    gl.uniform1f(uniforms.horizon, Math.min(Math.max(horizon, 0.05), 0.95));
    gl.uniform1f(uniforms.vanish, Math.min(Math.max(vanish, -0.5), 1.5));
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width * renderScale));
    const nextHeight = Math.max(1, Math.round(rect.height * renderScale));
    if (nextWidth !== width || nextHeight !== height) {
      width = nextWidth;
      height = nextHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uniforms.resolution, width, height);
    }
    anchor();
  }

  function draw(now) {
    frame = 0;
    if (destroyed || !running) return;

    gl.uniform1f(uniforms.time, (now - start) / 1000);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    frame = requestAnimationFrame(draw);
  }

  function play() {
    if (destroyed || running) return;
    if (!visible || document.visibilityState !== 'visible') return;
    running = true;
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function pause() {
    running = false;
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') play();
    else pause();
  }

  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) play();
    else pause();
  });

  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(() => resize()) : null;

  function onContextLost(event) {
    event.preventDefault();
    destroy();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    pause();
    visibilityObserver.disconnect();
    if (resizeObserver) resizeObserver.disconnect();
    else window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    hero.classList.remove('has-gl');
    canvas.classList.remove('is-ready');
    const loseContext = gl.getExtension('WEBGL_lose_context');
    if (loseContext) loseContext.loseContext();
    window.setTimeout(() => canvas.remove(), 1000);
  }

  host.appendChild(canvas);
  resize();

  if (resizeObserver) {
    resizeObserver.observe(host);
    if (horizonEl) resizeObserver.observe(horizonEl);
    if (anchorEl) resizeObserver.observe(anchorEl);
  } else {
    window.addEventListener('resize', resize, { passive: true });
  }

  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onContextLost);
  visibilityObserver.observe(host);

  play();

  /* draw one frame before revealing so the first visible frame is complete */
  requestAnimationFrame(() => {
    if (destroyed) return;
    hero.classList.add('has-gl');
    canvas.classList.add('is-ready');
  });

  return { destroy, pause, play, anchor };
}
