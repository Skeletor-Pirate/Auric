import * as THREE from "three";
import fs from "fs";

const buffer = fs.readFileSync("public/model.glb");
const chunk0Length = buffer.readUInt32LE(12);
const jsonString = buffer.toString("utf8", 20, 20 + chunk0Length);
const gltf = JSON.parse(jsonString);

const nodes: any[] = gltf.nodes;
const bones = new Map<number, THREE.Bone>();
nodes.forEach((n, i) => {
  const b = new THREE.Bone();
  b.name = n.name || `node_${i}`;
  if (n.translation) b.position.fromArray(n.translation);
  if (n.rotation) b.quaternion.fromArray(n.rotation);
  if (n.scale) b.scale.fromArray(n.scale);
  bones.set(i, b);
});
nodes.forEach((n, i) => { if (n.children) for (const c of n.children) { const p = bones.get(i); const ch = bones.get(c); if (p && ch) p.add(ch); } });
const root = bones.get(gltf.scenes[0].nodes[0]) || bones.get(0);
root.position.set(0, -0.56, -0.05);
root.updateMatrixWorld(true);
const get = (name: string) => { for (const b of bones.values()) if (b.name === name) return b; };
const wp = (name: string) => { const b = get(name); if (!b) return [0,0,0]; const v = new THREE.Vector3(); b.getWorldPosition(v); return [v.x, v.y, v.z]; };
get("Hips")!.position.y = 0.732;
const d2r = (d: number) => d * Math.PI / 180;

get("RightShoulder")!.rotation.set(d2r(-35), d2r(-10), d2r(175));

const searchGesture = (label: string, target: number[]) => {
  const candidates: any[] = [];
  const [tx, ty, tz] = target;
  for (let ax = -140; ax <= 30; ax += 5) {
    for (let ay = -50; ay <= 50; ay += 10) {
      for (let fx = -50; fx <= 140; fx += 5) {
        get("RightArm")!.rotation.set(d2r(ax), d2r(ay), 0);
        get("RightForeArm")!.rotation.set(d2r(fx), 0, 0);
        root.updateMatrixWorld(true);
        const h = wp("RightHand");
        const score = Math.abs(h[0] - tx) * 2 + Math.abs(h[1] - ty) * 2 + Math.abs(h[2] - tz) * 1.5;
        candidates.push({ ax, ay, fx, hand: [h[0].toFixed(2), h[1].toFixed(2), h[2].toFixed(2)], score });
      }
    }
  }
  candidates.sort((a, b) => a.score - b.score);
  console.log(`=== ${label} (target ${target.join(",")}) ===`);
  candidates.slice(0, 4).forEach((c) =>
    console.log(`A(${c.ax},${c.ay},0) F(${c.fx},0,0) -> RHand=(${c.hand.join(", ")}) score=${c.score.toFixed(2)}`)
  );
};

searchGesture("TABLE (rest in front)", [-0.13, 0.45, 0.20]);
searchGesture("POINT (forward up)", [-0.2, 0.72, 0.32]);
searchGesture("HAIR (touch face)", [-0.28, 0.82, 0.0]);
searchGesture("FIDGET (low tap)", [-0.22, 0.5, 0.15]);