import { useEffect } from 'react'

/**
 * Hand-tracking intents (pinch, palm) → session machine. Controllers stay primary for authoring;
 * this hook is reserved for stable select / menu / confirm flows.
 */
export function useXrHandInputBridge() {
  useEffect(() => {
    return undefined
  }, [])
}

export function XrHandInputStub() {
  useXrHandInputBridge()
  return null
}
