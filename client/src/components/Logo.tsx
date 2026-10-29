export default function Logo({ size = 40, light = false }: { size?: number; light?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl font-bold ${light ? "bg-white text-brand" : "bg-brand text-white"}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      RS
    </div>
  );
}