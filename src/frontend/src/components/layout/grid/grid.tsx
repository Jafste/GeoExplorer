type GridProps = React.PropsWithChildren<{
  columns?: number;
  gap?: string;
}>;

export const Grid: React.FC<GridProps> = ({ columns = 2, gap = "1rem", children }) => {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap,
    }}>
      {children}
    </div>
  );
};