export type BadgeTone = "open" | "attention" | "urgent" | "new-activity";

type BadgeProps = {
  text: string;
  tone: BadgeTone;
};

export default function Badge({ text, tone }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{text}</span>;
}
