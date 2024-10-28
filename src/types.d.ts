// 类型定义
interface LatticeDeformerProps {
	modelUrl: string;
	resolution?: {
		x: number;
		y: number;
		z: number;
	};
	width?: number;
	height?: number;
}

interface Resolution {
	x: number;
	y: number;
	z: number;
}