import styles from './styles.module.sass'

export function Tab({ id, label, isSelected, onTabSelect, ariaLabel = '', title = '' }) {
  // TODO remove 'hidden' attribute, it's just part of the alpha workaround
  return (
    <button
      style={styles}
      role="tab"
      onClick={(e) => onTabSelect(e)}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      aria-label={ariaLabel ?? ''}
      title={title ?? ''}
      id={id}
      hidden 
    >
      {label}
    </button>
  )
}
