import { s2 } from 's2js'

/**
 * Spherical Linear Interpolation (SLERP) between two unit vectors.
 * Returns a [longitude, latitude] pair in degrees at parameter t [0, 1].
 */
export function slerp(a: s2.Point, b: s2.Point, t: number): [number, number] {
  const theta = a.distance(b)
  if (theta < 1e-9) {
    const ll = s2.LatLng.fromPoint(a)
    return [(ll.lng * 180) / Math.PI, (ll.lat * 180) / Math.PI]
  }

  const sinTheta = Math.sin(theta)
  const weightA = Math.sin((1 - t) * theta) / sinTheta
  const weightB = Math.sin(t * theta) / sinTheta

  const x = a.x * weightA + b.x * weightB
  const y = a.y * weightA + b.y * weightB
  const z = a.z * weightA + b.z * weightB

  const resPt = s2.Point.fromCoords(x, y, z)
  const ll = s2.LatLng.fromPoint(resPt)

  return [(ll.lng * 180) / Math.PI, (ll.lat * 180) / Math.PI]
}
