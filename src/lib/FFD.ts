import { Vector3, Box3 } from 'three';

export class FFD {
	private mBBox: Box3;
	private mSpanCounts: [number, number, number];
	private mCtrlPtCounts: [number, number, number];
	private mTotalCtrlPtCount: number;
	private mAxes: [Vector3, Vector3, Vector3];
	private mCtrlPts: Vector3[];

	constructor() {
		this.mBBox = new Box3();
		this.mSpanCounts = [0, 0, 0];
		this.mCtrlPtCounts = [0, 0, 0];
		this.mTotalCtrlPtCount = 0;
		this.mAxes = [new Vector3(), new Vector3(), new Vector3()];
		this.mCtrlPts = [];
	}

	getBoundingBox(): Box3 {
		return this.mBBox;
	}

	getCtrlPtCount(direction: number): number {
		return this.mCtrlPtCounts[direction];
	}

	getTotalCtrlPtCount(): number {
		return this.mTotalCtrlPtCount;
	}

	getIndex(i: number, j: number, k: number): number {
		return i * this.mCtrlPtCounts[1] * this.mCtrlPtCounts[2] +
			j * this.mCtrlPtCounts[2] + k;
	}

	private facto(n: number): number {
		let fac = 1;
		for (let i = n; i > 0; i--)
			fac *= i;
		return fac;
	}

	private bernstein(n: number, k: number, u: number): number {
		const coeff = this.facto(n) / (this.facto(k) * this.facto(n - k));
		return coeff * Math.pow(1 - u, n - k) * Math.pow(u, k);
	}

	rebuildLattice(bbox: Box3, spanCounts: [number, number, number]): void {
		if (this.mBBox.equals(bbox) &&
			this.mSpanCounts[0] === spanCounts[0] &&
			this.mSpanCounts[1] === spanCounts[1] &&
			this.mSpanCounts[2] === spanCounts[2]) {
			return;
		}

		this.mBBox = bbox;
		this.mSpanCounts = spanCounts;
		this.mCtrlPtCounts = [
			this.mSpanCounts[0] + 1,
			this.mSpanCounts[1] + 1,
			this.mSpanCounts[2] + 1
		];
		this.mTotalCtrlPtCount = this.mCtrlPtCounts[0] *
			this.mCtrlPtCounts[1] *
			this.mCtrlPtCounts[2];

		this.mAxes[0].x = this.mBBox.max.x - this.mBBox.min.x;
		this.mAxes[1].y = this.mBBox.max.y - this.mBBox.min.y;
		this.mAxes[2].z = this.mBBox.max.z - this.mBBox.min.z;

		this.mCtrlPts = new Array(this.mTotalCtrlPtCount);

		for (let i = 0; i < this.mCtrlPtCounts[0]; i++) {
			for (let j = 0; j < this.mCtrlPtCounts[1]; j++) {
				for (let k = 0; k < this.mCtrlPtCounts[2]; k++) {
					const position = new Vector3(
						this.mBBox.min.x + (i / this.mSpanCounts[0]) * this.mAxes[0].x,
						this.mBBox.min.y + (j / this.mSpanCounts[1]) * this.mAxes[1].y,
						this.mBBox.min.z + (k / this.mSpanCounts[2]) * this.mAxes[2].z
					);
					this.setPositionTernary(i, j, k, position);
				}
			}
		}
	}

	evalTrivariate(s: number, t: number, u: number): Vector3 {
		const evalPt = new Vector3();

		for (let i = 0; i < this.mCtrlPtCounts[0]; i++) {
			const point1 = new Vector3();
			for (let j = 0; j < this.mCtrlPtCounts[1]; j++) {
				const point2 = new Vector3();
				for (let k = 0; k < this.mCtrlPtCounts[2]; k++) {
					const position = this.getPositionTernary(i, j, k);
					const polyU = this.bernstein(this.mSpanCounts[2], k, u);
					point2.addScaledVector(position, polyU);
				}
				const polyT = this.bernstein(this.mSpanCounts[1], j, t);
				point1.addScaledVector(point2, polyT);
			}
			const polyS = this.bernstein(this.mSpanCounts[0], i, s);
			evalPt.addScaledVector(point1, polyS);
		}

		return evalPt;
	}

	convertToParam(worldPt: Vector3): Vector3 {
		const min2world = new Vector3().copy(worldPt).sub(this.mBBox.min);
		const cross = [
			new Vector3().crossVectors(this.mAxes[1], this.mAxes[2]),
			new Vector3().crossVectors(this.mAxes[0], this.mAxes[2]),
			new Vector3().crossVectors(this.mAxes[0], this.mAxes[1])
		];

		const param = new Vector3();
		for (let i = 0; i < 3; i++) {
			const numer = cross[i].dot(min2world);
			const denom = cross[i].dot(this.mAxes[i]);
			param.setComponent(i, numer / denom);
		}

		return param;
	}

	getPosition(index: number): Vector3 {
		return this.mCtrlPts[index];
	}

	setPosition(index: number, position: Vector3): void {
		this.mCtrlPts[index] = position;
	}

	getPositionTernary(i: number, j: number, k: number): Vector3 {
		return this.mCtrlPts[this.getIndex(i, j, k)];
	}

	setPositionTernary(i: number, j: number, k: number, position: Vector3): void {
		this.mCtrlPts[this.getIndex(i, j, k)] = position;
	}

	evalWorld(worldPt: Vector3): Vector3 {
		const param = this.convertToParam(worldPt);
		return this.evalTrivariate(param.x, param.y, param.z);
	}
}