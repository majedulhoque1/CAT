// Minimal 3D → 2D projection for the hero "profile solid".
//
// Why not three.js: the form is lines and points — no lighting, no textures,
// no shaders. A WebGL runtime costs ~150kb gzipped to draw what 60 lines of
// trigonometry and an <svg> draw more crisply (vector strokes stay 1px at any
// DPI) and with no GL context to lose. Keep this file free of React and of the
// DOM so it stays unit-testable.

// The solid is a bipyramid over an irregular ring: one vertex per assessment
// axis, its distance from centre set by PROFILE below. The equatorial
// silhouette therefore *is* a radar chart of a profile — rotating it changes
// which axes read as dominant, which is the argument the hero is making.

/** Axis labels, in ring order: Big Five (5) then RIASEC (6). */
export const AXES = [
  'Openness',
  'Conscientiousness',
  'Extraversion',
  'Agreeableness',
  'Stability',
  'Realistic',
  'Investigative',
  'Artistic',
  'Social',
  'Enterprising',
  'Conventional',
]

// A fixed, deliberately uneven profile (0.5–1.0 of max radius). Hand-tuned
// rather than random so the silhouette is asymmetric at every angle — a
// regular polygon reads as a logo, an irregular one reads as data.
const PROFILE = [0.94, 0.68, 0.86, 0.55, 0.78, 0.62, 1.0, 0.83, 0.71, 0.9, 0.6]

/**
 * Build the solid's vertices and edges in model space (unit radius).
 * @param {number} axisCount how many ring axes to use (fewer on small screens)
 */
export function makeSolid(axisCount = AXES.length) {
  const n = Math.max(3, Math.min(axisCount, AXES.length))
  const ring = []

  for (let i = 0; i < n; i += 1) {
    // Sample the profile across its full length even when n is reduced, so the
    // mobile form keeps the same character instead of being the first n axes.
    const t = (i / n) * PROFILE.length
    const r = PROFILE[Math.floor(t) % PROFILE.length]
    const angle = (i / n) * Math.PI * 2
    ring.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      z: 0,
      label: AXES[Math.floor(t) % AXES.length],
    })
  }

  const apexTop = { x: 0, y: 0, z: 1.15, label: null }
  const apexBottom = { x: 0, y: 0, z: -1.15, label: null }
  const vertices = [...ring, apexTop, apexBottom]
  const topIndex = n
  const bottomIndex = n + 1

  const edges = []
  for (let i = 0; i < n; i += 1) {
    const next = (i + 1) % n
    edges.push({ a: i, b: next, kind: 'ring' })
    edges.push({ a: i, b: topIndex, kind: 'spoke' })
    edges.push({ a: i, b: bottomIndex, kind: 'spoke' })
  }

  return { vertices, edges, ringCount: n }
}

/**
 * Rotate a model-space point around Y then X, then apply a perspective divide.
 * Returns screen coords in the same unit space plus the depth scale, so callers
 * can size vertices by proximity.
 */
export function projectPoint(v, rotX, rotY, distance = 3.2) {
  const cosY = Math.cos(rotY)
  const sinY = Math.sin(rotY)
  const cosX = Math.cos(rotX)
  const sinX = Math.sin(rotX)

  // rotate around Y
  const x1 = v.x * cosY + v.z * sinY
  const z1 = -v.x * sinY + v.z * cosY
  // rotate around X
  const y2 = v.y * cosX - z1 * sinX
  const z2 = v.y * sinX + z1 * cosX

  // perspective divide; clamp the denominator so a vertex passing near the
  // camera plane can never produce Infinity and blow up the path data.
  const scale = distance / Math.max(distance - z2, 0.35)

  return { x: x1 * scale, y: y2 * scale, z: z2, scale }
}

/**
 * Project the whole solid into SVG pixel coordinates.
 *
 * @returns {{points: Array, edges: Array, frontIndex: number}}
 *   `frontIndex` is the ring vertex nearest the viewer — the hero paints that
 *   one, and only that one, in --signal and shows its axis label.
 */
export function projectSolid(solid, rotX, rotY, opts = {}) {
  const { size = 600, radius = 190, distance = 3.2 } = opts
  const centre = size / 2

  const points = solid.vertices.map((v) => {
    const p = projectPoint(v, rotX, rotY, distance)
    return {
      x: centre + p.x * radius,
      y: centre + p.y * radius,
      z: p.z,
      scale: p.scale,
      label: v.label,
    }
  })

  let frontIndex = 0
  for (let i = 1; i < solid.ringCount; i += 1) {
    if (points[i].z > points[frontIndex].z) frontIndex = i
  }

  return { points, edges: solid.edges, frontIndex }
}
