import * as THREE from 'three'
import type { StructureToolName } from '../../input/actions'
import { runXrGlobalMenuCommand, type XrGlobalMenuCommand } from './xrGlobalMenuActions'
import { runNodeStructureTool, runRecallBookmark } from './xrNodeMenuActions'

/** Attached to menu hit meshes; walked upward like `nodeId`. */
export type XrMenuHit =
  | { kind: 'cmd'; cmd: XrGlobalMenuCommand }
  | { kind: 'structure'; tool: StructureToolName }
  | { kind: 'recallBookmark'; id: string }

export function runXrMenuHit(hit: XrMenuHit) {
  switch (hit.kind) {
    case 'cmd':
      runXrGlobalMenuCommand(hit.cmd)
      break
    case 'structure':
      runNodeStructureTool(hit.tool)
      break
    case 'recallBookmark':
      runRecallBookmark(hit.id)
      break
  }
}

/** Returns true if a menu hit was handled (stop raycast propagation). */
export function tryHandleXrMenuObject(object: THREE.Object3D): boolean {
  let o: THREE.Object3D | null = object
  while (o) {
    const hit = o.userData?.xrMenuHit as XrMenuHit | undefined
    if (hit) {
      runXrMenuHit(hit)
      return true
    }
    o = o.parent
  }
  return false
}
