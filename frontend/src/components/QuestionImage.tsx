import { type Item } from '../types'

// The question's picture, or a placeholder for items that don't have one yet.
export function QuestionImage({ item, className }: { item: Item; className?: string }) {
  const classes = className ? `question-image ${className}` : 'question-image'
  return item.imageUrl ? (
    <img className={classes} src={item.imageUrl} alt={item.name} />
  ) : (
    <div className={`${classes} placeholder`} aria-hidden="true">
      No picture yet
    </div>
  )
}
