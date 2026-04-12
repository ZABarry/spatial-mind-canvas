import { useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const _billboardParentQ = new THREE.Quaternion()
const _billboardParentInv = new THREE.Quaternion()

/**
 * Drei's Billboard uses `camera.getWorldQuaternion()`, which in WebXR is wrong for an
 * {@link THREE.ArrayCamera} — labels end up edge-on and appear to spin. Face the first eye camera instead.
 */
export function LabelBillboard({ children }: { children: ReactNode }) {
  const outerRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Group>(null)
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)

  useFrame(() => {
    if (!outerRef.current || !innerRef.current) return
    let faceCam: THREE.Camera = camera
    if (gl.xr.isPresenting) {
      const xrCam = gl.xr.getCamera()
      const eyes = (xrCam as THREE.ArrayCamera).cameras
      if (eyes?.[0]) faceCam = eyes[0]
    }
    outerRef.current.updateWorldMatrix(false, false)
    outerRef.current.getWorldQuaternion(_billboardParentQ)
    _billboardParentInv.copy(_billboardParentQ).invert()
    faceCam.getWorldQuaternion(innerRef.current.quaternion).premultiply(_billboardParentInv)
  })

  return (
    <group ref={outerRef}>
      <group ref={innerRef}>{children}</group>
    </group>
  )
}
