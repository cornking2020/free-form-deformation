import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class LatticeDeformer {
	resolution: Resolution;
	controlPoints: THREE.Vector3[];
	originalControlPoints: THREE.Vector3[];
	helper: THREE.Points;

	constructor(resolution: Resolution = { x: 2, y: 2, z: 2 }) {
		this.resolution = resolution;
		this.controlPoints = [];
		this.originalControlPoints = [];

		// 初始化控制点
		for (let x = 0; x < resolution.x; x++) {
			for (let y = 0; y < resolution.y; y++) {
				for (let z = 0; z < resolution.z; z++) {
					const position = new THREE.Vector3(
						x / (resolution.x - 1) - 0.5,
						y / (resolution.y - 1) - 0.5,
						z / (resolution.z - 1) - 0.5
					);
					this.controlPoints.push(position.clone());
					this.originalControlPoints.push(position.clone());
				}
			}
		}

		this.helper = this.createHelper();
	}

	createHelper(): THREE.Points {
		const geometry = new THREE.BufferGeometry();
		const positions: number[] = [];

		this.controlPoints.forEach(point => {
			positions.push(point.x, point.y, point.z);
		});

		geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		const material = new THREE.PointsMaterial({ size: 0.05, color: 0xff0000 });
		return new THREE.Points(geometry, material);
	}

	updateControlPoint(index: number, newPosition: THREE.Vector3): void {
		this.controlPoints[index].copy(newPosition);

		const positions = this.helper.geometry.attributes.position.array;
		positions[index * 3] = newPosition.x;
		positions[index * 3 + 1] = newPosition.y;
		positions[index * 3 + 2] = newPosition.z;
		this.helper.geometry.attributes.position.needsUpdate = true;
	}

	deform(mesh: THREE.Mesh): void {
		const geometry = mesh.geometry;
		const positions = geometry.attributes.position;
		const originalPositions = geometry.userData.originalPositions || positions.array.slice();

		if (!geometry.userData.originalPositions) {
			geometry.userData.originalPositions = originalPositions;
		}

		for (let i = 0; i < positions.count; i++) {
			const vertex = new THREE.Vector3(
				originalPositions[i * 3],
				originalPositions[i * 3 + 1],
				originalPositions[i * 3 + 2]
			);

			const localPos = vertex.clone().addScalar(0.5);
			const deformedPosition = this.interpolatePosition(localPos);

			positions.array[i * 3] = deformedPosition.x;
			positions.array[i * 3 + 1] = deformedPosition.y;
			positions.array[i * 3 + 2] = deformedPosition.z;
		}

		positions.needsUpdate = true;
		geometry.computeVertexNormals();
	}

	private interpolatePosition(position: THREE.Vector3): THREE.Vector3 {
		const res = this.resolution;
		const gridX = Math.floor(position.x * (res.x - 1));
		const gridY = Math.floor(position.y * (res.y - 1));
		const gridZ = Math.floor(position.z * (res.z - 1));

		const factorX = position.x * (res.x - 1) - gridX;
		const factorY = position.y * (res.y - 1) - gridY;
		const factorZ = position.z * (res.z - 1) - gridZ;

		const deformed = new THREE.Vector3();

		for (let x = 0; x <= 1; x++) {
			for (let y = 0; y <= 1; y++) {
				for (let z = 0; z <= 1; z++) {
					const ix = Math.min(gridX + x, res.x - 1);
					const iy = Math.min(gridY + y, res.y - 1);
					const iz = Math.min(gridZ + z, res.z - 1);

					const weight =
						(x ? factorX : (1 - factorX)) *
						(y ? factorY : (1 - factorY)) *
						(z ? factorZ : (1 - factorZ));

					const controlPoint = this.controlPoints[ix + iy * res.x + iz * res.x * res.y];
					deformed.add(controlPoint.clone().multiplyScalar(weight));
				}
			}
		}

		return deformed;
	}

	reset(): void {
		this.controlPoints.forEach((point, index) => {
			point.copy(this.originalControlPoints[index]);
		});

		const positions = this.helper.geometry.attributes.position.array;
		this.originalControlPoints.forEach((point, index) => {
			positions[index * 3] = point.x;
			positions[index * 3 + 1] = point.y;
			positions[index * 3 + 2] = point.z;
		});
		this.helper.geometry.attributes.position.needsUpdate = true;
	}
}

const LatticeDeformerComponent: React.FC<LatticeDeformerProps> = ({
	modelUrl,
	resolution = { x: 2, y: 2, z: 2 },
	width = 800,
	height = 600
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const modelRef = useRef<THREE.Mesh | null>(null);
	const latticeRef = useRef<LatticeDeformer | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		// 初始化场景
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ antialias: true });

		renderer.setSize(width, height);
		containerRef.current.appendChild(renderer.domElement);

		camera.position.z = 5;

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;

		// 添加环境光和方向光
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
		directionalLight.position.set(0, 1, 2);
		scene.add(ambientLight, directionalLight);

		// 创建 Lattice 变形器
		const lattice = new LatticeDeformer(resolution);
		scene.add(lattice.helper);

		// 加载 GLB 模型
		const loader = new GLTFLoader();
		loader.load(
			modelUrl,
			(gltf) => {
				const model = gltf.scene.children[0] as THREE.Mesh;
				model.position.set(0, 0, 0);

				// 确保模型在场景中心且大小合适
				const box = new THREE.Box3().setFromObject(model);
				const size = box.getSize(new THREE.Vector3());
				const maxSize = Math.max(size.x, size.y, size.z);
				const scale = 2 / maxSize;
				model.scale.multiplyScalar(scale);

				scene.add(model);
				modelRef.current = model;
				setIsLoading(false);
			},
			undefined,
			(error) => {
				console.error('Error loading model:', error);
				setError('Failed to load 3D model');
				setIsLoading(false);
			}
		);

		// 存储引用
		sceneRef.current = scene;
		cameraRef.current = camera;
		rendererRef.current = renderer;
		controlsRef.current = controls;
		latticeRef.current = lattice;

		// 动画循环
		const animate = () => {
			requestAnimationFrame(animate);

			if (controlsRef.current) {
				controlsRef.current.update();
			}

			if (modelRef.current && latticeRef.current) {
				latticeRef.current.deform(modelRef.current);
			}

			renderer.render(scene, camera);
		};

		animate();

		// 清理函数
		return () => {
			if (containerRef.current) {
				containerRef.current.removeChild(renderer.domElement);
			}
			renderer.dispose();
		};
	}, [modelUrl, resolution, width, height]);

	// 示例：添加控制点拖动功能
	const handleControlPointDrag = (index: number, newPosition: THREE.Vector3) => {
		if (latticeRef.current) {
			latticeRef.current.updateControlPoint(index, newPosition);
		}
	};

	// 重置变形
	const handleReset = () => {
		if (latticeRef.current) {
			latticeRef.current.reset();
		}
	};

	if (error) {
		return <div>Error: {error}</div>;
	}

	return (
		<div>
			<div ref={containerRef} />
			{isLoading && <div>Loading model...</div>}
			<button onClick={handleReset}>Reset Deformation</button>
		</div>
	);
};

export default LatticeDeformerComponent;