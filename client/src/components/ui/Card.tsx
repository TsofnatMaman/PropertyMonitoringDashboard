import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function Card({ title, subtitle, action, children }: CardProps) {
  return (
    <section className="ui-card">
      {(title || subtitle || action) && (
        <div className="ui-card__header">
          <div>
            {title ? <h3 className="ui-card__title">{title}</h3> : null}
            {subtitle ? <p className="ui-card__subtitle">{subtitle}</p> : null}
          </div>

          {action ? <div>{action}</div> : null}
        </div>
      )}

      <div className="ui-card__content">{children}</div>
    </section>
  );
}