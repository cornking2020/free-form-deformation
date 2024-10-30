export interface FFDOptions {
	minSpanCount: number;
	maxSpanCount: number;
	minSubdLevel: number;
	maxSubdLevel: number;
	initialSpanCounts: [number, number, number];
	initialSubdLevel: number;
}

export interface ModelInfo {
	type: string;
	args: any[];
	scale?: number;
	meshScale?: number;
}