import { type Item } from '../types'

// The question's picture, or a placeholder for items that don't have one yet.
export function QuestionImage({ item, className }: { item: Item; className?: string }) {
  const classes = className ? `question-image ${className}` : 'question-image'
  if (item.imageUrl) {
    return item.imageUrl && item.imageAuthor && item.imageLicence ? (
      <figure className={'question-figure'}>
        <img className={classes} src={item.imageUrl} alt={item.name} />
        <figcaption className="image-credit">
          Photo: {item.imageAuthor} · {item.imageLicence}
          {item?.imageSourceUrl?.includes('wikimedia') ? ' · Wikimedia Commons' : ''}
        </figcaption>
      </figure>
    ) : (
      <img className={classes} src={item.imageUrl} alt={item.name} />
    )
  }
  return (
    <div className={`${classes} placeholder`} aria-hidden="true">
      No picture yet
    </div>
  )
}
