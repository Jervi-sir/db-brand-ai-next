interface IProps {
  color: string;
  className?: string;
}

export function EventBullet({ color, className }: IProps) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    red: "bg-red-600",
    yellow: "bg-yellow-600",
    purple: "bg-purple-600",
    orange: "bg-orange-600",
    gray: "bg-gray-600",
  };
  return (
    <div
      className={`size-2 rounded-full ${colorClasses[color] || "bg-blue-600"} ${
        className || ""
      }`}
    />
  );
}