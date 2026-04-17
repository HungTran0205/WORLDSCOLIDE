import { ArenaViewport } from './scene/arena-viewport'

export function App() {
  return (
    <div className="layout">
      <div className="left-col">
        <p style={{ color: '#888', padding: 16 }}>Asset Browser — Phase 3</p>
      </div>
      <div className="canvas-area">
        <ArenaViewport />
      </div>
      <div className="right-col">
        <p style={{ color: '#888', padding: 16 }}>Properties — Phase 4</p>
      </div>
    </div>
  )
}
