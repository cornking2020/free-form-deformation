"use client";
import LatticeDeformerComponent from '@/components/LatticeDeformerComponent';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          my: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <LatticeDeformerComponent
          modelUrl="/model.glb"
          resolution={{ x: 3, y: 3, z: 3 }}
          width={800}
          height={600}
        />
      </Box>
    </Container>
  );
}
