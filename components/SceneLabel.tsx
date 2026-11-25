"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState } from "react";
import { OrthographicCamera, PerspectiveCamera, Vector3, type Group } from "three";

export default function SceneLabel({ position, distanceFactor, className, text, accent }: {
  position: [number, number, number];
  distanceFactor: number;
  className: string;
  text: string;
  accent?: string;
}) {
  const canvas = useThree(state => state.gl.domElement);
  const marker = useRef<Group>(null);
  const element = useRef<HTMLDivElement>(null);
  const [vectors] = useState(() => ({ point: new Vector3(), eye: new Vector3() }));

  // These labels are plain text; mounting separate React roots for them causes cleanup during render.
  useLayoutEffect(() => {
    const label = canvas.ownerDocument.createElement("div");
    label.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;user-select:none;visibility:hidden";
    canvas.parentElement?.appendChild(label);
    element.current = label;
    return () => {
      element.current = null;
      label.remove();
    };
  }, [canvas]);

  useLayoutEffect(() => {
    const label = element.current;
    if (!label) return;
    const content = label.ownerDocument.createElement("span");
    content.className = className;
    content.textContent = text;
    if (accent) {
      const mark = label.ownerDocument.createElement("b");
      mark.textContent = accent;
      content.append(" ", mark);
    }
    label.replaceChildren(content);
  }, [canvas, className, text, accent]);

  useFrame(({ camera, size }) => {
    const label = element.current;
    if (!label || !marker.current) return;
    const { point, eye } = vectors;
    marker.current.getWorldPosition(point);
    camera.getWorldPosition(eye);
    const distance = point.distanceTo(eye);
    point.project(camera);
    if (point.z < -1 || point.z > 1 || !Number.isFinite(point.z)) {
      label.style.visibility = "hidden";
      return;
    }
    const zoom = camera instanceof PerspectiveCamera
      ? camera.zoom / (2 * Math.tan(camera.fov * Math.PI / 360) * distance)
      : camera instanceof OrthographicCamera ? camera.zoom : 1;
    label.style.visibility = "visible";
    label.style.zIndex = String(Math.max(0, Math.round((camera instanceof PerspectiveCamera || camera instanceof OrthographicCamera ? camera.far - distance : 0) * 100)));
    label.style.transform = `translate3d(${(point.x + 1) * size.width / 2}px,${(1 - point.y) * size.height / 2}px,0) translate(-50%,-50%) scale(${zoom * distanceFactor})`;
  });

  return <group ref={marker} position={position} />;
}
