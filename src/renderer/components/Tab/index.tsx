import styles from './styles.module.sass'

export function Tab({ id, label, isSelected, onTabSelect, ariaLabel = '' }) {
  return (
    <button
      style={styles}
      role="tab"
      onClick={(e) => onTabSelect(e)}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      aria-label={ariaLabel ?? ''}
      id={id}
    >
      {label}
    </button>
  )
}
