"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Theme = 'dark' | 'light';

interface DottedSurfaceProps {
  theme: Theme;
}

export default function DottedSurface({ theme }: DottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const separation = 150;
    const amountX = 40;
    const amountY = 60;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const pointColor = theme === 'dark' ? 0.75 : 0.18;

    camera.position.set(0, 355, 1220);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        positions.push(
          ix * separation - (amountX * separation) / 2,
          0,
          iy * separation - (amountY * separation) / 2,
        );
        colors.push(pointColor, pointColor, pointColor);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: theme === 'dark' ? 0.22 : 0.14,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let animationId = 0;
    let count = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const positionAttribute = geometry.attributes.position;
      const positionArray = positionAttribute.array as Float32Array;
      let i = 0;

      for (let ix = 0; ix < amountX; ix++) {
        for (let iy = 0; iy < amountY; iy++) {
          const index = i * 3;
          positionArray[index + 1] =
            Math.sin((ix + count) * 0.3) * 50 +
            Math.sin((iy + count) * 0.5) * 50;
          i++;
        }
      }

      positionAttribute.needsUpdate = true;
      renderer.render(scene, camera);
      count += 0.06;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    />
  );
}
