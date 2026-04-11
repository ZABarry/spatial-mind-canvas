const FOG_COLOR = '#f4f6fa'

export function WhiteVoid() {
  return (
    <>
      <color attach="background" args={[FOG_COLOR]} />
      <fogExp2 attach="fog" args={[FOG_COLOR, 0.012]} />
      <hemisphereLight intensity={0.85} color="#ffffff" groundColor="#e8ecf2" />
      <directionalLight position={[8, 14, 6]} intensity={0.55} color="#fffef8" />
      <directionalLight position={[-6, 4, -10]} intensity={0.22} color="#d4e4f7" />
    </>
  )
}
