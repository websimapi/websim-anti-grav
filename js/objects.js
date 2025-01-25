export function setupScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);
  return { scene, camera, renderer };
}

export function createShip() {
  const shipGeometry = new THREE.ConeGeometry(0.3, 1, 32);
  const shipMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  const ship = new THREE.Mesh(shipGeometry, shipMaterial);
  ship.rotation.x = Math.PI / 2;
  ship.position.set(0, 0, -5);
  return ship;
}

export function createTunnel() {
  const tunnelGeometry = new THREE.CylinderGeometry(5, 5, 1000, 32, 32, true);
  const tunnelMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xaaaaaa, 
    side: THREE.BackSide, 
    wireframe: true 
  });
  const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
  tunnel.rotation.x = Math.PI / 2;
  return tunnel;
}