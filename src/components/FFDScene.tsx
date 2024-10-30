// app/components/FFDScene.tsx
'use client';

import { FFDControls } from '@/components/FFDControls';
import { FFD } from '@/lib/FFD';
import { FC, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

const DEFAULT_OPTIONS = {
	minSpanCount: 1,
	maxSpanCount: 8,
	minSubdLevel: 0,
	maxSubdLevel: 4,
	initialSpanCounts: [2, 2, 2] as [number, number, number],
	initialSubdLevel: 2
};

interface SceneObjects {
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	orbitControls: OrbitControls;
	transformControls: TransformControls;
	mesh?: THREE.Mesh;
}

export const FFDScene: FC = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<SceneObjects | null>(null);
	const requestRef = useRef<number>();

	const [ffd] = useState(() => new FFD());
	const [spanCounts, setSpanCounts] = useState(DEFAULT_OPTIONS.initialSpanCounts);
	const [subdLevel, setSubdLevel] = useState(DEFAULT_OPTIONS.initialSubdLevel);
	const [showEvalPoints, setShowEvalPoints] = useState(false);

	useEffect(() => {
		if (!containerRef.current) return;

		// Scene setup
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xf0f0f0);

		// Camera setup
		const camera = new THREE.PerspectiveCamera(
			70,
			window.innerWidth / window.innerHeight,
			1,
			1000
		);
		camera.position.set(0, 0, 500);

		// Renderer setup
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		containerRef.current.appendChild(renderer.domElement);

		// Orbit Controls setup
		const orbitControls = new OrbitControls(camera, renderer.domElement);
		orbitControls.enableDamping = true;
		orbitControls.dampingFactor = 0.05;

		// Transform Controls setup
		const transformControls = new TransformControls(camera, renderer.domElement);

		// Important: Need to cast TransformControls to THREE.Object3D
		scene.add(transformControls as unknown as THREE.Object3D);

		// Link controls
		transformControls.addEventListener('dragging-changed', (event) => {
			orbitControls.enabled = !event.value;
		});

		// Lights
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const pointLight = new THREE.PointLight(0xffffff, 1);
		pointLight.position.set(100, 100, 100);
		scene.add(pointLight);

		// Add initial mesh
		const geometry = new THREE.BoxGeometry(100, 100, 100);
		const material = new THREE.MeshPhongMaterial({
			color: 0x156289,
			side: THREE.DoubleSide
		});
		const mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);

		// Store scene objects
		sceneRef.current = {
			scene,
			camera,
			renderer,
			orbitControls,
			transformControls,
			mesh
		};

		// Handle window resize
		const handleResize = () => {
			if (!sceneRef.current) return;
			const { camera, renderer } = sceneRef.current;

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);

		// Animation loop
		const animate = () => {
			if (!sceneRef.current) return;
			const { scene, camera, renderer, orbitControls } = sceneRef.current;

			requestRef.current = requestAnimationFrame(animate);
			orbitControls.update();
			renderer.render(scene, camera);
		};

		requestRef.current = requestAnimationFrame(animate);

		// Cleanup
		return () => {
			window.removeEventListener('resize', handleResize);
			if (requestRef.current) {
				cancelAnimationFrame(requestRef.current);
			}

			if (sceneRef.current) {
				const { scene, renderer, orbitControls, transformControls, mesh } = sceneRef.current;

				// Dispose of all scene objects
				if (mesh) {
					scene.remove(mesh);
					mesh.geometry.dispose();
					if (Array.isArray(mesh.material)) {
						mesh.material.forEach(material => material.dispose());
					} else {
						mesh.material.dispose();
					}
				}

				// Remove transform controls
				scene.remove(transformControls as unknown as THREE.Object3D);
				transformControls.dispose();

				// Dispose of controls and renderer
				orbitControls.dispose();
				renderer.dispose();

				if (containerRef.current?.contains(renderer.domElement)) {
					containerRef.current.removeChild(renderer.domElement);
				}
			}
		};
	}, []);

	const handleSpanCountChange = (axis: number, value: number) => {
		const newSpanCounts = [...spanCounts] as [number, number, number];
		newSpanCounts[axis] = value;
		setSpanCounts(newSpanCounts);
	};

	const handleSubdLevelChange = (value: number) => {
		setSubdLevel(value);
	};

	const handleShowEvalPointsChange = (checked: boolean) => {
		setShowEvalPoints(checked);
	};

	return (
		<>
			<div
				ref={containerRef}
				style={{
					width: '100vw',
					height: '100vh',
					position: 'relative'
				}}
			/>
			<FFDControls
				options={DEFAULT_OPTIONS}
				spanCounts={spanCounts}
				subdLevel={subdLevel}
				showEvalPoints={showEvalPoints}
				onSpanCountChange={handleSpanCountChange}
				onSubdLevelChange={handleSubdLevelChange}
				onShowEvalPointsChange={handleShowEvalPointsChange}
			/>
		</>
	);
};