import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './InteractiveLaptop.css';

function createScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 450;
  const context = canvas.getContext('2d');
  const background = context.createLinearGradient(0, 0, 768, 450);
  background.addColorStop(0, '#f8fbf9');
  background.addColorStop(1, '#e4f2ed');
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const logo = new Image();
  logo.onload = () => {
    const scale = Math.min(canvas.width * 0.78 / logo.width, canvas.height * 0.78 / logo.height);
    const width = logo.width * scale;
    const height = logo.height * scale;
    context.drawImage(logo, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    texture.needsUpdate = true;
  };
  logo.src = '/SyncSpace%20Logo.png';
  return texture;
}

export function InteractiveLaptop() {
  const mountRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const openRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    } catch {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 50);
    camera.position.set(0, 3.15, 6.8);
    camera.lookAt(0, 0.82, 0);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf7fffb, 0x82928c, 2.3));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-3, 6, 5);
    scene.add(keyLight);
    const edgeLight = new THREE.DirectionalLight(0x9ad9ce, 1.7);
    edgeLight.position.set(4, 3, -3);
    scene.add(edgeLight);

    const laptop = new THREE.Group();
    laptop.position.y = -0.18;
    scene.add(laptop);

    const shellMaterial = new THREE.MeshStandardMaterial({ color: '#c8d4cf', metalness: 0.68, roughness: 0.28 });
    const deckMaterial = new THREE.MeshStandardMaterial({ color: '#e4ebe8', metalness: 0.42, roughness: 0.38 });
    const darkMaterial = new THREE.MeshStandardMaterial({ color: '#344547', metalness: 0.36, roughness: 0.42 });
    const keyMaterial = new THREE.MeshStandardMaterial({ color: '#637678', metalness: 0.22, roughness: 0.55 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.13, 2.12), shellMaterial);
    base.position.y = 0;
    laptop.add(base);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.08, 0.018, 2.0), deckMaterial);
    deck.position.set(0, 0.075, 0);
    laptop.add(deck);

    const keyGeometry = new THREE.BoxGeometry(0.15, 0.018, 0.11);
    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column < 13; column += 1) {
        const key = new THREE.Mesh(keyGeometry, keyMaterial);
        key.position.set(-1.18 + column * 0.197, 0.092, -0.68 + row * 0.15);
        laptop.add(key);
      }
    }

    const trackpad = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.012, 0.44), shellMaterial);
    trackpad.position.set(0, 0.093, 0.69);
    laptop.add(trackpad);

    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.82, 20), darkMaterial);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, 0.08, -1.01);
    laptop.add(hinge);

    const lid = new THREE.Group();
    lid.position.set(0, 0.08, -1.01);
    lid.rotation.x = Math.PI / 2;
    laptop.add(lid);

    const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(3.08, 1.98, 0.09), darkMaterial);
    screenFrame.position.y = 0.99;
    lid.add(screenFrame);

    const screenMaterial = new THREE.MeshBasicMaterial({ map: createScreenTexture() });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 1.76), screenMaterial);
    screen.position.set(0, 0.99, 0.047);
    lid.add(screen);

    const cameraDot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), shellMaterial);
    cameraDot.position.set(0, 1.9, 0.048);
    lid.add(cameraDot);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(2.15, 48),
      new THREE.MeshBasicMaterial({ color: '#47736b', transparent: true, opacity: 0.12 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -0.2, 0.05);
    laptop.add(shadow);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    window.addEventListener('resize', resize);
    resize();
    setReady(true);

    let previousTime = 0;
    renderer.setAnimationLoop((time) => {
      const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
      previousTime = time;
      const targetAngle = openRef.current ? 0.18 : Math.PI / 2;
      lid.rotation.x = THREE.MathUtils.damp(lid.rotation.x, targetAngle, 5.5, delta);
      laptop.rotation.y = THREE.MathUtils.damp(laptop.rotation.y, -0.16 + pointerRef.current.x * 0.24, 4, delta);
      laptop.rotation.x = THREE.MathUtils.damp(laptop.rotation.x, pointerRef.current.y * -0.055, 4, delta);
      renderer.render(scene, camera);
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      renderer.setAnimationLoop(null);
      scene.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          material.map?.dispose();
          material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const setLaptopOpen = (open) => {
    openRef.current = open;
    setIsOpen(open);
  };

  const trackPointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
    };
  };

  return (
    <button
      ref={mountRef}
      type="button"
      className={`interactive-laptop ${ready ? 'is-ready' : ''} ${isOpen ? 'is-open' : ''}`}
      aria-label={isOpen ? 'Close the SyncSpace laptop' : 'Open the SyncSpace laptop'}
      aria-pressed={isOpen}
      title="Move over the laptop to open it"
      onPointerEnter={() => setLaptopOpen(true)}
      onPointerMove={trackPointer}
      onPointerLeave={() => { setLaptopOpen(false); pointerRef.current = { x: 0, y: 0 }; }}
      onFocus={() => setLaptopOpen(true)}
      onBlur={() => setLaptopOpen(false)}
      onClick={() => setLaptopOpen(!openRef.current)}
    >
      {!ready && <img src="/SyncSpace%20Logo.png" alt="" className="interactive-laptop-fallback" />}
      <span className="interactive-laptop-hint">{isOpen ? 'READY TO WORK' : 'MOVE TO OPEN'}</span>
    </button>
  );
}