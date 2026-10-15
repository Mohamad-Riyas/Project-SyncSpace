import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

function YjsTest() {
  const [status, setStatus] = useState("connecting");
  const [text, setText] = useState("");
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new SocketIOProvider("http://localhost:5001", "yjs-test-room", ydoc, {
      autoConnect: true,
    });
    const ytext = ydoc.getText("shared-text");

    ydocRef.current = ydoc;
    ytextRef.current = ytext;

    provider.on("status", ({ status }) => setStatus(status));

    ytext.observe(() => {
      setText(ytext.toString());
    });

    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  }, []);

  const handleChange = (e) => {
    const newValue = e.target.value;
    const ytext = ytextRef.current;
    ytext.delete(0, ytext.length);
    ytext.insert(0, newValue);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", color: "#fff", background: "#111", minHeight: "100vh" }}>
      <h1>Yjs CRDT Test</h1>
      <p>Status: <strong>{status}</strong></p>
      <textarea
        value={text}
        onChange={handleChange}
        rows={10}
        style={{ width: "100%", maxWidth: "500px", padding: "1rem", fontFamily: "monospace" }}
        placeholder="Type here - open a second tab and type there too"
      />
    </div>
  );
}

export default YjsTest;