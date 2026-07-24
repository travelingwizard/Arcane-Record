import { SheetSection } from '../layout/SheetSection';

const deferred = [
  {
    title: 'Magic',
    detail: 'Focus, Wonders, and Rotes',
  },
];

export function DeferredSections() {
  return (
    <SheetSection
      id="later-sections"
      eyebrow="Inscribed for later"
      title="Coming in a future milestone"
      description="These sections show the intended shape of the complete sheet; they are not editable yet."
      className="deferred-section"
    >
      <div className="deferred-grid">
        {deferred.map((item) => (
          <article className="deferred-card" key={item.title}>
            <span className="deferred-card__status">Planned</span>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </SheetSection>
  );
}
