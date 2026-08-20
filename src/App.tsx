import { ReactFlowProvider } from "@xyflow/react";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { DiagramCanvas } from "./components/Canvas/DiagramCanvas";
import { ToastStack } from "./components/common/ToastStack";

function App() {
  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden">
        <Toolbar />
        <div className="relative flex-1">
          <DiagramCanvas />
          <ToastStack />
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
