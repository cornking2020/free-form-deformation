import { FFDOptions } from '@/types';
import {
	Box,
	FormControlLabel,
	Slider,
	Switch,
	Typography
} from '@mui/material';
import { FC } from 'react';

interface FFDControlsProps {
	options: FFDOptions;
	spanCounts: [number, number, number];
	subdLevel: number;
	showEvalPoints: boolean;
	onSpanCountChange: (axis: number, value: number) => void;
	onSubdLevelChange: (value: number) => void;
	onShowEvalPointsChange: (checked: boolean) => void;
}

export const FFDControls: FC<FFDControlsProps> = ({
	options,
	spanCounts,
	subdLevel,
	showEvalPoints,
	onSpanCountChange,
	onSubdLevelChange,
	onShowEvalPointsChange
}) => {
	return (
		<Box sx={{ position: 'absolute', top: 20, left: 20, width: 300, p: 2, bgcolor: 'background.paper' }}>
			<Typography variant="h6" gutterBottom>
				FFD Controls
			</Typography>

			<Typography gutterBottom>X Span Count</Typography>
			<Slider
				value={spanCounts[0]}
				min={options.minSpanCount}
				max={options.maxSpanCount}
				onChange={(_, value) => onSpanCountChange(0, value as number)}
				marks
				valueLabelDisplay="auto"
			/>

			<Typography gutterBottom>Y Span Count</Typography>
			<Slider
				value={spanCounts[1]}
				min={options.minSpanCount}
				max={options.maxSpanCount}
				onChange={(_, value) => onSpanCountChange(1, value as number)}
				marks
				valueLabelDisplay="auto"
			/>

			<Typography gutterBottom>Z Span Count</Typography>
			<Slider
				value={spanCounts[2]}
				min={options.minSpanCount}
				max={options.maxSpanCount}
				onChange={(_, value) => onSpanCountChange(2, value as number)}
				marks
				valueLabelDisplay="auto"
			/>

			<Typography gutterBottom>Subdivision Level</Typography>
			<Slider
				value={subdLevel}
				min={options.minSubdLevel}
				max={options.maxSubdLevel}
				onChange={(_, value) => onSubdLevelChange(value as number)}
				marks
				valueLabelDisplay="auto"
			/>

			<FormControlLabel
				control={
					<Switch
						checked={showEvalPoints}
						onChange={(e) => onShowEvalPointsChange(e.target.checked)}
					/>
				}
				label="Show Evaluation Points"
			/>
		</Box>
	);
};