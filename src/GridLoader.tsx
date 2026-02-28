// src/GridLoader.tsx
export default function GridLoader({ color = "#fef08a" }: { color?: string }) {
  return (
    <div 
      className="w-10 h-10 border-4 border-transparent rounded-full animate-spin"
      style={{ borderTopColor: color, borderLeftColor: color }}
    />
  );
}