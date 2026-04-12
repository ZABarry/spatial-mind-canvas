/* eslint-disable react-hooks/immutability -- THREE.Line / BufferGeometry updated imperatively each frame (three.js) */
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useXR } from '@react-three/xr'
import { useRootStore } from '../../store/rootStore'
import {
  graphPointToWorld,
  graphUpNormalWorld,
  NO_XR_COMFORT,
  worldPointToGraphLocal,
  XR_STANDING_GRAPH_OFFSET,
} from '../../utils/math'

const _ray = new THREE.Raycaster()
const _hit = new THREE.Vector3()
const _plane = new THREE.Plane()
const _origin = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _planePt = new THREE.Vector3()
const _quat = new THREE.Quaternion()

function createLinkPreviewLine(): THREE.Line {
  const g = new THREE.BufferGeometry()
  const positions = new Float32Array(6)
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const m = new THREE.LineBasicMaterial({
    color: '#5ad4ff',
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  })
  const line = new THREE.Line(g, m)
  line.frustumCulled = false
  line.renderOrder = 500
  line.visible = false
  return line
}

/**
 * Ghost segment while drafting a connection (graph-local space under {@link WorldRoot}).
 */
export function LinkPreview() {
  const { camera, pointer, gl } = useThree()
  const session = useXR((s) => s.session)
  const lineObject = useMemo(() => createLinkPreviewLine(), [])

  useLayoutEffect(() => {
    return () => {
      lineObject.geometry.dispose()
      ;(lineObject.material as THREE.Material).dispose()
    }
  }, [lineObject])

  useFrame(() => {
    const geom = lineObject.geometry
    const posAttr = geom.attributes.position
    if (!posAttr) return

    const { connectionDraft: draft, project } = useRootStore.getState()

    if (!draft || !project) {
      lineObject.visible = false
      return
    }

    const fromNode = project.graph.nodes[draft.fromNodeId]
    if (!fromNode) {
      lineObject.visible = false
      return
    }

    const from = fromNode.position
    const wt = project.worldTransform
    const inXr = !!session && gl.xr.isPresenting
    const comfort = inXr ? XR_STANDING_GRAPH_OFFSET : NO_XR_COMFORT

    const fromW = graphPointToWorld(wt, from, comfort)
    _planePt.set(fromW[0], fromW[1], fromW[2])
    const normalW = graphUpNormalWorld(wt)
    _plane.setFromNormalAndCoplanarPoint(normalW, _planePt)

    if (inXr) {
      const idx = draft.xrControllerIndex ?? 0
      const ctrl = gl.xr.getController(idx)
      ctrl.updateMatrixWorld()
      _origin.setFromMatrixPosition(ctrl.matrixWorld)
      ctrl.getWorldQuaternion(_quat)
      _dir.set(0, 0, -1).applyQuaternion(_quat).normalize()
      _ray.set(_origin, _dir)
    } else {
      _ray.setFromCamera(pointer, camera)
    }
    _ray.near = 0.05
    _ray.far = 500

    const arr = posAttr.array as Float32Array
    arr[0] = from[0]
    arr[1] = from[1]
    arr[2] = from[2]

    if (_ray.ray.intersectPlane(_plane, _hit)) {
      const end = worldPointToGraphLocal(wt, [_hit.x, _hit.y, _hit.z], comfort)
      arr[3] = end[0]
      arr[4] = end[1]
      arr[5] = end[2]
    } else {
      arr[3] = from[0]
      arr[4] = from[1]
      arr[5] = from[2]
    }

    geom.attributes.position.needsUpdate = true
    lineObject.visible = true
  })

  return <primitive object={lineObject} />
}
